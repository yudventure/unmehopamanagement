/**
 * Loading Midtrans's payment sheet, once, for whichever checkout page asked.
 *
 * It was written out twice the day the second site started taking payments —
 * the same eight lines, the same `declare global`, in two files that have to
 * agree about a script tag the browser will only accept once. Two copies of a
 * loader that guards against loading twice is the kind of duplication that
 * works until one of them is fixed.
 *
 * The script URL is not a constant here. It comes back from `/api/pay` beside
 * the token, because only the server knows whether the keys it just signed
 * with were the sandbox's or the live ones, and a sheet loaded from the wrong
 * host refuses a token from the other.
 */

declare global {
  interface Window {
    snap?: { pay: (token: string, opts?: Record<string, unknown>) => void };
  }
}

/** Resolves once `window.snap` is there, immediately if it already was. */
export function loadSnap(src: string) {
  return new Promise<void>((resolve, reject) => {
    if (window.snap) return resolve();
    const s = document.createElement("script");
    s.src = src;
    s.setAttribute("data-client-key", process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY ?? "");
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("snap"));
    document.head.appendChild(s);
  });
}

/**
 * An ISO day, written the way the reader's language writes days.
 *
 * `timeZone: "UTC"` is not optional here. The day is parsed as UTC midnight,
 * and formatting that in a zone behind UTC prints the day before: a guest in
 * Jakarta would see their own check-in dated one day earlier than the one they
 * picked. Same trap as the nights arithmetic in `days.ts`.
 */
export function niceDay(iso: string, locale: string) {
  const t = Date.parse(`${iso}T00:00:00Z`);
  if (!Number.isFinite(t)) return iso;
  try {
    return new Intl.DateTimeFormat(locale, {
      day: "numeric",
      month: "short",
      year: "numeric",
      timeZone: "UTC",
    }).format(t);
  } catch {
    /* An unknown tag is not worth a blank date. */
    return iso;
  }
}
