"use client";

import { useState } from "react";
import { X, Copy, MessageCircle, Clock } from "lucide-react";
import type { Tile } from "@/lib/types";

interface TileChatPayload {
  message: string;
  attachments?: File[];
}

interface TileDetailModalProps {
  tile: Tile | null;
  onClose: () => void;
  onSubmit?: (payload: TileChatPayload) => void;
  isSubmitting?: boolean;
  isGuest?: boolean;
  allowAttachments?: boolean;
}

export function TileDetailModal({
  tile,
  onClose,
  onSubmit,
  isSubmitting = false,
  isGuest = false,
  allowAttachments = true,
}: TileDetailModalProps) {
  const [chatMessage, setChatMessage] = useState("");
  const [attachments, setAttachments] = useState<File[]>([]);
  
  console.log("[DEBUG] TileDetailModal rendering for:", tile?.id);

  if (!tile) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(tile.content);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (chatMessage.trim() && onSubmit) {
      onSubmit({
        message: chatMessage.trim(),
        attachments: attachments.length > 0 ? attachments : undefined,
      });
      setChatMessage("");
      setAttachments([]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setAttachments(prev => [...prev, ...files]);
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/30 backdrop-blur-sm transition-opacity" 
        onClick={onClose} 
      />
      
      {/* Drawer */}
      <div className="relative w-full md:w-1/2 max-w-4xl h-full bg-white shadow-2xl rounded-l-3xl overflow-hidden flex flex-col animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-white/80 backdrop-blur-md z-10">
          <div className="flex-1 min-w-0 mr-4">
            <h2 className="text-xl font-bold text-gray-900 truncate" title={tile.title}>
              {tile.title}
            </h2>
            <div className="flex items-center space-x-3 mt-1.5 text-xs font-medium text-gray-500">
              <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 capitalize">
                {tile.category || "Custom"}
              </span>
              <span>{tile.model}</span>
              <span className="flex items-center">
                <Clock className="h-3 w-3 mr-1" />
                {formatDate(tile.createdAt)}
              </span>
            </div>
          </div>
          <div className="flex items-center space-x-2 shrink-0">
            <button
              onClick={handleCopy}
              className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
              title="Copy content"
            >
              <Copy className="h-5 w-5" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Content Scroll Area */}
        <div className="flex-1 overflow-y-auto bg-gray-50/50">
          <div className="p-6 space-y-8">
            
            {/* Main Content Card */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="prose prose-slate max-w-none">
                <div className="whitespace-pre-wrap text-gray-800 leading-relaxed text-base">
                  {tile.content}
                </div>
              </div>
            </div>

            {/* Metadata Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                <div className="text-xs text-gray-500 mb-1">Model</div>
                <div className="font-medium text-gray-900 text-sm truncate">{tile.model}</div>
              </div>
              {tile.totalTokens && (
                <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                  <div className="text-xs text-gray-500 mb-1">Tokens</div>
                  <div className="font-medium text-gray-900 text-sm">{tile.totalTokens}</div>
                </div>
              )}
              <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                <div className="text-xs text-gray-500 mb-1">Attempts</div>
                <div className="font-medium text-gray-900 text-sm">{tile.attempts}</div>
              </div>
              <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                <div className="text-xs text-gray-500 mb-1">Status</div>
                <div className="font-medium text-green-600 text-sm flex items-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 mr-1.5"></span>
                  Generated
                </div>
              </div>
            </div>

            {/* Original Prompt */}
            {tile.prompt && (
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                  <span className="w-1 h-4 bg-blue-500 rounded-full mr-2"></span>
                  Original Prompt
                </h3>
                <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4 text-sm text-blue-900 leading-relaxed">
                  {tile.prompt}
                </div>
              </div>
            )}

            {/* Chat History */}
            {tile.history && tile.history.length > 1 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center">
                  <span className="w-1 h-4 bg-purple-500 rounded-full mr-2"></span>
                  Conversation History
                </h3>
                <div className="space-y-4">
                  {tile.history.map((message, index) => (
                    <div
                      key={message.id || index}
                      className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm ${
                          message.role === "user"
                            ? "bg-blue-600 text-white rounded-br-none"
                            : "bg-white text-gray-800 border border-gray-100 rounded-bl-none"
                        }`}
                      >
                        {message.content}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer / Chat Input */}
        {onSubmit && (
          <div className="border-t border-gray-100 bg-white p-4 z-10">
            {/* Attachments Preview */}
            {attachments.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3 px-2">
                {attachments.map((file, index) => (
                  <div key={index} className="flex items-center space-x-2 bg-gray-100 px-3 py-1.5 rounded-lg border border-gray-200">
                    <span className="text-xs font-medium text-gray-700 truncate max-w-[150px]">{file.name}</span>
                    <button
                      type="button"
                      onClick={() => removeAttachment(index)}
                      className="text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <form onSubmit={handleSubmit} className="relative">
              <div className="flex items-end space-x-2 bg-gray-50 border border-gray-200 rounded-2xl p-2 focus-within:ring-2 focus-within:ring-blue-100 focus-within:border-blue-400 transition-all shadow-sm">
                {allowAttachments && !isGuest && (
                  <label className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl cursor-pointer transition-colors shrink-0">
                    <input
                      type="file"
                      multiple
                      accept="image/*,.pdf,.doc,.docx,.txt"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                    </svg>
                  </label>
                )}
                
                <input
                  type="text"
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  placeholder="Ask a follow-up question..."
                  className="flex-1 bg-transparent border-none focus:ring-0 text-sm py-2.5 px-1 min-h-[44px] max-h-32"
                  disabled={isSubmitting || isGuest}
                />
                
                <button
                  type="submit"
                  disabled={!chatMessage.trim() || isSubmitting || isGuest}
                  className="p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-all hover:shadow-md shrink-0"
                >
                  <MessageCircle className={`h-5 w-5 ${isSubmitting ? 'animate-pulse' : ''}`} />
                </button>
              </div>
              
              {isGuest && (
                <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] flex items-center justify-center rounded-2xl border border-gray-100">
                  <p className="text-xs font-medium text-gray-600 bg-white px-3 py-1.5 rounded-full shadow-sm border border-gray-100">
                    Upgrade to Pro to chat
                  </p>
                </div>
              )}
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

