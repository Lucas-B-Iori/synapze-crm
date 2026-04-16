import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function ForbiddenPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 text-center">
      <h1 className="text-4xl font-bold tracking-tight">403</h1>
      <p className="mt-4 text-lg text-muted-foreground">
        Você não tem permissão para acessar esta página.
      </p>
      <Button asChild className="mt-6">
        <Link href="/dashboard">Voltar ao Dashboard</Link>
      </Button>
    </main>
  );
}
