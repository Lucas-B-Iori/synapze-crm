"use client";

import { cn } from "@/lib/utils";
import { Mail, MessageCircle } from "lucide-react";
import type { Channel } from "@/types/channel";

interface ChannelSelectorProps {
  channels: Channel[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function ChannelSelector({ channels, selectedId, onSelect }: ChannelSelectorProps) {
  if (channels.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-zinc-700 bg-zinc-900/40 px-3 py-2 text-xs text-zinc-500">
        Nenhum canal configurado. Vá em Configurações &gt; Canais.
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {channels.map((ch) => {
        const isEmail = ch.provider === "email_resend";
        const active = selectedId === ch.id;
        return (
          <button
            key={ch.id}
            type="button"
            onClick={() => onSelect(ch.id)}
            className={cn(
              "flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-all",
              active
                ? "border-indigo-500/50 bg-indigo-500/15 text-indigo-300"
                : "border-zinc-700 bg-zinc-900/60 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200"
            )}
          >
            {isEmail ? <Mail className="h-3 w-3" /> : <MessageCircle className="h-3 w-3" />}
            {ch.name}
          </button>
        );
      })}
    </div>
  );
}
