"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Phone, Mail, MessageSquare, Trash2, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import { AvatarFallback } from "@/components/ui/avatar-fallback";
import type { PipelineCard } from "@/types/pipeline";

interface KanbanCardProps {
  card: PipelineCard;
  onDelete?: (id: string) => void;
}

export function KanbanCard({ card, onDelete }: KanbanCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: card.id, data: { type: "card", card } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group relative cursor-grab rounded-xl border border-zinc-800 bg-zinc-900/70 p-3 shadow-sm transition-all duration-200",
        "hover:border-indigo-500/30 hover:bg-zinc-800/70 hover:shadow-md",
        "active:cursor-grabbing"
      )}
    >
      {/* Drag handle indicator on hover */}
      <div
        {...attributes}
        {...listeners}
        className="absolute left-1 top-1/2 -translate-y-1/2 cursor-grab p-1 text-zinc-600 opacity-0 transition-opacity group-hover:opacity-100"
      >
        <GripVertical className="h-3.5 w-3.5" />
      </div>

      {/* Quick actions */}
      <div className="absolute right-2 top-2 flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        {onDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(card.id);
            }}
            className="rounded p-1 text-zinc-500 transition-colors hover:bg-red-500/10 hover:text-red-400"
            aria-label="Remover card"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      <div className="pl-3">
        <div className="flex items-start gap-2.5">
          <AvatarFallback
            name={card.contact?.full_name || undefined}
            size="sm"
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-zinc-100">
              {card.contact?.full_name || "Sem nome"}
            </p>
            <div className="mt-1.5 flex flex-col gap-0.5 text-zinc-400">
              {card.contact?.email && (
                <span className="flex items-center gap-1.5 text-[11px]">
                  <Mail className="h-3 w-3 shrink-0 text-zinc-500" />
                  <span className="truncate">{card.contact.email}</span>
                </span>
              )}
              {card.contact?.phone && (
                <span className="flex items-center gap-1.5 text-[11px]">
                  <Phone className="h-3 w-3 shrink-0 text-zinc-500" />
                  <span className="truncate">{card.contact.phone}</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {card.notes && (
          <div className="mt-2 flex items-start gap-1.5 rounded-md bg-zinc-950/50 px-2 py-1.5">
            <MessageSquare className="mt-0.5 h-3 w-3 shrink-0 text-zinc-500" />
            <p className="line-clamp-2 text-[11px] leading-relaxed text-zinc-400">
              {card.notes}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
