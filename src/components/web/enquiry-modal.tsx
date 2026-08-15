"use client";

import { useEffect } from "react";

import {
  ACTIVITY_KEYS,
  type ActivityKey,
  type SiteCopy,
  waLink,
} from "@/lib/web-content";

export interface Enquiry {
  name: string;
  /** The guest's own WhatsApp number, so a reply does not need a reply. */
  phone: string;
  email: string;
  activity: ActivityKey;
  /** Index into the month list, so the choice survives a language switch. */
  monthIx: number;
  people: string;
  nights: string;
  notes: string;
}

export const EMPTY_ENQUIRY: Enquiry = {
  name: "",
  phone: "",
  email: "",
  activity: "stay",
  monthIx: 0,
  people: "2",
  nights: "3",
  notes: "",
};

const FIELD =
  "rounded-[10px] border border-line-input bg-surface px-[13px] py-[11px] text-[14px] text-ink outline-none transition-colors focus:border-teal";
const LABEL =
  "flex flex-col gap-[6px] text-[12px] font-medium tracking-[.01em] text-slate";

/**
 * The enquiry, lifted out of the page and into a dialog.
 *
 * On the page it was a whole section a visitor scrolled past on the way to
 * something else; as a dialog it opens from whichever button they pressed,
 * already pointed at the room or the package they pressed it from.
 *
 * White and ink, no cream: the warm surface reads as decoration, and this is
 * the one place on the site where somebody is filling in a form.
 */
export function EnquiryModal({
  open,
  onClose,
  t,
  months,
  value,
  onChange,
  message,
}: {
  open: boolean;
  onClose: () => void;
  t: SiteCopy;
  months: string[];
  value: Enquiry;
  onChange: (patch: Partial<Enquiry>) => void;
  message: string;
}) {
  /* Escape closes it, and the page behind does not scroll while it is up —
     on a phone a scrolling backdrop makes the dialog feel detached. */
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

  const stay = value.activity !== "diving" && value.activity !== "snorkeling";

  return (
    <div
      className="fixed inset-0 z-[70] flex items-start justify-center overflow-auto bg-ink/55 p-4 backdrop-blur-sm sm:items-center sm:p-6"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="enquiry-title"
        onClick={(e) => e.stopPropagation()}
        className="my-auto w-full max-w-[560px] animate-pop-in overflow-hidden rounded-[18px] bg-surface shadow-[0_30px_80px_-30px_rgba(15,30,26,.55)]"
      >
        <div className="flex items-start gap-4 border-b border-line px-6 py-5 sm:px-8">
          <div className="min-w-0 flex-1">
            <h2
              id="enquiry-title"
              className="m-0 text-[20px] leading-[1.2] font-bold tracking-[-.015em] sm:text-[23px]"
            >
              {t.enquiry.modalTitle}
            </h2>
            <p className="mt-[6px] mb-0 text-[13px] leading-[1.55] text-slate">
              {t.enquiry.modalIntro}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t.enquiry.close}
            className="mt-[2px] flex h-[32px] w-[32px] shrink-0 cursor-pointer items-center justify-center rounded-full border border-line-strong bg-surface text-[15px] text-slate transition-colors hover:bg-surface-hover"
          >
            ✕
          </button>
        </div>

        <div>
          <div className="px-6 py-6 sm:px-8">
            <div className="grid grid-cols-1 gap-[14px] sm:grid-cols-2">
              <label className={`${LABEL} sm:col-span-2`}>
                {t.enquiry.name}
                <input
                  value={value.name}
                  onChange={(e) => onChange({ name: e.target.value })}
                  placeholder={t.enquiry.namePlaceholder}
                  className={FIELD}
                />
              </label>

              <label className={LABEL}>
                {t.enquiry.phone}
                <input
                  value={value.phone}
                  onChange={(e) => onChange({ phone: e.target.value })}
                  placeholder={t.enquiry.phonePlaceholder}
                  inputMode="tel"
                  autoComplete="tel"
                  className={FIELD}
                />
              </label>

              <label className={LABEL}>
                {t.enquiry.email}
                <input
                  value={value.email}
                  onChange={(e) => onChange({ email: e.target.value })}
                  placeholder={t.enquiry.emailPlaceholder}
                  inputMode="email"
                  autoComplete="email"
                  className={FIELD}
                />
              </label>

              <div className="text-[11.5px] text-slate-mute sm:col-span-2 sm:-mt-[6px]">
                {t.enquiry.contactNote}
              </div>

              <label className={LABEL}>
                {t.enquiry.what}
                <select
                  value={value.activity}
                  onChange={(e) =>
                    onChange({ activity: e.target.value as ActivityKey })
                  }
                  className={`${FIELD} cursor-pointer`}
                >
                  {ACTIVITY_KEYS.map((a) => (
                    <option key={a} value={a}>
                      {t.activities[a]}
                    </option>
                  ))}
                </select>
              </label>

              <label className={LABEL}>
                {t.enquiry.when}
                <select
                  value={value.monthIx}
                  onChange={(e) => onChange({ monthIx: Number(e.target.value) })}
                  className={`${FIELD} cursor-pointer`}
                >
                  {months.map((m, i) => (
                    <option key={m} value={i}>
                      {m}
                    </option>
                  ))}
                </select>
              </label>

              <div className="grid grid-cols-2 gap-[14px]">
                <label className={LABEL}>
                  {t.enquiry.people}
                  <input
                    value={value.people}
                    onChange={(e) => onChange({ people: e.target.value })}
                    inputMode="numeric"
                    className={FIELD}
                  />
                </label>
                {/* A dive day has no nights to give, so the field goes rather
                    than sitting there asking for something irrelevant. */}
                {stay && (
                  <label className={LABEL}>
                    {t.enquiry.nights}
                    <input
                      value={value.nights}
                      onChange={(e) => onChange({ nights: e.target.value })}
                      inputMode="numeric"
                      className={FIELD}
                    />
                  </label>
                )}
              </div>

              <label className={`${LABEL} sm:col-span-2`}>
                {t.enquiry.notes}
                <textarea
                  value={value.notes}
                  onChange={(e) => onChange({ notes: e.target.value })}
                  rows={3}
                  placeholder={t.enquiry.notesPlaceholder}
                  className={`${FIELD} resize-y`}
                />
              </label>
            </div>

            {/* One action. Until the enquiry has a server to post to, sending
                means handing the finished message to WhatsApp — which is where
                it would end up anyway, and is the one channel that works from
                the island without an account. */}
            <a
              href={waLink(message)}
              target="_blank"
              rel="noreferrer"
              className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-ink px-6 py-[13px] text-[14px] font-medium text-white no-underline transition-colors hover:bg-ink-soft hover:no-underline sm:w-auto sm:min-w-[180px]"
            >
              {t.enquiry.submit}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
