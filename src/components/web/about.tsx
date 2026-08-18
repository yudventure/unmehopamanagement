"use client";

import Link from "next/link";
import { useState } from "react";

import {
  EMPTY_ENQUIRY,
  EnquiryModal,
  type Enquiry,
} from "@/components/web/enquiry-modal";
import { Gallery } from "@/components/web/gallery";
import { JourneyMap } from "@/components/web/journey-map";
import { CurrencySwitch, Price } from "@/components/web/price";
import { useReveal } from "@/hooks/use-reveal";
import { useCurrency, useLang, useRates } from "@/hooks/use-site-prefs";
import { DIVE_GALLERY, STAY_GALLERY } from "@/lib/gallery";
import { SITE_CONFIG } from "@/lib/site-config";
import {
  COPY,
  LANGS,
  PROPERTY,
  monthOptions,
  roomFacts,
  type Lang,
  type RoomKey,
} from "@/lib/web-content";

/**
 * The long version of the homestay, on its own page.
 *
 * The home page is written for somebody deciding whether to look further. This
 * one is for somebody who already is: who the family are, what each of the ten
 * rooms actually gives you, what the rate covers, and where the dive centre
 * came from. It ends by handing the reader back to the price list rather than
 * repeating it, because a second copy of six prices is a second copy to keep
 * in step.
 *
 * The two founding years come from `content/site.json` and start empty. While
 * they are, the page says the dive centre came later without naming a year,
 * which is the truth. A guessed founding year is exactly the sort of small
 * invention that survives for years.
 */

const MONTH_ANCHOR = new Date(2026, 7, 1);

const ROOM_PHOTO: Record<RoomKey, string> = {
  standard: "/standard.jpg",
  family: "/family.jpg",
};

export function AboutPage() {
  useReveal();
  const { lang, pickLang } = useLang();
  const { currency, pickCurrency } = useCurrency();
  const rates = useRates();

  const t = COPY[lang];
  const a = t.about;
  const rooms = roomFacts();
  const total = rooms.reduce((n, r) => n + r.count, 0);
  const monthsAhead = monthOptions(MONTH_ANCHOR, lang);
  const { homestay, diveCenter } = SITE_CONFIG.founded;

  const [enquiry, setEnquiry] = useState<Enquiry>(EMPTY_ENQUIRY);
  const [open, setOpen] = useState(false);
  const patch = (next: Partial<Enquiry>) =>
    setEnquiry((prev) => ({ ...prev, ...next }));

  const message = t.message({
    activity: t.activities[enquiry.activity],
    name: enquiry.name,
    phone: enquiry.phone,
    email: enquiry.email,
    when: monthsAhead[enquiry.monthIx] ?? monthsAhead[0],
    people: enquiry.people,
    nights: enquiry.nights,
    notes: enquiry.notes,
    withNights:
      enquiry.activity !== "diving" && enquiry.activity !== "snorkeling",
  });

  return (
    <div className="bg-surface-soft text-ink">
      {/* ------------------------------------------------------------ top */}
      <div
        className="relative overflow-hidden bg-ink bg-cover bg-center"
        style={{ backgroundImage: 'url("/hero.jpg")' }}
      >
        <div aria-hidden="true" className="absolute inset-0 bg-[#06141a]/74" />

        <div className="relative mx-auto w-full max-w-[1180px] px-5 pt-6 pb-14 md:px-8 md:pt-8 md:pb-20">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Link
              href="/turtle"
              className="inline-flex items-center gap-[8px] text-[13px] text-white/75 no-underline hover:text-white hover:no-underline"
            >
              <span aria-hidden="true">←</span>
              {a.back}
            </Link>
            <div className="flex items-center gap-2">
              <CurrencySwitch
                currency={currency}
                onPick={pickCurrency}
                srLabel={t.currencyLabel}
              />
              <div className="flex items-center gap-[2px] rounded-full border border-white/25 p-[2px]">
                {LANGS.map((l) => (
                  <button
                    key={l.key}
                    type="button"
                    lang={l.key}
                    onClick={() => pickLang(l.key as Lang)}
                    aria-label={l.label}
                    aria-pressed={lang === l.key}
                    className={`cursor-pointer rounded-full border-none px-[10px] py-[5px] text-[12px] font-medium ${
                      lang === l.key
                        ? "bg-white text-ink"
                        : "bg-transparent text-white/70 hover:text-white"
                    }`}
                  >
                    {l.short}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-12 max-w-[760px] md:mt-16">
            <div className="flex flex-wrap items-center gap-[8px]">
              <span className="rounded-full bg-white/12 px-[11px] py-[5px] text-[11.5px] text-white/80">
                {PROPERTY.village}, {PROPERTY.island}
              </span>
              {homestay && (
                <span className="rounded-full bg-white/12 px-[11px] py-[5px] text-[11.5px] text-white/80">
                  {a.since(homestay)}
                </span>
              )}
              <span className="rounded-full bg-white/12 px-[11px] py-[5px] text-[11.5px] text-white/80">
                {a.roomsTotal(total)}
              </span>
            </div>
            <h1 className="mt-5 mb-0 text-[clamp(32px,5.4vw,58px)] leading-[1.04] font-bold tracking-[-.03em] whitespace-pre-line text-white">
              {a.title}
            </h1>
            <p className="mt-5 mb-0 text-[15.5px] leading-[1.7] text-white/80">
              {a.lede}
            </p>
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-[1180px] px-5 py-16 md:px-8 md:py-24">
        {/* ------------------------------------------------------- story */}
        <section className="grid grid-cols-1 gap-10 md:grid-cols-[minmax(220px,300px)_1fr]">
          <h2 data-reveal className="m-0 text-[clamp(26px,3.4vw,38px)] leading-[1.1] font-bold tracking-[-.025em]">
            {a.storyHeading}
          </h2>
          <div data-reveal className="flex max-w-[720px] flex-col gap-4">
            {a.story.map((p, i) => (
              <p key={i} className="m-0 text-[15px] leading-[1.75] text-ink-soft">
                {p}
              </p>
            ))}
          </div>
        </section>

        {/* ------------------------------------------------------- rooms */}
        <section className="mt-20 md:mt-28">
          <div data-reveal className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <h2 className="m-0 max-w-[520px] text-[clamp(26px,3.4vw,38px)] leading-[1.1] font-bold tracking-[-.025em]">
              {a.roomsHeading}
            </h2>
            <p className="m-0 max-w-[440px] text-[14px] leading-[1.65] text-slate">
              {a.roomsIntro(total)}
            </p>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2">
            {rooms.map((r, i) => {
              const rc = t.rooms.types[r.key];
              return (
                <article
                  key={r.key}
                  data-reveal
                  style={{ "--i": i } as React.CSSProperties}
                  className="overflow-hidden rounded-[24px] border border-line-soft bg-surface"
                >
                  <div className="relative aspect-[16/10] overflow-hidden bg-surface-tint">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={ROOM_PHOTO[r.key]}
                      alt={rc.alt}
                      loading="lazy"
                      decoding="async"
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                    <span className="absolute top-4 left-4 rounded-full bg-white/92 px-[12px] py-[6px] text-[12px] font-medium">
                      {t.rooms.roomsLabel(r.count)}
                    </span>
                  </div>

                  <div className="flex flex-col px-6 py-6">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <h3 className="m-0 text-[21px] font-bold tracking-[-.015em]">
                        {rc.name}
                      </h3>
                      <div className="text-right">
                        <Price
                          rupiah={r.rate}
                          lang={lang}
                          currency={currency}
                          rates={rates}
                          size="sm"
                        />
                        <div className="text-[11.5px] text-slate">
                          {t.rooms.perNight}
                        </div>
                      </div>
                    </div>

                    <p className="mt-2 mb-0 text-[14px] leading-[1.65] text-slate">
                      {rc.blurb}
                    </p>

                    <ul className="mt-4 mb-0 grid list-none grid-cols-1 gap-x-4 gap-y-[8px] p-0 sm:grid-cols-2">
                      {rc.features.map((f) => (
                        <li
                          key={f}
                          className="flex items-start gap-[9px] text-[13px] text-ink-soft"
                        >
                          <span className="mt-[6px] h-[6px] w-[6px] shrink-0 rounded-full bg-teal" />
                          {f}
                        </li>
                      ))}
                    </ul>

                    <div className="mt-5 border-t border-line-fine pt-4 text-[12.5px] text-slate">
                      {rc.cap}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        {/* ----------------------------------------------------- service */}
        <section className="mt-20 md:mt-28">
          <div data-reveal className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <h2 className="m-0 max-w-[520px] text-[clamp(26px,3.4vw,38px)] leading-[1.1] font-bold tracking-[-.025em]">
              {a.serviceHeading}
            </h2>
            <p className="m-0 max-w-[440px] text-[14px] leading-[1.65] text-slate">
              {a.serviceIntro}
            </p>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {a.services.map((s, i) => (
              <div
                key={i}
                data-reveal
                style={{ "--i": i } as React.CSSProperties}
                className="rounded-[20px] border border-line-soft bg-surface px-6 py-6"
              >
                <h3 className="m-0 text-[15.5px] font-bold tracking-[-.01em]">
                  {s.title}
                </h3>
                <p className="mt-2 mb-0 text-[13.5px] leading-[1.65] text-slate">
                  {s.body}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ----------------------------------------------------- gallery */}
        <section className="mt-20 md:mt-28">
          <div data-reveal className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <h2 className="m-0 max-w-[520px] text-[clamp(26px,3.4vw,38px)] leading-[1.1] font-bold tracking-[-.025em]">
              {a.gallery.stayHeading}
            </h2>
            <p className="m-0 max-w-[440px] text-[14px] leading-[1.65] text-slate">
              {a.gallery.stayIntro}
            </p>
          </div>
          <div data-reveal className="mt-10">
            <Gallery items={STAY_GALLERY} t={t} />
          </div>
        </section>
      </div>

      {/* -------------------------------------------------------- diving */}
      <div
        className="relative overflow-hidden bg-ink bg-cover bg-center py-20 md:py-28"
        style={{ backgroundImage: 'url("/manta.jpg")' }}
      >
        <div aria-hidden="true" className="absolute inset-0 bg-[#06141a]/78" />

        <div className="relative mx-auto w-full max-w-[1180px] px-5 md:px-8">
          <div className="max-w-[760px]">
            <span className="inline-flex items-center gap-[7px] rounded-full border border-white/20 px-[13px] py-[6px] text-[12px] text-white/80">
              <span className="h-[6px] w-[6px] rounded-full bg-amber" />
              {/* Three states, and the third is the honest one until an owner
                  fills the years in. */}
              {diveCenter && homestay
                ? a.diveSince(diveCenter, diveCenter - homestay)
                : diveCenter
                  ? a.since(diveCenter)
                  : a.diveSinceNoYear}
            </span>

            <h2 className="mt-5 mb-0 text-[clamp(28px,4vw,44px)] leading-[1.08] font-bold tracking-[-.028em] text-white">
              {a.diveHeading}
            </h2>

            <div className="mt-5 flex flex-col gap-4">
              {a.diveStory.map((p, i) => (
                <p key={i} className="m-0 text-[15px] leading-[1.75] text-white/80">
                  {p}
                </p>
              ))}
            </div>

            {/* Back to the price list rather than a second copy of it. Six
                prices in two places is six prices to keep in step. */}
            <Link
              href="/turtle#diving"
              className="mt-8 inline-flex items-center gap-[9px] rounded-full bg-white px-6 py-[13px] text-[14px] font-medium text-ink no-underline hover:bg-surface-hover hover:no-underline"
            >
              {a.diveLink}
              <span aria-hidden="true">→</span>
            </Link>
          </div>

          <div className="mt-14 md:mt-20">
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <h3 className="m-0 text-[clamp(22px,2.6vw,30px)] leading-[1.15] font-bold tracking-[-.02em] text-white">
                {a.gallery.diveHeading}
              </h3>
              <p className="m-0 max-w-[420px] text-[13.5px] leading-[1.6] text-white/70">
                {a.gallery.diveIntro}
              </p>
            </div>
            <div className="mt-6">
              <Gallery items={DIVE_GALLERY} t={t} tone="dark" />
            </div>
          </div>
        </div>
      </div>

      {/* --------------------------------------------------------- where */}
      <div className="mx-auto w-full max-w-[1180px] px-5 py-16 md:px-8 md:py-24">
        <section className="grid grid-cols-1 gap-10 md:grid-cols-[minmax(240px,380px)_1fr]">
          <div>
            <h2 className="m-0 text-[clamp(26px,3.4vw,38px)] leading-[1.1] font-bold tracking-[-.025em]">
              {a.whereHeading}
            </h2>
            <JourneyMap t={t} />
          </div>

          <div className="flex flex-col justify-center rounded-[24px] border border-line-soft bg-surface px-8 py-10">
            <h2 className="m-0 text-[clamp(24px,3vw,34px)] leading-[1.1] font-bold tracking-[-.025em]">
              {a.closeHeading}
            </h2>
            <p className="mt-4 mb-0 max-w-[460px] text-[14.5px] leading-[1.7] text-slate">
              {a.closeBody}
            </p>
            <div>
              <button
                type="button"
                onClick={() => setOpen(true)}
                className="mt-7 inline-flex cursor-pointer items-center justify-center rounded-full border-none bg-ink px-7 py-[13px] text-[14px] font-medium text-white hover:bg-ink-soft"
              >
                {a.closeCta}
              </button>
            </div>
          </div>
        </section>
      </div>

      <EnquiryModal
        open={open}
        onClose={() => setOpen(false)}
        t={t}
        months={monthsAhead}
        value={enquiry}
        onChange={patch}
        message={message}
        lang={lang}
      />
    </div>
  );
}
