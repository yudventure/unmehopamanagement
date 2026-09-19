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

/**
 * Sends one email through Resend, to whoever is named.
 *
 * Split out of `mailOwner` when the payment webhook grew a second recipient:
 * the guest gets a word from the family once their payment lands, and that is
 * the same key, the same sender and the same call, to a different inbox.
 * Whose inbox is the only thing that ever differed.
 */
async function send({
  to,
  subject,
  html,
  text,
  replyTo,
}: {
  to: string;
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
}): Promise<string | null> {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.ENQUIRY_FROM;
  if (!key || !from) return "not-configured";
  if (!to.trim()) return "no-recipient";

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [to],
      reply_to: replyTo || undefined,
      subject: oneLine(subject),
      html,
      text,
    }),
  });

  return res.ok ? null : `send-failed: ${(await res.text()).slice(0, 300)}`;
}

/** Resolves to null on success, or a short reason the send failed. */
export function mailOwner({
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
  return send({ to: siteConfig(site).contact.ownerEmail, subject, html, text, replyTo });
}

/**
 * The same, to a guest, with replies pointed at the family rather than at the
 * no-reply address the site sends from.
 *
 * A guest who answers a booking confirmation is asking a question, and a
 * question that lands in `noreply@` is a question nobody hears. `reply_to` is
 * one field and it is the difference between an email and a conversation.
 */
export function mailGuest({
  site,
  to,
  subject,
  html,
  text,
}: {
  site: PublicSite;
  to: string;
  subject: string;
  html: string;
  text: string;
}): Promise<string | null> {
  return send({ to, subject, html, text, replyTo: siteConfig(site).contact.ownerEmail });
}
