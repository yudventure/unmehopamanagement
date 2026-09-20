import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "../../generated/prisma/client";

/**
 * Satu-satunya tempat klien database dibuat.
 *
 * ## Diam tanpa `DATABASE_URL`, seperti yang lain
 *
 * Tiap sambungan ke dunia luar di aplikasi ini mati sendiri kalau variabelnya
 * belum diisi, dan mengatakannya di layar alih-alih melempar error: CMS tanpa
 * `GITHUB_TOKEN`, pratinjau tanpa `PREVIEW_TOKEN`, tombol bayar tanpa kunci
 * Midtrans. Database mengikuti pola yang sama. `databaseReady()` menjawab
 * apakah ada alamatnya, dan yang memanggil `db()` bertanya dulu.
 *
 * Bedanya dengan yang lain cuma taruhannya: yang ini memegang booking. Jadi
 * `db()` melempar alih-alih memulangkan null — sebuah layar yang gagal memuat
 * lebih baik daripada layar yang menampilkan kalender kosong seolah-olah
 * memang tidak ada tamu.
 *
 * ## Kenapa ada driver adapter
 *
 * Prisma 7 melepas query engine bawaannya dan menyambung lewat driver Node
 * biasa. Itu kebetulan cocok sekali dengan cara aplikasi ini di-deploy:
 * `output: "standalone"` menelusuri berkas yang benar-benar dipakai, dan biner
 * engine yang dipilih saat build adalah hal yang paling sering tidak ikut
 * terbawa. `pg` cuma JavaScript, jadi tidak ada yang bisa tertinggal.
 *
 * ## Kenapa disimpan di `globalThis`
 *
 * `next dev` memuat ulang modul tiap berkas disimpan. Tanpa penyimpanan di
 * luar modul, tiap muat ulang membuat kolam koneksi baru dan yang lama tidak
 * pernah ditutup — sepuluh menit mengerjakan sesuatu dan Postgres menolak
 * koneksi berikutnya karena batasnya habis. Di produksi modulnya dimuat
 * sekali, jadi cabang ini tidak pernah terpakai di sana.
 */

const simpanan = globalThis as unknown as { prisma?: PrismaClient };

/** Apakah server punya alamat database. */
export function databaseReady(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

export function db(): PrismaClient {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL belum diisi. Periksa databaseReady() sebelum memanggil db().",
    );
  }

  if (!simpanan.prisma) {
    simpanan.prisma = new PrismaClient({
      adapter: new PrismaPg({ connectionString: url }),
    });
  }
  return simpanan.prisma;
}

/**
 * Apakah kegagalan ini berasal dari constraint anti-double-booking.
 *
 * Ada di sini, bukan di pemanggilnya, karena setiap tempat yang menulis
 * booking akan membutuhkannya dan bentuk errornya tidak enak ditebak. Prisma 7
 * membungkusnya dua lapis: kodenya sendiri `P2039`, lalu SQLSTATE aslinya
 * `23P01` tersimpan di dalam error milik driver. Diperiksa langsung, bukan
 * dari teks pesan, karena teks itu bisa berubah antar versi dan bisa
 * diterjemahkan.
 *
 * Yang memanggilnya wajib menjawabnya sebagai 409 dengan kalimat yang siap
 * dibaca tamu — tanggalnya sudah terjual — bukan membiarkannya jadi 500.
 * Kegagalan ini bukan kerusakan, melainkan database yang mengerjakan tugasnya.
 */
export function isOverlapRejection(e: unknown): boolean {
  if (typeof e !== "object" || e === null) return false;
  const meta = (e as { meta?: unknown }).meta;
  if (typeof meta !== "object" || meta === null) return false;
  const driver = (meta as { driverAdapterError?: unknown }).driverAdapterError;
  if (typeof driver !== "object" || driver === null) return false;
  const cause = (driver as { cause?: unknown }).cause;
  if (typeof cause !== "object" || cause === null) return false;
  return (cause as { code?: unknown }).code === "23P01";
}
