"use client";

import { useEffect, useState } from "react";

import { Price } from "@/components/web/price";
import type { CurrencyCode, Rates } from "@/lib/currency";

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
 * It does not take the payment itself. It collects, checks it has enough to be
 * useful, and hands the order up; the page owns the call to `/api/pay` because
 * the page already owns the room's. And it never sends a price — the server
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
  contact: string;
  total: string;
  pay: string;
  /** Shown when a name or a way to answer is missing, and when it fails. */
  need: string;
  failed: string;
  close: string;
}

export interface CheckoutOrder {
  qty: number;
  /** Empty for a thing with no day to it, like a shirt. */
  when: string;
  name: string;
  contact: string;
}

const FIELD =
  "rounded-[10px] border border-line-input bg-surface px-[13px] py-[11px] text-[14px] text-ink outline-none transition-colors focus:border-eddo";
const LABEL = "flex min-w-0 flex-col gap-[6px] text-[12px] font-medium tracking-[.01em] text-slate";

export function CheckoutModal({
  open,
  onClose,
  t,
  what,
  price,
  /** False for a thing with no day to it, which is what `piece` means. */
  needsDay,
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
  needsDay: boolean;
  lang: string;
  currency: CurrencyCode;
  rates: Rates | null;
  onPay: (order: CheckoutOrder) => Promise<boolean>;
}) {
  const [qty, setQty] = useState(1);
  const [when, setWhen] = useState("");
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [status, setStatus] = useState<"idle" | "paying" | "need" | "failed">("idle");
  /* Every field goes through this. A complaint that survives being answered
     is a complaint about the form rather than about the reader. */
  const edit = <T,>(set: (v: T) => void) => (v: T) => {
    setStatus((s) => (s === "need" || s === "failed" ? "idle" : s));
    set(v);
  };

  /* A fresh open is a fresh order. Leaving the last one's quantity and
     complaint up would price the next thing somebody opened at four of it. */
  useEffect(() => {
    if (!open) return;
    setQty(1);
    setWhen("");
    setStatus("idle");
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

  if (!open) return null;

  const submit = async () => {
    /* A name and one way to reach them. Without both, a paid order is money
       the family cannot match to a person, which is worse than no order. */
    if (!name.trim() || !contact.trim() || (needsDay && !when)) {
      setStatus("need");
      return;
    }
    setStatus("paying");
    const done = await onPay({ qty, when, name: name.trim(), contact: contact.trim() });
    setStatus(done ? "idle" : "failed");
    if (done) onClose();
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[120] flex overflow-y-auto bg-[rgba(12,26,24,.55)] p-4 backdrop-blur-[2px] sm:p-6"
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

          <div className="mt-[14px] grid grid-cols-1 gap-[14px] sm:grid-cols-2">
            {needsDay && (
              <label className={LABEL}>
                {t.when}
                <input
                  type="date"
                  value={when}
                  min={new Date().toISOString().slice(0, 10)}
                  onChange={(e) => edit(setWhen)(e.target.value)}
                  className={FIELD}
                />
              </label>
            )}
            <label className={LABEL}>
              {t.qty}
              <select
                value={qty}
                onChange={(e) => edit(setQty)(Number(e.target.value))}
                className={`${FIELD} cursor-pointer`}
              >
                {Array.from({ length: 14 }, (_, i) => i + 1).map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </label>
            <label className={`${LABEL} sm:col-span-2`}>
              {t.name}
              <input value={name} onChange={(e) => edit(setName)(e.target.value)} className={FIELD} />
            </label>
            <label className={`${LABEL} sm:col-span-2`}>
              {t.contact}
              <input value={contact} onChange={(e) => edit(setContact)(e.target.value)} className={FIELD} />
            </label>
          </div>

          <div className="mt-5 flex items-baseline justify-between gap-3 border-t border-line pt-4">
            <span className="text-[13px] text-slate">{t.total}</span>
            <Price
              rupiah={price * qty}
              lang={lang}
              currency={currency}
              rates={rates}
              className="text-right text-eddo-ink"
            />
          </div>
          {(status === "need" || status === "failed") && (
            <p className="mt-4 mb-0 rounded-[10px] bg-amber-soft px-[13px] py-[10px] text-[12.5px] leading-[1.5] text-amber-deep">
              {status === "need" ? t.need : t.failed}
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
