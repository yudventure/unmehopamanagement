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
import { RoomCarousel } from "@/components/eddo/room-carousel";
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
  EDDO_ACTIVITIES,
  INCLUDED_KEYS,
  type EddoActivity,
  type IncludedKey,
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

const SOCIALS = [
  { name: "Instagram", href: SITE_CONFIG.social.instagram, icon: <InstagramIcon /> },
  { name: "Facebook", href: SITE_CONFIG.social.facebook, icon: <FacebookIcon /> },
  { name: "TikTok", href: SITE_CONFIG.social.tiktok, icon: <TikTokIcon /> },
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

declare global {
  interface Window {
    snap?: { pay: (token: string, cb?: Record<string, unknown>) => void };
  }
}

/** Loads Snap once, from wherever the server says its Midtrans lives. */
function loadSnap(src: string) {
  return new Promise<void>((done, fail) => {
    if (window.snap) return done();
    const el = document.createElement("script");
    el.src = src;
    el.setAttribute("data-client-key", MIDTRANS_CLIENT_KEY);
    el.onload = () => done();
    el.onerror = () => fail(new Error("snap-script"));
    document.head.appendChild(el);
  });
}

/**
 * The badge from `public/eddo-logo.png` beside the name.
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
          src="/eddo-logo.png"
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

function LangSwitch({ lang, onPick, label }: { lang: Lang; onPick: (l: Lang) => void; label: string }) {
  return (
    <div
      data-ink-pill
      className="flex items-center gap-[2px] rounded-full border border-line-strong p-[2px]"
      aria-label={label}
    >
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

const BTN =
  "inline-flex cursor-pointer items-center justify-center gap-2 rounded-full border-none bg-eddo-deep px-[22px] py-[12px] text-[14px] font-medium text-white no-underline transition-colors hover:bg-eddo-dark hover:text-white hover:no-underline";
const BTN_GHOST =
  "inline-flex cursor-pointer items-center justify-center gap-2 rounded-full border border-eddo-line bg-surface px-[22px] py-[12px] text-[14px] font-medium text-eddo-ink no-underline transition-colors hover:border-eddo hover:no-underline";

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
  roomPhotos?: string[];
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
  /* The booking fields. They belong to the room panel, not to the dialog: the
     dialog is for asking, and these are for paying. */
  const [stayFrom, setStayFrom] = useState("");
  const [payName, setPayName] = useState("");
  const [payContact, setPayContact] = useState("");
  const [nights, setNights] = useState(2);
  const [guests, setGuests] = useState(2);
  const [paying, setPaying] = useState(false);
  const [enquiry, setEnquiry] = useState<Enquiry>(EMPTY_ENQUIRY);
  const [enquiryOpen, setEnquiryOpen] = useState(false);
  const patch = (p: Partial<Enquiry>) => setEnquiry((prev) => ({ ...prev, ...p }));
  const canPay = Boolean(MIDTRANS_CLIENT_KEY);

  /**
   * Opens Midtrans with an amount the server worked out.
   *
   * Nothing about money leaves this function: the dates and the guest go up,
   * a token comes back. If the server has no keys of its own it answers 503
   * and the reader gets the enquiry form instead of an error, which is the
   * same fallback every other optional service on this site has.
   */
  const startPayment = async () => {
    if (paying) return;
    setPaying(true);
    try {
      const looksEmail = payContact.includes("@");
      const res = await fetch("/api/pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          checkIn: stayFrom,
          nights,
          guests,
          name: payName,
          ...(looksEmail ? { email: payContact } : { phone: payContact }),
        }),
      });
      if (!res.ok) throw new Error(String(res.status));
      const out = (await res.json()) as { token: string; snap: string };
      await loadSnap(out.snap);
      window.snap?.pay(out.token);
    } catch {
      /* A missing key, a refused order, a blocked script: whatever went wrong,
         the reader still wants the house. Hand them the form. */
      ask("stay", t.rooms.ctaNote(t.rooms.name), {
        name: payName,
        ...(payContact.includes("@") ? { email: payContact } : { phone: payContact }),
        people: String(guests),
        nights: String(nights),
      });
    } finally {
      setPaying(false);
    }
  };

  const ask = (activity: ActivityKey, notes: string, extra: Partial<Enquiry> = {}) => {
    patch({ activity, notes, ...extra });
    setEnquiryOpen(true);
  };

  const message = t.message({
    activity: t.activities[enquiry.activity as EddoActivity] ?? shared.activities[enquiry.activity],
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

          {/* Pushed right, so the bar reads as the name on one side and
              everything you can do on the other. `lg:` on the auto margin and
              nothing below it: between 768 and 1024 the nav is not rendered at
              all, and the switch below needs the push instead. */}
          <nav className="hidden items-center gap-[26px] lg:ml-auto lg:flex">
            {nav.map((n, i) => (
              <a
                key={n.href}
                href={n.href}
                data-ink
                className={`text-[13.5px] no-underline transition-colors hover:text-eddo-deep hover:no-underline ${
                  i === 0 ? "font-medium text-eddo-deep" : "text-ink-soft"
                }`}
              >
                {n.label}
              </a>
            ))}
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

          <div className="ml-auto flex items-center gap-2 md:hidden">
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
                  {/* Two crops, because the box is two shapes. Wide, the whole
                      width is in view and only the vertical choice is left:
                      slightly low, since the top of the frame is sky the hero
                      does not need. Narrow, the frame is taller than the
                      photograph and the crop runs the other way, right of
                      centre where the houses and the boat are.

                      The small file is the `<img>` and the wide one a
                      `<source>`, so each screen fetches one and only one. */}
                  <img
                    src="/eddo-hero-900.jpg"
                    alt={t.hero.alt}
                    className="h-full w-full object-cover object-[62%_50%] lg:object-[50%_58%]"
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
        <Section className="relative grid w-full grid-cols-1 items-center gap-10 pt-[112px] pb-[220px] md:pt-[128px] md:pb-[190px] lg:pb-[212px]">
          <div
            data-reveal
            /* Above 1024 these words are on the photograph and go white with
               it. Below 1024 the picture is a band further down and they stay
               ink on the pale ground. */
            {...(hasHeroPhoto ? { "data-on-photo": "" } : {})}
            className="relative max-w-[600px]"
          >
            <div className="relative">
            <Eyebrow>{t.hero.eyebrow}</Eyebrow>
            {/* `text-balance` evens the lines out rather than filling each one
                to the edge, which is what stops a three-line headline ending
                on a single orphaned word. The place name carries a
                non-breaking space of its own: balancing decides where lines
                may break, not that "Raja Ampat" is one thing. */}
            <h1 data-ink className="mt-5 mb-0 text-[clamp(38px,6vw,68px)] leading-[1.02] font-bold tracking-[-.035em] text-balance text-eddo-ink">
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
              <a href="#kamar" className={BTN}>
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
                lang={lang}
                currency={currency}
                rates={rates}
                size="xl"
                className="text-eddo-deep"
              />
              <span className="pb-[2px] text-[13px] text-slate">{t.rooms.perNight}</span>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <label className="flex flex-col gap-[4px] rounded-[14px] border border-line-strong px-[14px] py-[9px] text-[11px] font-medium text-slate">
                {t.rooms.checkIn}
                <input
                  type="date"
                  value={stayFrom}
                  onChange={(e) => setStayFrom(e.target.value)}
                  className="border-none bg-transparent p-0 text-[14px] font-medium text-eddo-ink outline-none"
                />
              </label>
              <label className="flex flex-col gap-[4px] rounded-[14px] border border-line-strong px-[14px] py-[9px] text-[11px] font-medium text-slate">
                {t.rooms.nights}
                <select
                  value={nights}
                  onChange={(e) => setNights(Number(e.target.value))}
                  className="cursor-pointer border-none bg-transparent p-0 text-[14px] font-medium text-eddo-ink outline-none"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 10, 14].map((n) => (
                    <option key={n} value={n}>{t.rooms.nightsValue(n)}</option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-[4px] rounded-[14px] border border-line-strong px-[14px] py-[9px] text-[11px] font-medium text-slate">
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

            {canPay && (
              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="flex flex-col gap-[4px] rounded-[14px] border border-line-strong px-[14px] py-[9px] text-[11px] font-medium text-slate">
                  {t.rooms.yourName}
                  <input
                    value={payName}
                    onChange={(e) => setPayName(e.target.value)}
                    className="border-none bg-transparent p-0 text-[14px] font-medium text-eddo-ink outline-none"
                  />
                </label>
                <label className="flex flex-col gap-[4px] rounded-[14px] border border-line-strong px-[14px] py-[9px] text-[11px] font-medium text-slate">
                  {t.rooms.contact}
                  <input
                    value={payContact}
                    onChange={(e) => setPayContact(e.target.value)}
                    className="border-none bg-transparent p-0 text-[14px] font-medium text-eddo-ink outline-none"
                  />
                </label>
              </div>
            )}

            <div className="mt-4 flex items-baseline justify-between gap-3">
              <span className="text-[13px] text-slate">{t.rooms.total}</span>
              <Price
                rupiah={rooms.rate * nights}
                lang={lang}
                currency={currency}
                rates={rates}
                className="text-right text-eddo-ink"
              />
            </div>

            {/* One button, and which one it is depends on whether the keys are
                there. Without them it asks instead of charging, which is what
                this section did before Midtrans existed on it. */}
            <button
              type="button"
              onClick={() => (canPay ? startPayment() : ask("stay", t.rooms.ctaNote(t.rooms.name)))}
              disabled={paying}
              className={`${BTN} mt-5 w-full disabled:cursor-wait disabled:opacity-70`}
            >
              {canPay ? t.rooms.pay : t.rooms.cta}
            </button>
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
          {/* Not "snorkeling": that key left this site's list when the list
              became the five the enquiry card offers, and an activity the
              dialog cannot show is an activity the reader cannot correct.
              "Everything together" is the nearest of the five to a day
              arranged from the house. */}
          <button type="button" onClick={() => ask("package", t.around.all)} className={BTN_GHOST}>
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

      <EnquiryModal
        open={enquiryOpen}
        onClose={() => setEnquiryOpen(false)}
        t={shared}
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
