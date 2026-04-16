"use server";

import { createClient } from "@/lib/supabase/server";
import type {
  Contact,
  ContactWithDetails,
  CustomFieldDefinition,
  ContactCustomValue,
  ContactFilters,
  ContactNote,
  ContactFile,
} from "@/types/contact";
import type { ActionResult } from "@/types/workspace";

export async function listContacts(
  workspaceId: string,
  filters?: ContactFilters,
  page: number = 1,
  pageSize: number = 20
): Promise<ActionResult<{ contacts: Contact[]; total: number }>> {
  const supabase = await createClient();

  let query = supabase
    .from("contacts")
    .select("*, contact_assignments(profile_id, profile:profiles(id, full_name))", { count: "exact" })
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1);

  if (filters?.search) {
    query = query.or(`full_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%,phone.ilike.%${filters.search}%`);
  }

  // Filtro por profissional atribuído requer join que o PostgREST simples pode não fazer facilmente
  // No MVP, vamos buscar todos e filtrar no servidor se necessário
  if (filters?.assignedTo) {
    const { data: assignedContacts } = await supabase
      .from("contact_assignments")
      .select("contact_id")
      .eq("profile_id", filters.assignedTo)
      .eq("workspace_id", workspaceId);

    const contactIds = assignedContacts?.map((a) => a.contact_id) || [];
    if (contactIds.length > 0) {
      query = query.in("id", contactIds);
    } else {
      return { data: { contacts: [], total: 0 } };
    }
  }

  const { data, error, count } = await query;

  if (error) {
    return { error: error.message };
  }

  return { data: { contacts: (data || []) as Contact[], total: count || 0 } };
}

export async function getContactById(contactId: string): Promise<ActionResult<ContactWithDetails>> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("contacts")
    .select(`
      *,
      contact_assignments:contact_assignments(*, profile:profiles(id, full_name)),
      custom_values:contact_custom_values(*, field_definition:custom_field_definitions(*))
    `)
    .eq("id", contactId)
    .single();

  if (error) {
    return { error: error.message };
  }

  return { data: data as unknown as ContactWithDetails };
}

export async function createContact(
  workspaceId: string,
  payload: {
    full_name: string;
    email?: string;
    phone?: string;
    source?: string;
    assignedTo?: string[];
    customValues?: Record<string, string>;
  }
): Promise<ActionResult<Contact>> {
  const supabase = await createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError || !userData.user) {
    return { error: "Usuário não autenticado" };
  }

  const { data: contact, error: contactError } = await supabase
    .from("contacts")
    .insert({
      workspace_id: workspaceId,
      full_name: payload.full_name,
      email: payload.email || null,
      phone: payload.phone || null,
      source: payload.source || null,
    })
    .select()
    .single();

  if (contactError || !contact) {
    return { error: contactError?.message || "Erro ao criar contato" };
  }

  // Atribuições
  if (payload.assignedTo && payload.assignedTo.length > 0) {
    const assignments = payload.assignedTo.map((profileId) => ({
      contact_id: contact.id,
      profile_id: profileId,
      workspace_id: workspaceId,
    }));
    await supabase.from("contact_assignments").insert(assignments);
  }

  // Valores customizados
  if (payload.customValues && Object.keys(payload.customValues).length > 0) {
    const customValues = Object.entries(payload.customValues)
      .filter(([, value]) => value !== undefined && value !== null && value !== "")
      .map(([definitionId, value]) => ({
        contact_id: contact.id,
        field_definition_id: definitionId,
        value_text: value,
      }));
    if (customValues.length > 0) {
      await supabase.from("contact_custom_values").insert(customValues);
    }
  }

  return { data: contact as Contact };
}

export async function updateContact(
  contactId: string,
  payload: {
    full_name?: string;
    email?: string;
    phone?: string;
    source?: string;
    assignedTo?: string[];
    customValues?: Record<string, string>;
  }
): Promise<ActionResult<Contact>> {
  const supabase = await createClient();

  const { data: contact, error: contactError } = await supabase
    .from("contacts")
    .update({
      full_name: payload.full_name,
      email: payload.email || null,
      phone: payload.phone || null,
      source: payload.source || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", contactId)
    .select()
    .single();

  if (contactError || !contact) {
    return { error: contactError?.message || "Erro ao atualizar contato" };
  }

  // Atualizar atribuições
  if (payload.assignedTo !== undefined) {
    await supabase.from("contact_assignments").delete().eq("contact_id", contactId);
    if (payload.assignedTo.length > 0) {
      const assignments = payload.assignedTo.map((profileId) => ({
        contact_id: contactId,
        profile_id: profileId,
        workspace_id: contact.workspace_id,
      }));
      await supabase.from("contact_assignments").insert(assignments);
    }
  }

  // Atualizar valores customizados
  if (payload.customValues !== undefined) {
    const definitionIds = Object.keys(payload.customValues);
    if (definitionIds.length > 0) {
      // Deletar valores existentes para essas definições
      await supabase
        .from("contact_custom_values")
        .delete()
        .eq("contact_id", contactId)
        .in("field_definition_id", definitionIds);

      const customValues = Object.entries(payload.customValues)
        .filter(([, value]) => value !== undefined && value !== null && value !== "")
        .map(([definitionId, value]) => ({
          contact_id: contactId,
          field_definition_id: definitionId,
          value_text: value,
        }));
      if (customValues.length > 0) {
        await supabase.from("contact_custom_values").insert(customValues);
      }
    }
  }

  return { data: contact as Contact };
}

export async function deleteContact(contactId: string): Promise<ActionResult<null>> {
  const supabase = await createClient();
  const { error } = await supabase.from("contacts").delete().eq("id", contactId);

  if (error) {
    return { error: error.message };
  }

  return { data: null };
}

export async function getCustomFieldDefinitions(workspaceId: string): Promise<ActionResult<CustomFieldDefinition[]>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("custom_field_definitions")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("order_index", { ascending: true });

  if (error) {
    return { error: error.message };
  }

  return {
    data: (data || []).map((d) => ({
      ...d,
      options: Array.isArray(d.options) ? d.options : [],
    })) as CustomFieldDefinition[],
  };
}

export async function createCustomFieldDefinition(
  workspaceId: string,
  payload: Omit<CustomFieldDefinition, "id" | "workspace_id" | "created_at">
): Promise<ActionResult<CustomFieldDefinition>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("custom_field_definitions")
    .insert({
      workspace_id: workspaceId,
      name: payload.name,
      field_type: payload.field_type,
      options: payload.options,
      required: payload.required,
      order_index: payload.order_index,
    })
    .select()
    .single();

  if (error || !data) {
    return { error: error?.message || "Erro ao criar campo customizado" };
  }

  return { data: { ...data, options: Array.isArray(data.options) ? data.options : [] } as CustomFieldDefinition };
}

// ============================================
// Notes
// ============================================
export async function listContactNotes(contactId: string): Promise<ActionResult<ContactNote[]>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("contact_notes")
    .select("*, profile:profiles(id, full_name)")
    .eq("contact_id", contactId)
    .order("created_at", { ascending: false });

  if (error) {
    return { error: error.message };
  }

  return { data: (data || []) as ContactNote[] };
}

export async function createContactNote(
  contactId: string,
  workspaceId: string,
  content: string
): Promise<ActionResult<ContactNote>> {
  const supabase = await createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError || !userData.user) {
    return { error: "Usuário não autenticado" };
  }

  const { data, error } = await supabase
    .from("contact_notes")
    .insert({
      contact_id: contactId,
      workspace_id: workspaceId,
      profile_id: userData.user.id,
      content,
    })
    .select("*, profile:profiles(id, full_name)")
    .single();

  if (error || !data) {
    return { error: error?.message || "Erro ao criar nota" };
  }

  return { data: data as unknown as ContactNote };
}

export async function updateContactNote(noteId: string, content: string): Promise<ActionResult<ContactNote>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("contact_notes")
    .update({ content, updated_at: new Date().toISOString() })
    .eq("id", noteId)
    .select("*, profile:profiles(id, full_name)")
    .single();

  if (error || !data) {
    return { error: error?.message || "Erro ao atualizar nota" };
  }

  return { data: data as unknown as ContactNote };
}

export async function deleteContactNote(noteId: string): Promise<ActionResult<null>> {
  const supabase = await createClient();
  const { error } = await supabase.from("contact_notes").delete().eq("id", noteId);

  if (error) {
    return { error: error.message };
  }

  return { data: null };
}

// ============================================
// Files references
// ============================================
export async function listContactFiles(contactId: string): Promise<ActionResult<ContactFile[]>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("contact_files")
    .select("*")
    .eq("contact_id", contactId)
    .order("created_at", { ascending: false });

  if (error) {
    return { error: error.message };
  }

  return { data: (data || []) as ContactFile[] };
}

export async function createContactFileRecord(
  contactId: string,
  workspaceId: string,
  file: { name: string; path: string; type: string; size: number }
): Promise<ActionResult<ContactFile>> {
  const supabase = await createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError || !userData.user) {
    return { error: "Usuário não autenticado" };
  }

  const { data, error } = await supabase
    .from("contact_files")
    .insert({
      contact_id: contactId,
      workspace_id: workspaceId,
      profile_id: userData.user.id,
      file_name: file.name,
      file_path: file.path,
      file_type: file.type,
      file_size: file.size,
    })
    .select()
    .single();

  if (error || !data) {
    return { error: error?.message || "Erro ao registrar arquivo" };
  }

  return { data: data as ContactFile };
}

export async function deleteContactFileRecord(fileId: string): Promise<ActionResult<null>> {
  const supabase = await createClient();
  const { error } = await supabase.from("contact_files").delete().eq("id", fileId);

  if (error) {
    return { error: error.message };
  }

  return { data: null };
}
