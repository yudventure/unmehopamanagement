"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { BrandLogo } from "@/components/brand-logo";
import { NavIcon } from "@/components/icons";
import type { Screen } from "@/lib/types";

export interface NavItem {
  key: Screen;
  label: string;
  /**
   * Unit yang dibuka item ini ("all", "turtle", "eddo", "divecenter"). Hanya
   * untuk layar yang bergantung pada unit (kalender, laporan, kamar,
   * sinkronisasi). Layar lain, seperti Website dan Pengguna, tanpa unit.
   */
  unit?: string;
}

/** Satu bagian menu: satu unit, atau yang lintas unit. `label` kosong berarti tanpa judul. */
export interface NavGroup {
  id: string;
  label: string;
  items: NavItem[];
}

const sama = (n: NavItem, screen: Screen, unit: string) =>
  n.key === screen && (n.unit === undefined || n.unit === unit);

/** Satu tamu yang datang atau pulang hari ini. */
export interface TamuHariIni {
  id: string;
  guest: string;
  kamar: string;
  unit: string;
  saluran: string;
  /** Sudah ditandai datang atau pulang. */
  sudah: boolean;
}

export interface Kabar {
  id: string;
  judul: string;
  baris: string;
}

export interface RangkaPanelProps {
  nav: NavGroup[];
  screen: Screen;
  /** Unit yang sedang dibuka, untuk menandai item yang aktif. */
  unit: string;
  onScreen: (item: NavItem) => void;
  /** Nama dan peran orang yang sedang masuk, untuk menu akun. */
  nama: string;
  email: string;
  peran: string;
  /** Satu kalimat utuh untuk kartu HARI INI di bawah menu. */
  hariIni: string;
  /** Siapa yang check-in dan check-out hari ini, untuk tombol di kartu HARI INI. */
  tamuHariIni?: { masuk: TamuHariIni[]; keluar: TamuHariIni[] };
  /** Membuka satu booking dari daftar tamu hari ini. */
  onBukaTamu?: (id: string) => void;
  /** Booking yang menunggu konfirmasi, untuk lonceng. */
  kabar: Kabar[];
  query: string;
  onQuery: (value: string) => void;
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

function DaftarTamuHariIni({
  tamu, onTutup, onBuka,
}: {
  tamu: { masuk: TamuHariIni[]; keluar: TamuHariIni[] };
  onTutup: () => void;
  onBuka: (id: string) => void;
}) {
  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === "Escape" && onTutup();
    document.addEventListener("keydown", esc);
    return () => document.removeEventListener("keydown", esc);
  }, [onTutup]);

  const Bagian = ({ judul, daftar, tanda }: { judul: string; daftar: TamuHariIni[]; tanda: string }) => (
    <section className="mt-5 first:mt-0">
      <p className="mb-2 flex items-center gap-2 text-[0.9375rem] font-bold text-panel-utama">
        {judul}
        <span className="rounded-full bg-panel-lembut px-2 py-[1px] text-[0.75rem]">{daftar.length}</span>
      </p>
      {daftar.length === 0 ? (
        <p className="text-[0.8125rem] text-panel-utama/70">Tidak ada.</p>
      ) : (
        <ul className="grid gap-2">
          {daftar.map((t) => (
            <li key={t.id}>
              <button
                type="button"
                onClick={() => onBuka(t.id)}
                className="flex w-full cursor-pointer items-center gap-3 rounded-2xl border-none bg-panel-latar px-4 py-3 text-left hover:bg-panel-lembut"
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[0.9375rem] font-semibold text-panel-utama">{t.guest}</span>
                  <span className="block truncate text-[0.8125rem] text-panel-utama/70">{t.kamar} · {t.unit} · {t.saluran}</span>
                </span>
                <span className={`shrink-0 rounded-full px-2 py-[2px] text-[11px] font-bold ${t.sudah ? "bg-panel-lembut text-panel-aksen" : "bg-white text-panel-utama/70 ring-1 ring-panel-garis"}`}>
                  {t.sudah ? tanda : "Belum"}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-panel-utama/40 p-4" onPointerDown={(e) => e.target === e.currentTarget && onTutup()}>
      <div role="dialog" aria-modal="true" aria-labelledby="tamu-hari-ini" className="max-h-[85vh] w-full max-w-[34rem] overflow-y-auto rounded-3xl bg-white p-5 shadow-panel-angkat">
        <div className="mb-4 flex items-start gap-3">
          <div>
            <p className="text-[11px] font-bold tracking-[0.16em] text-panel-aksen uppercase">Hari ini</p>
            <h2 id="tamu-hari-ini" className="text-[1.25rem] font-bold text-panel-utama">Tamu datang dan pulang</h2>
          </div>
          <button type="button" onClick={onTutup} aria-label="Tutup" className="ml-auto flex size-9 cursor-pointer items-center justify-center rounded-full border-none bg-panel-latar text-panel-utama hover:bg-panel-lembut">
            <Ikon nama="silang" className="size-4" />
          </button>
        </div>
        <Bagian judul="Check-in, tamu datang" daftar={tamu.masuk} tanda="Sudah datang" />
        <Bagian judul="Check-out, tamu pulang" daftar={tamu.keluar} tanda="Sudah pulang" />
        <p className="mt-5 text-[0.75rem] text-panel-utama/60">Pilih satu tamu untuk membuka rincian bookingnya.</p>
      </div>
    </div>
  );
}

const inisial = (nama: string) =>
  (nama.trim().split(/\s+/).slice(0, 2).map((k) => k[0]).join("") || "A").toUpperCase();

function ButirMenu({
  n, aktif, onScreen, kecil = false,
}: {
  n: NavItem;
  aktif: boolean;
  onScreen: (item: NavItem) => void;
  kecil?: boolean;
}) {
  return (
    <li>
      <button
        type="button"
        onClick={() => onScreen(n)}
        aria-current={aktif ? "page" : undefined}
        className={`flex w-full cursor-pointer items-center gap-3.5 rounded-2xl border-none text-left transition-colors ${
          kecil ? "px-4 py-2.5 text-[0.9375rem]" : "px-4 py-3 text-[1.0625rem]"
        } ${
          aktif
            ? "bg-panel-utama font-semibold text-white shadow-[0_12px_26px_rgb(43_84_67/0.28)]"
            : "bg-transparent text-panel-utama hover:bg-panel-latar"
        }`}
      >
        <NavIcon screen={n.key} size={kecil ? 18 : 20} />
        {n.label}
      </button>
    </li>
  );
}

/** Satu unit atau bagian, dilipat bila bukan yang sedang dibuka. */
function GrupMenu({
  g, screen, unit, onScreen, awalBuka,
}: {
  g: NavGroup;
  screen: Screen;
  unit: string;
  onScreen: (item: NavItem) => void;
  /**
   * Terbuka sejak awal: bagian satu-satunya (manajer satu unit), serta "Semua
   * unit" dan "Perusahaan" (tempat Pengguna & Peran). Bagian tiap unit terlipat
   * sampai dipilih, supaya menu tidak panjang.
   */
  awalBuka: boolean;
}) {
  const diDalam = g.items.some((n) => sama(n, screen, unit));
  const [buka, setBuka] = useState(diDalam || awalBuka);
  /* Terbuka sendiri bila item di dalamnya yang dibuka, misalnya lewat pintasan
     di Ringkasan. Menutupnya tetap pilihan orangnya. */
  useEffect(() => {
    if (diDalam) setBuka(true);
  }, [diDalam]);
  return (
    <li>
      <button
        type="button"
        onClick={() => setBuka((b) => !b)}
        aria-expanded={buka}
        className="flex w-full cursor-pointer items-center gap-2 rounded-2xl border-none bg-transparent px-4 py-2.5 text-left text-[11px] font-bold tracking-[0.16em] text-panel-aksen uppercase hover:bg-panel-latar"
      >
        {g.label}
        <Ikon nama="bawah" className={`ml-auto size-4 transition-transform ${buka ? "rotate-180" : ""}`} />
      </button>
      {buka && (
        <ul className="mt-1 grid gap-1">
          {g.items.map((n) => (
            <ButirMenu
              key={`${n.key}-${n.unit ?? ""}`}
              n={n}
              aktif={sama(n, screen, unit)}
              onScreen={onScreen}
              kecil
            />
          ))}
        </ul>
      )}
    </li>
  );
}

function Navigasi({
  nav, screen, unit, onScreen, hariIni, jumlahTamu, onLihatTamu,
}: Pick<RangkaPanelProps, "nav" | "screen" | "unit" | "onScreen" | "hariIni"> & {
  jumlahTamu: number;
  onLihatTamu: () => void;
}) {
  /* Satu bagian bernama saja berarti tidak ada yang perlu dipilih di antara. */
  const tunggal = nav.filter((g) => g.label).length === 1;
  return (
    <nav aria-label="Menu panel">
      <p className="mb-3 px-4 text-[11px] font-bold tracking-[0.16em] text-panel-utama uppercase">
        Menu
      </p>
      <ul className="grid gap-1">
        {nav.map((g) =>
          g.label ? (
            <GrupMenu key={g.id} g={g} screen={screen} unit={unit} onScreen={onScreen} awalBuka={tunggal || g.id === "semua" || g.id === "perusahaan"} />
          ) : (
            g.items.map((n) => (
              <ButirMenu
                key={`${g.id}-${n.key}-${n.unit ?? ""}`}
                n={n}
                aktif={sama(n, screen, unit)}
                onScreen={onScreen}
              />
            ))
          ),
        )}
      </ul>
      <div className="mt-8 rounded-3xl bg-panel-lembut px-5 py-5">
        <p className="text-[11px] font-bold tracking-[0.16em] text-panel-aksen uppercase">
          Hari ini
        </p>
        <p className="mt-2 text-[0.9375rem] leading-relaxed text-panel-utama/80">
          {hariIni}
        </p>
        {jumlahTamu > 0 && (
          <button
            type="button"
            onClick={onLihatTamu}
            className="mt-3 cursor-pointer rounded-full border-none bg-panel-utama px-4 py-2 text-[0.8125rem] font-bold text-white hover:bg-panel-utama-2"
          >
            Lihat siapa ({jumlahTamu})
          </button>
        )}
      </div>
    </nav>
  );
}

export function RangkaPanel({
  nav,
  screen,
  unit,
  onScreen,
  nama,
  email,
  peran,
  hariIni,
  tamuHariIni,
  onBukaTamu,
  kabar,
  query,
  onQuery,
  onLogout,
  children,
}: RangkaPanelProps) {
  const [lembar, setLembar] = useState(false);
  const [daftarTamu, setDaftarTamu] = useState(false);
  const jumlahTamu = (tamuHariIni?.masuk.length ?? 0) + (tamuHariIni?.keluar.length ?? 0);
  const lihatTamu = () => {
    setLembar(false);
    setDaftarTamu(true);
  };
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

  const pilih = (k: NavItem) => {
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
                MANAGEMENT
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
          <Navigasi nav={nav} screen={screen} unit={unit} onScreen={pilih} hariIni={hariIni} jumlahTamu={jumlahTamu} onLihatTamu={lihatTamu} />
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
        <Navigasi nav={nav} screen={screen} unit={unit} onScreen={pilih} hariIni={hariIni} jumlahTamu={jumlahTamu} onLihatTamu={lihatTamu} />
      </div>

      {daftarTamu && tamuHariIni && (
        <DaftarTamuHariIni
          tamu={tamuHariIni}
          onTutup={() => setDaftarTamu(false)}
          onBuka={(id) => {
            setDaftarTamu(false);
            onBukaTamu?.(id);
          }}
        />
      )}
    </div>
  );
}
