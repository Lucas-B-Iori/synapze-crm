import type { Channel } from "@/types/channel";

export type WebhookMessageType = "text" | "image" | "document" | "audio";

export interface WebhookMessageEvent {
  externalMessageId?: string;
  from: string;
  to: string;
  text?: string;
  timestamp: number;
  type: WebhookMessageType;
  metadata: Record<string, unknown>;
}

export interface WhatsAppProvider {
  name: string;
  sendMessage(params: {
    channel: Channel;
    to: string;
    text?: string;
    mediaUrl?: string;
  }): Promise<{ externalId: string; status?: string }>;
  parseWebhook(payload: unknown): WebhookMessageEvent | null;
}
