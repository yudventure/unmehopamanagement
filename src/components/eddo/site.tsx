"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

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
import { CurrencySwitch, Price } from "@/components/web/price";
import {
  IsletScene,
  JettyScene,
  ReefScene,
  SnorkelScene,
} from "@/components/web/scenes";
import { useHeroScroll } from "@/hooks/use-hero-scroll";
import { useReveal } from "@/hooks/use-reveal";
import { useCurrency, useLang, useRates } from "@/hooks/use-site-prefs";
import {
  EDDO,
  EDDO_COPY,
  EMAIL,
  STAY_KEYS,
  WHATSAPP,
  eddoRooms,
  waLink,
  type EddoCopy,
} from "@/lib/eddo-content";
import { SITE_CONFIG } from "@/lib/site-config";
import {
  COPY,
  LANGS,
  monthOptions,
  type ActivityKey,
  type Lang,
} from "@/lib/web-content";

/**
 * Eddo Homestay's public site.
 *
 * Same family, same booking manager, a different place: two rooms in a
 * village on Pulau Gam, no dive centre, and a reason to come that is the
 * village itself. The page is built to the shape of a travel site rather than
 * the long photographic scroll `/turtle` uses: a headline beside a picture, a
 * search bar under it, a row of reasons, then the rooms and the places a day
 * can go. That shape is what was asked for, and it suits a small place that
 * has less to say and wants to say it quickly.
 *
 * What is shared with `/turtle` is shared on purpose and nothing more: the
 * enquiry dialog and endpoint, the price and currency controls, the drawn
 * scenes under the photographs, the reveal-on-scroll, and the reader's
 * language and currency choice. The copy, the palette, the type, and the
 * layout are its own.
 */

const MONTH_ANCHOR = new Date(2026, 7, 1);

const SOCIALS = [
  { name: "Instagram", href: SITE_CONFIG.social.instagram, icon: <InstagramIcon /> },
  { name: "Facebook", href: SITE_CONFIG.social.facebook, icon: <FacebookIcon /> },
  { name: "TikTok", href: SITE_CONFIG.social.tiktok, icon: <TikTokIcon /> },
];

const FILL = "absolute inset-0 h-full w-full";

/** A card's place in its row, which the stylesheet turns into a delay. */
const step = (i: number) => ({ "--i": i }) as React.CSSProperties;

/**
 * The badge is taller than it is wide — 164 by 240 in the file — so it is
 * sized by its height and lets its width follow. Forcing it into a square box
 * would fit it to the shorter side and leave a third of the box empty, which
 * on a header reads as a logo that is too small rather than as space.
 */
const LOGO_RATIO = 164 / 240;

/**
 * A transparent pixel, inline so it costs no request.
 *
 * It stands in for the wide hero file below 1024, where that layer is
 * `display: none`. Hiding an `<img>` that way does not stop the browser
 * fetching it: measured, a 390px phone pulled the 1760px file *and* the 900px
 * one, 283kB for a band that shows 65kB of it. A `<picture>` whose only
 * `<source>` is gated on the same width the layer is gated on falls back to
 * this instead, and the phone asks for nothing.
 */
const BLANK_PIXEL =
  "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";

/**
 * The tiki badge from `public/eddo-logo.png`, or the name in type if the file
 * is not there. An `<img>` that fails to load draws a broken-picture glyph
 * where the logo should be, and a header wearing one of those looks
 * abandoned; the wordmark is what the header falls back to.
 */
function EddoLogo({ size = 40, light = false }: { size?: number; light?: boolean }) {
  const [missing, setMissing] = useState(false);
  const ref = useRef<HTMLImageElement>(null);
  /* The page is prerendered, so a file that is not there has already failed
     by the time React attaches `onError`, and that handler never fires. Ask
     the element on mount whether it already gave up. */
  useEffect(() => {
    const img = ref.current;
    if (img && img.complete && img.naturalWidth === 0) setMissing(true);
  }, []);
  return (
    <span className="flex items-center gap-[10px]">
      {!missing && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          ref={ref}
          src="/eddo-logo.png"
          alt=""
          width={Math.round(size * LOGO_RATIO)}
          height={size}
          onError={() => setMissing(true)}
          /* No rounding and no fill of our own: the badge carries its own
             outline and its own shape, so a box drawn around it would be a
             second frame fighting the first. Its ground is transparent, which
             is what lets it sit on the bare header with nothing behind it. */
          className="shrink-0"
          style={{ width: Math.round(size * LOGO_RATIO), height: size }}
        />
      )}
      <span className="leading-[1.05]">
        <span className={`block text-[16px] font-bold tracking-[-.01em] ${light ? "text-white" : "text-eddo-ink"}`}>
          Eddo Homestay
        </span>
        <span className={`block font-mono text-[9.5px] tracking-[.14em] uppercase ${light ? "text-white/70" : "text-eddo-deep"}`}>
          Sawinggrai · Raja Ampat
        </span>
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
function Photo({ src, alt }: { src: string; alt: string }) {
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
    <span className="inline-flex items-center gap-[7px] rounded-full bg-eddo-tint px-[13px] py-[6px] font-mono text-[10.5px] tracking-[.1em] text-eddo-deep uppercase">
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

function LangSwitch({ lang, onPick, label }: { lang: Lang; onPick: (l: Lang) => void; label: string }) {
  return (
    <div className="flex items-center gap-[2px] rounded-full border border-line-strong p-[2px]" aria-label={label}>
      {LANGS.map((l) => (
        <button
          key={l.key}
          type="button"
          lang={l.key}
          onClick={() => onPick(l.key)}
          aria-label={l.label}
          aria-pressed={lang === l.key}
          className={`cursor-pointer rounded-full border-none px-[10px] py-[5px] text-[12px] font-medium transition-colors ${
            /* The unpicked language carries no background of its own, so at
               1024 it is ink straight over the photograph: measured 3.91:1 in
               `text-slate`. Darkened rather than given a wash to sit on. */
            lang === l.key ? "bg-eddo-deep text-white" : "bg-transparent text-ink-soft hover:text-eddo-ink"
          }`}
        >
          {l.short}
        </button>
      ))}
    </div>
  );
}

/* Four glyphs for the reasons row, drawn inline like the footer icons. */
const TRUST_ICONS = [
  <svg key="a" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 12l-8 8-8-8V4h8l8 8z" /><circle cx="8.5" cy="8.5" r="1.4" /></svg>,
  <svg key="b" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 5h16v11H9l-5 4V5z" /><path d="M8 9h8M8 12h5" /></svg>,
  <svg key="c" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 12h18a9 9 0 0 1-18 0z" /><path d="M6 12V9m6 3V6m6 6V9" /></svg>,
  <svg key="d" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 11l9-7 9 7" /><path d="M5 10v10h14V10" /><path d="M10 20v-6h4v6" /></svg>,
];

const BTN =
  "inline-flex cursor-pointer items-center justify-center gap-2 rounded-full border-none bg-eddo-deep px-[22px] py-[12px] text-[14px] font-medium text-white no-underline transition-colors hover:bg-eddo-dark hover:text-white hover:no-underline";
const BTN_GHOST =
  "inline-flex cursor-pointer items-center justify-center gap-2 rounded-full border border-eddo-line bg-surface px-[22px] py-[12px] text-[14px] font-medium text-eddo-ink no-underline transition-colors hover:border-eddo hover:no-underline";

/** Month index into the enquiry's list for a check-in date, if one was picked. */
function monthIndexFor(date: string): number | null {
  if (!date) return null;
  const d = new Date(date + "T00:00:00");
  if (Number.isNaN(d.getTime())) return null;
  const ix = (d.getFullYear() - MONTH_ANCHOR.getFullYear()) * 12 + d.getMonth() - MONTH_ANCHOR.getMonth();
  return Math.min(11, Math.max(0, ix));
}

export function EddoSite({
  maintenance = false,
  sisterHref = "/turtle",
  hasHeroPhoto = false,
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
}) {
  const { lang, pickLang } = useLang();
  const { currency, pickCurrency } = useCurrency();
  const rates = useRates();
  const t: EddoCopy = EDDO_COPY[lang];
  /* The dialog's own labels come from the shared copy: "Name", "WhatsApp",
     "When" are the same words whichever house is being asked about. */
  const shared = COPY[lang];
  const monthsAhead = monthOptions(MONTH_ANCHOR, lang);
  const rooms = eddoRooms();

  useEffect(() => {
    document.documentElement.lang = t.htmlLang;
  }, [t.htmlLang]);

  useReveal();
  const heroRef = useHeroScroll<HTMLDivElement>();

  const [menuOpen, setMenuOpen] = useState(false);

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
  const [enquiry, setEnquiry] = useState<Enquiry>(EMPTY_ENQUIRY);
  const [enquiryOpen, setEnquiryOpen] = useState(false);
  const patch = (p: Partial<Enquiry>) => setEnquiry((prev) => ({ ...prev, ...p }));
  const ask = (activity: ActivityKey, notes: string, extra: Partial<Enquiry> = {}) => {
    patch({ activity, notes, ...extra });
    setEnquiryOpen(true);
  };

  /* The search bar's own fields. Not the dialog's: someone can fill these and
     never press the button, and a later "ask about this room" should not
     carry dates they typed and abandoned. Pressing the button copies them. */
  const [tab, setTab] = useState<(typeof STAY_KEYS)[number]>("stay");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState(2);

  const search = () => {
    const nights =
      checkIn && checkOut
        ? Math.max(1, Math.round((Date.parse(checkOut) - Date.parse(checkIn)) / 86400000))
        : Number(EMPTY_ENQUIRY.nights);
    const ix = monthIndexFor(checkIn);
    ask(tab, t.search.note(t.search.tabs[tab], checkIn, checkOut, guests), {
      people: String(guests),
      nights: String(nights),
      ...(ix === null ? {} : { monthIx: ix }),
    });
  };

  const message = t.message({
    activity: t.activities[enquiry.activity as (typeof STAY_KEYS)[number]] ?? shared.activities[enquiry.activity],
    name: enquiry.name,
    phone: enquiry.phone,
    email: enquiry.email,
    when: monthsAhead[enquiry.monthIx] ?? monthsAhead[0],
    people: enquiry.people,
    nights: enquiry.activity === "stay" ? enquiry.nights : "",
    notes: enquiry.notes,
  });

  const nav = [
    { href: "#atas", label: t.nav.home },
    { href: "#kamar", label: t.nav.rooms },
    { href: "#sekitar", label: t.nav.around },
    { href: "#kenapa", label: t.nav.why },
    { href: "#tanya", label: t.nav.faq },
  ];

  if (maintenance) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-eddo-wash px-5 text-center">
        <div className="max-w-[520px]">
          <EddoLogo size={56} />
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
        className={`fixed inset-x-0 top-0 z-50 border-b transition-[background-color,border-color] duration-300 ${
          barSolid
            ? "border-line bg-surface/80 backdrop-blur-md"
            : /* Nothing at all at rest: no fill, no rule, no blur. */
              "border-transparent bg-transparent"
        }`}
      >
        <div className="mx-auto flex max-w-[1180px] items-center gap-4 px-5 py-[12px] md:px-8">
          <a href="#atas" className="no-underline hover:no-underline">
            <EddoLogo />
          </a>

          <nav className="ml-6 hidden items-center gap-[26px] lg:flex">
            {nav.map((n, i) => (
              <a
                key={n.href}
                href={n.href}
                className={`text-[13.5px] no-underline transition-colors hover:text-eddo-deep hover:no-underline ${
                  i === 0 ? "font-medium text-eddo-deep" : "text-ink-soft"
                }`}
              >
                {n.label}
              </a>
            ))}
          </nav>

          <div className="ml-auto hidden items-center gap-3 md:flex">
            <a
              href={waLink("Halo Eddo Homestay")}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-[10px] no-underline hover:no-underline"
            >
              <span className="flex h-[36px] w-[36px] items-center justify-center rounded-full bg-eddo-tint p-[9px] text-eddo-deep">
                <WhatsAppIcon />
              </span>
              <span className="leading-[1.15]">
                <span className="block text-[10.5px] text-slate">{t.help}</span>
                <span className="block font-mono text-[12.5px] font-medium text-eddo-ink">+{WHATSAPP}</span>
              </span>
            </a>
            <button type="button" onClick={() => setEnquiryOpen(true)} className={BTN}>
              {t.book}
            </button>
            <LangSwitch lang={lang} onPick={pickLang} label={t.langLabel} />
          </div>

          <div className="ml-auto flex items-center gap-2 md:hidden">
            <button type="button" onClick={() => setEnquiryOpen(true)} className={`${BTN} px-[16px] py-[9px] text-[13px]`}>
              {t.book}
            </button>
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              aria-label={t.openMenu}
              aria-expanded={menuOpen}
              className="flex h-[36px] w-[36px] cursor-pointer flex-col items-center justify-center gap-[5px] rounded-full border border-line-strong bg-surface"
            >
              <span className="block h-[1.5px] w-[15px] bg-eddo-ink" />
              <span className="block h-[1.5px] w-[15px] bg-eddo-ink" />
            </button>
          </div>
        </div>

        {menuOpen && (
          <nav className="border-t border-line bg-surface px-5 py-3 md:hidden">
            {nav.map((n) => (
              <a
                key={n.href}
                href={n.href}
                onClick={() => setMenuOpen(false)}
                className="block py-[9px] text-[14px] text-ink-soft no-underline hover:no-underline"
              >
                {n.label}
              </a>
            ))}
            <div className="mt-2 flex items-center justify-between border-t border-line pt-3">
              <a href={waLink("Halo Eddo Homestay")} target="_blank" rel="noreferrer" className="font-mono text-[12.5px] text-eddo-ink no-underline">
                +{WHATSAPP}
              </a>
              <LangSwitch lang={lang} onPick={pickLang} label={t.langLabel} />
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
      <div ref={heroRef} className="relative overflow-hidden bg-eddo-wash">
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
            {/* The picture, edge to edge and top to bottom, with nothing over
                it and nothing cut out of it. The bar has no ground of its own
                at rest, so what is behind its links here is this photograph.

                Below 1024 it leaves the hero altogether and becomes a band of
                its own, further down. It is not a second design for its own
                sake: at 390px there is no room to put words beside a picture,
                and covering one enough to read the other leaves a photograph
                nobody can see, on the phones most guests arrive on. */}
            <div className="absolute inset-0 hidden lg:block">
              {/* The scale lives inside the fade, not on it: a mask scales
                  with the element it is on, so the two together would walk the
                  feather across the paragraph as the reader scrolls. */}
              <div data-hero-photo className="h-full w-full">
                {/* `<picture>` is inline by default, and an inline box has no
                    height for `h-full` to be a percentage of. */}
                <picture className="block h-full w-full">
                  <source media="(min-width: 1024px)" srcSet="/eddo-hero.jpg" />
                  {/* Edge to edge the whole width is in view, so only the
                      vertical crop is a choice. Slightly below centre: the top
                      of the frame is sky the hero does not need, the bottom is
                      the water it does. */}
                  <img
                    src={BLANK_PIXEL}
                    alt={t.hero.alt}
                    className="h-full w-full object-cover object-[center_58%]"
                  />
                </picture>
              </div>
            </div>

            {/* Two gradients, both light. One lifts the side the words are
                on, one lifts the strip the bar sits in. Their strength is not
                a taste: it is the least that keeps ink readable on the darkest
                pixel behind it. Stops and reasoning are in `globals.css`. */}
            <div aria-hidden="true" data-hero-lift className="absolute inset-0 hidden lg:block" />
            <div aria-hidden="true" data-hero-lift-top className="absolute inset-x-0 top-0 hidden lg:block" />
          </>
        )}

        <Section className="relative grid grid-cols-1 items-center gap-10 pt-[112px] pb-12 md:pt-[128px] lg:pb-[104px]">
          <div data-reveal className="relative max-w-[600px]">
            <div className="relative">
            <Eyebrow>{t.hero.eyebrow}</Eyebrow>
            <h1 className="mt-5 mb-0 text-[clamp(38px,6vw,68px)] leading-[1.02] font-bold tracking-[-.035em] text-eddo-ink">
              {t.hero.title}
              <br />
              {/* A step darker than the teal the rest of the page uses for
                  this line. On white either reads; on the hazy photograph the
                  lighter one measured 2.53:1 against 3 needed, and the fix was
                  a darker word rather than more white over the picture. */}
              <span className="font-script font-normal tracking-normal text-eddo-dark">{t.hero.script}</span>
            </h1>
            {/* Full ink, not the body grey the rest of the page uses. That
                grey was chosen to sit on white; here it sits on a photograph
                under a light haze, where it measured 4.21:1 against 4.5
                needed. Ink passes with room to spare and lets the haze stay
                as faint as it is. */}
            <p className="mt-5 max-w-[480px] text-[15px] leading-[1.7] text-eddo-ink">{t.hero.sub}</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <a href="#kamar" className={BTN}>
                {t.hero.cta}
                <span aria-hidden="true">→</span>
              </a>
              <button type="button" onClick={() => setEnquiryOpen(true)} className={BTN_GHOST}>
                {t.book}
              </button>
            </div>
            </div>
          </div>

        </Section>

        {/* The picture's own band below 1024, edge to edge and with nothing
            over it. The search bar that follows laps onto its foot, which is
            what ties the two together rather than leaving a photograph
            stranded between two blocks of white. */}
        {hasHeroPhoto && (
          <div className="relative lg:hidden">
            {/* Two widths. The band is at most 1024 across and usually 390,
                so the desk file would be four times the pixels anybody on a
                phone can see, on the connection least able to afford them. */}
            <img
              src="/eddo-hero-900.jpg"
              srcSet="/eddo-hero-900.jpg 900w, /eddo-hero.jpg 1760w"
              sizes="100vw"
              alt={t.hero.alt}
              className="block h-[240px] w-full object-cover object-[62%_center] sm:h-[320px]"
            />
          </div>
        )}
      </div>

      {/* ------------------------------------------------- search bar */}
      {/* In flow and pulled up over the hero's foot by a fixed margin, rather
          than positioned absolutely: the overlap is then the same whatever
          height the bar takes on a phone, nothing clips it, and whatever
          follows simply starts after it. */}
      <div className="relative z-10 -mt-[64px] px-5 md:-mt-[72px] md:px-8">
          <div data-reveal style={step(2)} className="mx-auto max-w-[1180px] rounded-[22px] border border-eddo-line bg-surface p-4 shadow-[0_24px_60px_-28px_rgba(18,52,58,.35)] md:p-5">
            <div className="flex flex-wrap gap-2">
              {STAY_KEYS.map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setTab(k)}
                  aria-pressed={tab === k}
                  className={`cursor-pointer rounded-full border-none px-[16px] py-[8px] text-[13px] font-medium transition-colors ${
                    tab === k ? "bg-eddo-tint text-eddo-deep" : "bg-transparent text-slate hover:text-eddo-ink"
                  }`}
                >
                  {t.search.tabs[k]}
                </button>
              ))}
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                search();
              }}
              className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_auto]"
            >
              <label className="flex flex-col gap-[4px] rounded-[14px] border border-line-strong px-[14px] py-[9px] text-[11px] font-medium text-slate">
                {t.search.checkIn}
                <input type="date" value={checkIn} onChange={(e) => setCheckIn(e.target.value)} className="border-none bg-transparent p-0 text-[14px] font-medium text-eddo-ink outline-none" />
              </label>
              <label className="flex flex-col gap-[4px] rounded-[14px] border border-line-strong px-[14px] py-[9px] text-[11px] font-medium text-slate">
                {t.search.checkOut}
                <input type="date" value={checkOut} min={checkIn || undefined} onChange={(e) => setCheckOut(e.target.value)} className="border-none bg-transparent p-0 text-[14px] font-medium text-eddo-ink outline-none" />
              </label>
              <label className="flex flex-col gap-[4px] rounded-[14px] border border-line-strong px-[14px] py-[9px] text-[11px] font-medium text-slate">
                {t.search.guests}
                <select value={guests} onChange={(e) => setGuests(Number(e.target.value))} className="cursor-pointer border-none bg-transparent p-0 text-[14px] font-medium text-eddo-ink outline-none">
                  {[1, 2, 3, 4, 5, 6].map((n) => (
                    <option key={n} value={n}>{t.search.guestsValue(n)}</option>
                  ))}
                </select>
              </label>
              <button type="submit" className={`${BTN} h-full min-h-[56px] px-[26px]`}>
                {t.search.go}
              </button>
            </form>
          </div>
      </div>

      {/* ---------------------------------------------------------- trust */}
      <Section className="pt-14 md:pt-16">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {t.trust.map((x, i) => (
            <div key={i} data-reveal style={step(i)} className="flex items-start gap-[14px]">
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
      </Section>

      {/* ---------------------------------------------------------- rooms */}
      <Section id="kamar" className="pt-20 md:pt-24">
        <div data-reveal className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <Eyebrow>{t.rooms.eyebrow}</Eyebrow>
            <Title plain={t.rooms.title} script={t.rooms.script} className="mt-4 text-[clamp(30px,4.6vw,48px)]" />
          </div>
          <div className="max-w-[380px]">
            <p className="m-0 text-[14px] leading-[1.6] text-slate">{t.rooms.intro}</p>
            <div className="mt-3">
              <CurrencySwitch currency={currency} onPick={pickCurrency} srLabel={t.currencyLabel} tone="dark" />
            </div>
          </div>
        </div>

        <div className="mt-9 grid grid-cols-1 gap-6 md:grid-cols-2">
          {rooms.map((r, i) => {
            const rc = t.rooms.types[r.key];
            return (
              <article key={r.key} data-reveal style={step(i)} className="overflow-hidden rounded-[24px] border border-line bg-surface shadow-[0_18px_40px_-30px_rgba(18,52,58,.35)]">
                <div className="relative aspect-[16/10] overflow-hidden bg-eddo-tint">
                  {i === 0 ? <JettyScene className={FILL} /> : <IsletScene className={FILL} warm />}
                  <Photo src={r.photo} alt={rc.alt} />
                  <span className="absolute top-4 left-4 rounded-full bg-white/92 px-[12px] py-[6px] text-[12px] font-medium text-eddo-ink">
                    {t.rooms.sleeps(rc.sleeps)}
                  </span>
                </div>
                <div className="px-6 py-6">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <h3 className="m-0 text-[21px] font-bold tracking-[-.015em] text-eddo-ink">{rc.name}</h3>
                    <div className="text-right">
                      <Price rupiah={r.rate} lang={lang} currency={currency} rates={rates} size="sm" />
                      <div className="text-[11.5px] text-slate-soft">{t.rooms.perNight}</div>
                    </div>
                  </div>
                  <p className="mt-2 text-[14px] leading-[1.6] text-slate">{rc.blurb}</p>
                  <ul className="mt-4 mb-0 grid list-none grid-cols-1 gap-x-4 gap-y-[7px] p-0 sm:grid-cols-2">
                    {rc.features.map((f) => (
                      <li key={f} className="flex items-start gap-[9px] text-[13px] text-ink-soft">
                        <span className="mt-[6px] h-[6px] w-[6px] shrink-0 rounded-full bg-eddo" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <button type="button" onClick={() => ask("stay", t.rooms.ctaNote(rc.name))} className={`${BTN} mt-6 w-full`}>
                    {t.rooms.cta}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </Section>

      {/* --------------------------------------------------------- around */}
      <Section id="sekitar" className="pt-20 md:pt-24">
        <div data-reveal className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <Eyebrow>{t.around.eyebrow}</Eyebrow>
            <h2 className="mt-4 mb-0 text-[clamp(30px,4.6vw,48px)] leading-[1.05] font-bold tracking-[-.03em] text-eddo-ink">{t.around.title}</h2>
          </div>
          <button type="button" onClick={() => ask("snorkeling", t.around.all)} className={BTN_GHOST}>
            {t.around.all}
            <span aria-hidden="true">→</span>
          </button>
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
        <p data-reveal className="mt-5 max-w-[720px] text-[13px] leading-[1.6] text-slate">{t.around.note}</p>
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
            <Photo src="/eddo-cta.jpg" alt={t.why.cta.alt} />
            <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(18,52,58,.88)_0%,rgba(18,52,58,.55)_60%,rgba(18,52,58,.25)_100%)]" />
            <div className="relative flex h-full flex-col justify-center p-8 text-white md:p-10">
              <span className="font-mono text-[10.5px] tracking-[.12em] text-white/75 uppercase">{t.why.cta.eyebrow}</span>
              <h3 className="mt-3 mb-0 max-w-[16ch] text-[clamp(24px,3.2vw,34px)] leading-[1.1] font-bold tracking-[-.02em]">{t.why.cta.title}</h3>
              <p className="mt-3 max-w-[360px] text-[14px] leading-[1.65] text-white/85">{t.why.cta.body}</p>
              <button type="button" onClick={() => setEnquiryOpen(true)} className={`${BTN} mt-6 w-fit`}>
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
            <EddoLogo size={36} />
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

      <EnquiryModal
        open={enquiryOpen}
        onClose={() => setEnquiryOpen(false)}
        t={shared}
        months={monthsAhead}
        value={enquiry}
        onChange={patch}
        message={message}
        lang={lang}
        activities={STAY_KEYS}
        site={EDDO.name}
      />
    </div>
  );
}
