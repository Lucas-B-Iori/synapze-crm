"use server";

import { createClient } from "@/lib/supabase/server";
import type { Pipeline, PipelineStage, PipelineCard, PipelineWithStages } from "@/types/pipeline";
import type { ActionResult } from "@/types/workspace";

export async function getPipelinesForWorkspace(workspaceId: string): Promise<ActionResult<PipelineWithStages[]>> {
  const supabase = await createClient();

  const { data: pipelines, error } = await supabase
    .from("pipelines")
    .select("*")
    .eq("workspace_id", workspaceId);

  if (error) {
    return { error: error.message };
  }

  const result: PipelineWithStages[] = [];

  for (const pipeline of pipelines || []) {
    const { data: stages } = await supabase
      .from("pipeline_stages")
      .select("*")
      .eq("pipeline_id", pipeline.id)
      .order("order_index", { ascending: true });

    const { data: cards } = await supabase
      .from("pipeline_cards")
      .select(`
        *,
        contact:contacts(id, full_name, email, phone)
      `)
      .eq("pipeline_id", pipeline.id)
      .order("position", { ascending: true });

    result.push({
      ...pipeline,
      stages: stages || [],
      cards: (cards || []) as PipelineCard[],
    });
  }

  return { data: result };
}

export async function getPipelineForProfile(
  workspaceId: string,
  profileId: string
): Promise<ActionResult<PipelineWithStages>> {
  const supabase = await createClient();

  const { data: pipeline, error } = await supabase
    .from("pipelines")
    .select("*")
    .eq("workspace_id", workspaceId)
    .eq("profile_id", profileId)
    .single();

  if (error) {
    return { error: error.message };
  }

  const { data: stages } = await supabase
    .from("pipeline_stages")
    .select("*")
    .eq("pipeline_id", pipeline.id)
    .order("order_index", { ascending: true });

  const { data: cards } = await supabase
    .from("pipeline_cards")
    .select(`
      *,
      contact:contacts(id, full_name, email, phone)
    `)
    .eq("pipeline_id", pipeline.id)
    .order("position", { ascending: true });

  return {
    data: {
      ...pipeline,
      stages: stages || [],
      cards: (cards || []) as PipelineCard[],
    },
  };
}

export async function createPipeline(
  workspaceId: string,
  profileId: string,
  name: string
): Promise<ActionResult<Pipeline>> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("pipelines")
    .insert({ workspace_id: workspaceId, profile_id: profileId, name })
    .select()
    .single();

  if (error || !data) {
    return { error: error?.message || "Erro ao criar pipeline" };
  }

  return { data: data as Pipeline };
}

export async function createPipelineStage(
  pipelineId: string,
  name: string,
  color: string,
  orderIndex: number
): Promise<ActionResult<PipelineStage>> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("pipeline_stages")
    .insert({ pipeline_id: pipelineId, name, color, order_index: orderIndex })
    .select()
    .single();

  if (error || !data) {
    return { error: error?.message || "Erro ao criar stage" };
  }

  return { data: data as PipelineStage };
}

export async function createPipelineCard(
  pipelineId: string,
  stageId: string,
  contactId: string,
  position: number = 0,
  notes?: string
): Promise<ActionResult<PipelineCard>> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("pipeline_cards")
    .insert({
      pipeline_id: pipelineId,
      stage_id: stageId,
      contact_id: contactId,
      position,
      notes: notes || null,
    })
    .select(`
      *,
      contact:contacts(id, full_name, email, phone)
    `)
    .single();

  if (error || !data) {
    return { error: error?.message || "Erro ao criar card" };
  }

  return { data: data as unknown as PipelineCard };
}

export async function moveCard(
  cardId: string,
  newStageId: string,
  newPosition: number
): Promise<ActionResult<PipelineCard>> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("pipeline_cards")
    .update({
      stage_id: newStageId,
      position: newPosition,
      updated_at: new Date().toISOString(),
    })
    .eq("id", cardId)
    .select(`
      *,
      contact:contacts(id, full_name, email, phone)
    `)
    .single();

  if (error || !data) {
    return { error: error?.message || "Erro ao mover card" };
  }

  return { data: data as unknown as PipelineCard };
}

export async function updateCardPositions(
  updates: { id: string; position: number; stage_id: string }[]
): Promise<ActionResult<null>> {
  const supabase = await createClient();

  for (const update of updates) {
    await supabase
      .from("pipeline_cards")
      .update({
        position: update.position,
        stage_id: update.stage_id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", update.id);
  }

  return { data: null };
}

export async function deletePipelineCard(cardId: string): Promise<ActionResult<null>> {
  const supabase = await createClient();
  const { error } = await supabase.from("pipeline_cards").delete().eq("id", cardId);

  if (error) {
    return { error: error.message };
  }

  return { data: null };
}

export async function ensureDefaultPipeline(workspaceId: string, profileId: string): Promise<ActionResult<PipelineWithStages>> {
  const supabase = await createClient();

  const { data: existing, error: existingError } = await supabase
    .from("pipelines")
    .select("*")
    .eq("workspace_id", workspaceId)
    .eq("profile_id", profileId)
    .maybeSingle();

  if (existingError) {
    return { error: existingError.message };
  }

  if (existing) {
    return getPipelineForProfile(workspaceId, profileId);
  }

  const { data: pipeline, error: pipelineError } = await supabase
    .from("pipelines")
    .insert({ workspace_id: workspaceId, profile_id: profileId, name: "Meu Funil" })
    .select()
    .single();

  if (pipelineError || !pipeline) {
    return { error: pipelineError?.message || "Erro ao criar pipeline padrão" };
  }

  const stages = [
    { pipeline_id: pipeline.id, name: "Novo Lead", color: "#6366F1", order_index: 0 },
    { pipeline_id: pipeline.id, name: "Em Atendimento", color: "#F59E0B", order_index: 1 },
    { pipeline_id: pipeline.id, name: "Proposta Enviada", color: "#10B981", order_index: 2 },
    { pipeline_id: pipeline.id, name: "Fechado", color: "#22C55E", order_index: 3 },
  ];

  await supabase.from("pipeline_stages").insert(stages);

  return getPipelineForProfile(workspaceId, profileId);
}
