import { describe, it, expect } from "vitest";
import { computeDragResult } from "@/components/kanban/kanban-logic";
import type { PipelineWithStages } from "@/types/pipeline";

function makePipeline(): PipelineWithStages {
  return {
    id: "pipeline-1",
    workspace_id: "ws-1",
    profile_id: "user-1",
    name: "Funil",
    created_at: new Date().toISOString(),
    stages: [
      { id: "stage-a", pipeline_id: "pipeline-1", name: "Novo Lead", color: "#6366F1", order_index: 0 },
      { id: "stage-b", pipeline_id: "pipeline-1", name: "Em Atendimento", color: "#F59E0B", order_index: 1 },
    ],
    cards: [
      { id: "card-1", pipeline_id: "pipeline-1", stage_id: "stage-a", contact_id: "c1", position: 0, notes: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { id: "card-2", pipeline_id: "pipeline-1", stage_id: "stage-a", contact_id: "c2", position: 1, notes: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { id: "card-3", pipeline_id: "pipeline-1", stage_id: "stage-b", contact_id: "c3", position: 0, notes: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    ],
  };
}

describe("computeDragResult", () => {
  it("returns null when dropped on the same position", () => {
    const pipeline = makePipeline();
    const result = computeDragResult(pipeline, "card-1", "card-1");
    expect(result).toBeNull();
  });

  it("moves card down within the same stage", () => {
    const pipeline = makePipeline();
    const result = computeDragResult(pipeline, "card-1", "card-2");
    expect(result).not.toBeNull();
    expect(result!.targetStageId).toBe("stage-a");
    expect(result!.newIndex).toBe(1);

    const stageACards = result!.pipeline.cards
      .filter((c) => c.stage_id === "stage-a")
      .sort((a, b) => a.position - b.position);
    expect(stageACards.map((c) => c.id)).toEqual(["card-2", "card-1"]);
    expect(stageACards[0].position).toBe(0);
    expect(stageACards[1].position).toBe(1);
  });

  it("moves card to another stage over a card", () => {
    const pipeline = makePipeline();
    const result = computeDragResult(pipeline, "card-1", "card-3");
    expect(result).not.toBeNull();
    expect(result!.targetStageId).toBe("stage-b");
    expect(result!.newIndex).toBe(0);

    const stageBCards = result!.pipeline.cards
      .filter((c) => c.stage_id === "stage-b")
      .sort((a, b) => a.position - b.position);
    expect(stageBCards.map((c) => c.id)).toEqual(["card-1", "card-3"]);
    expect(stageBCards[0].position).toBe(0);
    expect(stageBCards[1].position).toBe(1);

    const stageACards = result!.pipeline.cards
      .filter((c) => c.stage_id === "stage-a")
      .sort((a, b) => a.position - b.position);
    expect(stageACards.map((c) => c.id)).toEqual(["card-2"]);
    expect(stageACards[0].position).toBe(0);
  });

  it("moves card to an empty stage (column drop)", () => {
    const pipeline = makePipeline();
    // Create a new empty stage
    pipeline.stages.push({
      id: "stage-c",
      pipeline_id: "pipeline-1",
      name: "Fechado",
      color: "#22C55E",
      order_index: 2,
    });

    const result = computeDragResult(pipeline, "card-1", "stage-c");
    expect(result).not.toBeNull();
    expect(result!.targetStageId).toBe("stage-c");
    expect(result!.newIndex).toBe(0);

    const stageCCards = result!.pipeline.cards.filter((c) => c.stage_id === "stage-c");
    expect(stageCCards.map((c) => c.id)).toEqual(["card-1"]);
    expect(stageCCards[0].position).toBe(0);
  });

  it("returns correct updates array", () => {
    const pipeline = makePipeline();
    const result = computeDragResult(pipeline, "card-2", "card-1");
    expect(result).not.toBeNull();
    expect(result!.updates).toEqual([
      { id: "card-2", stage_id: "stage-a", position: 0 },
      { id: "card-1", stage_id: "stage-a", position: 1 },
    ]);
  });
});
