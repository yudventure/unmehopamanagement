/**
 * Showing the price in the reader's own currency, without ever pretending to
 * charge in it.
 *
 * Rupiah is what the homestay takes and what the CMS sets, so it stays the
 * headline figure everywhere. A converted amount is a second line, prefixed
 * with an approximation sign, from a rate that is hours old at best. Quoting a
 * guest "$88" and then asking for rupiah at a different rate on arrival is how
 * an argument starts at the jetty.
 */

export const CURRENCIES = [
  { code: "IDR", label: "Rupiah", locale: "id-ID" },
  { code: "USD", label: "US dollar", locale: "en-US" },
  { code: "EUR", label: "Euro", locale: "de-DE" },
  { code: "GBP", label: "Pound sterling", locale: "en-GB" },
  { code: "AUD", label: "Australian dollar", locale: "en-AU" },
  { code: "SGD", label: "Singapore dollar", locale: "en-SG" },
  { code: "CNY", label: "Chinese yuan", locale: "zh-CN" },
  { code: "JPY", label: "Japanese yen", locale: "ja-JP" },
] as const;

export type CurrencyCode = (typeof CURRENCIES)[number]["code"];

export const BASE: CurrencyCode = "IDR";

export function isCurrency(v: unknown): v is CurrencyCode {
  return CURRENCIES.some((c) => c.code === v);
}

/** What `/api/rates` answers with. Rates are per one rupiah. */
export interface Rates {
  base: string;
  rates: Partial<Record<CurrencyCode, number>>;
  /** When the source last refreshed, as it reported it. */
  updated: string;
}

/**
 * Rounds to something a person would say out loud. An exact conversion of a
 * round rupiah price lands on figures like $88.43, which reads as a precision
 * the rate does not have; the point of the second line is the order of
 * magnitude, not the cents.
 */
function tidy(v: number, code: CurrencyCode) {
  if (code === "JPY" || code === "CNY") return Math.round(v / 10) * 10;
  if (v >= 1000) return Math.round(v / 50) * 50;
  if (v >= 100) return Math.round(v / 5) * 5;
  return Math.round(v);
}

/**
 * The converted line, or null when there is nothing honest to show: no rate
 * loaded yet, or the reader is already looking at rupiah.
 */
export function convert(
  rupiah: number,
  code: CurrencyCode,
  rates: Rates | null,
): string | null {
  if (code === BASE || !rates) return null;
  const rate = rates.rates[code];
  if (!rate) return null;
  const value = tidy(rupiah * rate, code);
  const locale = CURRENCIES.find((c) => c.code === code)?.locale ?? "en-US";
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: code,
    maximumFractionDigits: 0,
  }).format(value);
}
