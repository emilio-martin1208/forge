import type {
  ConnectRepositoryRequest,
  GenerateIdeaRequest,
  GenerateReadmeResponse,
  HealthDashboardResponse,
  Project,
  ProjectIdea,
} from "@forge/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Forge API ${path} failed: ${res.status} ${await res.text()}`);
  }
  return res.json() as Promise<T>;
}

export const forgeApi = {
  connectRepository: (body: ConnectRepositoryRequest) =>
    apiFetch<Project>("/projects", { method: "POST", body: JSON.stringify(body) }),
  listProjects: () => apiFetch<Project[]>("/projects"),
  getProject: (projectId: string) => apiFetch<Project>(`/projects/${projectId}`),
  getHealthDashboard: (projectId: string) =>
    apiFetch<HealthDashboardResponse>(`/projects/${projectId}/health`),
  generateReadme: (projectId: string) =>
    apiFetch<GenerateReadmeResponse>(`/projects/${projectId}/readme`, { method: "POST" }),
  generateIdea: (body: GenerateIdeaRequest) =>
    apiFetch<ProjectIdea>("/ideas", { method: "POST", body: JSON.stringify(body) }),
  listIdeas: () => apiFetch<ProjectIdea[]>("/ideas"),
  getIdea: (ideaId: string) => apiFetch<ProjectIdea>(`/ideas/${ideaId}`),
};
