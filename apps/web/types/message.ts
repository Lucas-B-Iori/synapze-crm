export type MessageProvider = "whatsapp_meta" | "whatsapp_evolution" | "email_resend";
export type MessageDirection = "inbound" | "outbound";
export type MessageStatus = "pending" | "sent" | "delivered" | "read" | "failed";

export interface Message {
  id: string;
  workspace_id: string;
  contact_id: string;
  channel_id: string | null;
  profile_id: string | null;
  direction: MessageDirection;
  provider: MessageProvider;
  content: string;
  metadata: Record<string, unknown>;
  status: MessageStatus;
  external_id: string | null;
  sent_at: string | null;
  created_at: string;
  profile?: {
    id: string;
    full_name: string | null;
  } | null;
}
