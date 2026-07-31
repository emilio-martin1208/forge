import { describe, expect, it } from "vitest";
import { buildFileTree } from "../src/lib/buildFileTree.js";

describe("buildFileTree", () => {
  it("builds a nested tree from flat paths", () => {
    const tree = buildFileTree(["src/index.ts", "src/lib/util.ts", "package.json"]);

    const src = tree.find((n) => n.name === "src");
    expect(src?.type).toBe("directory");
    expect(src?.children?.map((c) => c.name)).toEqual(["lib", "index.ts"]);

    const lib = src?.children?.find((n) => n.name === "lib");
    expect(lib?.children).toEqual([{ name: "util.ts", path: "src/lib/util.ts", type: "file", children: undefined }]);
  });

  it("sorts directories before files, then alphabetically within each", () => {
    const tree = buildFileTree(["b.ts", "a.ts", "zdir/x.ts", "adir/y.ts"]);
    expect(tree.map((n) => n.name)).toEqual(["adir", "zdir", "a.ts", "b.ts"]);
  });

  it("assigns correct full paths at every depth", () => {
    const tree = buildFileTree(["a/b/c/d.ts"]);
    const a = tree[0]!;
    const b = a.children![0]!;
    const c = b.children![0]!;
    const d = c.children![0]!;
    expect([a.path, b.path, c.path, d.path]).toEqual(["a", "a/b", "a/b/c", "a/b/c/d.ts"]);
  });

  it("merges files that share a parent directory into the same node", () => {
    const tree = buildFileTree(["src/a.ts", "src/b.ts"]);
    expect(tree).toHaveLength(1);
    expect(tree[0]!.children).toHaveLength(2);
  });

  it("returns an empty tree for an empty path list", () => {
    expect(buildFileTree([])).toEqual([]);
  });

  it("returns an empty tree instead of crashing when paths is missing (older Snapshot rows predate this field)", () => {
    expect(buildFileTree(undefined)).toEqual([]);
    expect(buildFileTree(null)).toEqual([]);
  });
});
