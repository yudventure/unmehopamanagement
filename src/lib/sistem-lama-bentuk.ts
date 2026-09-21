import { dayDiff, iso } from "./format";

/**
 * Bentuk data sistem lama, dan cara membacanya — tanpa menyentuh jaringan.
 *
 * Dipisahkan dari `sistem-lama.ts` karena berkas itu server-only: ia memegang
 * password dan tidak boleh ikut ke peramban. Yang ada di sini murni bentuk dan
 * hitungan, jadi aman dipakai kedua sisi, dan memang dipakai kedua-duanya —
 * sebelum ini helper yang sama ditulis dua kali, dan dua salinan yang harus
 * tetap sama adalah dua salinan yang suatu saat berbeda.
 */

/**
 * Satu booking seperti disimpan Sheet lama.
 *
 * Tiap ladang opsional, dan tiap ladang masih dugaan sampai endpoint
 * sungguhannya menjawab: daftar ini dibaca dari kode render dashboard lama,
 * bukan dari skema. Tidak ada yang wajib ada, dan layar menampilkan strip di
 * tempat yang kosong alih-alih mengarangnya.
 */
export interface BookingLama {
  confirmationNo?: string;
  guestName?: string;
  name?: string;
  nama?: string;
  guestNamesList?: string[] | string;
  otherGuests?: string;
  checkIn?: string;
  checkOut?: string;
  room?: string;
  capacity?: string | number;
  whatsapp?: string;
  status?: string;
  displayStatus?: string;
  session?: string;
  reqDiving?: unknown;
  reqSnorkeling?: unknown;
  reqTryDive?: unknown;
  reqTransport?: unknown;
  reqSSICourse?: unknown;
  reqExtraBed?: unknown;
  reqExcursion?: unknown;
  [k: string]: unknown;
}

/** Nama tamunya, dari ladang mana pun yang terisi di Sheet itu. */
export function namaTamu(b: BookingLama): string {
  for (const c of [b.guestName, b.name, b.nama]) {
    if (typeof c === "string" && c.trim()) return c.trim();
  }
  return "";
}

/** Berapa orang yang disebut booking ini, termasuk tamu utamanya. */
export function jumlahTamu(b: BookingLama): number | null {
  const daftar = b.guestNamesList;
  if (Array.isArray(daftar)) return daftar.length || null;
  if (typeof daftar === "string" && daftar.trim()) {
    return daftar.split(/[\n,;]+/).filter((s) => s.trim()).length || null;
  }
  const kap = Number(b.capacity);
  return Number.isFinite(kap) && kap > 0 ? kap : null;
}

/** Apakah salah satu penanda `req…` menyala, bentuk apa pun yang datang. */
export function diminta(nilai: unknown): boolean {
  if (typeof nilai === "boolean") return nilai;
  if (typeof nilai === "number") return nilai > 0;
  if (typeof nilai === "string") {
    const v = nilai.trim().toLowerCase();
    return v !== "" && v !== "0" && v !== "no" && v !== "false" && v !== "-";
  }
  return false;
}

/**
 * Tanggalnya sebagai YYYY-MM-DD, atau null kalau tidak yakin.
 *
 * Sengaja cuma mengenali satu bentuk, dan itu bukan kemalasan. Sistem lamanya
 * sendiri menafsirkannya begitu: `fmtDMY` di dashboard lama mencocokkan
 * `^(\d{4})-(\d{2})-(\d{2})` dan memulangkan apa adanya kalau tidak cocok.
 * Jadi ini mengikuti tafsir yang sudah berlaku di sana, bukan membuat yang
 * baru.
 *
 * Yang penting justru penolakannya. "02/10/2026" bisa 2 Oktober dan bisa 10
 * Februari, dan menebaknya berarti menaruh tamu sungguhan di hari yang salah —
 * di layar yang dipakai untuk menjemput orang di dermaga. Yang tidak terbaca
 * dihitung terpisah dan ditampilkan apa adanya.
 */
export function tanggalLama(nilai: unknown): string | null {
  if (typeof nilai !== "string") return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(nilai.trim());
  if (!m) return null;
  const [, y, bl, d] = m;
  const dt = new Date(`${y}-${bl}-${d}T00:00:00`);
  if (Number.isNaN(dt.getTime())) return null;
  /* Menolak 2026-02-31: Date menggesernya jadi Maret tanpa mengeluh. */
  return iso(dt) === `${y}-${bl}-${d}` ? `${y}-${bl}-${d}` : null;
}

/** Tanggalnya untuk dibaca orang; yang tidak terbaca ditampilkan apa adanya. */
export function tanggalTampil(nilai: unknown): string {
  if (typeof nilai !== "string" || !nilai.trim()) return "";
  const rapi = tanggalLama(nilai);
  if (!rapi) return nilai.trim();
  return new Date(`${rapi}T00:00:00`).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** Booking yang sudah dibatalkan tidak ikut dipantau. */
export function dibatalkan(b: BookingLama): boolean {
  const teks = [b.displayStatus, b.status]
    .filter((s): s is string => typeof s === "string")
    .join(" ")
    .toLowerCase();
  return teks.includes("cancel") || teks.includes("batal");
}

export interface KedatanganNanti {
  booking: BookingLama;
  /** Berapa hari lagi. 1 = besok. */
  hari: number;
}

/**
 * Apa yang perlu dilihat hari ini, diturunkan dari daftar bookingnya sendiri.
 *
 * Diturunkan, bukan diminta ke mode `adminDashboard` — mode itu memang ada dan
 * memulangkan papan yang mirip, tapi bentuk tiap barisnya belum pernah kami
 * lihat sungguhan. Menghitungnya dari `adminList`, yang bentuknya sudah
 * diperiksa, berarti yang tampil bisa dipertanggungjawabkan sekarang. Kalau
 * nanti endpoint aslinya sudah bisa dibaca, `adminDashboard` membawa hal yang
 * tidak bisa diturunkan dari sini — diving hari ini, alergi, overbooking — dan
 * itu langkah berikutnya, bukan tebakan hari ini.
 */
export interface PapanPantau {
  datangHariIni: BookingLama[];
  pulangHariIni: BookingLama[];
  sedangMenginap: BookingLama[];
  datangNanti: KedatanganNanti[];
  /** Tamu yang sedang di tempat, dijumlahkan; null kalau tidak ada yang bisa dihitung. */
  tamuDiTempat: number | null;
  /** Booking yang tanggalnya tidak terbaca, jadi tidak bisa ditaruh di hari mana pun. */
  tanpaTanggal: BookingLama[];
  /** Yang dibatalkan, dikeluarkan dari semua hitungan di atas. */
  jumlahDibatalkan: number;
}

/** Berapa hari ke depan "datang nanti" mencakup. */
export const JENDELA_HARI = 14;

export function papanPantau(
  bookings: BookingLama[],
  hariIni: string = iso(new Date()),
): PapanPantau {
  const papan: PapanPantau = {
    datangHariIni: [],
    pulangHariIni: [],
    sedangMenginap: [],
    datangNanti: [],
    tamuDiTempat: null,
    tanpaTanggal: [],
    jumlahDibatalkan: 0,
  };

  let kepala = 0;
  let adaYangDihitung = false;

  for (const b of bookings) {
    if (dibatalkan(b)) {
      papan.jumlahDibatalkan++;
      continue;
    }

    const masuk = tanggalLama(b.checkIn);
    const keluar = tanggalLama(b.checkOut);

    /* Tanpa tanggal masuk tidak ada yang bisa dikatakan tentang kapan ia ada.
       Tanggal keluar yang kosong masih bisa dipakai: tamunya datang, cuma
       belum jelas sampai kapan. */
    if (!masuk) {
      papan.tanpaTanggal.push(b);
      continue;
    }

    if (masuk === hariIni) papan.datangHariIni.push(b);
    if (keluar === hariIni) papan.pulangHariIni.push(b);

    /* Sudah masuk dan belum keluar. Hari kepulangan tidak dihitung menginap —
       kamarnya kosong malam itu, dan itu yang menentukan okupansi. */
    if (masuk <= hariIni && (!keluar || keluar > hariIni)) {
      papan.sedangMenginap.push(b);
      const orang = jumlahTamu(b);
      if (orang !== null) {
        kepala += orang;
        adaYangDihitung = true;
      }
    }

    if (masuk > hariIni) {
      const hari = dayDiff(hariIni, masuk);
      if (hari <= JENDELA_HARI) papan.datangNanti.push({ booking: b, hari });
    }
  }

  const urutTanggal = (a: BookingLama, b: BookingLama) =>
    (tanggalLama(a.checkIn) ?? "").localeCompare(tanggalLama(b.checkIn) ?? "");

  papan.datangHariIni.sort(urutTanggal);
  papan.pulangHariIni.sort(urutTanggal);
  papan.sedangMenginap.sort(urutTanggal);
  papan.datangNanti.sort((a, b) => a.hari - b.hari);

  /* Nol kepala dari sepuluh booking berarti jumlahnya tidak pernah dicatat,
     bukan bahwa tempatnya kosong. Dua pernyataan yang berbeda, dan yang kedua
     akan terbaca seperti angka yang benar. */
  papan.tamuDiTempat = adaYangDihitung ? kepala : null;

  return papan;
}
