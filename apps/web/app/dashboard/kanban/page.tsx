import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getActiveWorkspaceId } from "@/server/actions/workspace.actions";
import { setupDefaultPipeline, fetchPipelinesForWorkspace } from "@/server/actions/pipeline.actions";
import { KanbanBoard } from "@/components/kanban/kanban-board";

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

  // Garantir pipeline default para o usuário logado
  await setupDefaultPipeline(workspaceId, userData.user.id);

  const pipelinesResult = await fetchPipelinesForWorkspace(workspaceId);
  const pipelines = pipelinesResult.data || [];

  // Filtrar pipelines que o usuário pode ver (próprios ou de subordinados se for manager/owner)
  const visiblePipelines = pipelines.filter(
    (p) => p.profile_id === userData.user.id
  );

  const activePipeline = visiblePipelines[0] || null;

  return (
    <div className="flex h-full flex-col p-6">
      <div className="mb-4">
        <h1 className="text-2xl font-bold tracking-tight">Kanban</h1>
        <p className="text-muted-foreground">
          Gerencie seus leads e acompanhe o funil de vendas.
        </p>
      </div>
      <div className="flex-1 overflow-x-auto">
        {activePipeline ? (
          <KanbanBoard
            initialPipeline={activePipeline}
            workspaceId={workspaceId}
            userId={userData.user.id}
          />
        ) : (
          <div className="flex h-64 items-center justify-center rounded-lg border border-dashed border-border">
            <p className="text-muted-foreground">
              Nenhum pipeline disponível. Crie um contato e adicione-o ao funil.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
