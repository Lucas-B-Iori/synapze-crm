"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Opcional: enviar para Sentry
    console.error(error);
  }, [error]);

  return (
    <div className="flex h-full flex-col items-center justify-center p-6 text-center">
      <h2 className="text-xl font-semibold">Algo deu errado no dashboard</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        {error.message || "Tente novamente em alguns instantes."}
      </p>
      <Button onClick={reset} className="mt-4">
        Tentar novamente
      </Button>
    </div>
  );
}
