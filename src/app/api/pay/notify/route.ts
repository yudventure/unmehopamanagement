import { NextResponse } from "next/server";

import { GUEST_MAIL, guestLang, guestMailHtml, guestMailText } from "@/lib/eddo-mail";
import { outcome, signatureOk } from "@/lib/midtrans";
import { mailGuest, mailOwner, rowsToHtml, type Row } from "@/lib/notify";

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

/*
 * Orders whose guest has already been thanked, so they are not thanked twice.
 *
 * A card payment notifies on `capture` and can notify again on `settlement`,
 * and both mean paid. The owner getting two emails is noise; a guest getting
 * two thank-yous for one payment is a guest counting their bank statement.
 *
 * In memory, and honest about what that is worth: it is emptied by a restart
 * and it is not shared between instances, so it removes the common case and not
 * every case. Doing it properly needs somewhere to write down that an order has
 * been handled, which is the same missing piece that stops a room being held.
 */
const thanked = new Map<string, number>();
const THANKED_FOR = 12 * 60 * 60 * 1000;

function alreadyThanked(order: string) {
  const now = Date.now();
  /* Swept on the way past rather than on a timer, so an idle server holds
     nothing and a busy one cannot grow without bound. */
  for (const [id, at] of thanked) if (now - at > THANKED_FOR) thanked.delete(id);
  if (thanked.has(order)) return true;
  thanked.set(order, now);
  return false;
}

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

  /*
   * And a word to the guest, once the money is actually in.
   *
   * Only on `paid`. A pending bank transfer is not something to thank anybody
   * for, and a failed card is something they already know about.
   *
   * Everything it needs was written into the custom fields when the payment
   * started: who they are, what they booked, which language they were reading
   * the site in. An order made before those existed simply has none, and is
   * skipped rather than guessed at.
   */
  if (state === "paid") {
    const to = (body.custom_field3 ?? "").trim();
    const who = (body.custom_field2 ?? "").trim();
    /* "Name / phone / LANG". Read from the end, so a name with a slash in it
       cannot shift which piece is which. */
    const tail = /\s\/\s*([A-Za-z]{2})\s*$/.exec(who);
    const lang = guestLang(tail?.[1]);
    const name = (tail ? who.slice(0, tail.index) : who).split(" / ")[0]?.trim() ?? "";
    const order = body.order_id ?? "";

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
      /* No address, or one that cannot be an address. Said out loud rather
         than passed to Resend to be rejected there. */
      console.error("pay/notify: guest not told, no usable address:", order);
    } else if (alreadyThanked(order)) {
      /* A card that is captured and then settled notifies twice, and both are
         "paid". The family can live with two emails; a guest thanked twice for
         one payment starts wondering whether they were charged twice. */
      console.error("pay/notify: guest already thanked:", order);
    } else {
      const input = { lang, name: name || to, booking: body.custom_field1 ?? "", order };
      const guest = await mailGuest({
        site: "eddo",
        to,
        subject: GUEST_MAIL[lang].subject(order),
        html: guestMailHtml(input),
        text: guestMailText(input),
      });
      if (guest) console.error("pay/notify: guest not told:", guest);
    }
  }

  /* Answer 200 either way. A non-2xx tells Midtrans to retry, and retrying
     will not fix a Resend key that was never set; the payment itself is
     already recorded on their side. */
  if (sent) console.error("pay/notify: owner not told:", sent);
  return NextResponse.json({ ok: true });
}
