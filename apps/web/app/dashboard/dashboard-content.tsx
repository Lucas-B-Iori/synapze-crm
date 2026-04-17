"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Users, Mail, UserPlus, Crown, CreditCard, TrendingUp } from "lucide-react";
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
import { AvatarFallback } from "@/components/ui/avatar-fallback";
import { SlideUp } from "@/components/motion/slide-up";
import { inviteMember, acceptInvite, switchWorkspace } from "@/server/actions/workspace.actions";
import { canPerformAction } from "@/hooks/usePermission";
import { toast } from "sonner";
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
    const result = await inviteMember(currentWorkspace.id, inviteEmail, inviteRole);
    setInviting(false);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Convite enviado com sucesso!");
      setInviteDialogOpen(false);
      setInviteEmail("");
      setInviteRole("professional");
      router.refresh();
    }
  }

  async function handleAccept(memberId: string) {
    const result = await acceptInvite(memberId);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Convite aceito!");
      router.refresh();
    }
  }

  const canInvite = canPerformAction(userRole, "manager");
  const pendingInvites = currentWorkspace.workspace_members?.filter(
    (m) => m.status === "pending" && m.profile_id === userId
  ) || [];

  const stats = {
    members: currentWorkspace.workspace_members?.filter((m) => m.status === "active").length || 0,
    pending: pendingInvites.length,
    plan: currentWorkspace.plan_tier,
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <SlideUp>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-100">Dashboard</h1>
            <p className="mt-1 text-sm text-zinc-400">
              Acompanhe seu workspace e gerencie sua equipe.
            </p>
          </div>
          <div className="w-full sm:w-72">
            <WorkspaceSwitcher
              workspaces={workspaces}
              activeWorkspace={currentWorkspace}
              onSwitch={handleSwitch}
              onCreate={() => router.refresh()}
            />
          </div>
        </div>
      </SlideUp>

      {/* Pending invites */}
      <AnimatePresence>
        {pendingInvites.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
          >
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
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats */}
      <SlideUp delay={0.05}>
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard
            icon={Users}
            label="Membros ativos"
            value={stats.members}
            tone="indigo"
          />
          <StatCard
            icon={Mail}
            label="Convites pendentes"
            value={stats.pending}
            tone="amber"
          />
          <StatCard
            icon={Crown}
            label="Plano atual"
            value={stats.plan}
            tone="emerald"
            isText
          />
        </div>
      </SlideUp>

      {/* Main grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Members */}
        <SlideUp delay={0.1}>
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Users className="h-4 w-4 text-indigo-400" />
                Membros do Workspace
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {currentWorkspace.workspace_members?.length === 0 ? (
                <p className="text-sm text-zinc-500">Nenhum membro ainda.</p>
              ) : (
                currentWorkspace.workspace_members?.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/40 p-3 transition-colors hover:border-zinc-700 hover:bg-zinc-800/40"
                  >
                    <div className="flex items-center gap-3">
                      <AvatarFallback
                        name={member.profile?.full_name || undefined}
                        size="md"
                      />
                      <div>
                        <p className="text-sm font-medium text-zinc-200">
                          {member.profile?.full_name || "Sem nome"}
                        </p>
                        <p className="text-xs text-zinc-500">
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
        </SlideUp>

        {/* Quick actions */}
        <SlideUp delay={0.15}>
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-base">Ações rápidas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {canInvite && (
                <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
                  <DialogTrigger asChild>
                    <Button
                      className="w-full justify-start gap-2 border-zinc-700 bg-zinc-800/60 text-zinc-100 hover:bg-zinc-700/60 hover:text-white"
                      variant="outline"
                    >
                      <UserPlus className="h-4 w-4" />
                      Convidar membro
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="border-zinc-700/60 bg-zinc-900/95 backdrop-blur-xl">
                    <DialogHeader>
                      <DialogTitle className="text-zinc-100">Convidar membro</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleInvite} className="space-y-4 pt-4">
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium text-zinc-300">Email</label>
                        <Input
                          type="email"
                          placeholder="colaborador@empresa.com"
                          value={inviteEmail}
                          onChange={(e) => setInviteEmail(e.target.value)}
                          required
                          className="border-zinc-700 bg-zinc-950 text-zinc-100 focus-visible:ring-indigo-500/40"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium text-zinc-300">Função</label>
                        <Select
                          value={inviteRole}
                          onValueChange={(v) => setInviteRole(v as WorkspaceRole)}
                        >
                          <SelectTrigger className="border-zinc-700 bg-zinc-950 text-zinc-100 focus:ring-indigo-500/40">
                            <SelectValue placeholder="Selecione uma função" />
                          </SelectTrigger>
                          <SelectContent className="border-zinc-700 bg-zinc-900 text-zinc-100">
                            <SelectItem value="manager">Gerente</SelectItem>
                            <SelectItem value="professional">Profissional</SelectItem>
                            <SelectItem value="assistant">Assistente</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <Button
                        type="submit"
                        className="w-full bg-indigo-600 text-white hover:bg-indigo-500 btn-glow"
                        disabled={inviting}
                      >
                        {inviting ? "Convidando..." : "Enviar convite"}
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              )}

              <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-3">
                <p className="text-sm font-medium text-zinc-200">Plano atual</p>
                <p className="mt-0.5 text-xs capitalize text-zinc-400">
                  {currentWorkspace.plan_tier}
                </p>
              </div>
            </CardContent>
          </Card>
        </SlideUp>
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  tone,
  isText,
}: {
  icon: React.ElementType;
  label: string;
  value: number | string;
  tone: "indigo" | "amber" | "emerald";
  isText?: boolean;
}) {
  const toneClasses = {
    indigo: "bg-indigo-500/10 text-indigo-400",
    amber: "bg-amber-500/10 text-amber-400",
    emerald: "bg-emerald-500/10 text-emerald-400",
  };
  return (
    <div className="glass-card flex items-center gap-4 p-4">
      <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg", toneClasses[tone])}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-xs font-medium text-zinc-400">{label}</p>
        <p className={cn("font-semibold text-zinc-100", isText ? "text-sm capitalize" : "text-xl")}>
          {value}
        </p>
      </div>
    </div>
  );
}

