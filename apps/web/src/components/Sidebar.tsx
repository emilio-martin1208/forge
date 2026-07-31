"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Project, ProjectIdea } from "@forge/types";

export function Sidebar({ projects, ideas }: { projects: Project[]; ideas: ProjectIdea[] }) {
  const pathname = usePathname();

  return (
    <aside className="w-64 shrink-0 border-r border-border bg-surface flex flex-col h-screen sticky top-0">
      <div className="p-4 border-b border-border">
        <Link href="/dashboard" className="text-sm font-semibold tracking-tight">
          Forge
        </Link>
      </div>

      <div className="p-3 flex flex-col gap-2 border-b border-border">
        <Link
          href="/create"
          className="rounded-md bg-accent px-3 py-2 text-sm font-medium text-white hover:opacity-90 transition text-center"
        >
          + New idea
        </Link>
        <Link
          href="/connect"
          className="rounded-md border border-border px-3 py-2 text-sm hover:bg-background transition text-center"
        >
          Connect repo
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto p-3 flex flex-col gap-5">
        <SidebarSection title="Projects" emptyLabel="No repos connected">
          {projects.map((project) => {
            const href = `/projects/${project.id}`;
            const active = pathname?.startsWith(href);
            return (
              <SidebarLink key={project.id} href={href} active={active}>
                {project.githubOwner}/{project.githubRepo}
              </SidebarLink>
            );
          })}
        </SidebarSection>

        <SidebarSection title="Ideas" emptyLabel="No ideas yet">
          {ideas.map((idea) => {
            const href = `/ideas/${idea.id}`;
            const active = pathname === href;
            return (
              <SidebarLink key={idea.id} href={href} active={active}>
                {idea.description}
              </SidebarLink>
            );
          })}
        </SidebarSection>
      </nav>

      <div className="p-3 border-t border-border">
        <Link href="/dashboard" className="text-xs text-muted hover:text-foreground transition">
          Dashboard
        </Link>
      </div>
    </aside>
  );
}

function SidebarSection({
  title,
  emptyLabel,
  children,
}: {
  title: string;
  emptyLabel: string;
  children: React.ReactNode;
}) {
  const hasChildren = Array.isArray(children) ? children.length > 0 : Boolean(children);
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-muted px-2 mb-1.5">{title}</p>
      {hasChildren ? (
        <div className="flex flex-col gap-0.5">{children}</div>
      ) : (
        <p className="text-xs text-muted px-2">{emptyLabel}</p>
      )}
    </div>
  );
}

function SidebarLink({ href, active, children }: { href: string; active?: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className={`rounded-md px-2 py-1.5 text-sm truncate transition ${
        active ? "bg-accent/15 text-foreground" : "text-muted hover:bg-background hover:text-foreground"
      }`}
      title={typeof children === "string" ? children : undefined}
    >
      {children}
    </Link>
  );
}
