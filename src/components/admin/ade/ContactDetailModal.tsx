"use client";

import { useState } from "react";
import { X, MessageCircle, Mail, Phone } from "lucide-react";
import type { Contact } from "@/lib/types";

interface ContactDetailModalProps {
  contact: Contact | null;
  onClose: () => void;
  onSubmitChat?: (message: string) => void;
  isChatting?: boolean;
}

export function ContactDetailModal({
  contact,
  onClose,
  onSubmitChat,
  isChatting = false,
}: ContactDetailModalProps) {
  const [chatMessage, setChatMessage] = useState("");

  if (!contact) return null;

  const handleSubmitChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (chatMessage.trim() && onSubmitChat) {
      onSubmitChat(chatMessage.trim());
      setChatMessage("");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative max-w-2xl w-full max-h-[80vh] rounded-lg bg-white shadow-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
              <span className="text-lg font-semibold text-gray-600">
                {contact.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {contact.name}
              </h2>
              {contact.jobTitle && (
                <p className="text-sm text-gray-600">{contact.jobTitle}</p>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Contact Info */}
          <div className="space-y-4 mb-6">
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-2">
                Contact Information
              </h3>
              <div className="space-y-2">
                {contact.jobTitle && (
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <div className="w-2 h-2 bg-gray-400 rounded-full" />
                    <span>{contact.jobTitle}</span>
                  </div>
                )}
                {contact.linkedinUrl && (
                  <div className="flex items-center space-x-2 text-sm">
                    <div className="w-2 h-2 bg-blue-400 rounded-full" />
                    <a
                      href={contact.linkedinUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      LinkedIn Profile
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Outreach Content */}
            {contact.outreach && (
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-3">
                  Outreach Content
                </h3>
                <div className="space-y-4">
                  {contact.outreach.emailPitch && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <Mail className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-medium text-blue-900">
                          Email Pitch
                        </span>
                      </div>
                      <p className="text-sm text-blue-800 whitespace-pre-wrap">
                        {contact.outreach.emailPitch.content}
                      </p>
                    </div>
                  )}

                  {contact.outreach.coldCallScript && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <Phone className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-medium text-green-900">
                          Cold Call Script
                        </span>
                      </div>
                      <p className="text-sm text-green-800 whitespace-pre-wrap">
                        {contact.outreach.coldCallScript.content}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Chat History */}
            {contact.chatHistory && contact.chatHistory.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-3">
                  Chat History
                </h3>
                <div className="space-y-3 max-h-48 overflow-y-auto">
                  {contact.chatHistory.map((message, index) => (
                    <div
                      key={message.id || index}
                      className={`flex ${
                        message.role === "user"
                          ? "justify-end"
                          : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-xs px-3 py-2 rounded-lg text-sm ${
                          message.role === "user"
                            ? "bg-blue-600 text-white"
                            : "bg-gray-100 text-gray-900"
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

          {/* Chat Input */}
          {onSubmitChat && (
            <div className="border-t border-gray-200 pt-4">
              <form onSubmit={handleSubmitChat} className="flex space-x-2">
                <input
                  type="text"
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  placeholder="Ask a question about this contact..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={isChatting}
                />
                <button
                  type="submit"
                  disabled={!chatMessage.trim() || isChatting}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <MessageCircle className="h-4 w-4" />
                  <span>{isChatting ? "Sending..." : "Send"}</span>
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
