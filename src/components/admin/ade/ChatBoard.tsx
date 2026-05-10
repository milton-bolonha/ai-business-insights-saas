import React, { useEffect, useRef } from "react";
import { Mic, Info, History, CheckCircle2 } from "lucide-react";
import { useChatStore } from "@/lib/stores/chatStore";
import type { Dashboard, WorkspaceWithDashboards } from "@/lib/types/dashboard";
import { cn } from "@/lib/utils";

interface ChatBoardProps {
  workspace: WorkspaceWithDashboards;
  dashboard: Dashboard;
}

export function ChatBoard({ workspace, dashboard }: ChatBoardProps) {
  const { messages, fetchMessages, isLoading } = useChatStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchMessages(workspace.id, dashboard.id);
  }, [workspace.id, dashboard.id, fetchMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex flex-col h-full bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 text-blue-600 rounded-xl">
            <History className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Histórico de IA</h2>
            <p className="text-xs text-gray-500">Conversas salvas deste painel</p>
          </div>
        </div>
        <button 
          onClick={() => window.dispatchEvent(new CustomEvent('start-voice-chat'))}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-md transition-colors"
        >
          <Mic className="h-4 w-4" />
          Nova Conversa
        </button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50/30">
        {isLoading && messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-400">
            <div className="animate-pulse flex items-center gap-2">
              <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
              <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
              <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 text-center space-y-4">
            <div className="p-4 bg-gray-100 rounded-full">
              <Mic className="h-8 w-8 text-gray-300" />
            </div>
            <div>
              <p className="font-medium text-gray-500">Nenhuma conversa encontrada</p>
              <p className="text-sm">Clique em "Nova Conversa" para falar com a IA.</p>
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className={cn("flex w-full", msg.role === 'user' ? "justify-end" : "justify-start")}>
              <div className={cn(
                "max-w-[80%] rounded-2xl px-5 py-3 shadow-sm",
                msg.role === 'user' 
                  ? "bg-blue-600 text-white rounded-tr-sm" 
                  : "bg-white border border-gray-100 text-gray-800 rounded-tl-sm shadow-md"
              )}>
                <div className="text-sm whitespace-pre-wrap">{msg.content}</div>
                {msg.metadata?.action && (
                  <div className="mt-2 group relative inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-200 cursor-default transition-colors hover:bg-emerald-100">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span className="text-[11px] font-bold uppercase tracking-wider">{msg.metadata.action}</span>
                    
                    {/* Hover tooltip for metadata details */}
                    <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block w-max max-w-xs bg-gray-900 text-white text-xs p-3 rounded-xl shadow-xl z-50">
                        <div className="font-bold mb-1 border-b border-gray-700 pb-1 flex items-center gap-1">
                           <Info className="w-3.5 h-3.5" /> Detalhes da Ação
                        </div>
                        <pre className="text-[10px] overflow-x-auto whitespace-pre-wrap font-mono mt-1 text-gray-300">
                            {JSON.stringify(msg.metadata, null, 2)}
                        </pre>
                        <div className="absolute left-4 top-full w-0 h-0 border-l-[6px] border-l-transparent border-t-[6px] border-t-gray-900 border-r-[6px] border-r-transparent" />
                    </div>
                  </div>
                )}
                <div className={cn(
                  "text-[10px] mt-1 opacity-60 text-right",
                  msg.role === 'user' ? "text-blue-100" : "text-gray-400"
                )}>
                  {new Date(msg.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}
