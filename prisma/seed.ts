/* `tsx` tidak memuat `.env` sendiri, dan skrip ini dijalankan di luar Next
   yang biasanya melakukannya. Hanya untuk dijalankan dari terminal; di server
   variabelnya datang dari panel, bukan dari berkas. */
import "dotenv/config";

import { Prisma } from "../generated/prisma/client";
import { db, isOverlapRejection } from "../src/lib/db";
import {
  PROPERTIES,
  seedBookings,
  seedLedger,
  seedRooms,
  seedUsers,
} from "../src/lib/data";
import type { Booking as SeedBooking } from "../src/lib/types";

/**
 * Mengisi database dari data yang sudah ada di `src/lib/data.ts`.
 *
 * ## Dua isi yang tidak sama
 *
 * Berkas itu memuat dua hal yang selama ini tercampur karena keduanya sama-
 * sama "data seed": **keterangan properti yang nyata** — dua homestay, lima
 * belas kamar, tarif yang diberikan pemiliknya — dan **booking karangan** untuk
 * Agustus 2026 yang dibangkitkan LCG supaya kalender demonya tidak kosong.
 *
 * Yang pertama boleh, malah harus, masuk ke database sungguhan. Yang kedua
 * tidak boleh sama sekali: nama tamu yang tidak pernah ada, di kamar yang
 * nyata, dengan nominal yang akan ikut terhitung di laporan pendapatan.
 *
 * Jadi keduanya dipisah di sini. Tanpa argumen, skrip ini hanya menulis
 * properti, kamar, dan pengguna — aman dijalankan terhadap produksi, dan aman
 * diulang karena semuanya `upsert`. Dengan `--demo`, booking karangannya ikut,
 * dan itu hanya untuk mesin sendiri.
 *
 * ## Kenapa booking demo justru berguna dijalankan
 *
 * Data seed itu memuat satu bentrok yang disengaja: Turtle 03 terjual dua kali
 * pada malam yang sama, dulu dipakai menguji banner konflik di kalender.
 * Sekarang database menolaknya dengan 23P01 — jadi memuat data itu adalah
 * latihan langsung untuk jalur yang nanti dipakai impor iCal, di mana booking
 * yang sudah terjadi di OTA tidak boleh dibuang hanya karena bentrok.
 *
 * Penanganannya sama persis dengan yang akan ditulis importer nanti: coba
 * simpan; kalau ditolak, simpan lagi sebagai CONFLICT dengan penanda kelompok
 * supaya operator bisa meninjau keduanya sebagai satu perkara.
 */

/* Lewat `db()` yang sama dengan aplikasi, bukan klien sendiri: adapter dan
   pengaturannya cuma perlu benar di satu tempat. */
const prisma = db();

const DEMO = process.argv.includes("--demo");

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

async function pengguna() {
  for (const u of seedUsers) {
    const isi = {
      name: u.name,
      email: u.email,
      role: u.role === "Owner" ? ("OWNER" as const) : ("STAFF" as const),
      isActive: u.active,
      /* Tidak ada sandi yang dibawa dari data lama, dan tidak ada yang boleh
         dikarang di sini: hash palsu berarti akun yang tampak siap padahal
         tidak. Null berarti akun ada dan sandinya belum dibuat — persis
         keadaan sebenarnya, dan bentuk yang sama yang nanti dipakai undangan. */
      passwordHash: null,
    };
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: isi,
      create: isi,
    });

    /* Owner melihat semuanya dan tidak perlu baris pembatas. Staf dibatasi ke
       properti yang namanya disebut di `scope`. */
    if (u.role === "Owner") continue;
    const target = PROPERTIES.find((p) => p.name === u.scope);
    if (!target) continue;
    await prisma.userProperty.upsert({
      where: { userId_propertyId: { userId: user.id, propertyId: target.key } },
      update: {},
      create: { userId: user.id, propertyId: target.key },
    });
  }
  return seedUsers.length;
}

/**
 * Tamu dibuat dari nama dan nomor di booking, sekali per orang.
 *
 * Data lama menyimpan nama tamu di dalam booking-nya, jadi satu orang yang
 * menginap tiga kali tertulis tiga kali. Di sini ia jadi satu baris, yang
 * memang gunanya tabel terpisah: riwayat tamu bisa ditanyakan.
 */
async function tamu(bookings: SeedBooking[]) {
  const peta = new Map<string, string>();
  for (const b of bookings) {
    if (!b.guest) continue;
    const kunci = `${b.guest}|${b.phone}`;
    if (peta.has(kunci)) continue;
    const g = await prisma.guest.create({
      /* `origin` menandai asal tamu ini. Diisi "demo" supaya pembersihan di
         bawah bisa menyasar tepat baris-baris ini dan tidak pernah tamu
         sungguhan yang kebetulan belum punya booking. */
      data: { name: b.guest, phone: b.phone || null, origin: "demo" },
    });
    peta.set(kunci, g.id);
  }
  return peta;
}

/**
 * Menyimpan booking demo, dan menangani yang ditolak constraint.
 *
 * Inilah jalur yang nanti dipakai impor iCal. Booking yang bentrok tidak
 * dibuang — ia disimpan sebagai CONFLICT dengan penanda kelompok berisi kamar
 * dan malam yang diperebutkan, supaya yang meninjau melihat keduanya
 * berdampingan dan bukan menemukan satu saja.
 */
async function bookingDemo(
  bookings: SeedBooking[],
  guestIds: Map<string, string>,
) {
  let simpan = 0;
  let bentrok = 0;

  for (const b of bookings) {
    const dasar = {
      id: b.id,
      code: b.id,
      roomId: b.roomId,
      guestId: guestIds.get(`${b.guest}|${b.phone}`) ?? null,
      checkIn: tanggal(b.checkIn),
      checkOut: tanggal(b.checkOut),
      channel: CHANNEL[b.channel as SaluranBisaDisemai],
      source: b.src === "iCal" ? ("ICAL" as const) : ("MANUAL" as const),
      totalAmount: new Prisma.Decimal(b.total),
      notes: b.notes || null,
    };
    /* Blokir bukan tamu, jadi bukan status tamu. Di data lama ia saluran;
       di sini ia status, karena yang penting bagi kalender adalah bahwa
       kamarnya terkunci. */
    const status =
      b.channel === "Blokir" ? ("BLOCKED" as const) : STATUS[b.status];

    try {
      await prisma.booking.create({ data: { ...dasar, status } });
      simpan += 1;
    } catch (e) {
      if (!isOverlapRejection(e)) throw e;
      await prisma.booking.create({
        data: {
          ...dasar,
          status: "CONFLICT",
          conflictGroup: `${b.roomId}:${b.checkIn}`,
        },
      });
      bentrok += 1;
      console.log(
        `  bentrok  ${b.id}  ${b.roomId}  ${b.checkIn} → ${b.checkOut}  disimpan sebagai CONFLICT`,
      );
    }
  }
  return { simpan, bentrok };
}

/**
 * Membuang data demo dari muatan sebelumnya, dan hanya itu.
 *
 * Mode demo harus bisa dijalankan berulang — percobaan yang berhenti di tengah
 * meninggalkan separuh isi, dan jalannya lagi akan tersandung kode booking yang
 * sudah ada. Tapi menghapus adalah hal paling berbahaya yang dilakukan skrip
 * ini, jadi sasarannya dipersempit sampai tidak mungkin keliru.
 *
 * Booking demo dikenali dari kodenya: `BK…` dan `BH…` adalah pola yang
 * dibangkitkan `seedBookings` dan `seedLedger`, bukan pola yang dipakai
 * booking sungguhan. Tamu demo dikenali dari `origin = "demo"` yang ditulis
 * saat dibuat. Apa pun di luar keduanya tidak disentuh — jadi seandainya ini
 * pernah dijalankan di tempat yang salah, yang hilang cuma yang ia taruh
 * sendiri.
 */
async function bersihkanDemo() {
  const booking = await prisma.booking.deleteMany({
    where: {
      OR: [{ code: { startsWith: "BK" } }, { code: { startsWith: "BH" } }],
    },
  });
  const tamu = await prisma.guest.deleteMany({ where: { origin: "demo" } });
  if (booking.count || tamu.count) {
    console.log(
      `  dibersihkan  ${booking.count} booking dan ${tamu.count} tamu dari muatan demo sebelumnya`,
    );
  }
}

async function main() {
  console.log(
    DEMO
      ? "Mengisi properti, kamar, pengguna, dan booking demo."
      : "Mengisi properti, kamar, dan pengguna. Tambahkan --demo untuk booking karangan.",
  );

  console.log(`  properti  ${await properti()}`);
  console.log(`  kamar     ${await kamar()}`);
  console.log(`  pengguna  ${await pengguna()}`);

  if (!DEMO) return;

  await bersihkanDemo();

  const rooms = seedRooms();
  const semua = seedBookings(rooms).concat(
    seedLedger(rooms, seedBookings(rooms)),
  );
  const guestIds = await tamu(semua);
  console.log(`  tamu      ${guestIds.size}`);

  const { simpan, bentrok } = await bookingDemo(semua, guestIds);
  console.log(`  booking   ${simpan} tersimpan, ${bentrok} jadi CONFLICT`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
