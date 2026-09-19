"use client";

import { useEffect, useState } from "react";

import { Price } from "@/components/web/price";
import type { CurrencyCode, Rates } from "@/lib/currency";
import { MAX_SPAN, shiftDay, spanInRange, todayISO } from "@/lib/days";
import type { SiteCopy } from "@/lib/web-content";

/**
 * The step between pressing a price and paying it.
 *
 * Turtle's rooms and dive packages could be asked about and not bought. The
 * enquiry dialog beside this one is still there and still the right door for
 * somebody with a question; this is the one for somebody who has decided, and
 * the two are kept apart so that neither has to pretend to be the other.
 *
 * ## Three shapes, because three things are being sold
 *
 * - `stay` is a room. Two dates, and the nights are the span between them.
 * - `dived` is a place on the boat. One day, and the number is how many people.
 * - `hire` is the gear, which leaves with one diver for a stretch of days. Two
 *   dates again, and what is counted is days rather than heads.
 *
 * Which one a package is comes from `DIVE_PER` in the content file, not from
 * reading the unit printed beside the price: that line is translated, and a
 * rule that reads words charges Indonesian readers differently.
 *
 * It does not take the payment and it does not price anything. It collects,
 * checks it has enough to be useful, and hands the order up; the summary page
 * prices it again from the same tables, and `/api/pay` prices it a third time
 * before Midtrans is asked for anything. The total shown here is a quote, and
 * it is never what is sent.
 */

/** Everything a Turtle order needs that the page it was opened from does not know. */
export interface BookOrder {
  /** Check-in, the day of the dive, or the day hired gear leaves. */
  from: string;
  /** Check-out or the day gear comes back. Empty for a dive sold per person. */
  to: string;
  /**
   * The number the reader chose, which is a different thing in each shape:
   * guests for a room, divers for a dive, and — for gear, where nobody chooses
   * a number — the days between the two dates, counted here.
   */
  count: number;
  name: string;
  phone: string;
  email: string;
}

/** What is being sold, which decides what has to be asked. */
export type BookShape = "stay" | "dived" | "hire";

/**
 * The two parts of the copy this dialog reads.
 *
 * Narrower than `SiteCopy` for the reason the enquiry dialog's prop is: what
 * is used is what is asked for. The contact labels come from `enquiry` rather
 * than being written a second time here — a name is a name in both, and two
 * copies of one word drift the first time either is reworded.
 */
export type BookCopy = Pick<SiteCopy, "booking" | "enquiry">;

const FIELD =
  "rounded-[10px] border bg-surface px-[13px] py-[11px] text-[14px] text-ink outline-none transition-colors focus:border-teal";
/* A box that was asked for and left empty. Red on the edge and red under it:
   the colour alone would say nothing to a reader who cannot see it. */
const FIELD_BAD = "border-danger";
const FIELD_OK = "border-line-input";
const LABEL =
  "flex min-w-0 flex-col gap-[6px] text-[12px] font-medium tracking-[.01em] text-slate";

export function BookModal({
  open,
  onClose,
  t,
  what,
  shape,
  unitPrice,
  unitLabel,
  maxCount,
  lang,
  currency,
  rates,
  onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  t: BookCopy;
  /** The room type or the package, named as the card named it. */
  what: string;
  shape: BookShape;
  /** Per night, per person or per day. Shown, and never sent. */
  unitPrice: number;
  /** What that price is per, in the reader's own language. */
  unitLabel: string;
  /** How many guests a room sleeps, or how many divers the boat takes. */
  maxCount: number;
  lang: string;
  currency: CurrencyCode;
  rates: Rates | null;
  /** True once the order is stashed, which is when this may close. */
  onConfirm: (order: BookOrder) => boolean;
}) {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [count, setCount] = useState(2);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [failed, setFailed] = useState(false);
  /* Which boxes were asked for and left empty. Named rather than counted, so
     the complaint sits under the box it belongs to instead of in one line at
     the bottom saying something is missing. */
  const [missing, setMissing] = useState<Set<string>>(new Set());

  /* Every field goes through this. A complaint that survives being answered is
     a complaint about the form rather than about the reader. */
  const edit =
    <T,>(key: string, set: (v: T) => void) =>
    (v: T) => {
      setFailed(false);
      setMissing((m) => {
        if (!m.has(key)) return m;
        const next = new Set(m);
        next.delete(key);
        return next;
      });
      set(v);
    };

  /* A fresh open is a fresh order. Leaving the last one's dates up would have
     somebody paying for days they chose for a different room. */
  useEffect(() => {
    if (!open) return;
    setFrom("");
    setTo("");
    setCount(Math.min(2, maxCount));
    setFailed(false);
    setMissing(new Set());
  }, [open, what, maxCount]);

  /* Escape closes it, and the page behind holds still while it is up. */
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  const spans = shape !== "dived";
  /*
   * The span, and what to quote until there is one.
   *
   * Out of range counts as nothing at all rather than as the number of days
   * between the dates, because a check-out sixty nights out would otherwise
   * put a total on screen that this site will never charge: the endpoint
   * refuses anything past thirty. Quoting a price nobody can be charged is
   * worse than quoting none.
   *
   * So an unusable pair falls back to one, the same as a pair nobody has
   * chosen yet, which keeps the total equal to the rate printed above it.
   * Nothing can be ordered until the pair is real, so the fallback is never
   * what anybody pays.
   */
  const span = spans ? spanInRange(from, to) : 0;
  const multiplier = spans ? span || 1 : count;

  const submit = () => {
    /* A set of gaps rather than the first one, so somebody who left three
       boxes empty is told about three boxes. */
    const gaps = new Set<string>();
    if (!from) gaps.add("from");
    /* Not merely filled in: a check-out on or before the check-in is not a
       stay, and one past thirty nights is a stay the endpoint would refuse.
       Both land as zero above, so one test covers them. */
    if (spans && !span) gaps.add("to");
    if (!name.trim()) gaps.add("name");
    if (!phone.trim()) gaps.add("phone");
    if (!email.trim()) gaps.add("email");
    if (gaps.size) {
      setMissing(gaps);
      return;
    }
    const done = onConfirm({
      from,
      to: spans ? to : "",
      /* A hire is the one shape with no number on it: what varies is the days,
         and those are the span. A stay has both — its nights are the span too,
         but what it was asked is how many guests, and that is what goes up. */
      count: shape === "hire" ? span : count,
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim(),
    });
    if (done) onClose();
    else setFailed(true);
  };

  /** A box's red edge when it is empty, and the word under it. */
  const mark = (key: string) => (missing.has(key) ? FIELD_BAD : FIELD_OK);
  const note = (key: string) =>
    missing.has(key) ? (
      <span className="text-[11.5px] font-normal text-danger">{t.booking.required}</span>
    ) : null;

  const b = t.booking;
  const firstLabel = shape === "stay" ? b.checkIn : shape === "hire" ? b.fromDay : b.day;

  return (
    <div
      onClick={onClose}
      /* `justify-center` is what puts it in the middle of the screen. The
         vertical middle is `my-auto` on the box rather than `items-center`
         here, because a box taller than the window has to stay scrollable
         from its top; centring it would push its head off screen. */
      className="fixed inset-0 z-[120] flex justify-center overflow-y-auto bg-[rgba(24,31,24,.55)] p-4 backdrop-blur-[2px] sm:p-6"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="book-title"
        onClick={(e) => e.stopPropagation()}
        className="my-auto w-full max-w-[460px] overflow-hidden rounded-[18px] bg-surface shadow-[0_30px_80px_-30px_rgba(20,28,20,.55)]"
      >
        <div className="flex items-start gap-4 border-b border-line px-6 py-5">
          <div className="min-w-0 flex-1">
            <h2
              id="book-title"
              className="m-0 text-[20px] leading-[1.2] font-bold tracking-[-.015em]"
            >
              {b.title}
            </h2>
            <p className="mt-[6px] mb-0 text-[13px] leading-[1.55] text-slate">{b.intro}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={b.close}
            className="mt-[2px] flex h-[32px] w-[32px] shrink-0 cursor-pointer items-center justify-center rounded-full border border-line-strong bg-surface text-[15px] text-slate transition-colors hover:bg-surface-hover"
          >
            ✕
          </button>
        </div>

        <div className="px-6 py-6">
          {/* What is being bought, said once and not editable here. Changing
              it means closing this and pressing a different card, which is the
              only way it stays the thing the server prices. */}
          <div className="rounded-[12px] bg-teal-tint px-[14px] py-[11px]">
            <div className="font-mono text-[10.5px] tracking-[.1em] text-teal-deep uppercase">
              {b.what}
            </div>
            <div className="mt-[4px] text-[14.5px] leading-[1.35] font-bold text-ink">{what}</div>
          </div>

          <div className="mt-[14px] grid grid-cols-1 gap-[14px] sm:grid-cols-2">
            <label className={LABEL}>
              {firstLabel}
              <input
                type="date"
                value={from}
                min={todayISO()}
                onChange={(e) => edit("from", setFrom)(e.target.value)}
                className={`${FIELD} ${mark("from")}`}
              />
              {note("from")}
            </label>

            {spans ? (
              <>
                <label className={LABEL}>
                  {shape === "stay" ? b.checkOut : b.untilDay}
                  <input
                    type="date"
                    value={to}
                    /* A stay is at least one night and a hire at least one
                       day, so the earliest second date is the day after the
                       first — and the latest is what the endpoint will take. */
                    min={from ? shiftDay(from, 1) : todayISO()}
                    max={from ? shiftDay(from, MAX_SPAN) : undefined}
                    onChange={(e) => edit("to", setTo)(e.target.value)}
                    className={`${FIELD} ${mark("to")}`}
                  />
                  {note("to")}
                </label>
                <div className={`${LABEL} flex-row items-baseline justify-between sm:col-span-2`}>
                  <span>{shape === "stay" ? b.nights : b.days}</span>
                  <span className="text-[13.5px] font-semibold text-ink">
                    {shape === "stay"
                      ? b.nightsValue(span || 1)
                      : b.daysValue(span || 1)}
                  </span>
                </div>
              </>
            ) : (
              <label className={LABEL}>
                {b.divers}
                <select
                  value={count}
                  onChange={(e) => edit("count", setCount)(Number(e.target.value))}
                  className={`${FIELD} ${FIELD_OK} cursor-pointer`}
                >
                  {Array.from({ length: maxCount }, (_, i) => i + 1).map((n) => (
                    <option key={n} value={n}>
                      {b.diversValue(n)}
                    </option>
                  ))}
                </select>
              </label>
            )}

            {/* Guests, for a room. Not a price — the rate is per room — but the
                family has to know how many beds to make, and the list stops
                where the room does rather than offering a number that would
                have to be turned down after the money moved. */}
            {shape === "stay" && (
              <label className={`${LABEL} sm:col-span-2`}>
                {b.guests}
                <select
                  value={count}
                  onChange={(e) => edit("count", setCount)(Number(e.target.value))}
                  className={`${FIELD} ${FIELD_OK} cursor-pointer`}
                >
                  {Array.from({ length: maxCount }, (_, i) => i + 1).map((n) => (
                    <option key={n} value={n}>
                      {b.guestsValue(n)}
                    </option>
                  ))}
                </select>
              </label>
            )}

            <label className={`${LABEL} sm:col-span-2`}>
              {t.enquiry.name}
              <input
                value={name}
                onChange={(e) => edit("name", setName)(e.target.value)}
                placeholder={t.enquiry.namePlaceholder}
                autoComplete="name"
                className={`${FIELD} ${mark("name")}`}
              />
              {note("name")}
            </label>
            {/* Both, never either. The family answers on the number and keys
                the booking by the address afterwards; a form that accepts one
                of the two guarantees neither. */}
            <label className={LABEL}>
              {t.enquiry.phone}
              <input
                value={phone}
                onChange={(e) => edit("phone", setPhone)(e.target.value)}
                placeholder={t.enquiry.phonePlaceholder}
                inputMode="tel"
                autoComplete="tel"
                className={`${FIELD} ${mark("phone")}`}
              />
              {note("phone")}
            </label>
            <label className={LABEL}>
              {t.enquiry.email}
              <input
                value={email}
                onChange={(e) => edit("email", setEmail)(e.target.value)}
                placeholder={t.enquiry.emailPlaceholder}
                inputMode="email"
                autoComplete="email"
                className={`${FIELD} ${mark("email")}`}
              />
              {note("email")}
            </label>
          </div>

          <div className="mt-5 flex items-baseline justify-between gap-3 border-t border-line pt-4">
            <span className="text-[13px] text-slate">
              {b.total}
              <span className="ml-[6px] text-slate-soft">
                {unitLabel} × {multiplier}
              </span>
            </span>
            <Price
              rupiah={unitPrice * multiplier}
              lang={lang}
              currency={currency}
              rates={rates}
              className="text-right"
            />
          </div>

          {failed && (
            <p className="mt-4 mb-0 rounded-[10px] bg-danger-tint px-[13px] py-[10px] text-[12.5px] leading-[1.5] text-danger-deep">
              {b.failed}
            </p>
          )}

          <button
            type="button"
            onClick={submit}
            className="mt-5 inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-full border-none bg-ink px-[22px] py-[13px] text-[14px] font-medium text-white transition-colors hover:bg-ink-soft"
          >
            {b.next}
          </button>
          <p className="mt-3 mb-0 text-[11.5px] leading-[1.55] text-slate-soft">{b.hold}</p>
        </div>
      </div>
    </div>
  );
}
