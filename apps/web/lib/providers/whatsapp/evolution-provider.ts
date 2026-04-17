import type { WhatsAppProvider, WebhookMessageEvent } from "./base";
import type { Channel } from "@/types/channel";

export const evolutionProvider: WhatsAppProvider = {
  name: "whatsapp_evolution",

  async sendMessage({ channel, to, text }) {
    const apiKey = channel.credentials.api_key;
    const baseUrl = channel.config.base_url?.replace(/\/$/, "");
    const instanceName = channel.config.instance_name;

    if (!apiKey || !baseUrl || !instanceName) {
      throw new Error("Missing Evolution credentials or config");
    }

    const url = `${baseUrl}/message/sendText/${instanceName}`;

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: apiKey,
      },
      body: JSON.stringify({ number: to, text: text || "" }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || "Evolution API error");
    }

    return {
      externalId: data.key?.id || data.messageId || "",
      status: "sent",
    };
  },

  parseWebhook(payload): WebhookMessageEvent | null {
    try {
      const p = payload as Record<string, unknown>;

      // Evolution envia eventos como "messages.upsert"
      const data = p.data as Record<string, unknown>;
      const message = (data?.message as Record<string, unknown>) || p;
      const key = (message?.key as Record<string, unknown>) || (data?.key as Record<string, unknown>);
      const messageContent = message?.message as Record<string, unknown>;
      const conversation = messageContent?.conversation as Record<string, string>;

      const from = String(key?.remoteJid || "").split("@")[0];

      return {
        externalMessageId: String(key?.id || ""),
        from,
        to: String(data?.instanceId || ""),
        text: conversation?.text || (messageContent?.extendedTextMessage as Record<string, string>)?.text,
        timestamp: Number(message?.messageTimestamp || Date.now() / 1000),
        type: "text",
        metadata: { raw: p },
      };
    } catch {
      return null;
    }
  },
};
