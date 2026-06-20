import React, { useState, useEffect, useRef } from "react";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { smartMarkdownComponents, cleanAndParseCitations } from "./SmartOverviewCards";

export function ChatIA({ workspaceId, preselectedKbId, hideKbSelector }: { workspaceId: string, preselectedKbId?: string, hideKbSelector?: boolean }) {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [agentId, setAgentId] = useState<string | null>(null);
  const [chatId, setChatId] = useState<string | null>(null);
  const [threadId, setThreadId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Buscar Agente vinculado ao Edital (KB)
  useEffect(() => {
    if (!preselectedKbId) return;
    fetch(`/api/openai/agents?workspaceId=${workspaceId}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          const agent = data.agents.find((a: any) => a.knowledgeBaseId === preselectedKbId);
          if (agent) setAgentId(agent._id);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [preselectedKbId, workspaceId]);

  // Buscar conversas antigas (opcional)
  useEffect(() => {
    if (agentId) {
      fetch(`/api/openai/chats?workspaceId=${workspaceId}`)
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            const existingChat = data.chats.find((c: any) => c.agentId === agentId);
            if (existingChat) {
              setChatId(existingChat._id);
              fetch(`/api/openai/chats/${existingChat._id}/messages`)
                .then(r => r.json())
                .then(d => {
                  if (d.success) setMessages(d.messages);
                });
            }
          }
        });
    }
  }, [agentId, workspaceId]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const enviar = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isTyping || !agentId) return;

    const userMsg = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: userMsg }]);
    setIsTyping(true);

    try {
      const res = await fetch("/api/openai/chat/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentId, message: userMsg, threadId, chatId, workspaceId })
      });

      if (!res.ok) throw new Error("Erro na API de chat");

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) return;

      // Oculta indicador de digitação assim que o stream começa
      setIsTyping(false);
      setMessages(prev => [...prev, { role: "assistant", content: "" }]);

      let assistantMessage = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const dataStr = line.replace("data: ", "").trim();
            if (dataStr === "[DONE]") {
              // Finalizado
              fetch(`/api/openai/chats?workspaceId=${workspaceId}`).then(r => r.json()).then(d => {
                if (d.success) {
                  const existingChat = d.chats.find((c: any) => c.agentId === agentId);
                  if (existingChat) setChatId(existingChat._id);
                }
              });
              return;
            }

            try {
              const data = JSON.parse(dataStr);
              if (data.type === 'thread_id') {
                setThreadId(data.threadId);
                setChatId(data.chatId);
              } else if (data.type === 'text' && data.text) {
                assistantMessage += data.text;
                setMessages(prev => {
                  const newM = [...prev];
                  newM[newM.length - 1].content = assistantMessage;
                  return newM;
                });
              }
            } catch (e) {}
          }
        }
      }
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { role: "system", content: "Erro de comunicação." }]);
      setIsTyping(false);
    }
  };

  if (loading) return <div className="p-12 text-center text-slate-500">Inicializando Chat...</div>;
  if (!agentId) return <div className="p-12 text-center text-red-500">Especialista não encontrado para este edital.</div>;

  return (
    <div className="flex flex-col h-full bg-white relative">
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.length === 0 && (
          <div className="text-center py-12 text-slate-500 text-sm">
            Tire suas dúvidas técnicas sobre o edital. A inteligência artificial irá pesquisar diretamente no documento.
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`text-sm leading-relaxed px-4 py-3 rounded-2xl max-w-[85%] ${
              m.role === "user" 
                ? "bg-blue-600 text-white rounded-tr-none" 
                : "bg-slate-50 border border-slate-200 text-slate-800 rounded-tl-none shadow-sm prose prose-sm prose-slate max-w-none"
            }`}>
              {m.role === "user" ? m.content : (
                <ReactMarkdown remarkPlugins={[remarkGfm]} components={smartMarkdownComponents}>
                  {cleanAndParseCitations(m.content)}
                </ReactMarkdown>
              )}
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-slate-100 px-4 py-3 rounded-2xl rounded-tl-none flex gap-1 items-center">
              <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></span>
              <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
              <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <div className="p-4 bg-white border-t border-slate-200 shrink-0">
        <form onSubmit={enviar} className="relative flex items-center">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Pergunte sobre qualificações, prazos, exigências..."
            className="w-full pl-4 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 focus:bg-white transition-all shadow-sm"
          />
          <button 
            type="submit"
            disabled={!input.trim() || isTyping}
            className="absolute right-2 p-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:bg-slate-300 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
          </button>
        </form>
      </div>
    </div>
  );
}
