/**
 * Membaca pesan booking yang ditempel, misalnya dari WhatsApp, menjadi baris
 * pesanan yang MASIH HARUS DIPERIKSA orangnya.
 *
 * Ini pembaca berbasis pola, bukan pembaca format tertentu: bentuk pesan
 * Stay Raja Ampat belum diketahui, jadi tidak ada yang ditebak dari satu
 * format. Yang dicari hanya hal yang bisa dikenali dari bentuknya: tanggal
 * (beberapa penulisan), kata tanda (check-in, nama, jumlah tamu), dan nama
 * kamar yang sudah ada. Yang tidak ketemu dibiarkan kosong dan ditandai,
 * tidak diisi tebakan.
 *
 * Hasilnya tidak pernah disimpan langsung. Selalu lewat layar pemeriksaan.
 */

export interface BarisPesan {
  guest: string;
  /** `YYYY-MM-DD`, atau kosong bila tidak ditemukan. */
  checkIn: string;
  checkOut: string;
  pax: number | null;
  /** Id kamar bila namanya ketemu persis, atau kosong. */
  room: string;
  catatan: string;
  /** Total rupiah bila disebut jelas; kosong berarti tidak diketahui. */
  total: number | null;
}

const BULAN: Record<string, number> = {
  jan: 1, januari: 1, january: 1, feb: 2, februari: 2, february: 2, mar: 3, maret: 3, march: 3,
  apr: 4, april: 4, mei: 5, may: 5, jun: 6, juni: 6, june: 6, jul: 7, juli: 7, july: 7,
  agu: 8, agt: 8, ags: 8, agustus: 8, aug: 8, august: 8, sep: 9, sept: 9, september: 9,
  okt: 10, oktober: 10, oct: 10, october: 10, nov: 11, november: 11, des: 12, desember: 12, dec: 12, december: 12,
};
const NAMA_BULAN = Object.keys(BULAN).sort((a, b) => b.length - a.length).join("|");

const dua = (n: number) => String(n).padStart(2, "0");
const iso = (y: number, m: number, d: number) => `${y}-${dua(m)}-${dua(d)}`;

function sah(y: number, m: number, d: number) {
  const t = new Date(Date.UTC(y, m - 1, d));
  return t.getUTCFullYear() === y && t.getUTCMonth() === m - 1 && t.getUTCDate() === d;
}

const tambahHari = (s: string, n: number) =>
  new Date(Date.parse(`${s}T00:00:00Z`) + n * 864e5).toISOString().slice(0, 10);

/**
 * Tahun untuk tanggal yang ditulis tanpa tahun: tahun ini, kecuali tanggal itu
 * sudah lewat lebih dari dua bulan, yang berarti yang dimaksud tahun depan.
 */
function tahunUntuk(m: number, d: number, hariIni: string) {
  const y = Number(hariIni.slice(0, 4));
  const kandidat = iso(y, m, d);
  return tambahHari(kandidat, 60) < hariIni ? y + 1 : y;
}

interface Tgl {
  t: string;
  awal: number;
  akhir: number;
}

/** Semua tanggal tunggal dalam teks, berikut posisinya. */
function tanggalDalam(teks: string, hariIni: string): Tgl[] {
  const hasil: Tgl[] = [];
  const pakai = (t: string, awal: number, akhir: number) => {
    if (hasil.some((h) => awal < h.akhir && akhir > h.awal)) return;
    hasil.push({ t, awal, akhir });
  };
  let m: RegExpExecArray | null;
  const iso8 = /\b(20\d{2})-(\d{1,2})-(\d{1,2})\b/g;
  while ((m = iso8.exec(teks))) if (sah(+m[1], +m[2], +m[3])) pakai(iso(+m[1], +m[2], +m[3]), m.index, m.index + m[0].length);
  const bagi = /\b(\d{1,2})[/.\-](\d{1,2})[/.\-](\d{2}|\d{4})\b/g;
  while ((m = bagi.exec(teks))) {
    const y = m[3].length === 2 ? 2000 + +m[3] : +m[3];
    if (sah(y, +m[2], +m[1])) pakai(iso(y, +m[2], +m[1]), m.index, m.index + m[0].length);
  }
  const nama = new RegExp(`\\b(\\d{1,2})(?:st|nd|rd|th)?\\s*(${NAMA_BULAN})\\.?(?:\\s*,?\\s*(20\\d{2}))?`, "gi");
  while ((m = nama.exec(teks))) {
    const bln = BULAN[m[2].toLowerCase()];
    const y = m[3] ? +m[3] : tahunUntuk(bln, +m[1], hariIni);
    if (sah(y, bln, +m[1])) pakai(iso(y, bln, +m[1]), m.index, m.index + m[0].length);
  }
  return hasil.sort((a, b) => a.awal - b.awal);
}

/**
 * Rentang "12-15 Nov", "12 s/d 15 November 2026", "12 – 15/11": dua angka hari
 * yang berbagi satu bulan, yang tidak tertangkap sebagai dua tanggal utuh.
 */
function rentangDalam(teks: string, hariIni: string): { masuk: string; keluar: string; awal: number } | null {
  const re = new RegExp(
    `\\b(\\d{1,2})\\s*(?:-|–|—|s/d|sd|sampai|hingga|to|until)\\s*(\\d{1,2})\\s*(${NAMA_BULAN})\\.?(?:\\s*,?\\s*(20\\d{2}))?`,
    "i",
  );
  const m = re.exec(teks);
  if (!m) return null;
  const bln = BULAN[m[3].toLowerCase()];
  const y = m[4] ? +m[4] : tahunUntuk(bln, +m[1], hariIni);
  const d1 = +m[1], d2 = +m[2];
  if (!sah(y, bln, d1)) return null;
  const masuk = iso(y, bln, d1);
  /* Keluar di bulan berikutnya bila harinya lebih kecil ("28-2 Des" tidak
     ditangkap pola ini; "28-2" dengan satu bulan berarti salah tulis). */
  if (d2 <= d1 || !sah(y, bln, d2)) return null;
  return { masuk, keluar: iso(y, bln, d2), awal: m.index };
}

function cocokKamar(teks: string, kamar: { id: string; name: string }[]): string {
  const t = teks.toLowerCase();
  for (const k of kamar) if (t.includes(k.name.toLowerCase())) return k.id;
  return "";
}

/** Memecah teks menjadi blok per pesanan: dipisah baris kosong, atau butir bernomor. */
function bagiBlok(teks: string): string[] {
  const rapi = teks.replace(/\r/g, "").trim();
  if (!rapi) return [];
  let bagian = rapi.split(/\n\s*\n+/);
  if (bagian.length === 1 && /^\s*\d+[.)]\s+/m.test(rapi)) {
    bagian = rapi.split(/\n(?=\s*\d+[.)]\s+)/);
  }
  return bagian.map((b) => b.trim()).filter(Boolean);
}

function baca(blok: string, kamar: { id: string; name: string }[], hariIni: string): BarisPesan | null {
  const rentang = rentangDalam(blok, hariIni);
  const tunggal = tanggalDalam(blok, hariIni);
  let checkIn = "";
  let checkOut = "";

  /* Kata tanda lebih dipercaya daripada urutan: "check out 19/11 check in 12/11". */
  const dekat = (kata: RegExp) => {
    const m = kata.exec(blok);
    if (!m) return "";
    const sesudah = tunggal.filter((t) => t.awal >= m.index).sort((a, b) => a.awal - b.awal)[0];
    return sesudah && sesudah.awal - m.index < 40 ? sesudah.t : "";
  };
  checkIn = dekat(/check[\s-]*in|ci\b|masuk|datang|arrival|tiba/i);
  checkOut = dekat(/check[\s-]*out|co\b|keluar|pulang|departure/i);

  if (!checkIn && !checkOut) {
    if (rentang) {
      checkIn = rentang.masuk;
      checkOut = rentang.keluar;
    } else if (tunggal.length >= 2) {
      [checkIn, checkOut] = [tunggal[0].t, tunggal[1].t];
    } else if (tunggal.length === 1) {
      checkIn = tunggal[0].t;
      const malam = /(\d+)\s*(?:malam|nights?|night)/i.exec(blok);
      if (malam && +malam[1] > 0 && +malam[1] < 60) checkOut = tambahHari(checkIn, +malam[1]);
    }
  } else if (checkIn && !checkOut) {
    const malam = /(\d+)\s*(?:malam|nights?|night)/i.exec(blok);
    if (malam && +malam[1] > 0 && +malam[1] < 60) checkOut = tambahHari(checkIn, +malam[1]);
  }
  if (!checkIn && !checkOut && !tunggal.length && !rentang) return null;

  /* "atas nama" dan "a/n" boleh tanpa tanda baca ("a/n Ani"); kata umum seperti
     "nama" atau "tamu" harus diikuti titik dua, sama dengan, atau garis. */
  const namaM =
    /(?:atas\s*nama|a\/n|a\.n\.?)\s*[:=-]?\s*([^\n,;]{2,60})/i.exec(blok) ??
    /(?:nama(?:\s*tamu)?|guest(?:\s*name)?|tamu|name)\s*[:=-]\s*([^\n,;]{2,60})/i.exec(blok);
  const guest = namaM ? namaM[1].replace(/\s+\d.*$/, "").trim() : "";

  const paxM = /(\d{1,2})\s*(?:orang|org|tamu|pax|guests?|persons?|people|dewasa|adults?)/i.exec(blok);
  const pax = paxM && +paxM[1] > 0 && +paxM[1] < 40 ? +paxM[1] : null;

  const totM = /(?:total|harga|tarif)\D{0,12}(?:rp\.?\s*)?([\d.]{5,})/i.exec(blok);
  const total = totM ? Number(totM[1].replace(/\./g, "")) || null : null;

  return {
    guest,
    checkIn,
    checkOut: checkOut && checkOut > checkIn ? checkOut : "",
    pax,
    room: cocokKamar(blok, kamar),
    catatan: blok.length > 300 ? `${blok.slice(0, 297)}…` : blok,
    total,
  };
}

/**
 * Teks yang ditempel jadi baris pesanan. `kamar` untuk mencocokkan nama kamar,
 * `hariIni` untuk menentukan tahun tanggal tanpa tahun.
 */
export function bacaPesan(
  teks: string,
  kamar: { id: string; name: string }[],
  hariIni: string,
): BarisPesan[] {
  return bagiBlok(teks)
    .map((b) => baca(b, kamar, hariIni))
    .filter((b): b is BarisPesan => b !== null);
}
