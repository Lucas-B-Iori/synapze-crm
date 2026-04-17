"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { SlideUp } from "@/components/motion/slide-up";
import { toast } from "sonner";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (signInError) {
      setError(signInError.message || "Email ou senha incorretos.");
      return;
    }

    if (data?.session) {
      toast.success("Login realizado com sucesso!");
      router.push("/dashboard");
    } else {
      setError("Não foi possível iniciar a sessão. Tente novamente.");
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${location.origin}/auth/callback` },
    });

    if (oauthError) {
      setError(oauthError.message || "Erro ao entrar com Google.");
    }
  };

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center p-6">
      {/* Ambient glow */}
      <div className="pointer-events-none fixed inset-0 -z-10" aria-hidden="true">
        <div className="absolute left-1/4 top-1/4 h-[40%] w-[40%] rounded-full bg-indigo-600/10 blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 h-[35%] w-[35%] rounded-full bg-violet-600/10 blur-[100px]" />
      </div>

      <SlideUp className="w-full max-w-sm">
        <div className="relative overflow-hidden rounded-2xl border border-zinc-700/50 bg-zinc-900/85 p-8 shadow-2xl backdrop-blur-xl">
          <div className="absolute left-0 right-0 top-0 h-1 bg-gradient-to-r from-indigo-500 via-violet-500 to-indigo-500" />

          <div className="text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-glow">
              <span className="text-lg font-bold">S</span>
            </div>
            <h1 className="mt-5 text-2xl font-semibold tracking-tight text-zinc-100">
              Bem-vindo de volta
            </h1>
            <p className="mt-1 text-sm text-zinc-400">
              Entre na sua conta para continuar
            </p>
          </div>

          <motion.form
            onSubmit={handleEmailLogin}
            className="mt-6 space-y-4"
            animate={error ? { x: [-4, 4, -4, 4, 0] } : {}}
            transition={{ duration: 0.35 }}
          >
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-zinc-300">Email</label>
              <Input
                type="email"
                placeholder="voce@empresa.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="h-11 border-zinc-700 bg-zinc-950 text-zinc-100 placeholder:text-zinc-600 focus-visible:ring-indigo-500/40"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-zinc-300">Senha</label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="h-11 border-zinc-700 bg-zinc-950 pr-10 text-zinc-100 placeholder:text-zinc-600 focus-visible:ring-indigo-500/40"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 transition-colors hover:text-zinc-300"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300"
              >
                {error}
              </motion.div>
            )}

            <Button
              type="submit"
              className="h-11 w-full bg-indigo-600 text-white hover:bg-indigo-500 btn-glow"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Entrando...
                </span>
              ) : (
                "Entrar com Email"
              )}
            </Button>
          </motion.form>

          <div className="relative mt-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-zinc-800" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-zinc-900 px-2 text-zinc-500">ou</span>
            </div>
          </div>

          <Button
            variant="outline"
            className="mt-6 h-11 w-full border-zinc-700 bg-zinc-800/60 text-zinc-100 hover:bg-zinc-700/60 hover:text-white"
            onClick={handleGoogleLogin}
            disabled={loading}
          >
            Entrar com Google
          </Button>
        </div>
      </SlideUp>
    </main>
  );
}
