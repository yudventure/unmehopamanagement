export const MONTHS = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

/** "Rp 1.350.000" */
export const fmt = (n: number) => "Rp " + Math.round(n).toLocaleString("id-ID");

/**
 * Local-calendar YYYY-MM-DD. Deliberately not `toISOString().slice(0,10)`:
 * bookings are plain dates, and UTC conversion shifts them a day back
 * everywhere east of Greenwich — including Asia/Jayapura, where this runs.
 */
export const iso = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;

/** Parses a plain date into a local midnight Date. */
export const parse = (s: string) => new Date(s + "T00:00:00");

/** Nights between two plain dates. */
export const dayDiff = (a: string, b: string) =>
  Math.round((parse(b).getTime() - parse(a).getTime()) / 86400000);

/** "18 Agu 2026" */
export const fmtDate = (d: string) => {
  const dt = parse(d);
  return `${dt.getDate()} ${MONTHS[dt.getMonth()].slice(0, 3)} ${dt.getFullYear()}`;
};

/** "18 Agu" */
export const fmtShort = (d: string) => {
  const dt = parse(d);
  return `${dt.getDate()} ${MONTHS[dt.getMonth()].slice(0, 3)}`;
};

/** "14 Agu 2026 09.41" — from a real Date, for the audit trail. */
export const fmtDateTime = (d: Date) =>
  `${d.getDate()} ${MONTHS[d.getMonth()].slice(0, 3)} ${d.getFullYear()} ` +
  `${String(d.getHours()).padStart(2, "0")}.${String(d.getMinutes()).padStart(2, "0")}`;

export const WEEKDAYS = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
