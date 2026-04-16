"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import {
  getWorkspacesForUser,
  getWorkspaceById,
  createWorkspace as createWorkspaceService,
  inviteMember as inviteMemberService,
  acceptInvite as acceptInviteService,
  updateMemberRole as updateMemberRoleService,
  createMemberAssignment as createMemberAssignmentService,
} from "@/server/services/workspace.service";
import type { WorkspaceRole, ActionResult } from "@/types/workspace";

export async function fetchUserWorkspaces() {
  return getWorkspacesForUser();
}

export async function fetchWorkspaceById(workspaceId: string) {
  return getWorkspaceById(workspaceId);
}

export async function createWorkspace(name: string): Promise<ActionResult<{ id: string }>> {
  const result = await createWorkspaceService(name);

  if (result.error || !result.data) {
    return { error: result.error || "Erro ao criar workspace" };
  }

  await setActiveWorkspace(result.data.id);
  revalidatePath("/dashboard");

  return { data: { id: result.data.id } };
}

export async function inviteMember(
  workspaceId: string,
  email: string,
  role: WorkspaceRole
) {
  return inviteMemberService(workspaceId, email, role);
}

export async function acceptInvite(memberId: string) {
  const result = await acceptInviteService(memberId);
  revalidatePath("/dashboard");
  return result;
}

export async function updateMemberRole(memberId: string, newRole: WorkspaceRole) {
  const result = await updateMemberRoleService(memberId, newRole);
  revalidatePath("/dashboard");
  return result;
}

export async function createMemberAssignment(
  workspaceId: string,
  professionalId: string,
  managerId?: string | null,
  assistantId?: string | null
) {
  return createMemberAssignmentService(workspaceId, professionalId, managerId, assistantId);
}

export async function switchWorkspace(workspaceId: string) {
  await setActiveWorkspace(workspaceId);
  revalidatePath("/dashboard");
  return { data: { success: true } };
}

async function setActiveWorkspace(workspaceId: string) {
  const cookieStore = await cookies();
  cookieStore.set("active_workspace_id", workspaceId, {
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 dias
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
}

export async function getActiveWorkspaceId(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get("active_workspace_id")?.value || null;
}
