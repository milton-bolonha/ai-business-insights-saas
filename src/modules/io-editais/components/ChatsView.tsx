"use client";

import React, { useState, useEffect } from "react";
import { MessageSquare, Loader2, Plus, ArrowLeft, Send, Trash2 } from "lucide-react";
import { useCurrentWorkspace } from "@/lib/stores";
import ReactMarkdown from 'react-markdown';

export function ChatsView() {
  const workspace = useCurrentWorkspace();
  const [chats, setChats] = useState<any[]>([]);
  const [agents, setAgents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [newAgentId, setNewAgentId] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    if (!workspace) return;
    fetchData();
  }, [workspace]);

  const fetchData = async () => {
    try {
      const [resChats, resAgents] = await Promise.all([
        fetch(`/api/openai/chats?workspaceId=${workspace?.id}`),
        fetch(`/api/openai/agents?workspaceId=${workspace?.id}`)
      ]);
      const [dataChats, dataAgents] = await Promise.all([resChats.json(), resAgents.json()]);
      if (dataChats.success) setChats(dataChats.chats);
      if (dataAgents.success) setAgents(dataAgents.agents);
      
      if (dataAgents.success && dataAgents.agents.length > 0) {
        setNewAgentId(dataAgents.agents[0]._id);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartChat = () => {
    if (!newAgentId) return;
    // We create a "virtual" chat session that will be instantiated on first message
    setActiveChatId("NEW_CHAT_" + newAgentId);
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`Tem certeza que deseja apagar esta conversa?`)) return;
    try {
      const res = await fetch(`/api/openai/chats/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setChats(chats.filter(c => c._id !== id));
      }
    } catch (err) {
      console.error(err);
      alert("Erro ao apagar conversa");
    }
  };

  if (isLoading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-blue-500" /></div>;

  if (activeChatId) {
    const isNew = activeChatId.startsWith("NEW_CHAT_");
    const agentId = isNew ? activeChatId.split("_")[2] : chats.find(c => c._id === activeChatId)?.agentId;
    const agent = agents.find(a => a._id === agentId);

    return (
      <ChatSession 
        chatId={isNew ? null : activeChatId} 
        agent={agent} 
        onBack={() => { setActiveChatId(null); fetchData(); }} 
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Conversas e Análises</h2>
          <p className="text-slate-500">Acesse o histórico de interações com seus especialistas.</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-end gap-4">
        <div className="flex-1">
          <label className="text-sm font-medium text-slate-700 block mb-1">Especialista para nova conversa</label>
          <select 
            className="w-full px-4 py-2 border border-slate-200 rounded-lg"
            value={newAgentId}
            onChange={(e) => setNewAgentId(e.target.value)}
          >
            {agents.map(a => (
              <option key={a._id} value={a._id}>{a.name}</option>
            ))}
          </select>
        </div>
        <button 
          onClick={handleStartChat}
          disabled={!newAgentId}
          className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
        >
          <Plus size={18} /> Iniciar Conversa
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {chats.map(chat => (
          <div 
            key={chat._id} 
            onClick={() => setActiveChatId(chat._id)}
            className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col cursor-pointer hover:border-blue-400 hover:shadow-md transition-all relative group"
          >
            <button 
              onClick={(e) => handleDelete(chat._id, e)}
              className="absolute top-4 right-4 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity z-10"
              title="Apagar Conversa"
            >
              <Trash2 size={18} />
            </button>
            <div className="flex items-start gap-4 mb-4 pr-6">
              <div className="w-12 h-12 bg-slate-50 text-slate-600 rounded-xl flex items-center justify-center shrink-0">
                <MessageSquare size={24} />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 line-clamp-2">{chat.title || "Nova Conversa"}</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Especialista: {agents.find(a => a._id === chat.agentId)?.name || "Desconhecido"}
                </p>
              </div>
            </div>
          </div>
        ))}
        {chats.length === 0 && (
           <div className="col-span-full text-center py-12 text-slate-500">
             Nenhuma conversa encontrada. Inicie uma nova conversa!
           </div>
        )}
      </div>
    </div>
  );
}

function ChatSession({ chatId, agent, onBack }: { chatId: string | null, agent: any, onBack: () => void }) {
  const workspace = useCurrentWorkspace();
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [currentChatId, setCurrentChatId] = useState(chatId);
  const [currentThreadId, setCurrentThreadId] = useState<string | null>(null);
  const [kbFiles, setKbFiles] = useState<any[]>([]);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  useEffect(() => {
    if (currentChatId) {
      fetch(`/api/openai/chats/${currentChatId}/messages`)
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setMessages(data.messages);
          }
        });
    }
  }, [currentChatId]);

  useEffect(() => {
    if (agent?.knowledgeBaseId) {
      fetch(`/api/openai/knowledge-bases/files?knowledgeBaseId=${agent.knowledgeBaseId}`)
        .then(res => res.json())
        .then(data => {
          if (data.success && data.files.length > 0) {
            setKbFiles(data.files);
            setPdfUrl(data.files[0].cloudinaryUrl);
          }
        });
    }
  }, [agent]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isTyping) return;

    const userMessage = input;
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: userMessage }]);
    setIsTyping(true);

    try {
      const res = await fetch("/api/openai/chat/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceId: workspace?.id,
          agentId: agent._id,
          chatId: currentChatId,
          threadId: currentThreadId,
          message: userMessage
        })
      });

      if (!res.ok) throw new Error("Erro na rede");
      if (!res.body) throw new Error("Sem corpo na resposta");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let assistantMsg = "";
      
      setMessages(prev => [...prev, { role: "assistant", content: "" }]);

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.substring(6);
            if (dataStr === '[DONE]') break;
            
            try {
              const data = JSON.parse(dataStr);
              if (data.type === 'thread_id') {
                setCurrentThreadId(data.threadId);
                setCurrentChatId(data.chatId);
              } else if (data.type === 'text') {
                assistantMsg += data.text;
                setMessages(prev => {
                  const updated = [...prev];
                  updated[updated.length - 1].content = assistantMsg;
                  return updated;
                });
              }
            } catch (e) {}
          }
        }
      }
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { role: "system", content: "Erro de comunicação com o servidor." }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex flex-row h-[calc(100vh-100px)] w-full gap-6">
      
      {/* Coluna Esquerda: Chat */}
      <div className="flex-1 flex flex-col bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="flex items-center gap-4 bg-slate-50 p-4 border-b border-slate-200 shrink-0">
          <button onClick={onBack} className="p-2 hover:bg-slate-200 rounded-full text-slate-500 transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="font-bold text-slate-800">Conversando com {agent?.name}</h2>
            <p className="text-xs text-slate-500">
              {currentChatId ? `Chat ativo - ID: ${currentChatId.substring(0, 8)}...` : "Nova Conversa"}
            </p>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.length === 0 && (
            <div className="text-center py-12 text-slate-500">
              Envie sua primeira mensagem para o agente. Ele baseará as respostas na Base de Conhecimento associada.
            </div>
          )}
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[85%] rounded-2xl p-5 ${
                msg.role === "user" 
                  ? "bg-blue-600 text-white rounded-tr-none" 
                  : "bg-slate-50 border border-slate-200 text-slate-800 rounded-tl-none shadow-sm"
              }`}>
                {msg.role === "user" ? (
                  <div className="whitespace-pre-wrap leading-relaxed">{msg.content}</div>
                ) : (
                  <div className="prose prose-sm prose-slate max-w-none">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                )}
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-slate-100 px-4 py-3 rounded-2xl rounded-tl-none flex gap-1">
                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></span>
                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white p-4 border-t border-slate-200 shrink-0">
          <form onSubmit={handleSend} className="relative flex items-center">
            <input
              type="text"
              className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 pr-16"
              placeholder="Pergunte ao especialista..."
              value={input}
              onChange={e => setInput(e.target.value)}
              disabled={isTyping}
            />
            <button 
              type="submit"
              disabled={isTyping || !input.trim()}
              className="absolute right-2 w-10 h-10 flex items-center justify-center bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {isTyping ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
            </button>
          </form>
        </div>
      </div>

      {/* Coluna Direita: Referência (PDF) */}
      <div className="w-[450px] shrink-0 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col hidden lg:flex">
        <h3 className="font-bold text-slate-800 mb-4 text-sm shrink-0">
          Documento de Referência
        </h3>
        
        {kbFiles.length > 1 && (
          <select 
            className="w-full px-3 py-2 mb-4 text-sm border border-slate-200 rounded-lg shrink-0"
            value={pdfUrl || ""}
            onChange={e => setPdfUrl(e.target.value)}
          >
            {kbFiles.map((f, i) => (
              <option key={i} value={f.cloudinaryUrl}>{f.fileName}</option>
            ))}
          </select>
        )}

        {pdfUrl ? (
          <div className="flex-1 rounded-xl overflow-hidden border border-slate-200">
            <iframe src={pdfUrl} className="w-full h-full" title="PDF Viewer" />
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 rounded-xl border border-slate-200 border-dashed text-slate-400 p-6 text-center">
            <p className="text-sm font-medium">Nenhum PDF disponível</p>
            <p className="text-xs mt-1">Este agente não possui documentos de referência na sua base de conhecimento.</p>
          </div>
        )}
      </div>

    </div>
  );
}
