"use client";

import { useRef, useState } from "react";

import { useDismiss } from "@/hooks/use-dismiss";
import { LANGS, type Lang } from "@/lib/web-content";

/**
 * The language picker, in one place for the four headers that carry it.
 *
 * ## Why it is a dropdown now
 *
 * It used to be a row of pills, and the comment above it said a dropdown would
 * hide the fact that the other language exists — which is a fair argument
 * about two languages and a bad one about seven. Seven pills do not fit on a
 * phone, and a row that wraps to two lines over a photograph is worse at
 * saying "there are others" than a control that names the one you are reading
 * and opens onto the rest.
 *
 * ## Why each language is named in itself
 *
 * `Français`, `日本語`, `Русский`. Somebody hunting for their own language is
 * looking for the shape of their own word, and a reader who needs the Japanese
 * page cannot be expected to first find the English word "Japanese". The
 * two-letter code stays beside it, in the same fixed-width column, because
 * that is what the closed button shows and the two should be recognisably the
 * same thing.
 *
 * ## Why it was written four times before
 *
 * The header, the package page, the profile page and the holding page each had
 * their own copy of the pill row. Four copies of one control is four places to
 * fix when the list grows, which is exactly what just happened.
 */
export function LangSwitch({
  lang,
  onPick,
  label,
  align = "right",
}: {
  lang: Lang;
  onPick: (next: Lang) => void;
  /** Said out loud by a screen reader; the button itself shows two letters. */
  label: string;
  /** Which edge the panel hangs from, so it cannot fall off a phone. */
  align?: "left" | "right";
}) {
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  useDismiss([box], () => setOpen(false), open);

  const current = LANGS.find((l) => l.key === lang) ?? LANGS[0];

  return (
    <div ref={box} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={`${label}: ${current.label}`}
        aria-expanded={open}
        aria-haspopup="listbox"
        className="flex cursor-pointer items-center gap-[6px] rounded-full border border-white/30 bg-transparent px-[11px] py-[6px] text-[12px] font-medium text-white/85 transition-colors hover:text-white"
      >
        <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
          <circle cx="12" cy="12" r="9" />
          <path d="M3 12h18M12 3c2.5 2.6 2.5 15.4 0 18M12 3c-2.5 2.6-2.5 15.4 0 18" />
        </svg>
        {current.short}
        <svg
          viewBox="0 0 24 24"
          width="12"
          height="12"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div
          role="listbox"
          aria-label={label}
          /* Its own solid ground. The bar above is transparent over a
             photograph, and a list of seven things to read is not something to
             put over moving water. */
          className={`absolute top-[calc(100%+8px)] z-50 min-w-[178px] overflow-hidden rounded-[14px] border border-line bg-surface py-[5px] shadow-[0_22px_50px_-20px_rgba(20,28,20,.45)] ${
            align === "right" ? "right-0" : "left-0"
          }`}
        >
          {LANGS.map((l) => (
            <button
              key={l.key}
              type="button"
              role="option"
              lang={l.key}
              aria-selected={lang === l.key}
              onClick={() => {
                onPick(l.key);
                setOpen(false);
              }}
              className={`flex w-full cursor-pointer items-center gap-[10px] border-none px-[13px] py-[9px] text-left text-[13.5px] transition-colors ${
                lang === l.key
                  ? "bg-teal-tint font-bold text-teal-deep"
                  : "bg-transparent text-ink-soft hover:bg-surface-tint"
              }`}
            >
              <span className="w-[22px] shrink-0 font-mono text-[10.5px] tracking-[.06em] text-slate-mute">
                {l.short}
              </span>
              <span>{l.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
