"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Building2, Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createWorkspace } from "@/server/actions/workspace.actions";
import { SlideUp } from "@/components/motion/slide-up";
import { toast } from "sonner";

export function OnboardingView() {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const result = await createWorkspace(name.trim());
    setLoading(false);

    if (result.error) {
      toast.error(result.error);
    } else {
      setSuccess(true);
      toast.success("Workspace criado! Bem-vindo ao Synapze.");
      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 1200);
    }
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center p-6">
      {/* Ambient glow */}
      <div className="pointer-events-none fixed inset-0 -z-10" aria-hidden="true">
        <div className="absolute left-1/2 top-1/3 h-[40%] w-[40%] -translate-x-1/2 rounded-full bg-indigo-600/10 blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 h-[30%] w-[30%] rounded-full bg-violet-600/10 blur-[100px]" />
      </div>

      <SlideUp className="w-full max-w-md">
        <div className="relative overflow-hidden rounded-2xl border border-zinc-700/50 bg-zinc-900/80 p-8 shadow-2xl backdrop-blur-xl">
          {/* Decorative top line */}
          <div className="absolute left-0 right-0 top-0 h-1 bg-gradient-to-r from-indigo-500 via-violet-500 to-indigo-500" />

          <div className="text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-glow">
              <Building2 className="h-6 w-6" />
            </div>
            <h1 className="mt-5 text-2xl font-semibold tracking-tight text-zinc-100">
              Bem-vindo ao Synapze
            </h1>
            <p className="mt-2 text-sm text-zinc-400">
              Vamos criar o seu primeiro workspace para começar.
            </p>
          </div>

          <AnimatePresence mode="wait">
            {!success ? (
              <motion.form
                key="form"
                initial={{ opacity: 1 }}
                exit={{ opacity: 0, y: -8 }}
                onSubmit={handleSubmit}
                className="mt-6 space-y-4"
              >
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-zinc-300">Nome do Workspace</label>
                  <Input
                    placeholder="Ex: Clínica Saúde Total"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="h-11 border-zinc-700 bg-zinc-950 text-zinc-100 placeholder:text-zinc-600 focus-visible:ring-indigo-500/40"
                  />
                </div>

                <Button
                  type="submit"
                  className="h-11 w-full bg-indigo-600 text-white hover:bg-indigo-500 btn-glow"
                  disabled={loading}
                >
                  {loading ? "Criando..." : "Criar Workspace"}
                </Button>
              </motion.form>
            ) : (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mt-8 flex flex-col items-center justify-center"
              >
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400">
                  <Check className="h-7 w-7" />
                </div>
                <p className="mt-4 text-lg font-medium text-zinc-100">Workspace criado!</p>
                <p className="text-sm text-zinc-400">Redirecionando...</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <p className="mt-6 text-center text-xs text-zinc-500">
          Sua jornada começa agora. <Sparkles className="-mt-0.5 inline h-3 w-3 text-amber-400" />
        </p>
      </SlideUp>
    </div>
  );
}
