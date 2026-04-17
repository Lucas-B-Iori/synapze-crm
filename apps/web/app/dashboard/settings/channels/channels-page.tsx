"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Mail, MessageCircle, Trash2, Edit2, Check, X, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { addChannel, editChannel, removeChannel } from "@/server/actions/channel.actions";
import { SlideUp } from "@/components/motion/slide-up";
import { toast } from "sonner";
import type { Channel, ChannelAssignment } from "@/types/channel";
import type { WorkspaceMember } from "@/types/workspace";

interface ChannelsPageProps {
  workspaceId: string;
  channels: (Channel & { assignments: ChannelAssignment[] })[];
  members: WorkspaceMember[];
  canManage: boolean;
  userId: string;
}

const providerLabels: Record<string, string> = {
  whatsapp_meta: "WhatsApp (Meta)",
  whatsapp_evolution: "WhatsApp (Evolution)",
  email_resend: "Email (Resend)",
};

const providerIcons: Record<string, React.ReactNode> = {
  whatsapp_meta: <MessageCircle className="h-4 w-4" />,
  whatsapp_evolution: <MessageCircle className="h-4 w-4" />,
  email_resend: <Mail className="h-4 w-4" />,
};

export function ChannelsPage({ workspaceId, channels: initialChannels, members, canManage }: ChannelsPageProps) {
  const [channels, setChannels] = useState(initialChannels);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Channel | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [provider, setProvider] = useState<Channel["provider"]>("whatsapp_meta");
  const [isActive, setIsActive] = useState(true);
  const [credentials, setCredentials] = useState<Record<string, string>>({});
  const [config, setConfig] = useState<Record<string, string>>({});

  function openCreate() {
    setEditing(null);
    setName("");
    setProvider("whatsapp_meta");
    setIsActive(true);
    setCredentials({});
    setConfig({});
    setDialogOpen(true);
  }

  function openEdit(ch: Channel) {
    setEditing(ch);
    setName(ch.name);
    setProvider(ch.provider);
    setIsActive(ch.is_active);
    setCredentials(Object.fromEntries(Object.entries(ch.credentials).map(([k, v]) => [k, String(v)])));
    setConfig(Object.fromEntries(Object.entries(ch.config).map(([k, v]) => [k, String(v)])));
    setDialogOpen(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);

    const payload = {
      name: name.trim(),
      provider,
      credentials,
      config,
      is_active: isActive,
    };

    if (editing) {
      const result = await editChannel(editing.id, payload);
      setSaving(false);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Canal atualizado");
        setChannels((prev) =>
          prev.map((c) => (c.id === editing.id ? { ...c, ...payload } : c))
        );
        setDialogOpen(false);
      }
    } else {
      const result = await addChannel(workspaceId, payload);
      setSaving(false);
      if (result.error) {
        toast.error(result.error);
      } else if (result.data) {
        toast.success("Canal criado");
        setChannels((prev) => [...prev, { ...result.data!, assignments: [] }]);
        setDialogOpen(false);
      }
    }
  }

  async function handleDelete(channelId: string) {
    if (!confirm("Tem certeza que deseja remover este canal?")) return;
    const result = await removeChannel(channelId);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Canal removido");
      setChannels((prev) => prev.filter((c) => c.id !== channelId));
    }
  }

  return (
    <div className="space-y-6 p-6">
      <SlideUp>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-100">Canais</h1>
            <p className="mt-1 text-sm text-zinc-400">
              Gerencie WhatsApp e Email conectados ao workspace.
            </p>
          </div>
          {canManage && (
            <Button
              onClick={openCreate}
              className="gap-2 bg-indigo-600 text-white hover:bg-indigo-500 btn-glow"
            >
              <Plus className="h-4 w-4" />
              Adicionar canal
            </Button>
          )}
        </div>
      </SlideUp>

      <SlideUp delay={0.05}>
        <div className="grid gap-4 md:grid-cols-2">
          {channels.map((ch) => (
            <div
              key={ch.id}
              className="flex flex-col justify-between rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 transition-all hover:border-zinc-700"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-800 text-zinc-300">
                    {providerIcons[ch.provider]}
                  </div>
                  <div>
                    <p className="font-medium text-zinc-100">{ch.name}</p>
                    <p className="text-xs text-zinc-500">{providerLabels[ch.provider]}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className={
                      ch.is_active
                        ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                        : "border-zinc-700 bg-zinc-800 text-zinc-400"
                    }
                  >
                    {ch.is_active ? "Ativo" : "Inativo"}
                  </Badge>
                </div>
              </div>

              <div className="mt-4 space-y-1 text-xs text-zinc-500">
                {ch.config.phone_number_id && (
                  <p>Phone ID: •••{String(ch.config.phone_number_id).slice(-4)}</p>
                )}
                {ch.config.instance_name && <p>Instância: {ch.config.instance_name}</p>}
                {ch.config.from_email && <p>Email: {ch.config.from_email}</p>}
              </div>

              {canManage && (
                <div className="mt-4 flex items-center justify-end gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
                    onClick={() => openEdit(ch)}
                  >
                    <Edit2 className="mr-1.5 h-3.5 w-3.5" />
                    Editar
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 text-zinc-400 hover:bg-red-500/10 hover:text-red-400"
                    onClick={() => handleDelete(ch.id)}
                  >
                    <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                    Remover
                  </Button>
                </div>
              )}
            </div>
          ))}

          {channels.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center rounded-xl border border-dashed border-zinc-800 bg-zinc-900/30 p-10 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-800/60 text-zinc-500">
                <Settings className="h-5 w-5" />
              </div>
              <p className="mt-3 text-zinc-300">Nenhum canal configurado.</p>
              <p className="text-xs text-zinc-500">
                Adicione WhatsApp ou Email para começar a conversar com seus contatos.
              </p>
            </div>
          )}
        </div>
      </SlideUp>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg border-zinc-700/60 bg-zinc-900/95 backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle className="text-zinc-100">
              {editing ? "Editar canal" : "Adicionar canal"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-zinc-300">Nome</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: WhatsApp Recepção"
                required
                className="border-zinc-700 bg-zinc-950 text-zinc-100 focus-visible:ring-indigo-500/40"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-zinc-300">Provider</Label>
              <Select
                value={provider}
                onValueChange={(v) => setProvider(v as Channel["provider"])}
                disabled={!!editing}
              >
                <SelectTrigger className="border-zinc-700 bg-zinc-950 text-zinc-100 focus:ring-indigo-500/40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border-zinc-700 bg-zinc-900 text-zinc-100">
                  <SelectItem value="whatsapp_meta">WhatsApp (Meta)</SelectItem>
                  <SelectItem value="whatsapp_evolution">WhatsApp (Evolution)</SelectItem>
                  <SelectItem value="email_resend">Email (Resend)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {provider === "whatsapp_meta" && (
              <div className="space-y-3 rounded-xl border border-zinc-800 bg-zinc-950/40 p-4">
                <p className="text-xs font-medium text-zinc-400">Credenciais Meta</p>
                <div className="space-y-2">
                  <Input
                    placeholder="Access Token"
                    value={credentials.access_token || ""}
                    onChange={(e) => setCredentials((p) => ({ ...p, access_token: e.target.value }))}
                    className="border-zinc-700 bg-zinc-950 text-sm text-zinc-100 focus-visible:ring-indigo-500/40"
                  />
                  <Input
                    placeholder="Phone Number ID"
                    value={config.phone_number_id || ""}
                    onChange={(e) => setConfig((p) => ({ ...p, phone_number_id: e.target.value }))}
                    className="border-zinc-700 bg-zinc-950 text-sm text-zinc-100 focus-visible:ring-indigo-500/40"
                  />
                  <Input
                    placeholder="Verify Token (para webhook)"
                    value={config.verify_token || ""}
                    onChange={(e) => setConfig((p) => ({ ...p, verify_token: e.target.value }))}
                    className="border-zinc-700 bg-zinc-950 text-sm text-zinc-100 focus-visible:ring-indigo-500/40"
                  />
                </div>
              </div>
            )}

            {provider === "whatsapp_evolution" && (
              <div className="space-y-3 rounded-xl border border-zinc-800 bg-zinc-950/40 p-4">
                <p className="text-xs font-medium text-zinc-400">Credenciais Evolution</p>
                <div className="space-y-2">
                  <Input
                    placeholder="Base URL (ex: https://evo.seuservidor.com)"
                    value={config.base_url || ""}
                    onChange={(e) => setConfig((p) => ({ ...p, base_url: e.target.value }))}
                    className="border-zinc-700 bg-zinc-950 text-sm text-zinc-100 focus-visible:ring-indigo-500/40"
                  />
                  <Input
                    placeholder="API Key"
                    value={credentials.api_key || ""}
                    onChange={(e) => setCredentials((p) => ({ ...p, api_key: e.target.value }))}
                    className="border-zinc-700 bg-zinc-950 text-sm text-zinc-100 focus-visible:ring-indigo-500/40"
                  />
                  <Input
                    placeholder="Instance Name"
                    value={config.instance_name || ""}
                    onChange={(e) => setConfig((p) => ({ ...p, instance_name: e.target.value }))}
                    className="border-zinc-700 bg-zinc-950 text-sm text-zinc-100 focus-visible:ring-indigo-500/40"
                  />
                </div>
              </div>
            )}

            {provider === "email_resend" && (
              <div className="space-y-3 rounded-xl border border-zinc-800 bg-zinc-950/40 p-4">
                <p className="text-xs font-medium text-zinc-400">Credenciais Resend</p>
                <div className="space-y-2">
                  <Input
                    placeholder="From Email"
                    value={config.from_email || ""}
                    onChange={(e) => setConfig((p) => ({ ...p, from_email: e.target.value }))}
                    className="border-zinc-700 bg-zinc-950 text-sm text-zinc-100 focus-visible:ring-indigo-500/40"
                  />
                  <Input
                    placeholder="API Key"
                    value={credentials.api_key || ""}
                    onChange={(e) => setCredentials((p) => ({ ...p, api_key: e.target.value }))}
                    className="border-zinc-700 bg-zinc-950 text-sm text-zinc-100 focus-visible:ring-indigo-500/40"
                  />
                </div>
              </div>
            )}

            <div className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-950/40 p-3">
              <span className="text-sm text-zinc-300">Canal ativo</span>
              <Checkbox
                checked={isActive}
                onCheckedChange={(v) => setIsActive(!!v)}
                className="border-zinc-600 data-[state=checked]:border-indigo-600 data-[state=checked]:bg-indigo-600"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="ghost"
                className="text-zinc-300 hover:bg-zinc-800/60 hover:text-zinc-100"
                onClick={() => setDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={saving}
                className="bg-indigo-600 text-white hover:bg-indigo-500 btn-glow"
              >
                {saving ? "Salvando..." : editing ? "Salvar" : "Criar"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
