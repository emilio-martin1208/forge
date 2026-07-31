export interface FileTreeNode {
  name: string;
  path: string;
  type: "file" | "directory";
  children?: FileTreeNode[];
}

/**
 * Builds a nested tree from the Snapshot's flat `fileTree.allFiles` path
 * list — the analyzer stores paths, not a tree, so this reconstruction
 * happens client-side rather than duplicating tree-shaped storage server
 * side for a view nothing else needs.
 */
export function buildFileTree(paths: string[] | undefined | null): FileTreeNode[] {
  const root: FileTreeNode = { name: "", path: "", type: "directory", children: [] };
  // Snapshots are stored as Json — a row analyzed before this field existed
  // simply won't have it. Degrade to an empty tree rather than crash.
  if (!Array.isArray(paths)) return [];

  for (const path of paths) {
    const segments = path.split("/").filter(Boolean);
    let current = root;
    let accumulatedPath = "";

    segments.forEach((segment, i) => {
      accumulatedPath = accumulatedPath ? `${accumulatedPath}/${segment}` : segment;
      const isLastSegment = i === segments.length - 1;
      current.children ??= [];

      let child = current.children.find((c) => c.name === segment);
      if (!child) {
        child = {
          name: segment,
          path: accumulatedPath,
          type: isLastSegment ? "file" : "directory",
          children: isLastSegment ? undefined : [],
        };
        current.children.push(child);
      } else if (!isLastSegment && child.type === "file") {
        // A path claims this segment is a directory but an earlier path
        // claimed it was a file (shouldn't happen with real filesystem
        // data, but don't silently misrender if it does) — promote it.
        child.type = "directory";
        child.children ??= [];
      }

      current = child;
    });
  }

  sortTree(root.children ?? []);
  return root.children ?? [];
}

function sortTree(nodes: FileTreeNode[]): void {
  nodes.sort((a, b) => {
    if (a.type !== b.type) return a.type === "directory" ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
  for (const node of nodes) {
    if (node.children) sortTree(node.children);
  }
}
