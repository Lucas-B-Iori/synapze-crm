"use client";

import { useState } from "react";
import { Mail, Phone, MoreHorizontal } from "lucide-react";
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
import type { Contact } from "@/types/contact";

interface ContactTableProps {
  contacts: Contact[];
}

export function ContactTable({ contacts }: ContactTableProps) {
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);

  if (contacts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-border bg-card p-12 text-center">
        <p className="text-muted-foreground">Nenhum contato encontrado.</p>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-hidden rounded-lg border border-border">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-4 py-3 font-medium">Nome</th>
              <th className="px-4 py-3 font-medium">Contato</th>
              <th className="px-4 py-3 font-medium">Origem</th>
              <th className="px-4 py-3 font-medium">Criado em</th>
              <th className="px-4 py-3 font-medium text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {contacts.map((contact) => (
              <tr
                key={contact.id}
                className="cursor-pointer bg-card transition-colors hover:bg-muted/30"
                onClick={() => setSelectedContact(contact)}
              >
                <td className="px-4 py-3 font-medium">{contact.full_name}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-col gap-1 text-muted-foreground">
                    {contact.email && (
                      <span className="flex items-center gap-1 text-xs">
                        <Mail className="h-3 w-3" />
                        {contact.email}
                      </span>
                    )}
                    {contact.phone && (
                      <span className="flex items-center gap-1 text-xs">
                        <Phone className="h-3 w-3" />
                        {contact.phone}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {contact.source || "—"}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {new Date(contact.created_at).toLocaleDateString("pt-BR")}
                </td>
                <td className="px-4 py-3 text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setSelectedContact(contact)}>
                        Ver detalhes
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={!!selectedContact} onOpenChange={() => setSelectedContact(null)}>
        <DialogContent className="max-w-3xl">
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
