"use client";

import { Mail, MessageCircle } from "lucide-react";
import { AvatarFallback } from "@/components/ui/avatar-fallback";
import { cn } from "@/lib/utils";
import type { Message } from "@/types/message";

interface MessageBubbleProps {
  message: Message;
  contactName: string;
}

export function MessageBubble({ message, contactName }: MessageBubbleProps) {
  const isInbound = message.direction === "inbound";
  const isWhatsApp = message.provider !== "email_resend";
  const time = new Date(message.created_at).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div
      className={cn(
        "flex w-full gap-3",
        isInbound ? "justify-start" : "justify-end"
      )}
    >
      {isInbound && (
        <AvatarFallback name={contactName} size="sm" />
      )}

      <div
        className={cn(
          "max-w-[80%] rounded-2xl px-4 py-2.5 text-sm shadow-sm",
          isInbound
            ? "rounded-tl-none border border-zinc-700 bg-zinc-800 text-zinc-100"
            : "rounded-tr-none bg-indigo-600 text-white"
        )}
      >
        <p className="leading-relaxed whitespace-pre-wrap">{message.content}</p>
        <div
          className={cn(
            "mt-1 flex items-center justify-end gap-1.5 text-[10px]",
            isInbound ? "text-zinc-400" : "text-indigo-200"
          )}
        >
          <span>{time}</span>
          {isWhatsApp ? (
            <MessageCircle className="h-3 w-3" />
          ) : (
            <Mail className="h-3 w-3" />
          )}
        </div>
      </div>

      {!isInbound && (
        <AvatarFallback name={message.profile?.full_name || "Você"} size="sm" />
      )}
    </div>
  );
}
