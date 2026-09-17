/**
 * Sending the owner an email, for the two endpoints that need to.
 *
 * Lifted out of the enquiry route when the payment webhook turned up needing
 * exactly the same thing: the same key, the same sender, the same inbox, the
 * same little table of rows. Two copies of this would have drifted the first
 * time one of them was fixed.
 *
 * Needs the same two variables the enquiry route always did:
 *
 *   RESEND_API_KEY   from resend.com
 *   ENQUIRY_FROM     a sender on a domain verified with Resend
 *
 * Without them nothing is sent and the caller is told so, rather than a
 * message being swallowed by a service that was never configured.
 */
import { siteConfig } from "@/lib/site-config";
import type { PublicSite } from "@/lib/site-domains";

export const esc = (v: string) =>
  v
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

/** Header-injection guard: a subject line is one line, whatever was typed. */
export const oneLine = (v: string) => v.replace(/[\r\n]+/g, " ").slice(0, 120);

export type Row = [string, string];

export function mailConfigured() {
  return Boolean(process.env.RESEND_API_KEY && process.env.ENQUIRY_FROM);
}

export function rowsToHtml(lead: string, rows: Row[], footer = "") {
  return `<div style="font-family:system-ui,sans-serif;font-size:15px;line-height:1.6;color:#241f18">
  <p style="margin:0 0 16px">${lead}</p>
  <table cellpadding="0" cellspacing="0" style="border-collapse:collapse">
    ${rows
      .map(
        ([k, v]) =>
          `<tr><td style="padding:4px 16px 4px 0;color:#8b8274;vertical-align:top;white-space:nowrap">${k}</td><td style="padding:4px 0">${esc(v).replace(/\n/g, "<br>")}</td></tr>`,
      )
      .join("")}
  </table>
  ${footer}
</div>`;
}

/** Resolves to null on success, or a short reason the send failed. */
export async function mailOwner({
  site,
  subject,
  html,
  text,
  replyTo,
}: {
  /** Whose inbox this belongs to. Required, because the two properties are
      answered by different people and a default would quietly pick one. */
  site: PublicSite;
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
}): Promise<string | null> {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.ENQUIRY_FROM;
  if (!key || !from) return "not-configured";

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [siteConfig(site).contact.ownerEmail],
      reply_to: replyTo || undefined,
      subject: oneLine(subject),
      html,
      text,
    }),
  });

  return res.ok ? null : `send-failed: ${(await res.text()).slice(0, 300)}`;
}
