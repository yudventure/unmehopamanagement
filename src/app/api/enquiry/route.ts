import { NextResponse } from "next/server";

import { siteConfig } from "@/lib/site-config";
import type { PublicSite } from "@/lib/site-domains";

/**
 * Takes an enquiry from the public site and emails it to the owner.
 *
 * There is no database, by decision: an enquiry is not a record to be managed,
 * it is a message that needs answering, and an inbox already does that well.
 * So this endpoint has one job and no storage. Nothing is written down here,
 * which also means there is nothing here to leak.
 *
 * Needs two environment variables on the server:
 *
 *   RESEND_API_KEY   from resend.com
 *   ENQUIRY_FROM     a sender on a domain verified with Resend, e.g.
 *                    "Turtle Dive Homestay <web@turtlehomestay.com>"
 *
 * That is the address enquiries are sent *from*. Where they land is the owner
 * address in the site config, which is the mailbox on the same domain.
 *
 * Without them it answers 503 and says so, and the site falls back to opening
 * WhatsApp — so a missing key costs an enquiry nothing.
 */

export const runtime = "nodejs";

interface Payload {
  /** "feedback" comes from the footer's suggestion box, not the enquiry form. */
  kind?: string;
  name?: string;
  phone?: string;
  email?: string;
  activity?: string;
  when?: string;
  people?: string;
  nights?: string;
  notes?: string;
  lang?: string;
  /** Which property the message is about, as a name to print in the email. */
  site?: string;
  /** Which property's owner the message belongs to. Separate from `site`
      above because that one is display copy: routing somebody's enquiry on a
      string that exists to be renamed is how it ends up in the wrong inbox. */
  siteKey?: string;
  /** Must stay empty. Anything in it came from a bot. */
  website?: string;
}

const MAX = 2000;
const clean = (v: unknown) =>
  typeof v === "string" ? v.trim().slice(0, MAX) : "";

/** Header-injection guard: a subject line is one line, whatever was typed. */
const oneLine = (v: string) => v.replace(/[\r\n]+/g, " ").slice(0, 120);

const esc = (v: string) =>
  v
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

export async function POST(req: Request) {
  let body: Payload;
  try {
    body = (await req.json()) as Payload;
  } catch {
    return NextResponse.json({ error: "bad-json" }, { status: 400 });
  }

  /* Honeypot. Real visitors never see this field, so anything in it is a bot;
     answer 200 so it learns nothing from the difference. */
  if (clean(body.website)) return NextResponse.json({ ok: true });

  const name = clean(body.name);
  const phone = clean(body.phone);
  const email = clean(body.email);
  const notes = clean(body.notes);

  const feedback = clean(body.kind) === "feedback";

  /* One way to reach them is the whole point of the enquiry form. Without it
     the owner gets a message they cannot answer.

     Feedback is exempt: requiring a reply address on a suggestion box turns it
     into a support ticket, and the honest ones are often the anonymous ones.
     It needs to actually say something instead. */
  if (feedback) {
    if (!notes) {
      return NextResponse.json({ error: "empty" }, { status: 422 });
    }
  } else if (!phone && !email) {
    return NextResponse.json({ error: "no-contact" }, { status: 422 });
  }

  const key = process.env.RESEND_API_KEY;
  const from = process.env.ENQUIRY_FROM;
  if (!key || !from) {
    return NextResponse.json({ error: "not-configured" }, { status: 503 });
  }

  /* Anything unrecognised is Turtle, which is where every enquiry went
     before there was a second site. A body arriving from an old cached page,
     or from something that is not the form at all, should reach a person
     rather than be dropped for having the wrong label on it. */
  const which: PublicSite = clean(body.siteKey) === "eddo" ? "eddo" : "turtle";
  const to = siteConfig(which).contact.ownerEmail;
  const rows: [string, string][] = feedback
    ? [
        ["Email", email || "(tidak diisi)"],
        ["Masukan", notes],
      ]
    : [
        ...(clean(body.site) ? [["Properti", clean(body.site)] as [string, string]] : []),
        ["Nama", name || "—"],
        ["WhatsApp", phone || "—"],
        ["Email", email || "—"],
        ["Mau apa", clean(body.activity) || "—"],
        ["Rencana", clean(body.when) || "—"],
        ["Jumlah orang", clean(body.people) || "—"],
        ["Lama menginap", clean(body.nights) || "—"],
        ["Catatan", notes || "—"],
      ];

  const html = `<div style="font-family:system-ui,sans-serif;font-size:15px;line-height:1.6;color:#241f18">
  <p style="margin:0 0 16px">${feedback ? "Masukan baru dari footer website." : "Pesan baru dari website."}</p>
  <table cellpadding="0" cellspacing="0" style="border-collapse:collapse">
    ${rows
      .map(
        ([k, v]) =>
          `<tr><td style="padding:4px 16px 4px 0;color:#8b8274;vertical-align:top;white-space:nowrap">${k}</td><td style="padding:4px 0">${esc(v).replace(/\n/g, "<br>")}</td></tr>`,
      )
      .join("")}
  </table>
  ${
    phone
      ? `<p style="margin:20px 0 0"><a href="https://wa.me/${encodeURIComponent(
          phone.replace(/\D/g, ""),
        )}" style="color:#2f8a63">Balas lewat WhatsApp</a></p>`
      : ""
  }
</div>`;

  const text = rows.map(([k, v]) => `${k}: ${v}`).join("\n");

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [to],
      /* Reply goes to the guest, not to the sending domain, so hitting reply
         in the inbox does the obvious thing. */
      reply_to: email || undefined,
      subject: oneLine(
        feedback
          ? `Masukan website${email ? ` · ${email}` : ""}`
          : `Pesan website${clean(body.site) ? ` ${clean(body.site)}` : ""}${name ? ` · ${name}` : ""}${
              body.when ? ` · ${clean(body.when)}` : ""
            }`,
      ),
      html,
      text,
    }),
  });

  if (!res.ok) {
    return NextResponse.json(
      { error: "send-failed", detail: await res.text() },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true });
}
