import type { ServiceKey } from "@/lib/eddo-content";

/**
 * What the reader has decided to buy, between pressing the button and paying.
 *
 * ## Why this is not in the URL
 *
 * The obvious way to carry an order to another page is query parameters, and
 * it is the wrong way here: this carries somebody's name, their phone number
 * and their email address. In a URL those are written into browser history,
 * into the server's access log, into whatever the next link's referrer header
 * reaches, and into anything the reader copies and sends to a friend. Session
 * storage keeps them in the one tab that collected them, never leaves the
 * browser, and is gone when the tab closes.
 *
 * ## Why it carries no price
 *
 * Only what was chosen, never what it costs. The summary page prices it again
 * from the same catalogue the card was drawn from and `/api/pay` prices it a
 * third time from the file, so a draft that had been tampered with would show
 * a total nobody is charged rather than a charge nobody agreed to.
 */
export type PayDraft =
  | {
      kind: "room";
      /** ISO days. The nights are the difference and are recomputed, not carried. */
      from: string;
      to: string;
      guests: number;
      name: string;
      phone: string;
      email: string;
    }
  | {
      kind: "service";
      service: ServiceKey;
      productId: string;
      /** Pieces, people or trips, and the number of days for a hire. */
      qty: number;
      /** Empty for something with no day to it, like a shirt. */
      when: string;
      /** The day a hire ends. Empty for everything else. */
      until: string;
      /** The size chosen, when the thing comes in sizes. */
      size: string;
      /** "return" only for a crossing bought both ways. */
      way: "one" | "return";
      name: string;
      phone: string;
      email: string;
    };

const KEY = "eddo-order";

/**
 * Every one of these is wrapped, and not out of politeness.
 *
 * `sessionStorage` is not merely empty in a private window or with site data
 * blocked — reading the property itself throws, before any method is called.
 * An unguarded access takes the whole page down rather than the one feature.
 */
export function saveDraft(draft: PayDraft): boolean {
  try {
    window.sessionStorage.setItem(KEY, JSON.stringify(draft));
    return true;
  } catch {
    return false;
  }
}

export function readDraft(): PayDraft | null {
  try {
    const raw = window.sessionStorage.getItem(KEY);
    if (!raw) return null;
    const v = JSON.parse(raw) as PayDraft;
    /* Shape-checked rather than trusted. This is the reader's own storage and
       nothing else writes it, but a half-written or stale value would
       otherwise reach the summary as undefined fields and render as blanks
       beside a total. */
    if (v?.kind === "room") {
      return v.from && v.to && v.name && v.phone && v.email ? v : null;
    }
    if (v?.kind === "service") {
      return v.service && v.productId && v.name && v.phone && v.email ? v : null;
    }
    return null;
  } catch {
    return null;
  }
}

export function clearDraft() {
  try {
    window.sessionStorage.removeItem(KEY);
  } catch {
    /* Nothing to do about it, and nothing depends on it having worked. */
  }
}
