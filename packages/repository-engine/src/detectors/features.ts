import type { DependencyRecord, FeatureDetection, FeatureKind } from "@forge/types";

// Dependency-name signatures per feature. This is intentionally the same
// data-driven shape as frameworks.ts. Confidence is 0.6 for a single
// dependency hit — dependency presence is suggestive, not proof the feature
// is *wired up* (that's a v2 problem once we do structural/route analysis).
const FEATURE_SIGNATURES: Record<FeatureKind, string[]> = {
  authentication: ["next-auth", "@auth/core", "passport", "jsonwebtoken", "bcrypt", "@clerk/nextjs", "firebase-admin"],
  payments: ["stripe", "@stripe/stripe-js", "braintree", "square"],
  notifications: ["web-push", "onesignal-node", "firebase-admin"],
  "admin-dashboard": ["react-admin", "adminjs"],
  search: ["algoliasearch", "@elastic/elasticsearch", "meilisearch", "typesense", "flexsearch"],
  chat: ["socket.io", "ably", "pusher", "stream-chat"],
  ai: ["openai", "@anthropic-ai/sdk", "langchain", "llamaindex"],
  email: ["nodemailer", "@sendgrid/mail", "resend", "postmark", "mailgun-js"],
  analytics: ["mixpanel", "amplitude-js", "posthog-js", "analytics-node"],
};

export function detectFeatures(dependencies: DependencyRecord[]): FeatureDetection[] {
  const depNames = new Set(dependencies.map((d) => d.name.toLowerCase()));

  return (Object.keys(FEATURE_SIGNATURES) as FeatureKind[]).map((kind) => {
    const evidence = FEATURE_SIGNATURES[kind].filter((dep) => depNames.has(dep));
    return {
      kind,
      detected: evidence.length > 0,
      confidence: evidence.length > 0 ? Math.min(0.6 + (evidence.length - 1) * 0.2, 0.95) : 0,
      evidence: evidence.map((e) => `dependency:${e}`),
    };
  });
}
