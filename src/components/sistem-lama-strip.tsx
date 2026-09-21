"use client";

import { useEffect, useMemo, useState } from "react";

import { sejak, useSistemLama } from "@/components/sistem-lama-data";
import { namaTamu, papanPantau } from "@/lib/sistem-lama-bentuk";

/**
 * Sistem lama, di atas kalender.
 *
 * Layar "Sistem lama" punya papannya sendiri, tapi layar itu harus dibuka.
 * Yang dibuka tiap pagi adalah Kalender, dan pertanyaan tiap pagi cuma satu:
 * siapa datang hari ini. Jadi jawabannya duduk di sini, dan sisanya satu klik.
 *
 * ## Kenapa ini strip, bukan booking di kisi kalendernya
 *
 * Menaruh booking sistem lama ke dalam kisi kalender terdengar lebih rapi dan
 * sebenarnya berbahaya, karena dua hal.
 *
 * **Kamarnya tidak bisa dicocokkan.** Sistem lama menulis `room: "3"`; kamar
 * di sini punya id dan nama sendiri. Cocok-cocokan berdasarkan angka akan
 * benar sampai suatu hari ia salah, dan salahnya berupa tamu sungguhan yang
 * tergambar di kamar yang sedang ditempati orang lain.
 *
 * **Angkanya akan ikut berubah.** Okupansi, pendapatan, dan piutang di layar
 * ini semuanya dihitung dari daftar booking yang sama. Baris sistem lama tidak
 * membawa harga, jadi menyuntikkannya ke sana membuat okupansi naik sementara
 * pendapatan tidak — angka yang meyakinkan dan salah, yang persis dilarang
 * aturan proyek ini.
 *
 * Jadi dua sumbernya sengaja tidak dicampur. Yang satu buku milik dashboard
 * ini, yang satu jendela ke buku milik orang lain, dan strip ini mengatakan
 * yang mana yang sedang dilihat.
 */

export function SistemLamaStrip({ onBuka }: { onBuka: () => void }) {
  const { jawaban, waktu } = useSistemLama();

  const [sekarang, setSekarang] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setSekarang(Date.now()), 15000);
    return () => clearInterval(t);
  }, []);

  const papan = useMemo(() => papanPantau(jawaban?.bookings ?? []), [jawaban]);

  /* Belum disetel bukan kabar, dan kalender bukan tempat menagih pemasangan.
     Layar "Sistem lama" yang menjelaskannya, lengkap dengan dua barisnya. */
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

  const nama = (n: number, daftar: typeof papan.datangHariIni) =>
    n === 0
      ? null
      : daftar
          .slice(0, 2)
          .map((b) => namaTamu(b) || "tanpa nama")
          .join(", ") + (n > 2 ? ` +${n - 2}` : "");

  const datang = papan.datangHariIni.length;
  const pulang = papan.pulangHariIni.length;
  const namaDatang = nama(datang, papan.datangHariIni);

  return (
    <button
      type="button"
      onClick={onBuka}
      className="mb-4 flex w-full flex-wrap items-center gap-x-4 gap-y-[6px] rounded-[14px] border border-line-soft bg-surface-soft px-4 py-[11px] text-left hover:bg-surface-hover"
    >
      <span className="font-mono text-[10.5px] tracking-[.08em] text-slate-mute uppercase">
        Sistem lama
      </span>

      <span className="text-[12.5px] text-slate-soft">
        <strong className="text-ink">{datang}</strong> datang hari ini
        {namaDatang && <span className="text-slate-mute"> — {namaDatang}</span>}
      </span>

      <span className="text-[12.5px] text-slate-soft">
        <strong className="text-ink">{pulang}</strong> pulang
      </span>

      <span className="text-[12.5px] text-slate-soft">
        <strong className="text-ink">{papan.sedangMenginap.length}</strong>{" "}
        sedang menginap
      </span>

      <span className="ml-auto flex shrink-0 items-center gap-3">
        <span className="hidden text-[11.5px] text-slate-mute sm:inline">
          {sejak(waktu, sekarang)}
        </span>
        <span className="text-[12px] font-medium text-teal">Buka →</span>
      </span>
    </button>
  );
}
