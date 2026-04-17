"use client";

import { useState } from "react";
import { Mail, Phone, MoreHorizontal, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ContactDetailModal } from "./contact-detail-modal";
import { AvatarFallback } from "@/components/ui/avatar-fallback";
import { EmptyContactsIllustration } from "@/components/illustrations/empty-contacts";
import { cn } from "@/lib/utils";
import type { Contact } from "@/types/contact";

const sourceStyles: Record<string, string> = {
  instagram: "bg-pink-500/10 text-pink-300 border-pink-500/20",
  site: "bg-indigo-500/10 text-indigo-300 border-indigo-500/20",
  indicacao: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20",
  google: "bg-blue-500/10 text-blue-300 border-blue-500/20",
  facebook: "bg-sky-500/10 text-sky-300 border-sky-500/20",
};

function formatSource(source?: string | null) {
  if (!source) return null;
  const key = source.toLowerCase().trim();
  const label = source.charAt(0).toUpperCase() + source.slice(1);
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium",
        sourceStyles[key] || "bg-zinc-800 text-zinc-300 border-zinc-700"
      )}
    >
      {label}
    </span>
  );
}

interface ContactTableProps {
  contacts: Contact[];
}

export function ContactTable({ contacts }: ContactTableProps) {
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);

  if (contacts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/30 p-12 text-center">
        <EmptyContactsIllustration className="h-24 w-24" />
        <p className="mt-4 text-zinc-300">Nenhum contato encontrado.</p>
        <p className="text-sm text-zinc-500">
          Adicione seu primeiro contato para começar a gerenciar seus leads.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-2">
        {contacts.map((contact) => (
          <div
            key={contact.id}
            onClick={() => setSelectedContact(contact)}
            className="group flex cursor-pointer items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-3 transition-all hover:border-indigo-500/20 hover:bg-zinc-800/50"
          >
            <div className="flex items-center gap-3">
              <AvatarFallback name={contact.full_name} size="md" />
              <div>
                <p className="text-sm font-medium text-zinc-100">{contact.full_name}</p>
                <div className="mt-0.5 flex items-center gap-2 text-zinc-400">
                  {contact.email && (
                    <span className="flex items-center gap-1 text-[11px]">
                      <Mail className="h-3 w-3 text-zinc-500" />
                      <span className="truncate max-w-[160px] sm:max-w-[240px]">{contact.email}</span>
                    </span>
                  )}
                  {contact.phone && (
                    <span className="flex items-center gap-1 text-[11px]">
                      <Phone className="h-3 w-3 text-zinc-500" />
                      {contact.phone}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {formatSource(contact.source)}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-zinc-500 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-zinc-800 hover:text-zinc-200"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="border-zinc-700 bg-zinc-900 text-zinc-100"
                >
                  <DropdownMenuItem onClick={() => setSelectedContact(contact)}>
                    Ver detalhes
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={!!selectedContact} onOpenChange={() => setSelectedContact(null)}>
        <DialogContent className="max-w-4xl border-zinc-700/60 bg-zinc-900/95 p-0 backdrop-blur-xl">
          <DialogHeader className="sr-only">
            <DialogTitle>Detalhes do contato</DialogTitle>
          </DialogHeader>
          {selectedContact && (
            <ContactDetailModal
              contactId={selectedContact.id}
              onClose={() => setSelectedContact(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
