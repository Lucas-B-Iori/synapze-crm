"use server";

import { revalidatePath } from "next/cache";
import {
  listContacts,
  getContactById,
  createContact,
  updateContact,
  deleteContact,
  getCustomFieldDefinitions,
  createCustomFieldDefinition,
  listContactNotes,
  createContactNote,
  updateContactNote,
  deleteContactNote,
  listContactFiles,
  createContactFileRecord,
  deleteContactFileRecord,
} from "@/server/services/contact.service";
import type { ContactFilters } from "@/types/contact";

export async function fetchContacts(
  workspaceId: string,
  filters?: ContactFilters,
  page?: number,
  pageSize?: number
) {
  return listContacts(workspaceId, filters, page, pageSize);
}

export async function fetchContactById(contactId: string) {
  return getContactById(contactId);
}

export async function addContact(
  workspaceId: string,
  payload: Parameters<typeof createContact>[1]
) {
  const result = await createContact(workspaceId, payload);
  if (!result.error) revalidatePath("/dashboard/contacts");
  return result;
}

export async function editContact(
  contactId: string,
  payload: Parameters<typeof updateContact>[1]
) {
  const result = await updateContact(contactId, payload);
  if (!result.error) revalidatePath("/dashboard/contacts");
  return result;
}

export async function removeContact(contactId: string) {
  const result = await deleteContact(contactId);
  if (!result.error) revalidatePath("/dashboard/contacts");
  return result;
}

export async function fetchCustomFieldDefinitions(workspaceId: string) {
  return getCustomFieldDefinitions(workspaceId);
}

export async function addCustomFieldDefinition(
  workspaceId: string,
  payload: Parameters<typeof createCustomFieldDefinition>[1]
) {
  const result = await createCustomFieldDefinition(workspaceId, payload);
  if (!result.error) revalidatePath("/dashboard/contacts");
  return result;
}

// Notes
export async function fetchContactNotes(contactId: string) {
  return listContactNotes(contactId);
}

export async function addContactNote(contactId: string, workspaceId: string, content: string) {
  const result = await createContactNote(contactId, workspaceId, content);
  return result;
}

export async function editContactNote(noteId: string, content: string) {
  const result = await updateContactNote(noteId, content);
  return result;
}

export async function removeContactNote(noteId: string) {
  const result = await deleteContactNote(noteId);
  return result;
}

// Files
export async function fetchContactFiles(contactId: string) {
  return listContactFiles(contactId);
}

export async function addContactFileRecord(
  contactId: string,
  workspaceId: string,
  file: { name: string; path: string; type: string; size: number }
) {
  const result = await createContactFileRecord(contactId, workspaceId, file);
  return result;
}

export async function removeContactFileRecord(fileId: string) {
  const result = await deleteContactFileRecord(fileId);
  return result;
}
