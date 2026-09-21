"use client";

import { useMemo } from "react";

import { useSistemLama } from "@/components/sistem-lama-data";
import { namaTamu, papanPantau } from "@/lib/sistem-lama-bentuk";

/**
 * Sistem lama, di layar Kalender — bukan ringkasan sebaris, tapi kalendernya.
 *
 * Versi pertama cuma menaruh satu baris ringkasan di sini dan menyimpan
 * kalendernya di layar "Sistem lama". Pemiliknya membuka Kalender, melihat
 * kisi kosong, dan melaporkannya: "kalender masih kosong". Ia benar — yang
 * namanya Kalender adalah layar ini, dan kalender yang kosong di layar yang
 * bernama Kalender tidak terbantu oleh kalender lain di tempat lain.
 *
 * ## Kenapa tidak dimasukkan ke kisi di bawahnya
 *
 * Kisi itu menghitung okupansi, pendapatan, dan komisi dari tiap booking yang
 * masuk ke dalamnya. Booking sistem lama tidak membawa tiga hal yang
 * dibutuhkan kisi itu, dan tidak satu pun bisa diturunkan dari yang ada:
 *
 * - **harga**, jadi pendapatan dan komisinya tidak bisa dihitung;
 * - **saluran**, jadi tidak ada yang bisa dikatakan tentang Booking.com atau
 *   WhatsApp tanpa menebaknya;
 * - **kamar mana di daftar kami** — dan ini yang paling menyesatkan, karena
 *   nama kamar kami sendiri ("Turtle 01"–"Turtle 10") adalah nama karangan
 *   dari masa prototipe, bukan nama kamar client.
 *
 * Mengisi ketiganya dengan nol atau tebakan akan membuat layar ini menyatakan
 * hal yang salah tentang uang dan tentang kamar orang, dengan tampilan yang
 * persis seperti pernyataan yang benar. Jadi yang dari sistem lama tergambar
 * utuh di sini, dengan kamar dan namanya sendiri, dan angka di bawah tetap
 * mengatakan apa yang memang dihitungnya.
 */
export function SistemLamaPanel({ onBuka }: { onBuka: () => void }) {
  const { jawaban } = useSistemLama();
  const bookings = useMemo(() => jawaban?.bookings ?? [], [jawaban]);
  const papan = useMemo(() => papanPantau(bookings), [bookings]);

  /* Belum disetel bukan kabar, dan Kalender bukan tempat menagih pemasangan. */
  if (!jawaban || !jawaban.siap) return null;

  if (!jawaban.ok) {
    return (
      <button
        type="button"
        onClick={onBuka}
        className="mb-4 flex w-full items-center gap-[10px] rounded-[14px] border border-danger-line bg-danger-tint px-4 py-[11px] text-left"
      >
        <span className="h-[9px] w-[9px] shrink-0 rounded-full bg-danger-ink" />
        <span className="text-[12.5px] leading-[1.5] text-danger-ink">
          <strong>Sistem lama tidak terbaca.</strong> {jawaban.pesan ?? ""}
        </span>
        <span className="ml-auto shrink-0 text-[12px] font-medium text-danger-ink">
          Lihat →
        </span>
      </button>
    );
  }

  if (bookings.length === 0) return null;

  const datang = papan.datangHariIni.length;
  const nama = papan.datangHariIni
    .slice(0, 2)
    .map((b) => namaTamu(b) || "tanpa nama")
    .join(", ");

  return (
    <div className="mb-5">
      <div className="mb-[10px] flex flex-wrap items-center gap-x-4 gap-y-[6px]">
        <span className="font-mono text-[10.5px] tracking-[.08em] text-slate-mute uppercase">
          Sistem lama
        </span>
        <span className="text-[12.5px] text-slate-soft">
          <strong className="text-ink">{datang}</strong> datang hari ini
          {datang > 0 && nama && (
            <span className="text-slate-mute">
              {" "}
              — {nama}
              {datang > 2 ? ` +${datang - 2}` : ""}
            </span>
          )}
        </span>
        <span className="text-[12.5px] text-slate-soft">
          <strong className="text-ink">{papan.pulangHariIni.length}</strong>{" "}
          pulang
        </span>
        <span className="text-[12.5px] text-slate-soft">
          <strong className="text-ink">{papan.sedangMenginap.length}</strong>{" "}
          sedang menginap
        </span>
        <button
          type="button"
          onClick={onBuka}
          className="ml-auto shrink-0 text-[12px] font-medium text-teal hover:underline"
        >
          Buka layar Sistem lama →
        </button>
      </div>

      <div className="mb-1 flex items-start gap-[10px] rounded-[14px] border border-line-soft bg-surface-soft px-4 py-[11px]">
        <span className="mt-[5px] h-[7px] w-[7px] shrink-0 rounded-full bg-slate-mute" />
        <div className="text-[12.5px] leading-[1.55] text-slate-soft">
          Kamar dan booking Turtle di kalender ini{" "}
          <strong>dari sistem lama</strong>, termasuk nama kamarnya. Malamnya
          ikut dihitung di okupansi; yang tidak ikut cuma{" "}
          <strong>pendapatan dan komisi</strong>, karena{" "}
          <code className="font-mono text-[11.5px]">adminList</code> tidak
          mengirim harga — dan menjumlahkan nol ke dalam pendapatan terlihat
          persis seperti penjualan yang memang nol.
          <br />
          <br />
          Pil berwarna di tiap hari adalah <strong>jadwal dive centre</strong>:
          Diving, Snorkeling, SSI Dive Course, Excursion Trip, dan Transport,
          berikut jumlah pax. Arahkan kursor untuk melihat sesi dan kamarnya.
          Jadwal itu <strong>tidak dihitung sebagai malam terjual</strong> —
          trip menyelam tidak memegang kamar.
        </div>
      </div>
    </div>
  );
}
