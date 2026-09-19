"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { BookModal, type BookOrder } from "@/components/web/book-modal";
import { DayStrip, DepthMeter } from "@/components/web/dive-diagrams";
import {
  EMPTY_ENQUIRY,
  EnquiryModal,
  type Enquiry,
} from "@/components/web/enquiry-modal";
import { LangSwitch } from "@/components/web/lang-switch";
import { CurrencySwitch, Price } from "@/components/web/price";
import { useReveal } from "@/hooks/use-reveal";
import { useCurrency, useLang, useRates } from "@/hooks/use-site-prefs";
import { DIVE_DETAIL } from "@/lib/dive-detail";
import { saveDraft } from "@/lib/turtle-order";
import {
  TURTLE_ACTIVITIES,
  COPY,
  DIVE_PER,
  DIVE_PRICE,
  MAX_DIVERS,
  monthOptions,
  type DiveKey,
} from "@/lib/web-content";

/**
 * One dive package, at length.
 *
 * The card in the section answers "how much" and "how long". This page answers
 * the questions somebody actually has with a card in their hand: how much of
 * the day is spent in the water rather than on a boat, how deep it goes, what
 * the price does not cover, and what to put in the bag.
 *
 * Its two diagrams are drawn rather than photographed on purpose. A photograph
 * of a reef tells a diver nothing they could not guess; a bar showing that two
 * of four hours are boat and interval tells them something they cannot.
 */

const MONTH_ANCHOR = new Date(2026, 7, 1);

const Card = ({
  title,
  items,
}: {
  title: string;
  items: string[];
}) => (
  <section data-reveal className="rounded-[20px] border border-line-soft bg-surface px-6 py-5">
    <h2 className="m-0 text-[15px] font-bold tracking-[-.01em]">{title}</h2>
    <ul className="mt-3 mb-0 flex list-none flex-col gap-[9px] p-0">
      {items.map((s) => (
        <li key={s} className="flex items-start gap-[10px] text-[13.5px] leading-[1.55] text-slate">
          <span className="mt-[7px] h-[6px] w-[6px] shrink-0 rounded-full bg-teal" />
          {s}
        </li>
      ))}
    </ul>
  </section>
);

export function DiveDetail({
  pack,
  payable = false,
}: {
  pack: DiveKey;
  /** Whether the server has Midtrans keys. Decided on the page, not here. */
  payable?: boolean;
}) {
  useReveal();
  const { lang, pickLang } = useLang();
  const { currency, pickCurrency } = useCurrency();
  const rates = useRates();

  const t = COPY[lang];
  const d = t.dive.detail;
  const p = t.dive.packages[pack];
  const info = d.packs[pack];
  const facts = DIVE_DETAIL[pack];
  const monthsAhead = monthOptions(MONTH_ANCHOR, lang);

  const [enquiry, setEnquiry] = useState<Enquiry>({
    ...EMPTY_ENQUIRY,
    activity: pack === "snorkel" ? "snorkeling" : "diving",
    notes: t.dive.orderNote(p.name),
  });
  const [open, setOpen] = useState(false);
  const patch = (next: Partial<Enquiry>) =>
    setEnquiry((prev) => ({ ...prev, ...next }));

  const message = t.message({
    /* Falls back to the key, the way the dialog does: a word this site never
       wrote is better sent as `motorbike` than as nothing at all. */
    activity: t.activities[enquiry.activity] ?? enquiry.activity,
    name: enquiry.name,
    phone: enquiry.phone,
    email: enquiry.email,
    when: monthsAhead[enquiry.monthIx] ?? monthsAhead[0],
    people: enquiry.people,
    nights: enquiry.nights,
    notes: enquiry.notes,
    withNights: false,
  });

  const ask = () => {
    /* Re-stamped on open rather than only at mount, so switching language
       does not leave an English note on an Indonesian page. */
    patch({ notes: t.dive.orderNote(p.name) });
    setOpen(true);
  };

  /* Whether this page may sell. Keys on the server, and a price the owner has
     actually filled in: a package still waiting for its figure is one to ask
     about, and `priceTurtle` refuses it on the way through anyway. */
  const canBuy = payable && DIVE_PRICE[pack] > 0;
  const [booking, setBooking] = useState(false);
  const router = useRouter();

  /* The same two steps the front page takes: stash what was chosen in this
     tab, then go and look it over. Nothing is priced here. */
  const confirmBooking = (o: BookOrder) => {
    const stashed = saveDraft({
      kind: "dive",
      pack,
      from: o.from,
      to: o.to,
      count: o.count,
      name: o.name,
      phone: o.phone,
      email: o.email,
    });
    if (!stashed) return false;
    router.push("/turtle/checkout");
    return true;
  };

  const stages = facts.stages.map((s) => ({
    label: d.stages[s.key] ?? s.key,
    minutes: s.minutes,
    water: s.water,
  }));

  return (
    <div className="min-h-screen bg-surface-soft text-ink">
      {/* ------------------------------------------------------------ top */}
      <div
        className="relative overflow-hidden bg-ink bg-cover bg-center"
        style={{ backgroundImage: `url("${facts.photo}")` }}
      >
        <div aria-hidden="true" className="absolute inset-0 bg-[#06141a]/76" />

        <div className="relative mx-auto w-full max-w-[1180px] px-5 pt-6 pb-12 md:px-8 md:pt-8 md:pb-16">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Link
              href="/turtle#diving"
              className="inline-flex items-center gap-[8px] text-[13px] text-white/75 no-underline hover:text-white hover:no-underline"
            >
              <span aria-hidden="true">←</span>
              {d.back}
            </Link>

            <div className="flex items-center gap-2">
              <CurrencySwitch
                currency={currency}
                onPick={pickCurrency}
                srLabel={t.currencyLabel}
              />
              <LangSwitch lang={lang} onPick={pickLang} label={t.langLabel} />
            </div>
          </div>

          <div className="mt-10 flex flex-col gap-8 md:mt-14 md:flex-row md:items-end md:justify-between">
            <div className="max-w-[620px]">
              <div className="flex flex-wrap items-center gap-[8px]">
                <span className="rounded-full bg-white/12 px-[11px] py-[5px] text-[11.5px] text-white/80">
                  {p.duration}
                </span>
                <span className="rounded-full bg-white/12 px-[11px] py-[5px] text-[11.5px] text-white/80">
                  {p.level}
                </span>
              </div>
              <h1 className="mt-4 mb-0 text-[clamp(32px,5vw,54px)] leading-[1.05] font-bold tracking-[-.03em] text-white">
                {p.name}
              </h1>
              <p className="mt-4 mb-0 text-[15px] leading-[1.65] text-white/80">
                {info.lede}
              </p>
            </div>

            <div className="shrink-0 rounded-[18px] bg-white/10 px-6 py-5 backdrop-blur-md">
              <Price
                rupiah={DIVE_PRICE[pack]}
                lang={lang}
                currency={currency}
                rates={rates}
                tone="light"
                className="text-white"
              />
              <div className="mt-[2px] text-[12px] text-white/75">{p.unit}</div>
              {/* Booking is the solid button once there is one; asking keeps
                  its place under it as an outline. Somebody who opened a page
                  this long has usually decided, and the panel they decided in
                  is where the button belongs. */}
              {canBuy && (
                <button
                  type="button"
                  onClick={() => setBooking(true)}
                  className="mt-4 flex w-full cursor-pointer items-center justify-center rounded-full border-none bg-white px-6 py-[12px] text-[14px] font-medium text-ink hover:bg-surface-hover"
                >
                  {t.booking.cta}
                </button>
              )}
              <button
                type="button"
                onClick={ask}
                className={`flex w-full cursor-pointer items-center justify-center rounded-full px-6 py-[12px] text-[14px] font-medium ${
                  canBuy
                    ? "mt-[10px] border border-white/35 bg-transparent text-white hover:bg-white/10"
                    : "mt-4 border-none bg-white text-ink hover:bg-surface-hover"
                }`}
              >
                {d.cta}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* --------------------------------------------------------- detail */}
      <div className="mx-auto w-full max-w-[1180px] px-5 py-14 md:px-8 md:py-20">
        {/* The day, and the depth, side by side: they are the two questions
            the price list cannot answer. */}
        {(stages.length > 0 || facts.days) && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.35fr_1fr]">
            <section data-reveal className="rounded-[20px] border border-line-soft bg-surface px-6 py-6">
              <h2 className="m-0 mb-5 text-[17px] font-bold tracking-[-.015em]">
                {facts.days ? d.daysHeading : d.dayHeading}
              </h2>

              {facts.days ? (
                <ol className="m-0 flex list-none flex-col gap-4 p-0">
                  {d.courseDays.map((day) => (
                    <li key={day.title} className="flex gap-4">
                      <span className="mt-[2px] flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full bg-teal-soft text-[12px] font-bold text-teal-deep">
                        {day.title.replace(/\D/g, "")}
                      </span>
                      <span className="text-[13.5px] leading-[1.6] text-slate">
                        <strong className="text-ink">{day.title}.</strong>{" "}
                        {day.body}
                      </span>
                    </li>
                  ))}
                </ol>
              ) : (
                <>
                  <DayStrip
                    stages={stages}
                    waterLabel={d.inWater}
                    restLabel={d.onLand}
                  />
                  <p className="mt-5 mb-0 border-t border-line-fine pt-4 text-[12.5px] leading-[1.55] text-slate">
                    {d.approxNote}
                  </p>
                </>
              )}
            </section>

            <section data-reveal className="rounded-[20px] border border-line-soft bg-surface px-6 py-6">
              <h2 className="m-0 mb-5 text-[17px] font-bold tracking-[-.015em]">
                {d.depthHeading}
              </h2>
              {facts.depth ? (
                <DepthMeter
                  limit={facts.depth}
                  limitLabel={d.limitLabel(facts.depth)}
                  surfaceLabel={d.surface}
                  marks={d.depthMarks}
                />
              ) : (
                <p className="m-0 text-[13.5px] leading-[1.6] text-slate">
                  {d.noDepth}
                </p>
              )}
            </section>
          </div>
        )}

        <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card title={d.includedHeading} items={p.includes} />
          <Card title={d.notIncludedHeading} items={info.notIncluded} />
          <Card title={d.bringHeading} items={info.bring} />
          <Card title={d.forHeading} items={info.forYou} />
        </div>

        <p className="mt-8 rounded-[16px] border border-line-soft bg-surface-mute px-5 py-4 text-[13px] leading-[1.6] text-slate">
          {t.dive.footnote}
        </p>

        <div className="mt-10 flex flex-wrap items-center gap-4">
          {canBuy && (
            <button
              type="button"
              onClick={() => setBooking(true)}
              className="inline-flex cursor-pointer items-center justify-center rounded-full border-none bg-ink px-7 py-[13px] text-[14px] font-medium text-white hover:bg-ink-soft"
            >
              {t.booking.cta}
            </button>
          )}
          <button
            type="button"
            onClick={ask}
            className={`inline-flex cursor-pointer items-center justify-center rounded-full px-7 py-[13px] text-[14px] font-medium ${
              canBuy
                ? "border border-line-strong bg-surface text-ink hover:bg-surface-hover"
                : "border-none bg-ink text-white hover:bg-ink-soft"
            }`}
          >
            {d.cta}
          </button>
          <Link
            href="/turtle#diving"
            className="text-[13.5px] text-slate no-underline hover:text-ink hover:no-underline"
          >
            {d.back}
          </Link>
        </div>
      </div>

      <EnquiryModal
        siteKey="turtle"
        open={open}
        onClose={() => setOpen(false)}
        t={t}
        months={monthsAhead}
        value={enquiry}
        onChange={patch}
        message={message}
        lang={lang}
        activities={TURTLE_ACTIVITIES}
      />

      {booking && (
        <BookModal
          open
          onClose={() => setBooking(false)}
          t={t}
          what={p.name}
          /* Gear leaves with one diver for a stretch of days; everything else
             on this page is sold by the head for one morning. */
          shape={DIVE_PER[pack] === "day" ? "hire" : "dived"}
          unitPrice={DIVE_PRICE[pack]}
          unitLabel={p.unit}
          maxCount={MAX_DIVERS}
          lang={lang}
          currency={currency}
          rates={rates}
          onConfirm={confirmBooking}
        />
      )}
    </div>
  );
}
