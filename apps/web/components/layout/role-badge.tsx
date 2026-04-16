import { Badge } from "@/components/ui/badge";
import type { WorkspaceRole } from "@/types/workspace";

interface RoleBadgeProps {
  role: WorkspaceRole;
}

const roleLabels: Record<WorkspaceRole, string> = {
  owner: "Owner",
  manager: "Gerente",
  professional: "Profissional",
  assistant: "Assistente",
};

const roleVariants: Record<WorkspaceRole, "default" | "secondary" | "outline" | "destructive"> = {
  owner: "default",
  manager: "secondary",
  professional: "outline",
  assistant: "destructive",
};

export function RoleBadge({ role }: RoleBadgeProps) {
  return <Badge variant={roleVariants[role]}>{roleLabels[role]}</Badge>;
}
