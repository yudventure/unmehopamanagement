"use client";

import { useCallback, useEffect, useState } from "react";

import type { BookingLama } from "@/lib/sistem-lama-bentuk";

/**
 * Satu bacaan sistem lama, dipakai bersama seluruh dashboard.
 *
 * Ada simpanan di modul ini, dan itu bukan optimasi yang dicari-cari. Tiap
 * pemanggilan menyentuh Apps Script milik client, yang punya kuota harian dan
 * dipakai stafnya untuk bekerja. Dua komponen yang masing-masing menarik
 * sendiri tiap kali dipasang berarti dashboard kami ikut menghabiskan jatah
 * sistem yang sedang dipakai orang — jadi: satu bacaan, dipakai berdua,
 * disegarkan kalau sudah basi atau kalau ada yang menekan "Baca ulang".
 */

export interface JawabanLama {
  ok: boolean;
  siap: boolean;
  pesan: string | null;
  ms?: number;
  bookings?: BookingLama[];
}

/** Dua menit. Cukup lama untuk pindah-pindah layar, cukup pendek untuk pagi
    hari waktu bookingnya berubah. */
const UMUR_MS = 2 * 60 * 1000;

let simpanan: { waktu: number; jawaban: JawabanLama } | null = null;
let sedangJalan: Promise<JawabanLama> | null = null;
const pendengar = new Set<(j: JawabanLama | null) => void>();

function umumkan(j: JawabanLama | null) {
  for (const p of pendengar) p(j);
}

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
  /* Dua komponen yang dipasang bersamaan tidak boleh jadi dua permintaan. */
  if (sedangJalan) return sedangJalan;

  sedangJalan = tarik().then((jawaban) => {
    simpanan = { waktu: Date.now(), jawaban };
    sedangJalan = null;
    umumkan(jawaban);
    return jawaban;
  });
  return sedangJalan;
}

export function useSistemLama() {
  const [jawaban, setJawaban] = useState<JawabanLama | null>(
    simpanan?.jawaban ?? null,
  );
  const [sibuk, setSibuk] = useState(false);

  const muat = useCallback(async (paksa = false) => {
    setSibuk(true);
    try {
      setJawaban(await bacaSistemLama(paksa));
    } finally {
      setSibuk(false);
    }
  }, []);

  useEffect(() => {
    pendengar.add(setJawaban);
    void muat();
    return () => {
      pendengar.delete(setJawaban);
    };
  }, [muat]);

  return { jawaban, sibuk, muat };
}
