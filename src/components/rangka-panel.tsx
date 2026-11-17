"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { BrandLogo } from "@/components/brand-logo";
import { NavIcon } from "@/components/icons";
import type { Screen } from "@/lib/types";

export interface NavItem {
  key: Screen;
  label: string;
}

export interface Kabar {
  id: string;
  judul: string;
  baris: string;
}

export interface RangkaPanelProps {
  nav: NavItem[];
  screen: Screen;
  onScreen: (screen: Screen) => void;
  /** Nama dan peran orang yang sedang masuk, untuk menu akun. */
  nama: string;
  email: string;
  peran: string;
  /** Satu kalimat utuh untuk kartu HARI INI di bawah menu. */
  hariIni: string;
  /** Booking yang menunggu konfirmasi, untuk lonceng. */
  kabar: Kabar[];
  query: string;
  onQuery: (value: string) => void;
  /** Kosong berarti tombol + Booking disembunyikan (peran tanpa kalender). */
  onOpenForm?: () => void;
  onLogout: () => void;
  children: React.ReactNode;
}

/*
 * Rangka panel pengelola, mengikuti panel-homestay dari Mambetron: bilah atas
 * putih, menu samping putih dengan butir aktif berupa pil gelap, kartu HARI INI
 * di bawah menu, dan di ponsel menu menjadi lembar dari bawah.
 *
 * Tanpa garis datar pemisah. Bilah atas dipisahkan bayangan tipis, butir menu
 * oleh jarak. Warna hanya lewat token `panel-*`.
 */

function Ikon({ nama, className = "size-5" }: { nama: string; className?: string }) {
  const garis = {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden {...garis}>
      {nama === "lonceng" && (
        <>
          <path d="M6 9a6 6 0 1 1 12 0c0 5 2 6.5 2 6.5H4S6 14 6 9Z" />
          <path d="M10 19a2 2 0 0 0 4 0" />
        </>
      )}
      {nama === "bawah" && <path d="m6 9 6 6 6-6" />}
      {nama === "menu" && <path d="M4 7h16M4 12h16M4 17h16" />}
      {nama === "silang" && <path d="m6 6 12 12M18 6 6 18" />}
      {nama === "keluar" && (
        <>
          <path d="M9 4H5a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h4" />
          <path d="M16 8l4 4-4 4M20 12H9" />
        </>
      )}
      {nama === "cari" && (
        <>
          <circle cx="11" cy="11" r="6.5" />
          <path d="m20 20-4-4" />
        </>
      )}
      {nama === "tambah" && <path d="M12 5v14M5 12h14" />}
    </svg>
  );
}

/** Menutup pop-up bila ada ketukan di luar, lewat pendengar di dokumen. iPhone tidak mengirim click ke elemen tanpa penangan. */
function useTutupLuar(
  aktif: boolean,
  tutup: () => void,
  di: React.RefObject<HTMLElement | null>[],
) {
  useEffect(() => {
    if (!aktif) return;
    const tekan = (e: Event) => {
      const t = e.target as Node;
      if (di.some((r) => r.current?.contains(t))) return;
      tutup();
    };
    const esc = (e: KeyboardEvent) => e.key === "Escape" && tutup();
    document.addEventListener("pointerdown", tekan);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("pointerdown", tekan);
      document.removeEventListener("keydown", esc);
    };
  }, [aktif, tutup, di]);
}

/** Mengunci gulir halaman dengan membekukan body. `overflow: hidden` saja diabaikan Safari untuk sentuhan. */
function useKunciGulir(aktif: boolean) {
  useEffect(() => {
    if (!aktif) return;
    const y = window.scrollY;
    const b = document.body;
    const lama = { position: b.style.position, top: b.style.top, width: b.style.width };
    b.style.position = "fixed";
    b.style.top = `-${y}px`;
    b.style.width = "100%";
    return () => {
      b.style.position = lama.position;
      b.style.top = lama.top;
      b.style.width = lama.width;
      window.scrollTo(0, y);
    };
  }, [aktif]);
}

const inisial = (nama: string) =>
  (nama.trim().split(/\s+/).slice(0, 2).map((k) => k[0]).join("") || "A").toUpperCase();

function Navigasi({
  nav,
  screen,
  onScreen,
  hariIni,
}: Pick<RangkaPanelProps, "nav" | "screen" | "onScreen" | "hariIni">) {
  return (
    <nav aria-label="Menu panel">
      <p className="mb-3 px-4 text-[11px] font-bold tracking-[0.16em] text-panel-utama uppercase">
        Menu
      </p>
      <ul className="grid gap-1">
        {nav.map((n) => {
          const aktif = n.key === screen;
          return (
            <li key={n.key}>
              <button
                type="button"
                onClick={() => onScreen(n.key)}
                aria-current={aktif ? "page" : undefined}
                className={`flex w-full cursor-pointer items-center gap-3.5 rounded-2xl border-none px-4 py-3 text-left text-[1.0625rem] transition-colors ${
                  aktif
                    ? "bg-panel-utama font-semibold text-white shadow-[0_12px_26px_rgb(43_84_67/0.28)]"
                    : "bg-transparent text-panel-utama hover:bg-panel-latar"
                }`}
              >
                <NavIcon screen={n.key} size={20} />
                {n.label}
              </button>
            </li>
          );
        })}
      </ul>
      <div className="mt-8 rounded-3xl bg-panel-lembut px-5 py-5">
        <p className="text-[11px] font-bold tracking-[0.16em] text-panel-aksen uppercase">
          Hari ini
        </p>
        <p className="mt-2 text-[0.9375rem] leading-relaxed text-panel-utama/80">
          {hariIni}
        </p>
      </div>
    </nav>
  );
}

export function RangkaPanel({
  nav,
  screen,
  onScreen,
  nama,
  email,
  peran,
  hariIni,
  kabar,
  query,
  onQuery,
  onOpenForm,
  onLogout,
  children,
}: RangkaPanelProps) {
  const [lembar, setLembar] = useState(false);
  const [buka, setBuka] = useState<"" | "lonceng" | "akun">("");
  const tutup = useCallback(() => setBuka(""), []);
  const tutupLembar = useCallback(() => setLembar(false), []);
  const lonceng = useRef<HTMLDivElement>(null);
  const akun = useRef<HTMLDivElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const tombolLembar = useRef<HTMLButtonElement>(null);
  /* Ketukan di tombol pop-up yang lain berpindah, bukan sekadar menutup. */
  const dalamPop = useRef([lonceng, akun]).current;
  const dalamLembar = useRef([panel, tombolLembar]).current;
  useTutupLuar(Boolean(buka), tutup, dalamPop);
  useTutupLuar(lembar, tutupLembar, dalamLembar);
  useKunciGulir(lembar);

  const pilih = (k: Screen) => {
    onScreen(k);
    setLembar(false);
    setBuka("");
  };
  const n = kabar.length;

  return (
    <div className="min-h-svh bg-white text-ink">
      <header className="sticky top-0 z-40 bg-white shadow-[0_6px_24px_rgb(43_84_67/0.06)]">
        <div className="mx-auto flex h-[4.5rem] max-w-[100rem] items-center gap-3 px-4 sm:px-6 lg:px-10">
          <div className="flex shrink-0 items-center gap-3">
            <BrandLogo size={38} className="shrink-0" />
            <div className="hidden leading-tight sm:block">
              <div className="text-[1.0625rem] font-bold tracking-[-0.01em] text-panel-utama">
                Unmehopa
              </div>
              <div className="text-[0.6875rem] font-bold tracking-[0.28em] text-panel-aksen">
                MANAJEMEN
              </div>
            </div>
          </div>

          <label className="relative ml-4 hidden max-w-[22rem] flex-1 md:block">
            <span className="sr-only">Cari tamu, kamar, atau kode</span>
            <Ikon
              nama="cari"
              className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-panel-aksen"
            />
            <input
              value={query}
              onChange={(e) => onQuery(e.target.value)}
              placeholder="Cari tamu, kamar, kode"
              className="h-11 w-full rounded-full border-none bg-panel-latar pr-4 pl-11 text-[0.9375rem] text-panel-utama outline-none placeholder:text-panel-utama/50 focus:ring-2 focus:ring-panel-aksen/30"
            />
          </label>

          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            {onOpenForm && (
              <button
                type="button"
                onClick={onOpenForm}
                className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-full border-none bg-panel-utama px-4 text-[0.9375rem] font-bold text-white hover:bg-panel-utama-2 sm:px-5"
              >
                <Ikon nama="tambah" className="size-4" /> Booking
              </button>
            )}

            <div ref={lonceng} className="relative">
              <button
                type="button"
                onClick={() => setBuka((b) => (b === "lonceng" ? "" : "lonceng"))}
                aria-expanded={buka === "lonceng"}
                aria-controls="kabar-panel"
                className="relative inline-flex size-11 cursor-pointer items-center justify-center rounded-full border-none bg-white text-panel-utama ring-1 ring-panel-garis hover:bg-panel-latar"
              >
                <Ikon nama="lonceng" />
                <span className="sr-only">
                  {n ? `${n} booking menunggu konfirmasi` : "Pemberitahuan"}
                </span>
                {n > 0 && (
                  <span
                    aria-hidden
                    className="absolute -top-0.5 -right-0.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-panel-merah px-1 text-[0.6875rem] font-bold text-white"
                  >
                    {n}
                  </span>
                )}
              </button>
              <div
                id="kabar-panel"
                hidden={buka !== "lonceng"}
                className="absolute top-full right-0 z-50 mt-3 w-[min(22rem,calc(100vw-2rem))] rounded-3xl bg-white p-3 text-panel-utama shadow-panel-angkat ring-1 ring-panel-garis"
              >
                <p className="px-3 pt-1 text-[11px] font-bold tracking-[0.16em] text-panel-aksen uppercase">
                  Menunggu konfirmasi
                </p>
                {n ? (
                  <ul className="mt-2 grid gap-1">
                    {kabar.slice(0, 6).map((k) => (
                      <li key={k.id} className="rounded-2xl px-3 py-2.5">
                        <span className="block font-semibold">{k.judul}</span>
                        <span className="block text-sm text-panel-utama/70">{k.baris}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="px-3 py-3 text-sm text-panel-utama/70">
                    Tidak ada booking yang menunggu konfirmasi.
                  </p>
                )}
              </div>
            </div>

            <div ref={akun} className="relative">
              <button
                type="button"
                onClick={() => setBuka((b) => (b === "akun" ? "" : "akun"))}
                aria-expanded={buka === "akun"}
                aria-controls="akun-panel"
                aria-label={`Akun ${peran}`}
                className="inline-flex h-11 cursor-pointer items-center gap-2.5 rounded-full border-none bg-white pr-3 pl-1 text-panel-utama ring-1 ring-panel-garis hover:bg-panel-latar sm:pr-4"
              >
                <span className="inline-flex size-9 items-center justify-center rounded-full bg-panel-utama text-xs font-bold text-white">
                  {inisial(nama)}
                </span>
                <span className="hidden text-[0.9375rem] font-medium sm:block">{peran}</span>
                <Ikon nama="bawah" className="size-4" />
              </button>
              <div
                id="akun-panel"
                hidden={buka !== "akun"}
                className="absolute top-full right-0 z-50 mt-3 w-[min(18rem,calc(100vw-2rem))] rounded-3xl bg-white p-3 text-panel-utama shadow-panel-angkat ring-1 ring-panel-garis"
              >
                <p className="px-3 pt-1 text-xs text-panel-utama/70">Masuk sebagai</p>
                <p className="px-3 font-semibold">{nama}</p>
                <p className="px-3 pb-2 text-sm [overflow-wrap:anywhere] text-panel-utama/70">
                  {email}
                </p>
                <button
                  type="button"
                  onClick={onLogout}
                  className="flex w-full cursor-pointer items-center gap-3 rounded-2xl border-none bg-transparent px-3 py-2.5 text-left text-panel-merah hover:bg-panel-merah-lembut"
                >
                  <Ikon nama="keluar" className="size-4" /> Keluar
                </button>
              </div>
            </div>

            <button
              ref={tombolLembar}
              type="button"
              onClick={() => setLembar((b) => !b)}
              aria-expanded={lembar}
              aria-controls="menu-panel"
              className="inline-flex size-11 cursor-pointer items-center justify-center rounded-full border-none bg-panel-utama text-white lg:hidden"
            >
              <Ikon nama={lembar ? "silang" : "menu"} />
              <span className="sr-only">Menu</span>
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-[100rem]">
        <aside className="sticky top-[4.5rem] hidden h-[calc(100svh-4.5rem)] w-[18.5rem] shrink-0 overflow-y-auto px-6 py-8 lg:block">
          <Navigasi nav={nav} screen={screen} onScreen={pilih} hariIni={hariIni} />
        </aside>
        <main id="isi" className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:py-8 lg:pr-10 lg:pl-4">
          {children}
        </main>
      </div>

      {lembar && <div aria-hidden className="fixed inset-0 z-40 bg-panel-utama/40 lg:hidden" />}
      <div
        ref={panel}
        id="menu-panel"
        role="dialog"
        aria-modal="true"
        aria-label="Menu panel"
        hidden={!lembar}
        className="tinggi-lembar fixed inset-x-0 bottom-0 z-50 overflow-y-auto rounded-t-3xl bg-white px-4 pt-3 pb-[max(1.25rem,env(safe-area-inset-bottom))] lg:hidden"
      >
        <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-panel-garis" aria-hidden />
        <label className="relative mb-4 block md:hidden">
          <span className="sr-only">Cari tamu, kamar, atau kode</span>
          <Ikon
            nama="cari"
            className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-panel-aksen"
          />
          <input
            value={query}
            onChange={(e) => onQuery(e.target.value)}
            placeholder="Cari tamu, kamar, kode"
            className="h-11 w-full rounded-full border-none bg-panel-latar pr-4 pl-11 text-[0.9375rem] text-panel-utama outline-none placeholder:text-panel-utama/50"
          />
        </label>
        <Navigasi nav={nav} screen={screen} onScreen={pilih} hariIni={hariIni} />
      </div>
    </div>
  );
}
