-- ============================================
-- F2.x: Row Level Security para Fase 2
-- ============================================

ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_field_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_custom_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pipelines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pipeline_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pipeline_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_files ENABLE ROW LEVEL SECURITY;

-- Drop policies for idempotency
DROP POLICY IF EXISTS "contacts_select" ON public.contacts;
DROP POLICY IF EXISTS "contacts_insert" ON public.contacts;
DROP POLICY IF EXISTS "contacts_update" ON public.contacts;
DROP POLICY IF EXISTS "contacts_delete" ON public.contacts;

DROP POLICY IF EXISTS "custom_field_definitions_select" ON public.custom_field_definitions;
DROP POLICY IF EXISTS "custom_field_definitions_insert" ON public.custom_field_definitions;
DROP POLICY IF EXISTS "custom_field_definitions_update" ON public.custom_field_definitions;
DROP POLICY IF EXISTS "custom_field_definitions_delete" ON public.custom_field_definitions;

DROP POLICY IF EXISTS "contact_custom_values_select" ON public.contact_custom_values;
DROP POLICY IF EXISTS "contact_custom_values_insert" ON public.contact_custom_values;
DROP POLICY IF EXISTS "contact_custom_values_update" ON public.contact_custom_values;
DROP POLICY IF EXISTS "contact_custom_values_delete" ON public.contact_custom_values;

DROP POLICY IF EXISTS "contact_assignments_select" ON public.contact_assignments;
DROP POLICY IF EXISTS "contact_assignments_insert" ON public.contact_assignments;
DROP POLICY IF EXISTS "contact_assignments_update" ON public.contact_assignments;
DROP POLICY IF EXISTS "contact_assignments_delete" ON public.contact_assignments;

DROP POLICY IF EXISTS "pipelines_select" ON public.pipelines;
DROP POLICY IF EXISTS "pipelines_insert" ON public.pipelines;
DROP POLICY IF EXISTS "pipelines_update" ON public.pipelines;
DROP POLICY IF EXISTS "pipelines_delete" ON public.pipelines;

DROP POLICY IF EXISTS "pipeline_stages_select" ON public.pipeline_stages;
DROP POLICY IF EXISTS "pipeline_stages_insert" ON public.pipeline_stages;
DROP POLICY IF EXISTS "pipeline_stages_update" ON public.pipeline_stages;
DROP POLICY IF EXISTS "pipeline_stages_delete" ON public.pipeline_stages;

DROP POLICY IF EXISTS "pipeline_cards_select" ON public.pipeline_cards;
DROP POLICY IF EXISTS "pipeline_cards_insert" ON public.pipeline_cards;
DROP POLICY IF EXISTS "pipeline_cards_update" ON public.pipeline_cards;
DROP POLICY IF EXISTS "pipeline_cards_delete" ON public.pipeline_cards;

DROP POLICY IF EXISTS "contact_notes_select" ON public.contact_notes;
DROP POLICY IF EXISTS "contact_notes_insert" ON public.contact_notes;
DROP POLICY IF EXISTS "contact_notes_update" ON public.contact_notes;
DROP POLICY IF EXISTS "contact_notes_delete" ON public.contact_notes;

DROP POLICY IF EXISTS "contact_files_select" ON public.contact_files;
DROP POLICY IF EXISTS "contact_files_insert" ON public.contact_files;
DROP POLICY IF EXISTS "contact_files_update" ON public.contact_files;
DROP POLICY IF EXISTS "contact_files_delete" ON public.contact_files;

-- ============================================
-- CONTACTS
-- ============================================
CREATE POLICY "contacts_select"
ON public.contacts
FOR SELECT
TO authenticated
USING (
  public.is_workspace_member(workspace_id)
);

CREATE POLICY "contacts_insert"
ON public.contacts
FOR INSERT
TO authenticated
WITH CHECK (
  public.is_workspace_member(workspace_id)
);

CREATE POLICY "contacts_update"
ON public.contacts
FOR UPDATE
TO authenticated
USING (
  public.is_workspace_member(workspace_id)
)
WITH CHECK (
  public.is_workspace_member(workspace_id)
);

CREATE POLICY "contacts_delete"
ON public.contacts
FOR DELETE
TO authenticated
USING (
  public.is_workspace_member(workspace_id)
);

-- ============================================
-- CUSTOM FIELD DEFINITIONS
-- ============================================
CREATE POLICY "custom_field_definitions_select"
ON public.custom_field_definitions
FOR SELECT
TO authenticated
USING (
  public.is_workspace_member(workspace_id)
);

CREATE POLICY "custom_field_definitions_insert"
ON public.custom_field_definitions
FOR INSERT
TO authenticated
WITH CHECK (
  public.is_workspace_owner_or_manager(workspace_id)
);

CREATE POLICY "custom_field_definitions_update"
ON public.custom_field_definitions
FOR UPDATE
TO authenticated
USING (
  public.is_workspace_owner_or_manager(workspace_id)
)
WITH CHECK (
  public.is_workspace_owner_or_manager(workspace_id)
);

CREATE POLICY "custom_field_definitions_delete"
ON public.custom_field_definitions
FOR DELETE
TO authenticated
USING (
  public.is_workspace_owner_or_manager(workspace_id)
);

-- ============================================
-- CONTACT CUSTOM VALUES
-- ============================================
CREATE POLICY "contact_custom_values_select"
ON public.contact_custom_values
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.contacts c
    WHERE c.id = contact_custom_values.contact_id
      AND public.is_workspace_member(c.workspace_id)
  )
);

CREATE POLICY "contact_custom_values_insert"
ON public.contact_custom_values
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.contacts c
    WHERE c.id = contact_custom_values.contact_id
      AND public.is_workspace_member(c.workspace_id)
  )
);

CREATE POLICY "contact_custom_values_update"
ON public.contact_custom_values
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.contacts c
    WHERE c.id = contact_custom_values.contact_id
      AND public.is_workspace_member(c.workspace_id)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.contacts c
    WHERE c.id = contact_custom_values.contact_id
      AND public.is_workspace_member(c.workspace_id)
  )
);

CREATE POLICY "contact_custom_values_delete"
ON public.contact_custom_values
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.contacts c
    WHERE c.id = contact_custom_values.contact_id
      AND public.is_workspace_member(c.workspace_id)
  )
);

-- ============================================
-- CONTACT ASSIGNMENTS
-- ============================================
CREATE POLICY "contact_assignments_select"
ON public.contact_assignments
FOR SELECT
TO authenticated
USING (
  public.is_workspace_member(workspace_id)
);

CREATE POLICY "contact_assignments_insert"
ON public.contact_assignments
FOR INSERT
TO authenticated
WITH CHECK (
  public.is_workspace_member(workspace_id)
);

CREATE POLICY "contact_assignments_update"
ON public.contact_assignments
FOR UPDATE
TO authenticated
USING (
  public.is_workspace_member(workspace_id)
)
WITH CHECK (
  public.is_workspace_member(workspace_id)
);

CREATE POLICY "contact_assignments_delete"
ON public.contact_assignments
FOR DELETE
TO authenticated
USING (
  public.is_workspace_member(workspace_id)
);

-- ============================================
-- PIPELINES
-- ============================================
CREATE POLICY "pipelines_select"
ON public.pipelines
FOR SELECT
TO authenticated
USING (
  public.is_workspace_member(workspace_id)
  AND (
    profile_id = auth.uid()
    OR public.is_workspace_owner_or_manager(workspace_id)
  )
);

CREATE POLICY "pipelines_insert"
ON public.pipelines
FOR INSERT
TO authenticated
WITH CHECK (
  public.is_workspace_member(workspace_id)
  AND (
    profile_id = auth.uid()
    OR public.is_workspace_owner_or_manager(workspace_id)
  )
);

CREATE POLICY "pipelines_update"
ON public.pipelines
FOR UPDATE
TO authenticated
USING (
  public.is_workspace_member(workspace_id)
  AND (
    profile_id = auth.uid()
    OR public.is_workspace_owner_or_manager(workspace_id)
  )
)
WITH CHECK (
  public.is_workspace_member(workspace_id)
  AND (
    profile_id = auth.uid()
    OR public.is_workspace_owner_or_manager(workspace_id)
  )
);

CREATE POLICY "pipelines_delete"
ON public.pipelines
FOR DELETE
TO authenticated
USING (
  public.is_workspace_member(workspace_id)
  AND (
    profile_id = auth.uid()
    OR public.is_workspace_owner_or_manager(workspace_id)
  )
);

-- ============================================
-- PIPELINE STAGES
-- ============================================
CREATE POLICY "pipeline_stages_select"
ON public.pipeline_stages
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.pipelines p
    WHERE p.id = pipeline_stages.pipeline_id
      AND public.is_workspace_member(p.workspace_id)
      AND (
        p.profile_id = auth.uid()
        OR public.is_workspace_owner_or_manager(p.workspace_id)
      )
  )
);

CREATE POLICY "pipeline_stages_insert"
ON public.pipeline_stages
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.pipelines p
    WHERE p.id = pipeline_stages.pipeline_id
      AND public.is_workspace_member(p.workspace_id)
      AND (
        p.profile_id = auth.uid()
        OR public.is_workspace_owner_or_manager(p.workspace_id)
      )
  )
);

CREATE POLICY "pipeline_stages_update"
ON public.pipeline_stages
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.pipelines p
    WHERE p.id = pipeline_stages.pipeline_id
      AND public.is_workspace_member(p.workspace_id)
      AND (
        p.profile_id = auth.uid()
        OR public.is_workspace_owner_or_manager(p.workspace_id)
      )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.pipelines p
    WHERE p.id = pipeline_stages.pipeline_id
      AND public.is_workspace_member(p.workspace_id)
      AND (
        p.profile_id = auth.uid()
        OR public.is_workspace_owner_or_manager(p.workspace_id)
      )
  )
);

CREATE POLICY "pipeline_stages_delete"
ON public.pipeline_stages
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.pipelines p
    WHERE p.id = pipeline_stages.pipeline_id
      AND public.is_workspace_member(p.workspace_id)
      AND (
        p.profile_id = auth.uid()
        OR public.is_workspace_owner_or_manager(p.workspace_id)
      )
  )
);

-- ============================================
-- PIPELINE CARDS
-- ============================================
CREATE POLICY "pipeline_cards_select"
ON public.pipeline_cards
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.pipelines p
    WHERE p.id = pipeline_cards.pipeline_id
      AND public.is_workspace_member(p.workspace_id)
      AND (
        p.profile_id = auth.uid()
        OR public.is_workspace_owner_or_manager(p.workspace_id)
      )
  )
);

CREATE POLICY "pipeline_cards_insert"
ON public.pipeline_cards
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.pipelines p
    WHERE p.id = pipeline_cards.pipeline_id
      AND public.is_workspace_member(p.workspace_id)
      AND (
        p.profile_id = auth.uid()
        OR public.is_workspace_owner_or_manager(p.workspace_id)
      )
  )
);

CREATE POLICY "pipeline_cards_update"
ON public.pipeline_cards
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.pipelines p
    WHERE p.id = pipeline_cards.pipeline_id
      AND public.is_workspace_member(p.workspace_id)
      AND (
        p.profile_id = auth.uid()
        OR public.is_workspace_owner_or_manager(p.workspace_id)
      )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.pipelines p
    WHERE p.id = pipeline_cards.pipeline_id
      AND public.is_workspace_member(p.workspace_id)
      AND (
        p.profile_id = auth.uid()
        OR public.is_workspace_owner_or_manager(p.workspace_id)
      )
  )
);

CREATE POLICY "pipeline_cards_delete"
ON public.pipeline_cards
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.pipelines p
    WHERE p.id = pipeline_cards.pipeline_id
      AND public.is_workspace_member(p.workspace_id)
      AND (
        p.profile_id = auth.uid()
        OR public.is_workspace_owner_or_manager(p.workspace_id)
      )
  )
);

-- ============================================
-- CONTACT NOTES
-- ============================================
CREATE POLICY "contact_notes_select"
ON public.contact_notes
FOR SELECT
TO authenticated
USING (
  public.is_workspace_member(workspace_id)
  AND (
    profile_id = auth.uid()
    OR public.is_workspace_owner_or_manager(workspace_id)
  )
);

CREATE POLICY "contact_notes_insert"
ON public.contact_notes
FOR INSERT
TO authenticated
WITH CHECK (
  public.is_workspace_member(workspace_id)
  AND profile_id = auth.uid()
);

CREATE POLICY "contact_notes_update"
ON public.contact_notes
FOR UPDATE
TO authenticated
USING (
  public.is_workspace_member(workspace_id)
  AND profile_id = auth.uid()
)
WITH CHECK (
  public.is_workspace_member(workspace_id)
  AND profile_id = auth.uid()
);

CREATE POLICY "contact_notes_delete"
ON public.contact_notes
FOR DELETE
TO authenticated
USING (
  public.is_workspace_member(workspace_id)
  AND profile_id = auth.uid()
);

-- ============================================
-- CONTACT FILES
-- ============================================
CREATE POLICY "contact_files_select"
ON public.contact_files
FOR SELECT
TO authenticated
USING (
  public.is_workspace_member(workspace_id)
);

CREATE POLICY "contact_files_insert"
ON public.contact_files
FOR INSERT
TO authenticated
WITH CHECK (
  public.is_workspace_member(workspace_id)
  AND profile_id = auth.uid()
);

CREATE POLICY "contact_files_update"
ON public.contact_files
FOR UPDATE
TO authenticated
USING (
  public.is_workspace_member(workspace_id)
  AND profile_id = auth.uid()
)
WITH CHECK (
  public.is_workspace_member(workspace_id)
  AND profile_id = auth.uid()
);

CREATE POLICY "contact_files_delete"
ON public.contact_files
FOR DELETE
TO authenticated
USING (
  public.is_workspace_member(workspace_id)
  AND profile_id = auth.uid()
);
