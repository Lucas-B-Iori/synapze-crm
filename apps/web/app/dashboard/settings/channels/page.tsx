import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getActiveWorkspaceId } from "@/server/actions/workspace.actions";
import { fetchChannelsWithAssignments } from "@/server/actions/channel.actions";
import { fetchUserWorkspaces } from "@/server/actions/workspace.actions";
import { ChannelsPage } from "./channels-page";

export default async function SettingsChannelsPage() {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) {
    redirect("/auth/login");
  }

  const workspaceId = await getActiveWorkspaceId();
  if (!workspaceId) {
    redirect("/dashboard");
  }

  const workspacesResult = await fetchUserWorkspaces();
  const activeWorkspace = workspacesResult.data?.find((w) => w.id === workspaceId);
  const userMember = activeWorkspace?.workspace_members?.find(
    (m) => m.profile_id === userData.user.id
  );
  const canManage = ["owner", "manager"].includes(userMember?.role || "");

  const channelsResult = await fetchChannelsWithAssignments(workspaceId);

  return (
    <ChannelsPage
      workspaceId={workspaceId}
      channels={channelsResult.data || []}
      members={activeWorkspace?.workspace_members || []}
      canManage={canManage}
      userId={userData.user.id}
    />
  );
}
