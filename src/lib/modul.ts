import type { PropertyKey } from "@/lib/types";

/**
 * Tiga modul operasional per unit: keuangan dan aset, SDM (pegawai, absensi,
 * gaji, asuransi, inventaris), dan stok gudang.
 *
 * Satu skema untuk klien dan server: daftar koleksi dan bidangnya ada di sini,
 * dipakai tabel dan formulir di layar, dan dipakai server untuk memeriksa apa
 * yang disimpan. Perhitungannya (penyusutan, biaya gaji, stok) juga di sini,
 * fungsi murni, supaya layar dan uji membaca angka yang sama.
 *
 * Tidak ada data awal. Nama aset, gaji, harga barang, dan jumlah stok adalah
 * fakta milik pengelola, bukan isian yang kedengarannya masuk akal: tabelnya
 * kosong sampai diisi. Yang ada hanya angka acuan aturan (iuran BPJS, UMP),
 * dengan sumbernya, dan semuanya bisa diubah.
 */
export type Modul = "keuangan" | "sdm" | "gudang";

export type TipeBidang = "teks" | "angka" | "tanggal" | "pilih" | "catatan" | "rujuk";

export interface Bidang {
  k: string;
  label: string;
  tipe: TipeBidang;
  opsi?: string[];
  wajib?: boolean;
  /** Awalan atau akhiran di samping angka: "Rp", "tahun", "%". */
  satuan?: string;
  /** Boleh negatif (hanya koreksi stok). */
  negatif?: boolean;
  /** Untuk `rujuk`: koleksi yang dirujuk, dalam modul yang sama. */
  ke?: string;
  ket?: string;
  /** Nilai awal formulir. */
  awal?: string | number;
}

export interface Koleksi {
  id: string;
  modul: Modul;
  judul: string;
  satuanJamak: string;
  bidang: Bidang[];
  /** Bidang yang tampil di tabel, berurutan. */
  kolom: string[];
}

const TANGGAL: Bidang = { k: "tanggal", label: "Tanggal", tipe: "tanggal", wajib: true };
const CATATAN: Bidang = { k: "catatan", label: "Catatan", tipe: "catatan" };

/** Pemasukan dan pengeluaran yang dicatat sendiri; booking dibaca dari kalender, tidak diketik ulang. */
export const KATEGORI_MASUK = ["Menginap (di luar kalender)", "Dive dan aktivitas", "Makan dan minum", "Sewa dan transfer", "Pemasukan lain"];
export const KATEGORI_KELUAR = [
  "Gaji dan upah", "BPJS dan asuransi", "Listrik dan BBM", "Air", "Makanan dan minuman", "Perlengkapan dan amenitis kamar",
  "Perawatan dan perbaikan", "Perahu dan transportasi", "Pajak dan retribusi", "Komisi OTA dan agen", "Pemasaran", "Pembelian aset", "Pengeluaran lain",
];
export const KATEGORI_ASET = ["Bangunan", "Tanah", "Perahu dan mesin", "Peralatan selam", "Elektronik", "Perabot dan linen", "Kendaraan", "Peralatan dapur", "Aset lain"];
export const KATEGORI_BARANG = ["Tisu dan kertas", "Amenitis kamar", "Linen dan handuk", "Kebersihan dan sanitasi", "Dapur dan minuman", "Perlengkapan kamar", "Perawatan dan teknis", "Lain-lain"];
export const SATUAN_BARANG = ["pcs", "pak", "roll", "botol", "sachet", "lembar", "set", "liter", "kg", "dus"];
export const STATUS_ABSEN = ["Hadir", "Izin", "Sakit", "Cuti", "Libur", "Alpa"] as const;

export const KOLEKSI: Koleksi[] = [
  {
    id: "transaksi", modul: "keuangan", judul: "Catatan keuangan", satuanJamak: "catatan",
    bidang: [
      TANGGAL,
      { k: "jenis", label: "Jenis", tipe: "pilih", opsi: ["Pemasukan", "Pengeluaran"], wajib: true, awal: "Pengeluaran" },
      { k: "kategori", label: "Kategori", tipe: "pilih", opsi: [...KATEGORI_MASUK, ...KATEGORI_KELUAR], wajib: true },
      { k: "uraian", label: "Uraian", tipe: "teks", wajib: true },
      { k: "jumlah", label: "Jumlah", tipe: "angka", satuan: "Rp", wajib: true },
      CATATAN,
    ],
    kolom: ["tanggal", "jenis", "kategori", "uraian", "jumlah"],
  },
  {
    id: "aset", modul: "keuangan", judul: "Aset", satuanJamak: "aset",
    bidang: [
      { k: "nama", label: "Nama aset", tipe: "teks", wajib: true },
      { k: "kategori", label: "Kategori", tipe: "pilih", opsi: KATEGORI_ASET, wajib: true },
      { k: "tanggal", label: "Tanggal diperoleh", tipe: "tanggal", wajib: true },
      { k: "harga", label: "Harga perolehan", tipe: "angka", satuan: "Rp", wajib: true },
      { k: "umur", label: "Umur manfaat", tipe: "angka", satuan: "tahun", ket: "Isi 0 untuk aset yang tidak disusutkan, seperti tanah.", awal: 0, wajib: true },
      { k: "sisa", label: "Nilai sisa", tipe: "angka", satuan: "Rp", ket: "Perkiraan nilai di akhir umur manfaat. Boleh 0.", awal: 0 },
      { k: "kondisi", label: "Kondisi", tipe: "pilih", opsi: ["Baik", "Perlu perbaikan", "Rusak", "Sudah dijual atau dihapus"], awal: "Baik", wajib: true },
      { k: "lokasi", label: "Lokasi", tipe: "teks" },
      CATATAN,
    ],
    kolom: ["nama", "kategori", "tanggal", "harga", "kondisi"],
  },
  {
    id: "pegawai", modul: "sdm", judul: "Pegawai", satuanJamak: "pegawai",
    bidang: [
      { k: "nama", label: "Nama", tipe: "teks", wajib: true },
      { k: "jabatan", label: "Jabatan", tipe: "teks", wajib: true },
      { k: "status", label: "Status kerja", tipe: "pilih", opsi: ["Tetap", "Kontrak", "Harian", "Magang"], wajib: true, awal: "Tetap" },
      { k: "aktif", label: "Aktif", tipe: "pilih", opsi: ["Aktif", "Nonaktif"], wajib: true, awal: "Aktif" },
      { k: "mulai", label: "Mulai kerja", tipe: "tanggal" },
      { k: "gaji", label: "Gaji pokok per bulan", tipe: "angka", satuan: "Rp", wajib: true },
      { k: "tunjangan", label: "Tunjangan tetap per bulan", tipe: "angka", satuan: "Rp", awal: 0 },
      { k: "ikutBpjs", label: "Ikut BPJS", tipe: "pilih", opsi: ["Ya", "Tidak"], wajib: true, awal: "Ya", ket: "Menentukan apakah iuran BPJS dihitung di estimasi biaya gaji." },
      { k: "hp", label: "Nomor HP", tipe: "teks" },
      CATATAN,
    ],
    kolom: ["nama", "jabatan", "status", "aktif", "gaji", "tunjangan"],
  },
  {
    id: "absensi", modul: "sdm", judul: "Absensi", satuanJamak: "catatan absensi",
    bidang: [
      TANGGAL,
      { k: "pegawai", label: "Pegawai", tipe: "rujuk", ke: "pegawai", wajib: true },
      { k: "status", label: "Status", tipe: "pilih", opsi: [...STATUS_ABSEN], wajib: true, awal: "Hadir" },
      CATATAN,
    ],
    kolom: ["tanggal", "pegawai", "status", "catatan"],
  },
  {
    id: "asuransi", modul: "sdm", judul: "Asuransi dan jaminan kesehatan", satuanJamak: "kepesertaan",
    bidang: [
      { k: "pegawai", label: "Pegawai", tipe: "rujuk", ke: "pegawai", wajib: true },
      { k: "jenis", label: "Jenis", tipe: "pilih", opsi: ["BPJS Kesehatan", "BPJS Ketenagakerjaan", "Asuransi swasta"], wajib: true },
      { k: "nomor", label: "Nomor kepesertaan", tipe: "teks" },
      { k: "status", label: "Status", tipe: "pilih", opsi: ["Aktif", "Belum didaftarkan", "Tidak aktif"], wajib: true, awal: "Aktif" },
      { k: "premi", label: "Premi per bulan ditanggung perusahaan", tipe: "angka", satuan: "Rp", awal: 0, ket: "Isi bila di luar hitungan persen BPJS, misalnya asuransi swasta." },
      { k: "sampai", label: "Berlaku sampai", tipe: "tanggal" },
      CATATAN,
    ],
    kolom: ["pegawai", "jenis", "nomor", "status", "premi"],
  },
  {
    id: "inventaris", modul: "sdm", judul: "Inventaris dan kebutuhan pegawai", satuanJamak: "barang",
    bidang: [
      { k: "barang", label: "Barang", tipe: "teks", wajib: true, ket: "Misalnya seragam, sepatu kerja, alat selam, pelampung, radio." },
      { k: "kategori", label: "Kategori", tipe: "pilih", opsi: ["Seragam", "Alat kerja", "Alat keselamatan (APD)", "Perlengkapan lain"], wajib: true },
      { k: "pegawai", label: "Dipegang oleh", tipe: "rujuk", ke: "pegawai", ket: "Kosongkan bila barang dipakai bersama." },
      { k: "punya", label: "Jumlah yang ada", tipe: "angka", awal: 0, wajib: true },
      { k: "butuh", label: "Jumlah yang dibutuhkan", tipe: "angka", awal: 0, wajib: true },
      { k: "harga", label: "Perkiraan harga satuan", tipe: "angka", satuan: "Rp", awal: 0, ket: "Perkiraan Anda sendiri; kosongkan bila belum tahu." },
      { k: "kondisi", label: "Kondisi", tipe: "pilih", opsi: ["Baik", "Perlu diganti", "Rusak", "Hilang"], awal: "Baik" },
      CATATAN,
    ],
    kolom: ["barang", "kategori", "pegawai", "punya", "butuh", "harga"],
  },
  {
    id: "barang", modul: "gudang", judul: "Barang gudang", satuanJamak: "barang",
    bidang: [
      { k: "nama", label: "Nama barang", tipe: "teks", wajib: true },
      { k: "kategori", label: "Kategori", tipe: "pilih", opsi: KATEGORI_BARANG, wajib: true },
      { k: "satuan", label: "Satuan", tipe: "pilih", opsi: SATUAN_BARANG, wajib: true, awal: "pcs" },
      { k: "minimum", label: "Stok minimum", tipe: "angka", awal: 0, wajib: true, ket: "Di bawah ini barang ditandai menipis dan masuk daftar belanja." },
      { k: "harga", label: "Perkiraan harga satuan", tipe: "angka", satuan: "Rp", awal: 0, ket: "Perkiraan Anda sendiri; kosongkan bila belum tahu." },
      { k: "pakaiMalam", label: "Pemakaian per kamar terisi per malam", tipe: "angka", awal: 0, ket: "Misalnya 2 tisu gulung per kamar per malam. Dipakai untuk memperkirakan kebutuhan 30 hari. Isi 0 bila tidak dihitung begitu." },
      CATATAN,
    ],
    kolom: ["nama", "kategori", "satuan", "minimum", "harga"],
  },
  {
    id: "mutasi", modul: "gudang", judul: "Keluar masuk barang", satuanJamak: "catatan",
    bidang: [
      TANGGAL,
      { k: "barang", label: "Barang", tipe: "rujuk", ke: "barang", wajib: true },
      { k: "jenis", label: "Jenis", tipe: "pilih", opsi: ["Masuk", "Keluar", "Koreksi stok"], wajib: true, awal: "Masuk", ket: "Koreksi stok: isi selisihnya, negatif untuk mengurangi (misalnya hasil hitung ulang)." },
      { k: "jumlah", label: "Jumlah", tipe: "angka", wajib: true, negatif: true },
      { k: "harga", label: "Harga satuan (bila masuk)", tipe: "angka", satuan: "Rp", awal: 0 },
      CATATAN,
    ],
    kolom: ["tanggal", "barang", "jenis", "jumlah", "catatan"],
  },
];

export const koleksiDari = (id: string) => KOLEKSI.find((k) => k.id === id);

/** Satu catatan: bidang dari skema, ditambah penanda yang diisi server. */
export interface Rekaman {
  id: string;
  unit: PropertyKey;
  dibuat?: string;
  diubahOleh?: string;
  diubahPada?: string;
  [bidang: string]: string | number | undefined;
}

// ------------------------------------------------------------------- parameter

/**
 * Angka acuan aturan untuk estimasi biaya gaji. Semuanya bisa diubah di layar;
 * ini awalnya saja, dengan sumbernya di `SUMBER_PARAMETER`. Persentase
 * ditulis sebagai persen (4 berarti 4%).
 */
export interface ParameterSdm {
  kesPerusahaan: number;
  kesPekerja: number;
  kesBatas: number;
  jhtPerusahaan: number;
  jhtPekerja: number;
  jpPerusahaan: number;
  jpPekerja: number;
  /** 0 berarti tanpa batas upah. */
  jpBatas: number;
  jkk: number;
  jkm: number;
  ump: number;
  thrBulan: number;
  hariKerja: number;
}

export const PARAMETER_AWAL: ParameterSdm = {
  kesPerusahaan: 4,
  kesPekerja: 1,
  kesBatas: 12_000_000,
  jhtPerusahaan: 3.7,
  jhtPekerja: 2,
  jpPerusahaan: 2,
  jpPekerja: 1,
  jpBatas: 0,
  jkk: 0.24,
  jkm: 0.3,
  ump: 3_766_000,
  thrBulan: 1,
  hariKerja: 26,
};

export const LABEL_PARAMETER: Record<keyof ParameterSdm, { label: string; satuan: string; ket: string }> = {
  kesPerusahaan: { label: "BPJS Kesehatan, bagian perusahaan", satuan: "%", ket: "Total 5% dari upah: 4% perusahaan, 1% pekerja." },
  kesPekerja: { label: "BPJS Kesehatan, bagian pekerja", satuan: "%", ket: "Dipotong dari gaji." },
  kesBatas: { label: "Batas upah BPJS Kesehatan", satuan: "Rp", ket: "Upah di atas batas ini tidak menambah iuran." },
  jhtPerusahaan: { label: "JHT, bagian perusahaan", satuan: "%", ket: "Jaminan Hari Tua: total 5,7%, 3,7% perusahaan dan 2% pekerja." },
  jhtPekerja: { label: "JHT, bagian pekerja", satuan: "%", ket: "Dipotong dari gaji." },
  jpPerusahaan: { label: "Jaminan Pensiun, bagian perusahaan", satuan: "%", ket: "Total 3%: 2% perusahaan dan 1% pekerja." },
  jpPekerja: { label: "Jaminan Pensiun, bagian pekerja", satuan: "%", ket: "Dipotong dari gaji." },
  jpBatas: { label: "Batas upah Jaminan Pensiun", satuan: "Rp", ket: "Berubah tiap tahun dan sumbernya berbeda-beda (sekitar Rp10 juta); isi sesuai pengumuman BPJS Ketenagakerjaan. 0 berarti tanpa batas." },
  jkk: { label: "JKK (kecelakaan kerja), perusahaan", satuan: "%", ket: "Tarifnya menurut kelas risiko usaha (0,24% sampai 1,74%). Kelas untuk penginapan belum terkonfirmasi: tanyakan ke BPJS Ketenagakerjaan." },
  jkm: { label: "JKM (kematian), perusahaan", satuan: "%", ket: "0,30% dari upah, seluruhnya ditanggung perusahaan." },
  ump: { label: "UMP acuan", satuan: "Rp", ket: "Upah minimum Papua Barat Daya 2026; Raja Ampat memakai angka provinsi. Dipakai untuk memperingatkan gaji di bawahnya." },
  thrBulan: { label: "Cadangan THR", satuan: "bulan gaji per tahun", ket: "Perkiraan: THR satu bulan gaji untuk yang sudah bekerja 12 bulan. Belum dicek ke sumber resmi; sesuaikan." },
  hariKerja: { label: "Hari kerja per bulan", satuan: "hari", ket: "Dasar menghitung potongan per hari alpa. Isi sesuai kebijakan Anda." },
};

export const SUMBER_PARAMETER = [
  { teks: "Iuran BPJS Kesehatan dan Ketenagakerjaan (Gadjian)", url: "https://www.gadjian.com/blog/2024/04/26/iuran-bpjs-kesehatan-karyawan/" },
  { teks: "Besaran premi BPJS Ketenagakerjaan (KantorKu)", url: "https://kantorku.id/blog/premi-bpjs-ketenagakerjaan/" },
  { teks: "UMP Papua Barat Daya 2026 (Liputan6)", url: "https://www.liputan6.com/bisnis/read/6243719/ump-2026-papua-barat-daya-naik-jadi-rp-37-juta" },
];

export const rapikanParameter = (o: unknown): ParameterSdm => {
  const x = (o && typeof o === "object" ? o : {}) as Record<string, unknown>;
  const hasil = { ...PARAMETER_AWAL };
  for (const k of Object.keys(PARAMETER_AWAL) as (keyof ParameterSdm)[]) {
    const n = Number(x[k]);
    if (x[k] !== undefined && x[k] !== "" && Number.isFinite(n) && n >= 0 && n <= 1e10) hasil[k] = n;
  }
  return hasil;
};

// ------------------------------------------------------------------- hitungan

const angka = (v: unknown) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

/** Iuran perusahaan dan pekerja untuk satu pegawai, per bulan. */
export function iuranBpjs(upah: number, ikut: boolean, p: ParameterSdm) {
  if (!ikut) return { perusahaan: 0, pekerja: 0 };
  const dasarKes = p.kesBatas > 0 ? Math.min(upah, p.kesBatas) : upah;
  const dasarJp = p.jpBatas > 0 ? Math.min(upah, p.jpBatas) : upah;
  const pct = (dasar: number, persen: number) => Math.round((dasar * persen) / 100);
  return {
    perusahaan:
      pct(dasarKes, p.kesPerusahaan) + pct(upah, p.jhtPerusahaan) + pct(dasarJp, p.jpPerusahaan) + pct(upah, p.jkk) + pct(upah, p.jkm),
    pekerja: pct(dasarKes, p.kesPekerja) + pct(upah, p.jhtPekerja) + pct(dasarJp, p.jpPekerja),
  };
}

export interface BarisGaji {
  id: string;
  nama: string;
  jabatan: string;
  unit: PropertyKey;
  gaji: number;
  tunjangan: number;
  upah: number;
  iuranPerusahaan: number;
  iuranPekerja: number;
  thr: number;
  /** Biaya penuh perusahaan per bulan: upah, iuran perusahaan, dan cadangan THR. */
  biaya: number;
  alpa: number;
  potonganAlpa: number;
  /** Diterima pegawai: upah dikurangi potongan alpa dan iuran pekerja. PPh 21 tidak dihitung. */
  diterima: number;
  dibawahUmp: boolean;
}

/** Biaya gaji per pegawai aktif, dengan rekap alpa bulan `bulan` (YYYY-MM). */
export function hitungGaji(pegawai: Rekaman[], absensi: Rekaman[], bulan: string, p: ParameterSdm): BarisGaji[] {
  return pegawai
    .filter((x) => x.aktif !== "Nonaktif")
    .map((x) => {
      const gaji = angka(x.gaji);
      const tunjangan = angka(x.tunjangan);
      const upah = gaji + tunjangan;
      const iuran = iuranBpjs(upah, x.ikutBpjs !== "Tidak", p);
      const alpa = absensi.filter((a) => a.pegawai === x.id && a.status === "Alpa" && String(a.tanggal ?? "").startsWith(bulan)).length;
      const potonganAlpa = p.hariKerja > 0 ? Math.min(upah, Math.round((gaji / p.hariKerja) * alpa)) : 0;
      const thr = Math.round((upah * p.thrBulan) / 12);
      return {
        id: x.id,
        nama: String(x.nama ?? ""),
        jabatan: String(x.jabatan ?? ""),
        unit: x.unit,
        gaji,
        tunjangan,
        upah,
        iuranPerusahaan: iuran.perusahaan,
        iuranPekerja: iuran.pekerja,
        thr,
        biaya: upah + iuran.perusahaan + thr,
        alpa,
        potonganAlpa,
        diterima: upah - potonganAlpa - iuran.pekerja,
        dibawahUmp: p.ump > 0 && gaji < p.ump && x.status !== "Magang",
      };
    });
}

/** Penyusutan garis lurus per bulan dan nilai buku pada `hari` (YYYY-MM-DD). */
export function hitungAset(a: Rekaman, hari: string) {
  const harga = angka(a.harga);
  const umur = angka(a.umur);
  const sisa = Math.min(angka(a.sisa), harga);
  const dilepas = a.kondisi === "Sudah dijual atau dihapus";
  if (umur <= 0 || dilepas) return { perBulan: 0, akumulasi: 0, nilaiBuku: dilepas ? 0 : harga, disusutkan: false, berjalan: false };
  const tgl = String(a.tanggal ?? "");
  const [y, m] = tgl.split("-").map(Number);
  const [y2, m2] = hari.split("-").map(Number);
  const selisih = Number.isFinite(y) && Number.isFinite(y2) ? (y2 - y) * 12 + (m2 - m) : 0;
  const bulanBerjalan = Math.max(0, selisih);
  const total = umur * 12;
  const perBulan = (harga - sisa) / total;
  const akumulasi = Math.min(harga - sisa, perBulan * bulanBerjalan);
  /* `berjalan`: bulan `hari` jatuh di dalam umur manfaat, jadi bulan itu menanggung penyusutan. */
  return { perBulan, akumulasi, nilaiBuku: harga - akumulasi, disusutkan: true, berjalan: selisih >= 0 && selisih < total };
}

export interface BarisStok {
  id: string;
  nama: string;
  kategori: string;
  satuan: string;
  unit: PropertyKey;
  stok: number;
  minimum: number;
  harga: number;
  pakaiMalam: number;
  /** Perkiraan kebutuhan 30 hari ke depan dari kamar terisi, atau null bila pemakaian per malam belum diisi. */
  kebutuhan30: number | null;
  status: "Habis" | "Menipis" | "Cukup";
  /** Jumlah yang perlu dibeli: ke minimum, atau ke kebutuhan 30 hari bila lebih besar. */
  perluBeli: number;
}

/** Stok dari catatan keluar masuk, dan apa yang perlu dibeli. `kamarMalam30` per unit: kamar terisi 30 hari ke depan. */
export function hitungStok(barang: Rekaman[], mutasi: Rekaman[], kamarMalam30: Partial<Record<PropertyKey, number>>): BarisStok[] {
  const saldo = new Map<string, number>();
  for (const m of mutasi) {
    const id = String(m.barang ?? "");
    const j = angka(m.jumlah);
    const tanda = m.jenis === "Masuk" ? 1 : m.jenis === "Keluar" ? -1 : 1;
    saldo.set(id, (saldo.get(id) ?? 0) + tanda * j);
  }
  return barang.map((b) => {
    const stok = saldo.get(b.id) ?? 0;
    const minimum = angka(b.minimum);
    const pakaiMalam = angka(b.pakaiMalam);
    const kebutuhan30 = pakaiMalam > 0 ? Math.ceil(pakaiMalam * (kamarMalam30[b.unit] ?? 0)) : null;
    const target = Math.max(minimum, kebutuhan30 ?? 0);
    return {
      id: b.id,
      nama: String(b.nama ?? ""),
      kategori: String(b.kategori ?? ""),
      satuan: String(b.satuan ?? ""),
      unit: b.unit,
      stok,
      minimum,
      harga: angka(b.harga),
      pakaiMalam,
      kebutuhan30,
      status: stok <= 0 ? "Habis" : stok <= minimum ? "Menipis" : "Cukup",
      perluBeli: Math.max(0, Math.ceil(target - stok)),
    };
  });
}
