"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import {
  DndContext,
  type DragEndEvent,
  type DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  DragOverlay,
} from "@dnd-kit/core";
import { KanbanColumn } from "./kanban-column";
import { KanbanCard } from "./kanban-card";
import { computeDragResult } from "./kanban-logic";
import { movePipelineCard, reorderCards, removePipelineCard } from "@/server/actions/pipeline.actions";
import type { PipelineWithStages, PipelineCard } from "@/types/pipeline";
import type { Contact } from "@/types/contact";

interface KanbanBoardProps {
  initialPipeline: PipelineWithStages;
  workspaceId: string;
  userId: string;
  onAddContact: (stageId: string) => void;
  onStagesChange?: (stages: PipelineWithStages["stages"]) => void;
}

export function KanbanBoard({ initialPipeline, onAddContact }: KanbanBoardProps) {
  const [pipeline, setPipeline] = useState<PipelineWithStages>(initialPipeline);
  const [activeCard, setActiveCard] = useState<PipelineCard | null>(null);

  // Keep pipeline in sync if prop changes (e.g. after stage settings update)
  useEffect(() => {
    setPipeline(initialPipeline);
  }, [initialPipeline]);

  const cardsByStage = useMemo(() => {
    const map: Record<string, PipelineCard[]> = {};
    for (const stage of pipeline.stages) {
      map[stage.id] = pipeline.cards
        .filter((c) => c.stage_id === stage.id)
        .sort((a, b) => a.position - b.position);
    }
    return map;
  }, [pipeline]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const card = pipeline.cards.find((c) => c.id === event.active.id);
    if (card) setActiveCard(card);
  }, [pipeline.cards]);

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      setActiveCard(null);
      const { active, over } = event;
      if (!over) return;

      const activeId = active.id as string;
      const overId = over.id as string;

      const result = computeDragResult(pipeline, activeId, overId);
      if (!result) return;

      const previousPipeline = pipeline;
      setPipeline(result.pipeline);

      try {
        await movePipelineCard(activeId, result.targetStageId, result.newIndex);
        if (result.updates.length > 0) {
          await reorderCards(result.updates);
        }
      } catch (err) {
        console.error("Erro ao mover card:", err);
        setPipeline(previousPipeline);
      }
    },
    [pipeline]
  );

  async function handleDeleteCard(cardId: string) {
    const previousPipeline = pipeline;
    setPipeline((prev) => ({
      ...prev,
      cards: prev.cards.filter((c) => c.id !== cardId),
    }));
    const result = await removePipelineCard(cardId);
    if (result.error) {
      setPipeline(previousPipeline);
    }
  }

  // Optimistically add a card from quick-add
  function handleQuickAddCard(contact: Contact, stageId: string) {
    const optimisticCard: PipelineCard = {
      id: `temp-${Date.now()}`,
      pipeline_id: pipeline.id,
      stage_id: stageId,
      contact_id: contact.id,
      position: 0,
      notes: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      contact: {
        id: contact.id,
        full_name: contact.full_name,
        email: contact.email || null,
        phone: contact.phone || null,
      },
    };
    setPipeline((prev) => {
      const updated = prev.cards.map((c) =>
        c.stage_id === stageId ? { ...c, position: c.position + 1 } : c
      );
      return { ...prev, cards: [optimisticCard, ...updated] };
    });
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex h-full gap-4">
        {pipeline.stages.map((stage) => (
          <KanbanColumn
            key={stage.id}
            stage={stage}
            cards={cardsByStage[stage.id] || []}
            onAddContact={onAddContact}
            onDeleteCard={handleDeleteCard}
          />
        ))}
      </div>
      <DragOverlay dropAnimation={{ duration: 200, easing: "cubic-bezier(0.16, 1, 0.3, 1)" }}>
        {activeCard ? (
          <div className="rotate-2 scale-105 cursor-grabbing">
            <KanbanCard card={activeCard} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
