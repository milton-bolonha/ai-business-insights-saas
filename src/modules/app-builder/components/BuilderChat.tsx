"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Loader2, Sparkles, Terminal, Settings, Code2 } from "lucide-react";
import { motion } from "framer-motion";
import ReactMarkdown from 'react-markdown';

interface BuilderChatProps {
  projectId: string;
  onOpenSettings?: () => void;
  onOpenEditor?: () => void;
  disabled?: boolean;
}

export function BuilderChat({ projectId, onOpenSettings, onOpenEditor, disabled = false }: BuilderChatProps) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant', content: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchingHistory, setFetchingHistory] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const res = await fetch(`/api/app-builder/projects/${projectId}/messages`);
        if (res.ok) {
          const data = await res.json();
          if (data.messages && data.messages.length > 0) {
            setMessages(data.messages);
          }
        }
      } catch (err) {
        console.error("Failed to load message history", err);
      } finally {
        setFetchingHistory(false);
      }
    };
    fetchMessages();
  }, [projectId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading || disabled) return;

    const userMessage = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      const response = await fetch(`/api/app-builder/projects/${projectId}/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage })
      });

      if (!response.ok || !response.body) {
        throw new Error("Falha na comunicação com o agente.");
      }

      setMessages(prev => [...prev, { role: 'assistant', content: "" }]);

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantMsg = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");
        
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const dataStr = line.slice(6).trim();
            if (dataStr === "[DONE]") {
              break;
            }
            if (dataStr) {
              try {
                const data = JSON.parse(dataStr);
                if (data.error) {
                  assistantMsg += `\n**Erro:** ${data.error}`;
                } else if (data.text) {
                  assistantMsg += data.text;
                }
                setMessages(prev => {
                  const newArr = [...prev];
                  newArr[newArr.length - 1].content = assistantMsg;
                  return newArr;
                });
              } catch (err) {}
            }
          }
        }
      }
    } catch (error: any) {
      setMessages(prev => [...prev, { role: 'assistant', content: `Erro: ${error.message}` }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden relative">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-gray-800">Agente Construtor</h2>
            <p className="text-xs text-gray-500">Peça para eu criar ou alterar a interface.</p>
          </div>
        </div>
        
        <div className="flex items-center gap-1">
          {onOpenEditor && (
            <button 
              onClick={onOpenEditor}
              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="Editor de Código"
            >
              <Code2 className="w-4 h-4" />
            </button>
          )}
          {onOpenSettings && (
            <button 
              onClick={onOpenSettings}
              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="Base de Conhecimento"
            >
              <Settings className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {fetchingHistory && (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
          </div>
        )}

        {!fetchingHistory && messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center p-6 text-gray-400">
            <Terminal className="w-10 h-10 mb-3 opacity-20" />
            <p className="text-sm font-medium text-gray-600">Nenhum comando enviado ainda.</p>
            <p className="text-xs mt-1">Experimente dizer: "Crie uma landing page moderna para uma SaaS."</p>
          </div>
        )}

        {!fetchingHistory && messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div 
              className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                msg.role === 'user' 
                  ? 'bg-blue-600 text-white rounded-br-sm' 
                  : 'bg-gray-100 text-gray-800 rounded-bl-sm'
              }`}
            >
              {msg.content ? (
                msg.role === 'assistant' ? (
                  <div className="prose prose-sm prose-slate max-w-none dark:prose-invert">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                ) : (
                  <div className="whitespace-pre-wrap">{msg.content}</div>
                )
              ) : (
                <Loader2 className="w-4 h-4 animate-spin opacity-50" />
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="p-3 bg-white border-t border-gray-100">
        <form onSubmit={handleSubmit} className="relative flex items-end gap-2 bg-gray-50 border border-gray-200 rounded-xl p-1.5 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
            placeholder={disabled ? "Aguarde a Sandbox ficar pronta..." : "Descreva a interface que você quer criar..."}
            disabled={loading || disabled}
            className="flex-1 min-h-[44px] max-h-[200px] resize-none py-3 px-3 bg-transparent border-0 focus:ring-0 text-sm placeholder:text-gray-400 disabled:opacity-50 focus:outline-none"
            rows={1}
          />
          <button
            type="submit"
            disabled={!input.trim() || loading || disabled}
            className="p-3 mb-0.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0 shadow-sm flex items-center justify-center"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 ml-0.5" />}
          </button>
        </form>
      </div>
    </div>
  );
}
