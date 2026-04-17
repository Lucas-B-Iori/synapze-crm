"use server";

import { revalidatePath } from "next/cache";
import {
  listChannelsForWorkspace,
  listChannelsWithAssignments,
  createChannel,
  updateChannel,
  deleteChannel,
} from "@/server/services/channel.service";
import type { Channel } from "@/types/channel";

export async function fetchChannelsForWorkspace(workspaceId: string) {
  return listChannelsForWorkspace(workspaceId);
}

export async function fetchChannelsWithAssignments(workspaceId: string) {
  return listChannelsWithAssignments(workspaceId);
}

export async function addChannel(
  workspaceId: string,
  payload: Omit<Channel, "id" | "workspace_id" | "created_at" | "updated_at">
) {
  const result = await createChannel(workspaceId, payload);
  if (!result.error) revalidatePath("/dashboard/settings/channels");
  return result;
}

export async function editChannel(
  channelId: string,
  payload: Partial<Omit<Channel, "id" | "workspace_id" | "created_at" | "updated_at">>
) {
  const result = await updateChannel(channelId, payload);
  if (!result.error) revalidatePath("/dashboard/settings/channels");
  return result;
}

export async function removeChannel(channelId: string) {
  const result = await deleteChannel(channelId);
  if (!result.error) revalidatePath("/dashboard/settings/channels");
  return result;
}
