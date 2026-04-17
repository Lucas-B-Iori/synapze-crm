import { NextResponse } from "next/server";
import { evolutionProvider } from "@/lib/providers/whatsapp";
import {
  findOrCreateContactByPhone,
  insertInboundMessage,
} from "@/server/services/webhook-message.service";

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const event = evolutionProvider.parseWebhook(payload);

    if (!event) {
      return NextResponse.json({ success: true, note: "No message parsed" });
    }

    // Identifica o workspace pelo instanceId ou pelo canal ativo do Evolution
    const instanceId =
      (payload as any)?.data?.instanceId ||
      (payload as any)?.instanceId ||
      "";

    const { createAdminClient } = await import("@/lib/supabase/admin");
    const admin = createAdminClient();

    const { data: channels } = await admin
      .from("channels")
      .select("id, workspace_id, config")
      .eq("provider", "whatsapp_evolution")
      .eq("is_active", true)
      .limit(10);

    if (!channels || channels.length === 0) {
      return NextResponse.json({ error: "No active Evolution channel found" }, { status: 404 });
    }

    const channel =
      channels.find(
        (c: any) => c.config?.instance_name === instanceId || c.config?.instanceId === instanceId
      ) || channels[0];

    const workspaceId = channel.workspace_id;
    const contact = await findOrCreateContactByPhone(workspaceId, event.from);

    if (!contact) {
      return NextResponse.json({ error: "Contact not found or created" }, { status: 404 });
    }

    const message = await insertInboundMessage({
      workspaceId,
      contactId: contact.id,
      channelId: channel.id,
      provider: "whatsapp_evolution",
      content: event.text || "(mídia)",
      externalId: event.externalMessageId,
      metadata: { ...event.metadata, instanceId },
    });

    if (!message) {
      return NextResponse.json({ error: "Failed to insert message" }, { status: 500 });
    }

    return NextResponse.json({ success: true, messageId: message.id });
  } catch (err: any) {
    console.error("Evolution webhook error:", err);
    return NextResponse.json({ error: err.message || "Internal error" }, { status: 500 });
  }
}
