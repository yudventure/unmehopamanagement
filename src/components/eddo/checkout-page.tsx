"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { Price } from "@/components/web/price";
import { useCurrency, useEddoLang, useRates } from "@/hooks/use-site-prefs";
import {
  EDDO_COPY,
  eddoRooms,
  hasReturn,
  isPriceUnit,
  isRental,
  pickText,
  priceService,
  serviceProducts,
  type ServiceKey,
} from "@/lib/eddo-content";
import { daysBetween, todayISO } from "@/lib/eddo-days";
import { clearDraft, readDraft, type PayDraft } from "@/lib/eddo-order";

/**
 * The page an order is looked over on, between choosing and paying.
 *
 * Midtrans opens its payment sheet over whatever page is showing, and what was
 * showing was the top of the homestay's front page: a payment window floating
 * over a photograph of a beach, with the headline behind it. It worked and it
 * looked like an accident. This is a page for the one thing the reader is
 * doing, and the sheet now opens over a page that expects it.
 *
 * ## It is a summary, not a second form
 *
 * Everything was already asked for, on the card or in the room panel. Asking
 * again here would be a page that distrusts the one before it. So this shows
 * what was chosen, prices it, and offers one button; anything wrong is fixed
 * by going back, which is one link away and keeps what was typed.
 *
 * ## It prices from the catalogue, not from the draft
 *
 * The draft carries what was chosen and never what it costs. The figure here
 * is looked up again from the same file the card was drawn from, and `/api/pay`
 * looks it up a third time before charging anything. Three readings of one
 * number, no copies passed between them.
 */

/**
 * An ISO day, written the way the reader's language writes days.
 *
 * `timeZone: "UTC"` is not optional here. The day is parsed as UTC midnight,
 * and formatting that in a zone behind UTC prints the day before: a guest in
 * Jakarta would see their own check-in dated one day earlier than the one they
 * picked. Same trap as the nights arithmetic, one line further on.
 */
function niceDay(iso: string, locale: string) {
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

declare global {
  interface Window {
    snap?: { pay: (token: string, opts?: Record<string, unknown>) => void };
  }
}

function loadSnap(src: string) {
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

const ROW = "flex items-baseline justify-between gap-6 py-[9px]";
const KEY_ = "shrink-0 text-[12.5px] text-slate";
const VAL = "min-w-0 text-right text-[13.5px] font-medium text-eddo-ink";

export function EddoCheckout() {
  /* Objects, not tuples: these hooks hand back named fields, and destructuring
     them as arrays compiled to nothing useful. */
  const { lang } = useEddoLang();
  const { currency } = useCurrency();
  const rates = useRates();
  const t = EDDO_COPY[lang];

  /* Read after mount, never during render: this page is prerendered, and the
     draft lives in the browser. Reading it while rendering would make the
     server's HTML and the browser's first paint disagree. */
  const [draft, setDraft] = useState<PayDraft | null>(null);
  const [ready, setReady] = useState(false);
  const [status, setStatus] = useState<"idle" | "paying" | "paid" | "failed">("idle");

  useEffect(() => {
    setDraft(readDraft());
    setReady(true);
  }, []);

  useEffect(() => {
    document.documentElement.lang = t.htmlLang;
  }, [t.htmlLang]);

  /* What the draft comes to, priced here rather than carried. */
  const rooms = eddoRooms();
  let title = "";
  let lines: { k: string; v: string }[] = [];
  let unit = 0;
  let count = 1;
  /** What the unit price is per, so the sum above the total explains itself. */
  let unitLabel = "";
  let back = "/eddo";

  if (draft?.kind === "room") {
    const nights = daysBetween(draft.from, draft.to);
    title = t.rooms.name;
    unit = rooms.rate;
    count = nights;
    lines = [
      { k: t.rooms.checkIn, v: niceDay(draft.from, t.htmlLang) },
      { k: t.rooms.checkOut, v: niceDay(draft.to, t.htmlLang) },
      { k: t.rooms.nights, v: t.rooms.nightsValue(nights) },
      { k: t.rooms.guests, v: t.rooms.guestsValue(draft.guests) },
    ];
    unitLabel = t.rooms.perNight;
    back = "/eddo#kamar";
  } else if (draft?.kind === "service") {
    /* Priced through the same function `/api/pay` uses, so the return fare and
       the stock check are one rule rather than two that have to agree. A draft
       it refuses prices at zero and shows nothing to pay, which is the right
       answer for a size that sold out while this tab was open. */
    const priced = priceService(draft.service, draft.productId, {
      qty: draft.qty,
      way: draft.way,
      size: draft.size,
    });
    const product = priced?.product ?? serviceProducts(draft.service as ServiceKey).find((x) => x.id === draft.productId);
    const rental = Boolean(product && isRental(product));
    title = product ? pickText(product.name, lang) : draft.productId;
    unit = priced?.unitPrice ?? 0;
    count = draft.qty;
    lines = [
      { k: t.order.what, v: t.services.items[draft.service as ServiceKey].title },
      ...(draft.size ? [{ k: t.services.size, v: draft.size }] : []),
      ...(priced && hasReturn(priced.product)
        ? [{ k: t.services.way, v: priced.way === "return" ? t.services.roundTrip : t.services.oneWay }]
        : []),
      /* A journey that comes back is shown as two days rather than one day
         and a word, because the day it comes back is the part somebody has to
         be at the jetty for. */
      ...(priced?.way === "return" && draft.until
        ? [
            { k: t.services.goDay, v: niceDay(draft.when, t.htmlLang) },
            { k: t.services.backDay, v: niceDay(draft.until, t.htmlLang) },
          ]
        : []),
      /* A hire reads as a span and a length, the way a stay does. Everything
         else keeps the one day and the count it always had. */
      ...(rental
        ? [
            { k: t.services.fromDay, v: niceDay(draft.when, t.htmlLang) },
            { k: t.services.untilDay, v: niceDay(draft.until, t.htmlLang) },
            { k: t.services.days, v: t.services.daysValue(draft.qty) },
          ]
        : [
            /* Not repeated when the two rows above already said it. */
            ...(draft.when && priced?.way !== "return"
              ? [{ k: t.services.when, v: niceDay(draft.when, t.htmlLang) }]
              : []),
            { k: t.services.qty, v: String(draft.qty) },
          ]),
    ];
    unitLabel = product?.unit && isPriceUnit(product.unit) ? t.services.per[product.unit] : "";
    back = "/eddo#layanan";
  }

  const total = unit * (count || 1);

  const pay = async () => {
    if (!draft || status === "paying") return;
    setStatus("paying");
    try {
      const body =
        draft.kind === "room"
          ? {
              checkIn: draft.from,
              nights: daysBetween(draft.from, draft.to),
              guests: draft.guests,
              name: draft.name,
              phone: draft.phone,
              email: draft.email,
            }
          : {
              service: draft.service,
              productId: draft.productId,
              qty: draft.qty,
              way: draft.way,
              size: draft.size,
              until: draft.until,
              checkIn: draft.when || todayISO(),
              name: draft.name,
              phone: draft.phone,
              email: draft.email,
            };
      const res = await fetch("/api/pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(String(res.status));
      const out = (await res.json()) as { token: string; snap: string };
      await loadSnap(out.snap);
      /* Snap tells us how it ended. Without these the sheet closes and the
         page behind it still says "pay", which is the one moment a reader
         most wants to be told something. */
      window.snap?.pay(out.token, {
        onSuccess: () => {
          clearDraft();
          setStatus("paid");
        },
        onPending: () => {
          clearDraft();
          setStatus("paid");
        },
        onError: () => setStatus("failed"),
        onClose: () => setStatus((s) => (s === "paying" ? "idle" : s)),
      });
    } catch {
      setStatus("failed");
    }
  };

  /* Nothing settled until the draft has been looked for, or the first paint
     would flash the empty state at somebody who has an order. */
  if (!ready) return <main className="min-h-screen bg-eddo-wash" />;

  return (
    <main className="min-h-screen bg-eddo-wash px-5 py-10 md:py-16">
      <div className="mx-auto w-full max-w-[560px]">
        <Link
          href="/eddo"
          className="inline-flex items-center gap-[10px] text-[17px] font-bold tracking-[-.02em] text-eddo-deep no-underline"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/eddo-logo.webp" alt="" width={27} height={40} className="shrink-0" />
          Eddo Homestay
        </Link>

        <div className="mt-6 overflow-hidden rounded-[22px] border border-eddo-line bg-surface shadow-[0_24px_60px_-38px_rgba(15,30,26,.5)]">
          {/* A band of the brand colour across the top, so the page reads as
              part of the site rather than as a form that happens to follow. */}
          <div className="h-[6px] bg-eddo-deep" />

          {status === "paid" ? (
            <div className="px-7 py-10 text-center md:px-9">
              <div className="mx-auto flex h-[54px] w-[54px] items-center justify-center rounded-full bg-eddo-tint text-eddo-deep">
                <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="m4.5 12.5 5 5 10-11" />
                </svg>
              </div>
              <h1 className="mt-5 mb-0 text-[24px] leading-[1.2] font-bold tracking-[-.02em] text-eddo-ink">
                {t.order.paid}
              </h1>
              <p className="mt-3 mb-0 text-[14px] leading-[1.65] text-slate">{t.order.paidNote}</p>
              <Link
                href="/eddo"
                className="mt-7 inline-flex items-center justify-center gap-2 rounded-full bg-eddo-deep px-[24px] py-[12px] text-[14px] font-medium text-white no-underline transition-colors hover:bg-eddo-dark hover:text-white hover:no-underline"
              >
                {t.nav.home}
              </Link>
            </div>
          ) : !draft ? (
            <div className="px-7 py-10 text-center md:px-9">
              <h1 className="m-0 text-[22px] leading-[1.2] font-bold tracking-[-.02em] text-eddo-ink">
                {t.order.title}
              </h1>
              <p className="mt-3 mb-0 text-[14px] leading-[1.65] text-slate">{t.order.empty}</p>
              <Link
                href="/eddo"
                className="mt-7 inline-flex items-center justify-center gap-2 rounded-full bg-eddo-deep px-[24px] py-[12px] text-[14px] font-medium text-white no-underline transition-colors hover:bg-eddo-dark hover:text-white hover:no-underline"
              >
                {t.nav.home}
              </Link>
            </div>
          ) : (
            <>
              <div className="px-7 pt-7 pb-6 md:px-9">
                <h1 className="m-0 text-[clamp(22px,3.4vw,27px)] leading-[1.15] font-bold tracking-[-.025em] text-eddo-ink">
                  {t.order.title}
                </h1>
                <p className="mt-2 mb-0 text-[13.5px] leading-[1.6] text-slate">{t.order.intro}</p>
              </div>

              <div className="border-t border-line px-7 py-6 md:px-9">
                <div className="font-mono text-[10.5px] tracking-[.1em] text-eddo-deep uppercase">
                  {t.order.what}
                </div>
                <div className="mt-[6px] text-[17px] leading-[1.3] font-bold text-eddo-ink">{title}</div>
                <dl className="mt-3 mb-0 divide-y divide-line">
                  {lines.map((l) => (
                    <div key={l.k} className={ROW}>
                      <dt className={KEY_}>{l.k}</dt>
                      <dd className={`${VAL} m-0`}>{l.v}</dd>
                    </div>
                  ))}
                </dl>
              </div>

              <div className="border-t border-line px-7 py-6 md:px-9">
                <div className="font-mono text-[10.5px] tracking-[.1em] text-eddo-deep uppercase">
                  {t.order.who}
                </div>
                <dl className="mt-2 mb-0 divide-y divide-line">
                  {[
                    { k: t.rooms.yourName, v: draft.name },
                    { k: t.enquiry.phone, v: draft.phone },
                    { k: t.enquiry.email, v: draft.email },
                  ].map((l) => (
                    <div key={l.k} className={ROW}>
                      <dt className={KEY_}>{l.k}</dt>
                      <dd className={`${VAL} m-0 truncate`}>{l.v}</dd>
                    </div>
                  ))}
                </dl>
              </div>

              <div className="border-t border-line bg-eddo-wash px-7 py-6 md:px-9">
                {/* The sum written out above its answer. A total on its own
                    asks to be taken on trust; this one shows the two numbers
                    it came from, and both are read from the catalogue here
                    rather than carried from the page before. */}
                <div className="flex items-baseline justify-between gap-5 pb-3 text-[13px] text-slate">
                  <span className="flex flex-wrap items-baseline gap-[6px]">
                    <Price
                      rupiah={unit}
                      lang={t.htmlLang}
                      currency={currency}
                      rates={rates}
                      size="sm"
                      className="text-ink-soft"
                    />
                    {unitLabel && <span className="text-slate-mute">{unitLabel}</span>}
                  </span>
                  <span className="shrink-0">× {count || 1}</span>
                </div>

                <div className="flex items-baseline justify-between gap-5 border-t border-line pt-4">
                  <span className="text-[14px] font-medium text-eddo-ink">{t.rooms.total}</span>
                  <Price
                    rupiah={total}
                    lang={t.htmlLang}
                    currency={currency}
                    rates={rates}
                    size="lg"
                    className="text-right text-eddo-deep"
                  />
                </div>

                {status === "failed" && (
                  <p className="mt-4 mb-0 rounded-[10px] bg-danger-tint px-[13px] py-[10px] text-[12.5px] leading-[1.5] text-danger-deep">
                    {t.services.checkoutFailed}
                  </p>
                )}

                <button
                  type="button"
                  onClick={pay}
                  disabled={status === "paying" || total <= 0}
                  className="mt-5 inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-full border-none bg-eddo-deep px-[22px] py-[14px] text-[15px] font-semibold text-white transition-colors hover:bg-eddo-dark disabled:cursor-wait disabled:opacity-70"
                >
                  {t.rooms.pay}
                </button>
                <p className="mt-3 mb-0 text-center text-[12px] leading-[1.5] text-slate-soft">
                  {t.rooms.payNote}
                </p>
              </div>
            </>
          )}
        </div>

        {draft && status !== "paid" && (
          <div className="mt-5 text-center">
            <Link href={back} className="text-[13px] font-medium text-eddo-deep no-underline hover:underline">
              ← {t.order.back}
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
