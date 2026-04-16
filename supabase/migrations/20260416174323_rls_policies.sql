-- ============================================
-- F1.2: Row Level Security (RLS)
-- ============================================

-- Habilitar RLS nas tabelas
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.member_assignments ENABLE ROW LEVEL SECURITY;

-- Remover políticas antigas se existirem (idempotência)
DROP POLICY IF EXISTS "profiles_select" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update" ON public.profiles;
DROP POLICY IF EXISTS "workspaces_select" ON public.workspaces;
DROP POLICY IF EXISTS "workspaces_insert" ON public.workspaces;
DROP POLICY IF EXISTS "workspaces_update" ON public.workspaces;
DROP POLICY IF EXISTS "workspaces_delete" ON public.workspaces;
DROP POLICY IF EXISTS "workspace_members_select" ON public.workspace_members;
DROP POLICY IF EXISTS "workspace_members_insert" ON public.workspace_members;
DROP POLICY IF EXISTS "workspace_members_update" ON public.workspace_members;
DROP POLICY IF EXISTS "workspace_members_delete" ON public.workspace_members;
DROP POLICY IF EXISTS "member_assignments_select" ON public.member_assignments;
DROP POLICY IF EXISTS "member_assignments_insert" ON public.member_assignments;
DROP POLICY IF EXISTS "member_assignments_update" ON public.member_assignments;
DROP POLICY IF EXISTS "member_assignments_delete" ON public.member_assignments;

-- ============================================
-- PROFILES
-- ============================================
-- Um usuário pode ver seu próprio profile e profiles de pessoas no mesmo workspace
CREATE POLICY "profiles_select"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.workspace_members wm
    WHERE wm.profile_id = profiles.id
      AND wm.workspace_id IN (
        SELECT workspace_id FROM public.workspace_members
        WHERE profile_id = auth.uid() AND status = 'active'
      )
  )
);

-- Apenas o próprio usuário pode atualizar seu profile
CREATE POLICY "profiles_update"
ON public.profiles
FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- ============================================
-- WORKSPACES
-- ============================================
-- Membros ativos podem ver seu workspace
CREATE POLICY "workspaces_select"
ON public.workspaces
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.workspace_members
    WHERE workspace_id = workspaces.id
      AND profile_id = auth.uid()
      AND status = 'active'
  )
);

-- Qualquer usuário autenticado pode criar workspace (controle de quotas na aplicação)
CREATE POLICY "workspaces_insert"
ON public.workspaces
FOR INSERT
TO authenticated
WITH CHECK (owner_id = auth.uid());

-- Apenas owner pode atualizar
CREATE POLICY "workspaces_update"
ON public.workspaces
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.workspace_members
    WHERE workspace_id = workspaces.id
      AND profile_id = auth.uid()
      AND status = 'active'
      AND role = 'owner'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.workspace_members
    WHERE workspace_id = workspaces.id
      AND profile_id = auth.uid()
      AND status = 'active'
      AND role = 'owner'
  )
);

-- Apenas owner pode deletar
CREATE POLICY "workspaces_delete"
ON public.workspaces
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.workspace_members
    WHERE workspace_id = workspaces.id
      AND profile_id = auth.uid()
      AND status = 'active'
      AND role = 'owner'
  )
);

-- ============================================
-- WORKSPACE_MEMBERS
-- ============================================
-- Qualquer membro ativo do workspace pode ver outros membros (pragmático para o MVP)
CREATE POLICY "workspace_members_select"
ON public.workspace_members
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.workspace_members my_membership
    WHERE my_membership.workspace_id = workspace_members.workspace_id
      AND my_membership.profile_id = auth.uid()
      AND my_membership.status = 'active'
  )
);

-- Apenas owner/manager podem inserir
CREATE POLICY "workspace_members_insert"
ON public.workspace_members
FOR INSERT
TO authenticated
WITH CHECK (
  public.is_workspace_owner_or_manager(workspace_id)
);

-- Apenas owner/manager podem atualizar
CREATE POLICY "workspace_members_update"
ON public.workspace_members
FOR UPDATE
TO authenticated
USING (
  public.is_workspace_owner_or_manager(workspace_id)
)
WITH CHECK (
  public.is_workspace_owner_or_manager(workspace_id)
);

-- Apenas owner/manager podem deletar
CREATE POLICY "workspace_members_delete"
ON public.workspace_members
FOR DELETE
TO authenticated
USING (
  public.is_workspace_owner_or_manager(workspace_id)
);

-- ============================================
-- MEMBER_ASSIGNMENTS
-- ============================================
-- Qualquer membro ativo do workspace pode ver atribuições
CREATE POLICY "member_assignments_select"
ON public.member_assignments
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.workspace_members my_membership
    WHERE my_membership.workspace_id = member_assignments.workspace_id
      AND my_membership.profile_id = auth.uid()
      AND my_membership.status = 'active'
  )
);

-- Apenas owner/manager podem inserir
CREATE POLICY "member_assignments_insert"
ON public.member_assignments
FOR INSERT
TO authenticated
WITH CHECK (
  public.is_workspace_owner_or_manager(workspace_id)
);

-- Apenas owner/manager podem atualizar
CREATE POLICY "member_assignments_update"
ON public.member_assignments
FOR UPDATE
TO authenticated
USING (
  public.is_workspace_owner_or_manager(workspace_id)
)
WITH CHECK (
  public.is_workspace_owner_or_manager(workspace_id)
);

-- Apenas owner/manager podem deletar
CREATE POLICY "member_assignments_delete"
ON public.member_assignments
FOR DELETE
TO authenticated
USING (
  public.is_workspace_owner_or_manager(workspace_id)
);
