import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getActiveWorkspaceId } from "@/server/actions/workspace.actions";
import { setupDefaultPipeline, fetchPipelinesForWorkspace } from "@/server/actions/pipeline.actions";
import { KanbanPageClient } from "./kanban-page-client";

export default async function KanbanPage() {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) {
    redirect("/auth/login");
  }

  const workspaceId = await getActiveWorkspaceId();
  if (!workspaceId) {
    redirect("/dashboard");
  }

  await setupDefaultPipeline(workspaceId, userData.user.id);

  const pipelinesResult = await fetchPipelinesForWorkspace(workspaceId);
  const pipelines = pipelinesResult.data || [];

  const visiblePipelines = pipelines.filter(
    (p) => p.profile_id === userData.user.id
  );

  const activePipeline = visiblePipelines[0] || null;

  return (
    <KanbanPageClient
      initialPipeline={activePipeline}
      workspaceId={workspaceId}
      userId={userData.user.id}
    />
  );
}
