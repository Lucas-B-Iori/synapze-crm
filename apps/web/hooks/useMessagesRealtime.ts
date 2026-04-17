"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Message } from "@/types/message";

export function useMessagesRealtime(contactId: string, onInsert: (msg: Message) => void) {
  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel(`messages:contact:${contactId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `contact_id=eq.${contactId}`,
        },
        (payload) => {
          onInsert(payload.new as Message);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [contactId, onInsert]);
}
