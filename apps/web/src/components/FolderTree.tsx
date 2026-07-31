"use client";

import { useState } from "react";
import { buildFileTree, type FileTreeNode } from "@/lib/buildFileTree";

export function FolderTree({ paths, truncated }: { paths: string[]; truncated: boolean }) {
  const tree = buildFileTree(paths);

  return (
    <div className="text-sm font-mono">
      {tree.map((node) => (
        <TreeRow key={node.path} node={node} depth={0} />
      ))}
      {truncated && (
        <p className="text-xs text-muted mt-3 font-sans">
          File list was truncated for this repo — showing a partial tree.
        </p>
      )}
    </div>
  );
}

function TreeRow({ node, depth }: { node: FileTreeNode; depth: number }) {
  const [expanded, setExpanded] = useState(depth < 1);

  if (node.type === "file") {
    return (
      <div className="py-0.5 text-muted hover:text-foreground transition" style={{ paddingLeft: `${depth * 16 + 20}px` }}>
        {node.name}
      </div>
    );
  }

  return (
    <div>
      <button
        onClick={() => setExpanded((e) => !e)}
        className="w-full text-left py-0.5 hover:text-accent transition flex items-center gap-1"
        style={{ paddingLeft: `${depth * 16}px` }}
      >
        <span className="text-muted w-3 inline-block">{expanded ? "▾" : "▸"}</span>
        <span>{node.name}/</span>
      </button>
      {expanded && node.children?.map((child) => <TreeRow key={child.path} node={child} depth={depth + 1} />)}
    </div>
  );
}
