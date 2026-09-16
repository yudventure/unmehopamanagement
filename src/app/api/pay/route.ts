import { randomUUID } from "node:crypto";

import { NextResponse } from "next/server";

import { eddoRooms } from "@/lib/eddo-content";
import { createSnapToken, midtransConfigured, snapScript } from "@/lib/midtrans";

/**
 * Starts a payment: takes who and when, answers with a Snap token.
 *
 * The amount is worked out here from the same room table the manager's
 * calendar reads, and nothing about money is taken from the request. A body
 * that carries its own total is a body that can carry Rp 1.
 *
 * There is still no database. The order id is what ties this to the
 * notification that follows, and the notification is what reaches the owner.
 *
 * Answers 503 when the Midtrans keys are unset, which is what the button reads
 * before it decides whether to offer paying or asking.
 */

export const runtime = "nodejs";

const MAX_NIGHTS = 30;
const MAX_GUESTS = 12;

const clean = (v: unknown) => (typeof v === "string" ? v.trim().slice(0, 200) : "");
const whole = (v: unknown, lo: number, hi: number) => {
  const n = Math.floor(Number(v));
  return Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : lo;
};

export async function POST(req: Request) {
  if (!midtransConfigured()) {
    return NextResponse.json({ error: "not-configured" }, { status: 503 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "bad-json" }, { status: 400 });
  }

  /* Real visitors never see this field, so anything in it is a bot. */
  if (clean(body.website)) return NextResponse.json({ error: "no" }, { status: 400 });

  const name = clean(body.name);
  const phone = clean(body.phone);
  const email = clean(body.email);
  const checkIn = clean(body.checkIn);
  const nights = whole(body.nights, 1, MAX_NIGHTS);
  const guests = whole(body.guests, 1, MAX_GUESTS);

  if (!name || (!phone && !email)) {
    return NextResponse.json({ error: "no-contact" }, { status: 422 });
  }
  /* A stay that has not been given a date cannot be held for anyone. */
  if (!/^\d{4}-\d{2}-\d{2}$/.test(checkIn)) {
    return NextResponse.json({ error: "no-date" }, { status: 422 });
  }

  const { rate } = eddoRooms();
  if (!rate) return NextResponse.json({ error: "no-rate" }, { status: 500 });

  const gross = rate * nights;
  /* Dated and random: the date is what makes it readable in the dashboard, the
     random tail is what stops two people booking in the same second from
     colliding. Midtrans refuses an order id it has already seen. */
  const orderId = `EDDO-${checkIn.replace(/-/g, "")}-${randomUUID().slice(0, 8).toUpperCase()}`;

  const snap = await createSnapToken({
    orderId,
    gross,
    items: [
      {
        id: "EDDO-HOUSE",
        price: rate,
        quantity: nights,
        name: `Eddo Homestay, ${nights} malam, ${guests} tamu`.slice(0, 50),
      },
    ],
    customer: {
      first_name: name.slice(0, 50),
      ...(email ? { email } : {}),
      ...(phone ? { phone } : {}),
    },
  });

  if (!snap.ok) {
    return NextResponse.json({ error: snap.error }, { status: 502 });
  }
  /* The script URL comes back with the token so the browser does not need a
     second public variable telling it which Midtrans it is talking to. */
  return NextResponse.json({ token: snap.token, orderId, gross, snap: snapScript() });
}
