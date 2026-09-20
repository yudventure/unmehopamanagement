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
 *
 * ## Kenapa `DIRECT_URL` didahulukan
 *
 * Berkas ini hanya dibaca CLI, tidak pernah oleh aplikasi yang melayani
 * permintaan. Pembagian itu yang dimanfaatkan di sini.
 *
 * Penyedia Postgres terkelola memberi dua alamat: satu lewat pooler dan satu
 * langsung. Aplikasi memerlukan yang pooled, karena tiap permintaan membuka
 * koneksi sendiri dan Postgres punya batas berapa banyak yang boleh terbuka
 * sekaligus. Migrasi memerlukan yang langsung, karena ia mengambil kunci
 * tingkat sesi (advisory lock) yang menjaga dua migrasi tidak berjalan
 * bersamaan — dan kunci itu tidak selamat melewati pooler transaksi, yang bisa
 * memindahkan perintah berikutnya ke koneksi lain.
 *
 * Jadi yang benar bukan memilih salah satu, melainkan memberi tiap pihak
 * miliknya. Diisi keduanya, CLI memakai `DIRECT_URL`. Diisi satu saja, ia
 * jatuh ke `DATABASE_URL` dan tetap bekerja — yang memang keadaan Postgres
 * lokal, di mana pooler tidak ada dan kedua alamat itu satu.
 */
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env["DIRECT_URL"] || process.env["DATABASE_URL"],
  },
});
