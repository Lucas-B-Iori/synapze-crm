"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { addContact } from "@/server/actions/contact.actions";
import { CustomFieldInput } from "./custom-field-input";
import { toast } from "sonner";
import type { Contact, CustomFieldDefinition } from "@/types/contact";

interface ContactFormProps {
  workspaceId: string;
  customFields: CustomFieldDefinition[];
  onSuccess: (contact: Contact) => void;
}

export function ContactForm({ workspaceId, customFields, onSuccess }: ContactFormProps) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [source, setSource] = useState("");
  const [customValues, setCustomValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const result = await addContact(workspaceId, {
      full_name: fullName.trim(),
      email: email.trim() || undefined,
      phone: phone.trim() || undefined,
      source: source.trim() || undefined,
      customValues,
    });

    setLoading(false);

    if (result.error) {
      toast.error(result.error);
    } else if (result.data) {
      toast.success("Contato criado com sucesso!");
      onSuccess(result.data);
      setFullName("");
      setEmail("");
      setPhone("");
      setSource("");
      setCustomValues({});
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pt-2">
      <div className="space-y-2">
        <Label htmlFor="fullName" className="text-zinc-300">
          Nome completo <span className="text-red-400">*</span>
        </Label>
        <Input
          id="fullName"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="João Silva"
          required
          className="border-zinc-700 bg-zinc-950 text-zinc-100 placeholder:text-zinc-600 focus-visible:ring-indigo-500/40"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="email" className="text-zinc-300">Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="joao@email.com"
            className="border-zinc-700 bg-zinc-950 text-zinc-100 placeholder:text-zinc-600 focus-visible:ring-indigo-500/40"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone" className="text-zinc-300">Telefone</Label>
          <Input
            id="phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="(11) 99999-9999"
            className="border-zinc-700 bg-zinc-950 text-zinc-100 placeholder:text-zinc-600 focus-visible:ring-indigo-500/40"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="source" className="text-zinc-300">Origem</Label>
        <Input
          id="source"
          value={source}
          onChange={(e) => setSource(e.target.value)}
          placeholder="Indicação, Instagram, Site..."
          className="border-zinc-700 bg-zinc-950 text-zinc-100 placeholder:text-zinc-600 focus-visible:ring-indigo-500/40"
        />
      </div>

      {customFields.length > 0 && (
        <div className="space-y-3 rounded-xl border border-zinc-800 bg-zinc-950/40 p-4">
          <p className="text-sm font-medium text-zinc-300">Campos adicionais</p>
          <div className="grid gap-4 sm:grid-cols-2">
            {customFields.map((field) => (
              <CustomFieldInput
                key={field.id}
                field={field}
                value={customValues[field.id] || ""}
                onChange={(value) =>
                  setCustomValues((prev) => ({ ...prev, [field.id]: value }))
                }
              />
            ))}
          </div>
        </div>
      )}

      <Button
        type="submit"
        className="w-full bg-indigo-600 text-white hover:bg-indigo-500 btn-glow"
        disabled={loading}
      >
        {loading ? "Salvando..." : "Salvar contato"}
      </Button>
    </form>
  );
}
