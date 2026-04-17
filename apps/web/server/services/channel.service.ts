"use server";

import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/types/workspace";
import type { Channel, ChannelAssignment } from "@/types/channel";

export async function listChannelsForWorkspace(
  workspaceId: string
): Promise<ActionResult<Channel[]>> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("channels")
    .select("*")
    .eq("workspace_id", workspaceId)
    .eq("is_active", true)
    .order("created_at", { ascending: true });

  if (error) {
    return { error: error.message };
  }

  return { data: (data || []) as Channel[] };
}

export async function listChannelsWithAssignments(
  workspaceId: string
): Promise<ActionResult<(Channel & { assignments: ChannelAssignment[] })[]>> {
  const supabase = await createClient();

  const { data: channels, error } = await supabase
    .from("channels")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: true });

  if (error) {
    return { error: error.message };
  }

  const result: (Channel & { assignments: ChannelAssignment[] })[] = [];

  for (const ch of channels || []) {
    const { data: assignments } = await supabase
      .from("channel_assignments")
      .select("*")
      .eq("channel_id", ch.id);

    result.push({
      ...(ch as Channel),
      assignments: (assignments || []) as ChannelAssignment[],
    });
  }

  return { data: result };
}

export async function createChannel(
  workspaceId: string,
  payload: Omit<Channel, "id" | "workspace_id" | "created_at" | "updated_at">
): Promise<ActionResult<Channel>> {
  const supabase = await createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError || !userData.user) {
    return { error: "Usuário não autenticado" };
  }

  // Verificar permissão
  const { data: membership } = await supabase
    .from("workspace_members")
    .select("role")
    .eq("workspace_id", workspaceId)
    .eq("profile_id", userData.user.id)
    .eq("status", "active")
    .single();

  if (!membership || !["owner", "manager"].includes(membership.role)) {
    return { error: "Sem permissão para criar canais" };
  }

  const { data, error } = await supabase
    .from("channels")
    .insert({
      workspace_id: workspaceId,
      name: payload.name,
      provider: payload.provider,
      credentials: payload.credentials,
      config: payload.config,
      is_active: payload.is_active,
    })
    .select()
    .single();

  if (error || !data) {
    return { error: error?.message || "Erro ao criar canal" };
  }

  return { data: data as Channel };
}

export async function updateChannel(
  channelId: string,
  payload: Partial<Omit<Channel, "id" | "workspace_id" | "created_at" | "updated_at">>
): Promise<ActionResult<Channel>> {
  const supabase = await createClient();

  const { data: channel, error: findError } = await supabase
    .from("channels")
    .select("workspace_id")
    .eq("id", channelId)
    .single();

  if (findError || !channel) {
    return { error: findError?.message || "Canal não encontrado" };
  }

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    return { error: "Usuário não autenticado" };
  }

  const { data: membership } = await supabase
    .from("workspace_members")
    .select("role")
    .eq("workspace_id", channel.workspace_id)
    .eq("profile_id", userData.user.id)
    .eq("status", "active")
    .single();

  if (!membership || !["owner", "manager"].includes(membership.role)) {
    return { error: "Sem permissão" };
  }

  const { data, error } = await supabase
    .from("channels")
    .update({
      ...payload,
      updated_at: new Date().toISOString(),
    })
    .eq("id", channelId)
    .select()
    .single();

  if (error || !data) {
    return { error: error?.message || "Erro ao atualizar canal" };
  }

  return { data: data as Channel };
}

export async function deleteChannel(channelId: string): Promise<ActionResult<null>> {
  const supabase = await createClient();

  const { data: channel, error: findError } = await supabase
    .from("channels")
    .select("workspace_id")
    .eq("id", channelId)
    .single();

  if (findError || !channel) {
    return { error: findError?.message || "Canal não encontrado" };
  }

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    return { error: "Usuário não autenticado" };
  }

  const { data: membership } = await supabase
    .from("workspace_members")
    .select("role")
    .eq("workspace_id", channel.workspace_id)
    .eq("profile_id", userData.user.id)
    .eq("status", "active")
    .single();

  if (!membership || !["owner", "manager"].includes(membership.role)) {
    return { error: "Sem permissão" };
  }

  const { error } = await supabase.from("channels").delete().eq("id", channelId);

  if (error) {
    return { error: error.message };
  }

  return { data: null };
}
