"use server";

import { Resend } from "resend";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/types/workspace";
import type { Message } from "@/types/message";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendEmail(params: {
  workspaceId: string;
  channelId: string;
  contactId: string;
  to: string;
  subject: string;
  html?: string;
  text?: string;
  profileId?: string;
}): Promise<ActionResult<Message>> {
  const supabase = await createClient();

  if (!process.env.RESEND_API_KEY) {
    return { error: "RESEND_API_KEY não configurado" };
  }

  const { data, error: sendError } = await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev",
    to: params.to,
    subject: params.subject,
    html: params.html || undefined,
    text: params.text || undefined,
  } as any);

  if (sendError || !data) {
    return { error: sendError?.message || "Erro ao enviar email" };
  }

  const { data: message, error: dbError } = await supabase
    .from("messages")
    .insert({
      workspace_id: params.workspaceId,
      contact_id: params.contactId,
      channel_id: params.channelId,
      profile_id: params.profileId || null,
      direction: "outbound",
      provider: "email_resend",
      content: params.text || params.html || "",
      metadata: {
        resend_message_id: data.id,
        subject: params.subject,
        to: params.to,
      },
      status: "sent",
      external_id: data.id,
      sent_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (dbError || !message) {
    return { error: dbError?.message || "Erro ao salvar mensagem" };
  }

  return { data: message as Message };
}
