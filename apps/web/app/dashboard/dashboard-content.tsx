"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Users, Mail, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { WorkspaceSwitcher } from "@/components/layout/workspace-switcher";
import { RoleBadge } from "@/components/layout/role-badge";
import { inviteMember, acceptInvite, switchWorkspace } from "@/server/actions/workspace.actions";
import { canPerformAction } from "@/hooks/usePermission";
import type { WorkspaceWithMembers, WorkspaceRole } from "@/types/workspace";

interface DashboardContentProps {
  workspaces: WorkspaceWithMembers[];
  activeWorkspace: WorkspaceWithMembers;
  userRole: WorkspaceRole;
  userId: string;
}

export function DashboardContent({
  workspaces,
  activeWorkspace,
  userRole,
  userId,
}: DashboardContentProps) {
  const router = useRouter();
  const [currentWorkspace, setCurrentWorkspace] = useState(activeWorkspace);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<WorkspaceRole>("professional");
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);

  const handleSwitch = useCallback(
    async (workspaceId: string) => {
      await switchWorkspace(workspaceId);
      const ws = workspaces.find((w) => w.id === workspaceId);
      if (ws) {
        setCurrentWorkspace(ws);
        router.refresh();
      }
    },
    [workspaces, router]
  );

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setInviting(true);
    setInviteError(null);

    const result = await inviteMember(currentWorkspace.id, inviteEmail, inviteRole);
    setInviting(false);

    if (result.error) {
      setInviteError(result.error);
    } else {
      setInviteDialogOpen(false);
      setInviteEmail("");
      setInviteRole("professional");
      router.refresh();
    }
  }

  async function handleAccept(memberId: string) {
    const result = await acceptInvite(memberId);
    if (!result.error) {
      router.refresh();
    }
  }

  const canInvite = canPerformAction(userRole, "manager");
  const pendingInvites = currentWorkspace.workspace_members?.filter(
    (m) => m.status === "pending" && m.profile_id === userId
  ) || [];

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Gerencie seu workspace e acompanhe sua equipe.
          </p>
        </div>
        <WorkspaceSwitcher
          workspaces={workspaces}
          activeWorkspace={currentWorkspace}
          onSwitch={handleSwitch}
          onCreate={() => router.refresh()}
        />
      </div>

      {pendingInvites.length > 0 && (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <Mail className="h-4 w-4" />
              Convites pendentes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {pendingInvites.map((invite) => (
              <div
                key={invite.id}
                className="flex items-center justify-between rounded-lg border border-border bg-card p-3"
              >
                <div>
                  <p className="font-medium">{currentWorkspace.name}</p>
                  <p className="text-sm text-muted-foreground">
                    Você foi convidado como <RoleBadge role={invite.role} />
                  </p>
                </div>
                <Button size="sm" onClick={() => handleAccept(invite.id)}>
                  Aceitar
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="h-4 w-4" />
              Membros do Workspace
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {currentWorkspace.workspace_members?.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum membro ainda.</p>
            ) : (
              currentWorkspace.workspace_members?.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between rounded-lg border border-border p-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                      {member.profile?.full_name?.charAt(0).toUpperCase() ||
                        member.profile_id.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        {member.profile?.full_name || "Sem nome"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {member.status === "pending" ? "Pendente" : "Ativo"}
                      </p>
                    </div>
                  </div>
                  <RoleBadge role={member.role} />
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Ações rápidas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {canInvite && (
              <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="w-full justify-start gap-2" variant="outline">
                    <UserPlus className="h-4 w-4" />
                    Convidar membro
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Convidar membro</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleInvite} className="space-y-4 pt-4">
                    <div>
                      <label className="mb-2 block text-sm font-medium">Email</label>
                      <Input
                        type="email"
                        placeholder="colaborador@empresa.com"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium">Função</label>
                      <Select
                        value={inviteRole}
                        onValueChange={(v) => setInviteRole(v as WorkspaceRole)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione uma função" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="manager">Gerente</SelectItem>
                          <SelectItem value="professional">Profissional</SelectItem>
                          <SelectItem value="assistant">Assistente</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {inviteError && (
                      <p className="text-sm text-destructive">{inviteError}</p>
                    )}
                    <Button type="submit" className="w-full" disabled={inviting}>
                      {inviting ? "Convidando..." : "Enviar convite"}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            )}

            <div className="rounded-lg border border-border p-3">
              <p className="text-sm font-medium">Plano atual</p>
              <p className="text-xs capitalize text-muted-foreground">
                {currentWorkspace.plan_tier}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
