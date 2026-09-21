import { iso } from "./format";
import {
  type Aktivitas,
  type BookingLama,
  dibatalkan,
  jumlahTamu,
  namaTamu,
  statusLama,
  tanggalLama,
  teksLadang,
} from "./sistem-lama-bentuk";
import type { Booking, BookingStatus, Room } from "./types";

/**
 * Catatan sistem lama, diterjemahkan jadi kamar dan booking layar ini.
 *
 * ## Kenapa kamarnya menggantikan, bukan menemani
 *
 * Kamar Turtle di data kami bernama "Turtle 01" sampai "Turtle 10". Itu nama
 * yang dibangkitkan pembangkit di masa prototipe — tidak pernah jadi nama
 * kamar siapa pun, dan tidak pernah diucapkan ke tamu. Kamar sungguhannya ada
 * di sistem lama, dan pemiliknya menetapkan penamaan ikut sistem lama.
 *
 * Jadi waktu sistem lamanya tersambung, kamar Turtle di seluruh dashboard ini
 * **adalah** kamar sistem lama, dengan nama persis seperti di sana. Bukan
 * ditambahkan di sebelah yang lama — kalau keduanya ada, okupansi dihitung
 * atas kamar yang separuhnya tidak pernah ada.
 *
 * ## Yang tidak diterjemahkan, karena tidak ada
 *
 * `adminList` tidak mengirim **harga** dan tidak mengirim **saluran**.
 * Keduanya tidak diisi dengan tebakan:
 *
 * - harga → `total: 0` dengan `tanpaHarga: true`. Penandanya yang menentukan;
 *   hitungan pendapatan, komisi, dan piutang melewatinya, dan layar menulis
 *   berapa malam yang belum berharga alih-alih menampilkan Rp 0 seolah itu
 *   harganya.
 * - saluran → `"Sistem lama"`, salurannya sendiri. Menaruhnya di
 *   "WA / langsung" karena kebanyakan begitu akan membuat laporan per saluran
 *   memuat angka yang tidak pernah dicatat siapa pun.
 */

/** Satu-satunya pemetaan di berkas ini, dan ia ditulis terang-terangan. */
function statusDari(b: BookingLama): BookingStatus {
  const st = statusLama(b);
  /* `checkout` di sistem lama adalah tab, dan tabnya diisi manual — komentar
     di dashboard lamanya menyebut booking yang ditandai Check-Out padahal
     tanggalnya masih di depan. Jadi ini mengikuti apa yang stafnya tandai,
     bukan apa yang tanggalnya bilang. */
  if (st?.nada === "checkout") return "Checked-out";
  return "Confirmed";
}

export const PREFIKS_KAMAR = "lama-";

/**
 * Kamar Turtle dari daftar kamar sistem lama.
 *
 * `rate: 0` karena tarifnya tidak dibaca dari sana — dan tarif yang dikarang
 * akan muncul di layar Properti & Kamar sebagai angka yang kelihatan resmi.
 */
export function kamarDariLama(nama: string[]): Room[] {
  return nama.map((n) => ({
    id: `${PREFIKS_KAMAR}${n}`,
    prop: "turtle" as const,
    name: `Room ${n}`,
    cap: "",
    rate: 0,
    active: true,
  }));
}

/**
 * Booking sistem lama sebagai booking layar ini.
 *
 * Yang tanggalnya tidak terbaca dan yang dibatalkan tidak ikut — keduanya
 * tidak bisa digambar di kalender tanpa menebak, dan menebaknya berarti
 * memegang kamar untuk malam yang belum tentu terjual.
 *
 * Kamar yang muncul di booking tapi tidak ada di daftar kamar ikut
 * ditambahkan. Daftar dari `adminGetRoomSchedule` yang menentukan penyebut
 * okupansi, tapi kamar yang terlewat di sana tidak boleh membuat tamunya
 * hilang dari kalender.
 */
export function bookingDariLama(
  bookings: BookingLama[],
  namaKamar: string[],
): { rooms: Room[]; bookings: Booking[]; tanpaTanggal: number } {
  const diketahui = [...namaKamar];
  const hasil: Booking[] = [];
  let tanpaTanggal = 0;
  let tanpaKamar = 0;

  for (const b of bookings) {
    if (dibatalkan(b)) continue;

    const masuk = tanggalLama(b.checkIn);
    if (!masuk) {
      tanpaTanggal++;
      continue;
    }
    /* Tanpa tanggal keluar, satu malam. Menebak lamanya menginap berarti
       memblokir kamar untuk malam yang belum tentu terjual. */
    const keluar =
      tanggalLama(b.checkOut) ??
      iso(new Date(new Date(`${masuk}T00:00:00`).getTime() + 86400000));
    /* `checkOut` eksklusif di layar ini. Yang keluar di hari yang sama atau
       lebih awal tidak memegang malam apa pun. */
    if (keluar <= masuk) continue;

    const kamar = teksLadang(b.room);
    if (!kamar) {
      tanpaKamar++;
      continue;
    }
    if (!diketahui.includes(kamar)) diketahui.push(kamar);

    const kode = teksLadang(b.confirmationNo);
    hasil.push({
      id: `${PREFIKS_KAMAR}${kode ?? `${kamar}-${masuk}`}`,
      code: kode ?? "—",
      roomId: `${PREFIKS_KAMAR}${kamar}`,
      guest: namaTamu(b) || "tanpa nama",
      phone: teksLadang(b.whatsapp) ?? "",
      pax: jumlahTamu(b),
      channel: "Sistem lama",
      checkIn: masuk,
      checkOut: keluar,
      total: 0,
      tanpaHarga: true,
      status: statusDari(b),
      notes: "",
      src: "manual",
    });
  }

  return {
    rooms: kamarDariLama(diketahui),
    bookings: hasil,
    /* Yang tak berkamar dihitung bersama yang tak bertanggal: dua-duanya
       "tidak bisa ditaruh di kalender", dan layarnya menyebut jumlahnya. */
    tanpaTanggal: tanpaTanggal + tanpaKamar,
  };
}

/**
 * Warna per aktivitas dive centre.
 *
 * Keluarga hangat yang sama dengan sisa dashboard, bukan enam warna cerah yang
 * bersaing dengan chip booking di sel yang sama. Yang dibaca di sel itu
 * namanya; warnanya cuma membantu mata mengelompokkan baris sejenis antar hari.
 */
export const WARNA_AKTIVITAS: Record<
  Aktivitas,
  { bg: string; fg: string; dot: string }
> = {
  Diving: { bg: "#DCEAF3", fg: "#1D5A7A", dot: "#3E8DB5" },
  Snorkeling: { bg: "#DCEFE3", fg: "#216B4B", dot: "#4FA07A" },
  "SSI Dive Course": { bg: "#E6E3F5", fg: "#4A3F86", dot: "#8076C4" },
  "Excursion Trip": { bg: "#F7EEDD", fg: "#7A5A1F", dot: "#C79B4E" },
  Transport: { bg: "#F0EBE4", fg: "#5F564A", dot: "#A19686" },
};
