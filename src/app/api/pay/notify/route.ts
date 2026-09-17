import { NextResponse } from "next/server";

import { outcome, signatureOk } from "@/lib/midtrans";
import { mailOwner, rowsToHtml, type Row } from "@/lib/notify";

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

  const rows: Row[] = [
    ["Status", label[state]],
    ["Order", body.order_id ?? "—"],
    ["Jumlah", body.gross_amount ? `Rp ${body.gross_amount}` : "—"],
    ["Cara bayar", body.payment_type ?? "—"],
    ["Waktu", body.transaction_time ?? "—"],
    ["Status Midtrans", body.transaction_status ?? "—"],
  ];

  /* Payment only exists on Eddo's rooms, so a payment notice is Eddo's by
     construction. Named rather than assumed, so adding payment to the other
     site is a compile error here instead of a misdelivered email. */
  const sent = await mailOwner({
    site: "eddo",
    subject: `Pembayaran Eddo ${label[state]} · ${body.order_id ?? ""}`,
    html: rowsToHtml(
      state === "paid"
        ? "Satu pemesanan Eddo Homestay sudah dibayar. Cek kalendernya sebelum memastikan tanggalnya ke tamu."
        : "Ada perubahan status pembayaran di Eddo Homestay.",
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
