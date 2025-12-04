"use client";

import { useState } from "react";
import { MessageCircle, Plus, RefreshCw, User } from "lucide-react";

import type { Contact } from "@/lib/types";
import type { AdeAppearanceTokens } from "@/lib/ade-theme";

interface ContactsPanelAdeProps {
  contacts: Contact[];
  onAddContact?: () => void;
  onOpenContact?: (contact: Contact) => void;
  onRegenerateContact?: (contactId: string) => void;
  regeneratingContactId?: string;
  appearance?: AdeAppearanceTokens;
}

export function ContactsPanelAde({
  contacts,
  onAddContact,
  onOpenContact,
  onRegenerateContact,
  regeneratingContactId,
  appearance,
}: ContactsPanelAdeProps) {
  const [showActions, setShowActions] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3
          className="text-lg font-semibold"
          style={{ color: appearance?.textColor || "#111827" }}
        >
          Contacts
        </h3>
        <button
          onClick={() => {
            console.log('[DEBUG] ContactsPanelAde Add Contact button clicked');
            onAddContact?.();
          }}
          className="flex h-8 w-8 items-center justify-center rounded-lg transition hover:bg-black/5"
          style={{ color: appearance?.actionColor || "#374151" }}
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      {/* Contacts list */}
      <div className="space-y-3">
        {contacts.map((contact) => (
          <div
            key={contact.id}
            className="group relative rounded-lg border p-4 transition hover:shadow-sm"
            style={{
              borderColor: appearance?.cardBorderColor || "#e5e7eb",
              backgroundColor: appearance?.surfaceColor || "#ffffff",
            }}
            onMouseEnter={() => setShowActions(contact.id)}
            onMouseLeave={() => setShowActions(null)}
          >
            {/* Actions overlay */}
            {showActions === contact.id && (
              <div className="absolute right-2 top-2 flex items-center space-x-1 rounded-md border bg-white p-1 shadow-sm">
                {onRegenerateContact && (
                  <button
                    onClick={() => onRegenerateContact(contact.id)}
                    disabled={regeneratingContactId === contact.id}
                    className="flex h-6 w-6 items-center justify-center rounded transition hover:bg-gray-100 disabled:opacity-50"
                    title="Regenerate"
                  >
                    <RefreshCw className={`h-3 w-3 ${regeneratingContactId === contact.id ? "animate-spin" : ""}`} />
                  </button>
                )}
              </div>
            )}

            {/* Content */}
            <div
              className="cursor-pointer"
              onClick={() => onOpenContact?.(contact)}
            >
              <div className="flex items-start space-x-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100">
                  <User className="h-5 w-5 text-gray-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4
                    className="font-medium truncate"
                    style={{ color: appearance?.textColor || "#111827" }}
                  >
                    {contact.name}
                  </h4>
                  {contact.jobTitle && (
                    <p
                      className="text-sm truncate"
                      style={{ color: appearance?.mutedTextColor || "#6b7280" }}
                    >
                      {contact.jobTitle}
                    </p>
                  )}
                  {contact.linkedinUrl && (
                    <p
                      className="text-xs truncate text-blue-600 mt-1"
                    >
                      LinkedIn
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Outreach info */}
            {contact.outreach && (
              <div className="mt-3 space-y-2">
                {contact.outreach.emailPitch && (
                  <div className="flex items-center space-x-2 text-xs">
                    <MessageCircle className="h-3 w-3" />
                    <span style={{ color: appearance?.mutedTextColor || "#6b7280" }}>
                      Email pitch available
                    </span>
                  </div>
                )}
                {contact.outreach.coldCallScript && (
                  <div className="flex items-center space-x-2 text-xs">
                    <MessageCircle className="h-3 w-3" />
                    <span style={{ color: appearance?.mutedTextColor || "#6b7280" }}>
                      Call script available
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Chat history indicator */}
            {contact.chatHistory && contact.chatHistory.length > 0 && (
              <div className="mt-2 flex items-center space-x-1 text-xs">
                <MessageCircle className="h-3 w-3" />
                <span style={{ color: appearance?.mutedTextColor || "#6b7280" }}>
                  {contact.chatHistory.length} messages
                </span>
              </div>
            )}
          </div>
        ))}

        {contacts.length === 0 && (
          <div
            className="rounded-lg border-2 border-dashed p-6 text-center"
            style={{
              borderColor: appearance?.cardBorderColor || "#e5e7eb",
              backgroundColor: appearance?.overlayColor || "#f9fafb",
            }}
          >
            <div className="mb-4">
              <User className="mx-auto h-8 w-8 text-gray-400" />
            </div>
            <h4
              className="mb-2 text-sm font-medium"
              style={{ color: appearance?.textColor || "#111827" }}
            >
              No contacts yet
            </h4>
            <p
              className="text-sm"
              style={{ color: appearance?.mutedTextColor || "#6b7280" }}
            >
              Add your first contact to start building relationships.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

