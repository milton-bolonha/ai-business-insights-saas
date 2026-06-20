import React from "react";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export function cleanAndParseCitations(content: string) {
  if (!content) return "";
  let cleanContent = content.replace(/<pre><code>/g, '').replace(/<\/code><\/pre>/g, '').trim();
  
  // Regex mais robusto para capturar marcações do OpenAI. Ex: 【4:0†guarda565.pdf】, 【0†guarda565.pdf】, etc.
  // Ele vai procurar algo entre 【 e 】, capturar os números e capturar o nome do arquivo após o † ou :
  cleanContent = cleanContent.replace(/【(\d*[:|†]*\d*)?[†|:](.*?)】/g, '[$2](#citation "$1")');
  // Se por acaso vier sujo sem chaves como "0†guarda565.pdf" isolado, vamos capturar tbm
  cleanContent = cleanContent.replace(/(\d+)[†|:]([a-zA-Z0-9_.-]+\.pdf)/g, '[$2](#citation "$1")');

  return cleanContent;
}

export const smartMarkdownComponents: any = {
  h1: ({node, ...props}: any) => <h1 className="text-2xl font-bold text-slate-800 mb-6 border-b border-slate-100 pb-4" {...props} />,
  h2: ({node, ...props}: any) => <h2 className="text-xl font-bold text-slate-800 mt-8 mb-4" {...props} />,
  h3: ({node, ...props}: any) => <h3 className="text-lg font-bold text-slate-700 mt-6 mb-3" {...props} />,
  table: ({node, ...props}: any) => <div className="overflow-x-auto my-6"><table className="min-w-full divide-y divide-slate-200 border border-slate-200 rounded-lg overflow-hidden" {...props} /></div>,
  thead: ({node, ...props}: any) => <thead className="bg-slate-50" {...props} />,
  th: ({node, ...props}: any) => <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider" {...props} />,
  tbody: ({node, ...props}: any) => <tbody className="bg-white divide-y divide-slate-100" {...props} />,
  td: ({node, ...props}: any) => <td className="px-4 py-3 text-sm text-slate-600 whitespace-pre-wrap" {...props} />,
  strong: ({node, ...props}: any) => <strong className="font-semibold text-slate-800 bg-blue-50 px-1 rounded" {...props} />,
  a: ({node, ...props}: any) => {
    if (props.href === '#citation') {
      let quoteText = props.title || "Trecho não disponível na API.";
      
      // Se quoteText for composto apenas por dígitos, dois pontos ou adagas (ex: "4:3" ou "12†"), 
      // significa que foi pego pelo regex de fallback do frontend (alucinação de citação que a API ocultou).
      if (/^[\d:†]+$/.test(quoteText)) {
        quoteText = "A IA inferiu esta informação com base no arquivo, mas não forneceu a citação do parágrafo exato.";
      }

      let docName = props.children;
      if (docName === "source" || docName === "arquivo.pdf" || !docName) {
        docName = "Edital em Análise";
      }

      return (
        <span className="group/cite relative inline-block ml-1">
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 text-[10px] font-bold border border-blue-200 cursor-help hover:bg-blue-200 hover:text-blue-900 transition-colors shadow-sm">
            <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-file-text" aria-hidden="true">
              <path d="M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z"></path>
              <path d="M14 2v5a1 1 0 0 0 1 1h5"></path><path d="M10 9H8"></path><path d="M16 13H8"></path><path d="M16 17H8"></path>
            </svg> 
            {docName}
          </span>
          <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover/cite:block w-72 bg-slate-800 text-slate-100 text-xs rounded-xl p-4 shadow-xl z-50 pointer-events-none">
            <span className="block font-bold text-blue-300 mb-2 border-b border-slate-700 pb-1">Trecho Original do PDF:</span>
            <span className="block leading-relaxed text-slate-200 italic line-clamp-6">"{quoteText}"</span>
            <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-800 rotate-45"></span>
          </span>
        </span>
      );
    }
    return <a className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer" {...props} />;
  },
};

export function SmartOverviewCards({ content }: { content: string }) {
  if (!content) return null;
  const cleanContent = cleanAndParseCitations(content);

  return (
    <div className="prose prose-blue max-w-none prose-p:leading-relaxed prose-li:marker:text-blue-500">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={smartMarkdownComponents}>
        {cleanContent}
      </ReactMarkdown>
    </div>
  );
}
