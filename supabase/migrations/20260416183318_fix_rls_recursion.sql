-- ============================================
-- Fix: Infinite recursion in RLS policies
-- ============================================

-- Recreate helper functions as SECURITY DEFINER to bypass RLS
-- This prevents infinite recursion when policies query the same table

CREATE OR REPLACE FUNCTION public.is_workspace_member(p_workspace_id UUID)
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
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.current_workspace_role(p_workspace_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
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
$$;

CREATE OR REPLACE FUNCTION public.is_workspace_owner_or_manager(p_workspace_id UUID)
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
-- Recreate workspace_members policies using the SECURITY DEFINER functions
-- ============================================

DROP POLICY IF EXISTS "workspace_members_select" ON public.workspace_members;
DROP POLICY IF EXISTS "workspace_members_insert" ON public.workspace_members;
DROP POLICY IF EXISTS "workspace_members_update" ON public.workspace_members;
DROP POLICY IF EXISTS "workspace_members_delete" ON public.workspace_members;

DROP POLICY IF EXISTS "member_assignments_select" ON public.member_assignments;
DROP POLICY IF EXISTS "member_assignments_insert" ON public.member_assignments;
DROP POLICY IF EXISTS "member_assignments_update" ON public.member_assignments;
DROP POLICY IF EXISTS "member_assignments_delete" ON public.member_assignments;

-- WORKSPACE_MEMBERS
CREATE POLICY "workspace_members_select"
ON public.workspace_members
FOR SELECT
TO authenticated
USING (
  public.is_workspace_member(workspace_id)
);

CREATE POLICY "workspace_members_insert"
ON public.workspace_members
FOR INSERT
TO authenticated
WITH CHECK (
  public.is_workspace_owner_or_manager(workspace_id)
);

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

CREATE POLICY "workspace_members_delete"
ON public.workspace_members
FOR DELETE
TO authenticated
USING (
  public.is_workspace_owner_or_manager(workspace_id)
);

-- MEMBER_ASSIGNMENTS
CREATE POLICY "member_assignments_select"
ON public.member_assignments
FOR SELECT
TO authenticated
USING (
  public.is_workspace_member(workspace_id)
);

CREATE POLICY "member_assignments_insert"
ON public.member_assignments
FOR INSERT
TO authenticated
WITH CHECK (
  public.is_workspace_owner_or_manager(workspace_id)
);

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

CREATE POLICY "member_assignments_delete"
ON public.member_assignments
FOR DELETE
TO authenticated
USING (
  public.is_workspace_owner_or_manager(workspace_id)
);
