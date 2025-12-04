import type { Contact } from "@/lib/types";

export interface CreateContactPayload {
  name: string;
  jobTitle: string;
  linkedinUrl: string;
  dashboardId: string;
  workspaceId: string;
}

export async function createContact(
  payload: CreateContactPayload
): Promise<Contact> {
  const response = await fetch("/api/workspace/contacts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: payload.name.trim(),
      jobTitle: payload.jobTitle.trim(),
      linkedinUrl: payload.linkedinUrl.trim(),
      dashboardId: payload.dashboardId,
      workspaceId: payload.workspaceId,
      workspaceName: payload.workspaceId, // Will be resolved from workspace
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      (errorData.error as string) ?? "We couldn't save this contact right now."
    );
  }

  const data = await response.json();
  return data.contact as Contact;
}

export async function regenerateContact(contactId: string): Promise<Contact> {
  const response = await fetch(
    `/api/workspace/contacts/${contactId}/regenerate`,
    { method: "POST" }
  );

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(
      (data.error as string) ?? "We couldn't refresh this contact now."
    );
  }

  const responseData = await response.json();
  return responseData.contact as Contact;
}

export async function chatWithContact(
  contactId: string,
  message: string
): Promise<Contact> {
  const response = await fetch(`/api/workspace/contacts/${contactId}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: message.trim() }),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(
      data.error ?? "Failed to generate follow-up insight"
    );
  }

  const responseData = await response.json();
  return responseData.contact as Contact;
}

