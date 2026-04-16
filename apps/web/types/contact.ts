export interface Contact {
  id: string;
  workspace_id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  source: string | null;
  created_at: string;
  updated_at: string;
}

export interface ContactWithDetails extends Contact {
  assignments: ContactAssignment[];
  custom_values: ContactCustomValue[];
}

export interface CustomFieldDefinition {
  id: string;
  workspace_id: string;
  name: string;
  field_type: "text" | "number" | "date" | "select" | "checkbox";
  options: string[];
  required: boolean;
  order_index: number;
}

export interface ContactCustomValue {
  id: string;
  contact_id: string;
  field_definition_id: string;
  value_text: string | null;
  field_definition?: CustomFieldDefinition;
}

export interface ContactAssignment {
  id: string;
  contact_id: string;
  profile_id: string;
  workspace_id: string;
  profile?: {
    id: string;
    full_name: string | null;
  };
}

export interface ContactFilters {
  search?: string;
  assignedTo?: string;
}

export interface ContactNote {
  id: string;
  contact_id: string;
  profile_id: string;
  workspace_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  profile?: {
    id: string;
    full_name: string | null;
  };
}

export interface ContactFile {
  id: string;
  contact_id: string;
  profile_id: string;
  workspace_id: string;
  file_name: string;
  file_path: string;
  file_type: string | null;
  file_size: number | null;
  created_at: string;
}
