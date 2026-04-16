"use client";

import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { KanbanCard } from "./kanban-card";
import type { PipelineStage, PipelineCard } from "@/types/pipeline";

interface KanbanColumnProps {
  stage: PipelineStage;
  cards: PipelineCard[];
}

export function KanbanColumn({ stage, cards }: KanbanColumnProps) {
  const { setNodeRef } = useDroppable({
    id: stage.id,
    data: { type: "stage", stage },
  });

  return (
    <div
      ref={setNodeRef}
      className="flex h-full min-w-[260px] max-w-[260px] flex-col rounded-xl border border-border bg-card/50"
    >
      <div
        className="flex items-center justify-between border-b border-border px-4 py-3"
        style={{ borderBottomColor: stage.color }}
      >
        <span className="font-medium text-sm">{stage.name}</span>
        <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium">
          {cards.length}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        <SortableContext
          items={cards.map((c) => c.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="flex flex-col gap-2">
            {cards.map((card) => (
              <KanbanCard key={card.id} card={card} />
            ))}
          </div>
        </SortableContext>
      </div>
    </div>
  );
}
