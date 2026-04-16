import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getActiveWorkspaceId } from "@/server/actions/workspace.actions";
import { getWorkspacesForUser } from "@/server/services/workspace.service";
import { DashboardContent } from "./dashboard-content";
import { OnboardingView } from "./onboarding-view";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) {
    redirect("/auth/login");
  }

  const workspacesResult = await getWorkspacesForUser();
  const workspaces = workspacesResult.data || [];
  const activeWorkspaceId = await getActiveWorkspaceId();

  // Se não tem workspace, mostra onboarding
  if (workspaces.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <OnboardingView />
      </div>
    );
  }

  // Determinar workspace ativo
  const activeWorkspace =
    workspaces.find((w) => w.id === activeWorkspaceId) || workspaces[0];

  // Determinar role do usuário no workspace ativo
  const userMember = activeWorkspace.workspace_members?.find(
    (m) => m.profile_id === userData.user.id
  );

  return (
    <DashboardContent
      workspaces={workspaces}
      activeWorkspace={activeWorkspace}
      userRole={userMember?.role || "professional"}
      userId={userData.user.id}
    />
  );
}
