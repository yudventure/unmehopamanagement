"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Fragment, useEffect, useRef, useState } from "react";

import {
  EMPTY_ENQUIRY,
  EnquiryModal,
  type Enquiry,
} from "@/components/web/enquiry-modal";
import {
  FacebookIcon,
  InstagramIcon,
  MailIcon,
  TikTokIcon,
  WhatsAppIcon,
} from "@/components/web/icons";
import { RoomCarousel, type RoomPhoto } from "@/components/eddo/room-carousel";
import { CheckoutModal, type CheckoutOrder } from "@/components/eddo/checkout-modal";
import {
  ART_BOX,
  BoatArt,
  HouseArt,
  IslandArt,
  TurtleArt,
} from "@/components/eddo/section-art";
import { CurrencySwitch, Price } from "@/components/web/price";
import {
  IsletScene,
  JettyScene,
  ReefScene,
  SnorkelScene,
} from "@/components/web/scenes";
import { useActiveSection } from "@/hooks/use-active-section";
import { useDismiss } from "@/hooks/use-dismiss";
import { useHeroScroll } from "@/hooks/use-hero-scroll";
import { useReveal } from "@/hooks/use-reveal";
import { useCurrency, useEddoLang, useRates } from "@/hooks/use-site-prefs";
import {
  EDDO,
  EDDO_COPY,
  EDDO_LANGS,
  SERVICE_KEYS,
  eddoActivityLabels,
  isPriceUnit,
  isRental,
  isSpecKey,
  pickText,
  serviceProducts,
  type ServiceKey,
  EMAIL,
  EDDO_ACTIVITIES,
  INCLUDED_KEYS,
  eddoMonthOptions,
  type EddoActivity,
  type EddoLang,
  type IncludedKey,
  WHATSAPP,
  eddoRooms,
  waLink,
  type EddoCopy,
} from "@/lib/eddo-content";
import { daysBetween, MAX_SPAN, shiftDay, todayISO } from "@/lib/days";
import { saveDraft } from "@/lib/eddo-order";
import { siteConfig, type ServiceProduct } from "@/lib/site-config";
import { type ActivityKey } from "@/lib/web-content";

/**
 * Eddo Homestay's public site.
 *
 * Same family, same booking manager, a different house: five of them on the
 * shore at Yenbuba, a few doors from Turtle in the same village, no dive
 * centre of their own, and a reason to come that is the village itself.
 *
 * The page is built to the shape of a travel site rather than the long
 * photographic scroll `/turtle` uses: a headline over a picture, a card of
 * reasons under it, then the houses, then the places a day can go. That shape
 * is what was asked for, and it suits a small place that has less to say and
 * wants to say it quickly.
 *
 * What is shared with `/turtle` is shared on purpose and nothing more: the
 * enquiry dialog and endpoint, the price and currency controls, the drawn
 * scenes under the photographs, the reveal-on-scroll, and the reader's
 * language and currency choice. The copy, the palette, the type, and the
 * layout are its own.
 */

const MONTH_ANCHOR = new Date(2026, 7, 1);

const EDDO_SOCIAL = siteConfig("eddo").social;
const SOCIALS = [
  { name: "Instagram", href: EDDO_SOCIAL.instagram, icon: <InstagramIcon /> },
  { name: "Facebook", href: EDDO_SOCIAL.facebook, icon: <FacebookIcon /> },
  { name: "TikTok", href: EDDO_SOCIAL.tiktok, icon: <TikTokIcon /> },
];

const FILL = "absolute inset-0 h-full w-full";

/** A card's place in its row, which the stylesheet turns into a delay. */
const step = (i: number) => ({ "--i": i }) as React.CSSProperties;

/** The badge's own proportions, 164 by 240 in the file. */
const LOGO_RATIO = 164 / 240;

/**
 * Midtrans's client key, which is public by design and inlined at build. Its
 * presence is what decides whether the room panel offers to take money or to
 * take a question: a pay button on a site with no keys is a dead end, and the
 * enquiry form was never worse than one.
 */
const MIDTRANS_CLIENT_KEY = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY ?? "";

/**
 * The badge from `public/eddo-logo.webp` beside the name.
 *
 * The village line that used to sit under the name is gone: three things in a
 * 46px bar left it small enough to read as texture rather than as words. What
 * is left is sized off one number, so the bar, the footer and the maintenance
 * page stay in proportion to each other rather than each being tuned by hand.
 *
 * On the photograph the badge is white, done with a filter rather than a
 * second file — the reasoning is with the rule in `globals.css`.
 *
 * An `<img>` that fails to load draws a broken-picture glyph where the logo
 * should be, and a header wearing one of those looks abandoned. On a
 * prerendered page the load has already failed by the time React attaches
 * `onError`, so the element is asked directly on mount; the name alone is what
 * the header falls back to.
 */
function EddoLogo({ size = 19, light = false }: { size?: number; light?: boolean }) {
  const [missing, setMissing] = useState(false);
  const ref = useRef<HTMLImageElement>(null);
  useEffect(() => {
    const img = ref.current;
    if (img && img.complete && img.naturalWidth === 0) setMissing(true);
  }, []);
  /* The badge is taller than it is wide, 164 by 240 in the file, so it is
     sized by its height and lets its width follow. Rather more than twice the
     cap height of the name beside it, which is what keeps it reading as a mark
     and not as a bullet. */
  const badge = Math.round(size * 2.1);
  return (
    <span className="flex items-center gap-[10px]">
      {!missing && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          ref={ref}
          data-ink-badge
          src="/eddo-logo.webp"
          alt=""
          width={Math.round(badge * LOGO_RATIO)}
          height={badge}
          onError={() => setMissing(true)}
          /* No rounding and no fill of our own: the badge carries its own
             outline and its own shape, so a box drawn around it would be a
             second frame fighting the first. */
          className="shrink-0"
          style={{ width: Math.round(badge * LOGO_RATIO), height: badge }}
        />
      )}
      <span
        data-ink
        className={`block font-bold tracking-[-.02em] ${light ? "text-white" : "text-eddo-deep"}`}
        style={{ fontSize: size, lineHeight: 1.1 }}
      >
        Eddo Homestay
      </span>
    </span>
  );
}

/**
 * A photograph over a drawn scene. The scene is the floor: if the file is
 * missing the picture simply is not painted and the drawing shows, rather than
 * a broken-image marker. Every photograph on this site is still to be taken,
 * so today the drawings are what the page shows, and the page is complete.
 */
function Photo({
  src,
  alt,
  narrow,
  sizes = "100vw",
}: {
  src: string;
  alt: string;
  /** The same picture cut down, for screens that cannot use the wide one. */
  narrow?: string;
  sizes?: string;
}) {
  const [missing, setMissing] = useState(false);
  const ref = useRef<HTMLImageElement>(null);
  /* Same as the logo: on a prerendered page the load has already failed
     before the handler exists, so the element is asked directly on mount. */
  useEffect(() => {
    const img = ref.current;
    if (img && img.complete && img.naturalWidth === 0) setMissing(true);
  }, []);
  if (missing) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      ref={ref}
      src={src}
      {...(narrow ? { srcSet: `${narrow} 720w, ${src} 1200w`, sizes } : {})}
      alt={alt}
      loading="lazy"
      decoding="async"
      onError={() => setMissing(true)}
      className={`${FILL} object-cover`}
    />
  );
}

function Section({
  id,
  children,
  className = "",
}: {
  id?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      id={id}
      className={`mx-auto w-full max-w-[1180px] scroll-mt-[86px] px-5 md:px-8 ${className}`}
    >
      {children}
    </section>
  );
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <span
      data-ink-chip
      className="inline-flex items-center gap-[7px] rounded-full bg-eddo-tint px-[13px] py-[6px] font-mono text-[10.5px] tracking-[.1em] text-eddo-deep uppercase"
    >
      {children}
    </span>
  );
}

/** A heading with the script line the reference layout hangs under it. */
function Title({
  plain,
  script,
  className = "",
}: {
  plain: string;
  script: string;
  className?: string;
}) {
  return (
    <h2 className={`m-0 leading-[1.05] font-bold tracking-[-.03em] text-eddo-ink ${className}`}>
      {plain}{" "}
      <span className="font-script font-normal tracking-normal text-eddo-deep">{script}</span>
    </h2>
  );
}

/**
 * The language picker.
 *
 * A dropdown rather than the row of pills it used to be. Two languages fit
 * beside each other in a bar; seven do not, and the row that held EN and ID
 * would have run past the width of a phone before it reached Russian. Past
 * about three choices a list is also simply easier to read than a strip of
 * two-letter codes, because each language gets to be named rather than
 * abbreviated.
 *
 * Each one is named in itself. Someone hunting for their own language is
 * looking for the shape of their own word, and a reader who needs the Japanese
 * page cannot be expected to first find the English word "Japanese".
 */
function LangSwitch({
  lang,
  onPick,
  label,
  align = "right",
}: {
  lang: EddoLang;
  onPick: (l: EddoLang) => void;
  label: string;
  /** Which edge the panel hangs from, so it cannot fall off a phone. */
  align?: "left" | "right";
}) {
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  useDismiss([box], () => setOpen(false), open);

  const current = EDDO_LANGS.find((l) => l.key === lang) ?? EDDO_LANGS[0];

  return (
    <div ref={box} className="relative">
      <button
        type="button"
        /* `data-ink` so it goes white over the photograph with everything else
           in the bar, `data-ink-pill` so its outline does too. */
        data-ink
        data-ink-pill
        onClick={() => setOpen((v) => !v)}
        aria-label={`${label}: ${current.label}`}
        aria-expanded={open}
        aria-haspopup="listbox"
        className="flex cursor-pointer items-center gap-[6px] rounded-full border border-line-strong bg-transparent px-[11px] py-[6px] text-[12px] font-medium text-ink-soft transition-colors hover:text-eddo-ink"
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
          /* Its own solid ground. The bar above may be transparent over a
             photograph, but a list of seven things to read is not something to
             put over moving water. */
          className={`absolute top-[calc(100%+8px)] z-50 min-w-[178px] overflow-hidden rounded-[14px] border border-line bg-surface py-[5px] shadow-[0_22px_50px_-20px_rgba(18,52,58,.45)] ${
            align === "right" ? "right-0" : "left-0"
          }`}
        >
          {EDDO_LANGS.map((l) => (
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
                  ? "bg-eddo-tint font-bold text-eddo-deep"
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

/* Four glyphs for the reasons row, drawn inline like the footer icons. */
const TRUST_ICONS = [
  /* A card, a covered plate, a signal, a face. In the order the four reasons
     are written, so a reason moved in `eddo-content.ts` without its glyph is
     a mismatch anyone can see rather than one nobody notices.

     Sized in attributes, not left to the box. An `<svg>` carrying only a
     viewBox has no intrinsic size; Chromium gives it the room its parent has
     and Safari gives it none, so on a phone these were four empty circles
     while every desktop screenshot of them looked right. */
  <svg key="bayar" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="2.5" y="5.5" width="19" height="13" rx="2.5" /><path d="M2.5 10h19M6.5 14.5h4" /></svg>,
  <svg key="makan" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 12h18a9 9 0 0 1-18 0z" /><path d="M6 12V9m6 3V6m6 6V9" /></svg>,
  <svg key="internet" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M2.6 8.6a14 14 0 0 1 18.8 0" /><path d="M5.6 12.1a9.5 9.5 0 0 1 12.8 0" /><path d="M8.6 15.6a5 5 0 0 1 6.8 0" /><path d="M12 19.2h.01" /></svg>,
  <svg key="layanan" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M8.3 14.2a4.6 4.6 0 0 0 7.4 0" /><path d="M9.2 9.6h.01M14.8 9.6h.01" /></svg>,
];

/**
 * A glyph per line of what a night buys, keyed rather than ordered so the
 * picture and the words cannot come apart. None of them is a tick and none of
 * them is repeated: six identical ticks tell the reader only that there are
 * six of something, which the eye already knew.
 *
 * Drawn rather than fetched, like every other icon on these two sites: an icon
 * font is a network request and a flash of nothing for six shapes that between
 * them come to less than a kilobyte.
 */
const INCLUDED_ICONS: Record<IncludedKey, React.ReactNode> = {
  /* A house, not a bed: the point of the line is that the whole thing is
     theirs. */
  house: <><path d="M3.5 10.5L12 4l8.5 6.5" /><path d="M5.5 9.5V20h13V9.5" /><path d="M10 20v-5.5h4V20" /></>,
  meals: <><path d="M7 3v8a2 2 0 0 0 2 2v7" /><path d="M5 3v4M9 3v4" /><path d="M17 3c-1.6 1.2-2.2 3-2.2 5.2 0 1.8.9 2.8 2.2 3V20" /></>,
  /* A deck on posts with the water under it, which is what the line says. */
  deck: <><path d="M3 10.5h18" /><path d="M6.5 10.5V16M17.5 10.5V16" /><path d="M3 19c1.6-1.2 3.2-1.2 4.8 0s3.2 1.2 4.8 0 3.2-1.2 4.8 0 2 .8 2.6.5" /></>,
  /* Moving air rather than a fan's blades: three blades at this size close up
     into a disc and read as a wheel. */
  fan: <><path d="M3 8.5h10a2.5 2.5 0 1 0-2.5-2.5" /><path d="M3 12.5h14a2.5 2.5 0 1 1-2.5 2.5" /><path d="M3 16.5h6.5a2 2 0 1 1-2 2" /></>,
  /* A globe, because the bar's own wifi arcs are already on this page and two
     of the same shape in one view is the thing being avoided. */
  internet: <><circle cx="12" cy="12" r="8.5" /><path d="M3.5 12h17" /><path d="M12 3.5c2.2 2.3 3.4 5.3 3.4 8.5S14.2 18.2 12 20.5c-2.2-2.3-3.4-5.3-3.4-8.5S9.8 5.8 12 3.5z" /></>,
  nofee: <><path d="M20 12.5l-7.5 7.5-8.5-8.5V4h7.5l8.5 8.5z" /><path d="M8.2 8.2h.01" /></>,
};

/**
 * A glyph for each thing the family arranges.
 *
 * Drawn rather than photographed because there are no photographs of a hired
 * motorbike or a box of T-shirts, and a stock picture of somebody else's
 * scooter is a worse answer than a line drawing: it says a little and implies
 * a lot, and what it implies is not this place.
 *
 * Keyed rather than listed, for the reason the included-with-a-night lines are:
 * a list matched by position comes apart the first time somebody reorders it,
 * and a camera beside "speedboat hire" is the kind of wrong nobody reports.
 *
 * Sized in attributes, not left to the box. An `<svg>` carrying only a viewBox
 * has no intrinsic size; Chromium gives it the room its parent has and Safari
 * gives it none.
 */
const SVG = {
  viewBox: "0 0 24 24",
  width: 26,
  height: 26,
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
} as const;

const SERVICE_ICONS: Record<ServiceKey, React.ReactNode> = {
  snorkeling: (
    /* A mask with the tube standing up beside it. It sits next to diving in
       the list now, so the two have to be told apart at twenty-six pixels:
       what separates them is the shape of the air. A snorkel goes up into the
       sky, a tank is carried. Both used to be a mask with a hose, which was
       the same icon drawn twice. */
    <svg {...SVG}>
      <path d="M2.8 8.6h10.4a1.8 1.8 0 0 1 1.8 1.8v2.2a3 3 0 0 1-3 3h-1.5l-1.3-1.5H8.3L7 15.6H5.8a3 3 0 0 1-3-3v-2.2a1.8 1.8 0 0 1 0-1.8Z" />
      <path d="M18.6 4.2v9.4a3.2 3.2 0 0 1-3.2 3.2h-1.2" />
    </svg>
  ),
  diving: (
    <svg {...SVG}>
      {/* The tank, its valve, and its band. */}
      <rect x="6.2" y="7.2" width="8.6" height="13.4" rx="3.2" />
      <path d="M9 7.2V4.9h3v2.3" />
      <path d="M12 5.8h2.4" />
      <path d="M6.2 11.4h8.6" />
      {/* Two bubbles, which is what says the tank is underwater rather than
          standing in a shed. */}
      <circle cx="18.6" cy="8.8" r="1.5" />
      <circle cx="20.6" cy="5" r="1" />
    </svg>
  ),
  excursion: (
    /* A whole day, which is a sun with the water under it. Rays only above
       the horizon, because the two below would have run into the waves. */
    <svg {...SVG}>
      <circle cx="12" cy="9.4" r="3.6" />
      <path d="M12 2.2v1.6" />
      <path d="M4.4 9.4H2.8" />
      <path d="M21.2 9.4h-1.6" />
      <path d="m6.2 3.6 1.2 1.2" />
      <path d="m17.8 3.6-1.2 1.2" />
      <path d="M2.8 17.2c1.5.9 3.1.9 4.6 0s3.1-.9 4.6 0 3.1.9 4.6 0 3.1-.9 4.6 0" />
      <path d="M2.8 20.6c1.5.9 3.1.9 4.6 0s3.1-.9 4.6 0 3.1.9 4.6 0 3.1-.9 4.6 0" />
    </svg>
  ),
  transfer: (
    <svg {...SVG}><path d="M5.6 2.8a2.9 2.9 0 0 1 2.9 2.9c0 2.1-2.9 5.2-2.9 5.2s-2.9-3.1-2.9-5.2a2.9 2.9 0 0 1 2.9-2.9Z" /><path d="M18.4 12.6a2.9 2.9 0 0 1 2.9 2.9c0 2.1-2.9 5.2-2.9 5.2s-2.9-3.1-2.9-5.2a2.9 2.9 0 0 1 2.9-2.9Z" /><path d="M9.4 8.6c3.4.4 5.2 2.4 5.6 5.4" /><path d="m12.6 14.6 2.4-.6.5 2.4" /></svg>
  ),
  camera: (
    <svg {...SVG}><rect x="2.6" y="7" width="18.8" height="13" rx="2.6" /><path d="M8.6 7 10 4.4h4L15.4 7" /><circle cx="12" cy="13.4" r="3.5" /></svg>
  ),
  motorbike: (
    /* A scooter, and the one glyph here that is a silhouette rather than a
       line drawing.

       Eight versions were drawn and looked at side by side at 26, 44 and 96
       pixels, because an icon at 26 pixels is not the icon you designed at 96.
       Every outline version read as a bicycle at the size it is actually used,
       including one with a faint fill behind it: at 26 pixels a thin rear
       body is just more line, and line is what a bicycle is made of. Filling
       the body outright is what finally made it a motor, because the eye meets
       a mass over the back wheel instead of a wire around one.

       That costs consistency with the other seven, which was weighed and lost.
       An icon nobody can name is not carrying its weight whatever it matches. */
    <svg {...SVG}>
      {/* Body as solid shapes rather than an outline of one: the leg shield
          leaning back, the floorboard, the seat, and the cowl over the rear
          wheel. Wheels stay outlined and small, which is the proportion that
          separates a scooter from a bicycle more than any other single thing. */}
      <g fill="currentColor" stroke="none">
        <rect x="4.6" y="6.4" width="2.6" height="7.6" rx="1.3" transform="rotate(-9 5.9 10.2)" />
        <rect x="5.6" y="12.6" width="7.6" height="1.9" rx=".95" />
        <path d="M10.4 14.5v-3.1a1 1 0 0 1 1-1h4.2a5.4 5.4 0 0 1 5.4 5.4v.3H10.4z" />
        <rect x="9.9" y="8.9" width="7.4" height="2" rx="1" />
      </g>
      <path d="M3.7 5.6h3.6" strokeWidth={1.8} />
      <circle cx="6.6" cy="17.9" r="2.2" strokeWidth={1.8} />
      <circle cx="17.6" cy="17.9" r="2.2" strokeWidth={1.8} />
    </svg>
  ),
  car: (
    <svg {...SVG}><path d="M3 16.4v-3l1.9-4a2 2 0 0 1 1.8-1.2h10.6a2 2 0 0 1 1.8 1.2l1.9 4v3" /><path d="M3 16.4h18" /><circle cx="7.3" cy="16.8" r="1.7" /><circle cx="16.7" cy="16.8" r="1.7" /><path d="M5.4 12.2h13.2" /></svg>
  ),
  merch: (
    <svg {...SVG}><path d="M8.6 3.6 4.2 5.8 2.8 9.3l3 1.2 1-1.7v11.6h10.4V8.8l1 1.7 3-1.2-1.4-3.5-4.4-2.2a3.5 3.5 0 0 1-6.8 0Z" /></svg>
  ),
};

/**
 * What a homestay means by a night: the days between arriving and leaving.
 *
 * Both dates are parsed as UTC midnight rather than local, and that is the
 * whole reason this is a function instead of a subtraction at the call site.
 * Parsed locally, a stay that crosses the hour a clock goes forward is 23 hours
 * short of a whole number of days, and a reader who picked two dates a week
 * apart is quietly charged for six nights. In UTC every day is 24 hours and
 * there is nothing to round.
 *
 * Returns 0 for anything that is not a stay: a missing date, an unparseable
 * one, or a check-out on or before the check-in.
 */

const BTN =
  "inline-flex cursor-pointer items-center justify-center gap-2 rounded-full border-none bg-eddo-deep px-[22px] py-[12px] text-[14px] font-medium text-white no-underline transition-colors hover:bg-eddo-dark hover:text-white hover:no-underline";
const BTN_GHOST =
  "inline-flex cursor-pointer items-center justify-center gap-2 rounded-full border border-eddo-line bg-surface px-[22px] py-[12px] text-[14px] font-medium text-eddo-ink no-underline transition-colors hover:border-eddo hover:no-underline";

/**
 * The one button that sits on a photograph, turned inside out.
 *
 * `BTN` is teal on white and right everywhere else on the page. On the hero it
 * is teal on the sea, which is teal, and it measured 1.42:1 against the water
 * behind it on a wide screen and 1.29:1 on a phone. A control needs 3:1 from
 * what it sits on before anybody can be certain they have seen it, and the
 * owner reported it as faint before any of that was measured.
 *
 * White is the way out and the only one that keeps working: the sea changes
 * colour with the hour, the crop and the photograph, and a darker or brighter
 * teal only wins against the water it was sampled from. White wins against any
 * of them, and the brand colour moves to the type where it still reads.
 *
 * Bigger than `BTN` as well, because this is the first thing on the page and
 * the only thing being asked of a reader who has just arrived.
 */
const BTN_ON_PHOTO =
  "inline-flex cursor-pointer items-center justify-center gap-2 rounded-full border-none bg-white px-[26px] py-[14px] text-[15px] font-semibold text-eddo-deep no-underline shadow-[0_12px_28px_-10px_rgba(6,40,44,.55)] transition-colors hover:bg-eddo-tint hover:text-eddo-dark hover:no-underline";

export function EddoSite({
  maintenance = false,
  sisterHref = "/turtle",
  hasHeroPhoto = false,
  roomPhotos = [],
}: {
  maintenance?: boolean;
  /** Where Turtle lives. A path while the two share a domain, an absolute
      address once Turtle has its own. Resolved by the page, which can read
      the environment; this component cannot. */
  sisterHref?: string;
  /** Whether `public/eddo-hero.jpg` is actually there. Answered by the page,
      which can look at the disk at build time; the hero's shape depends on
      it, and a shape that settles after the first paint is a visible jump. */
  hasHeroPhoto?: boolean;
  /** The room photographs that exist, in order, as web paths. Counted on the
      disk by the page: the carousel has no maximum, and a number baked into
      the code would be one. */
  roomPhotos?: RoomPhoto[];
}) {
  const { lang, pickLang } = useEddoLang();
  const { currency, pickCurrency } = useCurrency();
  const rates = useRates();
  const t: EddoCopy = EDDO_COPY[lang];
  /* The dialog's labels used to be borrowed from Turtle's copy, on the reading
     that "Name" and "When" are the same words whichever house is being asked
     about. True, and beside the point once this site had five languages Turtle
     does not: the borrowed words came back in English while the page around
     them was in French. They live here now. */
  const monthsAhead = eddoMonthOptions(MONTH_ANCHOR, lang);
  /* Built from the services rather than written beside them, so the dialog's
     list and the section's headings are the same words by construction. */
  const activityLabels = eddoActivityLabels(t);
  const rooms = eddoRooms();

  useEffect(() => {
    document.documentElement.lang = t.htmlLang;
  }, [t.htmlLang]);

  useReveal();
  const heroRef = useHeroScroll<HTMLDivElement>();

  /* Which of the nine is open. The first, because a panel with nothing in it
     is a hole rather than an invitation to press something. */
  const [service, setService] = useState<ServiceKey>(SERVICE_KEYS[0]);
  const products = serviceProducts(service);

  /*
   * How wide to lay the cards out, decided by how many there are.
   *
   * Three across is right for a long list and wrong for a short one: two cards
   * in a three-column grid is a whole card's worth of nothing on the right,
   * which is exactly what it looked like. So the grid never offers more
   * columns than there are things to put in them, and four goes two-by-two
   * rather than three-and-a-stray.
   *
   * Written as whole class strings rather than built from a number, because
   * Tailwind reads this file as text: a class assembled at runtime is a class
   * that was never compiled.
   */
  const cols = products.length <= 2 ? products.length : products.length === 4 ? 2 : 3;
  const productGrid =
    cols <= 1
      ? "grid-cols-1"
      : cols === 2
        ? "grid-cols-1 sm:grid-cols-2"
        : "grid-cols-1 sm:grid-cols-2 xl:grid-cols-3";
  /* One card gets the panel to itself, and a card the width of the panel with
     a 4:3 photograph on top of it is half a screen of one T-shirt. Laid on its
     side instead: picture on the left, everything else beside it. */
  const solo = products.length === 1;
  /* No client key, no Snap script, so nothing here can charge and every
     button asks instead. Read once, up here, because both the room panel far
     below and the service cards just under this need the same answer. */
  const canPay = Boolean(MIDTRANS_CLIENT_KEY);

  /* Which product the checkout dialog is open on, or nothing. One piece of
     state for the whole section rather than a set of fields per card: the
     cards are drawn in a loop, and a hook cannot be. */
  const [buying, setBuying] = useState<{ service: ServiceKey; product: ServiceProduct } | null>(null);
  /* The room's empty boxes, named so each can be marked where it stands, and
     separately whether the payment itself failed. */
  const [stayMissing, setStayMissing] = useState<Set<string>>(new Set());
  const [stayFailed, setStayFailed] = useState(false);

  /*
   * Whether this card offers to charge rather than to ask.
   *
   * Four conditions, and the interesting one is the last. A product still
   * flagged `example` is never payable however everything else lines up. The
   * flag no longer shows the reader anything — the site is open and the notice
   * that used to sit over these cards has gone — so all it does now is hold
   * the money back: a figure nobody has confirmed can be looked at and asked
   * about, and cannot be charged. The card falls back to its ask button, which
   * is the one place a made-up number gets corrected by a person. The server
   * refuses it too; this is only what the reader is offered.
   */
  const canBuy = (x: ServiceProduct) =>
    canPay && typeof x.price === "number" && x.price > 0 && !x.example;

  /*
   * Pays for one thing off the service list.
   *
   * Sends what it is, not what it costs. The server looks the price up in the
   * same file the card was drawn from, and refuses anything still flagged as an
   * example, so a made-up figure cannot become a real charge however the button
   * is pressed.
   */
  /*
   * Takes what the dialog collected to the summary page.
   *
   * It used to call `/api/pay` from here and let Midtrans open its sheet over
   * whatever was on screen, which was the top of the front page. Now the order
   * is stashed in the tab and the reader is sent to a page that exists for it.
   *
   * Nothing about money travels: the draft names the product and the server
   * prices it, same as before. Returning false leaves the dialog open with a
   * complaint, which is what happens when the browser has no session storage
   * to stash anything in.
   */
  const payForProduct = async (
    key: ServiceKey,
    x: ServiceProduct,
    o: CheckoutOrder,
  ): Promise<boolean> => {
    const stashed = saveDraft({
      kind: "service",
      service: key,
      productId: x.id,
      qty: o.qty,
      when: o.when,
      until: o.until,
      size: o.size,
      way: o.way,
      name: o.name,
      phone: o.phone,
      email: o.email,
    });
    if (!stashed) return false;
    router.push("/eddo/checkout");
    return true;
  };

  const [menuOpen, setMenuOpen] = useState(false);
  /* Both the button and the panel, because the button lives in the bar's top
     row and the panel hangs below it. Naming only the panel would make a press
     on the button count as "outside", which closes the menu a moment before the
     button's own handler opens it again. */
  const menuButton = useRef<HTMLButtonElement>(null);
  const menuPanel = useRef<HTMLElement>(null);
  useDismiss([menuButton, menuPanel], () => setMenuOpen(false), menuOpen);

  /* The bar carries nothing of its own while the page is at the top, and
     frosts over once it starts covering content. It begins `false` rather than
     reading the offset during render: this page is prerendered, and a value
     read at render time would not match what the browser hydrates with. The
     effect settles it on mount, which also covers a reload part-way down. */
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* An open drawer needs something behind it whether or not the page has
     moved, or the links hang over the hero with nothing under them. */
  const barSolid = scrolled || menuOpen;
  /* The booking fields. They belong to the room panel, not to the dialog: the
     dialog is for asking, and these are for paying. */
  const router = useRouter();
  const [stayFrom, setStayFrom] = useState("");
  const today = todayISO();
  const [payName, setPayName] = useState("");
  const [payPhone, setPayPhone] = useState("");
  const [payEmail, setPayEmail] = useState("");
  /* Two dates, and the nights counted from them. A reader books by saying
     when they arrive and when they leave; making them arrive and then count
     is arithmetic the page can do and they should not have to. */
  const [stayTo, setStayTo] = useState("");

  /*
   * What the two dates come to, and what to price with until they are a stay.
   *
   * Out of range counts as nothing at all, not as the number of days between
   * the dates. That is not tidiness: a check-out sixty-eight nights out put
   * "Total Rp 91,800,000" above the pay button, an amount this site will never
   * charge because the endpoint shortens anything past thirty. Quoting a price
   * nobody can be charged is worse than quoting none, and it was on screen at
   * the same time as the red mark saying the date was no good.
   *
   * So an unusable pair falls back to one night, the same as a pair nobody has
   * chosen yet, which keeps the total equal to the rate printed above it. A
   * stay cannot be paid for until the pair is real, so the fallback is never
   * what anybody is charged.
   */
  const spanNights = daysBetween(stayFrom, stayTo);
  const stayNights = spanNights >= 1 && spanNights <= MAX_SPAN ? spanNights : 0;
  const nights = stayNights || 1;
  const [guests, setGuests] = useState(2);
  const [enquiry, setEnquiry] = useState<Enquiry>(EMPTY_ENQUIRY);
  const [enquiryOpen, setEnquiryOpen] = useState(false);
  const patch = (p: Partial<Enquiry>) => setEnquiry((prev) => ({ ...prev, ...p }));

  /**
   * Opens Midtrans with an amount the server worked out.
   *
   * Nothing about money leaves this function: the dates and the guest go up,
   * a token comes back. If the server has no keys of its own it answers 503
   * and the reader gets the enquiry form instead of an error, which is the
   * same fallback every other optional service on this site has.
   */
  /*
   * The house, paid for.
   *
   * No enquiry behind it any more. It used to drop a reader into the message
   * form whenever anything went wrong, which meant a reader who had filled in
   * their name, their dates and their number was handed a second form to fill
   * in again, and the owner asked for the asking to stop. So this checks what
   * it needs before it starts, and says so on the spot when something fails,
   * with everything they typed still where they typed it.
   *
   * What it does not do is check the calendar. Nothing here holds a night:
   * paying sends money and a message, and two people can pay for the same week.
   */
  /*
   * The house, taken to the summary page.
   *
   * Checks first, for the same reason it always did: a set of gaps rather than
   * the first one, so somebody who left three boxes empty is told about three
   * boxes. What changed is the end of it — the order goes into the tab and the
   * reader goes to `/eddo/checkout`, where it is priced again and paid for.
   *
   * Nothing here holds a night. Paying sends money and a message, and two
   * people can pay for the same week.
   */
  const startPayment = () => {
    const gaps = new Set<string>();
    if (!stayFrom) gaps.add("when");
    /* Not just "filled in": a check-out on or before the check-in is not a
       stay, and one more than thirty nights out is a stay this endpoint would
       silently shorten to thirty and charge for thirty. Both land as zero
       above, so one test covers them. */
    if (stayNights < 1) gaps.add("to");
    if (!payName.trim()) gaps.add("name");
    if (!payPhone.trim()) gaps.add("phone");
    if (!payEmail.trim()) gaps.add("email");
    if (gaps.size) {
      setStayMissing(gaps);
      return;
    }
    setStayMissing(new Set());
    const stashed = saveDraft({
      kind: "room",
      from: stayFrom,
      to: stayTo,
      guests,
      name: payName.trim(),
      phone: payPhone.trim(),
      email: payEmail.trim(),
    });
    if (!stashed) {
      setStayFailed(true);
      return;
    }
    setStayFailed(false);
    router.push("/eddo/checkout");
  };

  /* The same marking the checkout dialog uses, for the same reason: a reader
     who has left something out should be told which thing, beside the thing. */
  const stayMark = (key: string) =>
    stayMissing.has(key) ? "border-danger" : "border-line-strong";
  const stayNote = (key: string) =>
    stayMissing.has(key) ? (
      <span className="mt-[2px] block text-[11px] font-normal text-danger">
        {t.services.required}
      </span>
    ) : null;

  const ask = (activity: ActivityKey, notes: string, extra: Partial<Enquiry> = {}) => {
    patch({ activity, notes, ...extra });
    setEnquiryOpen(true);
  };

  const message = t.message({
    activity: activityLabels[enquiry.activity as EddoActivity] ?? enquiry.activity,
    name: enquiry.name,
    phone: enquiry.phone,
    email: enquiry.email,
    when: monthsAhead[enquiry.monthIx] ?? monthsAhead[0],
    people: enquiry.people,
    nights: enquiry.activity === "stay" ? enquiry.nights : "",
    notes: enquiry.notes,
  });

  const nav = [
    { id: "atas", label: t.nav.home },
    { id: "kamar", label: t.nav.rooms },
    { id: "sekitar", label: t.nav.around },
    { id: "layanan", label: t.nav.services },
    { id: "kenapa", label: t.nav.why },
    { id: "tanya", label: t.nav.faq },
  ];

  /* Which link is lit. It used to be the first one, always, which is a fair
     guess for as long as nobody scrolls: the nav said "Home" to a reader
     halfway down the questions.

     96 is the fixed bar plus a little: a heading still hidden behind the bar
     has not been reached yet, whatever its coordinates say. */
  const activeSection = useActiveSection(
    nav.map((n) => n.id),
    96,
  );

  if (maintenance) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-eddo-wash px-5 text-center">
        <div className="max-w-[520px]">
          <EddoLogo size={28} />
          <h1 className="mt-8 text-[clamp(28px,5vw,44px)] leading-[1.1] font-bold tracking-[-.03em] text-eddo-ink">
            {t.maintenance.title}
          </h1>
          <p className="mt-4 text-[15px] leading-[1.7] text-slate">{t.maintenance.body}</p>
          <a href={waLink("Halo Eddo Homestay")} target="_blank" rel="noreferrer" className={`${BTN} mt-7`}>
            <span className="h-[18px] w-[18px]"><WhatsAppIcon /></span>
            {t.maintenance.whatsapp}
          </a>
        </div>
      </main>
    );
  }

  return (
    <div id="atas" className="bg-surface text-ink">
      {/* ------------------------------------------------------------ nav */}
      {/* Fixed, not sticky. A sticky bar keeps its height in the flow, so a
          transparent one would show a band of page background above the hero
          rather than the hero itself. Fixed lifts it off the flow and the hero
          runs underneath; the hero pays for that with the top padding that
          keeps its own content clear of the bar. */}
      <header
        /* At rest above the photograph the bar has no ground of its own, so
           its badge and its type go white. The moment it goes frosted it is
           over a near-white ground again and both go back to ink. */
        {...(hasHeroPhoto && !barSolid ? { "data-on-photo": "" } : {})}
        className={`fixed inset-x-0 top-0 z-50 border-b transition-[background-color,border-color] duration-300 ${
          menuOpen
            ? /* Solid, not frosted, while the menu is down. The panel below is
                 opaque white, and a bar at 80% over a dark photograph is not:
                 the picture came through it and the top strip read grey against
                 the white sheet underneath, as though the menu had been cut out
                 of something. One surface, one colour. */
              "border-line bg-surface"
            : barSolid
              ? "border-line bg-surface/80 backdrop-blur-md"
              : /* Nothing at all at rest: no fill, no rule, no blur. */
                "border-transparent bg-transparent"
        }`}
      >
        <div className="mx-auto flex max-w-[1180px] items-center gap-4 px-5 py-[12px] md:px-8">
          <a href="#atas" className="no-underline hover:no-underline">
            <EddoLogo />
          </a>

          {/* Pushed right, so the bar reads as the name on one side and
              everything you can do on the other. `lg:` on the auto margin and
              nothing below it: between 768 and 1024 the nav is not rendered at
              all, and the switch below needs the push instead. */}
          <nav className="hidden items-center gap-[26px] lg:ml-auto lg:flex">
            {nav.map((n) => {
              const here = activeSection === n.id;
              return (
                <a
                  key={n.id}
                  href={`#${n.id}`}
                  /* Both of these turn the link white over the photograph,
                     which every link needs or four of the five become dark
                     type on a bright picture. They differ in how white: full
                     for the one the reader is in, 86 per cent for the rest.
                     That difference plus the weight is what carries "you are
                     here" at the top of the page, where the teal cannot,
                     because teal on a sunlit photograph is not a colour
                     anybody can read. */
                  {...(here ? { "data-ink": true } : { "data-ink-soft": true })}
                  aria-current={here ? "location" : undefined}
                  className={`text-[13.5px] no-underline transition-colors hover:text-eddo-deep hover:no-underline ${
                    here ? "font-medium text-eddo-deep" : "text-ink-soft"
                  }`}
                >
                  {n.label}
                </a>
              );
            })}
          </nav>

          {/* The language and nothing else. Everything that was here before it
              was a call to action of some kind, and three of those within an
              inch of each other left the reader to work out which one was the
              real one. The card below the hero is the real one. Currency is
              set where prices are actually read, beside the rooms. */}
          {/* Its own push below 1024 where the nav is gone, and a little air
              from the last nav link above it so the pill does not read as a
              sixth link. */}
          <div className="ml-auto hidden items-center gap-3 md:flex lg:ml-4">
            <LangSwitch lang={lang} onPick={pickLang} label={t.langLabel} />
          </div>

          {/* On a phone the language sits out here beside the menu rather than
              inside it. It was one of the two things in the menu that is not a
              destination, and burying a choice of language behind a button
              labelled "open menu" asks the reader to already understand the
              page in order to find the control that makes the page readable. */}
          <div className="ml-auto flex items-center gap-2 md:hidden">
            <LangSwitch lang={lang} onPick={pickLang} label={t.langLabel} />
            <button
              ref={menuButton}
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              aria-label={t.openMenu}
              aria-expanded={menuOpen}
              /* `group` so the two bars can react to the button being hovered
                 rather than to themselves: a pointer between them is not over
                 either one, and without this the cross would come apart under
                 a steady cursor. */
              className="group relative flex h-[36px] w-[36px] shrink-0 cursor-pointer items-center justify-center rounded-full border border-line-strong bg-surface"
            >
              {/* Two bars that become a cross. Both are centred and moved apart
                  by a translation rather than stacked with a gap, so closing
                  the cross is that translation going to zero and the rotation
                  turning: one motion, no reflow, and nothing to keep in step.

                  Open is the state that matters, because a menu showing a
                  hamburger while it is already open is telling the reader the
                  wrong thing about what pressing it will do. Hover does the
                  same thing early, and only where hovering exists at all: this
                  button is hidden above 768, so on most of the devices that
                  reach it there is no pointer to hover with and the open state
                  is the whole animation. */}
              <span
                className={`absolute block h-[1.5px] w-[15px] bg-eddo-ink transition-transform duration-300 ${
                  menuOpen
                    ? "translate-y-0 rotate-45"
                    : "-translate-y-[3.5px] group-hover:translate-y-0 group-hover:rotate-45"
                }`}
              />
              <span
                className={`absolute block h-[1.5px] w-[15px] bg-eddo-ink transition-transform duration-300 ${
                  menuOpen
                    ? "translate-y-0 -rotate-45"
                    : "translate-y-[3.5px] group-hover:translate-y-0 group-hover:-rotate-45"
                }`}
              />
            </button>
          </div>
        </div>

        {menuOpen && (
          <nav ref={menuPanel} className="border-t border-line bg-surface px-5 py-3 md:hidden">
            {/* The same mark of place as the wide bar. The panel is opaque
                white whenever it is open, so here the teal can do the work on
                its own and no white variant is needed. */}
            {nav.map((n) => {
              const here = activeSection === n.id;
              return (
                <a
                  key={n.id}
                  href={`#${n.id}`}
                  onClick={() => setMenuOpen(false)}
                  aria-current={here ? "location" : undefined}
                  className={`block py-[9px] text-[14px] no-underline hover:no-underline ${
                    here ? "font-medium text-eddo-deep" : "text-ink-soft"
                  }`}
                >
                  {n.label}
                </a>
              );
            })}
            <div className="mt-2 flex items-center justify-between gap-3 border-t border-line pt-3">
              {/* The number with its own mark. It was a bare string of digits,
                  which on a phone reads as a fact about the homestay rather
                  than as something to press. The logo says which app opens. */}
              <a
                href={waLink("Halo Eddo Homestay")}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-[7px] font-mono text-[12.5px] text-eddo-ink no-underline"
              >
                <span className="h-[15px] w-[15px] shrink-0 text-eddo-deep">
                  <WhatsAppIcon />
                </span>
                +{WHATSAPP}
              </a>

              {/* Where the language used to be, now that it lives out in the
                  bar. Only the accounts that have actually been filled in are
                  drawn: an icon that leads nowhere is a promise the site
                  cannot keep, and a row of them says the family is somewhere
                  they are not. With none filled in this renders nothing, and
                  the number simply has the row to itself. */}
              {SOCIALS.some((s) => s.href) && (
                <div className="flex shrink-0 items-center gap-[6px]">
                  {SOCIALS.filter((s) => s.href).map((s) => (
                    <a
                      key={s.name}
                      href={s.href}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={s.name}
                      className="flex h-[32px] w-[32px] items-center justify-center rounded-full border border-line p-[8px] text-eddo-deep no-underline transition-colors hover:bg-eddo-tint hover:no-underline"
                    >
                      {s.icon}
                    </a>
                  ))}
                </div>
              )}
            </div>
          </nav>
        )}
      </header>

      {/* ----------------------------------------------------------- hero */}
      {/*
       * The photograph fills the hero and the words sit on it. That is the
       * arrangement the picture was sent for, and it is also the one that can
       * go wrong: this shot is bright and even, peaking at 0.88 luminance, so
       * white type on it is hopeless, while the ink the rest of the site uses
       * is only safe over the pale sky and sand and not over the trees.
       *
       * So the type stays ink and the picture is lifted to meet it, by two
       * washes rather than one. Neither is a flat veil over the whole frame:
       * that would cost the photograph everything and buy readability the
       * cheapest possible way.
       *
       * The top padding clears the fixed bar above, which measures 70px.
       */}
      {/* Full height on a phone, so the photograph is the screen rather than a
          strip of it. `svh` and not `vh`: `vh` is measured against the browser
          with its bars hidden, so a hero sized in it starts taller than the
          screen and settles as the reader scrolls. */}
      <div
        ref={heroRef}
        className={`relative overflow-hidden bg-eddo-wash ${
          hasHeroPhoto ? "flex min-h-[100svh] flex-col justify-end lg:block lg:min-h-0" : ""
        }`}
      >
        {/* The pale ground: the whole hero without a photograph, the panel the
            type sits on with one. It is painted first so the picture can lie
            on top of it, which is the only order in which a feathered edge
            means anything. */}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[linear-gradient(135deg,var(--color-eddo-wash)_0%,var(--color-surface)_55%)]"
        />

        {hasHeroPhoto && (
          <>
            {/* The picture, edge to edge and top to bottom, at every width. The
                bar has no ground of its own at rest, so what is behind its
                links here is this photograph.

                It used to step aside below 1024 and become a band under the
                words, because a white wash strong enough to read a paragraph
                through covered the whole frame and left a photograph nobody
                could see. What changed is the direction of the wash: dark
                deepens the water instead of bleaching it, so the picture
                survives being read over and the phone gets the same hero the
                desktop does. */}
            <div className="absolute inset-0">
              {/* The scale lives inside the fade, not on it: a mask scales
                  with the element it is on, so the two together would walk the
                  feather across the paragraph as the reader scrolls. */}
              <div data-hero-photo className="h-full w-full">
                {/* `<picture>` is inline by default, and an inline box has no
                    height for `h-full` to be a percentage of. */}
                <picture className="block h-full w-full">
                  <source media="(min-width: 1024px)" srcSet="/eddo-hero.jpg" />
                  {/* Two photographs, because the box is two shapes, and for a
                      long time only one of them was honest about it. The
                      narrow file used to be the wide one at 900x450, set into
                      a frame taller than it is wide: the browser enlarged it
                      to about 1688px and threw away the sides, so the phone,
                      which is where this page is mostly read, got the worst
                      picture on the site. It is now a portrait frame at
                      1080x1920, which is the shape it is drawn in, so nothing
                      is enlarged and the crop is a few per cent rather than
                      most of the image. That is why the horizontal anchor is
                      back at centre: it was at 62% to chase the houses across
                      a frame that was being stretched past them.

                      The narrow file is the `<img>` and the wide one a
                      `<source>`, so each screen fetches one and only one. */}
                  <img
                    src="/eddo-hero-tall.webp"
                    /* Two widths, and the narrow one is 800 rather than the
                       720 the rest of the site uses. A 390px phone at two
                       device pixels wants 780: a 720 file is under that, so the
                       browser correctly refuses it and takes the 1080 instead,
                       which is how the first attempt at this saved nothing at
                       all. 800 clears the bar, and a phone at three pixels
                       still gets the 1080. */
                    srcSet="/eddo-hero-tall-800.webp 800w, /eddo-hero-tall.webp 1080w"
                    sizes="100vw"
                    alt={t.hero.alt}
                    /* The one picture that is on screen before anything is
                       scrolled, so it is the one the page is judged on. Told to
                       go first rather than left to queue behind the scripts. */
                    fetchPriority="high"
                    decoding="async"
                    className="h-full w-full object-cover object-[50%_50%] lg:object-[50%_58%]"
                  />
                </picture>
              </div>
            </div>

            {/* Two gradients, both dark. One for the side the words are on,
                one for the strip the bar sits in. Dark deepens a photograph
                where light bleaches it. Stops and reasoning are in
                `globals.css`. */}
            <div aria-hidden="true" data-hero-deep className="absolute inset-0" />
            <div aria-hidden="true" data-hero-deep-top className="absolute inset-x-0 top-0" />
          </>
        )}

        {/* The foot of the hero is what sets two things at once: how much of the
            photograph is in view, and how far the button stands from the card
            below it. 212px leaves 140px of air under the button once the card
            has lapped 72px back up over it. */}
        {/* Below 1024 the words sit against the foot of the hero, which is what
            turns the gap under the button into a number instead of a
            leftover. The hero is a screen tall there and the words are not, so
            whatever they did not use was falling below them: measured 355px of
            empty photograph at 390 and 265px at 360, on the same page. Pushed
            to the foot, the gap is this padding less the card's own 64px of
            overlap, which is 126px at every width.

            `justify-end` on the hero and not `items-end` here: the section is a
            block inside it, so aligning within the section moves nothing. What
            had to move was the section itself. */}
        {/* The bottom padding is what stands between the button and the card
            that laps back over the hero, because the card is pulled up by a
            fixed amount: the gap a reader sees is this number minus that one.
            Measured before changing it, the gap ran 70px on a phone, 98 at
            768 and 140 at 1440, so the narrow end was half of what the wide
            end had and the button sat almost against the card.

            Raised to 110 and 128, leaving 1440 alone because it was already
            the roomiest of the three.

            Note the two ends do it differently. Below 1024 the hero is a
            bottom-anchored flex column of a fixed height, so a bigger pad
            lifts the type off the floor. At 1024 the hero is an ordinary
            block, so the same change lengthens the hero and lowers the card
            instead. Either way the two are further apart, but only the phone
            actually moves its words. */}
        <Section className="relative grid w-full grid-cols-1 items-center gap-10 pt-[112px] pb-[260px] md:pt-[128px] md:pb-[220px] lg:pb-[212px]">
          <div
            data-reveal
            /* Above 1024 these words are on the photograph and go white with
               it. Below 1024 the picture is a band further down and they stay
               ink on the pale ground. */
            {...(hasHeroPhoto ? { "data-on-photo": "" } : {})}
            className="relative max-w-[600px]"
          >
            <div className="relative">
            {/* The place line that used to stand above the headline is gone.
                It read "Yenbuba · Pulau Mansuar · Raja Ampat", and the
                sentence directly under the headline already says where this
                is, so the pill was the same fact twice with the photograph
                behind it saying it a third time.

                No top margin on the headline any more: the margin existed to
                hold it off the pill, and left in place it would open a gap
                above the first thing on the page. */}
            {/* `text-balance` evens the lines out rather than filling each one
                to the edge, which is what stops a three-line headline ending
                on a single orphaned word. The place name carries a
                non-breaking space of its own: balancing decides where lines
                may break, not that "Raja Ampat" is one thing. */}
            <h1 data-ink className="mt-0 mb-0 text-[clamp(38px,6vw,68px)] leading-[1.02] font-bold tracking-[-.035em] text-balance text-eddo-ink">
              {t.hero.title}
              <br />
              {/* A step darker than the teal the rest of the page uses for
                  this line. On white either reads; on the hazy photograph the
                  lighter one measured 2.53:1 against 3 needed, and the fix was
                  a darker word rather than more white over the picture. */}
              <span data-ink-script className="font-script font-normal tracking-normal text-eddo-dark">
                {t.hero.script}
              </span>
            </h1>
            {/* Full ink, not the body grey the rest of the page uses. That
                grey was chosen to sit on white; here it sits on a photograph
                under a light haze, where it measured 4.21:1 against 4.5
                needed. Ink passes with room to spare and lets the haze stay
                as faint as it is. */}
            <p data-ink className="mt-5 max-w-[480px] text-[15px] leading-[1.7] text-eddo-ink">
              {t.hero.sub}
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <a href="#kamar" className={BTN_ON_PHOTO}>
                {t.hero.cta}
                <span aria-hidden="true">→</span>
              </a>
            </div>
            </div>
          </div>

        </Section>

      </div>

      {/* ------------------------------------------------ reasons card */}
      {/* In flow and pulled up over the hero's foot by a fixed margin, rather
          than positioned absolutely: the overlap is then the same whatever
          height the card takes on a phone, nothing clips it, and whatever
          follows simply starts after it.

          It held a search bar until now. The four reasons were a plain row
          under it; in the card they are the first thing the hero hands over
          to, which is what the reader is actually deciding on at this point. */}
      {/* How far the card laps back over the hero: half its own height, so the
          hero's edge crosses the middle of it. The card is three shapes at
          three widths, so the number is three numbers. Measured, both
          languages: 303px tall on a phone, 187px at 768, 121 to 142 at 1440.
          The desktop value was already half and has not moved. */}
      <div className="relative z-10 -mt-[150px] px-5 md:-mt-[92px] md:px-8 lg:-mt-[72px]">
        <div
          data-reveal
          style={step(2)}
          className="mx-auto grid max-w-[1180px] grid-cols-1 gap-5 rounded-[22px] border border-eddo-line bg-surface p-5 shadow-[0_24px_60px_-28px_rgba(18,52,58,.35)] sm:grid-cols-2 md:p-7 lg:grid-cols-4 lg:gap-7">
          {t.trust.map((x, i) => (
            <div key={i} className="flex items-start gap-[14px]">
              <span className="flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-full bg-eddo-tint p-[12px] text-eddo-deep">
                {TRUST_ICONS[i]}
              </span>
              <span>
                <span className="block text-[14px] font-bold text-eddo-ink">{x.title}</span>
                <span className="mt-[3px] block text-[12.5px] leading-[1.55] text-slate">{x.sub}</span>
              </span>
            </div>
          ))}
        </div>
      </div>


      {/* ---------------------------------------------------------- rooms */}
      <Section id="kamar" className="pt-20 md:pt-24">
        <div data-reveal className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <Eyebrow>{t.rooms.eyebrow}</Eyebrow>
            <Title plain={t.rooms.title} script={t.rooms.script} className="mt-4 text-[clamp(30px,4.6vw,48px)]" />
          </div>
          <div className="max-w-[380px]">
            {/* Inside the right-hand block rather than as a third thing in the
                row. A row of three has the heading, the drawing and the price
                note all competing for the same width, and the heading is forty
                eight pixels tall in seven languages: German would have pushed
                one of them onto its own line at every size between the phone
                and the desktop. Here it only ever adds height. */}
            <HouseArt className={`${ART_BOX} mb-4 w-[200px] lg:w-[240px]`} />
            <p className="m-0 text-[14px] leading-[1.6] text-slate">{t.rooms.intro}</p>
            <div className="mt-3">
              <CurrencySwitch currency={currency} onPick={pickCurrency} srLabel={t.currencyLabel} tone="dark" />
            </div>
          </div>
        </div>

        {/* Photographs on one side, what a night buys on the other. The price
            is the biggest thing in the column and the only teal figure on the
            page, because "what does it cost" is the question this section
            exists to answer and nobody should have to hunt for it. */}
        <div className="mt-9 grid grid-cols-1 items-start gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,.95fr)] lg:gap-10">
          <div data-reveal>
            <RoomCarousel
              photos={roomPhotos}
              alt={t.rooms.photoAlt}
              prev={t.rooms.prev}
              next={t.rooms.next}
              counter={t.rooms.photoAlt}
            />

            {/* Under the photographs rather than in a section of its own: the
                question it answers, when to come, is asked while looking at
                the place and deciding, not three screens later. */}
            <div className="mt-5 rounded-[20px] border border-eddo-line bg-eddo-wash p-5">
              <h4 className="m-0 text-[15px] font-bold tracking-[-.01em] text-eddo-ink">{t.season.title}</h4>
              <p className="mt-1 mb-0 text-[12.5px] leading-[1.55] text-slate">{t.season.note}</p>
              <ul className="mt-4 mb-0 flex list-none flex-col gap-[14px] p-0">
                {t.season.bands.map((s, i) => (
                  <li key={s.label} className="flex gap-[12px]">
                    {/* Three bars, filling less as the sea gets worse: the
                        ranking is the point, and a reader who skips the words
                        still gets it. */}
                    <span aria-hidden="true" className="mt-[5px] flex shrink-0 flex-col gap-[3px]">
                      {[0, 1, 2].map((n) => (
                        <span
                          key={n}
                          className={`block h-[3px] w-[16px] rounded-full ${n <= 2 - i ? "bg-eddo-deep" : "bg-eddo-line"}`}
                        />
                      ))}
                    </span>
                    <span>
                      <span className="flex flex-wrap items-baseline gap-x-[8px]">
                        <span className="text-[13.5px] font-bold text-eddo-ink">{s.label}</span>
                        <span className="font-mono text-[11.5px] text-eddo-deep">{s.months}</span>
                      </span>
                      <span className="mt-[2px] block text-[12.5px] leading-[1.5] text-slate">{s.note}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div data-reveal style={step(1)} className="rounded-[24px] border border-line bg-surface p-6 shadow-[0_18px_40px_-30px_rgba(18,52,58,.35)] md:p-7">
            <span className="inline-flex items-center gap-[7px] rounded-full bg-eddo-tint px-[12px] py-[5px] text-[12px] font-medium text-eddo-deep">
              {t.rooms.count(rooms.count)}
            </span>
            <h3 className="mt-4 mb-0 text-[24px] leading-[1.15] font-bold tracking-[-.02em] text-eddo-ink">
              {t.rooms.name}
            </h3>
            <p className="mt-2 mb-0 text-[14px] leading-[1.6] text-slate">{t.rooms.blurb}</p>

            <ul className="mt-5 mb-0 grid list-none grid-cols-1 gap-x-4 gap-y-[11px] p-0 sm:grid-cols-2">
              {INCLUDED_KEYS.map((k) => (
                <li key={k} className="flex items-start gap-[10px] text-[13.5px] leading-[1.45] text-ink-soft">
                  <svg
                    viewBox="0 0 24 24"
                    width="17"
                    height="17"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                    className="mt-[2px] shrink-0 text-eddo-deep"
                  >
                    {INCLUDED_ICONS[k]}
                  </svg>
                  {t.rooms.included[k]}
                </li>
              ))}
            </ul>

            <div className="mt-6 flex flex-wrap items-end justify-between gap-3 border-t border-line pt-5">
              <Price
                rupiah={rooms.rate}
                lang={t.htmlLang}
                currency={currency}
                rates={rates}
                size="xl"
                className="text-eddo-deep"
              />
              <span className="pb-[2px] text-[13px] text-slate">{t.rooms.perNight}</span>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <label className={`flex flex-col gap-[4px] rounded-[14px] border px-[14px] py-[9px] text-[11px] font-medium text-slate ${stayMark("when")}`}>
                {t.rooms.checkIn}
                <input
                  type="date"
                  value={stayFrom}
                  min={today}
                  onChange={(e) => {
                    setStayMissing((m) => {
                      if (!m.has("when") && !m.has("to")) return m;
                      const n = new Set(m);
                      n.delete("when");
                      /* Moving the arrival can make a check-out that was fine
                         wrong and one that was wrong fine, so its complaint is
                         withdrawn here and worked out again on the next press
                         rather than left standing against a date nobody has
                         touched. */
                      n.delete("to");
                      return n;
                    });
                    setStayFrom(e.target.value);
                  }}
                  className="border-none bg-transparent p-0 text-[14px] font-medium text-eddo-ink outline-none"
                />
                {stayNote("when")}
              </label>
              <label className={`flex flex-col gap-[4px] rounded-[14px] border px-[14px] py-[9px] text-[11px] font-medium text-slate ${stayMark("to")}`}>
                {t.rooms.checkOut}
                <input
                  type="date"
                  value={stayTo}
                  /* The day after arrival at the earliest and thirty nights
                     after it at the latest, so the picker itself rules out
                     most of what the check below would have to catch. */
                  min={stayFrom ? shiftDay(stayFrom, 1) : today}
                  max={stayFrom ? shiftDay(stayFrom, MAX_SPAN) : undefined}
                  onChange={(e) => {
                    setStayMissing((m) => {
                      if (!m.has("to")) return m;
                      const n = new Set(m);
                      n.delete("to");
                      return n;
                    });
                    setStayTo(e.target.value);
                  }}
                  className="border-none bg-transparent p-0 text-[14px] font-medium text-eddo-ink outline-none"
                />
                {stayMissing.has("to") && (
                  <span className="mt-[2px] block text-[11px] font-normal text-danger">
                    {stayTo ? t.rooms.stayRange : t.services.required}
                  </span>
                )}
              </label>
              <label className="flex flex-col gap-[4px] rounded-[14px] border px-[14px] py-[9px] text-[11px] font-medium text-slate border-line-strong">
                {t.rooms.guests}
                <select
                  value={guests}
                  onChange={(e) => setGuests(Number(e.target.value))}
                  className="cursor-pointer border-none bg-transparent p-0 text-[14px] font-medium text-eddo-ink outline-none"
                >
                  {[1, 2, 3, 4, 5, 6].map((n) => (
                    <option key={n} value={n}>{t.rooms.guestsValue(n)}</option>
                  ))}
                </select>
              </label>
            </div>

            {/* What the two dates came to, next to the boxes that produced it
                rather than beside the total, because this is the page answering
                the question the second date just asked. */}
            {stayNights > 0 && (
              <p className="mt-[10px] mb-0 text-[12.5px] text-slate">
                {t.rooms.nights}: <span className="font-medium text-eddo-ink">{t.rooms.nightsValue(stayNights)}</span>
              </p>
            )}

            {/* Name, WhatsApp and email, three boxes and all three asked for.
                It used to be two, with the second reading "WhatsApp or email"
                and taking whichever arrived; that hands the family one of the
                two at random, and they need the number to answer on and the
                address to key the booking by. */}
            {canPay && (
              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
                {(
                  [
                    ["name", t.rooms.yourName, payName, setPayName, undefined, undefined],
                    ["phone", t.enquiry.phone, payPhone, setPayPhone, t.enquiry.phonePlaceholder, "tel"],
                    ["email", t.enquiry.email, payEmail, setPayEmail, t.enquiry.emailPlaceholder, "email"],
                  ] as const
                ).map(([key, label, value, set, placeholder, mode]) => (
                  <label key={key} className={`flex flex-col gap-[4px] rounded-[14px] border px-[14px] py-[9px] text-[11px] font-medium text-slate ${stayMark(key)}`}>
                    {label}
                    <input
                      value={value}
                      placeholder={placeholder}
                      inputMode={mode}
                      autoComplete={mode === "tel" ? "tel" : mode === "email" ? "email" : "name"}
                      onChange={(e) => {
                        setStayMissing((m) => {
                          if (!m.has(key)) return m;
                          const n = new Set(m);
                          n.delete(key);
                          return n;
                        });
                        set(e.target.value);
                      }}
                      className="w-full min-w-0 border-none bg-transparent p-0 text-[14px] font-medium text-eddo-ink outline-none"
                    />
                    {stayNote(key)}
                  </label>
                ))}
              </div>
            )}

            <div className="mt-4 flex items-baseline justify-between gap-3">
              <span className="text-[13px] text-slate">{t.rooms.total}</span>
              <Price
                rupiah={rooms.rate * nights}
                lang={t.htmlLang}
                currency={currency}
                rates={rates}
                className="text-right text-eddo-ink"
              />
            </div>

            {/* One button, and which one it is depends on whether the keys are
                there. Without them there is nothing to pay through, so it asks
                — not as an alternative anybody chose, but because a button
                that can do nothing is worse than a button that does the other
                thing. With the keys set, which is how the site is deployed,
                this is only ever the pay button. */}
            <button
              type="button"
              onClick={() => (canPay ? startPayment() : ask("stay", t.rooms.ctaNote(t.rooms.name)))}
              className={`${BTN} mt-5 w-full disabled:cursor-wait disabled:opacity-70`}
            >
              {canPay ? t.rooms.pay : t.rooms.cta}
            </button>
            {stayFailed && (
              <p className="mt-3 mb-0 rounded-[10px] bg-danger-tint px-[13px] py-[10px] text-[12.5px] leading-[1.5] text-danger-deep">
                {t.services.checkoutFailed}
              </p>
            )}
            {/* The line under the button describes the button that is there,
                not the one that would be there with keys set. */}
            <p className="mt-3 mb-0 text-center text-[12px] leading-[1.5] text-slate-soft">
              {canPay ? t.rooms.payNote : t.rooms.askNote}
            </p>
          </div>
        </div>
      </Section>

      {/* --------------------------------------------------------- around */}
      <Section id="sekitar" className="pt-20 md:pt-24">
        <div data-reveal className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <Eyebrow>{t.around.eyebrow}</Eyebrow>
            <h2 className="mt-4 mb-0 text-[clamp(30px,4.6vw,48px)] leading-[1.05] font-bold tracking-[-.03em] text-eddo-ink">{t.around.title}</h2>
          </div>
          {/* Where the button used to be, and longer for having the corner to
              itself: three islands and a headland instead of two islands. */}
          <IslandArt className={`${ART_BOX} w-[280px] lg:w-[440px]`} />
        </div>

        <div className="mt-9 grid grid-cols-2 gap-4 lg:grid-cols-4 md:gap-5">
          {t.around.places.map((p, i) => (
            <article key={i} data-reveal style={step(i)} className="group relative aspect-[3/4] overflow-hidden rounded-[22px] bg-eddo-tint">
              {i === 0 ? <ReefScene className={FILL} /> : i === 1 ? <IsletScene className={FILL} warm /> : i === 2 ? <JettyScene className={FILL} /> : <IsletScene className={FILL} />}
              <Photo src={`/eddo-around-${i + 1}.jpg`} alt={p.alt} />
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(18,52,58,0)_40%,rgba(18,52,58,.78)_100%)]" />
              <span className="absolute top-3 left-3 rounded-full bg-white/92 px-[10px] py-[5px] text-[11px] font-medium text-eddo-ink">{p.tag}</span>
              <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 p-4 text-white">
                <div className="min-w-0">
                  <div className="text-[15px] leading-[1.15] font-bold">{p.name}</div>
                  <div className="mt-[3px] truncate text-[11.5px] text-white/80">{p.where}</div>
                </div>
                <div className="shrink-0 text-right font-mono text-[10.5px] leading-[1.3] text-white/85">{p.time}</div>
              </div>
            </article>
          ))}
        </div>
        {/* The note and the way to ask, on one line at the foot of the
            section. The button was at the top beside the heading, where it
            asked the reader to decide before they had seen anything; down here
            it comes after the four places, which is when somebody actually
            wants it. */}
        <div
          data-reveal
          className="mt-5 flex flex-col items-start gap-5 sm:flex-row sm:items-end sm:justify-between sm:gap-8"
        >
          <p className="m-0 max-w-[720px] text-[13px] leading-[1.6] text-slate">{t.around.note}</p>
          {/* Not "snorkeling": the button is about a day arranged from the
              house rather than one activity, and the whole-day excursion is
              the nearest thing on the list to that. */}
          <button
            type="button"
            onClick={() => ask("excursion", t.around.all)}
            className={`${BTN_GHOST} shrink-0`}
          >
            {t.around.all}
            <span aria-hidden="true">→</span>
          </button>
        </div>
      </Section>

      {/* ------------------------------------------------------- services */}
      {/*
       * Nine things the family arranges besides the house, one open at a time.
       *
       * The list and the panel rather than nine cards: nine cards is a wall,
       * and a reader who wants a motorbike has to read about diving to find it.
       * A list is scanned in a second and only the one thing asked for is read.
       *
       * Below 1024 the list turns on its side and scrolls. A column of nine on
       * a phone would put the panel a whole screen below the thing that
       * changes it, so pressing an item would move something the reader cannot
       * see. Sideways keeps both in view, which is the only arrangement where
       * pressing one of these means anything.
       */}
      <Section id="layanan" className="pt-20 md:pt-24">
        <div data-reveal>
          <Eyebrow>{t.services.eyebrow}</Eyebrow>
          <Title
            plain={t.services.title}
            script={t.services.script}
            className="mt-4 text-[clamp(30px,4.6vw,48px)]"
          />
          {/* The drawing beside the opening paragraph rather than under the
              heading. This heading runs the whole width on a wide screen and
              the paragraph stops at 640, which left a bare quarter of the page
              to the right of it. */}
          <div className="mt-5 flex flex-col items-start gap-6 md:flex-row md:items-end md:justify-between md:gap-10">
            <p className="m-0 max-w-[640px] text-[14.5px] leading-[1.7] text-slate">
              {t.services.intro}
            </p>
            <BoatArt className={`${ART_BOX} w-[220px] lg:w-[300px]`} />
          </div>
        </div>

        <div
          data-reveal
          style={step(1)}
          className="mt-9 grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,320px)_1fr] lg:gap-8"
        >
          <div
            role="tablist"
            aria-label={t.services.eyebrow}
            className="scrollbar-none -mx-5 flex gap-[8px] overflow-x-auto px-5 lg:mx-0 lg:flex-col lg:gap-[4px] lg:overflow-visible lg:px-0"
          >
            {SERVICE_KEYS.map((k) => {
              const on = service === k;
              return (
                <button
                  key={k}
                  type="button"
                  role="tab"
                  aria-selected={on}
                  onClick={() => setService(k)}
                  className={`flex shrink-0 cursor-pointer items-center gap-[11px] rounded-full border-none px-[16px] py-[13px] text-left text-[14px] whitespace-nowrap transition-colors lg:w-full lg:rounded-[14px] lg:whitespace-normal ${
                    on
                      ? "bg-eddo-deep font-medium text-white"
                      : "bg-eddo-tint text-eddo-ink hover:bg-eddo-line lg:bg-transparent lg:hover:bg-eddo-tint"
                  }`}
                >
                  <span className="flex h-[20px] w-[20px] shrink-0 items-center justify-center">
                    <span className="scale-[.78]">{SERVICE_ICONS[k]}</span>
                  </span>
                  {t.services.items[k].title}
                </button>
              );
            })}
          </div>

          {/* Keyed on the open service so the panel is a new element each time
              and the little settling animation runs again. Deliberately without
              `data-reveal`: that is handed out once on mount, so an element
              that appears later is never observed and would stay hidden. */}
          <div
            key={service}
            role="tabpanel"
            className="animate-pop-in rounded-[24px] border border-eddo-line bg-eddo-wash p-7 md:p-9"
          >
            {/* No glyph above the title. The same drawing is in the list to
                the left, on the row that is lit, and repeating it here said
                nothing the reader did not just press. What it did do was push
                the heading down by most of an inch. */}
            <h3 className="m-0 text-[clamp(19px,2.2vw,24px)] leading-[1.2] font-bold tracking-[-.02em] text-eddo-ink">
              {t.services.items[service].title}
            </h3>
            <p className="mt-3 mb-0 max-w-[54ch] text-[14.5px] leading-[1.75] text-slate">
              {t.services.items[service].body}
            </p>
            {/* Only when the service has nothing listed under it.
 
                With products below, every card carries its own button and this
                one was a second way to say the same thing, sitting above them
                in a louder colour: the reader has to decide which of the two is
                the real one before they can ask about anything. Without
                products, it is the only way to ask at all, so it stays. */}
            {products.length === 0 && (
              <button
                type="button"
                onClick={() => ask(service, t.services.items[service].title)}
                className={`${BTN} mt-7`}
              >
                {t.services.cta}
                <span aria-hidden="true">→</span>
              </button>
            )}

            {/* What the owner has actually listed under this service.
 
                Nothing is a normal answer and the commonest one today: the
                description above was written to stand on its own, and a service
                with no products simply ends there. What is not done is invent a
                card, because a price on a page is a promise and a stock photo
                of somebody else's scooter is a different promise. */}
            {products.length > 0 && (
              <div className={`mt-7 grid gap-4 ${productGrid}`}>
                {products.map((x) => (
                  <article
                    key={x.id}
                    className={`flex overflow-hidden rounded-[18px] border border-eddo-line bg-surface ${
                      solo ? "flex-col sm:flex-row" : "flex-col"
                    }`}
                  >
                    <div
                      className={`relative flex items-center justify-center bg-eddo-tint ${
                        solo
                          ? "aspect-[4/3] sm:aspect-auto sm:min-h-[230px] sm:w-[40%] sm:shrink-0"
                          : "aspect-[4/3]"
                      }`}
                    >
                      {x.photo ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={x.photo}
                          alt={pickText(x.name, lang)}
                          loading="lazy"
                          decoding="async"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        /* The glyph for its kind, at size, rather than an empty
                           grey box. A card with a hole in it reads as broken;
                           a card with a drawing reads as one whose photograph
                           has not been taken, which is the truth. */
                        <span className="flex flex-col items-center gap-[10px] px-3 text-center">
                          <span className="flex scale-[1.7] items-center justify-center text-eddo-deep/70">
                            {SERVICE_ICONS[service]}
                          </span>
                          <span className="text-[11.5px] leading-[1.35] text-eddo-deep/70">
                            {t.services.noPhoto}
                          </span>
                        </span>
                      )}
                    </div>

                    <div className={`flex flex-1 flex-col p-[16px] ${solo ? "sm:p-[22px]" : ""}`}>
                      <h4 className="m-0 text-[15px] leading-[1.25] font-bold text-eddo-ink">
                        {pickText(x.name, lang)}
                      </h4>

                      {x.specs && x.specs.length > 0 && (
                        <dl className="mt-[10px] mb-0 grid grid-cols-[auto_1fr] gap-x-3 gap-y-[5px] text-[12.5px] leading-[1.45]">
                          {x.specs.map((sp, i) => (
                            <Fragment key={i}>
                              <dt className="text-slate-mute">
                                {isSpecKey(sp.key) ? t.services.spec[sp.key] : sp.key}
                              </dt>
                              <dd className="m-0 text-ink-soft">{pickText(sp.value, lang)}</dd>
                            </Fragment>
                          ))}
                        </dl>
                      )}

                      {/* Pushed to the foot so the prices line up across a row
                          whatever length the spec lists happen to be. */}
                      <div className="mt-auto pt-[14px]">
                        {typeof x.price === "number" ? (
                          <div className="flex items-baseline gap-[6px]">
                            <Price
                              rupiah={x.price}
                              lang={t.htmlLang}
                              currency={currency}
                              rates={rates}
                              size="sm"
                              className="text-eddo-deep"
                            />
                            {x.unit && isPriceUnit(x.unit) && (
                              <span className="text-[12px] text-slate-mute">
                                {t.services.per[x.unit]}
                              </span>
                            )}
                          </div>
                        ) : null}

                        {/* One button either way. With a price it opens the
                            checkout and asks for the day and the name; without
                            one it opens the enquiry, because there is nothing
                            to charge yet. The fields that used to sit here
                            moved into the dialog: a card two hundred pixels
                            across is a poor place to fill in a date, and they
                            never asked who was buying. */}
                        <button
                          type="button"
                          onClick={() =>
                            canBuy(x)
                              ? setBuying({ service, product: x })
                              : ask(
                                  service,
                                  `${t.services.items[service].title}, ${pickText(x.name, lang)}`,
                                )
                          }
                          className={`${canBuy(x) ? BTN : BTN_GHOST} mt-[12px] w-full px-[14px] py-[10px] text-[13px]`}
                        >
                          {canBuy(x)
                            ? t.services.pay
                            : typeof x.price === "number"
                              ? t.services.ask
                              : t.services.askPrice}
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </div>

        <p data-reveal className="mt-6 max-w-[760px] text-[13px] leading-[1.7] text-slate">
          {t.services.note}
        </p>
      </Section>

      {/* ------------------------------------------------------------ why */}
      <Section id="kenapa" className="pt-20 md:pt-24">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_1fr] lg:gap-12">
          <div>
            <div data-reveal>
              <Title plain={t.why.title} script={t.why.script} className="text-[clamp(30px,4.6vw,48px)]" />
            </div>
            <div className="mt-8 grid grid-cols-1 gap-x-8 gap-y-7 sm:grid-cols-2">
              {t.why.items.map((x, i) => (
                <div key={i} data-reveal style={step(i)} className="flex items-start gap-[14px]">
                  <span className="mt-[2px] flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-full bg-eddo-tint font-mono text-[12px] text-eddo-deep">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span>
                    <span className="block text-[14.5px] font-bold text-eddo-ink">{x.title}</span>
                    <span className="mt-[4px] block text-[13px] leading-[1.6] text-slate">{x.sub}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div data-reveal style={step(2)} className="relative min-h-[320px] overflow-hidden rounded-[26px] bg-eddo-ink">
            <SnorkelScene className={`${FILL} object-cover opacity-90`} />
            <Photo
              src="/eddo-cta.webp"
              narrow="/eddo-cta-720.webp"
              sizes="(min-width: 1024px) 590px, calc(100vw - 40px)"
              alt={t.why.cta.alt}
            />
            <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(18,52,58,.88)_0%,rgba(18,52,58,.55)_60%,rgba(18,52,58,.25)_100%)]" />
            <div className="relative flex h-full flex-col justify-center p-8 text-white md:p-10">
              <span className="font-mono text-[10.5px] tracking-[.12em] text-white/75 uppercase">{t.why.cta.eyebrow}</span>
              <h3 className="mt-3 mb-0 max-w-[16ch] text-[clamp(24px,3.2vw,34px)] leading-[1.1] font-bold tracking-[-.02em]">{t.why.cta.title}</h3>
              <p className="mt-3 max-w-[360px] text-[14px] leading-[1.65] text-white/85">{t.why.cta.body}</p>
              {/* On a photograph as well, so the same white. Measured teal on
                  teal at 1.09:1 wide and 1.07:1 on a phone, which is the hero's
                  problem in a second place rather than a new one. */}
              <button
                type="button"
                onClick={() => setEnquiryOpen(true)}
                className={`${BTN_ON_PHOTO} mt-6 w-fit`}
              >
                {t.why.cta.button}
                <span aria-hidden="true">→</span>
              </button>
            </div>
          </div>
        </div>
      </Section>

      {/* ------------------------------------------------------------ faq */}
      <Section id="tanya" className="pt-20 pb-20 md:pt-24 md:pb-24">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-[minmax(220px,320px)_1fr]">
          <div data-reveal>
            <Eyebrow>{t.faq.eyebrow}</Eyebrow>
            <h2 className="mt-4 mb-0 text-[clamp(28px,4vw,42px)] leading-[1.08] font-bold tracking-[-.025em] text-eddo-ink">{t.faq.title}</h2>
            {/* This column holds a heading and nothing else while the answers
                run down the far side of the page, so on anything wider than a
                phone it is the emptiest space on the site. */}
            <TurtleArt className={`${ART_BOX} mt-8 w-[220px] lg:w-[270px]`} />
          </div>
          <div className="border-t border-line-strong">
            {t.faq.items.map((f, i) => (
              <details key={i} data-reveal style={step(i)} className="group border-b border-line-strong py-[18px]">
                <summary className="flex cursor-pointer list-none items-center gap-4 text-[16px] font-medium text-eddo-ink">
                  <span className="flex-1">{f.q}</span>
                  <span className="text-[20px] leading-none text-eddo-deep transition-transform group-open:rotate-45">+</span>
                </summary>
                <p className="mt-3 mb-0 max-w-[640px] text-[14px] leading-[1.65] text-slate">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </Section>

      {/* -------------------------------------------------- contact bar */}
      <Section className="pb-10">
        <div data-reveal className="flex flex-col gap-6 rounded-[24px] bg-eddo-deep px-7 py-7 text-white md:flex-row md:items-center md:justify-between md:px-10">
          <div className="flex items-start gap-4">
            <span className="mt-[2px] hidden h-[44px] w-[44px] shrink-0 items-center justify-center rounded-full bg-white/15 p-[11px] sm:flex">
              <MailIcon />
            </span>
            <div>
              <div className="text-[18px] leading-[1.2] font-bold">{t.contact.title}</div>
              <div className="mt-[4px] text-[13px] text-white/85">{t.contact.sub}</div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <a href={waLink("Halo Eddo Homestay")} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full bg-white px-[18px] py-[11px] text-[13.5px] font-medium text-eddo-ink no-underline hover:bg-eddo-tint hover:no-underline">
              <span className="h-[16px] w-[16px]"><WhatsAppIcon /></span>
              {t.contact.whatsapp}
            </a>
            <a href={`mailto:${EMAIL}`} className="inline-flex items-center gap-2 rounded-full border border-white/45 px-[18px] py-[11px] text-[13.5px] font-medium text-white no-underline hover:bg-white/12 hover:text-white hover:no-underline">
              {t.contact.email}
            </a>
            <div className="flex items-center gap-2">
              {SOCIALS.map((x) =>
                x.href ? (
                  <a key={x.name} href={x.href} target="_blank" rel="noreferrer" aria-label={x.name} className="flex h-[38px] w-[38px] items-center justify-center rounded-full border border-white/35 bg-white/10 p-[10px] text-white no-underline hover:bg-white/25 hover:no-underline">
                    {x.icon}
                  </a>
                ) : (
                  <span key={x.name} aria-hidden="true" title={x.name} className="flex h-[38px] w-[38px] items-center justify-center rounded-full border border-white/20 bg-white/5 p-[10px] text-white/50">
                    {x.icon}
                  </span>
                ),
              )}
            </div>
          </div>
        </div>
      </Section>

      {/* --------------------------------------------------------- footer */}
      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-[1180px] flex-col gap-5 px-5 py-8 md:flex-row md:items-center md:justify-between md:px-8">
          <div>
            <EddoLogo size={21} />
            <p className="mt-3 mb-0 text-[13px] text-slate">{t.footer.tagline}</p>
          </div>
          <div className="text-[12.5px] leading-[1.7] text-slate md:text-right">
            <div>
              {t.footer.sister}{" "}
              <Link href={sisterHref} className="font-medium text-eddo-deep no-underline hover:underline">
                {t.footer.sisterLink}
              </Link>
            </div>
            <div className="text-slate-soft">
              © {new Date().getFullYear()} {EDDO.name}, {EDDO.village}. {t.footer.rights}
            </div>
          </div>
        </div>
      </footer>

      {/* The checkout, which only exists while something is being bought. Its
          labels are the ones already on the page rather than a second set: the
          button that opened it, the fields the room panel uses, and the word
          the card put beside the price. Three strings are its own. */}
      {buying && (
        <CheckoutModal
          open
          onClose={() => setBuying(null)}
          t={{
            title: t.services.pay,
            intro: t.services.checkoutIntro,
            what: t.services.eyebrow,
            when: t.services.when,
            qty: t.services.qty,
            name: t.rooms.yourName,
            phone: t.enquiry.phone,
            phonePlaceholder: t.enquiry.phonePlaceholder,
            email: t.enquiry.email,
            emailPlaceholder: t.enquiry.emailPlaceholder,
            total: t.rooms.total,
            pay: t.services.pay,
            required: t.services.required,
            failed: t.services.checkoutFailed,
            close: t.enquiry.close,
            way: t.services.way,
            oneWay: t.services.oneWay,
            roundTrip: t.services.roundTrip,
            goDay: t.services.goDay,
            backDay: t.services.backDay,
            fromDay: t.services.fromDay,
            untilDay: t.services.untilDay,
            days: t.services.days,
            daysValue: t.services.daysValue,
            size: t.services.size,
            sizeNote: t.services.sizeNote,
            left: t.services.left,
            soldOut: t.services.soldOut,
          }}
          what={`${t.services.items[buying.service].title} · ${pickText(buying.product.name, lang)}`}
          price={buying.product.price as number}
          returnPrice={buying.product.returnPrice}
          shape={
            isRental(buying.product) ? "rental" : buying.product.unit === "piece" ? "piece" : "dated"
          }
          sizes={buying.product.sizes}
          lang={t.htmlLang}
          currency={currency}
          rates={rates}
          onPay={(o) => payForProduct(buying.service, buying.product, o)}
        />
      )}

      <EnquiryModal
        siteKey="eddo"
        open={enquiryOpen}
        onClose={() => setEnquiryOpen(false)}
        t={{ enquiry: t.enquiry, activities: activityLabels }}
        months={monthsAhead}
        value={enquiry}
        onChange={patch}
        message={message}
        lang={lang}
        activities={EDDO_ACTIVITIES}
        site={EDDO.name}
      />
    </div>
  );
}
