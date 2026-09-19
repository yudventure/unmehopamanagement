"use client";

import { useEffect, useState } from "react";

import { DEFAULT_LANG, isLang, type Lang } from "@/lib/web-content";
import { EDDO_DEFAULT_LANG, isEddoLang, type EddoLang } from "@/lib/eddo-content";
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
    /* Checked against the list rather than against two literals. It used to
       read `saved === "en" || saved === "id"`, which was right while those were
       the only two Turtle had written and which silently dropped every other
       language the day it grew five more. */
    if (isLang(saved)) setLang(saved);
  }, []);
  const pickLang = (next: Lang) => {
    setLang(next);
    window.localStorage.setItem(LANG_KEY, next);
  };
  return { lang, pickLang };
}

/**
 * The same choice, on the other site.
 *
 * Deliberately the same storage key, and now the same seven languages on both
 * sides of it. A reader who set Japanese on one site and walks to the other
 * should not have to set it again, and the two are linked from each other's
 * footers, so that walk is a path people take.
 *
 * This used to be the wide list and `useLang` the narrow one: Turtle was
 * written in two languages, so a reader who chose Japanese at Eddo landed on
 * Turtle in English. Turtle is written in all seven now, so there is nothing
 * left to narrow — the two hooks differ only in which site's `Lang` type they
 * hand back, and each still throws away a value it does not recognise.
 */
export function useEddoLang() {
  const [lang, setLang] = useState<EddoLang>(EDDO_DEFAULT_LANG);
  useEffect(() => {
    const saved = window.localStorage.getItem(LANG_KEY);
    if (isEddoLang(saved)) setLang(saved);
  }, []);
  const pickLang = (next: EddoLang) => {
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
