"use client";

import { useState } from "react";

export interface KalenderHeroProps {
  /** "Turtle Homestay", "Eddo Homestay", atau "Semua unit". */
  nama: string;
  lokasi?: string;
  jumlahKamar: number;
  /** Kamar yang terisi malam ini dan yang tersedia, atau null untuk unit tanpa kamar. */
  malamIni: { terisi: number; dari: number } | null;
  kedatangan7: number;
  okupansiBulan: number | null;
  bulanLabel: string;
  /** Unit tanpa kamar, misalnya dive center: hanya jadwal. */
  hanyaJadwal?: boolean;
}

/**
 * Kepala kalender tiap unit: nama unit, tiga angka yang paling sering
 * ditanyakan (malam ini, tujuh hari, bulan ini), dan penjelasan singkat cara
 * kalender bekerja. Mengikuti kalender mitra DAMPIER.
 *
 * Penjelasannya hanya memuat yang benar di sistem ini.
 */
export function KalenderHero({
  nama, lokasi, jumlahKamar, malamIni, kedatangan7, okupansiBulan, bulanLabel, hanyaJadwal = false,
}: KalenderHeroProps) {
  const [buka, setBuka] = useState(false);
  return (
    <div className="mb-5">
      <section className="relative overflow-hidden rounded-[1.75rem] bg-panel-utama px-6 py-6 text-white sm:px-8 sm:py-7">
        <svg aria-hidden viewBox="0 0 600 120" preserveAspectRatio="none" className="pointer-events-none absolute inset-x-0 bottom-0 h-16 w-full opacity-[0.08]">
          <path d="M0 70 C80 30 160 110 240 70 S400 30 480 70 S560 90 600 60 V120 H0Z" fill="white" />
        </svg>
        <div className="relative">
          <p className="text-[11px] font-bold tracking-[0.16em] text-white/80 uppercase">Kalender unit</p>
          <h1 className="mt-1 text-[1.9rem] leading-tight font-bold sm:text-[2.2rem]">{nama}</h1>
          <p className="mt-1 text-[0.9375rem] text-white/85">
            {[lokasi, hanyaJadwal ? "Jadwal selam" : `${jumlahKamar} kamar`].filter(Boolean).join(" · ")}
          </p>
          {!hanyaJadwal && (
            <div className="mt-5 grid grid-cols-3 gap-3">
              <div className="rounded-2xl bg-white/10 px-4 py-3">
                <p className="text-[10.5px] font-bold tracking-[0.14em] text-white/80 uppercase">Malam ini</p>
                <p className="mt-1 text-[1.6rem] leading-none font-bold tabular-nums">{malamIni ? `${malamIni.terisi}/${malamIni.dari}` : "—"}</p>
                <p className="mt-1 text-[12px] text-white/80">kamar terisi</p>
              </div>
              <div className="rounded-2xl bg-white/10 px-4 py-3">
                <p className="text-[10.5px] font-bold tracking-[0.14em] text-white/80 uppercase">7 hari</p>
                <p className="mt-1 text-[1.6rem] leading-none font-bold tabular-nums">{kedatangan7}</p>
                <p className="mt-1 text-[12px] text-white/80">kedatangan</p>
              </div>
              <div className="rounded-2xl bg-white/10 px-4 py-3">
                <p className="text-[10.5px] font-bold tracking-[0.14em] text-white/80 uppercase">{bulanLabel}</p>
                <p className="mt-1 text-[1.6rem] leading-none font-bold tabular-nums">{okupansiBulan === null ? "—" : `${okupansiBulan}%`}</p>
                <p className="mt-1 text-[12px] text-white/80">terisi</p>
              </div>
            </div>
          )}
        </div>
      </section>

      <div className="mt-3 rounded-2xl bg-panel-latar px-5 py-3">
        <button type="button" onClick={() => setBuka((b) => !b)} aria-expanded={buka}
          className="flex w-full cursor-pointer items-center justify-between border-none bg-transparent p-0 text-left text-[0.9375rem] font-bold text-panel-utama">
          Cara kalender ini bekerja
          <span aria-hidden className={`transition-transform ${buka ? "rotate-180" : ""}`}>⌄</span>
        </button>
        {buka && (
          <ul className="mt-3 grid gap-2 text-[0.875rem] leading-[1.55] text-panel-utama/85 md:grid-cols-2">
            <li>Pesanan dari situs yang tersambung lewat iCal masuk sendiri, dibaca ulang tiap 15 menit. Harga dan jumlah tamunya tidak ikut terbaca.</li>
            <li>Catat pesanan sendiri dengan Tambah pesanan, atau banyak sekaligus dengan Tambah banyak. Pesan WhatsApp dan screenshot bisa dibaca, lalu diperiksa dulu sebelum disimpan.</li>
            <li>Kamar yang terjual dua kali pada malam yang sama ditandai merah dan muncul sebagai bentrok. Pesanan yang bentrok tidak ditolak otomatis, jadi orangnya yang menyelesaikannya.</li>
            <li>Tandai tamu Sudah datang dan Sudah pulang dari panel samping, supaya kalender tahu kamar mana yang benar-benar terisi.</li>
          </ul>
        )}
      </div>
    </div>
  );
}
