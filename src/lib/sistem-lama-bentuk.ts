import { dayDiff, iso, parse } from "./format";

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

/**
 * Isi satu ladang sebagai teks, atau null kalau memang kosong.
 *
 * Angka ikut diterima, dan itu bukan kelonggaran — itu perbaikan atas bug
 * yang baru ketahuan waktu endpoint sungguhannya menjawab. Versi pertama
 * menyaring dengan `typeof === "string"`, jadi nomor kamar yang datang sebagai
 * angka JSON (`"room": 3`) jatuh ke "—". Di layar, "—" berarti **belum
 * dicatat**, jadi penyaring yang dimaksudkan sebagai kehati-hatian justru
 * mengarang pernyataan yang salah tentang data sungguhan: seluruh kolom kamar
 * kosong padahal tidak ada satu pun yang kosong.
 *
 * Sistem lamanya sendiri tidak memeriksa tipe — ia menulis `Room ${b.room}`
 * apa adanya. Jadi yang benar mengikuti itu: yang ada ditampilkan, yang
 * betul-betul tidak ada baru jadi "—".
 */
export function teksLadang(nilai: unknown): string | null {
  if (typeof nilai === "string") {
    const rapi = nilai.trim();
    return rapi ? rapi : null;
  }
  if (typeof nilai === "number" && Number.isFinite(nilai)) return String(nilai);
  return null;
}

/** Nama tamunya, dari ladang mana pun yang terisi di Sheet itu. */
export function namaTamu(b: BookingLama): string {
  for (const c of [b.guestName, b.name, b.nama]) {
    const t = teksLadang(c);
    if (t) return t;
  }
  return "";
}

/**
 * Status booking, dengan kata yang dipakai sistem lama.
 *
 * `displayStatus` di `adminList` **bukan** status tamu — ia nama tab:
 * `arrival`, `upcoming`, `checkout`. Itu baru ketahuan dari `renderBookingTab`
 * dan `statusLabel` di dashboard lamanya, dan sebelum itu layar ini
 * menampilkan kata mentahnya sebagai kalau-kalau itu status.
 *
 * Lebih buruk dari sekadar jelek: pewarnaannya dulu mencocokkan potongan kata,
 * dan "upcom**in**g" mengandung "in" tanpa "out", jadi tamu yang belum datang
 * diwarnai hijau seperti sudah check-in. Di layar yang dipakai memutuskan
 * siapa dijemput, itu bukan salah warna, itu salah kabar.
 *
 * Yang tidak dikenali tetap ditampilkan apa adanya — kalau suatu hari sistem
 * lamanya menambah kata baru, layar ini menunjukkannya, bukan menelannya.
 */
export type NadaStatus = "arrival" | "checkout" | "upcoming" | "lain";

export function statusLama(
  b: BookingLama,
): { label: string; nada: NadaStatus } | null {
  const mentah = teksLadang(b.displayStatus) ?? teksLadang(b.status);
  if (!mentah) return null;
  switch (mentah.toLowerCase()) {
    case "arrival":
      return { label: "Arrival", nada: "arrival" };
    case "checkout":
      return { label: "Check out", nada: "checkout" };
    case "upcoming":
      return { label: "Upcoming", nada: "upcoming" };
    default:
      return { label: mentah, nada: "lain" };
  }
}

/** Berapa orang yang disebut booking ini, termasuk tamu utamanya. */
export function jumlahTamu(b: BookingLama): number | null {
  const daftar = b.guestNamesList;
  if (Array.isArray(daftar)) return daftar.length || null;
  if (typeof daftar === "string" && daftar.trim()) {
    return daftar.split(/[\n,;]+/).filter((s) => s.trim()).length || null;
  }
  const kap = Number(teksLadang(b.capacity));
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
 * Permintaan tamu, dengan nama persis seperti yang dipakai sistem lama.
 *
 * Kata-katanya disalin dari label di `td_dashboard_console_31.html`, bukan
 * diterjemahkan. Versi pertama layar ini menulis "Kursus SSI", "Excursion",
 * dan "Try dive" — tiga-tiganya karangan sendiri, dan itu persis yang bikin
 * dua sistem jadi dua kosakata. Staf yang membaca "SSI Dive Course" di satu
 * layar dan "Kursus SSI" di layar lain akan mengira itu dua hal.
 *
 * Aturannya sekarang: **penamaan ikut sistem lama.** Sistem lamanya yang jadi
 * sumber, layar ini jendelanya, dan jendela tidak mengganti nama benda.
 */
export const PERMINTAAN: { key: string; label: string }[] = [
  { key: "reqDiving", label: "Diving" },
  { key: "reqSnorkeling", label: "Snorkeling" },
  { key: "reqTryDive", label: "Try Dive" },
  { key: "reqSSICourse", label: "SSI Dive Course" },
  { key: "reqTransport", label: "Transport" },
  { key: "reqExcursion", label: "Excursion Trip" },
  { key: "reqExtraBed", label: "Extra bed" },
];

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

/**
 * Booking yang sudah dibatalkan tidak ikut dipantau.
 *
 * Catatan sesudah melihat data sungguhan: `displayStatus` dari `adminList`
 * cuma pernah bernilai arrival/upcoming/checkout, jadi pembatalan tampaknya
 * tidak ikut dikirim sama sekali — yang dibatalkan hilang dari daftarnya.
 * Pemeriksaan ini dibiarkan karena `status` bisa membawanya dan tidak ada
 * ruginya, tapi jangan berharap angkanya pernah di atas nol.
 */
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

// ------------------------------------------------------------- kalender lama

/**
 * Kalender kamar × malam, seluruhnya dari sistem lama.
 *
 * ## Kenapa kamarnya tidak dicocokkan ke kamar kami
 *
 * Versi pertama menolak menggambar booking sistem lama di kalender dashboard
 * ini, dan alasannya masih berlaku: sistem lama menulis `room: 3`, kamar di
 * database kami punya id dan nama sendiri, dan cocok-cocokan berdasarkan angka
 * akan benar sampai suatu hari ia menggambar tamu sungguhan di kamar yang
 * sedang ditempati orang lain.
 *
 * Yang berubah bukan risikonya, melainkan cara menghindarinya. Pemiliknya
 * menetapkan isi dan penamaan ikut sistem lama, jadi **daftar kamarnya juga
 * diambil dari sana**: kalau di sana ada Room 1 sampai 7, kalender ini berisi
 * Room 1 sampai 7. Tidak ada pemetaan, jadi tidak ada pemetaan yang bisa
 * salah.
 *
 * ## Kenapa tidak ada uang di sini
 *
 * Keberatan kedua dulu: okupansi dan pendapatan di dashboard ini dihitung dari
 * daftar booking yang sama, dan baris sistem lama tidak membawa harga — jadi
 * menyuntikkannya membuat okupansi naik sementara pendapatan tidak.
 *
 * Kalender ini tidak menghitung uang sama sekali, dan itu bukan kekurangan
 * yang ditoleransi melainkan batas yang disengaja. Ia menjawab satu
 * pertanyaan — kamar mana terisi siapa, malam apa — dan itu pertanyaan yang
 * datanya memang ada. Okupansi pun tidak dihitung di sini: jumlah kamar yang
 * "ada" cuma kamar yang kebetulan muncul di booking, bukan daftar kamar
 * sungguhan, jadi persentase apa pun akan mengarang penyebutnya.
 */
export interface SegmenKamar {
  booking: BookingLama;
  /** Tanggal pertama yang tergambar di bulan ini, YYYY-MM-DD. */
  mulai: string;
  /** Jumlah malam yang tergambar di bulan ini. */
  malam: number;
  /** Menginapnya mulai sebelum bulan ini. */
  terpotongKiri: boolean;
  /** Menginapnya berlanjut melewati bulan ini. */
  terpotongKanan: boolean;
}

export interface BarisKamar {
  /** Nama kamar persis seperti ditulis sistem lama, atau null untuk yang belum punya. */
  kamar: string | null;
  segmen: SegmenKamar[];
}

export interface KalenderLama {
  /** Tanggal tiap kolom, YYYY-MM-DD, dari 1 sampai akhir bulan. */
  hari: string[];
  baris: BarisKamar[];
  /** Booking yang tidak bisa digambar karena tanggalnya tidak terbaca. */
  tanpaTanggal: number;
}

/** Nomor kamar diurutkan sebagai angka kalau bisa, sisanya menyusul abjad. */
function urutKamar(a: string, b: string) {
  const na = Number(a);
  const nb = Number(b);
  const aAngka = Number.isFinite(na);
  const bAngka = Number.isFinite(nb);
  if (aAngka && bAngka) return na - nb;
  if (aAngka) return -1;
  if (bAngka) return 1;
  return a.localeCompare(b, "id");
}

export function kalenderLama(
  bookings: BookingLama[],
  tahun: number,
  bulan: number,
): KalenderLama {
  const jumlahHari = new Date(tahun, bulan + 1, 0).getDate();
  const hari: string[] = [];
  for (let d = 1; d <= jumlahHari; d++) {
    hari.push(iso(new Date(tahun, bulan, d)));
  }
  const awal = hari[0];
  const akhir = hari[hari.length - 1];

  const perKamar = new Map<string, SegmenKamar[]>();
  /* Kunci terpisah untuk yang tak berkamar: `null` tidak bisa jadi kunci Map
     yang dibedakan dari kamar bernama "null". */
  const TANPA = "\u0000tanpa-kamar";
  let tanpaTanggal = 0;

  for (const b of bookings) {
    if (dibatalkan(b)) continue;

    const masuk = tanggalLama(b.checkIn);
    if (!masuk) {
      tanpaTanggal++;
      continue;
    }
    /* Tanpa tanggal keluar, gambar satu malam saja. Menebak lamanya menginap
       akan memblokir kamar untuk malam yang belum tentu terjual. */
    const keluar = tanggalLama(b.checkOut);
    const malamTerakhir = keluar
      ? iso(new Date(parse(keluar).getTime() - 86400000))
      : masuk;

    /* Menginap yang keluar di hari yang sama atau lebih awal tidak memegang
       malam apa pun — jangan digambar sebagai satu malam yang tidak ada. */
    if (malamTerakhir < masuk) continue;
    if (malamTerakhir < awal || masuk > akhir) continue;

    const mulai = masuk < awal ? awal : masuk;
    const selesai = malamTerakhir > akhir ? akhir : malamTerakhir;
    const malam = dayDiff(mulai, selesai) + 1;
    if (malam <= 0) continue;

    const kunci = teksLadang(b.room) ?? TANPA;
    const daftar = perKamar.get(kunci) ?? [];
    daftar.push({
      booking: b,
      mulai,
      malam,
      terpotongKiri: masuk < awal,
      terpotongKanan: malamTerakhir > akhir,
    });
    perKamar.set(kunci, daftar);
  }

  const bernama = [...perKamar.keys()]
    .filter((k) => k !== TANPA)
    .sort(urutKamar);
  const baris: BarisKamar[] = bernama.map((k) => ({
    kamar: k,
    segmen: (perKamar.get(k) ?? []).sort((x, y) =>
      x.mulai.localeCompare(y.mulai),
    ),
  }));

  /* Baris "belum ada kamar" di bawah, dan cuma kalau memang ada isinya —
     baris kosong yang selalu muncul terbaca seperti kamar yang tidak pernah
     terjual. */
  const tanpa = perKamar.get(TANPA);
  if (tanpa && tanpa.length) {
    baris.push({
      kamar: null,
      segmen: tanpa.sort((x, y) => x.mulai.localeCompare(y.mulai)),
    });
  }

  return { hari, baris, tanpaTanggal };
}

/**
 * Daftar kamar sungguhan, dari `adminGetRoomSchedule`.
 *
 * Kenapa tidak diturunkan dari kamar yang muncul di `adminList` saja: kamar
 * yang bulan ini tidak terjual tidak muncul di booking mana pun, jadi daftar
 * yang diturunkan dari booking selalu kurang — dan kekurangannya jatuh tepat
 * di penyebut okupansi. Sepuluh kamar dengan enam terjual itu 60%; kalau
 * daftarnya cuma berisi enam kamar yang terjual, angkanya jadi 100%, naik
 * justru waktu sepi.
 *
 * Bentuknya dibaca dari kode render dashboard lama: `result.rooms` adalah
 * daftar `{ room, bookings: [...] }`.
 */
export function kamarDariJadwal(data: unknown): string[] {
  if (typeof data !== "object" || data === null) return [];
  const amplop = data as { status?: unknown; rooms?: unknown };
  if (amplop.status !== "ok" || !Array.isArray(amplop.rooms)) return [];

  const nama: string[] = [];
  for (const r of amplop.rooms) {
    if (typeof r !== "object" || r === null) continue;
    const k = teksLadang((r as { room?: unknown }).room);
    if (k && !nama.includes(k)) nama.push(k);
  }
  return nama;
}

// ------------------------------------------------------- jadwal dive centre

/**
 * Aktivitas yang dijalankan dive centre-nya, dengan nama persis dari sistem
 * lama.
 *
 * Daftarnya disalin dari `TRIP_DEST_LABEL_MAP` di `td_dashboard_console_31.html`
 * — kelimanya juga yang muncul sebagai penanda `req…` di tiap booking. Nilainya
 * dipakai apa adanya sebagai `activityPrefix` waktu memanggil sistem lama, jadi
 * salah satu huruf saja membuat jadwalnya kosong tanpa mengeluh.
 */
export const AKTIVITAS = [
  "Diving",
  "Snorkeling",
  "SSI Dive Course",
  "Excursion Trip",
  "Transport",
] as const;

export type Aktivitas = (typeof AKTIVITAS)[number];

/**
 * Satu sesi terjadwal, dari `adminGetUpcomingSessions`.
 *
 * Mode itu memulangkan tiga bulan ke depan untuk satu `activityPrefix`, dan
 * itu yang membuatnya cocok untuk kalender. Dua saudaranya tidak:
 * `adminGetDashboardTrips` cuma hari ini dan besok — dashboard lamanya sendiri
 * menulis "No trips organized for today or tomorrow yet" — dan
 * `adminGetActivityDay` satu hari untuk satu aktivitas, yang berarti 150
 * panggilan untuk sebulan berisi lima aktivitas.
 */
export interface SesiLama {
  tanggal: string;
  aktivitas: Aktivitas;
  /** Label sesinya seperti ditulis sistem lama, mis. "Diving — 2 dives". */
  label: string;
  pax: number | null;
  /** Kamar yang tamunya ikut, nama dari sistem lama. */
  kamar: string[];
}

export function sesiDariJawaban(
  data: unknown,
  aktivitas: Aktivitas,
): SesiLama[] {
  if (typeof data !== "object" || data === null) return [];
  const amplop = data as { status?: unknown; sessions?: unknown };
  if (amplop.status !== "ok" || !Array.isArray(amplop.sessions)) return [];

  const keluar: SesiLama[] = [];
  for (const s of amplop.sessions) {
    if (typeof s !== "object" || s === null) continue;
    const row = s as Record<string, unknown>;
    const tanggal = tanggalLama(row.date);
    /* Sesi tanpa tanggal yang terbaca tidak bisa ditaruh di hari mana pun, dan
       menebaknya berarti menyiapkan perahu di hari yang salah. */
    if (!tanggal) continue;

    const pax = Number(teksLadang(row.totalGuests));
    keluar.push({
      tanggal,
      aktivitas,
      label: teksLadang(row.sessionLabel) ?? aktivitas,
      pax: Number.isFinite(pax) && pax > 0 ? pax : null,
      kamar: Array.isArray(row.roomsWithGuests)
        ? row.roomsWithGuests
            .map((k) => teksLadang(k))
            .filter((k): k is string => Boolean(k))
        : [],
    });
  }
  return keluar;
}

/** Sesi per hari, siap ditempel ke sel kalender. */
export function sesiPerHari(sesi: SesiLama[]): Map<string, SesiLama[]> {
  const peta = new Map<string, SesiLama[]>();
  for (const s of sesi) {
    const daftar = peta.get(s.tanggal) ?? [];
    daftar.push(s);
    peta.set(s.tanggal, daftar);
  }
  for (const [, daftar] of peta) {
    daftar.sort(
      (a, b) => AKTIVITAS.indexOf(a.aktivitas) - AKTIVITAS.indexOf(b.aktivitas),
    );
  }
  return peta;
}
