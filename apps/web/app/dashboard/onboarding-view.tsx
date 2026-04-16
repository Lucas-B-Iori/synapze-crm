"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createWorkspace } from "@/server/actions/workspace.actions";

export function OnboardingView() {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const result = await createWorkspace(name.trim());
    setLoading(false);

    if (result.error) {
      setError(result.error);
    } else {
      router.refresh();
    }
  }

  return (
    <div className="w-full max-w-md space-y-6 rounded-2xl border border-border bg-card p-8 shadow-lg">
      <div className="text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Bem-vindo ao Synapze</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Vamos criar o seu primeiro workspace para começar.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-2 block text-sm font-medium">Nome do Workspace</label>
          <Input
            placeholder="Ex: Clínica Saúde Total"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Criando..." : "Criar Workspace"}
        </Button>
      </form>
    </div>
  );
}
