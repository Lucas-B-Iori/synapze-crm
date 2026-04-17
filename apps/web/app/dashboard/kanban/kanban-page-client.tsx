"use client";

import { useState } from "react";
import { Columns } from "lucide-react";
import { KanbanBoard } from "@/components/kanban/kanban-board";
import { StageSettingsDialog } from "@/components/kanban/stage-settings-dialog";
import { QuickAddContactModal } from "@/components/kanban/quick-add-contact-modal";
import { SlideUp } from "@/components/motion/slide-up";
import type { PipelineWithStages } from "@/types/pipeline";

interface KanbanPageClientProps {
  initialPipeline: PipelineWithStages | null;
  workspaceId: string;
  userId: string;
}

export function KanbanPageClient({ initialPipeline, workspaceId, userId }: KanbanPageClientProps) {
  const [pipeline, setPipeline] = useState<PipelineWithStages | null>(initialPipeline);
  const [quickAddStageId, setQuickAddStageId] = useState<string | null>(null);

  if (!pipeline) {
    return (
      <div className="flex h-full flex-col p-6">
        <SlideUp>
          <div className="mb-4">
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-100">Kanban</h1>
            <p className="text-zinc-400">Gerencie seus leads e acompanhe o funil de vendas.</p>
          </div>
        </SlideUp>
        <div className="flex flex-1 flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/30 p-12 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-800/60 text-zinc-500">
            <Columns className="h-7 w-7" />
          </div>
          <p className="mt-4 text-zinc-300">Nenhum pipeline disponível.</p>
          <p className="text-sm text-zinc-500">
            Crie um contato e adicione-o ao funil para começar.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col p-6">
      {/* Header */}
      <SlideUp>
        <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-100">Funil de Vendas</h1>
            <p className="text-sm text-zinc-400">
              Gerencie seus leads e acompanhe cada etapa do funil.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <StageSettingsDialog
              pipelineId={pipeline.id}
              stages={pipeline.stages}
              onChange={(updatedStages) =>
                setPipeline((prev) => (prev ? { ...prev, stages: updatedStages } : prev))
              }
            />
          </div>
        </div>
      </SlideUp>

      {/* Board */}
      <div className="flex-1 overflow-x-auto">
        <KanbanBoard
          initialPipeline={pipeline}
          workspaceId={workspaceId}
          userId={userId}
          onAddContact={(stageId) => setQuickAddStageId(stageId)}
        />
      </div>

      <QuickAddContactModal
        open={!!quickAddStageId}
        onClose={() => setQuickAddStageId(null)}
        workspaceId={workspaceId}
        pipelineId={pipeline.id}
        stageId={quickAddStageId || ""}
        onCreated={(contact) => {
          if (!quickAddStageId || !pipeline) return;
          const stageId = quickAddStageId;
          const optimisticCard = {
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
          setPipeline({
            ...pipeline,
            cards: [
              optimisticCard,
              ...pipeline.cards
                .filter((c) => c.stage_id === stageId)
                .map((c) => ({ ...c, position: c.position + 1 })),
              ...pipeline.cards.filter((c) => c.stage_id !== stageId),
            ],
          });
          setQuickAddStageId(null);
        }}
      />
    </div>
  );
}
