"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ChevronsUpDown, Plus, Briefcase } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { createWorkspace } from "@/server/actions/workspace.actions";
import { toast } from "sonner";
import type { WorkspaceWithMembers } from "@/types/workspace";

interface WorkspaceSwitcherProps {
  workspaces: WorkspaceWithMembers[];
  activeWorkspace?: WorkspaceWithMembers | null;
  onSwitch: (workspaceId: string) => void;
  onCreate?: () => void;
}

const planLabels: Record<string, string> = {
  starter: "Starter",
  pro: "Pro",
  enterprise: "Enterprise",
};

const planVariants: Record<string, string> = {
  starter: "bg-zinc-800 text-zinc-300 border-zinc-700",
  pro: "bg-indigo-500/10 text-indigo-300 border-indigo-500/30",
  enterprise: "bg-amber-500/10 text-amber-300 border-amber-500/30",
};

export function WorkspaceSwitcher({
  workspaces,
  activeWorkspace,
  onSwitch,
  onCreate,
}: WorkspaceSwitcherProps) {
  const [open, setOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState("");
  const [creating, setCreating] = useState(false);

  async function handleCreateWorkspace(e: React.FormEvent) {
    e.preventDefault();
    if (!newWorkspaceName.trim()) return;
    setCreating(true);
    const result = await createWorkspace(newWorkspaceName.trim());
    setCreating(false);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Workspace criado com sucesso!");
      setCreateDialogOpen(false);
      setNewWorkspaceName("");
      onCreate?.();
    }
  }

  return (
    <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="h-11 w-full justify-between border-zinc-700/60 bg-zinc-900/60 px-3 text-left font-normal text-zinc-100 backdrop-blur-md hover:border-zinc-600 hover:bg-zinc-800/60"
          >
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-indigo-500/15 text-indigo-400">
                <Briefcase className="h-3.5 w-3.5" />
              </div>
              <div className="flex flex-col">
                <span className="truncate text-sm font-medium">
                  {activeWorkspace?.name || "Selecionar workspace..."}
                </span>
                {activeWorkspace && (
                  <span className="text-[10px] text-zinc-500">
                    {planLabels[activeWorkspace.plan_tier] || activeWorkspace.plan_tier}
                  </span>
                )}
              </div>
            </div>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 text-zinc-500" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-72 p-0 border-zinc-700/60 bg-zinc-900/95 backdrop-blur-xl">
          <Command className="bg-transparent">
            <CommandInput placeholder="Buscar workspace..." className="text-zinc-100" />
            <CommandList>
              <CommandEmpty className="py-3 text-center text-sm text-zinc-500">
                Nenhum workspace encontrado.
              </CommandEmpty>
              <CommandGroup>
                {workspaces.map((ws) => (
                  <CommandItem
                    key={ws.id}
                    value={ws.id}
                    onSelect={() => {
                      onSwitch(ws.id);
                      setOpen(false);
                      toast.success(`Workspace alterado para ${ws.name}`);
                    }}
                    className="cursor-pointer data-[selected=true]:bg-zinc-800/60"
                  >
                    <div className="flex w-full items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Check
                          className={cn(
                            "h-4 w-4 text-indigo-400",
                            activeWorkspace?.id === ws.id ? "opacity-100" : "opacity-0"
                          )}
                        />
                        <span className="truncate text-sm text-zinc-200">{ws.name}</span>
                      </div>
                      <Badge
                        variant="outline"
                        className={cn("text-[10px] h-5", planVariants[ws.plan_tier])}
                      >
                        {planLabels[ws.plan_tier] || ws.plan_tier}
                      </Badge>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
              <CommandSeparator />
              <CommandGroup>
                <DialogTrigger asChild>
                  <CommandItem
                    onSelect={() => {
                      setOpen(false);
                      setCreateDialogOpen(true);
                    }}
                    className="cursor-pointer text-indigo-300 data-[selected=true]:bg-zinc-800/60"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Criar workspace
                  </CommandItem>
                </DialogTrigger>
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      <DialogContent className="border-zinc-700/60 bg-zinc-900/95 backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle className="text-zinc-100">Criar novo workspace</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleCreateWorkspace} className="space-y-4 pt-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-zinc-300">Nome do workspace</label>
            <Input
              placeholder="Ex: Clínica Saúde Total"
              value={newWorkspaceName}
              onChange={(e) => setNewWorkspaceName(e.target.value)}
              required
              className="border-zinc-700 bg-zinc-950 text-zinc-100 focus-visible:ring-indigo-500/40"
            />
          </div>
          <Button
            type="submit"
            className="w-full bg-indigo-600 text-white hover:bg-indigo-500 btn-glow"
            disabled={creating}
          >
            {creating ? "Criando..." : "Criar workspace"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
