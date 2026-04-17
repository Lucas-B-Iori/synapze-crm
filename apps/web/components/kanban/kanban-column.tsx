"use client";

import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { KanbanCard } from "./kanban-card";
import type { PipelineStage, PipelineCard } from "@/types/pipeline";

interface KanbanColumnProps {
  stage: PipelineStage;
  cards: PipelineCard[];
  onAddContact?: (stageId: string) => void;
  onDeleteCard?: (id: string) => void;
}

export function KanbanColumn({ stage, cards, onAddContact, onDeleteCard }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: stage.id,
    data: { type: "stage", stage },
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex h-full max-h-[calc(100vh-200px)] min-w-[280px] max-w-[280px] flex-col rounded-2xl border border-zinc-800 bg-zinc-900/50 shadow-sm transition-colors duration-200",
        isOver && "border-indigo-500/40 bg-indigo-500/5"
      )}
    >
      {/* Header with color strip */}
      <div className="relative overflow-hidden rounded-t-2xl">
        <div
          className="h-1.5 w-full"
          style={{ backgroundColor: stage.color }}
        />
        <div className="flex items-center justify-between px-4 py-3">
          <span className="text-sm font-semibold text-zinc-100">{stage.name}</span>
          <span className="flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-zinc-800 px-1.5 text-[10px] font-medium text-zinc-400">
            {cards.length}
          </span>
        </div>
      </div>

      {/* Cards */}
      <ScrollArea className="flex-1 px-3">
        <SortableContext
          items={cards.map((c) => c.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="flex min-h-[60px] flex-col gap-2 pb-2 pt-1">
            {cards.map((card) => (
              <KanbanCard key={card.id} card={card} onDelete={onDeleteCard} />
            ))}
            {cards.length === 0 && (
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-zinc-800 bg-zinc-950/30 py-8 text-center">
                <p className="text-xs text-zinc-500">Arraste cards aqui</p>
              </div>
            )}
          </div>
        </SortableContext>
      </ScrollArea>

      {/* Footer add button */}
      <div className="border-t border-zinc-800/60 p-2">
        <button
          onClick={() => onAddContact?.(stage.id)}
          className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-zinc-700 bg-zinc-950/30 py-2 text-xs font-medium text-zinc-400 transition-all hover:border-indigo-500/40 hover:bg-indigo-500/5 hover:text-indigo-300"
        >
          <Plus className="h-3.5 w-3.5" />
          Adicionar contato
        </button>
      </div>
    </div>
  );
}
