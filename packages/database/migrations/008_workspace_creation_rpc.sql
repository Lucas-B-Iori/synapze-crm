-- ============================================
-- Fix: Workspace creation RLS bypass via secure RPC function
-- ============================================

-- This function creates a workspace and adds the owner as an active member
-- in a single transaction, bypassing RLS because it runs as SECURITY DEFINER.
-- It eliminates the need for a service-role Supabase client in the app layer.

CREATE OR REPLACE FUNCTION public.create_workspace_with_owner(
  p_name TEXT,
  p_owner_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_workspace_id UUID;
  v_slug TEXT;
  v_workspace_json JSONB;
BEGIN
  -- Generate a unique slug
  v_slug := lower(regexp_replace(p_name, '\s+', '-', 'g'));
  v_slug := regexp_replace(v_slug, '[^a-z0-9-]', '', 'g');
  v_slug := v_slug || '-' || extract(epoch from now())::bigint;

  -- Insert workspace
  INSERT INTO public.workspaces (name, slug, owner_id, plan_tier)
  VALUES (p_name, v_slug, p_owner_id, 'starter')
  RETURNING id INTO v_workspace_id;

  -- Insert owner as active member
  INSERT INTO public.workspace_members (workspace_id, profile_id, role, status)
  VALUES (v_workspace_id, p_owner_id, 'owner', 'active');

  -- Return workspace as JSONB
  SELECT to_jsonb(w.*) INTO v_workspace_json
  FROM public.workspaces w
  WHERE w.id = v_workspace_id;

  RETURN v_workspace_json;
END;
$$;

-- ============================================
-- Helper: Get auth user id by email (SECURITY DEFINER)
-- ============================================

CREATE OR REPLACE FUNCTION public.get_auth_user_id_by_email(p_email TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = p_email
  LIMIT 1;

  RETURN v_user_id;
END;
$$;
