import { NextResponse } from 'next/server';
import { requireOwnedProject } from '@/modules/app-builder/services/project.repository';
import { getProjectSandbox } from '@/modules/app-builder/services/sandbox.service';
import { openai } from '@/lib/openai/client';
import { db } from '@/lib/db/mongodb';
import { ObjectId } from 'mongodb';
import { MESSAGES_COLLECTION } from '@/modules/app-builder/services/project.repository';
import { saveProjectFile } from '@/modules/app-builder/services/files.repository';

// Define the tools for the Agent
const tools = [
  {
    type: "function" as const,
    function: {
      name: "writeFile",
      description: "Cria ou sobrescreve um arquivo no projeto Next.js gerado",
      parameters: {
        type: "object",
        properties: {
          path: { type: "string", description: "Caminho relativo, ex: app/page.tsx" },
          content: { type: "string", description: "Conteúdo completo do arquivo" }
        },
        required: ["path", "content"]
      }
    }
  },
  {
    type: "function" as const,
    function: {
      name: "readFile",
      description: "Lê o conteúdo atual de um arquivo do projeto",
      parameters: {
        type: "object",
        properties: { path: { type: "string" } },
        required: ["path"]
      }
    }
  },
  {
    type: "function" as const,
    function: {
      name: "listFiles",
      description: "Lista arquivos de um diretório do projeto",
      parameters: {
        type: "object",
        properties: { dir: { type: "string", description: "Diretório relativo, padrão '.'" } }
      }
    }
  },
  {
    type: "function" as const,
    function: {
      name: "installPackages",
      description: "Instala dependências npm no projeto usando pnpm",
      parameters: {
        type: "object",
        properties: {
          packages: {
            type: "array",
            items: { type: "string" }
          }
        },
        required: ["packages"]
      }
    }
  },
  {
    type: "function" as const,
    function: {
      name: "runCommand",
      description: "Executa um comando bash no terminal do projeto (ex: 'npm run lint', 'npx tsc --noEmit', 'cat dev.log')",
      parameters: {
        type: "object",
        properties: {
          command: { type: "string", description: "O comando bash a ser executado" }
        },
        required: ["command"]
      }
    }
  }
];

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const project = await requireOwnedProject(id);
    const body = await req.json();
    const { message } = body;

    if (!message) {
      return NextResponse.json({ error: "Mensagem obrigatória" }, { status: 400 });
    }

    // Pega histórico de mensagens do banco (limitado às últimas 10)
    const history = await db.find<any>(
      MESSAGES_COLLECTION,
      { projectId: new ObjectId(project._id) },
      { sort: { createdAt: 1 } }
    );
    
    // Save user message
    await db.insertOne(MESSAGES_COLLECTION, {
      projectId: new ObjectId(project._id),
      userId: project.userId,
      role: 'user',
      content: message,
      createdAt: new Date()
    });

    // Pega a sandbox (ou acorda ela)
    const sandbox = await getProjectSandbox(project.sandboxName);

    // Build messages for OpenAI
    const aiMessages: any[] = [
      {
        role: "system",
        content: `Você é um agente autônomo especialista em construir e editar aplicações Next.js (App Router, Tailwind) dentro da Vercel Sandbox.
Regras de ouro:
- Use as ferramentas (functions) fornecidas para ler, escrever arquivos e rodar comandos.
- NUNCA simule a execução de uma ferramenta no texto (ex: não escreva "Modificando arquivo..." e pare por aí). Você DEVE chamar a ferramenta real usando a interface de functions da API do OpenAI. Se você não usar a ferramenta, o código NÃO será alterado.
- Quando criar um componente de interface, faça-o bonito, moderno e responsivo usando Tailwind.
- O projeto já tem lucide-react e framer-motion se precisar.
- ATENÇÃO: No histórico de chat, você verá logs como "📝 **Modificando arquivo...**". Isso é injetado pelo SISTEMA quando você chama uma tool. NUNCA digite isso manualmente! Apenas chame a function JSON.

[PREVENÇÃO DE ERROS E DIRETRIZES CRÍTICAS]
- SEMPRE que criar ou alterar um arquivo .ts ou .tsx, certifique-se de que o código não tem erros de sintaxe ou React.
- PARA CRIAR PÁGINAS: Este projeto usa OBRIGATORIAMENTE o **App Router**. O arquivo principal é \`app/page.tsx\`. NUNCA crie ou edite a pasta \`pages/\` (como pages/index.js), pois isso quebrará o sistema com erro 404!
- Se você perceber que cometeu um erro no código anterior, chame a ferramenta novamente para corrigir IMEDIATAMENTE.

[CONTEXTO DO PROJETO E BASE DE CONHECIMENTO]
Nome do Projeto: ${project.name || 'Não definido'}
Objetivo Principal: ${project.description || 'Não definido'}
Regras de Negócio:
${project.businessRules || 'Nenhuma regra específica definida.'}
Diretrizes de Design:
${project.designGuidelines || 'Nenhuma diretriz de design definida.'}`
      },
      ...history.slice(-10).map(m => ({ role: m.role, content: m.content })),
      { role: "user", content: message }
    ];

    // O Server-Sent Events Header
    const encoder = new TextEncoder();
    const stream = new TransformStream();
    const writer = stream.writable.getWriter();

    // Executa o orquestrador em background enquanto retorna a stream para o client
    (async () => {
      let isDone = false;
      let finalContent = "";
      const toolCallsLog: any[] = [];
      let iterations = 0;
      
      while (!isDone && iterations < 5) {
        iterations++;
        const response = await openai.chat.completions.create({
          model: "gpt-5", // Modelo mais moderno e poderoso
          messages: aiMessages,
          tools: tools,
          tool_choice: "auto",
        });

        const choice = response.choices[0];
        const msg = choice.message;

        if (msg.content) {
          // Send content fragment to client
          writer.write(encoder.encode(`data: ${JSON.stringify({ text: msg.content })}\n\n`));
          finalContent += msg.content;
        }

        if (msg.tool_calls && msg.tool_calls.length > 0) {
          aiMessages.push(msg); // Add assistant msg with tool calls

          // Execute tools sequentially
          for (const tc of msg.tool_calls) {
            if (tc.type !== 'function') continue;
            
            const args = JSON.parse(tc.function.arguments);
            let resultStr = "";
            toolCallsLog.push({ name: tc.function.name, args });

            try {
              if (tc.function.name === "writeFile") {
                writer.write(encoder.encode(`data: ${JSON.stringify({ text: `\n\n📝 **Modificando arquivo:** \`${args.path}\`...` })}\n\n`));
                finalContent += `\n\n📝 **Modificando arquivo:** \`${args.path}\`...`;
                
                await sandbox.writeFiles([{ path: args.path, content: Buffer.from(args.content) }]);
                await saveProjectFile(id, args.path, args.content); // Salva no BD para persistência
                resultStr = `Arquivo ${args.path} salvo com sucesso.`;
              } else if (tc.function.name === "readFile") {
                writer.write(encoder.encode(`data: ${JSON.stringify({ text: `\n\n🔍 **Lendo arquivo:** \`${args.path}\`...` })}\n\n`));
                finalContent += `\n\n🔍 **Lendo arquivo:** \`${args.path}\`...`;
                const buf = await sandbox.readFileToBuffer({ path: args.path });
                resultStr = buf ? buf.toString('utf8') : "Arquivo não encontrado";
              } else if (tc.function.name === "listFiles") {
                writer.write(encoder.encode(`data: ${JSON.stringify({ text: `\n\n📂 **Listando arquivos:** \`${args.dir || '.'}\`...` })}\n\n`));
                finalContent += `\n\n📂 **Listando arquivos:** \`${args.dir || '.'}\`...`;
                const entries = await sandbox.fs.readdir(args.dir || ".", { withFileTypes: true });
                resultStr = JSON.stringify(entries.map((e: any) => ({ name: e.name, dir: e.isDirectory() })));
              } else if (tc.function.name === "installPackages") {
                writer.write(encoder.encode(`data: ${JSON.stringify({ text: `\n\n📦 **Instalando pacotes:** \`${args.packages.join(', ')}\`...` })}\n\n`));
                finalContent += `\n\n📦 **Instalando pacotes:** \`${args.packages.join(', ')}\`...`;
                const res = await sandbox.runCommand({ cmd: 'pnpm', args: ['add', ...args.packages] });
                resultStr = await res.output('both');
              } else if (tc.function.name === "runCommand") {
                writer.write(encoder.encode(`data: ${JSON.stringify({ text: `\n\n💻 **Executando comando:** \`${args.command}\`...` })}\n\n`));
                finalContent += `\n\n💻 **Executando comando:** \`${args.command}\`...`;
                const res = await sandbox.runCommand({ cmd: 'bash', args: ['-lc', args.command] });
                resultStr = await res.output('both');
              }
            } catch(e: any) {
              resultStr = `Error: ${e.message}`;
            }

            // Append tool response
            aiMessages.push({
              tool_call_id: tc.id,
              role: "tool",
              name: tc.function.name,
              content: resultStr
            });
          }
        } else {
          isDone = true;
        }
      }

      // Finaliza e salva
      await db.insertOne(MESSAGES_COLLECTION, {
        projectId: new ObjectId(project._id),
        userId: project.userId,
        role: 'assistant',
        content: finalContent,
        toolCalls: toolCallsLog,
        createdAt: new Date()
      });

      writer.write(encoder.encode(`data: [DONE]\n\n`));
      writer.close();
    })().catch(err => {
      console.error("[AppBuilder Agent Error]", err);
      writer.write(encoder.encode(`data: ${JSON.stringify({ error: err.message })}\n\n`));
      writer.close();
    });

    return new Response(stream.readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error: any) {
    if (error instanceof Response) return error;
    console.error('[AppBuilder] POST /projects/[id]/generate error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
