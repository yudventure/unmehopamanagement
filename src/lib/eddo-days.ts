/**
 * Counting days between two dates, done once.
 *
 * ## Why UTC, always
 *
 * The dates here arrive as `YYYY-MM-DD` from a date input and mean a calendar
 * day, not an instant. Parsing them in the reader's own zone makes the gap
 * between two of them depend on whether a clock change falls inside it: in a
 * zone that springs forward, four calendar days are 95 hours, and dividing by
 * 24 gives 3.96, which floors to three. A guest would be charged for three
 * nights of a four night stay, once a year, in some countries, which is the
 * kind of bug that is found by an accountant rather than by a test.
 *
 * Parsing both ends as UTC midnight removes the question: every UTC day is
 * exactly 86,400,000 milliseconds, so the difference is always whole.
 *
 * ## Why it is its own file
 *
 * There were three copies of this arithmetic, in the room panel, the checkout
 * dialog and the summary page, and they have to agree: the three of them price
 * the same stay, and a rule that lives in three places is a rule that gets
 * fixed in two of them.
 */

/** The longest stay or hire the forms will take. Beyond it, a person answers. */
export const MAX_SPAN = 30;

/**
 * Whole days from one ISO day to another, or 0 if that is not a sensible span.
 *
 * Zero rather than a negative or a throw: every caller wants "how many nights
 * is this" and a check-out before a check-in is not a booking of minus two
 * nights, it is a form that is not finished being filled in.
 */
export function daysBetween(from: string, to: string): number {
  if (!from || !to) return 0;
  const a = Date.parse(`${from}T00:00:00Z`);
  const b = Date.parse(`${to}T00:00:00Z`);
  if (!Number.isFinite(a) || !Number.isFinite(b)) return 0;
  const n = Math.round((b - a) / 86_400_000);
  return n > 0 ? n : 0;
}

/** That span, but only when it is one the form will accept. */
export const spanInRange = (from: string, to: string) => {
  const n = daysBetween(from, to);
  return n >= 1 && n <= MAX_SPAN ? n : 0;
};

/** An ISO day, shifted. Used for the earliest and latest a second date may be. */
export function shiftDay(iso: string, days: number): string {
  const t = Date.parse(`${iso}T00:00:00Z`);
  if (!Number.isFinite(t)) return "";
  return new Date(t + days * 86_400_000).toISOString().slice(0, 10);
}

/** Today, as the date inputs want it, so nothing can be booked for last week. */
export const todayISO = () => new Date().toISOString().slice(0, 10);
