import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

/**
 * Who is allowed into the booking manager.
 *
 * Before this, the login screen checked that the password box was not empty
 * and then let you in. Every check lived in the browser, so even a real one
 * would have been a suggestion. That was survivable while the manager was a
 * private demo and stopped being survivable the day a homestay's own domain
 * started serving it at `/kelola`.
 *
 * Needs on the server:
 *
 *   DASHBOARD_PASSWORD   what the login screen asks for
 *   SESSION_SECRET       optional; signs the cookie. Generated per boot when
 *                        unset, which signs everyone out on a restart. Set it
 *                        in production, where a restart is somebody else's
 *                        decision and a deploy is every few days.
 *
 * With `DASHBOARD_PASSWORD` unset nobody can sign in at all. That is the same
 * direction `CMS_PASSWORD` takes and for the same reason: a password nobody
 * set must never mean a door nobody locked.
 *
 * ## What this is and is not
 *
 * One password for the manager, not an account each. There is no database to
 * keep a password per person in, and the alternatives, hashes committed to the
 * repository or a growing list of environment variables, are worse than being
 * honest about it. The email and role chosen on the login screen still decide
 * which screens and which figures are shown, so staff see a staff view, but
 * the thing standing between the internet and any of it is this one password.
 *
 * When there is somewhere to keep accounts, this is the seam to replace.
 */

export const SESSION_COOKIE = "unmehopa_session";

/** Eight hours: a working day, and short enough that a borrowed laptop forgets. */
const TTL_SECONDS = 60 * 60 * 8;

/**
 * The key the cookie is signed with.
 *
 * Unset means sessions do not survive a restart, which is inconvenient and
 * safe, rather than predictable and not.
 *
 * The generated one is kept on `globalThis` rather than in this module's own
 * scope, and that is not a nicety. A module here is not one instance: Next
 * bundles the page and the route handler separately, so each got its own
 * random value, and a cookie signed by `/api/login` was then checked by the
 * page against a different key. Signing in looked like it worked — 200, a
 * cookie in the jar — and the very next render showed the login screen again,
 * with nothing on the screen or in the log saying why. The symbol is the
 * cross-bundle handle; `Symbol.for` because two bundles are two module scopes
 * but one realm.
 */
const SECRET_KEY = Symbol.for("unmehopa.session.secret");
const realm = globalThis as unknown as Record<symbol, string | undefined>;
const SECRET =
  process.env.SESSION_SECRET ||
  (realm[SECRET_KEY] ??= randomBytes(32).toString("hex"));

export function loginConfigured() {
  return Boolean(process.env.DASHBOARD_PASSWORD);
}

function sign(expiry: number) {
  return createHmac("sha256", SECRET).update(String(expiry)).digest("hex");
}

/** Constant time even when the lengths differ, which `timingSafeEqual` is not. */
function sameString(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) {
    /* Still compare something, so a wrong length does not return faster than a
       wrong value. */
    timingSafeEqual(left, left);
    return false;
  }
  return timingSafeEqual(left, right);
}

/** Whether a password matches. False whenever none is configured. */
export function passwordOk(given: string): boolean {
  const expected = process.env.DASHBOARD_PASSWORD;
  if (!expected || !given) return false;
  return sameString(given, expected);
}

/**
 * A cookie value that carries its own expiry and a signature over it.
 *
 * Stateless on purpose: there is no database, so a session cannot be a row
 * somewhere. The signature is what stops the expiry from simply being edited
 * to a later date by whoever holds the cookie.
 */
export function issue(): { value: string; maxAge: number } {
  const expiry = Math.floor(Date.now() / 1000) + TTL_SECONDS;
  return { value: `${expiry}.${sign(expiry)}`, maxAge: TTL_SECONDS };
}

/** Whether a cookie was issued here and has not run out. */
export function valid(cookie: string | undefined): boolean {
  if (!cookie) return false;
  const [rawExpiry, signature] = cookie.split(".");
  if (!rawExpiry || !signature) return false;

  const expiry = Number(rawExpiry);
  if (!Number.isFinite(expiry)) return false;

  /* Signature first, then expiry. Checking the clock first would let an
     unsigned cookie decide how much work is done on it. */
  if (!sameString(signature, sign(expiry))) return false;
  return expiry > Math.floor(Date.now() / 1000);
}
