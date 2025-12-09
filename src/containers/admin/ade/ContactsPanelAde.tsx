"use client";

import { MessageCircle, Plus, User } from "lucide-react";

import type { Contact } from "@/lib/types";
import type { AdeAppearanceTokens } from "@/lib/ade-theme";

interface ContactsPanelAdeProps {
  contacts: Contact[];
  onAddContact?: () => void;
  onOpenContact?: (contact: Contact) => void;
  appearance?: AdeAppearanceTokens;
}

export function ContactsPanelAde({
  contacts,
  onAddContact,
  onOpenContact,
  appearance,
}: ContactsPanelAdeProps) {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3
            className="text-lg font-semibold"
            style={{ color: appearance?.textColor || "#111827" }}
          >
            Contacts
          </h3>
          <p
            className="text-xs"
            style={{ color: appearance?.mutedTextColor || "#6b7280" }}
          >
            Cartões em linha com um card de add sempre visível
          </p>
        </div>
      </div>

      {/* Contacts grid */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <button
          onClick={() => {
            console.log("[DEBUG] ContactsPanelAde Add Contact button clicked");
            onAddContact?.();
          }}
          type="button"
          className="flex min-h-[180px] flex-col items-center justify-center rounded-2xl border-2 border-dashed text-center transition hover:bg-white"
          style={{
            borderColor: appearance?.cardBorderColor || "#d1d5db",
            color: appearance?.mutedTextColor || "#6b7280",
            backgroundColor: appearance?.overlayColor || "#f8fafc",
          }}
        >
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600">
            <Plus className="h-5 w-5" />
          </div>
          <span className="text-sm font-medium">Add Contact</span>
          <span className="text-xs text-gray-500">Adicionar um contato</span>
        </button>

        {contacts.map((contact) => (
          <div
            key={contact.id}
            className="flex min-h-[180px] flex-col rounded-2xl border shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            style={{
              borderColor: appearance?.cardBorderColor || "#e5e7eb",
              backgroundColor: appearance?.surfaceColor || "#ffffff",
            }}
          >
            <div
              className="flex items-start justify-between border-b px-4 py-3"
              style={{
                borderColor: appearance?.cardBorderColor || "#e5e7eb",
                backgroundColor: appearance?.overlayColor || "#f9fafb",
              }}
            >
              <div className="flex items-start space-x-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100">
                  <User className="h-5 w-5 text-gray-600" />
                </div>
                <div className="min-w-0">
                  <h4
                    className="truncate text-sm font-semibold"
                    style={{ color: appearance?.textColor || "#111827" }}
                  >
                    {contact.name}
                  </h4>
                  {contact.jobTitle && (
                    <p
                      className="truncate text-xs"
                      style={{ color: appearance?.mutedTextColor || "#6b7280" }}
                    >
                      {contact.jobTitle}
                    </p>
                  )}
                  {contact.linkedinUrl && (
                    <p className="text-xs text-blue-600">LinkedIn</p>
                  )}
                </div>
              </div>
            </div>

            <button
              className="flex flex-1 flex-col items-start space-y-2 px-4 py-3 text-left"
              onClick={() => onOpenContact?.(contact)}
            >
              {contact.outreach && (
                <div className="space-y-1 text-xs">
                  {contact.outreach.emailPitch && (
                    <div className="flex items-center space-x-2 text-gray-700">
                      <MessageCircle className="h-3 w-3" />
                      <span>Email pitch disponível</span>
                    </div>
                  )}
                  {contact.outreach.coldCallScript && (
                    <div className="flex items-center space-x-2 text-gray-700">
                      <MessageCircle className="h-3 w-3" />
                      <span>Call script disponível</span>
                    </div>
                  )}
                </div>
              )}

              {contact.chatHistory && contact.chatHistory.length > 0 && (
                <div className="flex items-center space-x-1 text-xs text-gray-500">
                  <MessageCircle className="h-3 w-3" />
                  <span>{contact.chatHistory.length} mensagens</span>
                </div>
              )}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
