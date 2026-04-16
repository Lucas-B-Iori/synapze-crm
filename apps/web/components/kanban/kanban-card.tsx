"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Phone, Mail } from "lucide-react";
import type { PipelineCard } from "@/types/pipeline";

interface KanbanCardProps {
  card: PipelineCard;
}

export function KanbanCard({ card }: KanbanCardProps) {
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
      {...attributes}
      {...listeners}
      className="cursor-grab rounded-lg border border-border bg-card p-3 shadow-sm transition-shadow hover:shadow-md active:cursor-grabbing"
    >
      <p className="font-medium text-sm">{card.contact?.full_name || "Sem nome"}</p>
      <div className="mt-2 flex flex-col gap-1 text-muted-foreground">
        {card.contact?.email && (
          <span className="flex items-center gap-1 text-xs">
            <Mail className="h-3 w-3" />
            {card.contact.email}
          </span>
        )}
        {card.contact?.phone && (
          <span className="flex items-center gap-1 text-xs">
            <Phone className="h-3 w-3" />
            {card.contact.phone}
          </span>
        )}
      </div>
      {card.notes && (
        <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">
          {card.notes}
        </p>
      )}
    </div>
  );
}
