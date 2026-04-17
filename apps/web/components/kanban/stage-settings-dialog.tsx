"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Settings, Plus, Trash2, ArrowUp, ArrowDown, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  editPipelineStage,
  removePipelineStage,
  reorderStages,
  addPipelineStage,
} from "@/server/actions/pipeline.actions";
import { toast } from "sonner";
import type { PipelineStage } from "@/types/pipeline";

const colorSwatches = [
  "#6366F1", "#F59E0B", "#10B981", "#22C55E", "#EF4444",
  "#EC4899", "#8B5CF6", "#06B6D4", "#14B8A6", "#84CC16",
];

interface StageSettingsDialogProps {
  pipelineId: string;
  stages: PipelineStage[];
  onChange: (stages: PipelineStage[]) => void;
}

export function StageSettingsDialog({ pipelineId, stages, onChange }: StageSettingsDialogProps) {
  const [open, setOpen] = useState(false);
  const [localStages, setLocalStages] = useState<PipelineStage[]>(stages);
  const [saving, setSaving] = useState(false);

  // Keep localStages in sync when dialog opens
  const handleOpen = (val: boolean) => {
    setOpen(val);
    if (val) setLocalStages(stages);
  };

  function updateLocal(index: number, patch: Partial<PipelineStage>) {
    setLocalStages((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], ...patch };
      return next;
    });
  }

  function move(index: number, direction: -1 | 1) {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= localStages.length) return;
    setLocalStages((prev) => {
      const next = [...prev];
      const [item] = next.splice(index, 1);
      next.splice(newIndex, 0, item);
      return next.map((s, i) => ({ ...s, order_index: i }));
    });
  }

  async function handleSave() {
    setSaving(true);
    // Persist name/color changes
    for (const stage of localStages) {
      const original = stages.find((s) => s.id === stage.id);
      if (
        original &&
        (original.name !== stage.name || original.color !== stage.color)
      ) {
        await editPipelineStage(stage.id, { name: stage.name, color: stage.color });
      }
    }
    // Persist reorder
    const reordered = localStages.some(
      (s, i) => stages.find((os) => os.id === s.id)?.order_index !== i
    );
    if (reordered) {
      await reorderStages(localStages.map((s, i) => ({ id: s.id, order_index: i })));
    }
    setSaving(false);
    onChange(localStages);
    setOpen(false);
    toast.success("Funil atualizado");
  }

  async function handleAdd() {
    const color = colorSwatches[Math.floor(Math.random() * colorSwatches.length)];
    const orderIndex = localStages.length;
    const result = await addPipelineStage(pipelineId, `Nova Etapa ${orderIndex + 1}`, color, orderIndex);
    if (result.data) {
      setLocalStages((prev) => [...prev, result.data as PipelineStage]);
      toast.success("Etapa adicionada");
    } else {
      toast.error(result.error || "Erro ao adicionar etapa");
    }
  }

  async function handleDelete(stageId: string) {
    const result = await removePipelineStage(stageId);
    if (!result.error) {
      setLocalStages((prev) => prev.filter((s) => s.id !== stageId).map((s, i) => ({ ...s, order_index: i })));
      toast.success("Etapa removida");
    } else {
      toast.error(result.error || "Erro ao remover etapa");
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 border-zinc-700 bg-zinc-800/60 text-zinc-100 hover:bg-zinc-700/60"
        >
          <Settings className="h-4 w-4" />
          Configurar funil
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md border-zinc-700/60 bg-zinc-900/95 backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle className="text-zinc-100">Configurar funil</DialogTitle>
        </DialogHeader>

        <div className="mt-2 space-y-3">
          {localStages.map((stage, idx) => (
            <motion.div
              key={stage.id}
              layout
              className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-3"
            >
              <div className="flex items-center gap-2">
                <Input
                  value={stage.name}
                  onChange={(e) => updateLocal(idx, { name: e.target.value })}
                  className="h-9 flex-1 border-zinc-700 bg-zinc-900 text-sm text-zinc-100 focus-visible:ring-indigo-500/40"
                />
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => move(idx, -1)}
                    disabled={idx === 0}
                    className="rounded p-1.5 text-zinc-400 transition-colors hover:bg-zinc-800 disabled:opacity-30"
                  >
                    <ArrowUp className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => move(idx, 1)}
                    disabled={idx === localStages.length - 1}
                    className="rounded p-1.5 text-zinc-400 transition-colors hover:bg-zinc-800 disabled:opacity-30"
                  >
                    <ArrowDown className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(stage.id)}
                    className="rounded p-1.5 text-zinc-400 transition-colors hover:bg-red-500/10 hover:text-red-400"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {colorSwatches.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => updateLocal(idx, { color: c })}
                    className={`h-5 w-5 rounded-full border-2 transition-transform hover:scale-110 ${
                      stage.color === c ? "border-white" : "border-transparent"
                    }`}
                    style={{ backgroundColor: c }}
                    aria-label={`Cor ${c}`}
                  />
                ))}
              </div>
            </motion.div>
          ))}
        </div>

        <Button
          variant="outline"
          className="w-full gap-2 border-dashed border-zinc-700 bg-zinc-950/30 text-zinc-300 hover:border-indigo-500/40 hover:bg-indigo-500/5 hover:text-indigo-300"
          onClick={handleAdd}
        >
          <Plus className="h-4 w-4" />
          Adicionar coluna
        </Button>

        <div className="flex justify-end gap-2 pt-2">
          <Button
            variant="ghost"
            className="text-zinc-300 hover:bg-zinc-800/60 hover:text-zinc-100"
            onClick={() => setOpen(false)}
          >
            Cancelar
          </Button>
          <Button
            className="bg-indigo-600 text-white hover:bg-indigo-500 btn-glow"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? "Salvando..." : "Salvar alterações"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
