"use client";

import { useState, useCallback, useMemo } from "react";
import {
  DndContext,
  type DragEndEvent,
  type DragOverEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { KanbanColumn } from "./kanban-column";
import { movePipelineCard, reorderCards } from "@/server/actions/pipeline.actions";
import type { PipelineWithStages, PipelineCard, PipelineStage } from "@/types/pipeline";

interface KanbanBoardProps {
  initialPipeline: PipelineWithStages;
  workspaceId: string;
  userId: string;
}

export function KanbanBoard({ initialPipeline }: KanbanBoardProps) {
  const [pipeline, setPipeline] = useState<PipelineWithStages>(initialPipeline);

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

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over) return;

      const activeId = active.id as string;
      const overId = over.id as string;

      // Encontrar o card ativo
      const activeCard = pipeline.cards.find((c) => c.id === activeId);
      if (!activeCard) return;

      // Determinar se dropped em outro card ou em uma coluna
      const overCard = pipeline.cards.find((c) => c.id === overId);

      let targetStageId = activeCard.stage_id;
      let newIndex = 0;

      if (overCard) {
        targetStageId = overCard.stage_id;
        const stageCards = cardsByStage[targetStageId];
        const overIndex = stageCards.findIndex((c) => c.id === overId);
        const activeIndex = stageCards.findIndex((c) => c.id === activeId);

        if (targetStageId === activeCard.stage_id) {
          // Mesma coluna
          if (activeIndex === overIndex) return;
          newIndex = overIndex;
        } else {
          // Coluna diferente
          newIndex = overIndex;
        }
      } else {
        // Dropped em uma coluna vazia
        targetStageId = overId;
        newIndex = cardsByStage[targetStageId]?.length || 0;
      }

      // Atualizar estado local (Optimistic UI)
      setPipeline((prev) => {
        const updatedCards = prev.cards.map((c) => {
          if (c.id === activeId) {
            return { ...c, stage_id: targetStageId, position: newIndex };
          }
          return c;
        });

        // Reordenar cards na stage de destino
        const stageCards = updatedCards
          .filter((c) => c.stage_id === targetStageId)
          .sort((a, b) => {
            if (a.id === activeId) return newIndex;
            if (b.id === activeId) return -newIndex;
            return a.position - b.position;
          });

        // Atribuir novas posições sequenciais
        stageCards.forEach((c, idx) => {
          const card = updatedCards.find((x) => x.id === c.id);
          if (card) card.position = idx;
        });

        return { ...prev, cards: updatedCards };
      });

      // Persistir no servidor
      try {
        await movePipelineCard(activeId, targetStageId, newIndex);
        // Opcional: sincronizar todas as posições da coluna
        const stageCards = cardsByStage[targetStageId];
        const updates = stageCards.map((c, idx) => ({
          id: c.id,
          stage_id: targetStageId,
          position: idx,
        }));
        await reorderCards(updates);
      } catch (err) {
        console.error("Erro ao mover card:", err);
        // Rollback não implementado por simplicidade; idealmente recarregaríamos o pipeline
      }
    },
    [pipeline.cards, cardsByStage]
  );

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragEnd={handleDragEnd}
    >
      <div className="flex h-full gap-4">
        {pipeline.stages.map((stage) => (
          <KanbanColumn
            key={stage.id}
            stage={stage}
            cards={cardsByStage[stage.id] || []}
          />
        ))}
      </div>
    </DndContext>
  );
}
