"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { normalizePhone } from "@/lib/phone";
import type { Message } from "@/types/message";

export async function findOrCreateContactByPhone(
  workspaceId: string,
  phone: string
): Promise<{ id: string; full_name: string | null; email: string | null; phone: string | null } | null> {
  const admin = createAdminClient();
  const normalized = normalizePhone(phone);

  const { data: existing } = await admin
    .from("contacts")
    .select("id, full_name, email, phone")
    .eq("workspace_id", workspaceId)
    .or(`phone.ilike.%${normalized}%`)
    .limit(1)
    .maybeSingle();

  if (existing) return existing;

  const { data: created, error } = await admin
    .from("contacts")
    .insert({
      workspace_id: workspaceId,
      full_name: `Lead ${phone}`,
      phone: normalized,
    })
    .select("id, full_name, email, phone")
    .single();

  if (error || !created) {
    console.error("Erro ao criar contato por telefone:", error);
    return null;
  }

  return created;
}

export async function findOrCreateContactByEmail(
  workspaceId: string,
  email: string
): Promise<{ id: string; full_name: string | null; email: string | null; phone: string | null } | null> {
  const admin = createAdminClient();

  const { data: existing } = await admin
    .from("contacts")
    .select("id, full_name, email, phone")
    .eq("workspace_id", workspaceId)
    .ilike("email", email)
    .maybeSingle();

  if (existing) return existing;

  const { data: created, error } = await admin
    .from("contacts")
    .insert({
      workspace_id: workspaceId,
      full_name: email.split("@")[0],
      email: email.toLowerCase().trim(),
    })
    .select("id, full_name, email, phone")
    .single();

  if (error || !created) {
    console.error("Erro ao criar contato por email:", error);
    return null;
  }

  return created;
}

export async function insertInboundMessage(params: {
  workspaceId: string;
  contactId: string;
  channelId?: string;
  provider: Message["provider"];
  content: string;
  externalId?: string;
  metadata?: Record<string, unknown>;
}): Promise<Message | null> {
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("messages")
    .insert({
      workspace_id: params.workspaceId,
      contact_id: params.contactId,
      channel_id: params.channelId || null,
      profile_id: null,
      direction: "inbound",
      provider: params.provider,
      content: params.content,
      metadata: params.metadata || {},
      status: "delivered",
      external_id: params.externalId || null,
      sent_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error || !data) {
    console.error("Erro ao inserir mensagem inbound:", error);
    return null;
  }

  return data as Message;
}

export async function findChannelByWorkspaceAndProvider(
  workspaceId: string,
  provider: Message["provider"]
): Promise<{ id: string } | null> {
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("channels")
    .select("id")
    .eq("workspace_id", workspaceId)
    .eq("provider", provider)
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;
  return data;
}
