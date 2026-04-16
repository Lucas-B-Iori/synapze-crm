-- ============================================
-- F2.3: Schema de Pipelines e Kanban
-- ============================================

CREATE TABLE IF NOT EXISTS public.pipelines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE public.pipelines IS 'Pipeline de Kanban por profissional';

CREATE TABLE IF NOT EXISTS public.pipeline_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pipeline_id UUID NOT NULL REFERENCES public.pipelines(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#6366F1',
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE public.pipeline_stages IS 'Colunas do Kanban dentro de um pipeline';

CREATE TABLE IF NOT EXISTS public.pipeline_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  stage_id UUID NOT NULL REFERENCES public.pipeline_stages(id) ON DELETE CASCADE,
  pipeline_id UUID NOT NULL REFERENCES public.pipelines(id) ON DELETE CASCADE,
  position INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (contact_id, pipeline_id)
);

COMMENT ON TABLE public.pipeline_cards IS 'Cards do Kanban vinculados a contatos e stages';

-- Índices
CREATE INDEX IF NOT EXISTS idx_pipelines_workspace_id ON public.pipelines(workspace_id);
CREATE INDEX IF NOT EXISTS idx_pipelines_profile_id ON public.pipelines(profile_id);
CREATE INDEX IF NOT EXISTS idx_pipeline_stages_pipeline_id ON public.pipeline_stages(pipeline_id);
CREATE INDEX IF NOT EXISTS idx_pipeline_cards_pipeline_id ON public.pipeline_cards(pipeline_id);
CREATE INDEX IF NOT EXISTS idx_pipeline_cards_stage_id ON public.pipeline_cards(stage_id);
CREATE INDEX IF NOT EXISTS idx_pipeline_cards_contact_id ON public.pipeline_cards(contact_id);

-- Função para criar pipeline padrão automaticamente para um novo profissional
CREATE OR REPLACE FUNCTION public.create_default_pipeline()
RETURNS TRIGGER AS $$
DECLARE
  new_pipeline_id UUID;
BEGIN
  INSERT INTO public.pipelines (profile_id, workspace_id, name)
  VALUES (NEW.profile_id, NEW.workspace_id, 'Meu Funil')
  RETURNING id INTO new_pipeline_id;

  INSERT INTO public.pipeline_stages (pipeline_id, name, color, order_index)
  VALUES
    (new_pipeline_id, 'Novo Lead', '#6366F1', 0),
    (new_pipeline_id, 'Em Atendimento', '#F59E0B', 1),
    (new_pipeline_id, 'Proposta Enviada', '#10B981', 2),
    (new_pipeline_id, 'Fechado', '#22C55E', 3);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger que dispara quando um membro do workspace com role 'professional' é ativado
CREATE OR REPLACE FUNCTION public.handle_professional_member()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role = 'professional' AND NEW.status = 'active' THEN
    -- Verifica se já existe pipeline para esse profissional nesse workspace
    IF NOT EXISTS (
      SELECT 1 FROM public.pipelines
      WHERE profile_id = NEW.profile_id AND workspace_id = NEW.workspace_id
    ) THEN
      PERFORM public.create_default_pipeline_for_member(NEW.profile_id, NEW.workspace_id);
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função auxiliar para criar pipeline padrão (pode ser chamada diretamente também)
CREATE OR REPLACE FUNCTION public.create_default_pipeline_for_member(p_profile_id UUID, p_workspace_id UUID)
RETURNS UUID AS $$
DECLARE
  new_pipeline_id UUID;
BEGIN
  INSERT INTO public.pipelines (profile_id, workspace_id, name)
  VALUES (p_profile_id, p_workspace_id, 'Meu Funil')
  RETURNING id INTO new_pipeline_id;

  INSERT INTO public.pipeline_stages (pipeline_id, name, color, order_index)
  VALUES
    (new_pipeline_id, 'Novo Lead', '#6366F1', 0),
    (new_pipeline_id, 'Em Atendimento', '#F59E0B', 1),
    (new_pipeline_id, 'Proposta Enviada', '#10B981', 2),
    (new_pipeline_id, 'Fechado', '#22C55E', 3);

  RETURN new_pipeline_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
