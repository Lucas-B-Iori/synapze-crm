"use client";

import { useState, useCallback, useMemo } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ContactTable } from "@/components/contacts/contact-table";
import { ContactForm } from "@/components/contacts/contact-form";
import type { Contact, CustomFieldDefinition } from "@/types/contact";

interface ContactsPageProps {
  initialContacts: Contact[];
  initialTotal: number;
  customFields: CustomFieldDefinition[];
  workspaceId: string;
  userId: string;
}

export function ContactsPage({
  initialContacts,
  initialTotal,
  customFields,
  workspaceId,
  userId,
}: ContactsPageProps) {
  const [contacts, setContacts] = useState<Contact[]>(initialContacts);
  const [total, setTotal] = useState(initialTotal);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  const filteredContacts = useMemo(() => {
    if (!search.trim()) return contacts;
    const term = search.toLowerCase();
    return contacts.filter(
      (c) =>
        c.full_name.toLowerCase().includes(term) ||
        (c.email?.toLowerCase().includes(term) ?? false) ||
        (c.phone?.toLowerCase().includes(term) ?? false)
    );
  }, [contacts, search]);

  const handleContactCreated = useCallback((contact: Contact) => {
    setContacts((prev) => [contact, ...prev]);
    setTotal((t) => t + 1);
    setDialogOpen(false);
  }, []);

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Contatos</h1>
          <p className="text-muted-foreground">
            {total} contato{total !== 1 ? "s" : ""} no workspace
          </p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Novo Contato
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Novo Contato</DialogTitle>
            </DialogHeader>
            <ContactForm
              workspaceId={workspaceId}
              customFields={customFields}
              onSuccess={handleContactCreated}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center gap-4">
        <Input
          placeholder="Buscar por nome, email ou telefone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <ContactTable contacts={filteredContacts} />
    </div>
  );
}
