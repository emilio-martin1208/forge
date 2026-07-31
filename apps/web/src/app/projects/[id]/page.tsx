import { forgeApi } from "@/lib/api";
import { ProjectWorkspace } from "@/components/ProjectWorkspace";

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let project;
  try {
    project = await forgeApi.getProject(id);
  } catch {
    return (
      <main className="flex-1 flex items-center justify-center px-6 text-center">
        <p className="text-muted max-w-md">Could not load this project. It may not exist.</p>
      </main>
    );
  }

  const [dashboard, architecture, roadmap, chatMessages] = await Promise.all([
    forgeApi.getHealthDashboard(id).catch(() => null),
    forgeApi.getArchitecture(id).catch(() => null),
    forgeApi.getRoadmap(id).catch(() => []),
    forgeApi.listChatMessages(id).catch(() => []),
  ]);

  return (
    <ProjectWorkspace
      project={project}
      dashboard={dashboard}
      architecture={architecture}
      roadmap={roadmap}
      initialChatMessages={chatMessages}
    />
  );
}
