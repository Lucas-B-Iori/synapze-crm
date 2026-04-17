import { NextResponse } from "next/server";
import { metaProvider } from "@/lib/providers/whatsapp";
import {
  findOrCreateContactByPhone,
  insertInboundMessage,
  findChannelByWorkspaceAndProvider,
} from "@/server/services/webhook-message.service";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  // TODO: validar verify_token contra um valor seguro (ex: env var)
  if (mode === "subscribe" && token && challenge) {
    return new NextResponse(challenge, { status: 200 });
  }

  return NextResponse.json({ error: "Verification failed" }, { status: 403 });
}

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const event = metaProvider.parseWebhook(payload);

    if (!event) {
      return NextResponse.json({ success: true, note: "No message parsed" });
    }

    // Precisamos identificar o workspace. No MVP, buscamos o canal ativo pelo provider.
    // Em um cenário real, mapeamos o 'to' (número de telefone do business) para um canal específico.
    // Aqui vamos uma abordagem pragmática: procuramos canais whatsapp_meta ativos.
    // Se houver mais de um, usamos o primeiro. No futuro, filtramos pelo phone_number_id.
    const { createAdminClient } = await import("@/lib/supabase/admin");
    const admin = createAdminClient();

    const { data: channels } = await admin
      .from("channels")
      .select("id, workspace_id, config")
      .eq("provider", "whatsapp_meta")
      .eq("is_active", true)
      .limit(10);

    if (!channels || channels.length === 0) {
      return NextResponse.json({ error: "No active Meta channel found" }, { status: 404 });
    }

    // Tenta encontrar o canal correto pelo display_phone_number no metadata do webhook
    const entries = (payload as any).entry || [];
    const phoneNumber =
      entries[0]?.changes?.[0]?.value?.metadata?.display_phone_number || "";

    const channel =
      channels.find(
        (c: any) =>
          c.config?.phone_number_id === phoneNumber ||
          c.config?.display_phone_number === phoneNumber
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
      provider: "whatsapp_meta",
      content: event.text || "(mídia)",
      externalId: event.externalMessageId,
      metadata: event.metadata,
    });

    if (!message) {
      return NextResponse.json({ error: "Failed to insert message" }, { status: 500 });
    }

    return NextResponse.json({ success: true, messageId: message.id });
  } catch (err: any) {
    console.error("Meta webhook error:", err);
    return NextResponse.json({ error: err.message || "Internal error" }, { status: 500 });
  }
}
