import type { WhatsAppProvider, WebhookMessageEvent } from "./base";
import type { Channel } from "@/types/channel";

export const metaProvider: WhatsAppProvider = {
  name: "whatsapp_meta",

  async sendMessage({ channel, to, text }) {
    const accessToken = channel.credentials.access_token;
    const phoneNumberId = channel.config.phone_number_id;

    if (!accessToken || !phoneNumberId) {
      throw new Error("Missing Meta credentials or phone_number_id");
    }

    const url = `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`;

    const body = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to,
      type: "text",
      text: { body: text || "" },
    };

    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error?.message || "Meta API error");
    }

    return {
      externalId: data.messages?.[0]?.id || "",
      status: "sent",
    };
  },

  parseWebhook(payload): WebhookMessageEvent | null {
    try {
      const p = payload as Record<string, unknown>;
      const entry = (p.entry as Array<Record<string, unknown>>)?.[0];
      const changes = (entry?.changes as Array<Record<string, unknown>>)?.[0];
      const value = changes?.value as Record<string, unknown>;
      const messages = value?.messages as Array<Record<string, unknown>>;

      if (!messages || messages.length === 0) return null;

      const msg = messages[0];
      const textObj = msg.text as Record<string, string> | undefined;

      return {
        externalMessageId: String(msg.id || ""),
        from: String(msg.from || ""),
        to: String(value?.metadata ? (value.metadata as Record<string, string>).display_phone_number : ""),
        text: textObj?.body,
        timestamp: Number(msg.timestamp || Date.now() / 1000),
        type: (msg.type as WebhookMessageEvent["type"]) || "text",
        metadata: { raw: msg },
      };
    } catch {
      return null;
    }
  },
};
