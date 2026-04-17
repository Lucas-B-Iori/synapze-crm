"use server";

import { createClient } from "@/lib/supabase/server";
import { metaProvider, evolutionProvider } from "@/lib/providers/whatsapp";
import { sendEmail } from "./email.service";
import type { ActionResult } from "@/types/workspace";
import type { Message } from "@/types/message";
import type { Channel } from "@/types/channel";

const whatsappProviders = {
  whatsapp_meta: metaProvider,
  whatsapp_evolution: evolutionProvider,
};

export async function listMessagesForContact(
  contactId: string,
  workspaceId: string,
  limit: number = 50
): Promise<ActionResult<Message[]>> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("messages")
    .select(`
      *,
      profile:profiles(id, full_name)
    `)
    .eq("contact_id", contactId)
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: true })
    .limit(limit);

  if (error) {
    return { error: error.message };
  }

  return { data: (data || []) as Message[] };
}

export async function sendMessage(params: {
  workspaceId: string;
  contactId: string;
  channelId: string;
  content: string;
  profileId: string;
  subject?: string;
  to?: string; // email ou telefone do destinatário (para inbound logic não precisa, outbound sim)
}): Promise<ActionResult<Message>> {
  const supabase = await createClient();

  const { data: channel, error: channelError } = await supabase
    .from("channels")
    .select("*")
    .eq("id", params.channelId)
    .eq("workspace_id", params.workspaceId)
    .single();

  if (channelError || !channel) {
    return { error: channelError?.message || "Canal não encontrado" };
  }

  const ch = channel as Channel;

  if (ch.provider === "email_resend") {
    return sendEmail({
      workspaceId: params.workspaceId,
      channelId: params.channelId,
      contactId: params.contactId,
      to: params.to || "",
      subject: params.subject || "(sem assunto)",
      text: params.content,
      profileId: params.profileId,
    });
  }

  const provider = whatsappProviders[ch.provider as keyof typeof whatsappProviders];
  if (!provider) {
    return { error: "Provider de WhatsApp não suportado" };
  }

  if (!params.to) {
    return { error: "Telefone de destino não informado" };
  }

  try {
    const result = await provider.sendMessage({
      channel: ch,
      to: params.to,
      text: params.content,
    });

    const { data: message, error: dbError } = await supabase
      .from("messages")
      .insert({
        workspace_id: params.workspaceId,
        contact_id: params.contactId,
        channel_id: params.channelId,
        profile_id: params.profileId,
        direction: "outbound",
        provider: ch.provider as Message["provider"],
        content: params.content,
        metadata: {
          to: params.to,
        },
        status: "sent",
        external_id: result.externalId,
        sent_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (dbError || !message) {
      return { error: dbError?.message || "Erro ao salvar mensagem" };
    }

    return { data: message as Message };
  } catch (err: any) {
    return { error: err?.message || "Erro ao enviar mensagem" };
  }
}

export async function markMessagesAsRead(
  contactId: string,
  workspaceId: string
): Promise<ActionResult<null>> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("messages")
    .update({ status: "read" })
    .eq("contact_id", contactId)
    .eq("workspace_id", workspaceId)
    .eq("direction", "inbound")
    .in("status", ["pending", "sent", "delivered"]);

  if (error) {
    return { error: error.message };
  }

  return { data: null };
}
