"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { Price } from "@/components/web/price";
import { SiteLogo } from "@/components/web/site-logo";
import { useCurrency, useLang, useRates } from "@/hooks/use-site-prefs";
import { daysBetween } from "@/lib/days";
import { loadSnap, niceDay } from "@/lib/snap";
import { clearDraft, readDraft, type TurtleDraft } from "@/lib/turtle-order";
import { COPY, DIVE_PER, PROPERTY, priceTurtle } from "@/lib/web-content";

/**
 * The page an order is looked over on, between choosing and paying.
 *
 * Midtrans opens its payment sheet over whatever page is showing, and what
 * would otherwise be showing is the top of the homestay's front page: a
 * payment window floating over a photograph of a reef, with the headline
 * behind it. This is a page for the one thing the reader is doing, and the
 * sheet opens over a page that expects it.
 *
 * ## It is a summary, not a second form
 *
 * Everything was already asked for in the dialog. Asking again here would be a
 * page that distrusts the one before it. So this shows what was chosen, prices
 * it, and offers one button; anything wrong is fixed by going back, which is
 * one link away.
 *
 * ## It prices from the tables, not from the draft
 *
 * The draft carries what was chosen and never what it costs. The figure here
 * comes from `priceTurtle`, reading the manager's room table and the owner's
 * dive prices, and `/api/pay` calls the same function again before charging
 * anything. Two readings of one number, no copies passed between them — and a
 * draft that had been edited in the browser shows a total nobody is charged
 * rather than a charge nobody agreed to.
 */

const ROW = "flex items-baseline justify-between gap-6 py-[9px]";
const KEY_ = "shrink-0 text-[12.5px] text-slate";
const VAL = "min-w-0 text-right text-[13.5px] font-medium text-ink";
const HOME_PILL =
  "mt-7 inline-flex items-center justify-center gap-2 rounded-full bg-ink px-[24px] py-[12px] text-[14px] font-medium text-white no-underline transition-colors hover:bg-ink-soft hover:text-white hover:no-underline";

export function TurtleCheckout() {
  const { lang } = useLang();
  const { currency } = useCurrency();
  const rates = useRates();
  const t = COPY[lang];
  const b = t.booking.order;

  /* Read after mount, never during render: this page is prerendered, and the
     draft lives in the browser. Reading it while rendering would make the
     server's HTML and the browser's first paint disagree. */
  const [draft, setDraft] = useState<TurtleDraft | null>(null);
  const [ready, setReady] = useState(false);
  const [status, setStatus] = useState<"idle" | "paying" | "paid" | "failed">("idle");

  useEffect(() => {
    setDraft(readDraft());
    setReady(true);
  }, []);

  useEffect(() => {
    document.documentElement.lang = t.htmlLang;
  }, [t.htmlLang]);

  /* The span between the two dates, which is the nights of a stay and the days
     of a gear hire. Counted here rather than carried, the same way the server
     counts it rather than reading it out of the request. */
  const span = draft ? daysBetween(draft.from, draft.to) : 0;

  let title = "";
  let lines: { k: string; v: string }[] = [];
  let unitLabel = "";
  let back = "/turtle";
  let sale = null as ReturnType<typeof priceTurtle>;

  if (draft?.kind === "room") {
    sale = priceTurtle({ kind: "room", room: draft.room, count: span });
    title = t.rooms.types[draft.room].name;
    unitLabel = t.rooms.perNight;
    back = "/turtle#kamar";
    lines = [
      { k: t.booking.checkIn, v: niceDay(draft.from, t.htmlLang) },
      { k: t.booking.checkOut, v: niceDay(draft.to, t.htmlLang) },
      { k: t.booking.nights, v: t.booking.nightsValue(span) },
      { k: t.booking.guests, v: t.booking.guestsValue(draft.guests) },
    ];
  } else if (draft?.kind === "dive") {
    /* Gear is hired by the day and everything else is sold by the head, so
       what the price is multiplied by is read from the same table the server
       reads it from rather than from the unit printed beside it. That line is
       translated; this one is not. */
    const per = DIVE_PER[draft.pack];
    sale = priceTurtle({
      kind: "dive",
      pack: draft.pack,
      count: per === "day" ? span : draft.count,
    });
    title = t.dive.packages[draft.pack].name;
    unitLabel = t.dive.packages[draft.pack].unit;
    back = "/turtle#diving";
    lines =
      per === "day"
        ? [
            { k: t.booking.fromDay, v: niceDay(draft.from, t.htmlLang) },
            { k: t.booking.untilDay, v: niceDay(draft.to, t.htmlLang) },
            { k: t.booking.days, v: t.booking.daysValue(span) },
          ]
        : [
            { k: t.booking.day, v: niceDay(draft.from, t.htmlLang) },
            { k: t.booking.divers, v: t.booking.diversValue(draft.count) },
          ];
  }

  const pay = async () => {
    if (!draft || !sale || status === "paying") return;
    setStatus("paying");
    try {
      /* What was chosen, never what it costs. The endpoint prices it again. */
      const body =
        draft.kind === "room"
          ? {
              site: "turtle",
              kind: "room",
              room: draft.room,
              checkIn: draft.from,
              until: draft.to,
              guests: draft.guests,
              name: draft.name,
              phone: draft.phone,
              email: draft.email,
            }
          : {
              site: "turtle",
              kind: "dive",
              pack: draft.pack,
              checkIn: draft.from,
              until: draft.to,
              divers: draft.count,
              name: draft.name,
              phone: draft.phone,
              email: draft.email,
            };
      /* The language this reader chose, sent with either kind of order, the
         same way Eddo's page sends it: it rides in the custom field beside the
         name and the number, so the family knows which language to answer in
         when the notification reaches them. */
      const res = await fetch("/api/pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...body, lang }),
      });
      if (!res.ok) throw new Error(String(res.status));
      const out = (await res.json()) as { token: string; snap: string };
      await loadSnap(out.snap);
      /* Snap tells us how it ended. Without these the sheet closes and the
         page behind it still says "pay", which is the one moment a reader most
         wants to be told something. */
      window.snap?.pay(out.token, {
        onSuccess: () => {
          clearDraft();
          setStatus("paid");
        },
        /* A transfer that has been chosen but not yet made is still an order
           the family has been told about, so the reader is thanked rather than
           left on a button they have already pressed. */
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
  if (!ready) return <main className="min-h-screen bg-canvas" />;

  return (
    <main className="min-h-screen bg-canvas px-5 py-10 md:py-16">
      <div className="mx-auto w-full max-w-[560px]">
        <Link
          href="/turtle"
          className="inline-flex items-center gap-[10px] text-[17px] font-bold tracking-[-.02em] text-ink no-underline"
        >
          <SiteLogo size={34} />
          {PROPERTY.name}
        </Link>

        <div className="mt-6 overflow-hidden rounded-[22px] border border-line-soft bg-surface shadow-[0_24px_60px_-38px_rgba(20,28,20,.5)]">
          {/* A band of the site's green across the top, so the page reads as
              part of the homestay rather than as a form that happens to
              follow it. */}
          <div className="h-[6px] bg-teal" />

          {status === "paid" ? (
            <div className="px-7 py-10 text-center md:px-9">
              <div className="mx-auto flex h-[54px] w-[54px] items-center justify-center rounded-full bg-teal-tint text-teal-deep">
                <svg
                  viewBox="0 0 24 24"
                  width="28"
                  height="28"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="m4.5 12.5 5 5 10-11" />
                </svg>
              </div>
              <h1 className="mt-5 mb-0 text-[24px] leading-[1.2] font-bold tracking-[-.02em]">
                {b.paid}
              </h1>
              <p className="mt-3 mb-0 text-[14px] leading-[1.65] text-slate">{b.paidNote}</p>
              <Link href="/turtle" className={HOME_PILL}>
                {b.home}
              </Link>
            </div>
          ) : !draft || !sale ? (
            <div className="px-7 py-10 text-center md:px-9">
              <h1 className="m-0 text-[22px] leading-[1.2] font-bold tracking-[-.02em]">
                {b.title}
              </h1>
              <p className="mt-3 mb-0 text-[14px] leading-[1.65] text-slate">{b.empty}</p>
              <Link href="/turtle" className={HOME_PILL}>
                {b.home}
              </Link>
            </div>
          ) : (
            <>
              <div className="px-7 pt-7 pb-6 md:px-9">
                <h1 className="m-0 text-[clamp(22px,3.4vw,27px)] leading-[1.15] font-bold tracking-[-.025em]">
                  {b.title}
                </h1>
                <p className="mt-2 mb-0 text-[13.5px] leading-[1.6] text-slate">{b.intro}</p>
              </div>

              <div className="border-t border-line px-7 py-6 md:px-9">
                <div className="font-mono text-[10.5px] tracking-[.1em] text-teal-deep uppercase">
                  {b.what}
                </div>
                <div className="mt-[6px] text-[17px] leading-[1.3] font-bold">{title}</div>
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
                <div className="font-mono text-[10.5px] tracking-[.1em] text-teal-deep uppercase">
                  {b.who}
                </div>
                <dl className="mt-2 mb-0 divide-y divide-line">
                  {[
                    { k: t.enquiry.name, v: draft.name },
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

              <div className="border-t border-line bg-surface-mute px-7 py-6 md:px-9">
                {/* The sum written out above its answer. A total on its own
                    asks to be taken on trust; this one shows the two numbers
                    it came from, both read from the tables here rather than
                    carried from the page before. */}
                <div className="flex items-baseline justify-between gap-5 pb-3 text-[13px] text-slate">
                  <span className="flex flex-wrap items-baseline gap-[6px]">
                    <Price
                      rupiah={sale.unitPrice}
                      lang={t.htmlLang}
                      currency={currency}
                      rates={rates}
                      size="sm"
                      className="text-ink-soft"
                    />
                    <span className="text-slate-soft">{unitLabel}</span>
                  </span>
                  <span className="shrink-0">× {sale.count}</span>
                </div>

                <div className="flex items-baseline justify-between gap-5 border-t border-line pt-4">
                  <span className="text-[14px] font-medium">{t.booking.total}</span>
                  <Price
                    rupiah={sale.total}
                    lang={t.htmlLang}
                    currency={currency}
                    rates={rates}
                    size="lg"
                    className="text-right"
                  />
                </div>

                {status === "failed" && (
                  <p className="mt-4 mb-0 rounded-[10px] bg-danger-tint px-[13px] py-[10px] text-[12.5px] leading-[1.5] text-danger-deep">
                    {b.failed}
                  </p>
                )}

                <button
                  type="button"
                  onClick={pay}
                  disabled={status === "paying"}
                  className="mt-5 inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-full border-none bg-ink px-[22px] py-[14px] text-[15px] font-semibold text-white transition-colors hover:bg-ink-soft disabled:cursor-wait disabled:opacity-70"
                >
                  {b.pay}
                </button>
                <p className="mt-3 mb-0 text-center text-[12px] leading-[1.5] text-slate-soft">
                  {b.payNote}
                </p>
              </div>
            </>
          )}
        </div>

        {draft && status !== "paid" && (
          <div className="mt-5 text-center">
            <Link
              href={back}
              className="text-[13px] font-medium text-teal-deep no-underline hover:underline"
            >
              ← {b.back}
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
