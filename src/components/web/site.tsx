"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { BookModal, type BookOrder } from "@/components/web/book-modal";
import {
  EMPTY_ENQUIRY,
  EnquiryModal,
  type Enquiry,
} from "@/components/web/enquiry-modal";
import {
  HeroScene,
  IsletScene,
  JettyScene,
  SnorkelScene,
} from "@/components/web/scenes";
import { FeedbackForm } from "@/components/web/feedback-form";
import {
  FacebookIcon,
  InstagramIcon,
  MailIcon,
  TikTokIcon,
  WhatsAppIcon,
} from "@/components/web/icons";
import { LangSwitch } from "@/components/web/lang-switch";
import { CurrencySwitch, Price } from "@/components/web/price";
import { convert, type CurrencyCode, type Rates } from "@/lib/currency";
import { SiteLogo } from "@/components/web/site-logo";
import { JourneyMap } from "@/components/web/journey-map";
import { JourneyScene, STEP_SCENES } from "@/components/web/journey-scenes";
import { SeasonScene, type SeasonKey } from "@/components/web/season-scenes";
import { useHeroScroll } from "@/hooks/use-hero-scroll";
import { useReveal } from "@/hooks/use-reveal";
import { useCurrency, useLang, useRates } from "@/hooks/use-site-prefs";
import { SITE_CONFIG, siteConfig } from "@/lib/site-config";
import { saveDraft } from "@/lib/turtle-order";
import {
  TURTLE_ACTIVITIES,
  ACTIVITY_KEYS,
  COPY,
  DEFAULT_LANG,
  DIVE_FEATURED,
  DIVE_KEYS,
  BOAT_ROWS,
  DIVE_PER,
  EMAIL,
  EXTRA_BED,
  HOUSE,
  MAX_DIVERS,
  PROPERTY,
  ROOM_SLEEPS,
  WHATSAPP,
  type ActivityKey,
  type DiveKey,
  type ExtraBedKey,
  type RoomKey,
  PRICE_ROWS,
  divePrice,
  money,
  monthOptions,
  roomFacts,
  roomRate,
  waLink,
} from "@/lib/web-content";

/**
 * The public site for Turtle Dive Homestay — a separate route
 * from the booking manager, sharing only the room rates and the illustration
 * kit.
 *
 * Two doors, and both are the front door. A message on WhatsApp with the
 * enquiry already written out is how a homestay on Mansuar has always taken a
 * booking, and it is still here for anybody with a question. Beside it, a room
 * or a dive package can now be booked and paid for outright, which is the door
 * a guest who has already decided reaches for at two in the morning in another
 * time zone.
 *
 * Paying is offered only when the server has Midtrans keys — `payable` below —
 * so a site with no keys is the site it was rather than a site with a button
 * that opens a broken window. Rooms stay pointed at the OTA listings too,
 * because that is where their calendars live; the dive centre remains the part
 * that is genuinely booked here.
 */

/** Anchors stay in one language; only the labels move. */
const NAV_KEYS = [
  { href: "#atas", key: "home" },
  { href: "#kamar", key: "rooms" },
  { href: "#diving", key: "diving" },
  { href: "#musim", key: "season" },
  { href: "#perjalanan", key: "journey" },
  { href: "#tanya", key: "faq" },
] as const;

const MONTH_ANCHOR = new Date(2026, 7, 1);
const LANG_KEY = "turtle-lang";

/**
 * The hero photograph, served straight from `public/`.
 *
 * Replacing it is a matter of overwriting the file — no code changes — as long
 * as the name matches **exactly**, lowercase included: the server is
 * case-sensitive even though a Mac is not, so `Hero.jpg` uploaded over this
 * would 404 without ever looking wrong locally. If the file is missing the
 * drawn scene underneath shows instead, so the page never breaks outright.
 */
const HERO_PHOTO = "/hero.jpg";

/**
 * One photograph per kind of bungalow, named after the kind rather than
 * numbered, so replacing it is a matter of overwriting a file and nothing has
 * to be counted. Same case-sensitivity warning as the hero, and the same
 * fallback: a missing file leaves the drawn scene showing rather than a
 * broken image.
 */
const ROOM_PHOTO: Record<RoomKey, string> = {
  deluxe: "/standard.jpg",
};

/**
 * The three extra-bed bands, in the order the family's price list prints
 * them, each tied to its own figure here rather than in the markup: an age
 * band and the money beside it are one fact, and a list that pairs them by
 * position is one reordering away from charging a nine-year-old as an adult.
 */
const EXTRA_ROWS: { key: ExtraBedKey; rupiah: number }[] = [
  { key: "child", rupiah: EXTRA_BED.child },
  { key: "teen", rupiah: EXTRA_BED.teen },
  { key: "adult", rupiah: EXTRA_BED.adult },
];

/** Sits behind the dive section, under a scrim. */
const DIVE_PHOTO = "/manta.jpg";

/**
 * Which sea runs behind each season card, in the order the copy lists them:
 * best, still good, quiet. Held here rather than in the copy because the
 * weather in May does not change with the reader's language.
 */
const SEASON_SCENES: SeasonKey[] = ["calm", "mixed", "windy"];

/**
 * Footer profile links. The icon is always drawn; an empty URL in the CMS just
 * means it is not yet a link. The accounts exist, the addresses are not typed
 * in yet.
 */
const TURTLE_SOCIAL = siteConfig("turtle").social;
const SOCIALS = [
  {
    name: "Instagram",
    href: TURTLE_SOCIAL.instagram,
    icon: <InstagramIcon />,
  },
  { name: "Facebook", href: TURTLE_SOCIAL.facebook, icon: <FacebookIcon /> },
  { name: "TikTok", href: TURTLE_SOCIAL.tiktok, icon: <TikTokIcon /> },
];

const PILL_DARK =
  "inline-flex items-center justify-center rounded-full bg-ink px-6 py-[13px] text-[14px] font-medium text-white transition-colors hover:bg-ink-soft";
const PILL_LIGHT =
  "inline-flex items-center justify-center rounded-full border border-line-strong bg-surface px-6 py-[13px] text-[14px] font-medium text-ink transition-colors hover:bg-surface-hover";

function Eyebrow({
  children,
  reveal,
}: {
  children: React.ReactNode;
  /* Set where the badge sits directly above a heading that also arrives:
     without it the badge is already there while the heading is still on its
     way, which reads as the heading being late rather than as an entrance. */
  reveal?: boolean;
}) {
  return (
    <span data-reveal={reveal ? "" : undefined} className="inline-flex items-center gap-[7px] rounded-full border border-line-strong bg-surface px-[13px] py-[6px] text-[12px] text-slate">
      <span className="h-[6px] w-[6px] rounded-full bg-teal" />
      {children}
    </span>
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
      className={`mx-auto w-full max-w-[1180px] scroll-mt-[84px] px-5 md:px-8 ${className}`}
    >
      {children}
    </section>
  );
}

/**
 * A card's place in its row, which the stylesheet turns into a delay so the
 * row arrives as a row. Cast because a custom property is not part of React's
 * style type, and typing around that costs more than it explains.
 */
const step = (i: number) => ({ "--i": i }) as React.CSSProperties;

/** Fixed aspect box so an illustration can later be swapped for a photograph. */
function Frame({
  ratio,
  children,
  className = "",
}: {
  ratio: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-[22px] bg-surface-tint ${className}`}
      style={{ aspectRatio: ratio }}
    >
      {children}
    </div>
  );
}

const FILL = "absolute inset-0 h-full w-full";

/**
 * One line of the dive price list: what it is on the left, what it costs on
 * the right.
 *
 * Not the `Price` component, which stacks the rupiah figure over its
 * conversion and holds a line's height open for a conversion that may never
 * load. That is right for a card, where the price is the loudest thing on it,
 * and wrong for fifteen rows in a row: it doubled the height of the table and
 * left every "per person" floating away from the figure it belongs to. Here
 * the three parts sit on one line, and the conversion simply is not there
 * when there is nothing honest to put in it.
 */
function PriceRow({
  label,
  min,
  rupiah,
  unit,
  ask,
  lang,
  currency,
  rates,
}: {
  label: string;
  /** "minimum 3 divers", for the rows the boat will not go out under. */
  min: string | null;
  /** Zero where the owner has not filled the figure in. */
  rupiah: number;
  unit: string;
  ask: string;
  lang: string;
  currency: CurrencyCode;
  rates: Rates | null;
}) {
  const approx = rupiah > 0 ? convert(rupiah, currency, rates) : null;
  return (
    <li className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-[2px] border-b border-white/10 py-[9px]">
      <span className="max-w-[56ch] min-w-0 text-[13.5px] leading-[1.5] text-white/85">
        {label}
        {min ? (
          <span className="ml-[8px] text-[11.5px] whitespace-nowrap text-white/45">
            {min}
          </span>
        ) : null}
      </span>
      {rupiah > 0 ? (
        <span className="shrink-0 text-right text-[14px] font-bold text-white">
          {money(rupiah, lang)}
          <span className="ml-[7px] text-[11.5px] font-normal text-white/45">
            {unit}
          </span>
          {approx ? (
            <span className="ml-[7px] text-[11.5px] font-normal text-white/40">
              ≈ {approx}
            </span>
          ) : null}
        </span>
      ) : (
        <span className="shrink-0 text-[13px] text-white/60">{ask}</span>
      )}
    </li>
  );
}

/**
 * A photograph over the drawn scene inside a `Frame`. Lazy, because these sit
 * below the fold and the three of them weigh more than the rest of the page
 * put together.
 */
function PhotoFill({ src, alt }: { src: string; alt: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      className="absolute inset-0 h-full w-full object-cover"
    />
  );
}

export function TurtleSite({ payable = false }: { payable?: boolean }) {
  const [menuOpen, setMenuOpen] = useState(false);

  /*
   * Language and currency both live in shared hooks, because the package pages
   * are separate routes that have to remember the same two choices. Both start
   * at their default and settle in an effect rather than reading storage during
   * render: this page is prerendered, and a value read at render time would not
   * match what the browser hydrates with.
   */
  const { lang, pickLang } = useLang();
  const { currency, pickCurrency } = useCurrency();
  const rates = useRates();

  const t = COPY[lang];
  const nav = NAV_KEYS.map((n) => ({ href: n.href, label: t.nav[n.key] }));
  const monthsAhead = monthOptions(MONTH_ANCHOR, lang);

  /* Screen readers and translation tools go by this, so it has to follow the
     switch rather than stay at whatever the document was rendered with. */
  useEffect(() => {
    document.documentElement.lang = t.htmlLang;
  }, [t.htmlLang]);

  /* The header is bare over the top of the hero and grows its bar once the
     page moves. It starts false rather than reading scrollY during render:
     the page is prerendered, and a value read at render time would not match
     what the browser hydrates with. The effect settles it on mount, which
     also covers a reload part-way down the page. */
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* An open drawer needs the bar under it whether or not the page has moved,
     or the links hang over the photograph with nothing behind them. */
  const barSolid = scrolled || menuOpen;

  /* Sections arrive as they are reached, and the hero reacts to being scrolled
     past. Both are off under `prefers-reduced-motion` and both fail towards
     the page simply being at rest; see the hooks for how that is guaranteed. */
  useReveal();
  const heroRef = useHeroScroll<HTMLDivElement>();

  /* The hero picker and every "Pesan" button write into the same enquiry, so
     whichever one the visitor touched, the message that opens is already
     about the thing they touched. */
  /* One object rather than six states: every button that opens the dialog
     writes two of these fields, and the dialog reads all of them. */
  const [enquiry, setEnquiry] = useState<Enquiry>(EMPTY_ENQUIRY);
  const [enquiryOpen, setEnquiryOpen] = useState(false);
  const patchEnquiry = (patch: Partial<Enquiry>) =>
    setEnquiry((prev) => ({ ...prev, ...patch }));

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
    withNights:
      enquiry.activity !== "diving" && enquiry.activity !== "snorkeling",
  });

  /** Opens the dialog already pointed at whatever was pressed. */
  const ask = (next: ActivityKey, note: string) => {
    patchEnquiry({ activity: next, notes: note });
    setEnquiryOpen(true);
  };

  /* The dive bar's own three fields. They are not the dialog's: someone can
     turn the dials here and never press the button, and the dialog should not
     have quietly changed underneath them if they later press Book on a card
     instead. Pressing the bar's button is what copies them across. */
  const [divePack, setDivePack] = useState<DiveKey>(DIVE_FEATURED);
  const [diveMonthIx, setDiveMonthIx] = useState(0);
  const [diveDivers, setDiveDivers] = useState("2");

  const askDive = () => {
    const name = t.dive.packages[divePack].name;
    patchEnquiry({
      activity: divePack === "snorkel" ? "snorkeling" : "diving",
      monthIx: diveMonthIx,
      people: diveDivers,
      notes: t.dive.bar.note(name, diveDivers),
    });
    setEnquiryOpen(true);
  };

  const rooms = roomFacts();

  /*
   * What the booking dialog is open on, or nothing.
   *
   * One piece of state rather than one per card: only one dialog can be open,
   * and holding the choice here is what lets the dialog be written once and
   * opened from a room, from a package, or from the bar.
   */
  const [booking, setBooking] = useState<
    { kind: "room"; room: RoomKey } | { kind: "dive"; pack: DiveKey } | null
  >(null);
  const router = useRouter();

  /*
   * The order, stashed in the tab and handed to the summary page.
   *
   * Nothing is priced here and nothing is charged here. The dialog collected
   * the days and the name; `/turtle/checkout` prices it from the same tables
   * this page drew its figures from, and `/api/pay` prices it once more before
   * Midtrans is asked for anything.
   *
   * False when the tab refused to store it — a private window with site data
   * blocked throws rather than returning nothing — and the dialog says so
   * where it stands instead of sending the reader to an empty page.
   */
  const confirmBooking = (o: BookOrder) => {
    if (!booking) return false;
    const stashed = saveDraft(
      booking.kind === "room"
        ? {
            kind: "room",
            room: booking.room,
            from: o.from,
            to: o.to,
            guests: o.count,
            name: o.name,
            phone: o.phone,
            email: o.email,
          }
        : {
            kind: "dive",
            pack: booking.pack,
            from: o.from,
            to: o.to,
            count: o.count,
            name: o.name,
            phone: o.phone,
            email: o.email,
          },
    );
    if (!stashed) return false;
    router.push("/turtle/checkout");
    return true;
  };

  return (
    <div className="bg-surface text-ink">
      {/* ------------------------------------------------------------ nav */}
      <header
        className={`fixed inset-x-0 top-0 z-50 border-b transition-[background-color,border-color] duration-300 ${
          barSolid
            ? "border-white/15 bg-ink/45 backdrop-blur-md"
            : /*
               * No bar at the top: no fill, no rule, no blur — the photograph
               * runs clean under it.
               *
               * What is left is a wash that dies out before the header does,
               * plus a shadow on the type. Neither reads as a bar, and both
               * are needed: the top of this photograph is bright turquoise
               * reef, and white links on it with nothing behind them cannot
               * be read.
               *
               * The wash is held near its full strength down to 62% rather
               * than fading from the first pixel, because the links sit at
               * about half the bar's height, which is exactly where a fade
               * that starts at the top has already given most of itself
               * away. Measured against the reef, the worst link went from
               * 3.2:1 to over 4.5:1 with this shape.
               */
              /* bg-no-repeat matters: the bar's height is fractional, so the
                 gradient tile falls a sliver short and repeats — painting its
                 darkest row back at the bottom edge as a hairline that looks
                 exactly like the border this state is meant to drop. */
              "border-transparent bg-[linear-gradient(180deg,rgba(6,20,18,.56)_0%,rgba(6,20,18,.38)_62%,rgba(6,20,18,0)_100%)] bg-no-repeat [text-shadow:0_1px_16px_rgba(6,20,18,.75)]"
        }`}
      >
        {/* No mark and no wordmark: the hero says the name in display type a
            moment below, and with the bar carrying only links the whole row
            can sit centred rather than pushed to one side by a logo. */}
        <div className="mx-auto flex w-full max-w-[1180px] items-center justify-center gap-4 px-5 py-[14px] md:px-8">
          <nav className="hidden items-center gap-[26px] lg:flex">
            {nav.map((n) => (
              <a
                key={n.href}
                href={n.href}
                className="text-[13.5px] text-white/80 no-underline transition-colors hover:text-white hover:no-underline"
              >
                {n.label}
              </a>
            ))}
            <button
              type="button"
              onClick={() => setEnquiryOpen(true)}
              className="cursor-pointer rounded-full border-none bg-white px-[18px] py-[9px] text-[13.5px] font-medium text-ink hover:bg-surface-hover"
            >
              {t.book}
            </button>
            <LangSwitch lang={lang} onPick={pickLang} label={t.langLabel} />
          </nav>

          {/* Below the nav's breakpoint the row is the two controls, still
              centred as a pair. */}
          <div className="flex items-center gap-3 lg:hidden">
            <button
              type="button"
              onClick={() => setEnquiryOpen(true)}
              className="cursor-pointer rounded-full border-none bg-white px-[18px] py-[9px] text-[13.5px] font-medium text-ink hover:bg-surface-hover"
            >
              {t.book}
            </button>
            <LangSwitch lang={lang} onPick={pickLang} label={t.langLabel} />
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              aria-label={t.openMenu}
              aria-expanded={menuOpen}
              className="flex h-[36px] w-[36px] cursor-pointer flex-col items-center justify-center gap-[5px] rounded-full border border-white/30 bg-transparent"
            >
              <span className="block h-[1.5px] w-[15px] bg-white" />
              <span className="block h-[1.5px] w-[15px] bg-white" />
            </button>
          </div>
        </div>

        {menuOpen && (
          <nav className="border-t border-white/15 bg-ink/90 px-5 py-3 text-center lg:hidden">
            {nav.map((n) => (
              <a
                key={n.href}
                href={n.href}
                onClick={() => setMenuOpen(false)}
                className="block py-[9px] text-[14px] text-white/85 no-underline hover:no-underline"
              >
                {n.label}
              </a>
            ))}
          </nav>
        )}
      </header>

      {/* ----------------------------------------------------------- hero */}
      <div id="atas" className="relative">
        {/* Tall enough that the hut and the ridge sit clear above the
              headline instead of behind it. The crop is centred; the height
              is what separates them. */}
          <div ref={heroRef} className="relative h-[620px] w-full overflow-hidden sm:h-[720px] md:h-[820px]">
          {/* One box around both, so the scale on scroll takes the photograph
              and the illustration underneath it together and there is never a
              frame where the two are at different sizes. */}
          <div data-hero-photo className="absolute inset-0">
          {/* The illustration is the floor, not the picture: it only shows if
              the photograph is missing, so a deploy without `public/hero.jpg`
              degrades to something drawn instead of to a broken image. */}
          <HeroScene className="absolute inset-0 h-full w-full object-cover" />

          {/* A background rather than an <img>: a missing file simply does not
              paint, so the illustration shows through with no broken-image
              marker and no JavaScript needed to hide one. The photo is
              decorative — the sentence beneath it carries the meaning.

              The crop stays centred at every width. This is a shot straight
              down and the picture is banded: reef at the top, beach and huts
              across the middle, jungle at the foot. Centring keeps all three,
              and lands the huts just above the headline. Anchoring the foot
              instead looks the same on a laptop, where almost the whole frame
              fits, but on a wide monitor it crops the reef away entirely and
              leaves the huts pushed up under the nav. */}
          <div
            className="absolute inset-0 bg-cover bg-no-repeat bg-center"
            style={{ backgroundImage: `url("${HERO_PHOTO}")` }}
          />
          </div>

          {/*
           * Nothing over the top third: the sky and the ridge keep their own
           * colour, which is the whole reason to use a photograph. The fade
           * starts below the picture's subject and runs to near-black at the
           * foot, where the sand is and where the type lands. The header
           * darkens itself rather than borrowing from this gradient, so the
           * green stays green right up to the nav.
           */}
          <div data-hero-scrim className="absolute inset-0 bg-[linear-gradient(180deg,rgba(9,26,24,0)_0%,rgba(9,26,24,0)_36%,rgba(9,26,24,.26)_56%,rgba(9,26,24,.68)_78%,rgba(9,26,24,.94)_100%)]" />

          {/* One thing to click, and only one. The picker bar that used to sit
              here asked the same three questions as the enquiry form, and a
              "Pesan" button in its place was the same call twice on a screen
              that already has the header's — which stays put as the page
              scrolls. This is the other question a first-time reader has, and
              it goes somewhere rather than opening something. */}
          {/* The shadow is the second line of defence behind the scrim: a
              photograph can put a bright cloud or a strip of sand anywhere,
              and the gradient alone cannot know where. */}
          <div data-hero-copy className="absolute inset-x-0 bottom-0 mx-auto flex w-full max-w-[1180px] flex-col items-center px-5 pb-[56px] text-center md:px-8 md:pb-[76px] [text-shadow:0_2px_28px_rgba(6,20,18,.62)]">
            <h1 className="m-0 max-w-[15ch] text-[clamp(38px,7vw,92px)] leading-[1.02] font-bold tracking-[-.03em] text-balance text-white">
              Turtle Dive Homestay
            </h1>
            <p className="mt-4 max-w-[560px] text-[15px] leading-[1.6] text-white/90">
              {t.hero.sub}
            </p>
            {/* Glass, not a white pill. The header's "Pesan" is a solid white
                pill and is the page's primary call; two of those on one screen
                would read as a pair of equals and make the reader choose. An
                outline says "the other thing you can do" without arguing. */}
            <Link
              href="/turtle/about"
              className="mt-7 inline-flex items-center justify-center rounded-full border border-white/45 bg-white/12 px-[26px] py-[12px] text-[14px] font-medium text-white no-underline transition-colors hover:border-white/70 hover:bg-white/22 hover:text-white hover:no-underline md:px-[30px] md:py-[13px] md:text-[15px]"
            >
              {t.about.cta}
            </Link>
          </div>
        </div>
      </div>

      {/* --------------------------------------------------------- values */}
      <Section className="pt-16 md:pt-24">
        <h2 data-reveal className="mx-auto max-w-[860px] text-center text-[clamp(34px,5.4vw,62px)] leading-[1.04] font-bold tracking-[-.03em]">
          {t.value.heading}
          <br className="hidden md:block" /> {t.value.headingBreak}
        </h2>

        {/* The text no longer sits beside the pictures. Three cards next to
            a 340px column can only ever be a third of what is left, and the
            photographs are the argument this section is making. */}
        <div data-reveal className="mx-auto mt-12 max-w-[640px] text-center">
          <Eyebrow>{t.value.eyebrow}</Eyebrow>
          <h3 className="mt-5 text-[26px] leading-[1.15] font-bold tracking-[-.02em] whitespace-pre-line">
            {t.value.title}
          </h3>
          <p className="mt-3 text-[14.5px] leading-[1.65] text-slate">
            {t.value.body}
          </p>
          {/* No button follows. "Kenali kami" used to close this block and has
              moved up into the hero: the same invitation reads better before
              the reader has scrolled than after, and keeping a copy here would
              only ask them to choose between two of the same thing. */}
        </div>
      </Section>

      {/*
       * The row sits on its own rather than beside the copy, which is what
       * was holding it to about 240px a card. It keeps the page's column
       * though: edge to edge the cards ran 484px and dominated everything
       * around them. In the column they land near 356.
       *
       * The captions follow what each photograph actually shows. Slotted in
       * the order they were given, 1/2/3 landed under "kamar di atas air",
       * "karang rumah" and "sore di perahu", but 1 is dusk on the jetty, 2 is
       * lunch under the dining hut, and 3 is the bungalow walk. None of them
       * shows a reef. Captioning a plate of food as the house reef is the kind
       * of thing a guest notices, so the words moved to meet the pictures.
       */}
      <Section className="mt-12 md:mt-16">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:gap-5">
          {t.cards.map((c, i) => (
            <div
              key={i}
              data-reveal
              style={step(i)}
              className={
                i === 1 ? "sm:mt-12" : i === 2 ? "hidden sm:mt-5 sm:block" : ""
              }
            >
              <Frame ratio="3 / 4">
                {i === 0 ? (
                  <JettyScene className={FILL} />
                ) : i === 1 ? (
                  <SnorkelScene className={FILL} />
                ) : (
                  <IsletScene className={FILL} warm />
                )}
                <PhotoFill src={`/${i + 1}.jpg`} alt={c.alt} />
                <span className="absolute right-3 bottom-3 rounded-full bg-ink/70 px-[12px] py-[5px] text-[12px] text-white">
                  {c.badge}
                </span>
              </Frame>
              <div className="mt-[12px] text-[14.5px] font-medium">
                {c.title}
              </div>
              <div className="text-[13px] text-slate-soft">{c.sub}</div>
            </div>
          ))}
        </div>
      </Section>

      {/* ---------------------------------------------------------- rooms */}
      <Section id="kamar" className="pt-20 md:pt-28">
        <Eyebrow reveal>{t.rooms.eyebrow}</Eyebrow>
        <div data-reveal className="mt-5 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <h2 className="m-0 max-w-[620px] text-[clamp(34px,5.2vw,58px)] leading-[1.05] font-bold tracking-[-.03em]">
            {t.rooms.title}
          </h2>
          <div className="max-w-[380px]">
            <p className="m-0 text-[14px] leading-[1.6] text-slate">
              {t.rooms.intro}
            </p>
            {/* The picker sits with the prices rather than in the header. It
                is a thing you reach for once, while looking at a number, not
                a thing you navigate by. */}
            <div className="mt-3">
              <CurrencySwitch
                currency={currency}
                onPick={pickCurrency}
                srLabel={t.currencyLabel}
                tone="dark"
              />
            </div>
          </div>
        </div>

        {/* One kind of bungalow, so one card rather than a grid of two — and
            a wide one, because a lone card in a two-column grid reads as a
            column with something missing beside it. The list survives: a
            second kind, if the family ever builds one, is a line of data
            rather than a rewrite of this section. */}
        <div className="mt-10 flex flex-col gap-6">
          {rooms.map((r, i) => {
            const rc = t.rooms.types[r.key];
            return (
              <article
                key={r.key}
                data-reveal
                style={step(i)}
                className="overflow-hidden rounded-[24px] border border-line-soft bg-surface md:grid md:grid-cols-2"
              >
                {/* Not a `Frame`: that one sets its ratio inline, and an
                    inline ratio cannot be turned off for the wide layout,
                    where the photograph has to fill the column's height
                    instead of dictating its width. Here the ratio is a class,
                    so `md:aspect-auto` can override it. */}
                <div className="relative overflow-hidden bg-surface-tint aspect-[16/10] md:aspect-auto md:h-full">
                  <JettyScene className={FILL} />
                  <PhotoFill src={ROOM_PHOTO[r.key]} alt={rc.alt} />
                  <span className="absolute top-4 left-4 rounded-full bg-white/92 px-[12px] py-[6px] text-[12px] font-medium">
                    {t.rooms.roomsLabel(r.count)}
                  </span>
                </div>

                <div className="px-6 py-6 md:px-7 md:py-7">
                  <h3 className="m-0 text-[21px] font-bold tracking-[-.015em]">
                    {rc.name}
                  </h3>

                  <p className="mt-2 text-[14px] leading-[1.6] text-slate">
                    {rc.blurb}
                  </p>

                  <ul className="mt-4 mb-0 grid list-none grid-cols-1 gap-x-4 gap-y-[7px] p-0 sm:grid-cols-2">
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

                  {/* Both figures, side by side and equally loud. The family
                      charges by how many sleep in the bungalow, so one price
                      with the other in a footnote would be the wrong number
                      for half the people reading it. */}
                  <div className="mt-5 grid grid-cols-2 gap-4 rounded-[16px] bg-surface-mute px-[18px] py-[14px]">
                    {[
                      { rupiah: r.rateOne, who: t.rooms.forOne },
                      { rupiah: r.rateTwo, who: t.rooms.forTwo },
                    ].map((p) => (
                      <div key={p.who}>
                        <Price
                          rupiah={p.rupiah}
                          lang={lang}
                          currency={currency}
                          rates={rates}
                          size="sm"
                        />
                        <div className="text-[11.5px] leading-[1.35] text-slate-soft">
                          {t.rooms.perNight} · {p.who}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Two doors. Booking is the solid one when it is open at
                      all, and asking steps back to an outline beside it — a
                      card with two equally loud buttons asks the reader to
                      weigh a decision they have already made by pressing the
                      card. With no Midtrans keys there is only ever one
                      button, and it is the one that was always there. */}
                  <div className="mt-6 flex flex-wrap gap-[10px]">
                    {payable && (
                      <button
                        type="button"
                        onClick={() => setBooking({ kind: "room", room: r.key })}
                        className={`${PILL_DARK} cursor-pointer border-none`}
                      >
                        {t.booking.cta}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => ask("stay", t.rooms.askNote(rc.name))}
                      className={`cursor-pointer ${
                        payable ? PILL_LIGHT : `${PILL_DARK} border-none`
                      }`}
                    >
                      {t.rooms.ask}
                    </button>
                    <span className="inline-flex items-center text-[12.5px] text-slate-soft">
                      {rc.cap}
                    </span>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        {/* The two things the price list says next to the rates: what a third
            person costs, and the hours the day runs to. They were missing
            from this site entirely, and they are the questions a guest asks
            on arrival — after the money has moved. */}
        <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2">
          <div
            data-reveal
            className="rounded-[20px] border border-line-soft bg-surface px-5 py-5 md:px-6"
          >
            <h3 className="m-0 text-[15px] font-bold tracking-[-.01em]">
              {t.rooms.extra.heading}
            </h3>
            <p className="mt-[3px] mb-0 text-[11.5px] tracking-[.01em] text-slate-soft">
              {t.rooms.extra.per}
            </p>
            <ul className="mt-4 mb-0 flex list-none flex-col gap-[6px] p-0">
              {EXTRA_ROWS.map((row) => (
                <li
                  key={row.key}
                  className="flex items-baseline justify-between gap-4 border-b border-line-soft pb-[7px]"
                >
                  <span className="text-[13px] text-ink-soft">
                    {t.rooms.extra.ages[row.key]}
                  </span>
                  <Price
                    rupiah={row.rupiah}
                    lang={lang}
                    currency={currency}
                    rates={rates}
                    size="sm"
                    className="text-right"
                  />
                </li>
              ))}
            </ul>
            <p className="mt-4 mb-0 text-[12.5px] leading-[1.55] text-slate">
              {t.rooms.extra.note}
            </p>
          </div>

          <div
            data-reveal
            style={step(1)}
            className="rounded-[20px] border border-line-soft bg-surface px-5 py-5 md:px-6"
          >
            <h3 className="m-0 text-[15px] font-bold tracking-[-.01em]">
              {t.rooms.rules.heading}
            </h3>
            {/* The times come from `HOUSE`, not from the copy: 12:30 is 12:30
                in all seven languages, and seven copies of a clock is how a
                site ends up serving breakfast an hour later in German. */}
            <dl className="mt-4 mb-0 flex flex-col gap-[6px]">
              {[
                { k: t.rooms.rules.checkIn, v: HOUSE.checkIn },
                { k: t.rooms.rules.checkOut, v: HOUSE.checkOut },
                { k: t.rooms.rules.power, v: `${HOUSE.power.from}–${HOUSE.power.to}` },
                {
                  k: t.rooms.rules.meals,
                  v: `${HOUSE.meals.breakfast} · ${HOUSE.meals.lunch} · ${HOUSE.meals.dinner}`,
                },
              ].map((row) => (
                <div
                  key={row.k}
                  className="flex items-baseline justify-between gap-4 border-b border-line-soft pb-[7px]"
                >
                  <dt className="text-[13px] text-ink-soft">{row.k}</dt>
                  <dd className="m-0 font-mono text-[13px] font-medium text-ink">
                    {row.v}
                  </dd>
                </div>
              ))}
            </dl>
            <p className="mt-4 mb-0 text-[12.5px] leading-[1.55] text-slate">
              {t.rooms.rules.diet}
            </p>
            <p className="mt-2 mb-0 text-[12.5px] leading-[1.55] text-slate">
              {t.rooms.rules.refund}
            </p>
          </div>
        </div>

        <p className="mt-5 rounded-[16px] border border-line-soft bg-surface-mute px-5 py-4 text-[13.5px] leading-[1.6] text-slate">
          {t.rooms.otaNote}
        </p>
      </Section>

      {/* --------------------------------------------------------- diving */}
      <div
        id="diving"
        className="relative mt-20 scroll-mt-[84px] overflow-hidden bg-ink py-20 md:mt-28 md:py-28"
      >
        {/* The manta, behind everything in this section. `bg-ink` stays on the
            wrapper as the floor, so a missing file leaves the section exactly
            as it was rather than leaving it unreadable. */}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url("${DIVE_PHOTO}")` }}
        />
        {/*
         * The scrim is not decoration, it is what makes the type readable.
         * The manta's belly is close to white, and this section carries the
         * most text on the page: a heading, a paragraph, six cards and a
         * footnote.
         *
         * It only has to cover the type that sits directly on it, though,
         * because the cards now bring their own backdrop. That is what keeps
         * it at two thirds instead of the four fifths it needed when the
         * cards were a pale tint, and two thirds is the difference between a
         * manta you can see and a dark blue rectangle.
         *
         * A blue-black rather than the section's own warm ink: over water a
         * warm scrim turns the blue olive, and what is left of the photograph
         * is the whole reason for putting it there.
         */}
        <div aria-hidden="true" className="absolute inset-0 bg-[#06141a]/66" />

        <Section className="relative">
          {/* The drawn reef that used to sit beside this heading is gone. It
              was standing in for a photograph, and the photograph is now the
              section itself; a flat illustration in a rounded box on top of a
              real manta only read as the cheaper of the two. */}
          <div>
            <span data-reveal className="inline-flex items-center gap-[7px] rounded-full border border-white/20 px-[13px] py-[6px] text-[12px] text-white/75">
              <span className="h-[6px] w-[6px] rounded-full bg-amber" />
              {t.dive.badge}
            </span>

            {/*
             * The agency mark stands beside the headline rather than off in
             * the corner of the section: parked at the right edge it read as
             * something that had drifted there, and half a heading's width of
             * empty water between the two is what made it look adrift.
             *
             * White, from `ssi-white.png`. The supplied file is the red mark on
             * transparency, which on this near-black water is the one colour it
             * cannot be; the alpha channel came across untouched so the curves
             * keep their soft edges rather than being cut out by a threshold.
             */}
            <div data-reveal className="mt-5 flex flex-col gap-6 md:flex-row md:items-center md:gap-11">
              <h2 className="m-0 text-[clamp(34px,5.2vw,58px)] leading-[1.05] font-bold tracking-[-.03em] whitespace-pre-line text-white">
                {t.dive.title}
              </h2>
              <div className="shrink-0">
                <div className="font-mono text-[10.5px] tracking-[.09em] text-white/70 uppercase">
                  {t.dive.partner}
                </div>
                {/* Height tracks the headline's own clamp at about nine tenths
                    of it. The mark is a solid slab where the type is strokes
                    and counters, so matching them outright would let it weigh
                    more than the words it stands next to. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/ssi-white.png"
                  alt="Scuba Schools International"
                  width={373}
                  height={200}
                  className="mt-[11px] w-auto"
                  style={{ height: "clamp(31px, 4.7vw, 52px)" }}
                />
              </div>
            </div>

            <p className="mt-6 max-w-[560px] text-[14.5px] leading-[1.65] text-white/80">
              {t.dive.body}
            </p>
            <div className="mt-5">
              <CurrencySwitch
                currency={currency}
                onPick={pickCurrency}
                srLabel={t.currencyLabel}
              />
            </div>
          </div>

          {/* The booking bar the hero used to carry, rebuilt for diving.
              It belongs here and not up there: the hero's version asked the
              same three questions the enquiry form asks and answered none of
              them, whereas here it sits directly above the thing being
              chosen, and diving is the one part of this site that is really
              booked here rather than through an OTA.

              White on a dark section, the way it was white on a cream one:
              this is the row to reach for, and nothing else in the section is
              solid white except the Book buttons it leads to. */}
          <div className="mt-10 grid grid-cols-1 overflow-hidden rounded-[20px] bg-surface shadow-[0_18px_50px_-24px_rgba(4,16,20,.7)] md:grid-cols-[1.5fr_1fr_.9fr_auto]">
            <label className="flex cursor-pointer flex-col gap-[3px] border-b border-line px-5 py-[14px] md:border-r md:border-b-0">
              <span className="text-[11.5px] text-slate">
                {t.dive.bar.pack}
              </span>
              <select
                value={divePack}
                onChange={(e) => setDivePack(e.target.value as DiveKey)}
                className="cursor-pointer border-none bg-transparent p-0 text-[14.5px] font-medium text-ink outline-none"
              >
                {DIVE_KEYS.map((k) => (
                  <option key={k} value={k}>
                    {t.dive.packages[k].name}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex cursor-pointer flex-col gap-[3px] border-b border-line px-5 py-[14px] md:border-r md:border-b-0">
              <span className="text-[11.5px] text-slate">
                {t.dive.bar.when}
              </span>
              <select
                value={diveMonthIx}
                onChange={(e) => setDiveMonthIx(Number(e.target.value))}
                className="cursor-pointer border-none bg-transparent p-0 text-[14.5px] font-medium text-ink outline-none"
              >
                {monthsAhead.map((m, i) => (
                  <option key={m} value={i}>
                    {m}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex cursor-pointer flex-col gap-[3px] border-b border-line px-5 py-[14px] md:border-r md:border-b-0">
              <span className="text-[11.5px] text-slate">
                {t.dive.bar.divers}
              </span>
              <select
                value={diveDivers}
                onChange={(e) => setDiveDivers(e.target.value)}
                className="cursor-pointer border-none bg-transparent p-0 text-[14.5px] font-medium text-ink outline-none"
              >
                {/* Six per guide is the boat's limit, so the list stops
                    where the boat does and says so rather than offering a
                    number that would have to be turned down by email. */}
                {["1", "2", "3", "4", "5", "6+"].map((n) => (
                  <option key={n} value={n}>
                    {t.dive.bar.diverCount(n)}
                  </option>
                ))}
              </select>
            </label>

            <div className="p-[10px]">
              <button
                type="button"
                onClick={askDive}
                className={`${PILL_DARK} w-full cursor-pointer border-none whitespace-nowrap`}
              >
                {t.dive.bar.submit}
              </button>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {DIVE_KEYS.map((key, i) => {
              const p = t.dive.packages[key];
              const featured = key === DIVE_FEATURED;
              const canBuy = payable && divePrice(key) > 0;
              return (
              <article
                key={key}
                data-reveal
                style={step(i)}
                /* The plain cards are dark glass rather than the white tint
                   they were. A tint that pale over a photograph is barely a
                   card at all: whatever the manta happens to be doing behind
                   it decides whether the text can be read. Tinting dark and
                   blurring makes each card carry its own backdrop, which is
                   also what lets the scrim stay light enough to see the
                   photograph through. */
                /* The featured card carries a transparent border rather than
                   none. Without it its content box starts 1px higher than its
                   neighbours', and that 1px is visible once the footers are
                   pinned and the prices are meant to sit on one line. */
                className={`flex flex-col rounded-[20px] border px-6 py-6 ${
                  featured
                    ? "border-transparent bg-amber text-amber-deep"
                    : "border-white/10 bg-[#06141a]/62 text-white backdrop-blur-md"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <h3 className="m-0 text-[17px] leading-[1.25] font-bold">
                    {p.name}
                  </h3>
                  <span
                    className={`shrink-0 rounded-full px-[10px] py-[4px] text-[11px] whitespace-nowrap ${
                      featured ? "bg-amber-deep/12" : "bg-white/12"
                    }`}
                  >
                    {p.duration}
                  </span>
                </div>

                <p
                  className={`mt-[10px] text-[13.5px] leading-[1.6] ${
                    featured ? "text-amber-deep/80" : "text-white/65"
                  }`}
                >
                  {p.blurb}
                </p>

                <ul className="mt-4 mb-0 flex list-none flex-wrap gap-[6px] p-0">
                  {p.includes.map((inc: string) => (
                    <li
                      key={inc}
                      className={`rounded-full px-[10px] py-[4px] text-[11.5px] ${
                        featured
                          ? "bg-amber-deep/10"
                          : "bg-white/10 text-white/75"
                      }`}
                    >
                      {inc}
                    </li>
                  ))}
                </ul>

                {/* mt-auto is what lines the prices up. The cards already
                    stretch to the tallest in their row, but a blurb that runs
                    to two lines instead of three used to leave the footer
                    floating halfway up. Pushed to the bottom instead, every
                    price and every button sits on the same line across the
                    row, whatever the text above them does. */}
                <div
                  className={`mt-auto border-t pt-4 ${
                    featured ? "border-amber-deep/15" : "border-white/12"
                  }`}
                >
                <div className="flex items-end justify-between gap-3">
                  <div>
                    {/* A package the owner has not priced asks instead of
                        showing Rp 0. The family's own list prices neither the
                        course nor the snorkelling trip, and a zero on a card
                        reads as free rather than as unknown. */}
                    {divePrice(key) > 0 ? (
                      <Price
                        rupiah={divePrice(key)}
                        lang={lang}
                        currency={currency}
                        rates={rates}
                        tone={featured ? "amber" : "light"}
                      />
                    ) : (
                      <div
                        className={`text-[20px] font-bold ${
                          featured ? "text-amber-deep" : "text-white"
                        }`}
                      >
                        {t.dive.askPrice}
                      </div>
                    )}
                    <div
                      className={`text-[11.5px] ${
                        /* 70% of amber-deep on amber measured 3.6:1, under
                           the 4.5 this 11.5px line needs. Predates the
                           photograph; caught while checking the section. */
                        featured ? "text-amber-deep/90" : "text-white/55"
                      }`}
                    >
                      {p.unit} · {p.level}
                    </div>
                  </div>
                  {/* A link, not a button: it goes to a page, so it should
                      middle-click, open in a tab, and be crawlable like one.

                      Solid while it is the only thing to press, and plain text
                      once the card can be booked: two solid pills on one card
                      is two primary actions, and the one that takes money
                      should not have to share the emphasis with the one that
                      reads more about it. */}
                  <Link
                    href={`/turtle/dive/${key}`}
                    className={`shrink-0 text-[13px] font-medium no-underline hover:no-underline ${
                      canBuy
                        ? featured
                          ? "text-amber-deep/85 hover:text-amber-deep"
                          : "text-white/75 hover:text-white"
                        : featured
                          ? "rounded-full bg-amber-deep px-[16px] py-[9px] text-amber"
                          : "rounded-full bg-white px-[16px] py-[9px] text-ink hover:bg-surface-hover"
                    }`}
                  >
                    {t.dive.details}
                  </Link>
                </div>
                {/* A package the owner has not priced is not for sale, and the
                    card says "ask us" by simply not offering this. The same
                    refusal is in `priceTurtle`, where it is the one that
                    counts. */}
                {canBuy && (
                  <button
                    type="button"
                    onClick={() => setBooking({ kind: "dive", pack: key })}
                    className={`mt-4 w-full cursor-pointer rounded-full border-none px-[16px] py-[10px] text-[13.5px] font-medium transition-colors ${
                      featured
                        ? "bg-amber-deep text-amber hover:bg-amber-ink"
                        : "bg-white text-ink hover:bg-surface-hover"
                    }`}
                  >
                    {t.booking.cta}
                  </button>
                )}
                </div>
              </article>
              );
            })}
          </div>

          {/* The rest of the list.
              
              Six cards are what somebody chooses between before they have
              talked to anybody; the family sells fifteen things, and the
              other nine — the manta station, the wreck, the night dives, a
              tank for the house reef — were nowhere on this site. A card
              each would be a wall of photographs, so the rest is a table,
              which is also the shape the family already keeps it in. */}
          <div
            data-reveal
            className="mt-12 rounded-[24px] border border-white/12 bg-white/[.04] px-6 py-7 md:px-8 md:py-8"
          >
            <h3 className="m-0 text-[20px] leading-[1.15] font-bold tracking-[-.02em] text-white">
              {t.dive.list.heading}
            </h3>
            <p className="mt-2 mb-0 max-w-[640px] text-[13.5px] leading-[1.6] text-white/60">
              {t.dive.list.intro}
            </p>

            <ul className="mt-6 mb-0 flex list-none flex-col p-0">
              {PRICE_ROWS.map((row) => (
                <PriceRow
                  key={row.key}
                  label={t.dive.list.rows[row.key]}
                  min={row.min ? t.dive.list.min(row.min) : null}
                  rupiah={divePrice(row.key)}
                  unit={t.dive.list.per[row.per]}
                  ask={t.dive.askPrice}
                  lang={lang}
                  currency={currency}
                  rates={rates}
                />
              ))}
            </ul>

            <ul className="mt-5 mb-0 flex list-none flex-col gap-[7px] p-0">
              {t.dive.list.notes.map((note) => (
                <li
                  key={note}
                  className="flex gap-[10px] text-[12.5px] leading-[1.55] text-white/55"
                >
                  <span
                    aria-hidden="true"
                    className="mt-[7px] h-[4px] w-[4px] shrink-0 rounded-full bg-white/35"
                  />
                  {note}
                </li>
              ))}
            </ul>

            <h4 className="mt-9 mb-0 text-[15px] font-bold tracking-[-.01em] text-white">
              {t.dive.list.boatHeading}
            </h4>
            <p className="mt-1 mb-0 max-w-[560px] text-[12.5px] leading-[1.55] text-white/55">
              {t.dive.list.boatNote}
            </p>
            <ul className="mt-4 mb-0 flex list-none flex-col p-0">
              {BOAT_ROWS.map((key) => (
                <PriceRow
                  key={key}
                  label={t.dive.list.boats[key]}
                  min={null}
                  rupiah={divePrice(key)}
                  unit={t.dive.list.per.boat}
                  ask={t.dive.askPrice}
                  lang={lang}
                  currency={currency}
                  rates={rates}
                />
              ))}
            </ul>

            {/* How a dive is actually reserved, which is not this website:
                the plan for tomorrow is made after dinner, and the office
                number is the one on the family's own price list. */}
            <p className="mt-7 mb-0 border-t border-white/10 pt-5 text-[12.5px] leading-[1.65] text-white/60">
              {t.dive.list.plan}{" "}
              {t.dive.list.reserve}{" "}
              <a
                href={waLink(t.dive.list.heading)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-white underline decoration-white/40 underline-offset-[3px] hover:decoration-white"
              >
                +{WHATSAPP}
              </a>
            </p>
          </div>

          <p className="mt-6 text-[13px] leading-[1.6] text-white/50">
            {t.dive.footnote}
            {currency !== "IDR" && ` ${t.currencyNote}`}
          </p>
        </Section>
      </div>

      {/* --------------------------------------------------------- season */}
      <Section id="musim" className="pt-20 md:pt-28">
        <Eyebrow reveal>{t.season.eyebrow}</Eyebrow>
        <div data-reveal className="mt-5 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <h2 className="m-0 max-w-[560px] text-[clamp(34px,5.2vw,58px)] leading-[1.05] font-bold tracking-[-.03em]">
            {t.season.title}
          </h2>
          <p className="max-w-[400px] text-[14px] leading-[1.6] text-slate">
            {t.season.intro}
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-3">
          {t.season.bands.map((b, i) => (
            <article
              key={i}
              data-reveal
              style={step(i)}
              /* relative + overflow-hidden so the sea behind it is clipped to
                 the card's own corners. */
              /* A deep foot rather than the usual py-6: it leaves a band of
                 open water under the last line, which is where the glint, the
                 shower and the gusts live. Without it they run behind the
                 paragraph, and a thin horizontal streak crossing a line of
                 type reads as a strikethrough, not as light on water. */
              className={`relative overflow-hidden rounded-[20px] border px-6 pt-6 pb-16 ${
                i === 0
                  ? "border-teal-line bg-teal-tint"
                  : i === 1
                    ? "border-amber-soft bg-amber-soft/45"
                    : "border-line-soft bg-surface-mute"
              }`}
            >
              <SeasonScene season={SEASON_SCENES[i] ?? "calm"} />

              {/* Above the water. Everything from here down is the card.
                  A step darker than body copy elsewhere on the page: these are
                  the only paragraphs on the site sitting over something that
                  moves, and at the page's usual slate the roughest card's
                  longest paragraph measured 4.1:1. Thinning the sea instead
                  would have taken the roughness out of the card whose whole
                  subject is rough weather. */}
              <div className="relative">
                <div className="text-[12px] text-ink-soft">{b.label}</div>
                <div className="mt-1 text-[19px] font-bold tracking-[-.015em]">
                  {b.months}
                </div>
                <p className="mt-3 mb-0 text-[13.5px] leading-[1.6] text-ink-soft">
                  {b.note}
                </p>
              </div>
            </article>
          ))}
        </div>
      </Section>

      {/* ------------------------------------------------------- getting here */}
      <Section id="perjalanan" className="overflow-x-clip pt-20 md:pt-28">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-[minmax(240px,380px)_1fr]">
          <div data-reveal>
            <Eyebrow>{t.journey.eyebrow}</Eyebrow>
            <h2 className="mt-5 mb-0 text-[clamp(30px,4.4vw,46px)] leading-[1.08] font-bold tracking-[-.025em]">
              {t.journey.title}
            </h2>
            <p className="mt-3 text-[14px] leading-[1.65] text-slate">
              {t.journey.intro}
            </p>
            {/* The drawn islet that used to sit here is gone. What a reader
                wants under a heading called "getting here" is where here is,
                and a map answers that where an illustration cannot. */}
            <JourneyMap t={t} />
          </div>

          {/* Generous row and column gaps, and no clipping anywhere on this
              list: the illustrations hang past their cards' edges, and gutters
              are the space they hang into. */}
          <ol className="m-0 grid list-none grid-cols-1 gap-x-8 gap-y-10 p-0 sm:grid-cols-2">
            {t.journey.steps.map((j, i) => (
              <li
                key={i}
                data-reveal
                style={step(i)}
                /* isolate + z-10 on hover is not enough on its own: without a
                   stacking context per card, whichever card comes later in the
                   document draws over the one before it, and the plane on 01
                   ends up underneath 02. */
                className="relative isolate rounded-[20px] border border-line-soft bg-surface-mute px-6 pt-6 pb-8"
              >
                <JourneyScene step={STEP_SCENES[i] ?? "fly"} />
                <div className="relative">
                  {/* teal-deep, not teal: 12px teal on this cream measured
                      3.9:1. Predates the illustrations; caught measuring
                      them. */}
                  <div className="font-mono text-[12px] text-teal-deep">
                    {String(i + 1).padStart(2, "0")}
                  </div>
                  <div className="mt-2 max-w-[70%] text-[17px] font-bold tracking-[-.015em]">
                    {j.title}
                  </div>
                  <p className="mt-2 mb-0 max-w-[86%] text-[13.5px] leading-[1.6] text-slate">
                    {j.body}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </Section>

      {/* -------------------------------------------------------------- faq */}
      <Section id="tanya" className="pt-20 md:pt-28">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-[minmax(220px,320px)_1fr]">
          <div data-reveal>
            <Eyebrow>{t.faq.eyebrow}</Eyebrow>
            <h2 className="mt-5 mb-0 text-[clamp(30px,4.4vw,46px)] leading-[1.08] font-bold tracking-[-.025em]">
              {t.faq.title}
            </h2>
          </div>

          <div className="border-t border-line-soft">
            {t.faq.items.map((f, i) => (
              <details
                key={i}
                data-reveal
                style={step(i)}
                className="group border-b border-line-soft py-[18px]"
              >
                <summary className="flex cursor-pointer list-none items-center gap-4 text-[16px] font-medium">
                  <span className="flex-1">{f.q}</span>
                  <span className="text-[20px] leading-none text-slate-mute transition-transform group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="mt-3 mb-0 max-w-[640px] text-[14px] leading-[1.65] text-slate">
                  {f.a}
                </p>
              </details>
            ))}
          </div>
        </div>
      </Section>

      {/* ----------------------------------------------------------- footer */}
      {/* The Piaynemo viewpoint behind it, under a scrim heavy enough that
          every line here clears AA. Measured: this photograph is bright almost
          everywhere — turquoise water, pale sky, sunlit leaves — so the scrim
          is flat rather than a gradient, which would leave one corner readable
          and another not. `bg-teal` stays underneath as the floor, so a
          missing file gives back the green footer it replaced. */}
      <footer className="relative mt-20 overflow-hidden bg-teal py-14 md:mt-28">
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: 'url("/piaynemo.jpg")' }}
        />
        <div aria-hidden="true" className="absolute inset-0 bg-[#08291c]/88" />

        <Section className="relative">
          <div className="grid grid-cols-1 gap-10 md:grid-cols-[1.25fr_1fr] lg:grid-cols-[1.25fr_.9fr_1.1fr]">
            {/* ------------------------------------------------- identity */}
            <div>
              <div className="flex items-center gap-[16px]">
                <SiteLogo size={88} />
                <div className="leading-[1.25]">
                  <div className="text-[22px] font-bold tracking-[-.01em] text-white">
                    {PROPERTY.name}
                  </div>
                  <div className="mt-[3px] text-[13.5px] text-white/80">
                    {t.footer.tagline(SITE_CONFIG.founded.homestay)}
                  </div>
                </div>
              </div>

              <p className="mt-5 mb-0 max-w-[320px] text-[13.5px] leading-[1.65] text-white/80">
                {PROPERTY.village}, {PROPERTY.island}
                <br />
                Raja Ampat, Papua Barat Daya
              </p>

            </div>

            {/* -------------------------------------------------- contact */}
            <div>
              <div className="font-mono text-[10.5px] tracking-[.08em] text-white/75 uppercase">
                {t.footer.contact}
              </div>
              <div className="mt-4 flex flex-col gap-[14px] text-[13.5px]">
                <a
                  href={waLink(
                    `Halo ${PROPERTY.name}, saya ingin bertanya soal ketersediaan.`,
                  )}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-[11px] text-white no-underline hover:no-underline"
                >
                  <span className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full bg-white/15 p-[8px]">
                    <WhatsAppIcon />
                  </span>
                  +{WHATSAPP}
                </a>
                <a
                  href={`mailto:${EMAIL}`}
                  className="flex items-center gap-[11px] break-all text-white no-underline hover:no-underline"
                >
                  <span className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full bg-white/15 p-[8px]">
                    <MailIcon />
                  </span>
                  {EMAIL}
                </a>
              </div>

              {/* Under the email, with the rest of the ways to reach us.
                  Drawn whether or not the URLs are filled in: the accounts
                  exist, the links just are not typed yet. Until one is, its
                  icon is a dimmed span rather than an anchor — a link that
                  goes nowhere is a worse thing to ship than a placeholder that
                  is visibly not a link, and a screen reader is not told about
                  something it cannot follow. */}
              <div className="mt-7">
                <div className="font-mono text-[10.5px] tracking-[.08em] text-white/75 uppercase">
                  {t.footer.social}
                </div>
                <div className="mt-3 flex items-center gap-[10px]">
                  {SOCIALS.map((x) =>
                    x.href ? (
                      <a
                        key={x.name}
                        href={x.href}
                        target="_blank"
                        rel="noreferrer"
                        aria-label={x.name}
                        className="flex h-[40px] w-[40px] items-center justify-center rounded-full border border-white/30 bg-white/12 p-[10px] text-white no-underline transition-colors hover:bg-white/28 hover:no-underline"
                      >
                        {x.icon}
                      </a>
                    ) : (
                      <span
                        key={x.name}
                        aria-hidden="true"
                        title={x.name}
                        className="flex h-[40px] w-[40px] items-center justify-center rounded-full border border-white/20 bg-white/8 p-[10px] text-white/55"
                      >
                        {x.icon}
                      </span>
                    ),
                  )}
                </div>
              </div>
            </div>

            {/* ------------------------------------------------- feedback */}
            {/* This replaced the Pages column. The nav is three scrolls away at
                the top of the same page and duplicated it; what there was
                nowhere else to put is a guest who has already stayed and has
                something to say. */}
            <div>
              <div className="font-mono text-[10.5px] tracking-[.08em] text-white/75 uppercase">
                {t.footer.feedback.heading}
              </div>
              <p className="mt-3 mb-4 max-w-[360px] text-[13px] leading-[1.6] text-white/80">
                {t.footer.feedback.intro}
              </p>
              <FeedbackForm t={t} />
            </div>
          </div>

          <div className="mt-12 flex flex-col gap-3 border-t border-white/20 pt-6 text-[12.5px] text-white/75 sm:flex-row sm:items-center sm:justify-between">
            <span>{t.footer.colophon}</span>
            {/* Kept, moved. Losing the Pages column would otherwise have taken
                the owner's only way back to the dashboard with it. */}
            <a
              href="/"
              className="text-white/75 no-underline whitespace-nowrap hover:text-white hover:no-underline"
            >
              {t.footer.manager}
            </a>
          </div>
        </Section>
      </footer>

      <EnquiryModal
        siteKey="turtle"
        open={enquiryOpen}
        onClose={() => setEnquiryOpen(false)}
        t={t}
        months={monthsAhead}
        value={enquiry}
        onChange={patchEnquiry}
        message={message}
        lang={lang}
        activities={TURTLE_ACTIVITIES}
      />

      {/* The booking dialog, which exists only while something is being
          booked. What it asks for comes from what was pressed: a room asks
          for two dates and how many guests, a package for the day and how
          many divers, and the gear — hired by the day rather than by the
          head — for two dates again. */}
      {booking && (
        <BookModal
          open
          onClose={() => setBooking(null)}
          t={t}
          what={
            booking.kind === "room"
              ? t.rooms.types[booking.room].name
              : t.dive.packages[booking.pack].name
          }
          shape={
            booking.kind === "room"
              ? "stay"
              : DIVE_PER[booking.pack] === "day"
                ? "hire"
                : "dived"
          }
          /* A room's rate is a function of how many sleep in it, so the
             dialog is handed the lookup rather than a figure: the total
             under the guest picker has to move when the picker does. A dive
             package has one price whoever is on the boat. */
          unitPrice={
            booking.kind === "room"
              ? (guests) => roomRate(booking.room, guests) ?? 0
              : divePrice(booking.pack)
          }
          unitLabel={
            booking.kind === "room"
              ? t.rooms.perNight
              : t.dive.packages[booking.pack].unit
          }
          maxCount={
            booking.kind === "room" ? ROOM_SLEEPS[booking.room] : MAX_DIVERS
          }
          lang={lang}
          currency={currency}
          rates={rates}
          onConfirm={confirmBooking}
        />
      )}
    </div>
  );
}
