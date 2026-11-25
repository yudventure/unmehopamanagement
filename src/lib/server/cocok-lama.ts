import "server-only";

import { bacaDaftarBooking, bacaSistemLama } from "@/lib/sistem-lama";
import { AKTIVITAS, dibatalkan, namaTamu, sesiDariJawaban, tanggalLama, teksLadang, type SesiLama } from "@/lib/sistem-lama-bentuk";
import { daftarSambungan, ambilKamar } from "./buku";
import { berlaku, semuaImpor, type PesananImpor } from "./impor-booking";

/**
 * Mencocokkan pesanan Booking.com yang diimpor (sambungan Turtle) dengan
 * daftar booking di sistem staf lama, dan menempelkan jadwal dive center dari
 * sistem lama ke tamu yang cocok.
 *
 * Cocok lewat nomor konfirmasi yang sama, atau, bila nomornya tidak ada di
 * sistem lama, lewat nama (satu kata nama yang sama, minimal tiga huruf) dan
 * check-in yang sama atau selisih sehari. Hanya membaca: tidak ada yang
 * ditulis ke sistem lama atau ke Booking.com.
 */
export type StatusCocok = "cocok" | "tanggal-beda" | "kamar-kurang" | "tidak-ada" | "batal-masih-ada";

export interface BarisCocok {
  nomor: string;
  tamu: string;
  checkIn: string;
  checkOut: string;
  kamar: number;
  batal: boolean;
  status: StatusCocok;
  cara: "nomor" | "nama" | null;
  kamarLama: string[];
  tanggalLama: string | null;
  selam: { tanggal: string; aktivitas: string; label: string; pax: number | null }[];
}

export interface HasilCocok {
  dibaca: string;
  baris: BarisCocok[];
  hanyaDiLama: { nomor: string; tamu: string; checkIn: string; checkOut: string; kamar: string }[];
  jadwal: SesiLama[];
  ringkas: Record<StatusCocok, number> & { hanyaDiLama: number; sesi: number };
}

const angka = (s: string) => s.replace(/\D/g, "");
const kataNama = (s: string) =>
  new Set(
    s
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .split(/[^a-z]+/)
      .filter((k) => k.length >= 3),
  );
const selisihHari = (a: string, b: string) => Math.abs(Date.parse(`${a}T00:00:00Z`) - Date.parse(`${b}T00:00:00Z`)) / 864e5;

export async function cocokkanDenganLama(hariIni: string): Promise<HasilCocok | { galat: string }> {
  const [impor, sambungan, kamar] = await Promise.all([semuaImpor(), daftarSambungan(), ambilKamar()]);
  const propKamar = new Map(kamar.map((r) => [r.id, r.prop]));
  const pesananBk = new Map<string, PesananImpor>();
  for (const sb of sambungan) {
    const prop = propKamar.get(sb.roomId) ?? (sb.roomId.startsWith("lama-") ? "turtle" : null);
    if (prop !== "turtle" && prop !== "divecenter") continue;
    for (const p of impor[sb.id]?.pesanan ?? []) pesananBk.set(p.nomor, p);
  }
  if (!pesananBk.size) return { galat: "Belum ada daftar pesanan Booking.com yang diimpor untuk Turtle. Impor dulu di Sinkronisasi kalender, sambungan Booking.com, Impor berkas." };

  const daftar = await bacaDaftarBooking();
  if (!daftar.ok) return { galat: `Sistem lama tidak terbaca: ${daftar.pesan ?? "tanpa keterangan"}` };

  type Lama = { nomor: string; angka: string; tamu: string; kata: Set<string>; checkIn: string; checkOut: string; kamar: string; dipakai: boolean };
  const lama: Lama[] = [];
  for (const b of daftar.data ?? []) {
    if (dibatalkan(b)) continue;
    const checkIn = tanggalLama(b.checkIn);
    if (!checkIn) continue;
    const nomor = teksLadang(b.confirmationNo) ?? "";
    const tamu = namaTamu(b);
    lama.push({ nomor, angka: angka(nomor), tamu, kata: kataNama(tamu), checkIn, checkOut: tanggalLama(b.checkOut) ?? checkIn, kamar: teksLadang(b.room) ?? "", dipakai: false });
  }

  const jadwal = (await Promise.all(AKTIVITAS.map(async (a) => {
    const h = await bacaSistemLama("adminGetUpcomingSessions", { activityPrefix: a });
    return h.ok ? sesiDariJawaban(h.data, a) : [];
  }))).flat().sort((p, q) => p.tanggal.localeCompare(q.tanggal) || p.aktivitas.localeCompare(q.aktivitas));

  const baris: BarisCocok[] = [];
  const relevan = [...pesananBk.values()].filter((p) => p.checkOut > hariIni).sort((a, b) => a.checkIn.localeCompare(b.checkIn));
  for (const p of relevan) {
    const batal = !berlaku(p);
    const a = angka(p.nomor);
    let cara: BarisCocok["cara"] = null;
    let cocok = a.length >= 6 ? lama.filter((l) => l.angka === a) : [];
    if (cocok.length) cara = "nomor";
    else {
      const kata = kataNama(p.tamu);
      cocok = lama.filter((l) => !l.dipakai && l.angka !== a && [...kata].some((k) => l.kata.has(k)) && selisihHari(l.checkIn, p.checkIn) <= 1);
      if (cocok.length) cara = "nama";
    }
    for (const l of cocok) l.dipakai = true;
    const kamarLama = [...new Set(cocok.map((l) => l.kamar).filter(Boolean))];
    const tglLama = cocok[0] ? `${cocok[0].checkIn}|${cocok[0].checkOut}` : null;
    let status: StatusCocok;
    if (batal) status = cocok.length ? "batal-masih-ada" : "cocok";
    else if (!cocok.length) status = "tidak-ada";
    else if (cocok.some((l) => l.checkIn !== p.checkIn || l.checkOut !== p.checkOut)) status = "tanggal-beda";
    else if (kamarLama.length < p.kamar && cocok.length < p.kamar) status = "kamar-kurang";
    else status = "cocok";
    /* Pesanan batal yang memang tidak ada di sistem lama tidak perlu ditampilkan. */
    if (batal && !cocok.length) continue;
    const selam = jadwal
      .filter((s) => s.tanggal >= p.checkIn && s.tanggal <= p.checkOut && s.kamar.some((k) => kamarLama.includes(k)))
      .map((s) => ({ tanggal: s.tanggal, aktivitas: s.aktivitas, label: s.label, pax: s.pax }));
    baris.push({ nomor: p.nomor, tamu: p.tamu, checkIn: p.checkIn, checkOut: p.checkOut, kamar: p.kamar, batal, status, cara, kamarLama, tanggalLama: tglLama, selam });
  }

  const hanyaDiLama = lama
    .filter((l) => !l.dipakai && l.checkOut > hariIni)
    .map((l) => ({ nomor: l.nomor, tamu: l.tamu, checkIn: l.checkIn, checkOut: l.checkOut, kamar: l.kamar }))
    .sort((a, b) => a.checkIn.localeCompare(b.checkIn));

  const ringkas = { cocok: 0, "tanggal-beda": 0, "kamar-kurang": 0, "tidak-ada": 0, "batal-masih-ada": 0, hanyaDiLama: hanyaDiLama.length, sesi: jadwal.length };
  for (const b of baris) ringkas[b.status]++;
  return { dibaca: new Date().toISOString(), baris, hanyaDiLama, jadwal, ringkas };
}
