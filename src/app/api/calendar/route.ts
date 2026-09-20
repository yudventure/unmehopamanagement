import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { databaseReady, db } from "@/lib/db";
import { SESSION_COOKIE, valid } from "@/lib/session";
import { isPublicSite } from "@/lib/site-domains";

/**
 * Satu permintaan untuk seluruh kisi sebulan.
 *
 *   /api/calendar?from=2026-08-01&to=2026-09-01
 *   /api/calendar?from=…&to=…&property=turtle
 *
 * Rentangnya setengah terbuka, `[from, to)`, sama seperti cara booking
 * menyimpan malamnya. Jadi sebulan penuh ditanyakan sebagai tanggal 1 bulan ini
 * sampai tanggal 1 bulan depan, dan tidak ada tanggal yang terhitung dua kali
 * di perbatasan.
 *
 * ## Satu query, bukan satu per kamar
 *
 * Kalender menggambar lima belas baris dikali tiga puluh satu hari. Menanyakan
 * per kamar berarti lima belas perjalanan ke database untuk satu layar, dan di
 * pulau dengan koneksi lambat itu terasa. Postgres menjawab keseluruhannya
 * sekaligus lewat indeks gist pada `stay`, yang memang dibuat untuk pertanyaan
 * bentuk ini.
 *
 * ## Yang dikembalikan, dan yang tidak
 *
 * Booking yang dibatalkan tetap dikirim. Kalender tidak menggambarnya sebagai
 * kamar terisi, tapi laporan dan riwayat membutuhkannya, dan menyaringnya di
 * sini berarti layar lain harus bertanya lagi.
 *
 * ## Yang belum bisa dijaga di sini
 *
 * Handoff teknisnya meminta peran diperiksa di tiap route, dan nominal dibuang
 * untuk staf. Itu belum bisa: sesi di aplikasi ini satu kata sandi bersama,
 * dan cookie-nya cuma membawa masa berlaku beserta tanda tangannya — tidak ada
 * yang memberi tahu server siapa yang memegangnya. Jadi yang dijaga di sini
 * baru "sudah masuk atau belum", dan itu memang dijaga sungguhan.
 *
 * Ini bukan kemunduran: hari ini seluruh isi buku sudah ada di browser siapa
 * pun yang berhasil masuk. Tapi ini seam yang harus diganti begitu ada akun per
 * orang, dan disebut di sini supaya tidak terlupa saat itu tiba.
 */

export const runtime = "nodejs";

/** `YYYY-MM-DD` jadi DATE yang tidak bergeser zona waktu. */
function tanggal(s: string | null): Date | null {
  if (!s || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  const d = new Date(`${s}T00:00:00Z`);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** DATE dari database kembali jadi `YYYY-MM-DD`, apa adanya. */
const polos = (d: Date) => d.toISOString().slice(0, 10);

export async function GET(req: Request) {
  const jar = await cookies();
  if (!valid(jar.get(SESSION_COOKIE)?.value)) {
    return NextResponse.json({ error: "not-found" }, { status: 404 });
  }

  /* Bukan error, dan bukan kalender kosong. Layar yang memanggil ini harus
     bisa membedakan "belum ada database" dari "tidak ada tamu bulan ini", dan
     yang kedua akan terbaca seperti kabar buruk yang salah. */
  if (!databaseReady()) {
    return NextResponse.json({ configured: false });
  }

  const url = new URL(req.url);
  const from = tanggal(url.searchParams.get("from"));
  const to = tanggal(url.searchParams.get("to"));
  if (!from || !to || from >= to) {
    return NextResponse.json(
      { error: "bad-range", detail: "Isi from dan to sebagai YYYY-MM-DD, from lebih awal dari to." },
      { status: 400 },
    );
  }

  const property = url.searchParams.get("property");
  if (property && property !== "all" && !isPublicSite(property)) {
    return NextResponse.json({ error: "unknown-property" }, { status: 400 });
  }
  const scope = property && property !== "all" ? { propertyId: property } : {};

  const prisma = db();
  const [rooms, bookings] = await Promise.all([
    prisma.room.findMany({
      where: scope,
      orderBy: [{ propertyId: "asc" }, { sortOrder: "asc" }],
    }),
    prisma.booking.findMany({
      /* Tumpang tindih dengan jendelanya, bukan mulai di dalamnya: tamu yang
         datang akhir bulan lalu dan pulang tanggal 3 menempati tiga malam
         pertama bulan ini, dan barisnya harus ada di kisi. */
      where: { checkIn: { lt: to }, checkOut: { gt: from }, room: scope },
      include: { guest: { select: { name: true, phone: true } } },
      orderBy: [{ roomId: "asc" }, { checkIn: "asc" }],
    }),
  ]);

  return NextResponse.json({
    configured: true,
    from: polos(from),
    to: polos(to),
    rooms: rooms.map((r) => ({
      id: r.id,
      propertyId: r.propertyId,
      name: r.name,
      capAdult: r.capAdult,
      capChild: r.capChild,
      /* Decimal jadi number di sini, bukan di layar. Rupiah tidak punya sen
         dan angkanya jauh di bawah batas aman JavaScript, jadi tidak ada
         ketelitian yang hilang — dan yang menerima tidak perlu tahu Prisma. */
      baseRate: Number(r.baseRate),
      isActive: r.isActive,
      sortOrder: r.sortOrder,
    })),
    bookings: bookings.map((b) => ({
      id: b.id,
      code: b.code,
      roomId: b.roomId,
      guest: b.guest?.name ?? null,
      phone: b.guest?.phone ?? null,
      /* Boleh null, dan diteruskan begitu saja. Feed iCal OTA sering tidak
         membawa jumlah tamu, dan angka bawaan di sini akan membuat booking
         impor mengaku tahu sesuatu yang tidak pernah dikirim kepadanya. */
      pax: b.pax,
      checkIn: polos(b.checkIn),
      checkOut: polos(b.checkOut),
      channel: b.channel,
      status: b.status,
      source: b.source,
      totalAmount: b.totalAmount === null ? null : Number(b.totalAmount),
      notes: b.notes,
      conflictGroup: b.conflictGroup,
    })),
  });
}
