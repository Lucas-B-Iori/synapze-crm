"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  fetchContactById,
  editContact,
  addContactNote,
  fetchContactNotes,
  removeContactNote,
} from "@/server/actions/contact.actions";
import {
  fetchPipelineForProfile,
  addPipelineCard,
  movePipelineCard,
} from "@/server/actions/pipeline.actions";
import { useUser } from "@/hooks/useUser";
import { cn } from "@/lib/utils";
import { AvatarFallback } from "@/components/ui/avatar-fallback";
import { SlideUp } from "@/components/motion/slide-up";
import { toast } from "sonner";
import type { ContactWithDetails, ContactNote } from "@/types/contact";
import type { PipelineWithStages } from "@/types/pipeline";
import {
  UserCircle,
  Kanban,
  MessageSquare,
  Calendar,
  FileText,
  Cpu,
  Trash2,
  Save,
  X,
  ArrowRight,
} from "lucide-react";
import { MessageThread } from "@/components/chat/message-thread";
import { fetchChannelsForWorkspace } from "@/server/actions/channel.actions";

interface ContactDetailModalProps {
  contactId: string;
  onClose: () => void;
}

function timeAgo(date: string) {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return "agora";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `há ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `há ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `há ${days}d`;
  return new Date(date).toLocaleDateString("pt-BR");
}

export function ContactDetailModal({ contactId, onClose }: ContactDetailModalProps) {
  const { user } = useUser();
  const [contact, setContact] = useState<ContactWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notes, setNotes] = useState<ContactNote[]>([]);
  const [newNote, setNewNote] = useState("");
  const [pipeline, setPipeline] = useState<PipelineWithStages | null>(null);
  const [channels, setChannels] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState("data");

  const loadContact = useCallback(async () => {
    setLoading(true);
    const result = await fetchContactById(contactId);
    if (result.data) setContact(result.data);
    setLoading(false);
  }, [contactId]);

  const loadNotes = useCallback(async () => {
    const result = await fetchContactNotes(contactId);
    if (result.data) setNotes(result.data);
  }, [contactId]);

  useEffect(() => {
    loadContact();
    loadNotes();
  }, [loadContact, loadNotes]);

  useEffect(() => {
    async function loadPipeline() {
      if (!user?.id || !contact?.workspace_id) return;
      const result = await fetchPipelineForProfile(contact.workspace_id, user.id);
      if (result.data) setPipeline(result.data);
    }
    loadPipeline();
  }, [user, contact]);

  useEffect(() => {
    async function loadChannels() {
      if (!contact?.workspace_id) return;
      const result = await fetchChannelsForWorkspace(contact.workspace_id);
      if (result.data) setChannels(result.data);
    }
    loadChannels();
  }, [contact]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!contact) return;
    setSaving(true);
    const result = await editContact(contact.id, {
      full_name: contact.full_name,
      email: contact.email || undefined,
      phone: contact.phone || undefined,
      source: contact.source || undefined,
    });
    setSaving(false);
    if (!result.error) {
      toast.success("Contato atualizado");
    } else {
      toast.error(result.error);
    }
  }

  async function handleAddNote() {
    if (!newNote.trim() || !contact) return;
    const result = await addContactNote(contact.id, contact.workspace_id, newNote.trim());
    if (result.data) {
      setNotes((prev) => [result.data!, ...prev]);
      setNewNote("");
      toast.success("Nota adicionada");
    } else {
      toast.error(result.error || "Erro ao adicionar nota");
    }
  }

  async function handleDeleteNote(noteId: string) {
    const result = await removeContactNote(noteId);
    if (!result.error) {
      setNotes((prev) => prev.filter((n) => n.id !== noteId));
      toast.success("Nota removida");
    } else {
      toast.error(result.error || "Erro ao remover nota");
    }
  }

  async function handleAddToPipeline(stageId: string) {
    if (!pipeline || !contact) return;
    const result = await addPipelineCard(pipeline.id, stageId, contact.id, 0);
    if (!result.error) {
      toast.success("Contato adicionado ao funil");
      // refresh pipeline
      if (user?.id) {
        const p = await fetchPipelineForProfile(contact.workspace_id, user.id);
        if (p.data) setPipeline(p.data);
      }
    } else {
      toast.error(result.error || "Erro ao adicionar ao funil");
    }
  }

  async function handleMoveCard(stageId: string) {
    if (!pipeline || !contact || !user) return;
    const card = pipeline.cards.find((c) => c.contact_id === contact.id);
    if (!card) return;
    const result = await movePipelineCard(card.id, stageId, 0);
    if (!result.error) {
      toast.success("Contato movido");
      const p = await fetchPipelineForProfile(contact.workspace_id, user.id);
      if (p.data) setPipeline(p.data);
    } else {
      toast.error(result.error || "Erro ao mover");
    }
  }

  if (loading || !contact) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-16 w-16 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <Skeleton className="mt-6 h-40 w-full" />
      </div>
    );
  }

  const contactCard = pipeline?.cards.find((c) => c.contact_id === contact.id);
  const contactStage = pipeline?.stages.find((s) => s.id === contactCard?.stage_id);

  return (
    <div className="grid max-h-[85vh] grid-cols-1 overflow-hidden md:grid-cols-[320px_1fr]">
      {/* Left column */}
      <div className="border-b border-zinc-800 bg-zinc-950/40 p-6 md:border-b-0 md:border-r">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <AvatarFallback name={contact.full_name} size="lg" />
            <div>
              <h2 className="text-lg font-semibold text-zinc-100">{contact.full_name}</h2>
              <p className="text-sm text-zinc-400">
                {contact.email} {contact.phone && `• ${contact.phone}`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded p-1 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-6 space-y-3">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Status no funil</p>
            <div className="mt-2 flex items-center gap-2">
              {contactStage ? (
                <>
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: contactStage.color }}
                  />
                  <span className="text-sm font-medium text-zinc-200">{contactStage.name}</span>
                </>
              ) : (
                <span className="text-sm text-zinc-400">Não está em nenhum funil</span>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Origem</p>
            <p className="mt-1 text-sm text-zinc-200">
              {contact.source ? contact.source.charAt(0).toUpperCase() + contact.source.slice(1) : "—"}
            </p>
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Criado em</p>
            <p className="mt-1 text-sm text-zinc-200">
              {new Date(contact.created_at).toLocaleString("pt-BR")}
            </p>
          </div>
        </div>
      </div>

      {/* Right column */}
      <div className="flex flex-col overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col">
          <div className="border-b border-zinc-800 px-6 pt-4">
            <TabsList className="h-11 gap-1 bg-transparent p-0">
              {[
                { id: "data", label: "Dados", icon: UserCircle },
                { id: "kanban", label: "Funil", icon: Kanban },
                { id: "chat", label: "Conversas", icon: MessageSquare },
                { id: "notes", label: "Notas", icon: FileText },
              ].map((t) => (
                <TabsTrigger
                  key={t.id}
                  value={t.id}
                  className="gap-2 rounded-lg px-4 py-2 text-sm font-medium text-zinc-400 data-[state=active]:bg-zinc-800/60 data-[state=active]:text-zinc-100"
                >
                  <t.icon className="h-4 w-4" />
                  {t.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            <TabsContent value="data" className="mt-0 space-y-4">
              <form onSubmit={handleSave} className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-zinc-300">Nome completo</Label>
                  <Input
                    value={contact.full_name}
                    onChange={(e) => setContact({ ...contact, full_name: e.target.value })}
                    className="border-zinc-700 bg-zinc-950 text-zinc-100 focus-visible:ring-indigo-500/40"
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-zinc-300">Email</Label>
                    <Input
                      type="email"
                      value={contact.email || ""}
                      onChange={(e) => setContact({ ...contact, email: e.target.value })}
                      className="border-zinc-700 bg-zinc-950 text-zinc-100 focus-visible:ring-indigo-500/40"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-zinc-300">Telefone</Label>
                    <Input
                      value={contact.phone || ""}
                      onChange={(e) => setContact({ ...contact, phone: e.target.value })}
                      className="border-zinc-700 bg-zinc-950 text-zinc-100 focus-visible:ring-indigo-500/40"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-zinc-300">Origem</Label>
                  <Input
                    value={contact.source || ""}
                    onChange={(e) => setContact({ ...contact, source: e.target.value })}
                    className="border-zinc-700 bg-zinc-950 text-zinc-100 focus-visible:ring-indigo-500/40"
                  />
                </div>
                <div className="flex items-center gap-2 pt-2">
                  <Button
                    type="submit"
                    disabled={saving}
                    className="gap-2 bg-indigo-600 text-white hover:bg-indigo-500 btn-glow"
                  >
                    <Save className="h-4 w-4" />
                    {saving ? "Salvando..." : "Salvar alterações"}
                  </Button>
                </div>
              </form>
            </TabsContent>

            <TabsContent value="kanban" className="mt-0 space-y-4">
              {pipeline ? (
                <div className="space-y-3">
                  <p className="text-sm text-zinc-400">
                    Adicione ou mova este contato entre as etapas do funil:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {pipeline.stages.map((stage) => {
                      const isCurrent = contactStage?.id === stage.id;
                      return (
                        <Button
                          key={stage.id}
                          size="sm"
                          variant={isCurrent ? "default" : "outline"}
                          className={cn(
                            "gap-2",
                            isCurrent
                              ? "bg-indigo-600 text-white hover:bg-indigo-500"
                              : "border-zinc-700 bg-zinc-900 text-zinc-200 hover:border-indigo-500/40 hover:bg-zinc-800"
                          )}
                          style={
                            !isCurrent ? { borderColor: `${stage.color}40` } : undefined
                          }
                          onClick={() =>
                            isCurrent ? undefined : contactCard
                              ? handleMoveCard(stage.id)
                              : handleAddToPipeline(stage.id)
                          }
                          disabled={isCurrent}
                        >
                          <span
                            className="h-2 w-2 rounded-full"
                            style={{ backgroundColor: stage.color }}
                          />
                          {stage.name}
                          {isCurrent && <span className="text-[10px] opacity-80">(atual)</span>}
                        </Button>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-zinc-500">Carregando funil...</p>
              )}
            </TabsContent>

            <TabsContent value="chat" className="mt-0 h-full">
              {user && contact && (
                <MessageThread
                  workspaceId={contact.workspace_id}
                  contactId={contact.id}
                  contactName={contact.full_name}
                  contactPhone={contact.phone}
                  contactEmail={contact.email}
                  channels={channels}
                  userId={user.id}
                />
              )}
            </TabsContent>

            <TabsContent value="notes" className="mt-0 space-y-5">
              <div className="space-y-2">
                <Label className="text-zinc-300">Nova nota</Label>
                <Textarea
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Escreva uma observação sobre este contato..."
                  className="min-h-[100px] border-zinc-700 bg-zinc-950 text-zinc-100 focus-visible:ring-indigo-500/40"
                />
                <div className="flex justify-end">
                  <Button
                    size="sm"
                    onClick={handleAddNote}
                    disabled={!newNote.trim()}
                    className="bg-indigo-600 text-white hover:bg-indigo-500 btn-glow"
                  >
                    Adicionar nota
                  </Button>
                </div>
              </div>
              <Separator className="bg-zinc-800" />
              <div className="space-y-3">
                {notes.length === 0 ? (
                  <p className="text-sm text-zinc-500">Nenhuma nota ainda.</p>
                ) : (
                  notes.map((note) => (
                    <div
                      key={note.id}
                      className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 transition-colors hover:border-zinc-700"
                    >
                      <p className="text-sm leading-relaxed text-zinc-200">{note.content}</p>
                      <div className="mt-3 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs text-zinc-500">
                          <AvatarFallback
                            name={note.profile?.full_name || undefined}
                            size="sm"
                          />
                          <span>{note.profile?.full_name || "Você"}</span>
                          <span>•</span>
                          <span>{timeAgo(note.created_at)}</span>
                        </div>
                        <button
                          onClick={() => handleDeleteNote(note.id)}
                          className="rounded p-1 text-zinc-500 transition-colors hover:bg-red-500/10 hover:text-red-400"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
};
