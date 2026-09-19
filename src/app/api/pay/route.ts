import { randomUUID } from "node:crypto";

import { NextResponse } from "next/server";

import { eddoRooms, pickText, priceService } from "@/lib/eddo-content";
import { guestLang } from "@/lib/eddo-mail";
import { createSnapToken, midtransConfigured, snapScript } from "@/lib/midtrans";

/**
 * Starts a payment: takes who and when, answers with a Snap token.
 *
 * The amount is worked out here, from the same room table the manager's
 * calendar reads or from the service list in `content/site.json`, and nothing
 * about money is taken from the request. A body that carries its own total is
 * a body that can carry Rp 1.
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
/* One order, not a wholesale run. Somebody hiring thirty motorbikes is having
   a conversation, not pressing a button. */
const MAX_QTY = 30;

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
  /* The second date: when a hire comes back, or when a return crossing does. */
  const until = clean(body.until);
  /* Which language the guest read the site in. It travels with the order so the
     confirmation that follows is written in it, rather than handing a reader who
     spent an hour on the French pages back to English at the last step. */
  const lang = guestLang(clean(body.lang));
  const nights = whole(body.nights, 1, MAX_NIGHTS);
  const guests = whole(body.guests, 1, MAX_GUESTS);

  /*
   * All three, not a name and one of the other two.
   *
   * It used to take whichever of the number and the address turned up, which
   * meant the family got one of them at random: the number is what they answer
   * on and the address is what the booking is keyed by afterwards, and a form
   * that accepts either guarantees neither. The browser asks for all three, and
   * this is what makes that true of an order rather than true of a form.
   */
  if (!name || !phone || !email) {
    return NextResponse.json({ error: "no-contact" }, { status: 422 });
  }
  /* A stay that has not been given a date cannot be held for anyone. */
  if (!/^\d{4}-\d{2}-\d{2}$/.test(checkIn)) {
    return NextResponse.json({ error: "no-date" }, { status: 422 });
  }

  /*
   * Two things can be paid for: a house, and one of the services the family
   * hires out. Both are priced here, from files, and neither reads a number
   * out of the request.
   *
   * The service branch refuses anything still marked as an example, which is
   * what `payableProduct` is for. Every price in that section is invented until
   * an owner replaces it, and the page no longer says which ones those are, so
   * this refusal is the whole of the guard rather than the second half of it.
   */
  const service = clean(body.service);
  const productId = clean(body.productId);

  let gross: number;
  let item: { id: string; price: number; quantity: number; name: string };
  let tag: string;
  /*
   * What was booked, in words, for the family.
   *
   * Midtrans's notification carries the order id, the amount and the status,
   * and nothing else: not the guest, not the dates, not the size. So the email
   * that reaches the family when somebody pays could say that Rp 3,600,000 had
   * arrived for order TRANSFER-20261104-A1B2C3D4 and leave them to go and look
   * the rest up. Custom fields are the one part of the payload Midtrans sends
   * back verbatim, so the booking is written into them and the notification
   * can read it out.
   */
  let detail = "";

  if (service) {
    /*
     * One call decides three things: whether this is sellable at all, which of
     * the two fares a crossing is on, and whether the size asked for is one the
     * owner has and has any of. It reads the file for every one of them.
     *
     * The size check matters more than it looks. Without it, the browser is the
     * only thing standing between a guest and paying for a shirt in a size that
     * ran out, and the browser's copy of the stock is whatever was true when the
     * page loaded. This is still not a reservation: nothing is written down
     * between pricing and paying, so two people can buy the last shirt inside
     * the same minute. That needs somewhere to record it, which this site does
     * not have yet, and it is a smaller hole than the one this closes.
     */
    const priced = priceService(service, productId, {
      qty: whole(body.qty, 1, MAX_QTY),
      way: clean(body.way),
      size: clean(body.size),
    });
    if (!priced) {
      return NextResponse.json({ error: "not-payable" }, { status: 422 });
    }
    /*
     * A return that was never dated is refused here, not only in the dialog.
     *
     * The boat has to be sent twice, and the second sailing is a fact the
     * family learns from this order or not at all. An order that says "return"
     * and carries no day for it is worse than a one way: it has been paid for
     * and cannot be honoured.
     */
    if (priced.way === "return") {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(until) || until < checkIn) {
        return NextResponse.json({ error: "no-return-date" }, { status: 422 });
      }
    }
    const { product, unitPrice: price, qty } = priced;
    gross = priced.total;
    tag = service.toUpperCase().slice(0, 8);
    item = {
      id: `EDDO-${service}-${product.id}`.slice(0, 50),
      price,
      quantity: qty,
      /* English, because this is read in the Midtrans dashboard by the family
         and in the receipt by a guest who may be reading the site in any of
         seven languages. One language beats a different one every time.

         The quantity is not on it. It used to be, stuck on the end beside the
         `quantity` field two lines up, so an order for two shirts arrived as
         "Eddo Homestay T-shirt x2", quantity 2, and the receipt read as four.

         The size and the return are, because unlike the quantity they appear
         nowhere else in what Midtrans sends on. A shirt packed in the wrong
         size and a boat that was not booked to come back are both failures of
         a detail that never reached the person doing the packing. */
      name: [pickText(product.name, "en"), priced.size, priced.way === "return" ? "return" : ""]
        .filter(Boolean)
        .join(", ")
        .slice(0, 50),
    };
    detail = [
      pickText(product.name, "en"),
      priced.size && `size ${priced.size}`,
      priced.way === "return" ? `return, going ${checkIn}, back ${until}` : `on ${checkIn}`,
      until && priced.way !== "return" ? `until ${until}` : "",
      qty > 1 && `x${qty}`,
    ]
      .filter(Boolean)
      .join(", ");
  } else {
    const { rate } = eddoRooms();
    if (!rate) return NextResponse.json({ error: "no-rate" }, { status: 500 });
    gross = rate * nights;
    tag = "EDDO";
    item = {
      id: "EDDO-HOUSE",
      price: rate,
      quantity: nights,
      name: `Eddo Homestay, ${nights} malam, ${guests} tamu`.slice(0, 50),
    };
    /* Written out rather than "night(s)": this line is copied into the note the
       guest receives, and a guest reading "2 night(s)" is reading a database. */
    detail =
      `Eddo Homestay, check-in ${checkIn}, ` +
      `${nights} night${nights === 1 ? "" : "s"}, ${guests} guest${guests === 1 ? "" : "s"}`;
  }
  /* Dated and random: the date is what makes it readable in the dashboard, the
     random tail is what stops two people booking in the same second from
     colliding. Midtrans refuses an order id it has already seen. */
  const orderId = `${tag}-${checkIn.replace(/-/g, "")}-${randomUUID().slice(0, 8).toUpperCase()}`;

  const snap = await createSnapToken({
    orderId,
    gross,
    items: [item],
    customer: {
      first_name: name.slice(0, 50),
      ...(email ? { email } : {}),
      ...(phone ? { phone } : {}),
    },
    /* Three short lines, because three is all Midtrans gives back. What was
       booked, who booked it, and how to answer them: exactly what somebody
       reading "LUNAS" at six in the morning needs in front of them. */
    fields: [detail, `${name} / ${phone} / ${lang.toUpperCase()}`, email],
  });

  if (!snap.ok) {
    return NextResponse.json({ error: snap.error }, { status: 502 });
  }
  /* The script URL comes back with the token so the browser does not need a
     second public variable telling it which Midtrans it is talking to. */
  return NextResponse.json({ token: snap.token, orderId, gross, snap: snapScript() });
}
