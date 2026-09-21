import "server-only";

/**
 * Reading the old Turtle system, and only ever reading it.
 *
 * The client's staff system is a Google Apps Script web app with a Sheet
 * behind it. It is live: staff open it every morning, invoices are issued
 * from it, and the owner's standing instruction about it has one sentence in
 * it — the data must not change. So this file is deliberately lopsided.
 *
 * That web app speaks two languages:
 *
 *   reads    GET  ?mode=<name>&password=<pw>
 *   writes   POST {action: <name>, …} as text/plain
 *
 * They are separate calls, not one call with a flag, which is the whole
 * reason a read-only door can exist at all. Nothing here can produce the
 * second kind:
 *
 *   - `method` is not a parameter. It is the literal "GET", once, below.
 *   - there is no body, and no code path that could attach one.
 *   - `mode` must be one of `MODE_BACA`. A caller cannot pass its own.
 *   - redirects are followed (Apps Script always bounces /exec to
 *     googleusercontent.com) but only as GET, which is what fetch does with
 *     a 302 anyway.
 *
 * ## The password
 *
 * It lives in `SISTEM_LAMA_PASSWORD` on the server and must never reach a
 * browser. That is not a general precaution; it is specific. The old system
 * puts its password in the query string of every request, so the moment the
 * value is in the bundle, anybody who opens devtools holds the key to a live
 * system that *does* accept writes — from them, if not from us.
 *
 * Which is also why no error from here is allowed to carry the URL: the URL
 * is the password. `sunyikan` exists for that one job.
 */

/** Read modes, copied from the old app's own calls. Nothing else is callable. */
const MODE_BACA = [
  "adminList",
  "adminDashboard",
  "adminDailyReport",
  "adminGetRoomSchedule",
  "adminGetRoomInfo",
  "adminGetResources",
  "adminGetBooking",
  "adminGetDashboardTrips",
  "adminGetKitchenBoard",
  "adminGetUpcomingSessions",
  "adminGetActivityDay",
  "adminGetActivityDetail",
  "adminGetDivingToday",
  "adminCheckRoomAvailability",
  "adminGetTripUpdateDraft",
  "adminGetRoomUpdateDraft",
  "adminGetKitchenWaDraft",
  "adminGetCheckInWhatsAppDraft",
  "adminGetSyncSignature",
  "monitoringList",
  "monitoringBlockedList",
  "activityLogAll",
  "getSites",
] as const;

export type ModeBaca = (typeof MODE_BACA)[number];

/**
 * Two of the old system's GET modes are missing from that list on purpose.
 *
 * `adminSyncFromCalendar` and `invoiceSyncAll` arrive by GET like the rest,
 * but their names say what they do, and a script that syncs writes what it
 * synced. Apps Script is happy to change a Sheet inside a `doGet` — the verb
 * is a convention there, not a rule. Until someone reads the `.gs` and proves
 * otherwise, the safe reading of a name with "sync" in it is that it is a
 * write, and a write is the one thing this file may not do.
 *
 * `adminCheckRole` is left out for a different reason: it is a password
 * probe, and it takes the *staff* password rather than the admin one. Putting
 * it behind our own endpoint would turn our dashboard into a guessing machine
 * for somebody else's login.
 */
export const MODE_DIHINDARI = [
  "adminSyncFromCalendar",
  "invoiceSyncAll",
  "adminCheckRole",
] as const;

export function modeBacaValid(mode: string): mode is ModeBaca {
  return (MODE_BACA as readonly string[]).includes(mode);
}

/** Query parameters the old app passes besides `mode` and `password`. */
const PARAM_DIIZINKAN = [
  "confirmationNo",
  "activityPrefix",
  "date",
  "checkIn",
  "checkOut",
  "adults",
  "needsExtraBed",
  "room",
  "tripId",
  "sessionLabel",
] as const;

export function sistemLamaSiap() {
  return Boolean(
    process.env.SISTEM_LAMA_URL && process.env.SISTEM_LAMA_PASSWORD,
  );
}

/**
 * The password with any trace of it taken out of a string.
 *
 * `fetch` puts the URL it failed on into the error message, and DNS and TLS
 * failures are exactly the errors most likely to be shown to somebody. One
 * timeout should not be how the client's password ends up in a screenshot.
 */
function sunyikan(text: string) {
  const pw = process.env.SISTEM_LAMA_PASSWORD;
  let aman = text;
  if (pw) {
    for (const bentuk of [pw, encodeURIComponent(pw)]) {
      aman = aman.split(bentuk).join("···");
    }
  }
  return aman;
}

export interface HasilBaca<T = unknown> {
  ok: boolean;
  /** The payload as the old system sent it, envelope and all. */
  data?: T;
  /** Already scrubbed. Safe to show. */
  pesan?: string;
  /** Milliseconds the round trip took, for the "is it still alive" line. */
  ms: number;
}

/** Apps Script is slow when the Sheet is big; it is not slow forever. */
const BATAS_MS = 20_000;

/**
 * One read. Returns the envelope the old system sent, untouched.
 *
 * Errors come back as a value rather than a throw, because every caller here
 * wants to render "could not read" next to whatever it read last, not to
 * bring a page down.
 */
export async function bacaSistemLama<T = unknown>(
  mode: ModeBaca,
  params: Record<string, string> = {},
): Promise<HasilBaca<T>> {
  const mulai = Date.now();
  const base = process.env.SISTEM_LAMA_URL;
  const pw = process.env.SISTEM_LAMA_PASSWORD;

  if (!base || !pw) {
    return {
      ok: false,
      pesan: "Alamat atau password sistem lama belum diisi.",
      ms: 0,
    };
  }
  if (!modeBacaValid(mode)) {
    return {
      ok: false,
      pesan: `Mode ${mode} tidak ada dalam daftar baca.`,
      ms: 0,
    };
  }

  let url: URL;
  try {
    url = new URL(base);
  } catch {
    return {
      ok: false,
      pesan: "SISTEM_LAMA_URL bukan alamat yang sah.",
      ms: 0,
    };
  }

  url.searchParams.set("mode", mode);
  url.searchParams.set("password", pw);
  for (const [k, v] of Object.entries(params)) {
    if ((PARAM_DIIZINKAN as readonly string[]).includes(k)) {
      url.searchParams.set(k, v);
    }
  }

  try {
    const res = await fetch(url, {
      method: "GET",
      redirect: "follow",
      cache: "no-store",
      signal: AbortSignal.timeout(BATAS_MS),
      headers: { accept: "application/json,text/plain,*/*" },
    });

    const teks = await res.text();
    if (!res.ok) {
      return {
        ok: false,
        pesan: `Sistem lama menjawab ${res.status}.`,
        ms: Date.now() - mulai,
      };
    }

    let data: T;
    try {
      data = JSON.parse(teks) as T;
    } catch {
      /* A login page, an Apps Script stack trace, or the Google sign-in HTML.
         All three mean the same thing to us: the deployment is not open to
         "anyone with the link", so say that rather than the first 200
         characters of somebody's HTML. */
      return {
        ok: false,
        pesan:
          "Jawabannya bukan JSON. Biasanya berarti web app-nya belum disetel " +
          "“Anyone with the link”, atau alamatnya salah.",
        ms: Date.now() - mulai,
      };
    }

    return { ok: true, data, ms: Date.now() - mulai };
  } catch (err) {
    const pesan = err instanceof Error ? err.message : String(err);
    return { ok: false, pesan: sunyikan(pesan), ms: Date.now() - mulai };
  }
}

// --------------------------------------------------------------- bentuk data

/**
 * What the old system wraps every answer in.
 *
 * Only `status` is dependable. The payload sits under a different key per
 * mode — `bookings`, `rows`, `rooms` — so the readers below pick their own.
 */
export interface Amplop {
  status?: string;
  message?: string;
  [k: string]: unknown;
}

/**
 * One booking as the old Sheet keeps it.
 *
 * Every field is optional and every field is a guess until the real endpoint
 * answers, because this list was read off the old dashboard's own rendering
 * code rather than off a schema. Nothing here is required to be present, and
 * the screen shows a dash where something is missing instead of inventing it.
 */
export interface BookingLama {
  confirmationNo?: string;
  guestName?: string;
  name?: string;
  nama?: string;
  guestNamesList?: string[] | string;
  otherGuests?: string;
  checkIn?: string;
  checkOut?: string;
  room?: string;
  capacity?: string | number;
  whatsapp?: string;
  status?: string;
  displayStatus?: string;
  session?: string;
  reqDiving?: unknown;
  reqSnorkeling?: unknown;
  reqTryDive?: unknown;
  reqTransport?: unknown;
  reqSSICourse?: unknown;
  reqExtraBed?: unknown;
  reqExcursion?: unknown;
  [k: string]: unknown;
}

function amplopOk(data: unknown): data is Amplop {
  return typeof data === "object" && data !== null;
}

/** `{status:'ok', bookings:[…]}` — the old dashboard's booking list. */
export async function bacaDaftarBooking(): Promise<
  HasilBaca<BookingLama[]> & { mentah?: Amplop }
> {
  const hasil = await bacaSistemLama<unknown>("adminList");
  if (!hasil.ok) return hasil as HasilBaca<BookingLama[]>;

  const data = hasil.data;
  if (!amplopOk(data)) {
    return { ok: false, pesan: "Jawabannya bukan objek.", ms: hasil.ms };
  }
  if (data.status !== "ok") {
    return {
      ok: false,
      pesan:
        typeof data.message === "string" && data.message
          ? data.message
          : "Sistem lama menolak permintaannya (status bukan ok).",
      ms: hasil.ms,
    };
  }
  const bookings = Array.isArray(data.bookings)
    ? (data.bookings as BookingLama[])
    : [];
  return { ok: true, data: bookings, ms: hasil.ms, mentah: data };
}

/** The guest's name, whichever of the three columns the old Sheet used. */
export function namaTamu(b: BookingLama): string {
  const kandidat = [b.guestName, b.name, b.nama];
  for (const c of kandidat) {
    if (typeof c === "string" && c.trim()) return c.trim();
  }
  return "";
}

/** How many people the booking names, counting the guest itself. */
export function jumlahTamu(b: BookingLama): number | null {
  const daftar = b.guestNamesList;
  if (Array.isArray(daftar)) return daftar.length || null;
  if (typeof daftar === "string" && daftar.trim()) {
    return daftar.split(/[\n,;]+/).filter((s) => s.trim()).length || null;
  }
  const kap = Number(b.capacity);
  return Number.isFinite(kap) && kap > 0 ? kap : null;
}

/** Whether one of the old `req…` flags is set, whatever shape it arrived in. */
export function diminta(nilai: unknown): boolean {
  if (typeof nilai === "boolean") return nilai;
  if (typeof nilai === "number") return nilai > 0;
  if (typeof nilai === "string") {
    const v = nilai.trim().toLowerCase();
    return v !== "" && v !== "0" && v !== "no" && v !== "false" && v !== "-";
  }
  return false;
}
