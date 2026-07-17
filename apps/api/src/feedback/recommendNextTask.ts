import type { FeatureKind, RepositorySnapshot } from "@forge/types";
import type { SnapshotDiff } from "./diff.js";

// A deliberately small, static map — not an LLM guessing what "usually"
// follows a feature. Only features with an obvious, near-universal next gap
// are listed; anything else falls through to the health-score heuristic
// below rather than inventing a plausible-sounding but ungrounded followup.
const FEATURE_FOLLOWUPS: Partial<Record<FeatureKind, string>> = {
  authentication: "email verification and password reset are the most common gaps right after authentication lands",
  payments: "webhook handling and failed-payment states are the most common gaps right after a payment integration lands",
  search: "result ranking and empty-state handling are the most common gaps right after search lands",
  chat: "message persistence and delivery-failure handling are the most common gaps right after chat lands",
  email: "delivery-failure handling and retry logic are the most common gaps right after outbound email lands",
};

export interface DetectedGap {
  category: "feature-gap" | "health-gap";
  subject: string;
  detail: string;
}

/**
 * Priority: a feature that just became detected (something an agent likely
 * just shipped) beats a standing health-score weakness — the former is
 * "what's the natural next step after what just happened," which is more
 * actionable than "the same thing that's always been weak."
 */
export function determineNextTaskGap(diff: SnapshotDiff, current: RepositorySnapshot): DetectedGap | null {
  for (const feature of diff.newlyDetectedFeatures) {
    const followup = FEATURE_FOLLOWUPS[feature as FeatureKind];
    if (followup) return { category: "feature-gap", subject: feature, detail: followup };
  }

  const entries = Object.entries(current.healthScores).sort((a, b) => a[1] - b[1]);
  const weakest = entries[0];
  if (weakest && weakest[1] < 100) {
    return {
      category: "health-gap",
      subject: weakest[0],
      detail: `${weakest[0]} is the weakest dimension in the current snapshot at ${weakest[1]}/100`,
    };
  }

  return null;
}
