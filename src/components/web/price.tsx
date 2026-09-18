"use client";

import {
  CURRENCIES,
  convert,
  type CurrencyCode,
  type Rates,
} from "@/lib/currency";
import { money } from "@/lib/web-content";

/**
 * A price: rupiah, and underneath it the same amount in whatever the reader
 * picked.
 *
 * Never the other way round. Rupiah is what is actually charged, so it keeps
 * the size and the weight; the converted line is smaller, prefixed with an
 * approximation sign, and disappears entirely when no rate has loaded. A guest
 * should not be able to come away thinking they were quoted in dollars.
 */
export function Price({
  rupiah,
  lang,
  currency,
  rates,
  className = "",
  size = "lg",
  tone = "dark",
}: {
  rupiah: number;
  /** A language tag, used only to group the digits. See `money`. */
  lang: string;
  currency: CurrencyCode;
  rates: Rates | null;
  className?: string;
  size?: "xl" | "lg" | "sm";
  tone?: "dark" | "light" | "amber";
}) {
  const approx = convert(rupiah, currency, rates);
  const sub =
    tone === "light"
      ? "text-white/75"
      : tone === "amber"
        ? "text-amber-deep/75"
        : "text-slate";

  return (
    <div className={className}>
      <div
        className={
          size === "xl"
            ? /* Big enough to be read across a room, and it takes its colour
                 from the caller so one page can make the price the loudest
                 thing on it without every page having to. */
              "text-[clamp(30px,3.6vw,40px)] leading-[1.05] font-bold tracking-[-.02em]"
            : size === "lg"
              ? "text-[20px] font-bold"
              : "text-[17px] font-bold"
        }
      >
        {money(rupiah, lang)}
      </div>
      {/* Reserved height even when empty, so a card does not jump as the rates
          land a moment after the page does. */}
      <div className={`min-h-[15px] ${size === "xl" ? "mt-1 text-[13px]" : "text-[11.5px]"} ${sub}`}>
        {approx ? `≈ ${approx}` : ""}
      </div>
    </div>
  );
}

/**
 * The currency picker. A plain select rather than a row of flags: eight
 * currencies is too many to sit in a line, and a flag is a country, not a
 * currency.
 */
export function CurrencySwitch({
  currency,
  onPick,
  srLabel,
  tone = "light",
}: {
  currency: CurrencyCode;
  onPick: (next: CurrencyCode) => void;
  /** Said out loud by a screen reader; the visible mark is only a glyph. */
  srLabel: string;
  tone?: "light" | "dark";
}) {
  return (
    <label
      className={`inline-flex cursor-pointer items-center gap-[7px] rounded-full border px-[12px] py-[6px] text-[12px] ${
        tone === "light"
          ? "border-white/25 text-white/75"
          : "border-line-strong bg-surface text-slate"
      }`}
    >
      <span className="sr-only">{srLabel}</span>
      <span aria-hidden="true">≈</span>
      <select
        value={currency}
        onChange={(e) => onPick(e.target.value as CurrencyCode)}
        className={`cursor-pointer border-none bg-transparent p-0 text-[12px] font-medium outline-none ${
          tone === "light" ? "text-white" : "text-ink"
        }`}
      >
        {CURRENCIES.map((c) => (
          <option key={c.code} value={c.code} className="text-ink">
            {c.code}
          </option>
        ))}
      </select>
    </label>
  );
}
