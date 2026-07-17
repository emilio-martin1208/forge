import jwt from "jsonwebtoken";

// GitHub App auth flow: sign a short-lived JWT with the app's private key,
// exchange it for an installation access token scoped to one repo owner.
// Shared by apps/worker (clone + review jobs) and apps/api (sync backfill)
// — moved here once a second consumer needed it, not before.

function signAppJwt(): string {
  const appId = process.env.GITHUB_APP_ID;
  const privateKey = process.env.GITHUB_APP_PRIVATE_KEY;
  if (!appId || !privateKey) {
    throw new Error("GITHUB_APP_ID / GITHUB_APP_PRIVATE_KEY are not configured");
  }

  const now = Math.floor(Date.now() / 1000);
  return jwt.sign(
    { iat: now - 60, exp: now + 9 * 60, iss: appId },
    privateKey.replace(/\\n/g, "\n"),
    { algorithm: "RS256" },
  );
}

export async function getInstallationAccessToken(installationId: string): Promise<string> {
  const appJwt = signAppJwt();
  const response = await fetch(
    `https://api.github.com/app/installations/${installationId}/access_tokens`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${appJwt}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
    },
  );

  if (!response.ok) {
    throw new Error(`Failed to mint installation token: ${response.status} ${await response.text()}`);
  }

  const body = (await response.json()) as { token: string };
  return body.token;
}
