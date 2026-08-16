import { NextResponse } from "next/server";

import { BASE, CURRENCIES, type CurrencyCode } from "@/lib/currency";

/**
 * Exchange rates for the price lines, fetched here rather than in the browser.
 *
 * Going through the server means one cached call serves every visitor instead
 * of each one hitting a third party, the upstream host never sees who is
 * reading the site, and if the source changes or dies it changes in one file.
 *
 * Cached for six hours. These are homestay prices, not a trading screen: a
 * rate from this morning is worth exactly as much as a rate from this second,
 * and the figure is shown as an approximation either way.
 *
 * The source is key-free by choice, because the owner has no account to
 * manage. `RATES_URL` overrides it if that ever needs to change.
 */

export const runtime = "nodejs";

const SOURCE = process.env.RATES_URL ?? `https://open.er-api.com/v6/latest/${BASE}`;
const SIX_HOURS = 21_600;

export async function GET() {
  try {
    const res = await fetch(SOURCE, {
      next: { revalidate: SIX_HOURS },
      headers: { Accept: "application/json" },
    });
    if (!res.ok) throw new Error(`upstream ${res.status}`);

    const data = (await res.json()) as {
      rates?: Record<string, number>;
      time_last_update_utc?: string;
      base_code?: string;
    };
    if (!data.rates) throw new Error("no rates in payload");

    /* Only the handful the picker offers. Passing the upstream's full list of
       160 currencies through to every visitor would be most of the page's
       weight for nothing. */
    const rates: Partial<Record<CurrencyCode, number>> = {};
    for (const c of CURRENCIES) {
      if (c.code === BASE) continue;
      const v = data.rates[c.code];
      if (typeof v === "number" && v > 0) rates[c.code] = v;
    }

    return NextResponse.json(
      {
        base: data.base_code ?? BASE,
        rates,
        updated: data.time_last_update_utc ?? "",
      },
      /* A short browser cache on top of the server's, so a reader moving
         between the package pages does not refetch on every navigation. */
      { headers: { "Cache-Control": "public, max-age=3600" } },
    );
  } catch {
    /* The site has to work when this does not. 503 with nothing in it is the
       signal the client uses to simply not draw a second price line, which
       leaves rupiah on its own — correct, just less convenient. */
    return NextResponse.json({ error: "unavailable" }, { status: 503 });
  }
}
