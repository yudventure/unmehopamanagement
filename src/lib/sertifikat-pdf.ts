import { MONTHS } from "./format";

/**
 * Sertifikat magang sebagai PDF, dibuat di peramban dengan jsPDF (dimuat saat
 * dibutuhkan, seperti ekspor laporan). A4 mendatar: bingkai berlapis dengan
 * ornamen sudut emas, gelombang laut tipis di kaki, logo unit, segel medali,
 * dan tanda tangan serta stempel bila sudah diunggah.
 *
 * Semua isinya dari catatan sertifikat yang diisi orangnya: nama, posisi,
 * periode, penandatangan, dan gambar tanda tangan serta stempel yang diunggah
 * pemiliknya. Tidak ada tanda tangan atau stempel yang dibuat-buat di sini:
 * tanpa gambar, tempatnya dibiarkan kosong untuk ditandatangani basah.
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
  /** Gambar tanda tangan (data URL PNG, latar transparan), bila ada. */
  ttd?: string;
  /** Gambar stempel (data URL PNG, latar transparan), bila ada. */
  stempel?: string;
}

const BULAN_EN = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const EMAS: [number, number, number] = [176, 137, 64];

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

/** Gambar apa pun (PNG, JPG, WebP) menjadi PNG lewat kanvas, dengan ukurannya. */
async function kePng(src: string): Promise<{ data: string; w: number; h: number } | null> {
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

/**
 * Menyiapkan gambar tanda tangan atau stempel yang diunggah: latar putih atau
 * hampir putih dijadikan transparan (hasil pindaian dan foto kertas), lalu
 * diperkecil ke paling lebar `maks` piksel. Kembali berupa data URL PNG.
 */
export async function siapkanGambarTtd(berkas: File, maks = 900, hapusLatar = true): Promise<string> {
  const url = URL.createObjectURL(berkas);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    const skala = Math.min(1, maks / Math.max(img.naturalWidth, img.naturalHeight));
    const c = document.createElement("canvas");
    c.width = Math.max(1, Math.round(img.naturalWidth * skala));
    c.height = Math.max(1, Math.round(img.naturalHeight * skala));
    const ctx = c.getContext("2d")!;
    ctx.drawImage(img, 0, 0, c.width, c.height);
    if (hapusLatar) {
      const d = ctx.getImageData(0, 0, c.width, c.height);
      const p = d.data;
      for (let i = 0; i < p.length; i += 4) {
        const terang = Math.min(p[i], p[i + 1], p[i + 2]);
        /* Lembut di pinggir garis: makin terang makin tembus. */
        if (terang > 235) p[i + 3] = 0;
        else if (terang > 190) p[i + 3] = Math.round(p[i + 3] * ((235 - terang) / 45));
      }
      ctx.putImageData(d, 0, 0);
    }
    return c.toDataURL("image/png");
  } finally {
    URL.revokeObjectURL(url);
  }
}

export async function buatSertifikatPdf(d: DataSertifikat): Promise<Blob> {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "pt", format: "a4", orientation: "landscape" });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const utama = d.warna ?? [43, 84, 67];
  const a = (t: string) => amankanTeks(t).teks;
  const id = d.bahasa !== "English";
  const en = d.bahasa !== "Indonesia";
  const tembus = (n: number) => doc.setGState(new (doc as unknown as { GState: new (o: { opacity: number }) => unknown }).GState({ opacity: n }) as never);

  /* ---------------------------------------------------------- latar */
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, W, H, "F");

  /* Gelombang laut tipis di kaki, di dalam bingkai. */
  const gelombang = (dasar: number, tinggi: number, fase: number, rgb: [number, number, number], o: number) => {
    tembus(o);
    doc.setFillColor(...rgb);
    const kiri = 34;
    const kanan = W - 34;
    const lebar = (kanan - kiri) / 6;
    const seg: number[][] = [];
    for (let i = 0; i < 6; i++) {
      const naik = (i + fase) % 2 === 0 ? -tinggi : tinggi;
      seg.push([lebar / 3, naik, (lebar * 2) / 3, naik, lebar, 0]);
    }
    seg.push([0, H - 34 - dasar], [-(kanan - kiri), 0], [0, -(H - 34 - dasar)]);
    doc.lines(seg, kiri, dasar, [1, 1], "F", true);
    tembus(1);
  };
  gelombang(H - 74, 7, 0, utama, 0.07);
  gelombang(H - 62, 6, 1, [44, 140, 160], 0.08);

  /* --------------------------------------------------------- bingkai */
  doc.setDrawColor(...utama);
  doc.setLineWidth(5);
  doc.rect(18, 18, W - 36, H - 36);
  doc.setDrawColor(...EMAS);
  doc.setLineWidth(1.2);
  doc.rect(30, 30, W - 60, H - 60);
  doc.setLineWidth(0.5);
  doc.rect(34, 34, W - 68, H - 68);

  /* Ornamen sudut: dua garis siku emas dan satu belah ketupat. */
  const sudut = (x: number, y: number, sx: number, sy: number) => {
    doc.setDrawColor(...EMAS);
    doc.setLineWidth(1.4);
    doc.line(x, y, x + sx * 46, y);
    doc.line(x, y, x, y + sy * 46);
    doc.setLineWidth(0.6);
    doc.line(x + sx * 8, y + sy * 8, x + sx * 34, y + sy * 8);
    doc.line(x + sx * 8, y + sy * 8, x + sx * 8, y + sy * 34);
    doc.setFillColor(...EMAS);
    const cx = x + sx * 15;
    const cy = y + sy * 15;
    doc.lines([[4, 4], [-4, 4], [-4, -4], [4, -4]], cx, cy - 4, [1, 1], "F", true);
  };
  sudut(42, 42, 1, 1);
  sudut(W - 42, 42, -1, 1);
  sudut(42, H - 42, 1, -1);
  sudut(W - 42, H - 42, -1, -1);

  const tengah = (teks: string, yy: number, ukuran: number, gaya: "normal" | "bold" | "italic" | "bolditalic" = "normal", huruf = "helvetica", warna: [number, number, number] = [45, 45, 45], jarak = 0) => {
    doc.setFont(huruf, gaya);
    doc.setFontSize(ukuran);
    doc.setTextColor(...warna);
    doc.setCharSpace(jarak);
    const t = a(teks);
    /* Dengan jarak huruf, lebar teks bertambah: geser supaya tetap di tengah. */
    const lebar = doc.getTextWidth(t) + jarak * Math.max(0, t.length - 1);
    doc.text(t, W / 2 - lebar / 2, yy);
    doc.setCharSpace(0);
  };

  /* ------------------------------------------------------------ kepala */
  let y = 52;
  if (d.logo) {
    const l = await kePng(d.logo);
    if (l) {
      const t = 66;
      const w = (l.w / l.h) * t;
      doc.addImage(l.data, "PNG", (W - w) / 2, y, w, t);
      y += t;
    }
  }
  y += 36;
  tengah("SERTIFIKAT", y, 36, "bold", "helvetica", utama, 7);
  y += 22;
  tengah(id && en ? "MAGANG  ·  CERTIFICATE OF INTERNSHIP" : id ? "PROGRAM MAGANG" : "CERTIFICATE OF INTERNSHIP", y, 11, "bold", "helvetica", EMAS, 2.5);

  /* Pembatas emas dengan belah ketupat di tengah. */
  y += 14;
  doc.setDrawColor(...EMAS);
  doc.setLineWidth(0.8);
  doc.line(W / 2 - 120, y, W / 2 - 10, y);
  doc.line(W / 2 + 10, y, W / 2 + 120, y);
  doc.setFillColor(...EMAS);
  doc.lines([[5, 5], [-5, 5], [-5, -5], [5, -5]], W / 2, y - 5, [1, 1], "F", true);
  y += 16;
  tengah(`No. ${d.nomor}`, y, 9, "normal", "helvetica", [125, 125, 125], 0.5);

  /* -------------------------------------------------------------- isi */
  y += 26;
  tengah(id && en ? "Dengan bangga diberikan kepada  /  Proudly presented to" : id ? "Dengan bangga diberikan kepada" : "Proudly presented to", y, 11.5, "italic", "helvetica", [90, 90, 90]);
  y += 42;
  tengah(d.nama, y, 36, "bolditalic", "times", [28, 32, 30]);
  doc.setDrawColor(...EMAS);
  doc.setLineWidth(1);
  doc.line(W / 2 - 170, y + 11, W / 2 + 170, y + 11);

  const kalimatId = `atas keberhasilannya menyelesaikan program magang sebagai ${d.posisi} di ${d.penerbit} pada ${tglId(d.mulai)} sampai ${tglId(d.selesai)}${d.catatan ? `, ${d.catatan}` : ""}.`;
  const kalimatEn = `for successfully completing an internship as ${d.posisi} at ${d.penerbit} from ${tglEn(d.mulai)} to ${tglEn(d.selesai)}${d.catatan && !id ? `, ${d.catatan}` : ""}.`;
  y += 36;
  const tulis = (teks: string, ukuran: number, gaya: "normal" | "italic", warna: [number, number, number]) => {
    doc.setFont("helvetica", gaya);
    doc.setFontSize(ukuran);
    doc.setTextColor(...warna);
    const baris = doc.splitTextToSize(a(teks), W - 250);
    doc.text(baris, W / 2, y, { align: "center" });
    y += baris.length * ukuran * 1.4;
  };
  if (id) tulis(kalimatId, 12.5, "normal", [55, 55, 55]);
  if (en) tulis(kalimatEn, id ? 10.5 : 12.5, id ? "italic" : "normal", id ? [105, 105, 105] : [55, 55, 55]);

  /* ------------------------------------------------- segel medali (kiri) */
  const sx = 150;
  const sy = H - 132;
  doc.setFillColor(...EMAS);
  /* Dua pita di bawah segel. */
  doc.lines([[10, 0], [8, 46], [-9, -9], [-9, 9]], sx - 22, sy + 22, [1, 1], "F", true);
  doc.lines([[10, 0], [8, 46], [-9, -9], [-9, 9]], sx + 4, sy + 22, [1, 1], "F", true);
  doc.circle(sx, sy, 38, "F");
  doc.setFillColor(...utama);
  doc.circle(sx, sy, 32, "F");
  doc.setDrawColor(...EMAS);
  doc.setLineWidth(0.8);
  doc.circle(sx, sy, 28, "S");
  /* Gerigi kecil di tepi segel. */
  doc.setFillColor(...EMAS);
  for (let i = 0; i < 24; i++) {
    const s = (i / 24) * Math.PI * 2;
    doc.circle(sx + Math.cos(s) * 38, sy + Math.sin(s) * 38, 2.6, "F");
  }
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(id ? 9 : 8);
  doc.text(id ? "MAGANG" : "INTERN", sx, sy - 2, { align: "center" });
  doc.setFontSize(12);
  doc.text(d.selesai.slice(0, 4), sx, sy + 12, { align: "center" });

  /* ---------------------------------------- tanda tangan dan stempel (kanan) */
  const xT = W - 220;
  const garis = H - 96;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10.5);
  doc.setTextColor(60, 60, 60);
  doc.text(a(`${d.kota}, ${id ? tglId(d.terbit) : tglEn(d.terbit)}`), xT, H - 170, { align: "center" });

  if (d.stempel) {
    const st = await kePng(d.stempel);
    if (st) {
      const t = 92;
      const w = (st.w / st.h) * t;
      tembus(0.85);
      doc.addImage(st.data, "PNG", xT - 112, garis - t + 18, w, t);
      tembus(1);
    }
  }
  if (d.ttd) {
    const tt = await kePng(d.ttd);
    if (tt) {
      const t = 58;
      const w = Math.min((tt.w / tt.h) * t, 190);
      const t2 = (w / ((tt.w / tt.h) * t)) * t;
      doc.addImage(tt.data, "PNG", xT - w / 2, garis - t2 + 6, w, t2);
    }
  }
  doc.setDrawColor(70, 70, 70);
  doc.setLineWidth(0.6);
  doc.line(xT - 105, garis, xT + 105, garis);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(35, 35, 35);
  doc.text(a(d.penandatangan), xT, garis + 15, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(95, 95, 95);
  doc.text(a(d.jabatanTtd), xT, garis + 28, { align: "center" });

  /* ------------------------------------------------------------- kaki */
  tengah(`${d.penerbit}  ·  ${d.alamat}`, H - 46, 8.5, "normal", "helvetica", [120, 120, 120], 0.3);

  return doc.output("blob");
}

/** Nama berkas yang aman: "Sertifikat-Magang-Nama-Orang.pdf". */
export const namaBerkasSertifikat = (nama: string) =>
  `Sertifikat-Magang-${amankanTeks(nama).teks.normalize("NFD").replace(/[^\w\s-]/g, "").trim().replace(/\s+/g, "-") || "pegawai"}.pdf`;
