"use client";

import { useEffect, useState } from "react";

import { DEFAULT_LANG, type Lang } from "@/lib/web-content";
import { BASE, isCurrency, type CurrencyCode, type Rates } from "@/lib/currency";

/**
 * The two choices a reader makes about the site itself, in one place because
 * the package pages are separate routes and would otherwise each grow their
 * own copy of this.
 *
 * All three hooks start at the default and settle in an effect rather than
 * reading storage during render: these pages are prerendered, and a value read
 * at render time would not match what the browser hydrates with.
 */

const LANG_KEY = "turtle-lang";
const CURRENCY_KEY = "turtle-currency";

export function useLang() {
  const [lang, setLang] = useState<Lang>(DEFAULT_LANG);
  useEffect(() => {
    const saved = window.localStorage.getItem(LANG_KEY);
    if (saved === "en" || saved === "id") setLang(saved);
  }, []);
  const pickLang = (next: Lang) => {
    setLang(next);
    window.localStorage.setItem(LANG_KEY, next);
  };
  return { lang, pickLang };
}

export function useCurrency() {
  const [currency, setCurrency] = useState<CurrencyCode>(BASE);
  useEffect(() => {
    const saved = window.localStorage.getItem(CURRENCY_KEY);
    if (isCurrency(saved)) setCurrency(saved);
  }, []);
  const pickCurrency = (next: CurrencyCode) => {
    setCurrency(next);
    window.localStorage.setItem(CURRENCY_KEY, next);
  };
  return { currency, pickCurrency };
}

/**
 * Rates, fetched once per page. Nothing is retried and nothing is reported to
 * the reader on failure: `rates` simply stays null, and every price falls back
 * to rupiah alone, which was the real price all along.
 */
export function useRates() {
  const [rates, setRates] = useState<Rates | null>(null);
  useEffect(() => {
    let live = true;
    fetch("/api/rates")
      .then((r) => (r.ok ? r.json() : null))
      .then((d: Rates | null) => {
        if (live && d && d.rates) setRates(d);
      })
      .catch(() => {});
    return () => {
      live = false;
    };
  }, []);
  return rates;
}
