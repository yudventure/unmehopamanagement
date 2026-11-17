/* `tsx` tidak memuat `.env` sendiri, dan skrip ini dijalankan di luar Next
   yang biasanya melakukannya. Hanya untuk dijalankan dari terminal; di server
   variabelnya datang dari panel, bukan dari berkas. */
import "dotenv/config";

import { Prisma } from "../generated/prisma/client";
import { db, isOverlapRejection } from "../src/lib/db";
import { PROPERTIES, seedRooms } from "../src/lib/data";

/**
 * Mengisi database dengan keterangan properti yang nyata: dua homestay, dan
 * kamar beserta tarif yang diberikan pemiliknya, dari `src/lib/data.ts`.
 *
 * Tidak ada booking karangan, tamu contoh, maupun pengguna contoh, dan tidak
 * ada cara menyalakannya. Nama tamu yang tidak pernah ada, di kamar yang
 * nyata, dengan nominal yang ikut terhitung di laporan pendapatan, adalah hal
 * yang paling tidak boleh masuk ke database sungguhan. Akun dibuat lewat
 * penyiapan di dashboard (`/api/penyiapan`), bukan dari sini.
 *
 * Aman diulang karena semuanya `upsert`. Perhatikan bahwa `upsert` menimpa:
 * tarif dan nama kamar kembali ke isi `data.ts`.
 */

/* Lewat `db()` yang sama dengan aplikasi, bukan klien sendiri: adapter dan
   pengaturannya cuma perlu benar di satu tempat. */
const prisma = db();

/** Nama saluran di aplikasi lama → enum di database. */
/**
 * Saluran di aplikasi → enum di database.
 *
 * "Sistem lama" sengaja tidak ada di sini, dan tidak punya padanan di enum
 * database. Booking bersaluran itu dibaca dari Google Sheet milik client dan
 * tidak pernah ditulis ke database ini — kalau suatu hari ada yang mencoba
 * menyemainya, tipenya yang menolak, bukan reviewer yang harus ingat.
 */
const CHANNEL = {
  "Booking.com": "BOOKING_COM",
  Traveloka: "TRAVELOKA",
  Agoda: "AGODA",
  WhatsApp: "WHATSAPP",
  Blokir: "BLOCK",
} as const;

type SaluranBisaDisemai = keyof typeof CHANNEL;

/** Status di aplikasi lama → enum di database. */
const STATUS = {
  Tentative: "TENTATIVE",
  Confirmed: "CONFIRMED",
  "Checked-in": "CHECKED_IN",
  "Checked-out": "CHECKED_OUT",
  Cancelled: "CANCELLED",
  "Tidak datang": "NO_SHOW",
} as const;

/**
 * "2 dewasa" dan "2 dewasa + 2 anak" jadi dua angka.
 *
 * Kapasitas dulu disimpan sebagai kalimat karena hanya pernah dibaca manusia.
 * Database memisahkannya supaya suatu saat bisa ditanya "kamar mana yang muat
 * lima orang" tanpa mengurai teks.
 */
function kapasitas(cap: string): { capAdult: number; capChild: number } {
  const dewasa = /(\d+)\s*dewasa/.exec(cap);
  const anak = /(\d+)\s*anak/.exec(cap);
  return {
    capAdult: dewasa ? Number(dewasa[1]) : 2,
    capChild: anak ? Number(anak[1]) : 0,
  };
}

/** Tanggal polos `YYYY-MM-DD` jadi DATE yang tidak bergeser zona waktu. */
const tanggal = (s: string) => new Date(`${s}T00:00:00Z`);

async function properti() {
  for (const p of PROPERTIES) {
    await prisma.property.upsert({
      where: { id: p.key },
      update: { name: p.name, island: p.location },
      create: { id: p.key, name: p.name, island: p.location },
    });
  }
  return PROPERTIES.length;
}

async function kamar() {
  const rooms = seedRooms();
  for (const [i, r] of rooms.entries()) {
    const { capAdult, capChild } = kapasitas(r.cap);
    const isi = {
      propertyId: r.prop,
      name: r.name,
      capAdult,
      capChild,
      baseRate: new Prisma.Decimal(r.rate),
      isActive: r.active,
      /* Alasan sebuah kamar tidak aktif tidak pernah dicatat di data lama —
         hanya `active: false`. Turtle 07 memang sedang direnovasi, tapi
         menuliskannya di sini berarti mengarang untuk kamar mana pun yang
         nonaktif nanti. Dibiarkan kosong sampai ada yang mengisinya. */
      sortOrder: i,
    };
    await prisma.room.upsert({
      where: { id: r.id },
      update: isi,
      create: { id: r.id, ...isi },
    });
  }
  return rooms.length;
}

async function main() {
  console.log("Mengisi properti dan kamar.");
  console.log(`  properti  ${await properti()}`);
  console.log(`  kamar     ${await kamar()}`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
