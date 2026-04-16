-- ============================================
-- F2.4: Schema do Modal 360° — Notas e Arquivos
-- ============================================

CREATE TABLE IF NOT EXISTS public.contact_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE public.contact_notes IS 'Notas privadas por profissional sobre um contato';

CREATE TABLE IF NOT EXISTS public.contact_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT,
  file_size INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE public.contact_files IS 'Referência de arquivos armazenados no Supabase Storage';

-- Índices
CREATE INDEX IF NOT EXISTS idx_contact_notes_contact_id ON public.contact_notes(contact_id);
CREATE INDEX IF NOT EXISTS idx_contact_notes_profile_id ON public.contact_notes(profile_id);
CREATE INDEX IF NOT EXISTS idx_contact_files_contact_id ON public.contact_files(contact_id);
CREATE INDEX IF NOT EXISTS idx_contact_files_profile_id ON public.contact_files(profile_id);
