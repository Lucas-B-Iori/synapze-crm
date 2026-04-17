"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Send, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageBubble } from "./message-bubble";
import { ChannelSelector } from "./channel-selector";
import { useMessagesRealtime } from "@/hooks/useMessagesRealtime";
import { fetchMessagesForContact, sendMessageAction } from "@/server/actions/message.actions";
import { toast } from "sonner";
import type { Message } from "@/types/message";
import type { Channel } from "@/types/channel";

interface MessageThreadProps {
  workspaceId: string;
  contactId: string;
  contactName: string;
  contactPhone?: string | null;
  contactEmail?: string | null;
  channels: Channel[];
  userId: string;
  userName?: string | null;
}

export function MessageThread({
  workspaceId,
  contactId,
  contactName,
  contactPhone,
  contactEmail,
  channels,
  userId,
}: MessageThreadProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(channels[0]?.id || null);
  const [showSubject, setShowSubject] = useState(false);
  const [subject, setSubject] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const selectedChannel = channels.find((c) => c.id === selectedChannelId);
  const isEmail = selectedChannel?.provider === "email_resend";

  const loadMessages = useCallback(async () => {
    setLoading(true);
    const result = await fetchMessagesForContact(contactId, workspaceId);
    if (result.data) {
      setMessages(result.data);
    }
    setLoading(false);
  }, [contactId, workspaceId]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages.length]);

  useMessagesRealtime(contactId, (msg) => {
    setMessages((prev) => {
      if (prev.some((m) => m.id === msg.id)) return prev;
      return [...prev, msg];
    });
  });

  async function handleSend(e?: React.FormEvent) {
    e?.preventDefault();
    if (!selectedChannelId || !content.trim()) return;

    const to = isEmail ? contactEmail : contactPhone;
    if (!to) {
      toast.error(isEmail ? "Contato não possui email" : "Contato não possui telefone");
      return;
    }

    // Optimistic UI
    const optimistic: Message = {
      id: `opt-${Date.now()}`,
      workspace_id: workspaceId,
      contact_id: contactId,
      channel_id: selectedChannelId,
      profile_id: userId,
      direction: "outbound",
      provider: selectedChannel!.provider as Message["provider"],
      content: content.trim(),
      metadata: isEmail ? { subject: subject || "(sem assunto)" } : {},
      status: "pending",
      external_id: null,
      sent_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      profile: { id: userId, full_name: null },
    };

    setMessages((prev) => [...prev, optimistic]);
    const previousContent = content;
    setContent("");
    setSending(true);

    const result = await sendMessageAction({
      workspaceId,
      contactId,
      channelId: selectedChannelId,
      content: previousContent.trim(),
      profileId: userId,
      subject: isEmail ? subject || "(sem assunto)" : undefined,
      to,
    });

    setSending(false);

    if (result.error || !result.data) {
      toast.error(result.error || "Erro ao enviar");
      setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
      setContent(previousContent);
      return;
    }

    // Replace optimistic with real message
    setMessages((prev) =>
      prev.map((m) => (m.id === optimistic.id ? result.data! : m))
    );

    if (isEmail) {
      setSubject("");
      setShowSubject(false);
    }
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b border-zinc-800 pb-3">
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-zinc-500">
          Canal de envio
        </p>
        <ChannelSelector
          channels={channels}
          selectedId={selectedChannelId}
          onSelect={(id) => {
            setSelectedChannelId(id);
            setShowSubject(false);
            setSubject("");
          }}
        />
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 py-3">
        <div ref={scrollRef} className="flex min-h-full flex-col gap-3 px-1">
          {loading ? (
            <div className="flex flex-1 items-center justify-center">
              <p className="text-sm text-zinc-500">Carregando mensagens...</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center py-8 text-center">
              <p className="text-sm text-zinc-400">Nenhuma mensagem ainda.</p>
              <p className="text-xs text-zinc-500">Inicie a conversa pelo canal selecionado.</p>
            </div>
          ) : (
            messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} contactName={contactName} />
            ))
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="border-t border-zinc-800 pt-3">
        {isEmail && (
          <button
            type="button"
            onClick={() => setShowSubject((v) => !v)}
            className="mb-2 flex items-center gap-1 text-xs text-zinc-400 hover:text-zinc-200"
          >
            {showSubject ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            {showSubject ? "Ocultar assunto" : "Adicionar assunto"}
          </button>
        )}

        {isEmail && showSubject && (
          <Input
            placeholder="Assunto do email"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="mb-2 h-9 border-zinc-700 bg-zinc-950 text-sm text-zinc-100 focus-visible:ring-indigo-500/40"
          />
        )}

        <form onSubmit={handleSend} className="flex items-end gap-2">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={isEmail ? "Digite o email..." : "Digite a mensagem..."}
            rows={1}
            className="min-h-[44px] flex-1 resize-none border-zinc-700 bg-zinc-950 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus-visible:ring-indigo-500/40"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
          />
          <Button
            type="submit"
            size="icon"
            disabled={sending || !content.trim() || !selectedChannelId}
            className="h-10 w-10 shrink-0 bg-indigo-600 text-white hover:bg-indigo-500 btn-glow"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
