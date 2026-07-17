/** GitHub issue state -> RoadmapItem status. Split out because it's the one
 * piece of actual logic in an otherwise pure data-copy webhook handler. */
export function issueStateToRoadmapStatus(issueState: "open" | "closed"): "open" | "done" {
  return issueState === "closed" ? "done" : "open";
}
