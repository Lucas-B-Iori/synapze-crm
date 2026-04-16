"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type {
  Workspace,
  WorkspaceMember,
  WorkspaceWithMembers,
  MemberAssignment,
  WorkspaceRole,
  ActionResult,
} from "@/types/workspace";

export async function getWorkspacesForUser(): Promise<ActionResult<WorkspaceWithMembers[]>> {
  const supabase = await createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError || !userData.user) {
    return { error: "Usuário não autenticado" };
  }

  const { data, error } = await supabase
    .from("workspace_members")
    .select(`
      workspace:workspaces (
        *,
        workspace_members (
          *,
          profile:profiles (*)
        )
      )
    `)
    .eq("profile_id", userData.user.id)
    .eq("status", "active")
    .order("created_at", { ascending: false });

  if (error) {
    return { error: error.message };
  }

  const workspaces = (data || [])
    .map((row: any) => row.workspace as WorkspaceWithMembers)
    .filter(Boolean);

  return { data: workspaces };
}

export async function getWorkspaceById(workspaceId: string): Promise<ActionResult<WorkspaceWithMembers>> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("workspaces")
    .select(`
      *,
      workspace_members (
        *,
        profile:profiles (*)
      )
    `)
    .eq("id", workspaceId)
    .single();

  if (error) {
    return { error: error.message };
  }

  return { data: data as WorkspaceWithMembers };
}

export async function createWorkspace(name: string): Promise<ActionResult<Workspace>> {
  const supabase = await createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError || !userData.user) {
    return { error: "Usuário não autenticado" };
  }

  const slug = name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") + "-" + Date.now();

  const { data: workspace, error: workspaceError } = await supabase
    .from("workspaces")
    .insert({ name, slug, owner_id: userData.user.id })
    .select()
    .single();

  if (workspaceError || !workspace) {
    return { error: workspaceError?.message || "Erro ao criar workspace" };
  }

  const { error: memberError } = await supabase
    .from("workspace_members")
    .insert({
      workspace_id: workspace.id,
      profile_id: userData.user.id,
      role: "owner",
      status: "active",
    });

  if (memberError) {
    return { error: memberError.message };
  }

  return { data: workspace as Workspace };
}

export async function inviteMember(
  workspaceId: string,
  email: string,
  role: WorkspaceRole
): Promise<ActionResult<WorkspaceMember>> {
  const supabase = await createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError || !userData.user) {
    return { error: "Usuário não autenticado" };
  }

  // Verificar permissão
  const { data: myMembership } = await supabase
    .from("workspace_members")
    .select("role")
    .eq("workspace_id", workspaceId)
    .eq("profile_id", userData.user.id)
    .eq("status", "active")
    .single();

  if (!myMembership || !["owner", "manager"].includes(myMembership.role)) {
    return { error: "Sem permissão para convidar membros" };
  }

  const adminClient = createAdminClient();

  // Buscar usuário existente pelo email na tabela auth.users
  const { data: existingUsers } = await adminClient
    .from("auth.users")
    .select("id, email")
    .eq("email", email)
    .limit(1);

  let profileId: string | null = null;

  if (existingUsers && existingUsers.length > 0) {
    profileId = (existingUsers[0] as any).id;
  } else {
    // Criar usuário convidado via admin API
    const { data: newAuthData, error: createError } = await adminClient.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: { full_name: email.split("@")[0] },
    });

    if (createError) {
      // Se o erro for usuário já existente, tentamos buscar novamente
      if (createError.message?.toLowerCase().includes("already registered") || createError.message?.toLowerCase().includes("already exists")) {
        const { data: retryUsers } = await adminClient
          .from("auth.users")
          .select("id, email")
          .eq("email", email)
          .limit(1);
        if (retryUsers && retryUsers.length > 0) {
          profileId = (retryUsers[0] as any).id;
        }
      }
      if (!profileId) {
        return { error: createError.message || "Erro ao criar usuário convidado" };
      }
    } else if (newAuthData.user) {
      profileId = newAuthData.user.id;
    }
  }

  // Verificar se já é membro
  const { data: existingMember } = await supabase
    .from("workspace_members")
    .select("id, status")
    .eq("workspace_id", workspaceId)
    .eq("profile_id", profileId)
    .maybeSingle();

  if (existingMember) {
    if (existingMember.status === "active") {
      return { error: "Usuário já é membro deste workspace" };
    }
    // Reativar convite pendente
    const { data: updated, error: updateError } = await supabase
      .from("workspace_members")
      .update({ role, status: "pending" })
      .eq("id", existingMember.id)
      .select()
      .single();

    if (updateError) {
      return { error: updateError.message };
    }
    return { data: updated as WorkspaceMember };
  }

  const { data: member, error: memberError } = await supabase
    .from("workspace_members")
    .insert({ workspace_id: workspaceId, profile_id: profileId, role, status: "pending" })
    .select()
    .single();

  if (memberError || !member) {
    return { error: memberError?.message || "Erro ao convidar membro" };
  }

  return { data: member as WorkspaceMember };
}

export async function acceptInvite(memberId: string): Promise<ActionResult<WorkspaceMember>> {
  const supabase = await createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError || !userData.user) {
    return { error: "Usuário não autenticado" };
  }

  const { data: member, error } = await supabase
    .from("workspace_members")
    .update({ status: "active" })
    .eq("id", memberId)
    .eq("profile_id", userData.user.id)
    .eq("status", "pending")
    .select()
    .single();

  if (error || !member) {
    return { error: error?.message || "Convite não encontrado ou já aceito" };
  }

  return { data: member as WorkspaceMember };
}

export async function updateMemberRole(
  memberId: string,
  newRole: WorkspaceRole
): Promise<ActionResult<WorkspaceMember>> {
  const supabase = await createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError || !userData.user) {
    return { error: "Usuário não autenticado" };
  }

  // Buscar workspace_id do membro
  const { data: targetMember } = await supabase
    .from("workspace_members")
    .select("workspace_id")
    .eq("id", memberId)
    .single();

  if (!targetMember) {
    return { error: "Membro não encontrado" };
  }

  // Verificar permissão
  const { data: myMembership } = await supabase
    .from("workspace_members")
    .select("role")
    .eq("workspace_id", targetMember.workspace_id)
    .eq("profile_id", userData.user.id)
    .eq("status", "active")
    .single();

  if (!myMembership || !["owner", "manager"].includes(myMembership.role)) {
    return { error: "Sem permissão para alterar roles" };
  }

  // Não permitir alterar role do owner
  const { data: memberToUpdate } = await supabase
    .from("workspace_members")
    .select("role")
    .eq("id", memberId)
    .single();

  if (memberToUpdate?.role === "owner") {
    return { error: "Não é possível alterar a role do owner" };
  }

  const { data, error } = await supabase
    .from("workspace_members")
    .update({ role: newRole })
    .eq("id", memberId)
    .select()
    .single();

  if (error || !data) {
    return { error: error?.message || "Erro ao atualizar role" };
  }

  return { data: data as WorkspaceMember };
}

export async function createMemberAssignment(
  workspaceId: string,
  professionalId: string,
  managerId?: string | null,
  assistantId?: string | null
): Promise<ActionResult<MemberAssignment>> {
  const supabase = await createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError || !userData.user) {
    return { error: "Usuário não autenticado" };
  }

  // Verificar permissão
  const { data: myMembership } = await supabase
    .from("workspace_members")
    .select("role")
    .eq("workspace_id", workspaceId)
    .eq("profile_id", userData.user.id)
    .eq("status", "active")
    .single();

  if (!myMembership || !["owner", "manager"].includes(myMembership.role)) {
    return { error: "Sem permissão" };
  }

  const { data, error } = await supabase
    .from("member_assignments")
    .insert({
      workspace_id: workspaceId,
      professional_id: professionalId,
      manager_id: managerId || null,
      assistant_id: assistantId || null,
    })
    .select()
    .single();

  if (error || !data) {
    return { error: error?.message || "Erro ao criar atribuição" };
  }

  return { data: data as MemberAssignment };
}
