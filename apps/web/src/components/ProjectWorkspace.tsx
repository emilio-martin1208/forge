"use client";

import { useState } from "react";
import type { ArchitectureView, ChatMessage, HealthDashboardResponse, Project, RoadmapItem } from "@forge/types";
import { ChatPanel } from "./ChatPanel";
import { OverviewPanel } from "./OverviewPanel";
import { ArchitecturePanel } from "./ArchitecturePanel";
import { FolderTree } from "./FolderTree";
import { RoadmapPanel } from "./RoadmapPanel";
import { ReadmePanel } from "./ReadmePanel";

const TABS = ["Chat", "Overview", "Architecture", "Folders", "Roadmap", "README"] as const;
type Tab = (typeof TABS)[number];

export function ProjectWorkspace({
  project,
  dashboard,
  architecture,
  roadmap,
  initialChatMessages,
}: {
  project: Project;
  dashboard: HealthDashboardResponse | null;
  architecture: ArchitectureView | null;
  roadmap: RoadmapItem[];
  initialChatMessages: ChatMessage[];
}) {
  const [activeTab, setActiveTab] = useState<Tab>("Chat");

  return (
    <div className="flex flex-col h-screen">
      <header className="gradient-surface px-6 py-4">
        <h1 className="text-lg font-semibold">
          {project.githubOwner}/{project.githubRepo}
        </h1>
      </header>

      <nav className="gradient-surface px-6 flex gap-1">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-3 pt-2.5 pb-2 text-sm transition flex flex-col gap-2 ${
              activeTab === tab ? "text-foreground" : "text-muted hover:text-foreground"
            }`}
          >
            {tab}
            <span className={`h-0.5 w-full ${activeTab === tab ? "gradient-bar" : "bg-transparent"}`} />
          </button>
        ))}
      </nav>

      <div className={`flex-1 min-h-0 ${activeTab === "Chat" ? "" : "overflow-y-auto"}`}>
        <div className={activeTab === "Chat" ? "h-full px-6 py-4" : "max-w-3xl mx-auto px-6 py-8"}>
          {activeTab === "Chat" && <ChatPanel projectId={project.id} initialMessages={initialChatMessages} />}
          {activeTab === "Overview" && <OverviewPanel dashboard={dashboard} />}
          {activeTab === "Architecture" && <ArchitecturePanel architecture={architecture} />}
          {activeTab === "Folders" &&
            (dashboard ? (
              <FolderTree paths={dashboard.snapshot.fileTree.allFiles} truncated={dashboard.snapshot.fileTree.allFilesTruncated} />
            ) : (
              <p className="text-muted">No snapshot yet.</p>
            ))}
          {activeTab === "Roadmap" && <RoadmapPanel items={roadmap} />}
          {activeTab === "README" && <ReadmePanel projectId={project.id} />}
        </div>
      </div>
    </div>
  );
}
