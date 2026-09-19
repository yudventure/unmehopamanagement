import type { DiveKey, RoomKey } from "@/lib/web-content";

/**
 * What the reader has decided to book, between pressing the button and paying.
 *
 * Eddo's file one door along says why this shape exists at all, and the two
 * reasons hold here word for word.
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
 * with `priceTurtle`, and `/api/pay` prices it a third time with the same
 * function before charging anything, so a draft that had been tampered with
 * would show a total nobody is charged rather than a charge nobody agreed to.
 *
 * ## Why it is its own key, not Eddo's
 *
 * The two sites are one application and a reader can have both open. Sharing
 * a key would mean a dive package chosen in one tab replacing a house chosen
 * in the other, and the replacement only being noticed at the total.
 */
export type TurtleDraft =
  | {
      kind: "room";
      room: RoomKey;
      /** ISO days. The nights are the difference and are recomputed, not carried. */
      from: string;
      to: string;
      guests: number;
      name: string;
      phone: string;
      email: string;
    }
  | {
      kind: "dive";
      pack: DiveKey;
      /** The day the boat goes out, or the day hired gear leaves the shed. */
      from: string;
      /** The day that gear comes back. Empty for anything charged per person. */
      to: string;
      /** Divers, or days of hire — whichever that package is priced by. */
      count: number;
      name: string;
      phone: string;
      email: string;
    };

const KEY = "turtle-order";

/**
 * Every one of these is wrapped, and not out of politeness.
 *
 * `sessionStorage` is not merely empty in a private window or with site data
 * blocked — reading the property itself throws, before any method is called.
 * An unguarded access takes the whole page down rather than the one feature.
 */
export function saveDraft(draft: TurtleDraft): boolean {
  try {
    window.sessionStorage.setItem(KEY, JSON.stringify(draft));
    return true;
  } catch {
    return false;
  }
}

export function readDraft(): TurtleDraft | null {
  try {
    const raw = window.sessionStorage.getItem(KEY);
    if (!raw) return null;
    const v = JSON.parse(raw) as TurtleDraft;
    /* Shape-checked rather than trusted. This is the reader's own storage and
       nothing else writes it, but a half-written or stale value would
       otherwise reach the summary as undefined fields and render as blanks
       beside a total. */
    if (!v?.name || !v.phone || !v.email || !v.from) return null;
    if (v.kind === "room") return v.room && v.to ? v : null;
    if (v.kind === "dive") return v.pack && v.count >= 1 ? v : null;
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
