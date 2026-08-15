"use client";

import { useEffect, useState } from "react";

import {
  HeroScene,
  IsletScene,
  JettyScene,
  ReefScene,
  SnorkelScene,
} from "@/components/web/scenes";
import { fmt } from "@/lib/format";
import {
  ACTIVITIES,
  DIVE_PACKAGES,
  EMAIL,
  FAQ,
  JOURNEY,
  PROPERTY,
  SEASON_BANDS,
  WHATSAPP,
  type ActivityKey,
  monthOptions,
  roomTypes,
  waLink,
} from "@/lib/web-content";

/**
 * The public site for Turtle Dive Homestay — a separate route
 * from the booking manager, sharing only the room rates and the illustration
 * kit.
 *
 * Every call to action ends in the same place: a WhatsApp message with the
 * enquiry already written out. That is not a placeholder for a booking engine
 * — it is how a homestay on Mansuar actually takes a booking, and it works
 * with no backend, no payment provider and no account to create. Rooms are
 * also pointed at the OTA listings, because that is where their calendars
 * live; the dive centre is the part that is genuinely booked here.
 */

const NAV = [
  { href: "#atas", label: "Beranda" },
  { href: "#kamar", label: "Kamar" },
  { href: "#diving", label: "Diving" },
  { href: "#musim", label: "Musim" },
  { href: "#perjalanan", label: "Cara Sampai" },
  { href: "#tanya", label: "Tanya" },
];

const MONTHS_AHEAD = monthOptions(new Date(2026, 7, 1));

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
 * The homestay's own badge, used across the site in place of the Unmehopa
 * mark — the manager belongs to the company, this site belongs to one
 * property, and they are not the same brand.
 *
 * The file has a solid white background, so it is masked to a circle. Its ink
 * sits at most 134px from the centre of a 300px square, which is inside the
 * 150px mask: the corners go, the badge is untouched.
 */
function SiteLogo({ size }: { size: number }) {
  return (
    <span
      className="block shrink-0 overflow-hidden rounded-full bg-white"
      style={{ width: size, height: size }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/logo.png"
        alt={`Logo ${PROPERTY.name}`}
        width={size}
        height={size}
        className="h-full w-full object-cover"
      />
    </span>
  );
}

const PILL_DARK =
  "inline-flex items-center justify-center rounded-full bg-ink px-6 py-[13px] text-[14px] font-medium text-white transition-colors hover:bg-ink-soft";
const PILL_LIGHT =
  "inline-flex items-center justify-center rounded-full border border-line-strong bg-surface px-6 py-[13px] text-[14px] font-medium text-ink transition-colors hover:bg-surface-hover";

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-[7px] rounded-full border border-line-strong bg-surface px-[13px] py-[6px] text-[12px] text-slate">
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

export function TurtleSite() {
  const [menuOpen, setMenuOpen] = useState(false);

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

  /* The hero picker and every "Pesan" button write into the same enquiry, so
     whichever one the visitor touched, the message that opens is already
     about the thing they touched. */
  const [activity, setActivity] = useState<ActivityKey>("menginap");
  const [when, setWhen] = useState(MONTHS_AHEAD[0]);
  const [people, setPeople] = useState("2");
  const [nights, setNights] = useState("3");
  const [detail, setDetail] = useState("");
  const [name, setName] = useState("");

  const activityLabel =
    ACTIVITIES.find((a) => a.key === activity)?.label ?? "Menginap";

  const message = [
    `Halo ${PROPERTY.name}, saya ingin bertanya soal ${activityLabel.toLowerCase()}.`,
    "",
    name.trim() && `Nama: ${name.trim()}`,
    `Rencana: ${when}`,
    `Jumlah orang: ${people}`,
    activity !== "diving" && activity !== "snorkeling" && `Lama menginap: ${nights} malam`,
    detail.trim() && `Catatan: ${detail.trim()}`,
    "",
    "Terima kasih.",
  ]
    .filter(Boolean)
    .join("\n");

  /** Points the enquiry at one thing, then jumps to the form. */
  const ask = (next: ActivityKey, note: string) => {
    setActivity(next);
    setDetail(note);
    document.getElementById("pesan")?.scrollIntoView({ behavior: "smooth" });
  };

  const rooms = roomTypes();

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
               * are needed: this sky is close to white in places, and white
               * links on it with nothing behind them cannot be read.
               */
              /* bg-no-repeat matters: the bar's height is fractional, so the
                 gradient tile falls a sliver short and repeats — painting its
                 darkest row back at the bottom edge as a hairline that looks
                 exactly like the border this state is meant to drop. */
              "border-transparent bg-[linear-gradient(180deg,rgba(6,20,18,.42)_0%,rgba(6,20,18,.14)_55%,rgba(6,20,18,0)_88%)] bg-no-repeat [text-shadow:0_1px_16px_rgba(6,20,18,.75)]"
        }`}
      >
        {/* No mark and no wordmark: the hero says the name in display type a
            moment below, and with the bar carrying only links the whole row
            can sit centred rather than pushed to one side by a logo. */}
        <div className="mx-auto flex w-full max-w-[1180px] items-center justify-center gap-4 px-5 py-[14px] md:px-8">
          <nav className="hidden items-center gap-[26px] lg:flex">
            {NAV.map((n) => (
              <a
                key={n.href}
                href={n.href}
                className="text-[13.5px] text-white/80 no-underline transition-colors hover:text-white hover:no-underline"
              >
                {n.label}
              </a>
            ))}
            <a
              href="#pesan"
              className="rounded-full bg-white px-[18px] py-[9px] text-[13.5px] font-medium text-ink no-underline hover:bg-surface-hover hover:no-underline"
            >
              Pesan
            </a>
          </nav>

          {/* Below the nav's breakpoint the row is the two controls, still
              centred as a pair. */}
          <div className="flex items-center gap-3 lg:hidden">
            <a
              href="#pesan"
              className="rounded-full bg-white px-[18px] py-[9px] text-[13.5px] font-medium text-ink no-underline hover:bg-surface-hover hover:no-underline"
            >
              Pesan
            </a>
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              aria-label="Buka menu"
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
            {NAV.map((n) => (
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
          <div className="relative h-[620px] w-full overflow-hidden sm:h-[720px] md:h-[820px]">
          {/* The illustration is the floor, not the picture: it only shows if
              the photograph is missing, so a deploy without `public/hero.jpg`
              degrades to something drawn instead of to a broken image. */}
          <HeroScene className="absolute inset-0 h-full w-full object-cover" />

          {/* A background rather than an <img>: a missing file simply does not
              paint, so the illustration shows through with no broken-image
              marker and no JavaScript needed to hide one. The photo is
              decorative — the sentence beneath it carries the meaning.

              The crop pulls to the bottom on wide screens: this is a shot
              straight down, the huts and boats sit around the middle of the
              frame, and anchoring the jungle at the foot lifts them clear of
              the headline. A phone shows the frame's full height either way,
              so it stays centred. */}
          <div
            className="absolute inset-0 bg-cover bg-no-repeat bg-center sm:bg-bottom"
            style={{ backgroundImage: `url("${HERO_PHOTO}")` }}
          />

          {/*
           * Nothing over the top third: the sky and the ridge keep their own
           * colour, which is the whole reason to use a photograph. The fade
           * starts below the picture's subject and runs to near-black at the
           * foot, where the sand is and where the type lands. The header
           * darkens itself rather than borrowing from this gradient, so the
           * green stays green right up to the nav.
           */}
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(9,26,24,0)_0%,rgba(9,26,24,0)_36%,rgba(9,26,24,.26)_56%,rgba(9,26,24,.68)_78%,rgba(9,26,24,.94)_100%)]" />

          {/* Nothing to click in the hero: no picker bar, no buttons. It
              carried the same three questions the enquiry form asks, and
              buttons in its place were the same call twice on one screen —
              the header's "Pesan" is already there and stays there while the
              page scrolls. */}
          {/* The shadow is the second line of defence behind the scrim: a
              photograph can put a bright cloud or a strip of sand anywhere,
              and the gradient alone cannot know where. */}
          <div className="absolute inset-x-0 bottom-0 mx-auto flex w-full max-w-[1180px] flex-col items-center px-5 pb-[64px] text-center md:px-8 md:pb-[84px] [text-shadow:0_2px_28px_rgba(6,20,18,.62)]">
            <h1 className="m-0 max-w-[15ch] text-[clamp(38px,7vw,92px)] leading-[1.02] font-bold tracking-[-.03em] text-balance text-white">
              Turtle Dive Homestay
            </h1>
            <p className="mt-4 max-w-[560px] text-[15px] leading-[1.6] text-white/90">
              Homestay dan dive center milik keluarga di Yenbuba, Pulau Mansuar.
              Tidur di atas air, sarapan menghadap Selat Dampier, menyelam
              sebelum matahari tinggi.
            </p>
          </div>
        </div>
      </div>

      {/* --------------------------------------------------------- values */}
      <Section className="pt-16 md:pt-24">
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Eyebrow>Dikelola langsung oleh keluarga pemilik</Eyebrow>
          <Eyebrow>10 kamar · maksimal 24 tamu</Eyebrow>
          <Eyebrow>Dive center di dermaga sendiri</Eyebrow>
        </div>

        <h2 className="mx-auto mt-9 max-w-[860px] text-center text-[clamp(34px,5.4vw,62px)] leading-[1.04] font-bold tracking-[-.03em]">
          Satu dermaga, satu keluarga,
          <br className="hidden md:block" /> dan karang tepat di depannya
        </h2>

        <div className="mt-14 grid grid-cols-1 items-start gap-8 md:grid-cols-[minmax(240px,340px)_1fr]">
          <div>
            <Eyebrow>01 · Kenapa di sini</Eyebrow>
            <h3 className="mt-5 text-[28px] leading-[1.15] font-bold tracking-[-.02em]">
              Bukan resort.
              <br />
              Rumah orang.
            </h3>
            <p className="mt-3 text-[14.5px] leading-[1.65] text-slate">
              Kamar dibangun sendiri dari kayu setempat, makanan dimasak di
              dapur yang sama dengan keluarga, dan yang mengantar kamu menyelam
              adalah orang yang lahir di teluk ini. Tidak ada resepsionis, tidak
              ada seragam.
            </p>
            <button
              type="button"
              onClick={() =>
                ask("menginap", "Saya ingin tahu ketersediaan kamar.")
              }
              className={`${PILL_DARK} mt-6 cursor-pointer border-none`}
            >
              Tanya ketersediaan
            </button>
          </div>

          {/*
           * Three frames at different heights, so the cluster reads as a
           * spread rather than a row of equal tiles.
           *
           * The captions follow what each photograph actually shows. Slotted
           * in the order they were given, 1/2/3 landed under "kamar di atas
           * air", "karang rumah" and "sore di perahu" — but 1 is dusk on the
           * jetty, 2 is lunch under the dining hut, and 3 is the bungalow
           * walk. None of the three shows a reef. Captioning a plate of food
           * as the house reef is the kind of thing a guest notices, so the
           * words moved to meet the pictures rather than the other way round.
           */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <div>
              <Frame ratio="3 / 4">
                <JettyScene className={FILL} />
                <PhotoFill src="/1.jpg" alt="Tamu duduk di ujung dermaga saat matahari terbenam" />
                <span className="absolute right-3 bottom-3 rounded-full bg-ink/70 px-[11px] py-[5px] text-[11.5px] text-white">
                  Dermaga
                </span>
              </Frame>
              <div className="mt-[10px] text-[13.5px] font-medium">
                Sore di dermaga
              </div>
              <div className="text-[12.5px] text-slate-soft">
                Senja dari ujung jetty
              </div>
            </div>

            <div className="sm:mt-10">
              <Frame ratio="3 / 4">
                <SnorkelScene className={FILL} />
                <PhotoFill src="/2.jpg" alt="Dua tamu makan di bawah pondok kayu beratap rumbia" />
                <span className="absolute right-3 bottom-3 rounded-full bg-ink/70 px-[11px] py-[5px] text-[11.5px] text-white">
                  Pondok makan
                </span>
              </Frame>
              <div className="mt-[10px] text-[13.5px] font-medium">
                Makan bersama
              </div>
              <div className="text-[12.5px] text-slate-soft">
                Tiga kali sehari, satu meja
              </div>
            </div>

            <div className="hidden sm:mt-4 sm:block">
              <Frame ratio="3 / 4">
                <IsletScene className={FILL} warm />
                <PhotoFill src="/3.jpg" alt="Jalur papan di depan deretan bungalow beratap rumbia" />
                <span className="absolute right-3 bottom-3 rounded-full bg-ink/70 px-[11px] py-[5px] text-[11.5px] text-white">
                  Yenbuba
                </span>
              </Frame>
              <div className="mt-[10px] text-[13.5px] font-medium">
                Kamar di atas air
              </div>
              <div className="text-[12.5px] text-slate-soft">
                Sepuluh kamar, satu jalur papan
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* ---------------------------------------------------------- rooms */}
      <Section id="kamar" className="pt-20 md:pt-28">
        <Eyebrow>Kamar & harga</Eyebrow>
        <div className="mt-5 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <h2 className="m-0 max-w-[620px] text-[clamp(34px,5.2vw,58px)] leading-[1.05] font-bold tracking-[-.03em]">
            Pilih Kamarmu
          </h2>
          <p className="max-w-[380px] text-[14px] leading-[1.6] text-slate">
            Harga per kamar per malam, sudah termasuk tiga kali makan. Kami
            tidak memungut biaya kebersihan atau biaya layanan.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2">
          {rooms.map((r, i) => (
            <article
              key={r.key}
              className="overflow-hidden rounded-[24px] border border-line-soft bg-surface"
            >
              <Frame ratio="16 / 10" className="rounded-none">
                {i === 0 ? (
                  <JettyScene className={FILL} />
                ) : (
                  <IsletScene className={FILL} />
                )}
                <span className="absolute top-4 left-4 rounded-full bg-white/92 px-[12px] py-[6px] text-[12px] font-medium">
                  {r.count} kamar
                </span>
              </Frame>

              <div className="px-6 py-6">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h3 className="m-0 text-[21px] font-bold tracking-[-.015em]">
                    {r.name}
                  </h3>
                  <div className="text-right">
                    <div className="text-[19px] font-bold">{fmt(r.rate)}</div>
                    <div className="text-[11.5px] text-slate-soft">
                      per malam
                    </div>
                  </div>
                </div>

                <p className="mt-2 text-[14px] leading-[1.6] text-slate">
                  {r.blurb}
                </p>

                <ul className="mt-4 mb-0 grid list-none grid-cols-1 gap-x-4 gap-y-[7px] p-0 sm:grid-cols-2">
                  {r.features.map((f) => (
                    <li
                      key={f}
                      className="flex items-start gap-[9px] text-[13px] text-ink-soft"
                    >
                      <span className="mt-[6px] h-[6px] w-[6px] shrink-0 rounded-full bg-teal" />
                      {f}
                    </li>
                  ))}
                </ul>

                <div className="mt-6 flex flex-wrap gap-[10px]">
                  <button
                    type="button"
                    onClick={() =>
                      ask(
                        "menginap",
                        `Saya tertarik ${r.name} (${r.cap}).`,
                      )
                    }
                    className={`${PILL_DARK} cursor-pointer border-none`}
                  >
                    Tanya kamar ini
                  </button>
                  <span className="inline-flex items-center text-[12.5px] text-slate-soft">
                    {r.cap}
                  </span>
                </div>
              </div>
            </article>
          ))}
        </div>

        <p className="mt-6 rounded-[16px] border border-line-soft bg-surface-mute px-5 py-4 text-[13.5px] leading-[1.6] text-slate">
          Kamar juga terdaftar di Booking.com, Agoda dan Traveloka. Kalau kamu
          lebih nyaman pesan lewat sana, silakan — harganya sama, hanya lewat
          kami tidak ada komisi platform. Yang belum bisa dipesan di OTA mana
          pun adalah paket menyelam; itu diatur langsung lewat WhatsApp.
        </p>
      </Section>

      {/* --------------------------------------------------------- diving */}
      <div id="diving" className="mt-20 scroll-mt-[84px] bg-ink py-20 md:mt-28 md:py-28">
        <Section>
          <div className="grid grid-cols-1 items-center gap-10 md:grid-cols-[1fr_minmax(280px,460px)]">
            <div>
              <span className="inline-flex items-center gap-[7px] rounded-full border border-white/20 px-[13px] py-[6px] text-[12px] text-white/75">
                <span className="h-[6px] w-[6px] rounded-full bg-amber" />
                Turtle Dive Center
              </span>
              <h2 className="mt-5 mb-0 text-[clamp(34px,5.2vw,58px)] leading-[1.05] font-bold tracking-[-.03em] text-white">
                Selam pagi,
                <br />
                pulang sebelum makan siang
              </h2>
              <p className="mt-4 max-w-[520px] text-[14.5px] leading-[1.65] text-white/70">
                Kami menyelam di Selat Dampier — Cape Kri, Mike&apos;s Point,
                Sardine Reef, Manta Point — semuanya dalam 20 sampai 45 menit
                perahu dari dermaga. Perahu berangkat dua kali sehari, maksimal
                enam penyelam per guide.
              </p>
            </div>
            <Frame ratio="4 / 3" className="rounded-[26px]">
              <ReefScene className={FILL} />
            </Frame>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {DIVE_PACKAGES.map((p) => (
              <article
                key={p.key}
                className={`flex flex-col rounded-[20px] px-6 py-6 ${
                  p.featured
                    ? "bg-amber text-amber-deep"
                    : "bg-white/8 text-white"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <h3 className="m-0 text-[17px] leading-[1.25] font-bold">
                    {p.name}
                  </h3>
                  <span
                    className={`shrink-0 rounded-full px-[10px] py-[4px] text-[11px] whitespace-nowrap ${
                      p.featured ? "bg-amber-deep/12" : "bg-white/12"
                    }`}
                  >
                    {p.duration}
                  </span>
                </div>

                <p
                  className={`mt-[10px] text-[13.5px] leading-[1.6] ${
                    p.featured ? "text-amber-deep/80" : "text-white/65"
                  }`}
                >
                  {p.blurb}
                </p>

                <ul className="mt-4 mb-0 flex list-none flex-wrap gap-[6px] p-0">
                  {p.includes.map((inc) => (
                    <li
                      key={inc}
                      className={`rounded-full px-[10px] py-[4px] text-[11.5px] ${
                        p.featured
                          ? "bg-amber-deep/10"
                          : "bg-white/10 text-white/75"
                      }`}
                    >
                      {inc}
                    </li>
                  ))}
                </ul>

                <div
                  className={`mt-5 flex items-end justify-between gap-3 border-t pt-4 ${
                    p.featured ? "border-amber-deep/15" : "border-white/12"
                  }`}
                >
                  <div>
                    <div className="text-[20px] font-bold">{fmt(p.price)}</div>
                    <div
                      className={`text-[11.5px] ${
                        p.featured ? "text-amber-deep/70" : "text-white/55"
                      }`}
                    >
                      {p.unit} · {p.level}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      ask(
                        p.key === "snorkel" ? "snorkeling" : "diving",
                        `Saya tertarik paket "${p.name}".`,
                      )
                    }
                    className={`cursor-pointer rounded-full border-none px-[16px] py-[9px] text-[13px] font-medium ${
                      p.featured
                        ? "bg-amber-deep text-amber"
                        : "bg-white text-ink hover:bg-surface-hover"
                    }`}
                  >
                    Pesan
                  </button>
                </div>
              </article>
            ))}
          </div>

          <p className="mt-6 text-[13px] leading-[1.6] text-white/50">
            Penyelam bersertifikat harap membawa kartu dan buku log. Untuk
            kursus Open Water, kabari minimal satu minggu sebelumnya supaya
            materi dan jadwal instruktur bisa disiapkan.
          </p>
        </Section>
      </div>

      {/* --------------------------------------------------------- season */}
      <Section id="musim" className="pt-20 md:pt-28">
        <Eyebrow>Kapan sebaiknya datang</Eyebrow>
        <div className="mt-5 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <h2 className="m-0 max-w-[560px] text-[clamp(34px,5.2vw,58px)] leading-[1.05] font-bold tracking-[-.03em]">
            Laut punya musimnya
          </h2>
          <p className="max-w-[400px] text-[14px] leading-[1.6] text-slate">
            Raja Ampat bisa dikunjungi sepanjang tahun, tapi airnya tidak sama
            tiap bulan. Ini yang kami lihat dari dermaga sendiri.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-3">
          {SEASON_BANDS.map((b) => (
            <article
              key={b.label}
              className={`rounded-[20px] border px-6 py-6 ${
                b.tone === "peak"
                  ? "border-teal-line bg-teal-tint"
                  : b.tone === "good"
                    ? "border-amber-soft bg-amber-soft/45"
                    : "border-line-soft bg-surface-mute"
              }`}
            >
              <div className="text-[12px] text-slate-soft">{b.label}</div>
              <div className="mt-1 text-[19px] font-bold tracking-[-.015em]">
                {b.months}
              </div>
              <p className="mt-3 mb-0 text-[13.5px] leading-[1.6] text-slate">
                {b.note}
              </p>
            </article>
          ))}
        </div>
      </Section>

      {/* ------------------------------------------------------- getting here */}
      <Section id="perjalanan" className="pt-20 md:pt-28">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-[minmax(240px,380px)_1fr]">
          <div>
            <Eyebrow>Cara sampai</Eyebrow>
            <h2 className="mt-5 mb-0 text-[clamp(30px,4.4vw,46px)] leading-[1.08] font-bold tracking-[-.025em]">
              Empat langkah dari Jakarta
            </h2>
            <p className="mt-3 text-[14px] leading-[1.65] text-slate">
              Perjalanan panjang, tapi lurus. Kabari kami jadwal kapalmu dan
              perahu sudah menunggu di Waisai.
            </p>
            <Frame ratio="4 / 3" className="mt-6 hidden md:block">
              <IsletScene className={FILL} />
            </Frame>
          </div>

          <ol className="m-0 grid list-none grid-cols-1 gap-4 p-0 sm:grid-cols-2">
            {JOURNEY.map((j) => (
              <li
                key={j.step}
                className="rounded-[20px] border border-line-soft bg-surface-mute px-6 py-6"
              >
                <div className="font-mono text-[12px] text-teal">{j.step}</div>
                <div className="mt-2 text-[17px] font-bold tracking-[-.015em]">
                  {j.title}
                </div>
                <p className="mt-2 mb-0 text-[13.5px] leading-[1.6] text-slate">
                  {j.body}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </Section>

      {/* ---------------------------------------------------------- enquiry */}
      <Section id="pesan" className="pt-20 md:pt-28">
        <div className="overflow-hidden rounded-[28px] border border-line-soft bg-surface-mute">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_minmax(300px,420px)]">
            <div className="px-7 py-9 md:px-10 md:py-11">
              <Eyebrow>Pesan langsung</Eyebrow>
              <h2 className="mt-5 mb-0 text-[clamp(30px,4.4vw,48px)] leading-[1.06] font-bold tracking-[-.025em]">
                Kirim satu pesan,
                <br />
                kami balas hari itu juga
              </h2>
              <p className="mt-3 max-w-[520px] text-[14px] leading-[1.65] text-slate">
                Isi seadanya di bawah. Tombolnya akan membuka WhatsApp dengan
                pesan yang sudah tertulis — kamu tinggal kirim. Tidak ada
                pembayaran di halaman ini dan tidak ada akun yang perlu dibuat.
              </p>

              <div className="mt-7 grid grid-cols-1 gap-[14px] sm:grid-cols-2">
                <label className="flex flex-col gap-[6px] text-[12.5px] text-slate">
                  Nama
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Nama kamu"
                    className="rounded-[12px] border border-line-input bg-surface px-[13px] py-[11px] text-[14px] outline-none focus:border-teal"
                  />
                </label>

                <label className="flex flex-col gap-[6px] text-[12.5px] text-slate">
                  Mau apa
                  <select
                    value={activity}
                    onChange={(e) => setActivity(e.target.value as ActivityKey)}
                    className="cursor-pointer rounded-[12px] border border-line-input bg-surface px-[13px] py-[11px] text-[14px] outline-none focus:border-teal"
                  >
                    {ACTIVITIES.map((a) => (
                      <option key={a.key} value={a.key}>
                        {a.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="flex flex-col gap-[6px] text-[12.5px] text-slate">
                  Kapan
                  <select
                    value={when}
                    onChange={(e) => setWhen(e.target.value)}
                    className="cursor-pointer rounded-[12px] border border-line-input bg-surface px-[13px] py-[11px] text-[14px] outline-none focus:border-teal"
                  >
                    {MONTHS_AHEAD.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </label>

                <div className="grid grid-cols-2 gap-[14px]">
                  <label className="flex flex-col gap-[6px] text-[12.5px] text-slate">
                    Orang
                    <input
                      value={people}
                      onChange={(e) => setPeople(e.target.value)}
                      inputMode="numeric"
                      className="rounded-[12px] border border-line-input bg-surface px-[13px] py-[11px] text-[14px] outline-none focus:border-teal"
                    />
                  </label>
                  <label className="flex flex-col gap-[6px] text-[12.5px] text-slate">
                    Malam
                    <input
                      value={nights}
                      onChange={(e) => setNights(e.target.value)}
                      inputMode="numeric"
                      className="rounded-[12px] border border-line-input bg-surface px-[13px] py-[11px] text-[14px] outline-none focus:border-teal"
                    />
                  </label>
                </div>

                <label className="flex flex-col gap-[6px] text-[12.5px] text-slate sm:col-span-2">
                  Catatan
                  <textarea
                    value={detail}
                    onChange={(e) => setDetail(e.target.value)}
                    rows={3}
                    placeholder="Alergi makanan, jadwal kapal, sertifikat selam, apa saja."
                    className="resize-y rounded-[12px] border border-line-input bg-surface px-[13px] py-[11px] text-[14px] outline-none focus:border-teal"
                  />
                </label>
              </div>

              <div className="mt-7 flex flex-wrap items-center gap-3">
                <a
                  href={waLink(message)}
                  target="_blank"
                  rel="noreferrer"
                  className={`${PILL_DARK} no-underline hover:no-underline`}
                >
                  Buka WhatsApp
                </a>
                <a
                  href={`mailto:${EMAIL}?subject=${encodeURIComponent(
                    `Tanya ${activityLabel} — ${when}`,
                  )}&body=${encodeURIComponent(message)}`}
                  className={`${PILL_LIGHT} no-underline hover:no-underline`}
                >
                  Kirim email
                </a>
              </div>
            </div>

            {/* What the message will say, before it is sent. */}
            <div className="border-t border-line-soft bg-surface px-7 py-9 md:px-8 lg:border-t-0 lg:border-l">
              <div className="font-mono text-[10.5px] tracking-[.08em] text-slate-faint uppercase">
                Pesan yang akan terkirim
              </div>
              <pre className="mt-4 mb-0 font-sans text-[13.5px] leading-[1.65] whitespace-pre-wrap text-ink-soft">
                {message}
              </pre>
            </div>
          </div>
        </div>
      </Section>

      {/* -------------------------------------------------------------- faq */}
      <Section id="tanya" className="pt-20 md:pt-28">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-[minmax(220px,320px)_1fr]">
          <div>
            <Eyebrow>Yang sering ditanya</Eyebrow>
            <h2 className="mt-5 mb-0 text-[clamp(30px,4.4vw,46px)] leading-[1.08] font-bold tracking-[-.025em]">
              Sebelum kamu tanya
            </h2>
          </div>

          <div className="border-t border-line-soft">
            {FAQ.map((f) => (
              <details
                key={f.q}
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
      <footer className="mt-20 bg-teal py-14 md:mt-28">
        <Section>
          <div className="grid grid-cols-1 gap-10 md:grid-cols-[1.3fr_1fr_1fr]">
            <div>
              <div className="flex items-center gap-[12px]">
                <SiteLogo size={52} />
                <div className="leading-[1.2]">
                  <div className="text-[16px] font-bold text-white">
                    {PROPERTY.name}
                  </div>
                  <div className="text-[12.5px] text-white/70">
                    {PROPERTY.tagline}
                  </div>
                </div>
              </div>
              <p className="mt-5 mb-0 max-w-[320px] text-[13.5px] leading-[1.65] text-white/70">
                {PROPERTY.village}, {PROPERTY.island}
                <br />
                {PROPERTY.region}
              </p>
            </div>

            <div>
              <div className="font-mono text-[10.5px] tracking-[.08em] text-white/50 uppercase">
                Kontak
              </div>
              <div className="mt-4 flex flex-col gap-[10px] text-[13.5px]">
                <a
                  href={waLink(
                    `Halo ${PROPERTY.name}, saya ingin bertanya soal ketersediaan.`,
                  )}
                  target="_blank"
                  rel="noreferrer"
                  className="text-white/80 no-underline hover:text-white hover:no-underline"
                >
                  WhatsApp +{WHATSAPP}
                </a>
                <a
                  href={`mailto:${EMAIL}`}
                  className="text-white/80 no-underline hover:text-white hover:no-underline"
                >
                  {EMAIL}
                </a>
              </div>
            </div>

            <div>
              <div className="font-mono text-[10.5px] tracking-[.08em] text-white/50 uppercase">
                Halaman
              </div>
              <div className="mt-4 flex flex-col gap-[10px] text-[13.5px]">
                {NAV.map((n) => (
                  <a
                    key={n.href}
                    href={n.href}
                    className="text-white/80 no-underline hover:text-white hover:no-underline"
                  >
                    {n.label}
                  </a>
                ))}
                <a
                  href="/"
                  className="text-white/55 no-underline hover:text-white hover:no-underline"
                >
                  Masuk pengelola
                </a>
              </div>
            </div>
          </div>

          <div className="mt-12 border-t border-white/15 pt-6 text-[12.5px] text-white/55">
            © {PROPERTY.name}, {PROPERTY.village}. Dikelola bersama Eddo
            Homestay di Sawinggrai, Pulau Gam.
          </div>
        </Section>
      </footer>
    </div>
  );
}
