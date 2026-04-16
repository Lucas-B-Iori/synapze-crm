-- ============================================
-- F1.1: Schema de Autenticação e Workspaces
-- ============================================

-- 1. Perfis (estendem auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE public.profiles IS 'Perfil público de cada usuário autenticado';

-- 2. Workspaces (tenant / clínica / escritório)
CREATE TABLE IF NOT EXISTS public.workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  plan_tier TEXT NOT NULL DEFAULT 'starter' CHECK (plan_tier IN ('starter', 'pro', 'enterprise')),
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  settings JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE public.workspaces IS 'Workspace isolado multi-tenant';

-- 3. Membros do Workspace
CREATE TABLE IF NOT EXISTS public.workspace_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'manager', 'professional', 'assistant')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'pending')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (workspace_id, profile_id)
);

COMMENT ON TABLE public.workspace_members IS 'Vínculo de um usuário a um workspace com role e status';

-- 4. Atribuições de Membros (manager/professional/assistant)
CREATE TABLE IF NOT EXISTS public.member_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  manager_id UUID REFERENCES public.workspace_members(id) ON DELETE SET NULL,
  professional_id UUID NOT NULL REFERENCES public.workspace_members(id) ON DELETE CASCADE,
  assistant_id UUID REFERENCES public.workspace_members(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT at_least_one_supervisor CHECK (
    manager_id IS NOT NULL OR assistant_id IS NOT NULL
  )
);

COMMENT ON TABLE public.member_assignments IS 'Gerencia vínculos hierárquicos entre membros do workspace';

-- ============================================
-- Trigger: criar profile automaticamente após signup
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- Funções auxiliares para RLS
-- ============================================
CREATE OR REPLACE FUNCTION public.is_workspace_member(p_workspace_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.workspace_members
    WHERE workspace_id = p_workspace_id
      AND profile_id = auth.uid()
      AND status = 'active'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.current_workspace_role(p_workspace_id UUID)
RETURNS TEXT AS $$
DECLARE
  member_role TEXT;
BEGIN
  SELECT role INTO member_role
  FROM public.workspace_members
  WHERE workspace_id = p_workspace_id
    AND profile_id = auth.uid()
    AND status = 'active';
  RETURN member_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_workspace_owner_or_manager(p_workspace_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.workspace_members
    WHERE workspace_id = p_workspace_id
      AND profile_id = auth.uid()
      AND status = 'active'
      AND role IN ('owner', 'manager')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- Índices de performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_workspace_members_workspace_id ON public.workspace_members(workspace_id);
CREATE INDEX IF NOT EXISTS idx_workspace_members_profile_id ON public.workspace_members(profile_id);
CREATE INDEX IF NOT EXISTS idx_member_assignments_workspace_id ON public.member_assignments(workspace_id);
CREATE INDEX IF NOT EXISTS idx_member_assignments_professional_id ON public.member_assignments(professional_id);
CREATE INDEX IF NOT EXISTS idx_workspaces_owner_id ON public.workspaces(owner_id);
