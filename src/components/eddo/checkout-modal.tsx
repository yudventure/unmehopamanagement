"use client";

import { useEffect, useState } from "react";

import { Price } from "@/components/web/price";
import type { CurrencyCode, Rates } from "@/lib/currency";
import { MAX_SPAN, shiftDay, spanInRange, todayISO } from "@/lib/days";

/**
 * The step between pressing a price and paying it.
 *
 * The card used to carry a date and a quantity itself and send you straight to
 * Midtrans from there, which had two things wrong with it. The small one is
 * that two form fields inside a two-hundred-pixel card is a cramped place to
 * fill anything in. The large one is that it never asked who you were: the
 * order went out with the product's own name in the customer field and the
 * homestay's WhatsApp number as the customer's, so the family received a
 * payment they could not attach to a guest and the guest received a receipt
 * addressed to a T-shirt.
 *
 * So the card now only shows and offers, and everything an order needs is
 * asked for here: the day, how many, a name, and a way to answer.
 *
 * ## Three shapes, because three things are being sold
 *
 * One form asking "which day" and "how many" fitted none of them properly.
 *
 * - `piece` is a shirt. No day, and the number is how many shirts.
 * - `dated` is a dive or a crossing. One day, and the number is how many
 *   people or how many trips.
 * - `rental` is a motorbike, a car or a camera. One object leaves with one
 *   guest for a stretch of days, so the number that varies is the days and
 *   "how many" was quietly asking how many motorbikes, which nobody was
 *   buying. It asks for two dates instead and counts.
 *
 * On top of that, two things are asked only where they exist: which way a
 * crossing goes, and which size a shirt is.
 *
 * It does not take the payment itself. It collects, checks it has enough to be
 * useful, and hands the order up; the page owns the call to `/api/pay` because
 * the page already owns the room's. And it never sends a price: the server
 * looks that up from the same file the card was drawn from.
 */
export interface CheckoutCopy {
  title: string;
  intro: string;
  /** What is being bought, named by the section it came from. */
  what: string;
  when: string;
  qty: string;
  name: string;
  /* Two fields, never one. "WhatsApp or email" collects one of the two, and
     the family needs both: one to answer on and one to key the booking by
     later. A box that accepts either is a box that guarantees neither. */
  phone: string;
  phonePlaceholder: string;
  email: string;
  emailPlaceholder: string;
  total: string;
  pay: string;
  /** Under whichever box has been left empty, and when the payment fails. */
  required: string;
  failed: string;
  close: string;
  /** A crossing that can be bought both ways. */
  way: string;
  oneWay: string;
  roundTrip: string;
  goDay: string;
  backDay: string;
  /** Something hired by the day. */
  fromDay: string;
  untilDay: string;
  days: string;
  daysValue: (n: number) => string;
  /** Something that comes in sizes. */
  size: string;
  sizeNote: string;
  left: (n: number) => string;
  soldOut: string;
}

/** What is being sold, which decides what has to be asked. */
export type CheckoutShape = "piece" | "dated" | "rental";

export interface CheckoutSize {
  label: string;
  /** Absent means nobody has counted. Zero means counted and gone. */
  stock?: number;
}

export interface CheckoutOrder {
  /** Pieces, people or trips, and the number of days for a hire. */
  qty: number;
  /** The day, or the day a hire starts. Empty for a thing with no day to it. */
  when: string;
  /** The second date: when a hire ends, or when a journey comes back. */
  until: string;
  /** The size chosen, when the thing comes in sizes. */
  size: string;
  way: "one" | "return";
  name: string;
  phone: string;
  email: string;
}

const FIELD =
  "rounded-[10px] border bg-surface px-[13px] py-[11px] text-[14px] text-ink outline-none transition-colors focus:border-eddo";
/* A box that has been asked for and left empty. Red on the edge and red under
   it: the colour alone would say nothing to a reader who cannot see it. */
const FIELD_BAD = "border-danger";
const FIELD_OK = "border-line-input";
const LABEL = "flex min-w-0 flex-col gap-[6px] text-[12px] font-medium tracking-[.01em] text-slate";
/* The one-of-several buttons, for a size and for which way a boat goes. Real
   buttons with `aria-pressed` rather than styled radios, because what they look
   like and what they announce then come from the same place. */
const CHIP =
  "cursor-pointer rounded-[10px] border bg-surface px-[14px] py-[9px] text-[13px] leading-tight transition-colors";
const CHIP_ON = "border-eddo bg-eddo-wash font-semibold text-eddo-deep";
const CHIP_OFF = "border-line-input text-ink hover:border-eddo";
/* Its own state rather than `CHIP_OFF` with a red border tacked on the end.
   Two border classes on one element are decided by which comes later in the
   stylesheet, not by which comes later in the attribute, so the tacked-on one
   quietly lost and the row was never marked. */
const CHIP_BAD = "border-danger text-ink hover:border-eddo";
const CHIP_DEAD = "cursor-not-allowed border-line-input text-slate-mute line-through opacity-60";

export function CheckoutModal({
  open,
  onClose,
  t,
  what,
  price,
  returnPrice,
  shape,
  sizes,
  lang,
  currency,
  rates,
  onPay,
}: {
  open: boolean;
  onClose: () => void;
  t: CheckoutCopy;
  what: string;
  price: number;
  /** Present when the same journey is also sold as a return. */
  returnPrice?: number;
  shape: CheckoutShape;
  sizes?: CheckoutSize[];
  lang: string;
  currency: CurrencyCode;
  rates: Rates | null;
  onPay: (order: CheckoutOrder) => Promise<boolean>;
}) {
  const [qty, setQty] = useState(1);
  const [when, setWhen] = useState("");
  const [until, setUntil] = useState("");
  const [size, setSize] = useState("");
  const [way, setWay] = useState<"one" | "return">("one");
  const [status, setStatus] = useState<"idle" | "paying" | "failed">("idle");
  /* Which boxes were asked for and left empty. Named rather than counted, so
     the page can put the complaint under the box it belongs to instead of one
     line at the bottom saying something is missing. */
  const [missing, setMissing] = useState<Set<string>>(new Set());
  /* Every field goes through this. A complaint that survives being answered
     is a complaint about the form rather than about the reader. */
  const edit = <T,>(key: string, set: (v: T) => void) => (v: T) => {
    setStatus((s) => (s === "failed" ? "idle" : s));
    setMissing((m) => {
      if (!m.has(key)) return m;
      const next = new Set(m);
      next.delete(key);
      return next;
    });
    set(v);
  };

  /* A fresh open is a fresh order. Leaving the last one's quantity and
     complaint up would price the next thing somebody opened at four of it. */
  useEffect(() => {
    if (!open) return;
    setQty(1);
    setWhen("");
    setUntil("");
    setSize("");
    setWay("one");
    setStatus("idle");
    setMissing(new Set());
  }, [open, what]);

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

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  if (!open) return null;

  const rental = shape === "rental";
  const offersReturn = typeof returnPrice === "number" && returnPrice > 0;
  const pickSize = Boolean(sizes?.length);

  /* Days for a hire, and it is a span rather than a count: a hire from the 10th
     to the 13th is three days on the road, which is also how the nights of a
     stay are counted one file over. Out of range counts as none, so an
     impossible span never quietly prices itself. */
  const days = rental ? spanInRange(when, until) : 0;
  /* What the total is multiplied by. A hire that has not been given its dates
     yet shows one day rather than nothing, for the same reason the room panel
     opens on one night: a price of zero reads as free. */
  const count = rental ? days || 1 : qty;
  const unitPrice = way === "return" && offersReturn ? (returnPrice as number) : price;

  const submit = async () => {
    /* A name, a number and an address, all three. Without them a paid order is
       money the family cannot match to a person, which is worse than no order.
       Collected as a set so each empty box can be marked where it stands. */
    const gaps = new Set<string>();
    if (rental) {
      if (!when) gaps.add("when");
      /* The second date is the one marked when the span itself is wrong, since
         that is the one the reader would change. */
      if (!until || !days) gaps.add("until");
    } else if (shape === "dated") {
      if (!when) gaps.add("when");
      /* A return that was chosen but never dated is a boat nobody knows to
         send. Same rule a flight search enforces: pick round trip and the
         second date stops being optional. */
      if (way === "return" && (!until || until < when)) gaps.add("until");
    }
    if (pickSize && !size) gaps.add("size");
    if (!name.trim()) gaps.add("name");
    if (!phone.trim()) gaps.add("phone");
    if (!email.trim()) gaps.add("email");
    if (gaps.size) {
      setMissing(gaps);
      return;
    }
    setStatus("paying");
    const done = await onPay({
      qty: count,
      when,
      until: rental || way === "return" ? until : "",
      size,
      way: offersReturn ? way : "one",
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim(),
    });
    setStatus(done ? "idle" : "failed");
    if (done) onClose();
  };

  /** A box, its red edge when it is empty, and the word under it. */
  const mark = (key: string) => (missing.has(key) ? FIELD_BAD : FIELD_OK);
  const note = (key: string) =>
    missing.has(key) ? (
      <span className="text-[11.5px] font-normal text-danger">{t.required}</span>
    ) : null;

  return (
    <div
      onClick={onClose}
      /* `justify-center` is what puts it in the middle of the screen, and
         leaving it off is what had it sitting against the left padding edge.
         The vertical middle is `my-auto` on the box rather than `items-center`
         here, because a box taller than the window has to stay scrollable from
         its top; centring it on the cross axis would push its head off screen
         where nothing can reach it. */
      className="fixed inset-0 z-[120] flex justify-center overflow-y-auto bg-[rgba(12,26,24,.55)] p-4 backdrop-blur-[2px] sm:p-6"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="checkout-title"
        onClick={(e) => e.stopPropagation()}
        className="my-auto w-full max-w-[460px] animate-pop-in overflow-hidden rounded-[18px] bg-surface shadow-[0_30px_80px_-30px_rgba(15,30,26,.55)]"
      >
        <div className="flex items-start gap-4 border-b border-line px-6 py-5">
          <div className="min-w-0 flex-1">
            <h2 id="checkout-title" className="m-0 text-[20px] leading-[1.2] font-bold tracking-[-.015em]">
              {t.title}
            </h2>
            <p className="mt-[6px] mb-0 text-[13px] leading-[1.55] text-slate">{t.intro}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t.close}
            className="mt-[2px] flex h-[32px] w-[32px] shrink-0 cursor-pointer items-center justify-center rounded-full border border-line-strong bg-surface text-[15px] text-slate transition-colors hover:bg-surface-hover"
          >
            ✕
          </button>
        </div>

        <div className="px-6 py-6">
          {/* What is being bought, said once and not editable here. Changing
              it means closing this and pressing a different card, which is
              the only way it can stay the thing the server prices. */}
          <div className="rounded-[12px] bg-eddo-wash px-[14px] py-[11px]">
            <div className="font-mono text-[10.5px] tracking-[.1em] text-eddo-deep uppercase">{t.what}</div>
            <div className="mt-[4px] text-[14.5px] leading-[1.35] font-bold text-eddo-ink">{what}</div>
          </div>

          {/* Which way the boat goes. Both prices are on the buttons, because
              the question is really "is the return worth it" and answering it
              should not need the total to be watched while they are pressed. */}
          {offersReturn && (
            <div className="mt-[14px]">
              <div className={`${LABEL} gap-[6px]`}>{t.way}</div>
              <div className="mt-[6px] grid grid-cols-2 gap-[10px]">
                {([
                  { key: "one" as const, label: t.oneWay, amount: price },
                  { key: "return" as const, label: t.roundTrip, amount: returnPrice as number },
                ]).map((o) => (
                  <button
                    key={o.key}
                    type="button"
                    aria-pressed={way === o.key}
                    onClick={() => {
                      edit("way", setWay)(o.key);
                      /* Going back to one way drops the return date rather
                         than keeping it out of sight. A date that is not on
                         screen is a date nobody agreed to, and it would ride
                         along to the family as a boat to send. */
                      if (o.key === "one") edit("until", setUntil)("");
                    }}
                    className={`${CHIP} ${way === o.key ? CHIP_ON : CHIP_OFF} text-left`}
                  >
                    {o.label}
                    <Price
                      rupiah={o.amount}
                      lang={lang}
                      currency={currency}
                      rates={rates}
                      size="sm"
                      className="mt-[3px] block font-normal text-slate"
                    />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* The size, with the warning nobody local expects. Sizes that are
              counted and gone stay on show, struck through: a shirt that is
              missing from the row reads as a shirt that was never made. */}
          {pickSize && (
            <div className="mt-[14px]">
              <div className={`${LABEL} gap-[6px]`}>
                {t.size}
                {note("size")}
              </div>
              <div className="mt-[6px] flex flex-wrap gap-[8px]">
                {sizes?.map((s) => {
                  const gone = s.stock === 0;
                  return (
                    <button
                      key={s.label}
                      type="button"
                      disabled={gone}
                      aria-pressed={size === s.label}
                      onClick={() => edit("size", setSize)(s.label)}
                      className={`${CHIP} ${
                        gone
                          ? CHIP_DEAD
                          : size === s.label
                            ? CHIP_ON
                            : missing.has("size")
                              ? CHIP_BAD
                              : CHIP_OFF
                      }`}
                    >
                      {s.label}
                      {typeof s.stock === "number" && (
                        <span className="mt-[2px] block text-[11px] font-normal text-slate-mute no-underline">
                          {gone ? t.soldOut : t.left(s.stock)}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
              <p className="mt-[8px] mb-0 text-[11.5px] leading-[1.5] text-slate-mute">{t.sizeNote}</p>
            </div>
          )}

          <div className="mt-[14px] grid grid-cols-1 gap-[14px] sm:grid-cols-2">
            {/* A hire asks when it starts and when it comes back, and counts
                the days itself. Everything else with a day to it asks for the
                one day and how many. */}
            {rental ? (
              <>
                <label className={LABEL}>
                  {t.fromDay}
                  <input
                    type="date"
                    value={when}
                    min={todayISO()}
                    onChange={(e) => edit("when", setWhen)(e.target.value)}
                    className={`${FIELD} ${mark("when")}`}
                  />
                  {note("when")}
                </label>
                <label className={LABEL}>
                  {t.untilDay}
                  <input
                    type="date"
                    value={until}
                    min={when ? shiftDay(when, 1) : todayISO()}
                    max={when ? shiftDay(when, MAX_SPAN) : undefined}
                    onChange={(e) => edit("until", setUntil)(e.target.value)}
                    className={`${FIELD} ${mark("until")}`}
                  />
                  {note("until")}
                </label>
                <div className={`${LABEL} sm:col-span-2 flex-row items-baseline justify-between`}>
                  <span>{t.days}</span>
                  <span className="text-[13.5px] font-semibold text-eddo-ink">
                    {t.daysValue(days || 1)}
                  </span>
                </div>
              </>
            ) : (
              <>
                {shape === "dated" && (
                  <label className={LABEL}>
                    {/* Named as the outward leg once there is an inward one to
                        tell it from, the way a flight search does. */}
                    {offersReturn ? t.goDay : t.when}
                    <input
                      type="date"
                      value={when}
                      min={todayISO()}
                      onChange={(e) => edit("when", setWhen)(e.target.value)}
                      className={`${FIELD} ${mark("when")}`}
                    />
                    {note("when")}
                  </label>
                )}
                {/* The return date, which exists only once a return has been
                    chosen. Every flight search does this: the field is not
                    there for a one way, and choosing a return is what puts it
                    there.

                    Unlike those, nothing is prefilled. An airline prefills
                    because its first screen is a search and a wrong guess
                    costs a second look; this is the checkout, and a date
                    filled in by the page is a date somebody pays for without
                    having chosen it.

                    `min` is the outward day itself rather than the day after,
                    because a crossing is not a stay: leaving in the morning
                    and coming back that afternoon is an ordinary day out. */}
                {shape === "dated" && way === "return" && (
                  <label className={LABEL}>
                    {t.backDay}
                    <input
                      type="date"
                      value={until}
                      min={when || todayISO()}
                      max={when ? shiftDay(when, MAX_SPAN) : undefined}
                      onChange={(e) => edit("until", setUntil)(e.target.value)}
                      className={`${FIELD} ${mark("until")}`}
                    />
                    {note("until")}
                  </label>
                )}
                {/* Beside the day when that leaves the row full, across the
                    row when it would not. A return puts two dates on the line
                    above, so the count would otherwise sit in half a row with
                    the other half blank, which reads as something that failed
                    to appear rather than as something that is not there. */}
                <label
                  className={`${LABEL} ${
                    shape === "dated" && way !== "return" ? "" : "sm:col-span-2"
                  }`}
                >
                  {t.qty}
                  <select
                    value={qty}
                    onChange={(e) => edit("qty", setQty)(Number(e.target.value))}
                    className={`${FIELD} ${FIELD_OK} cursor-pointer`}
                  >
                    {Array.from({ length: 14 }, (_, i) => i + 1).map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                </label>
              </>
            )}
            <label className={`${LABEL} sm:col-span-2`}>
              {t.name}
              <input
                value={name}
                onChange={(e) => edit("name", setName)(e.target.value)}
                className={`${FIELD} ${mark("name")}`}
              />
              {note("name")}
            </label>
            <label className={LABEL}>
              {t.phone}
              <input
                value={phone}
                onChange={(e) => edit("phone", setPhone)(e.target.value)}
                placeholder={t.phonePlaceholder}
                inputMode="tel"
                autoComplete="tel"
                className={`${FIELD} ${mark("phone")}`}
              />
              {note("phone")}
            </label>
            <label className={LABEL}>
              {t.email}
              <input
                value={email}
                onChange={(e) => edit("email", setEmail)(e.target.value)}
                placeholder={t.emailPlaceholder}
                inputMode="email"
                autoComplete="email"
                className={`${FIELD} ${mark("email")}`}
              />
              {note("email")}
            </label>
          </div>

          <div className="mt-5 flex items-baseline justify-between gap-3 border-t border-line pt-4">
            <span className="text-[13px] text-slate">{t.total}</span>
            <Price
              rupiah={unitPrice * count}
              lang={lang}
              currency={currency}
              rates={rates}
              className="text-right text-eddo-ink"
            />
          </div>
          {status === "failed" && (
            <p className="mt-4 mb-0 rounded-[10px] bg-danger-tint px-[13px] py-[10px] text-[12.5px] leading-[1.5] text-danger-deep">
              {t.failed}
            </p>
          )}

          <button
            type="button"
            onClick={submit}
            disabled={status === "paying"}
            className="mt-5 inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-full border-none bg-eddo-deep px-[22px] py-[13px] text-[14px] font-medium text-white transition-colors hover:bg-eddo-dark disabled:cursor-wait disabled:opacity-70"
          >
            {t.pay}
          </button>
        </div>
      </div>
    </div>
  );
}
