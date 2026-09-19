import { NextResponse } from "next/server";

import { EDDO } from "@/lib/eddo-content";
import { orderSite, outcome, signatureOk } from "@/lib/midtrans";
import { mailOwner, rowsToHtml, type Row } from "@/lib/notify";
import type { PublicSite } from "@/lib/site-domains";
import { PROPERTY } from "@/lib/web-content";

/**
 * Where Midtrans says what happened to a payment.
 *
 * Set this URL as the payment notification URL in the Midtrans dashboard.
 * Midtrans retries, so the same notification can arrive more than once; with
 * no database there is nothing to make idempotent, and the cost of a repeat is
 * a second email rather than a second charge.
 *
 * Everything hangs on the signature. The endpoint is public, and without that
 * check anyone who guessed an order id could tell the owner a room was paid
 * for. A body that fails it is answered 401 and nothing is sent.
 */

export const runtime = "nodejs";

export async function POST(req: Request) {
  let body: Record<string, string>;
  try {
    body = (await req.json()) as Record<string, string>;
  } catch {
    return NextResponse.json({ error: "bad-json" }, { status: 400 });
  }

  if (!signatureOk(body)) {
    return NextResponse.json({ error: "bad-signature" }, { status: 401 });
  }

  const state = outcome(body);
  const label: Record<typeof state, string> = {
    paid: "LUNAS",
    pending: "menunggu pembayaran",
    review: "perlu ditinjau Midtrans",
    failed: "gagal atau dibatalkan",
  };

  /*
   * Midtrans sends the amount as "2700000.00", and printing it straight gave
   * "Rp 2700000.00" in the one line of this email anybody checks twice. Read as
   * a number and written the way rupiah is written, with the raw string kept if
   * it is ever something this cannot parse: a wrong-looking total is better
   * than a missing one.
   *
   * The fraction goes because rupiah has none. Midtrans sends two decimals
   * because its field is decimal, not because there are centavos.
   */
  const rupiah = (raw: string | undefined) => {
    if (!raw) return "—";
    const n = Number(raw);
    return Number.isFinite(n) ? `Rp ${Math.round(n).toLocaleString("id-ID")}` : `Rp ${raw}`;
  };

  /*
   * `credit_card` is what the API calls it; the family reads this on a phone at
   * six in the morning. Anything not on the list is tidied rather than dropped,
   * so a payment method Midtrans adds next year still arrives readable instead
   * of arriving as a dash.
   */
  const CARA: Record<string, string> = {
    credit_card: "Kartu kredit",
    bank_transfer: "Transfer bank",
    echannel: "Mandiri Bill",
    permata: "Permata VA",
    bca_klikpay: "BCA KlikPay",
    gopay: "GoPay",
    shopeepay: "ShopeePay",
    qris: "QRIS",
    cstore: "Gerai (Indomaret atau Alfamart)",
    akulaku: "Akulaku",
    danamon_online: "Danamon Online",
  };
  const cara = (v: string | undefined) =>
    !v ? "—" : (CARA[v] ?? v.replace(/_/g, " "));

  /*
   * The three lines `/api/pay` wrote into the custom fields, read back out.
   *
   * Without them this email said that money had arrived for order
   * TRANSFER-20261104-A1B2C3D4 and nothing more: not who is coming, not which
   * days, not which size, not whether the boat has to sail twice. Everything
   * that matters for actually doing the thing was in the dashboard, behind a
   * login, in another tab, at whatever hour the payment landed.
   *
   * Only shown when present, so a payment made before this existed still
   * produces a sensible email rather than three empty rows.
   */
  const booked: Row[] = (
    [
      ["Pesanan", body.custom_field1],
      ["Tamu", body.custom_field2],
      ["Email tamu", body.custom_field3],
    ] as const
  )
    .filter(([, v]) => v && v.trim())
    .map(([k, v]) => [k, v] as Row);

  const rows: Row[] = [
    ["Status", label[state]],
    ...booked,
    ["Order", body.order_id ?? "—"],
    ["Jumlah", rupiah(body.gross_amount)],
    ["Cara bayar", cara(body.payment_type)],
    ["Waktu", body.transaction_time ?? "—"],
    ["Status Midtrans", body.transaction_status ?? "—"],
  ];

  /*
   * Whose payment this is, read out of the order id.
   *
   * Both homestays take payments now, and they are answered by two different
   * families with two different inboxes. Midtrans sends back the order id, the
   * amount and the status and nothing that names a site, so the id is where
   * the answer has to be: `/api/pay` writes `TURTLE-` into the front of one
   * site's ids and `orderSite` reads it back. This used to be the constant
   * "eddo" with a note saying a second payable site would be a compile error
   * here; it was not a compile error, so the note is now a function.
   */
  const site: PublicSite = orderSite(body.order_id);
  const name = site === "turtle" ? PROPERTY.name : EDDO.name;

  const sent = await mailOwner({
    site,
    subject: `Pembayaran ${site === "turtle" ? "Turtle" : "Eddo"} ${label[state]} · ${body.order_id ?? ""}`,
    html: rowsToHtml(
      state === "paid"
        ? `Satu pemesanan ${name} sudah dibayar. Cek kalendernya sebelum memastikan tanggalnya ke tamu.`
        : `Ada perubahan status pembayaran di ${name}.`,
      rows,
    ),
    text: rows.map(([k, v]) => `${k}: ${v}`).join("\n"),
  });

  /* Answer 200 either way. A non-2xx tells Midtrans to retry, and retrying
     will not fix a Resend key that was never set; the payment itself is
     already recorded on their side. */
  if (sent) console.error("pay/notify: owner not told:", sent);
  return NextResponse.json({ ok: true });
}
