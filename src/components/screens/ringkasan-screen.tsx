"use client";

import { useEffect, useState } from "react";

import { NavIcon } from "@/components/icons";
import { MONTHS, dayDiff, fmt, fmtShort, iso, parse } from "@/lib/format";
import type { Booking, Room, Screen } from "@/lib/types";

export interface RingkasanScreenProps {
  nama: string;
  peran: string;
  /** Booking dan kamar yang sudah dibatasi ke properti yang boleh dilihat. */
  bookings: Booking[];
  rooms: Room[];
  today: string;
  showMoney: boolean;
  /** Bagian menu yang boleh dibuka akun ini (satu per unit), tanpa Ringkasan sendiri. */
  pintasan: Pintasan[];
  /** Akun ini punya kalender, jadi angka booking di bawah ada artinya. */
  adaKalender: boolean;
  /**
   * Bentrok kamar yang masih terbuka. Dihitung di pengelola, bukan di sini,
   * karena yang sudah dinyatakan selesai (kompensasi dan sebagainya) tidak
   * boleh muncul lagi sebagai hal yang perlu dikejar.
   */
  bentrok: number;
  /** Membuka peninjauan bentrok di Kalender. */
  onBukaBentrok: () => void;
  /** Membuka rincian satu booking. */
  onBukaBooking: (id: string) => void;
  /** Barang gudang yang habis atau menipis, bila akun ini punya akses gudang; null bila tidak ada yang perlu dikejar. */
  stok?: StokPerhatian | null;
  /** Membuka layar Stok Gudang. */
  onBukaGudang?: () => void;
}

export interface StokPerhatian {
  habis: number;
  menipis: number;
  /** Nama beberapa barang yang paling mendesak: yang habis dulu. */
  contoh: string[];
}

export interface Pintasan {
  id: string;
  label: string;
  ket: string;
  ikon: Screen;
  onPilih: () => void;
}

const AKTIF = (b: Booking) => b.status !== "Cancelled" && b.status !== "Tidak datang";
const DITERIMA = (b: Booking) =>
  b.status === "Confirmed" || b.status === "Checked-in" || b.status === "Checked-out";

/** Salam mengikuti jam Papua (WIT), bukan jam perangkat. */
function salam(jam: number) {
  if (jam >= 4 && jam < 11) return "Selamat pagi";
  if (jam < 15) return "Selamat siang";
  if (jam < 18) return "Selamat sore";
  return "Selamat malam";
}

function JamLangsung() {
  /* Diisi setelah mount: halaman yang dirender di server tidak tahu jam berapa
     sekarang di Papua, dan jam yang salah sebentar lebih buruk dari kosong. */
  const [sekarang, setSekarang] = useState<Date | null>(null);
  useEffect(() => {
    setSekarang(new Date());
    const t = setInterval(() => setSekarang(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  if (!sekarang) return <div className="h-[4.25rem]" aria-hidden />;
  const zona = { timeZone: "Asia/Jayapura" } as const;
  const jam = new Intl.DateTimeFormat("id-ID", {
    ...zona, hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false,
  }).format(sekarang).replace(/:/g, ".");
  const tgl = new Intl.DateTimeFormat("id-ID", {
    ...zona, weekday: "long", day: "numeric", month: "long", year: "numeric",
  }).format(sekarang);
  return (
    <div className="sm:text-right">
      <div className="text-[2.4rem] leading-none font-bold tracking-tight tabular-nums">{jam}</div>
      <div className="mt-1.5 text-sm text-white/80">{tgl} WIT</div>
    </div>
  );
}

function Ubin({ label, nilai, ket, gelap = false }: { label: string; nilai: string; ket?: string; gelap?: boolean }) {
  return (
    <div className={`rounded-3xl px-5 py-5 ring-1 ${gelap ? "bg-panel-utama text-white ring-panel-utama" : "bg-white text-panel-utama ring-panel-garis"}`}>
      <p className={`text-[11px] font-bold tracking-[0.16em] uppercase ${gelap ? "text-white/80" : "text-panel-aksen"}`}>{label}</p>
      <p className="mt-2 text-[2rem] leading-tight font-bold tabular-nums">{nilai}</p>
      {ket && <p className={`mt-1 text-sm ${gelap ? "text-white/80" : "text-panel-utama/70"}`}>{ket}</p>}
    </div>
  );
}

export function RingkasanScreen({
  nama, peran, bookings, rooms, today, showMoney, pintasan, adaKalender, bentrok, onBukaBentrok, onBukaBooking, stok = null, onBukaGudang,
}: RingkasanScreenProps) {
  const aktif = bookings.filter(AKTIF);
  const bulan = today.slice(0, 7);
  const dibulan = aktif.filter((b) => b.checkIn.startsWith(bulan));
  const diterima = dibulan.filter(DITERIMA).length;
  const menunggu = aktif.filter((b) => b.status === "Tentative");
  const tiba = aktif.filter((b) => b.checkIn === today);
  const pulang = aktif.filter((b) => b.checkOut === today);
  const menginap = aktif.filter((b) => b.checkIn <= today && b.checkOut > today);
  const tamuMenginap = menginap.reduce((n, b) => n + (b.pax ?? 0), 0);
  const adaPaxKosong = menginap.some((b) => b.pax == null);

  const kamarAktif = rooms.filter((r) => r.active);
  const ids = new Set(kamarAktif.map((r) => r.id));
  /* Malam terisi dalam 30 hari ke depan dibagi malam yang tersedia. */
  let terisi = 0;
  const awal = parse(today);
  for (let i = 0; i < 30; i++) {
    const d = iso(new Date(awal.getFullYear(), awal.getMonth(), awal.getDate() + i));
    terisi += aktif.filter((b) => ids.has(b.roomId) && b.checkIn <= d && b.checkOut > d).length;
  }
  const tersedia = kamarAktif.length * 30;
  const okupansi = tersedia ? Math.round((terisi / tersedia) * 100) : 0;

  const mendesak = menunggu.filter((b) => b.checkIn >= today && dayDiff(today, b.checkIn) <= 3);
  /* Yang tiba dalam tiga hari ke depan, tidak dibatasi jumlahnya: daftar
     menggulir bila panjang. Lebih dari itu belum perlu dipantau dari sini. */
  const terdekat = aktif
    .filter((b) => b.checkIn >= today && dayDiff(today, b.checkIn) <= 3)
    .sort((a, b) => a.checkIn.localeCompare(b.checkIn));
  const ruangNama = (id: string) => rooms.find((r) => r.id === id)?.name ?? id;

  const adaBooking = adaKalender;
  const [t] = [parse(today)];
  const bulanNama = `${MONTHS[t.getMonth()]} ${t.getFullYear()}`;
  const jamIni = Number(
    new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Jayapura", hour: "2-digit", hour12: false }).format(new Date()),
  );

  return (
    <div className="grid gap-6">
      <section className="relative overflow-hidden rounded-[1.75rem] bg-panel-utama px-6 py-7 text-white sm:px-9 sm:py-9">
        <svg aria-hidden viewBox="0 0 600 120" preserveAspectRatio="none" className="pointer-events-none absolute inset-x-0 bottom-0 h-20 w-full opacity-[0.08]">
          <path d="M0 70 C80 30 160 110 240 70 S400 30 480 70 S560 90 600 60 V120 H0Z" fill="white" />
        </svg>
        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] font-bold tracking-[0.16em] text-white/80 uppercase">{peran} meja pengelola</p>
            <h1 className="mt-2 text-[1.9rem] leading-tight font-bold sm:text-4xl">
              {salam(jamIni)}, {nama.split(" ")[0]}.
            </h1>
            <p className="mt-2 max-w-[34rem] text-[0.9375rem] leading-relaxed text-white/85">
              {adaBooking
                ? menunggu.length
                  ? `${menunggu.length} booking menunggu konfirmasi.`
                  : "Tidak ada booking yang menunggu konfirmasi."
                : "Pilih halaman yang Anda butuhkan di bawah."}
            </p>
          </div>
          <JamLangsung />
        </div>
      </section>

      {adaBooking && (
        <section aria-label="Angka ringkasan" className="grid grid-cols-2 gap-4 xl:grid-cols-3">
          <Ubin label="Booking bulan ini" nilai={String(dibulan.length)} ket={`Tiba di ${bulanNama}`} />
          <Ubin
            label="Dikonfirmasi"
            nilai={String(diterima)}
            ket={dibulan.length ? `${Math.round((diterima / dibulan.length) * 100)}% dari booking bulan ini` : "Belum ada booking"}
          />
          <Ubin label="Menunggu konfirmasi" nilai={String(menunggu.length)} ket={mendesak.length ? `${mendesak.length} tiba dalam 3 hari` : "Tidak ada yang mendesak"} />
          <Ubin
            label="Tiba hari ini"
            nilai={String(tiba.length)}
            ket={`${pulang.length} pulang, ${menginap.length} kamar terisi${tamuMenginap && !adaPaxKosong ? `, ${tamuMenginap} tamu` : ""}`}
          />
          <Ubin label="Keterisian 30 hari" nilai={`${okupansi}%`} ket={`${terisi} dari ${tersedia} malam kamar`} />
          {showMoney ? (
            <Ubin label="Nilai booking bulan ini" nilai={fmt(dibulan.reduce((n, b) => n + b.total, 0))} ket="Total semua booking yang tiba bulan ini" gelap />
          ) : (
            <Ubin label="Kamar terisi malam ini" nilai={`${menginap.length}/${kamarAktif.length}`} ket="Dari kamar aktif" gelap />
          )}
        </section>
      )}

      {(adaBooking || stok) && (
        <section className="grid gap-4 xl:grid-cols-2">
          <div className="rounded-3xl bg-white p-5 ring-1 ring-panel-garis">
            <p className="text-[11px] font-bold tracking-[0.16em] text-panel-aksen uppercase">Perlu perhatian</p>
            {bentrok === 0 && mendesak.length === 0 && !stok ? (
              <p className="mt-3 text-[0.9375rem] text-panel-utama/80">Tidak ada yang perlu dikejar.</p>
            ) : (
              <ul className="mt-3 grid max-h-[18rem] gap-2 overflow-y-auto pr-1">
                {bentrok > 0 && (
                  <li className="flex flex-wrap items-center gap-3 rounded-2xl bg-panel-merah-lembut px-4 py-3 text-[0.9375rem] text-panel-merah">
                    <span className="min-w-0 flex-1">{bentrok} kamar terjual dua kali pada malam yang sama.</span>
                    <button type="button" onClick={onBukaBentrok}
                      className="shrink-0 cursor-pointer rounded-full border-none bg-panel-merah px-4 py-[6px] text-[0.8125rem] font-bold text-white hover:opacity-90">
                      Tinjau bentrok
                    </button>
                  </li>
                )}
                {stok && (
                  <li className={`flex flex-wrap items-center gap-3 rounded-2xl px-4 py-3 text-[0.9375rem] ${stok.habis ? "bg-panel-merah-lembut text-panel-merah" : "bg-amber-100 text-amber-950"}`}>
                    <span className="min-w-0 flex-1">
                      <span className="font-semibold">
                        {[stok.habis ? `${stok.habis} barang gudang habis` : "", stok.menipis ? `${stok.menipis} menipis` : ""].filter(Boolean).join(", ")}.
                      </span>{" "}
                      {stok.contoh.join(", ")}
                      {stok.habis + stok.menipis > stok.contoh.length ? ", dan lainnya" : ""}.
                    </span>
                    {onBukaGudang && (
                      <button type="button" onClick={onBukaGudang}
                        className={`shrink-0 cursor-pointer rounded-full border-none px-4 py-[6px] text-[0.8125rem] font-bold text-white hover:opacity-90 ${stok.habis ? "bg-panel-merah" : "bg-amber-600"}`}>
                        Buka gudang
                      </button>
                    )}
                  </li>
                )}
                {mendesak.map((b) => (
                  <li key={b.id} className="flex flex-wrap items-center gap-3 rounded-2xl bg-panel-latar px-4 py-3 text-[0.9375rem] text-panel-utama">
                    <span className="min-w-0 flex-1">
                      <span className="font-semibold">{b.guest}</span> belum dikonfirmasi, tiba {fmtShort(b.checkIn)} di {ruangNama(b.roomId)}.
                    </span>
                    <button type="button" onClick={() => onBukaBooking(b.id)}
                      className="shrink-0 cursor-pointer rounded-full border-none bg-panel-utama px-4 py-[6px] text-[0.8125rem] font-bold text-white hover:bg-panel-utama-2">
                      Buka booking
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          {adaBooking && (
          <div className="rounded-3xl bg-white p-5 ring-1 ring-panel-garis">
            <p className="flex items-center gap-2 text-[11px] font-bold tracking-[0.16em] text-panel-aksen uppercase">
              Tiba terdekat
              <span className="rounded-full bg-panel-lembut px-2 py-[1px] tracking-normal normal-case">{terdekat.length}</span>
              <span className="ml-auto tracking-normal text-panel-utama/60 normal-case">3 hari ke depan</span>
            </p>
            {terdekat.length === 0 ? (
              <p className="mt-3 text-[0.9375rem] text-panel-utama/80">Tidak ada tamu tiba dalam 3 hari ke depan.</p>
            ) : (
              <ul className="mt-3 grid max-h-[18rem] gap-2 overflow-y-auto pr-1" aria-label="Tamu tiba dalam 3 hari ke depan">
                {terdekat.map((b) => (
                  <li key={b.id} className="flex items-center justify-between gap-3 rounded-2xl bg-panel-latar px-4 py-3 text-[0.9375rem] text-panel-utama">
                    <span className="min-w-0">
                      <span className="block truncate font-semibold">{b.guest}</span>
                      <span className="block text-sm text-panel-utama/70">{ruangNama(b.roomId)}</span>
                    </span>
                    <button type="button" onClick={() => onBukaBooking(b.id)} aria-label={`Buka booking ${b.guest}`}
                      className="shrink-0 cursor-pointer rounded-full border-none bg-transparent px-2 py-1 font-semibold text-panel-utama hover:bg-panel-lembut">
                      {b.checkIn === today ? "Hari ini" : fmtShort(b.checkIn)}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          )}
        </section>
      )}

      {pintasan.length > 0 && (
        <section aria-label="Halaman Anda" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {pintasan.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={p.onPilih}
              className="flex cursor-pointer items-start gap-4 rounded-3xl border-none bg-white p-5 text-left text-panel-utama ring-1 ring-panel-garis transition-colors hover:bg-panel-latar"
            >
              <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-2xl bg-panel-lembut text-panel-aksen">
                <NavIcon screen={p.ikon} size={20} />
              </span>
              <span>
                <span className="block text-[1.0625rem] font-semibold">{p.label}</span>
                <span className="mt-0.5 block text-sm text-panel-utama/70">{p.ket}</span>
              </span>
            </button>
          ))}
        </section>
      )}
    </div>
  );
}
