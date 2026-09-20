/* Sama seperti `seed.ts`: dijalankan di luar Next, jadi `.env` dimuat sendiri.
   Di CI variabelnya datang dari secret, bukan dari berkas. */
import "dotenv/config";

import { db } from "../src/lib/db";

/**
 * Menghitung isi tiap tabel, dan tidak melakukan apa pun selain itu.
 *
 * Gunanya satu: memberi cara melihat keadaan database tanpa siapa pun perlu
 * memegang alamatnya. Kredensial Neon hanya ada di GitHub Secrets dan di panel
 * hosting — tidak di repositori, tidak di percakapan, dan tidak di mesin
 * siapa pun di sini. Jadi pertanyaan sesederhana "sudah ada kamarnya belum?"
 * tidak punya jawaban sampai ada yang bisa menanyakannya dari dalam CI.
 *
 * Dijalankan mengapit `db:seed` di workflow "Isi data awal", hasilnya jadi
 * bukti: yang sebelum memperlihatkan apa yang sudah ada, yang sesudah
 * memperlihatkan apa yang berubah. Tanpa itu keberhasilan sebuah langkah cuma
 * berarti perintahnya tidak melempar error.
 *
 * Hanya angka yang dicetak, tidak pernah isinya. Log GitHub Actions bisa
 * dibaca siapa pun yang punya akses ke repositori, dan nama serta nomor
 * telepon tamu bukan sesuatu yang pantas ada di sana.
 */
async function main() {
  const prisma = db();
  const [
    properti,
    kamar,
    tarifMusiman,
    tamu,
    booking,
    pembayaran,
    feed,
    sinkron,
    pengguna,
    aksesStaf,
    audit,
  ] = await Promise.all([
    prisma.property.count(),
    prisma.room.count(),
    prisma.seasonalRate.count(),
    prisma.guest.count(),
    prisma.booking.count(),
    prisma.payment.count(),
    prisma.icalFeed.count(),
    prisma.syncRun.count(),
    prisma.user.count(),
    prisma.userProperty.count(),
    prisma.auditLog.count(),
  ]);

  const baris: [string, number][] = [
    ["properties", properti],
    ["rooms", kamar],
    ["seasonal_rates", tarifMusiman],
    ["guests", tamu],
    ["bookings", booking],
    ["payments", pembayaran],
    ["ical_feeds", feed],
    ["sync_runs", sinkron],
    ["users", pengguna],
    ["user_properties", aksesStaf],
    ["audit_log", audit],
  ];

  const lebar = Math.max(...baris.map(([nama]) => nama.length));
  for (const [nama, jumlah] of baris) {
    console.log(`  ${nama.padEnd(lebar)}  ${String(jumlah).padStart(5)}`);
  }

  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  process.exit(1);
});
