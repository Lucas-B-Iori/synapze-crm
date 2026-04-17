import { NextResponse } from "next/server";
import { findOrCreateContactByEmail, insertInboundMessage, findChannelByWorkspaceAndProvider } from "@/server/services/webhook-message.service";
import type { Message } from "@/types/message";

export async function POST(request: Request) {
  try {
    const payload = await request.json();

    // Suporta tanto eventos reais do Resend quanto simulação manual
    const fromEmail = payload.from || payload.email?.from?.[0];
    const toEmail = payload.to || payload.email?.to?.[0];
    const subject = payload.subject || payload.email?.subject || "";
    const text = payload.text || payload.email?.text || "";
    const html = payload.html || payload.email?.html || "";
    const workspaceId = payload.workspace_id;

    if (!fromEmail || !workspaceId) {
      return NextResponse.json({ error: "Missing from or workspace_id" }, { status: 400 });
    }

    const contact = await findOrCreateContactByEmail(workspaceId, fromEmail);
    if (!contact) {
      return NextResponse.json({ error: "Contact not found or created" }, { status: 404 });
    }

    const channel = await findChannelByWorkspaceAndProvider(workspaceId, "email_resend");

    const message = await insertInboundMessage({
      workspaceId,
      contactId: contact.id,
      channelId: channel?.id,
      provider: "email_resend",
      content: text || html || subject || "(email vazio)",
      externalId: payload.id || undefined,
      metadata: {
        from: fromEmail,
        to: toEmail,
        subject,
        html: html ? true : false,
      },
    });

    if (!message) {
      return NextResponse.json({ error: "Failed to insert message" }, { status: 500 });
    }

    return NextResponse.json({ success: true, messageId: message.id });
  } catch (err: any) {
    console.error("Resend webhook error:", err);
    return NextResponse.json({ error: err.message || "Internal error" }, { status: 500 });
  }
}
