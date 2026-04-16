"use client";

import { useState } from "react";
import { Check, ChevronsUpDown, Plus } from "lucide-react";
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { createWorkspace } from "@/server/actions/workspace.actions";
import type { WorkspaceWithMembers } from "@/types/workspace";

interface WorkspaceSwitcherProps {
  workspaces: WorkspaceWithMembers[];
  activeWorkspace?: WorkspaceWithMembers | null;
  onSwitch: (workspaceId: string) => void;
  onCreate?: () => void;
}

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
    if (!result.error) {
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
            className="w-full justify-between"
          >
            <span className="truncate">
              {activeWorkspace?.name || "Selecionar workspace..."}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-0">
          <Command>
            <CommandInput placeholder="Buscar workspace..." />
            <CommandList>
              <CommandEmpty>Nenhum workspace encontrado.</CommandEmpty>
              <CommandGroup>
                {workspaces.map((ws) => (
                  <CommandItem
                    key={ws.id}
                    value={ws.id}
                    onSelect={() => {
                      onSwitch(ws.id);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        activeWorkspace?.id === ws.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <span className="truncate">{ws.name}</span>
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

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Criar novo workspace</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleCreateWorkspace} className="space-y-4 pt-4">
          <Input
            placeholder="Nome do workspace"
            value={newWorkspaceName}
            onChange={(e) => setNewWorkspaceName(e.target.value)}
            required
          />
          <Button type="submit" className="w-full" disabled={creating}>
            {creating ? "Criando..." : "Criar workspace"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
