"use client";

import { useCallback, useEffect, useState } from "react";

import {
  AKTIVITAS,
  type Aktivitas,
  type BookingLama,
  type SesiLama,
  sesiDariJawaban,
} from "@/lib/sistem-lama-bentuk";

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
  /** Dimatikan dari Pengaturan, bukan gagal. */
  mati?: boolean;
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
      /* "Baca ulang" berarti semuanya, termasuk daftar kamar — kalau stafnya
         baru menambah kamar di sistem lama, tombol itu yang mereka tekan. */
      await Promise.all([
        bacaSistemLama(paksa),
        paksa ? bacaKamarLama(true) : null,
      ]);
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

// ------------------------------------------------------------- daftar kamar

/**
 * Daftar kamar sungguhan dari sistem lama, ditarik sekali.
 *
 * Terpisah dari booking karena umurnya berbeda. Booking berubah sepanjang hari
 * dan ditarik tiap menit; daftar kamar berubah beberapa kali setahun, jadi
 * menariknya tiap menit cuma memakan kuota Apps Script milik client tanpa
 * menghasilkan apa pun. Ditarik sekali per sesi, dan ikut disegarkan waktu ada
 * yang menekan "Baca ulang".
 *
 * Kenapa perlu sama sekali, padahal kamar bisa dibaca dari booking: kamar yang
 * bulan ini tidak terjual tidak muncul di booking mana pun. Daftar yang
 * diturunkan dari booking selalu kurang, dan kekurangannya jatuh tepat di
 * penyebut okupansi — sepuluh kamar dengan enam terjual itu 60%, tapi kalau
 * daftarnya cuma berisi enam yang terjual, angkanya jadi 100%, naik justru
 * waktu sepi.
 */
let kamarSimpanan: string[] | null = null;
let kamarJalan: Promise<string[]> | null = null;
const kamarPendengar = new Set<(k: string[]) => void>();

async function tarikKamar(): Promise<string[]> {
  try {
    const res = await fetch("/api/sistem-lama?mode=adminGetRoomSchedule", {
      cache: "no-store",
    });
    if (!res.ok) return [];
    const isi = (await res.json()) as { ok?: boolean; data?: unknown };
    if (!isi.ok) return [];
    const { kamarDariJadwal } = await import("@/lib/sistem-lama-bentuk");
    return kamarDariJadwal(isi.data);
  } catch {
    return [];
  }
}

export async function bacaKamarLama(paksa = false): Promise<string[]> {
  if (!paksa && kamarSimpanan) return kamarSimpanan;
  if (kamarJalan) return kamarJalan;
  kamarJalan = tarikKamar().then((k) => {
    kamarSimpanan = k;
    kamarJalan = null;
    for (const p of kamarPendengar) p(k);
    return k;
  });
  return kamarJalan;
}

export function useKamarLama(aktif: boolean) {
  const [kamar, setKamar] = useState<string[]>(kamarSimpanan ?? []);

  useEffect(() => {
    if (!aktif) return;
    kamarPendengar.add(setKamar);
    void bacaKamarLama();
    return () => {
      kamarPendengar.delete(setKamar);
    };
  }, [aktif]);

  return kamar;
}

// ------------------------------------------------------- jadwal dive centre

/**
 * Jadwal dive centre, tiga bulan ke depan, lima aktivitas.
 *
 * Lima panggilan sekali tarik — `adminGetUpcomingSessions` menerima satu
 * `activityPrefix` per panggilan, dan tidak ada mode yang memulangkan
 * semuanya sekaligus. Karena itu kadensnya lebih lambat dari daftar booking:
 * lima menit, bukan satu. Isinya tiga bulan ke depan dan cuma berubah waktu
 * ada booking yang berubah — dan perubahan booking-nya sendiri sudah terlihat
 * dalam satu menit lewat `adminList`. Menariknya tiap menit berarti 300
 * panggilan per jam per tab ke kuota Apps Script milik client, untuk jawaban
 * yang hampir selalu sama.
 *
 * Sama seperti booking: berhenti begitu tabnya tersembunyi.
 */
const JEDA_SESI_MS = 5 * 60 * 1000;
const UMUR_SESI_MS = 4.5 * 60 * 1000;

let sesiSimpanan: { waktu: number; sesi: SesiLama[] } | null = null;
let sesiJalan: Promise<SesiLama[]> | null = null;
let sesiPewaktu: ReturnType<typeof setInterval> | null = null;
let sesiPemakai = 0;
const sesiPendengar = new Set<(s: SesiLama[]) => void>();

async function tarikSatuAktivitas(a: Aktivitas): Promise<SesiLama[]> {
  try {
    const res = await fetch(
      `/api/sistem-lama?mode=adminGetUpcomingSessions&activityPrefix=${encodeURIComponent(a)}`,
      { cache: "no-store" },
    );
    if (!res.ok) return [];
    const isi = (await res.json()) as { ok?: boolean; data?: unknown };
    if (!isi.ok) return [];
    return sesiDariJawaban(isi.data, a);
  } catch {
    return [];
  }
}

export async function bacaSesiLama(paksa = false): Promise<SesiLama[]> {
  if (
    !paksa &&
    sesiSimpanan &&
    Date.now() - sesiSimpanan.waktu < UMUR_SESI_MS
  ) {
    return sesiSimpanan.sesi;
  }
  if (sesiJalan) return sesiJalan;

  sesiJalan = Promise.all(AKTIVITAS.map(tarikSatuAktivitas))
    .then((semua) => semua.flat())
    .then((sesi) => {
      sesiSimpanan = { waktu: Date.now(), sesi };
      sesiJalan = null;
      for (const p of sesiPendengar) p(sesi);
      return sesi;
    });
  return sesiJalan;
}

export function useSesiLama(aktif: boolean) {
  const [sesi, setSesi] = useState<SesiLama[]>(sesiSimpanan?.sesi ?? []);

  useEffect(() => {
    if (!aktif) return;
    sesiPendengar.add(setSesi);
    sesiPemakai++;
    if (!sesiPewaktu) {
      sesiPewaktu = setInterval(() => {
        if (bolehMenarik()) void bacaSesiLama();
      }, JEDA_SESI_MS);
    }
    const bangun = () => {
      if (bolehMenarik()) void bacaSesiLama();
    };
    document.addEventListener("visibilitychange", bangun);
    void bacaSesiLama();

    return () => {
      sesiPendengar.delete(setSesi);
      document.removeEventListener("visibilitychange", bangun);
      sesiPemakai--;
      if (sesiPemakai <= 0) {
        sesiPemakai = 0;
        if (sesiPewaktu) {
          clearInterval(sesiPewaktu);
          sesiPewaktu = null;
        }
      }
    };
  }, [aktif]);

  return sesi;
}
