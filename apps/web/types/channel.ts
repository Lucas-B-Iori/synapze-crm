export type ChannelProvider = "whatsapp_meta" | "whatsapp_evolution" | "email_resend";

export interface Channel {
  id: string;
  workspace_id: string;
  name: string;
  provider: ChannelProvider;
  credentials: Record<string, string>;
  config: Record<string, string>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ChannelAssignment {
  id: string;
  channel_id: string;
  workspace_member_id: string;
  created_at: string;
}
