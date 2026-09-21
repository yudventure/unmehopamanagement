"use client";

import { useCallback, useEffect, useState } from "react";

import type { BookingLama } from "@/lib/sistem-lama-bentuk";

/**
 * Satu bacaan sistem lama, disegarkan sendiri, dipakai bersama seluruh
 * dashboard.
 *
 * ## Kenapa ia menyegarkan diri
 *
 * Gunanya layar ini memantau sistem yang masih dipakai orang lain bekerja.
 * Booking masuk lewat sana sepanjang hari, dan papan yang cuma benar pada
 * detik halaman dibuka bukan pantauan — ia foto lama yang terlihat seperti
 * keadaan sekarang, yang lebih buruk daripada tidak ada papan sama sekali.
 *
 * ## Kenapa satu menit, dan kenapa berhenti waktu tabnya tidak dilihat
 *
 * Tiap tarikan menyentuh Apps Script milik client — kuotanya milik mereka, dan
 * yang memakainya stafnya untuk bekerja. Satu tab yang dibiarkan terbuka
 * seharian pada 30 detik memakan ~2.900 panggilan sehari, dan beberapa tab
 * staf sekaligus mulai terasa di sistem yang sedang dipakai melayani tamu.
 *
 * Jadi: satu menit, dan **berhenti sama sekali begitu tabnya tersembunyi**.
 * Tab yang menganggur di belakang tidak memakan apa pun, dan begitu dilihat
 * lagi ia langsung menarik sekali supaya yang tampil bukan sisa satu jam lalu.
 *
 * Simpanannya juga dipakai berdua: papan di layar Sistem lama dan strip di
 * atas Kalender membaca yang sama, dan penghitung pemakainya memastikan tetap
 * ada satu pewaktu betapa pun banyak komponen yang memakainya.
 */

export interface JawabanLama {
  ok: boolean;
  siap: boolean;
  pesan: string | null;
  ms?: number;
  bookings?: BookingLama[];
}

/** Sesering apa yang terbuka dan sedang dilihat menarik ulang. */
const JEDA_MS = 60 * 1000;

/** Di bawah ini dianggap masih segar; di atas ini ditarik lagi. */
const UMUR_MS = 55 * 1000;

let simpanan: { waktu: number; jawaban: JawabanLama } | null = null;
let sedangJalan: Promise<JawabanLama> | null = null;
let pewaktu: ReturnType<typeof setInterval> | null = null;
let pemakai = 0;

type Pendengar = (isi: { jawaban: JawabanLama; waktu: number }) => void;
const pendengar = new Set<Pendengar>();

async function tarik(): Promise<JawabanLama> {
  try {
    const res = await fetch("/api/sistem-lama", { cache: "no-store" });
    if (res.status === 404) {
      return {
        ok: false,
        siap: false,
        pesan: "Sesi Anda sudah habis. Masuk lagi untuk membacanya.",
      };
    }
    return (await res.json()) as JawabanLama;
  } catch {
    return {
      ok: false,
      siap: true,
      pesan: "Tidak bisa menghubungi server ini sendiri.",
    };
  }
}

export async function bacaSistemLama(paksa = false): Promise<JawabanLama> {
  if (!paksa && simpanan && Date.now() - simpanan.waktu < UMUR_MS) {
    return simpanan.jawaban;
  }
  /* Dua pemakai yang meminta bersamaan tidak boleh jadi dua permintaan ke
     sistem client. */
  if (sedangJalan) return sedangJalan;

  sedangJalan = tarik().then((jawaban) => {
    const waktu = Date.now();
    simpanan = { waktu, jawaban };
    sedangJalan = null;
    for (const p of pendengar) p({ jawaban, waktu });
    return jawaban;
  });
  return sedangJalan;
}

function bolehMenarik() {
  /* `document` tidak ada waktu dirender di server; di peramban, tab yang
     tersembunyi tidak perlu dilayani. */
  return (
    typeof document === "undefined" || document.visibilityState === "visible"
  );
}

function nyalakanPewaktu() {
  if (pewaktu) return;
  pewaktu = setInterval(() => {
    if (bolehMenarik()) void bacaSistemLama();
  }, JEDA_MS);
}

function matikanPewaktu() {
  if (!pewaktu) return;
  clearInterval(pewaktu);
  pewaktu = null;
}

/**
 * Sistem lama, selalu yang terbaru selama tabnya dilihat.
 *
 * `waktu` adalah kapan angka di tangan ini betul-betul dibaca, bukan kapan
 * komponennya digambar — itu yang membuat layar bisa mengatakan "terakhir
 * dibaca sekian lalu" dengan jujur.
 */
export function useSistemLama() {
  const [isi, setIsi] = useState<{
    jawaban: JawabanLama;
    waktu: number;
  } | null>(
    simpanan ? { jawaban: simpanan.jawaban, waktu: simpanan.waktu } : null,
  );
  const [sibuk, setSibuk] = useState(false);

  const muat = useCallback(async (paksa = false) => {
    setSibuk(true);
    try {
      await bacaSistemLama(paksa);
    } finally {
      setSibuk(false);
    }
  }, []);

  useEffect(() => {
    pendengar.add(setIsi);
    pemakai++;
    nyalakanPewaktu();

    /* Kembali ke tab ini sesudah ditinggal lama: yang tampil masih keadaan
       waktu ditinggalkan, jadi tarik sekali sekarang alih-alih menunggu
       giliran pewaktu berikutnya. */
    const bangun = () => {
      if (bolehMenarik()) void bacaSistemLama();
    };
    document.addEventListener("visibilitychange", bangun);

    void muat();

    return () => {
      pendengar.delete(setIsi);
      document.removeEventListener("visibilitychange", bangun);
      pemakai--;
      if (pemakai <= 0) {
        pemakai = 0;
        matikanPewaktu();
      }
    };
  }, [muat]);

  return {
    jawaban: isi?.jawaban ?? null,
    waktu: isi?.waktu ?? null,
    sibuk,
    muat,
  };
}

/** "baru saja", "2 menit lalu" — dipakai layar untuk membuktikan ia hidup. */
export function sejak(waktu: number | null, sekarang: number): string {
  if (waktu === null) return "";
  const detik = Math.max(0, Math.round((sekarang - waktu) / 1000));
  if (detik < 20) return "baru saja";
  if (detik < 90) return `${detik} detik lalu`;
  const menit = Math.round(detik / 60);
  if (menit < 60) return `${menit} menit lalu`;
  const jam = Math.round(menit / 60);
  return `${jam} jam lalu`;
}
