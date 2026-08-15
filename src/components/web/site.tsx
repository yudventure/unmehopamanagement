"use client";

import { useState } from "react";

import { BrandLogo } from "@/components/brand-logo";
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
 * The public site for Turtle Homestay and its dive centre — a separate route
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
 * as the name matches. If the file is missing the drawn scene underneath shows
 * instead, so the page never breaks over a bad upload.
 */
const HERO_PHOTO = "/hero.png";

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

export function TurtleSite() {
  const [menuOpen, setMenuOpen] = useState(false);

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
      <header className="fixed inset-x-0 top-0 z-50 border-b border-white/15 bg-ink/35 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-[1180px] items-center gap-4 px-5 py-[14px] md:px-8">
          <a href="#atas" className="flex shrink-0 items-center gap-[10px]">
            <span className="flex h-[34px] w-[34px] items-center justify-center rounded-full bg-white">
              <BrandLogo size={27} />
            </span>
            <span className="text-[15px] font-bold text-white">
              {PROPERTY.name}
            </span>
          </a>

          <nav className="ml-auto hidden items-center gap-[26px] lg:flex">
            {NAV.map((n) => (
              <a
                key={n.href}
                href={n.href}
                className="text-[13.5px] text-white/80 no-underline transition-colors hover:text-white hover:no-underline"
              >
                {n.label}
              </a>
            ))}
          </nav>

          <a
            href="#pesan"
            className="ml-auto rounded-full bg-white px-[18px] py-[9px] text-[13.5px] font-medium text-ink no-underline hover:bg-surface-hover hover:no-underline lg:ml-0"
          >
            Pesan
          </a>

          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Buka menu"
            aria-expanded={menuOpen}
            className="flex h-[36px] w-[36px] cursor-pointer flex-col items-center justify-center gap-[5px] rounded-full border border-white/30 bg-transparent lg:hidden"
          >
            <span className="block h-[1.5px] w-[15px] bg-white" />
            <span className="block h-[1.5px] w-[15px] bg-white" />
          </button>
        </div>

        {menuOpen && (
          <nav className="border-t border-white/15 bg-ink/90 px-5 py-3 lg:hidden">
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
        <div className="relative h-[500px] w-full overflow-hidden sm:h-[580px] md:h-[660px]">
          {/* The illustration is the floor, not the picture: it only shows if
              the photograph is missing, so a deploy without `public/hero.jpg`
              degrades to something drawn instead of to a broken image. */}
          <HeroScene className="absolute inset-0 h-full w-full object-cover" />

          {/* A background rather than an <img>: a missing file simply does not
              paint, so the illustration shows through with no broken-image
              marker and no JavaScript needed to hide one. The photo is
              decorative — the sentence beneath it carries the meaning. */}
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: `url("${HERO_PHOTO}")` }}
          />

          {/*
           * Scrim tuned for a bright photograph, not for the illustration.
           * White sand under white type is the hard case, and the sand is
           * exactly where the subtitle lands — so the gradient is heaviest at
           * the foot, lets the middle stay open where the picture does its
           * work, and darkens the crown again for the fixed header's nav.
           */}
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(9,26,24,.62)_0%,rgba(9,26,24,.22)_26%,rgba(9,26,24,.30)_50%,rgba(9,26,24,.66)_78%,rgba(9,26,24,.86)_100%)]" />

          {/* Nothing to click in the hero: no picker bar, no buttons. It
              carried the same three questions the enquiry form asks, and
              buttons in its place were the same call twice on one screen —
              the header's "Pesan" is already there and stays there while the
              page scrolls. */}
          {/* The shadow is the second line of defence behind the scrim: a
              photograph can put a bright cloud or a strip of sand anywhere,
              and the gradient alone cannot know where. */}
          <div className="absolute inset-x-0 bottom-0 mx-auto flex w-full max-w-[1180px] flex-col items-center px-5 pb-[64px] text-center md:px-8 md:pb-[84px] [text-shadow:0_2px_28px_rgba(6,20,18,.62)]">
            <h1 className="m-0 text-[clamp(52px,11vw,132px)] leading-[.92] font-bold tracking-[-.035em] text-white">
              Turtle
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

          {/* Three frames at different heights, so the cluster reads as a
              spread rather than a row of equal tiles. */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <div>
              <Frame ratio="3 / 4">
                <JettyScene className={FILL} />
                <span className="absolute right-3 bottom-3 rounded-full bg-ink/70 px-[11px] py-[5px] text-[11.5px] text-white">
                  Yenbuba
                </span>
              </Frame>
              <div className="mt-[10px] text-[13.5px] font-medium">
                Kamar di atas air
              </div>
              <div className="text-[12.5px] text-slate-soft">
                Sepuluh kamar, satu jetty
              </div>
            </div>

            <div className="sm:mt-10">
              <Frame ratio="3 / 4">
                <SnorkelScene className={FILL} />
                <span className="absolute right-3 bottom-3 rounded-full bg-ink/70 px-[11px] py-[5px] text-[11.5px] text-white">
                  Depan dermaga
                </span>
              </Frame>
              <div className="mt-[10px] text-[13.5px] font-medium">
                Karang rumah
              </div>
              <div className="text-[12.5px] text-slate-soft">
                Tinggal turun dari tangga
              </div>
            </div>

            <div className="hidden sm:mt-4 sm:block">
              <Frame ratio="3 / 4">
                <IsletScene className={FILL} warm />
                <span className="absolute right-3 bottom-3 rounded-full bg-ink/70 px-[11px] py-[5px] text-[11.5px] text-white">
                  Selat Dampier
                </span>
              </Frame>
              <div className="mt-[10px] text-[13.5px] font-medium">
                Sore di perahu
              </div>
              <div className="text-[12.5px] text-slate-soft">
                Gugusan karst dari air
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
              <div className="flex items-center gap-[10px]">
                <span className="flex h-[38px] w-[38px] items-center justify-center rounded-full bg-white">
                  <BrandLogo size={30} />
                </span>
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
