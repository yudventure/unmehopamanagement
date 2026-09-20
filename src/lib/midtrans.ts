/**
 * Midtrans, kept to the two things the site actually does with it: ask for a
 * Snap token, and check that a notification really came from Midtrans.
 *
 * Server-side only. The server key signs and authorises, so it never leaves
 * this file's side of the wire; the client key is public by design and is the
 * only one the browser is given.
 *
 * Three variables on the server:
 *
 *   MIDTRANS_SERVER_KEY         from the Midtrans dashboard
 *   NEXT_PUBLIC_MIDTRANS_CLIENT_KEY   the matching client key
 *   MIDTRANS_IS_PRODUCTION      "true" to leave the sandbox
 *
 * With the server key unset the endpoints answer 503 and the site falls back
 * to its enquiry form, the same way a missing Resend key costs an enquiry
 * nothing. A payment button that opens a broken window is worse than no
 * payment button.
 */
import { createHash } from "node:crypto";

import type { PublicSite } from "@/lib/site-domains";

/**
 * Which homestay an order id belongs to.
 *
 * Midtrans's notification carries the order id, the amount and the status, and
 * the two homestays are answered by two different families with two different
 * inboxes. So the site has to be readable from the id itself, and `/api/pay`
 * writes it into the front of every Turtle one.
 *
 * Eddo's ids are not prefixed and do not need to be. Theirs begin either with
 * `EDDO` or with one of the service keys — `TRANSFER`, `MOTORBIKE`, `MERCH`
 * and so on — and none of that closed list is `TURTLE`, so "anything else" is
 * Eddo rather than a guess. It also keeps every order id issued before this
 * existed pointing where it always did.
 */
export function orderSite(orderId: string | undefined): PublicSite {
  return (orderId ?? "").startsWith("TURTLE-") ? "turtle" : "eddo";
}

export function midtransConfigured() {
  return Boolean(process.env.MIDTRANS_SERVER_KEY);
}

export function isProduction() {
  return process.env.MIDTRANS_IS_PRODUCTION === "true";
}

function snapHost() {
  return isProduction()
    ? "https://app.midtrans.com"
    : "https://app.sandbox.midtrans.com";
}

/** The script the browser loads, and which key it is told to use. */
export function snapScript() {
  return `${snapHost()}/snap/snap.js`;
}

export interface SnapOrder {
  orderId: string;
  /** Whole rupiah. Midtrans rejects anything with a fraction. */
  gross: number;
  items: { id: string; price: number; quantity: number; name: string }[];
  customer: { first_name: string; email?: string; phone?: string };
  /**
   * Up to three short lines Midtrans stores and hands back untouched.
   *
   * Its notification carries the order id, the amount and the status and
   * nothing else, so without these the email that says a payment arrived
   * cannot say what it was for. These are the only part of the request that
   * comes back, so they are where the booking itself is written.
   *
   * Anything past the third is dropped rather than quietly merged, and each is
   * cut to 255 characters, which is what the API accepts.
   */
  fields?: string[];
}

/**
 * Asks Midtrans for a Snap token.
 *
 * The amount is built by the caller from the room table, never taken from the
 * browser: a price that arrives in a request body is a price the sender chose.
 */
export async function createSnapToken(order: SnapOrder): Promise<
  { ok: true; token: string; redirect: string } | { ok: false; error: string }
> {
  const key = process.env.MIDTRANS_SERVER_KEY;
  if (!key) return { ok: false, error: "not-configured" };

  const res = await fetch(`${snapHost()}/snap/v1/transactions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      /* Basic auth with the server key as the username and an empty password,
         which is what the colon is doing there. */
      Authorization: `Basic ${Buffer.from(`${key}:`).toString("base64")}`,
    },
    body: JSON.stringify({
      transaction_details: { order_id: order.orderId, gross_amount: order.gross },
      item_details: order.items,
      customer_details: order.customer,
      credit_card: { secure: true },
      ...Object.fromEntries(
        (order.fields ?? [])
          .slice(0, 3)
          .map((v, i) => [`custom_field${i + 1}`, String(v).slice(0, 255)])
          .filter(([, v]) => v),
      ),
    }),
  });

  if (!res.ok) {
    return { ok: false, error: `snap-failed: ${(await res.text()).slice(0, 300)}` };
  }
  const json = (await res.json()) as { token?: string; redirect_url?: string };
  if (!json.token) return { ok: false, error: "snap-no-token" };
  return { ok: true, token: json.token, redirect: json.redirect_url ?? "" };
}

/**
 * Whether a notification was signed by Midtrans with our server key.
 *
 * Anyone can POST to a public webhook, so without this a stranger could mark
 * any order paid. `gross_amount` is compared as the string Midtrans sent,
 * because that is what it hashed: turning "400000.00" into a number and back
 * gives "400000" and the digest stops matching.
 */
export function signatureOk(body: {
  order_id?: string;
  status_code?: string;
  gross_amount?: string;
  signature_key?: string;
}) {
  const key = process.env.MIDTRANS_SERVER_KEY;
  if (!key || !body.signature_key) return false;
  const want = createHash("sha512")
    .update(`${body.order_id ?? ""}${body.status_code ?? ""}${body.gross_amount ?? ""}${key}`)
    .digest("hex");
  /* Both are hex digests of a fixed length, so a plain comparison leaks
     nothing useful about timing that the attacker does not already know. */
  return want === body.signature_key;
}

/**
 * What a transaction status means in one word, for the owner's inbox.
 *
 * `capture` needs its fraud status read as well: a captured card transaction
 * can still be sitting in review, and telling the owner a room is paid for
 * when the money may yet be pulled back is the one mistake here that costs
 * them a night.
 */
export function outcome(body: {
  transaction_status?: string;
  fraud_status?: string;
}): "paid" | "pending" | "review" | "failed" {
  const s = body.transaction_status;
  if (s === "capture") return body.fraud_status === "accept" ? "paid" : "review";
  if (s === "settlement") return "paid";
  if (s === "pending") return "pending";
  return "failed";
}
