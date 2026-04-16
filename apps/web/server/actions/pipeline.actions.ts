"use server";

import { revalidatePath } from "next/cache";
import {
  getPipelinesForWorkspace,
  getPipelineForProfile,
  createPipeline,
  createPipelineStage,
  createPipelineCard,
  moveCard,
  updateCardPositions,
  deletePipelineCard,
  ensureDefaultPipeline,
} from "@/server/services/pipeline.service";

export async function fetchPipelinesForWorkspace(workspaceId: string) {
  return getPipelinesForWorkspace(workspaceId);
}

export async function fetchPipelineForProfile(workspaceId: string, profileId: string) {
  return getPipelineForProfile(workspaceId, profileId);
}

export async function addPipeline(workspaceId: string, profileId: string, name: string) {
  const result = await createPipeline(workspaceId, profileId, name);
  if (!result.error) revalidatePath("/dashboard/kanban");
  return result;
}

export async function addPipelineStage(pipelineId: string, name: string, color: string, orderIndex: number) {
  const result = await createPipelineStage(pipelineId, name, color, orderIndex);
  if (!result.error) revalidatePath("/dashboard/kanban");
  return result;
}

export async function addPipelineCard(
  pipelineId: string,
  stageId: string,
  contactId: string,
  position?: number,
  notes?: string
) {
  const result = await createPipelineCard(pipelineId, stageId, contactId, position, notes);
  if (!result.error) revalidatePath("/dashboard/kanban");
  return result;
}

export async function movePipelineCard(cardId: string, newStageId: string, newPosition: number) {
  return moveCard(cardId, newStageId, newPosition);
}

export async function reorderCards(updates: { id: string; position: number; stage_id: string }[]) {
  return updateCardPositions(updates);
}

export async function removePipelineCard(cardId: string) {
  const result = await deletePipelineCard(cardId);
  if (!result.error) revalidatePath("/dashboard/kanban");
  return result;
}

export async function setupDefaultPipeline(workspaceId: string, profileId: string) {
  return ensureDefaultPipeline(workspaceId, profileId);
}
