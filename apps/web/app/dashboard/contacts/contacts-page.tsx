"use client";

import { useState, useCallback, useMemo } from "react";
import { Plus, Search } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
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
import { SlideUp } from "@/components/motion/slide-up";
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
      {/* Header */}
      <SlideUp>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-100">Contatos</h1>
            <p className="mt-1 text-sm text-zinc-400">
              <AnimatePresence mode="wait">
                <motion.span
                  key={filteredContacts.length}
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 4 }}
                  className="inline-block"
                >
                  {filteredContacts.length} de {total} contato{total !== 1 ? "s" : ""}
                </motion.span>
              </AnimatePresence>{" "}
              no workspace
            </p>
          </div>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 bg-indigo-600 text-white hover:bg-indigo-500 btn-glow">
                <Plus className="h-4 w-4" />
                Novo Contato
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg border-zinc-700/60 bg-zinc-900/95 backdrop-blur-xl">
              <DialogHeader>
                <DialogTitle className="text-zinc-100">Novo Contato</DialogTitle>
              </DialogHeader>
              <ContactForm
                workspaceId={workspaceId}
                customFields={customFields}
                onSuccess={handleContactCreated}
              />
            </DialogContent>
          </Dialog>
        </div>
      </SlideUp>

      {/* Search */}
      <SlideUp delay={0.05}>
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <Input
            placeholder="Buscar por nome, email ou telefone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-11 border-zinc-700 bg-zinc-900/60 pl-10 text-zinc-100 placeholder:text-zinc-600 focus-visible:ring-indigo-500/40"
          />
        </div>
      </SlideUp>

      {/* Table */}
      <SlideUp delay={0.1}>
        <ContactTable contacts={filteredContacts} />
      </SlideUp>
    </div>
  );
}
