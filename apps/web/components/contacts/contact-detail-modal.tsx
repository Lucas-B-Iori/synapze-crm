"use client";

import { useState, useEffect, useCallback } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { fetchPipelineForProfile, addPipelineCard } from "@/server/actions/pipeline.actions";
import { useUser } from "@/hooks/useUser";
import type { ContactWithDetails, ContactNote } from "@/types/contact";
import type { PipelineWithStages } from "@/types/pipeline";

interface ContactDetailModalProps {
  contactId: string;
  onClose: () => void;
}

export function ContactDetailModal({ contactId, onClose }: ContactDetailModalProps) {
  const { user } = useUser();
  const [contact, setContact] = useState<ContactWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notes, setNotes] = useState<ContactNote[]>([]);
  const [newNote, setNewNote] = useState("");
  const [pipeline, setPipeline] = useState<PipelineWithStages | null>(null);

  const loadContact = useCallback(async () => {
    setLoading(true);
    const result = await fetchContactById(contactId);
    if (result.data) {
      setContact(result.data);
    }
    setLoading(false);
  }, [contactId]);

  const loadNotes = useCallback(async () => {
    const result = await fetchContactNotes(contactId);
    if (result.data) {
      setNotes(result.data);
    }
  }, [contactId]);

  useEffect(() => {
    loadContact();
    loadNotes();
  }, [loadContact, loadNotes]);

  useEffect(() => {
    async function loadPipeline() {
      if (!user?.id || !contact?.workspace_id) return;
      const result = await fetchPipelineForProfile(contact.workspace_id, user.id);
      if (result.data) {
        setPipeline(result.data);
      }
    }
    loadPipeline();
  }, [user, contact]);

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
      // saved
    }
  }

  async function handleAddNote() {
    if (!newNote.trim() || !contact) return;
    const result = await addContactNote(contact.id, contact.workspace_id, newNote.trim());
    if (result.data) {
      setNotes((prev) => [result.data!, ...prev]);
      setNewNote("");
    }
  }

  async function handleDeleteNote(noteId: string) {
    const result = await removeContactNote(noteId);
    if (!result.error) {
      setNotes((prev) => prev.filter((n) => n.id !== noteId));
    }
  }

  async function handleAddToPipeline(stageId: string) {
    if (!pipeline || !contact) return;
    await addPipelineCard(pipeline.id, stageId, contact.id, 0);
    alert("Contato adicionado ao funil!");
  }

  if (loading || !contact) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  return (
    <div className="max-h-[80vh] overflow-y-auto">
      <div className="mb-4">
        <h2 className="text-xl font-semibold">{contact.full_name}</h2>
        <p className="text-sm text-muted-foreground">
          {contact.email} {contact.phone && `• ${contact.phone}`}
        </p>
      </div>

      <Tabs defaultValue="data">
        <TabsList className="mb-4 grid w-full grid-cols-4 sm:grid-cols-7">
          <TabsTrigger value="data">Dados</TabsTrigger>
          <TabsTrigger value="kanban">Kanban</TabsTrigger>
          <TabsTrigger value="chat">Chat</TabsTrigger>
          <TabsTrigger value="agenda">Agenda</TabsTrigger>
          <TabsTrigger value="notes">Notas</TabsTrigger>
          <TabsTrigger value="files">Arquivos</TabsTrigger>
          <TabsTrigger value="ai">Resumo IA</TabsTrigger>
        </TabsList>

        <TabsContent value="data" className="space-y-4">
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input
                value={contact.full_name}
                onChange={(e) => setContact({ ...contact, full_name: e.target.value })}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={contact.email || ""}
                  onChange={(e) => setContact({ ...contact, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Telefone</Label>
                <Input
                  value={contact.phone || ""}
                onChange={(e) => setContact({ ...contact, phone: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Origem</Label>
              <Input
                value={contact.source || ""}
                onChange={(e) => setContact({ ...contact, source: e.target.value })}
              />
            </div>
            <Button type="submit" disabled={saving}>
              {saving ? "Salvando..." : "Salvar alterações"}
            </Button>
          </form>
        </TabsContent>

        <TabsContent value="kanban" className="space-y-4">
          {pipeline ? (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Adicione este contato a uma etapa do seu funil:
              </p>
              <div className="flex flex-wrap gap-2">
                {pipeline.stages.map((stage) => (
                  <Button
                    key={stage.id}
                    size="sm"
                    variant="outline"
                    style={{ borderColor: stage.color }}
                    onClick={() => handleAddToPipeline(stage.id)}
                  >
                    {stage.name}
                  </Button>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Carregando funil...</p>
          )}
        </TabsContent>

        <TabsContent value="chat">
          <div className="flex h-32 items-center justify-center rounded-lg border border-dashed border-border">
            <p className="text-sm text-muted-foreground">Chat será integrado na Fase 3.</p>
          </div>
        </TabsContent>

        <TabsContent value="agenda">
          <div className="flex h-32 items-center justify-center rounded-lg border border-dashed border-border">
            <p className="text-sm text-muted-foreground">Agendamento será integrado na Fase 4.</p>
          </div>
        </TabsContent>

        <TabsContent value="notes" className="space-y-4">
          <div className="space-y-2">
            <Label>Nova nota</Label>
            <Textarea
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="Escreva uma observação privada sobre este contato..."
            />
            <Button size="sm" onClick={handleAddNote} disabled={!newNote.trim()}>
              Adicionar nota
            </Button>
          </div>
          <Separator />
          <div className="space-y-3">
            {notes.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma nota ainda.</p>
            ) : (
              notes.map((note) => (
                <div
                  key={note.id}
                  className="rounded-lg border border-border bg-muted/20 p-3"
                >
                  <p className="text-sm">{note.content}</p>
                  <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                    <span>{note.profile?.full_name || "Você"}</span>
                    <div className="flex items-center gap-2">
                      <span>{new Date(note.created_at).toLocaleString("pt-BR")}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-auto px-2 py-0 text-destructive"
                        onClick={() => handleDeleteNote(note.id)}
                      >
                        Excluir
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="files">
          <div className="flex h-32 items-center justify-center rounded-lg border border-dashed border-border">
            <p className="text-sm text-muted-foreground">
              Upload de arquivos será integrado em breve.
            </p>
          </div>
        </TabsContent>

        <TabsContent value="ai">
          <div className="flex h-32 items-center justify-center rounded-lg border border-dashed border-border">
            <p className="text-sm text-muted-foreground">Resumo com IA na Fase 5.</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
