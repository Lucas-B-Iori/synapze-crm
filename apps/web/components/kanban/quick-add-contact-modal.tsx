"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { addContact } from "@/server/actions/contact.actions";
import { addPipelineCard } from "@/server/actions/pipeline.actions";
import { toast } from "sonner";
import type { Contact } from "@/types/contact";

interface QuickAddContactModalProps {
  open: boolean;
  onClose: () => void;
  workspaceId: string;
  pipelineId: string;
  stageId: string;
  onCreated: (contact: Contact) => void;
}

export function QuickAddContactModal({
  open,
  onClose,
  workspaceId,
  pipelineId,
  stageId,
  onCreated,
}: QuickAddContactModalProps) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!fullName.trim()) return;
    setLoading(true);

    const contactResult = await addContact(workspaceId, {
      full_name: fullName.trim(),
      email: email.trim() || undefined,
      phone: phone.trim() || undefined,
    });

    if (contactResult.error || !contactResult.data) {
      setLoading(false);
      toast.error(contactResult.error || "Erro ao criar contato");
      return;
    }

    const contact = contactResult.data;

    const cardResult = await addPipelineCard(pipelineId, stageId, contact.id, 0);
    if (cardResult.error) {
      setLoading(false);
      toast.error(cardResult.error);
      return;
    }

    setLoading(false);
    toast.success("Contato adicionado ao funil!");
    onCreated(contact);
    setFullName("");
    setEmail("");
    setPhone("");
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="border-zinc-700/60 bg-zinc-900/95 backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle className="text-zinc-100">Adicionar contato rápido</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-zinc-300">Nome *</label>
            <Input
              placeholder="João Silva"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              className="border-zinc-700 bg-zinc-950 text-zinc-100 focus-visible:ring-indigo-500/40"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-zinc-300">Email</label>
              <Input
                type="email"
                placeholder="joao@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="border-zinc-700 bg-zinc-950 text-zinc-100 focus-visible:ring-indigo-500/40"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-zinc-300">Telefone</label>
              <Input
                placeholder="(11) 99999-9999"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="border-zinc-700 bg-zinc-950 text-zinc-100 focus-visible:ring-indigo-500/40"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              className="text-zinc-300 hover:bg-zinc-800/60 hover:text-zinc-100"
              onClick={onClose}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="bg-indigo-600 text-white hover:bg-indigo-500 btn-glow"
              disabled={loading}
            >
              {loading ? "Adicionando..." : "Adicionar ao funil"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
