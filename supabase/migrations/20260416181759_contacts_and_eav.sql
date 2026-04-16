-- ============================================
-- F2.1: Schema de Contatos e EAV
-- ============================================

CREATE TABLE IF NOT EXISTS public.contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  source TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE public.contacts IS 'Registro central de leads/pacientes por workspace';

CREATE TABLE IF NOT EXISTS public.custom_field_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  field_type TEXT NOT NULL CHECK (field_type IN ('text', 'number', 'date', 'select', 'checkbox')),
  options JSONB DEFAULT '[]',
  required BOOLEAN DEFAULT false,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE public.custom_field_definitions IS 'Definições de campos customizados por workspace (EAV)';

CREATE TABLE IF NOT EXISTS public.contact_custom_values (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  field_definition_id UUID NOT NULL REFERENCES public.custom_field_definitions(id) ON DELETE CASCADE,
  value_text TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (contact_id, field_definition_id)
);

COMMENT ON TABLE public.contact_custom_values IS 'Valores customizados EAV para cada contato';

CREATE TABLE IF NOT EXISTS public.contact_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (contact_id, profile_id)
);

COMMENT ON TABLE public.contact_assignments IS 'Atribuição de contatos a profissionais dentro do workspace';

-- Índices de performance
CREATE INDEX IF NOT EXISTS idx_contacts_workspace_id ON public.contacts(workspace_id);
CREATE INDEX IF NOT EXISTS idx_contacts_email ON public.contacts(email);
CREATE INDEX IF NOT EXISTS idx_custom_field_definitions_workspace_id ON public.custom_field_definitions(workspace_id);
CREATE INDEX IF NOT EXISTS idx_contact_custom_values_contact_id ON public.contact_custom_values(contact_id);
CREATE INDEX IF NOT EXISTS idx_contact_custom_values_definition_id ON public.contact_custom_values(field_definition_id);
CREATE INDEX IF NOT EXISTS idx_contact_assignments_contact_id ON public.contact_assignments(contact_id);
CREATE INDEX IF NOT EXISTS idx_contact_assignments_profile_id ON public.contact_assignments(profile_id);
CREATE INDEX IF NOT EXISTS idx_contact_assignments_workspace_id ON public.contact_assignments(workspace_id);
