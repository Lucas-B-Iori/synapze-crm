import type { WorkspaceRole } from "@/types/workspace";
import { cn } from "@/lib/utils";

interface RoleBadgeProps {
  role: WorkspaceRole;
  className?: string;
}

const roleConfig: Record<
  WorkspaceRole,
  { label: string; className: string }
> = {
  owner: {
    label: "Owner",
    className:
      "bg-indigo-500 text-white border-indigo-400 shadow-[0_0_10px_rgba(99,102,241,0.35)]",
  },
  manager: {
    label: "Gerente",
    className:
      "bg-zinc-800 text-zinc-200 border-zinc-600",
  },
  professional: {
    label: "Profissional",
    className:
      "bg-transparent text-indigo-300 border-indigo-500/40",
  },
  assistant: {
    label: "Assistente",
    className:
      "bg-transparent text-amber-300 border-amber-500/40",
  },
};

export function RoleBadge({ role, className }: RoleBadgeProps) {
  const config = roleConfig[role];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  );
}
