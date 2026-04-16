"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { addContact } from "@/server/actions/contact.actions";
import { CustomFieldInput } from "./custom-field-input";
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
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const result = await addContact(workspaceId, {
      full_name: fullName.trim(),
      email: email.trim() || undefined,
      phone: phone.trim() || undefined,
      source: source.trim() || undefined,
      customValues,
    });

    setLoading(false);

    if (result.error) {
      setError(result.error);
    } else if (result.data) {
      onSuccess(result.data);
      // reset
      setFullName("");
      setEmail("");
      setPhone("");
      setSource("");
      setCustomValues({});
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pt-4">
      <div className="space-y-2">
        <Label htmlFor="fullName">Nome completo *</Label>
        <Input
          id="fullName"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="João Silva"
          required
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="joao@email.com"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Telefone</Label>
          <Input
            id="phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="(11) 99999-9999"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="source">Origem</Label>
        <Input
          id="source"
          value={source}
          onChange={(e) => setSource(e.target.value)}
          placeholder="Indicação, Instagram, Site..."
        />
      </div>

      {customFields.length > 0 && (
        <div className="space-y-3 rounded-lg border border-border bg-muted/20 p-4">
          <p className="text-sm font-medium">Campos customizados</p>
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
      )}

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Salvando..." : "Salvar contato"}
      </Button>
    </form>
  );
}
