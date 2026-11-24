import { MONTHS } from "./format";

/**
 * Sertifikat magang sebagai PDF, dibuat di peramban dengan jsPDF (dimuat saat
 * dibutuhkan, seperti ekspor laporan). A4 mendatar, logo unit di atas, bingkai
 * dua garis, dan tanda tangan di kanan bawah.
 *
 * Semua isinya dari catatan sertifikat yang diisi orangnya: nama, posisi,
 * periode, penandatangan. Tidak ada yang dikarang di sini selain susunan
 * kalimatnya.
 */
export interface DataSertifikat {
  nomor: string;
  nama: string;
  posisi: string;
  mulai: string;
  selesai: string;
  terbit: string;
  kota: string;
  penandatangan: string;
  jabatanTtd: string;
  bahasa: "Indonesia" | "English" | "Indonesia dan English";
  catatan?: string;
  /** Nama usaha yang menerbitkan, misalnya "Turtle Dive Homestay". */
  penerbit: string;
  /** Alamat singkat di kaki sertifikat. */
  alamat: string;
  /** Jalur logo di folder public, atau kosong. */
  logo?: string;
  /** Warna utama [r, g, b]. */
  warna?: [number, number, number];
}

const BULAN_EN = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

const tglId = (t: string) => {
  const [y, m, d] = t.split("-").map(Number);
  return `${d} ${MONTHS[m - 1]} ${y}`;
};
const tglEn = (t: string) => {
  const [y, m, d] = t.split("-").map(Number);
  return `${d} ${BULAN_EN[m - 1]} ${y}`;
};

/**
 * Huruf bawaan PDF hanya memuat Latin-1. Huruf di luarnya (misalnya ń, ł, ş)
 * diturunkan ke huruf dasarnya supaya tidak tercetak sebagai tanda aneh.
 * `diubah` memberi tahu layar bahwa ada huruf yang disederhanakan.
 */
export function amankanTeks(t: string): { teks: string; diubah: boolean } {
  let diubah = false;
  const teks = [...t]
    .map((c) => {
      if (c.charCodeAt(0) <= 255) return c;
      diubah = true;
      const dasar = c.normalize("NFD").replace(/[̀-ͯ]/g, "");
      return [...dasar].every((x) => x.charCodeAt(0) <= 255) ? dasar : "?";
    })
    .join("");
  return { teks, diubah };
}

async function logoPng(src: string): Promise<{ data: string; w: number; h: number } | null> {
  try {
    const img = new Image();
    img.src = src;
    await img.decode();
    const c = document.createElement("canvas");
    c.width = img.naturalWidth;
    c.height = img.naturalHeight;
    c.getContext("2d")!.drawImage(img, 0, 0);
    return { data: c.toDataURL("image/png"), w: img.naturalWidth, h: img.naturalHeight };
  } catch {
    return null;
  }
}

export async function buatSertifikatPdf(d: DataSertifikat): Promise<Blob> {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "pt", format: "a4", orientation: "landscape" });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const [r, g, b] = d.warna ?? [43, 84, 67];
  const a = (t: string) => amankanTeks(t).teks;
  const id = d.bahasa !== "English";
  const en = d.bahasa !== "Indonesia";

  /* Bingkai: garis tebal berwarna dan garis tipis di dalamnya. */
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, W, H, "F");
  doc.setDrawColor(r, g, b);
  doc.setLineWidth(6);
  doc.rect(22, 22, W - 44, H - 44);
  doc.setLineWidth(0.8);
  doc.rect(36, 36, W - 72, H - 72);

  let y = 62;
  if (d.logo) {
    const l = await logoPng(d.logo);
    if (l) {
      const t = 78;
      const w = (l.w / l.h) * t;
      doc.addImage(l.data, "PNG", (W - w) / 2, y, w, t);
      y += t + 18;
    }
  }

  const tengah = (teks: string, yy: number, ukuran: number, gaya: "normal" | "bold" | "italic" | "bolditalic" = "normal", huruf = "helvetica", warna: [number, number, number] = [40, 40, 40]) => {
    doc.setFont(huruf, gaya);
    doc.setFontSize(ukuran);
    doc.setTextColor(...warna);
    doc.text(a(teks), W / 2, yy, { align: "center" });
  };

  y += 14;
  tengah(id ? "SERTIFIKAT MAGANG" : "CERTIFICATE OF INTERNSHIP", y, 30, "bold", "helvetica", [r, g, b]);
  if (id && en) {
    y += 20;
    tengah("Certificate of Internship", y, 13, "italic", "helvetica", [110, 110, 110]);
  }
  y += 18;
  tengah(`No. ${d.nomor}`, y, 10, "normal", "helvetica", [110, 110, 110]);

  y += 34;
  tengah(id && en ? "Diberikan kepada / This is to certify that" : id ? "Diberikan kepada" : "This is to certify that", y, 12, "normal");
  y += 40;
  tengah(d.nama, y, 32, "bolditalic", "times", [25, 25, 25]);
  doc.setDrawColor(r, g, b);
  doc.setLineWidth(0.8);
  doc.line(W / 2 - 190, y + 10, W / 2 + 190, y + 10);

  const kalimatId = `telah menyelesaikan program magang sebagai ${d.posisi} di ${d.penerbit} pada ${tglId(d.mulai)} sampai ${tglId(d.selesai)}${d.catatan ? `, ${d.catatan}` : ""}.`;
  const kalimatEn = `has successfully completed an internship as ${d.posisi} at ${d.penerbit} from ${tglEn(d.mulai)} to ${tglEn(d.selesai)}${d.catatan && !id ? `, ${d.catatan}` : ""}.`;
  y += 38;
  doc.setFont("helvetica", "normal");
  doc.setTextColor(50, 50, 50);
  const tulis = (teks: string, ukuran: number, gaya: "normal" | "italic") => {
    doc.setFont("helvetica", gaya);
    doc.setFontSize(ukuran);
    const baris = doc.splitTextToSize(a(teks), W - 220);
    doc.text(baris, W / 2, y, { align: "center" });
    y += baris.length * ukuran * 1.35;
  };
  if (id) tulis(kalimatId, 13, "normal");
  if (en) {
    if (id) y += 2;
    tulis(kalimatEn, id ? 11 : 13, id ? "italic" : "normal");
  }

  /* Tempat, tanggal, dan tanda tangan di kanan bawah. */
  const xT = W - 230;
  const yT = H - 150;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(50, 50, 50);
  doc.text(a(`${d.kota}, ${id ? tglId(d.terbit) : tglEn(d.terbit)}`), xT, yT, { align: "center" });
  doc.setDrawColor(80, 80, 80);
  doc.setLineWidth(0.6);
  doc.line(xT - 100, yT + 58, xT + 100, yT + 58);
  doc.setFont("helvetica", "bold");
  doc.text(a(d.penandatangan), xT, yT + 74, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(a(`${d.jabatanTtd}, ${d.penerbit}`), xT, yT + 88, { align: "center" });

  /* Kaki: penerbit dan alamat di kiri bawah. */
  doc.setFontSize(9);
  doc.setTextColor(120, 120, 120);
  doc.text(a(d.penerbit), 60, H - 66);
  doc.text(a(d.alamat), 60, H - 54);

  return doc.output("blob");
}

/** Nama berkas yang aman: "Sertifikat-Magang-Nama-Orang.pdf". */
export const namaBerkasSertifikat = (nama: string) =>
  `Sertifikat-Magang-${amankanTeks(nama).teks.normalize("NFD").replace(/[^\w\s-]/g, "").trim().replace(/\s+/g, "-") || "pegawai"}.pdf`;
