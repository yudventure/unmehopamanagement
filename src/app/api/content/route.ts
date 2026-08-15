import { NextResponse } from "next/server";

import { SITE_CONFIG, isSiteConfig, type SiteConfig } from "@/lib/site-config";

/**
 * Reads and writes `content/site.json` — the file the website's contact
 * details and dive prices come from.
 *
 * With no database, the repository is the store. A save commits the file
 * through the GitHub API, Vercel sees the commit and rebuilds, and a minute
 * later the site is serving the new figures. Slower than a database and
 * completely durable, with every change kept in the repository's own history
 * next to the name of whoever made it.
 *
 * Needs, on Vercel:
 *
 *   GITHUB_TOKEN   fine-grained token, Contents: read and write, this repo
 *   GITHUB_REPO    "owner/name"
 *   GITHUB_BRANCH  optional, defaults to main
 *   CMS_PASSWORD   what the CMS tab asks for before it will save
 *
 * The password is the whole of the authorisation here, so it is checked in
 * constant time and the endpoint refuses to run at all when it is unset —
 * an unset password must never mean "no password required".
 */

export const runtime = "nodejs";

const PATH = "content/site.json";

function timingSafeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function GET() {
  return NextResponse.json({
    config: SITE_CONFIG,
    writable: Boolean(
      process.env.GITHUB_TOKEN &&
        process.env.GITHUB_REPO &&
        process.env.CMS_PASSWORD,
    ),
  });
}

export async function PUT(req: Request) {
  const token = process.env.GITHUB_TOKEN;
  const repo = process.env.GITHUB_REPO;
  const branch = process.env.GITHUB_BRANCH ?? "main";
  const password = process.env.CMS_PASSWORD;

  if (!token || !repo || !password) {
    return NextResponse.json({ error: "not-configured" }, { status: 503 });
  }

  let body: { password?: string; config?: unknown; by?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad-json" }, { status: 400 });
  }

  if (!timingSafeEqual(String(body.password ?? ""), password)) {
    return NextResponse.json({ error: "unauthorised" }, { status: 401 });
  }

  const config = body.config;
  if (!isSiteConfig(config)) {
    return NextResponse.json({ error: "bad-config" }, { status: 422 });
  }

  const next: SiteConfig = {
    ...config,
    updatedAt: new Date().toISOString(),
    updatedBy: String(body.by ?? "").slice(0, 80),
  };

  const api = `https://api.github.com/repos/${repo}/contents/${PATH}`;
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "Content-Type": "application/json",
  };

  /* GitHub needs the blob SHA it is replacing. Fetching it here rather than
     trusting one from the browser is what stops a stale tab overwriting a
     change somebody else saved a minute ago: if the file moved on, the SHA is
     wrong and GitHub rejects the write. */
  const head = await fetch(`${api}?ref=${encodeURIComponent(branch)}`, {
    headers,
    cache: "no-store",
  });
  if (!head.ok) {
    return NextResponse.json(
      { error: "read-failed", detail: await head.text() },
      { status: 502 },
    );
  }
  const { sha } = (await head.json()) as { sha: string };

  const write = await fetch(api, {
    method: "PUT",
    headers,
    body: JSON.stringify({
      message: `Update website content${next.updatedBy ? ` (${next.updatedBy})` : ""}`,
      content: Buffer.from(JSON.stringify(next, null, 2) + "\n").toString(
        "base64",
      ),
      sha,
      branch,
    }),
  });

  if (!write.ok) {
    return NextResponse.json(
      { error: "write-failed", detail: await write.text() },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true, config: next });
}
