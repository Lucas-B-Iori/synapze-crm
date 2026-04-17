-- ============================================
-- F3.1: Schema Omnichannel — Canais, Atribuições e Mensagens
-- ============================================

-- 1. Habilitar pgvector (preparação para embeddings na Fase 4)
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Tabela de Canais de Comunicação
CREATE TABLE IF NOT EXISTS public.channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  provider TEXT NOT NULL CHECK (provider IN ('whatsapp_meta', 'whatsapp_evolution', 'email_resend')),
  credentials JSONB NOT NULL DEFAULT '{}',
  config JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE public.channels IS 'Canais de comunicação omnichannel conectados a um workspace';

-- 3. Tabela de Atribuições de Canal a Membros
CREATE TABLE IF NOT EXISTS public.channel_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID NOT NULL REFERENCES public.channels(id) ON DELETE CASCADE,
  workspace_member_id UUID NOT NULL REFERENCES public.workspace_members(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (channel_id, workspace_member_id)
);

COMMENT ON TABLE public.channel_assignments IS 'Vincula canais de comunicação a membros específicos do workspace';

-- 4. Tabela Mãe de Mensagens
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  channel_id UUID REFERENCES public.channels(id) ON DELETE SET NULL,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  provider TEXT NOT NULL CHECK (provider IN ('whatsapp_meta', 'whatsapp_evolution', 'email_resend')),
  content TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('pending', 'sent', 'delivered', 'read', 'failed')),
  external_id TEXT,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  embedding vector(1536) NULL
);

COMMENT ON TABLE public.messages IS 'Thread unificada de mensagens omnichannel (WhatsApp + Email)';

-- 5. Índices de performance
CREATE INDEX IF NOT EXISTS idx_messages_workspace_contact ON public.messages(workspace_id, contact_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_channel ON public.messages(channel_id);
CREATE INDEX IF NOT EXISTS idx_messages_external ON public.messages(external_id);
CREATE INDEX IF NOT EXISTS idx_channel_assignments_channel ON public.channel_assignments(channel_id);
CREATE INDEX IF NOT EXISTS idx_channel_assignments_member ON public.channel_assignments(workspace_member_id);
CREATE INDEX IF NOT EXISTS idx_channels_workspace_id ON public.channels(workspace_id);

-- Índice ivfflat para vetores (Fase 4)
CREATE INDEX IF NOT EXISTS idx_messages_embedding ON public.messages USING ivfflat (embedding vector_cosine_ops);

-- 6. Habilitar RLS
ALTER TABLE public.channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.channel_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- 7. Remover políticas antigas (idempotência)
DROP POLICY IF EXISTS "channels_select" ON public.channels;
DROP POLICY IF EXISTS "channels_insert" ON public.channels;
DROP POLICY IF EXISTS "channels_update" ON public.channels;
DROP POLICY IF EXISTS "channels_delete" ON public.channels;

DROP POLICY IF EXISTS "channel_assignments_select" ON public.channel_assignments;
DROP POLICY IF EXISTS "channel_assignments_insert" ON public.channel_assignments;
DROP POLICY IF EXISTS "channel_assignments_update" ON public.channel_assignments;
DROP POLICY IF EXISTS "channel_assignments_delete" ON public.channel_assignments;

DROP POLICY IF EXISTS "messages_select" ON public.messages;
DROP POLICY IF EXISTS "messages_insert" ON public.messages;
DROP POLICY IF EXISTS "messages_update" ON public.messages;
DROP POLICY IF EXISTS "messages_delete" ON public.messages;

-- 8. Função auxiliar para verificar permissão de gerenciamento de canais
CREATE OR REPLACE FUNCTION public.can_manage_channels(p_workspace_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.workspace_members
    WHERE workspace_id = p_workspace_id
      AND profile_id = auth.uid()
      AND status = 'active'
      AND role IN ('owner', 'manager')
  );
END;
$$;

-- ============================================
-- RLS: CHANNELS
-- ============================================
CREATE POLICY "channels_select"
ON public.channels
FOR SELECT
TO authenticated
USING (
  public.is_workspace_member(workspace_id)
);

CREATE POLICY "channels_insert"
ON public.channels
FOR INSERT
TO authenticated
WITH CHECK (
  public.can_manage_channels(workspace_id)
);

CREATE POLICY "channels_update"
ON public.channels
FOR UPDATE
TO authenticated
USING (
  public.can_manage_channels(workspace_id)
)
WITH CHECK (
  public.can_manage_channels(workspace_id)
);

CREATE POLICY "channels_delete"
ON public.channels
FOR DELETE
TO authenticated
USING (
  public.can_manage_channels(workspace_id)
);

-- ============================================
-- RLS: CHANNEL_ASSIGNMENTS
-- ============================================
CREATE POLICY "channel_assignments_select"
ON public.channel_assignments
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.channels c
    WHERE c.id = channel_assignments.channel_id
      AND public.is_workspace_member(c.workspace_id)
  )
);

CREATE POLICY "channel_assignments_insert"
ON public.channel_assignments
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.channels c
    WHERE c.id = channel_assignments.channel_id
      AND public.can_manage_channels(c.workspace_id)
  )
);

CREATE POLICY "channel_assignments_update"
ON public.channel_assignments
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.channels c
    WHERE c.id = channel_assignments.channel_id
      AND public.can_manage_channels(c.workspace_id)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.channels c
    WHERE c.id = channel_assignments.channel_id
      AND public.can_manage_channels(c.workspace_id)
  )
);

CREATE POLICY "channel_assignments_delete"
ON public.channel_assignments
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.channels c
    WHERE c.id = channel_assignments.channel_id
      AND public.can_manage_channels(c.workspace_id)
  )
);

-- ============================================
-- RLS: MESSAGES
-- ============================================
CREATE POLICY "messages_select"
ON public.messages
FOR SELECT
TO authenticated
USING (
  public.is_workspace_member(workspace_id)
);

-- Inserção: qualquer membro ativo pode inserir mensagens do workspace
-- (a lógica de "somente quem tem canal atribuído" é aplicada na aplicação)
CREATE POLICY "messages_insert"
ON public.messages
FOR INSERT
TO authenticated
WITH CHECK (
  public.is_workspace_member(workspace_id)
);

-- Update: membros podem atualizar mensagens do próprio workspace
-- (ex: marcar como lida, atualizar status de delivery)
CREATE POLICY "messages_update"
ON public.messages
FOR UPDATE
TO authenticated
USING (
  public.is_workspace_member(workspace_id)
)
WITH CHECK (
  public.is_workspace_member(workspace_id)
);

-- Delete: apenas owner/manager podem deletar mensagens
CREATE POLICY "messages_delete"
ON public.messages
FOR DELETE
TO authenticated
USING (
  public.can_manage_channels(workspace_id)
);
