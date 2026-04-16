import type { WorkspaceRole } from "@/types/workspace";

const roleHierarchy: Record<WorkspaceRole, number> = {
  owner: 4,
  manager: 3,
  professional: 2,
  assistant: 1,
};

export function canPerformAction(
  userRole: WorkspaceRole | null | undefined,
  requiredRole: WorkspaceRole
): boolean {
  if (!userRole) return false;
  return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
}

export function usePermission(
  userRole: WorkspaceRole | null | undefined,
  requiredRole: WorkspaceRole
): boolean {
  return canPerformAction(userRole, requiredRole);
}
