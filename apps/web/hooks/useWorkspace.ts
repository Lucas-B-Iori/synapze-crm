"use client";

import { useState, useEffect, useCallback } from "react";
import {
  fetchUserWorkspaces,
  switchWorkspace,
} from "@/server/actions/workspace.actions";
import type { WorkspaceWithMembers, WorkspaceRole } from "@/types/workspace";

export function useWorkspace() {
  const [workspaces, setWorkspaces] = useState<WorkspaceWithMembers[]>([]);
  const [activeWorkspace, setActiveWorkspace] = useState<WorkspaceWithMembers | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadWorkspaces = useCallback(async () => {
    setLoading(true);
    const result = await fetchUserWorkspaces();
    if (result.error) {
      setError(result.error);
    } else if (result.data) {
      setWorkspaces(result.data);
      // Se houver apenas um workspace, ativa-o automaticamente
      if (result.data.length === 1 && !activeWorkspace) {
        setActiveWorkspace(result.data[0]);
        await switchWorkspace(result.data[0].id);
      }
    }
    setLoading(false);
  }, [activeWorkspace]);

  useEffect(() => {
    loadWorkspaces();
  }, [loadWorkspaces]);

  const handleSwitchWorkspace = useCallback(async (workspaceId: string) => {
    const ws = workspaces.find((w) => w.id === workspaceId);
    if (ws) {
      setActiveWorkspace(ws);
      await switchWorkspace(workspaceId);
    }
  }, [workspaces]);

  const getUserRole = useCallback((workspaceId?: string): WorkspaceRole | null => {
    const wsId = workspaceId || activeWorkspace?.id;
    if (!wsId) return null;
    // Precisamos saber o profile_id do usuário atual. Por simplicidade,
    // vamos retornar a role do primeiro membro que corresponde ao contexto.
    // Na prática, o componente pai deve passar a role.
    return null;
  }, [activeWorkspace]);

  return {
    workspaces,
    activeWorkspace,
    loading,
    error,
    refresh: loadWorkspaces,
    switchWorkspace: handleSwitchWorkspace,
  };
}
