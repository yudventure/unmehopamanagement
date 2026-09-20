import "dotenv/config";
import { defineConfig } from "prisma/config";

/**
 * Konfigurasi Prisma CLI.
 *
 * Alamat database tidak lagi ditulis di `schema.prisma` sejak Prisma 7 — ia
 * dibaca di sini, saat perintah dijalankan. Bedanya bukan sekadar pindah
 * tempat: skema jadi berkas yang aman dibaca siapa pun, dan kredensial tetap
 * di lingkungan.
 *
 * `dotenv/config` hanya untuk CLI ini. Aplikasinya sendiri tidak memerlukannya:
 * Next memuat `.env` dan `.env.local` sendiri, dan yang berjalan di produksi
 * membaca variabel dari panel server, bukan dari berkas.
 *
 * `DATABASE_URL` kosong bukan kesalahan yang perlu dilaporkan di sini. Tanpa
 * itu tidak ada perintah Prisma yang berguna untuk dijalankan, dan CLI-nya
 * sudah mengatakan itu dengan jelas.
 */
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env["DATABASE_URL"],
  },
});
