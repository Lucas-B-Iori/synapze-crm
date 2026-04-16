export type WorkspaceRole = "owner" | "manager" | "professional" | "assistant";
export type MemberStatus = "active" | "pending";
export type PlanTier = "starter" | "pro" | "enterprise";

export interface Profile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
}

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  plan_tier: PlanTier;
  owner_id: string;
  settings: Record<string, unknown>;
  created_at: string;
}

export interface WorkspaceMember {
  id: string;
  workspace_id: string;
  profile_id: string;
  role: WorkspaceRole;
  status: MemberStatus;
  created_at: string;
  profile?: Profile;
}

export interface MemberAssignment {
  id: string;
  workspace_id: string;
  manager_id: string | null;
  professional_id: string;
  assistant_id: string | null;
  created_at: string;
}

export interface WorkspaceWithMembers extends Workspace {
  workspace_members: WorkspaceMember[];
}

export interface ActionResult<T = null> {
  data?: T;
  error?: string;
}
