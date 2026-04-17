"use server";

import { revalidatePath } from "next/cache";
import { listMessagesForContact, sendMessage, markMessagesAsRead } from "@/server/services/message.service";
import type { Message } from "@/types/message";

export async function fetchMessagesForContact(contactId: string, workspaceId: string) {
  return listMessagesForContact(contactId, workspaceId);
}

export async function sendMessageAction(payload: {
  workspaceId: string;
  contactId: string;
  channelId: string;
  content: string;
  profileId: string;
  subject?: string;
  to?: string;
}) {
  const result = await sendMessage(payload);
  if (!result.error) {
    revalidatePath("/dashboard/contacts");
  }
  return result;
}

export async function markAsReadAction(contactId: string, workspaceId: string) {
  const result = await markMessagesAsRead(contactId, workspaceId);
  revalidatePath("/dashboard/contacts");
  return result;
}
