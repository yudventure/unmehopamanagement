import "server-only";

/**
 * Membaca tabel dari berkas ekspor: Excel lama (.xls, BIFF8 di dalam Compound
 * File Binary) dan CSV. Tanpa pustaka luar, cukup untuk ekspor pesanan
 * Booking.com: satu lembar, sel teks dan angka. Rumus, gaya, dan lembar kedua
 * diabaikan.
 *
 * Kembali berupa baris-baris sel (teks atau angka), atau melempar galat yang
 * bisa dibaca orang.
 */
export type Sel = string | number;

export function bacaTabel(buf: Buffer): Sel[][] {
  if (buf.length >= 8 && buf.readUInt32LE(0) === 0xe011cfd0 && buf.readUInt32LE(4) === 0xe11ab1a1) return bacaXls(buf);
  if (buf.length >= 4 && buf[0] === 0x50 && buf[1] === 0x4b) throw new Error("Berkas .xlsx belum didukung. Unduh ulang dari Booking.com sebagai .xls atau .csv.");
  return bacaCsv(buf.toString("utf8").replace(/^﻿/, ""));
}

// ------------------------------------------------------------------ CSV

function bacaCsv(teks: string): Sel[][] {
  const baris1 = teks.split(/\r?\n/, 1)[0] ?? "";
  const pemisah = (baris1.match(/;/g)?.length ?? 0) > (baris1.match(/,/g)?.length ?? 0) ? ";" : baris1.includes("\t") && !baris1.includes(",") ? "\t" : ",";
  const hasil: Sel[][] = [];
  let baris: Sel[] = [];
  let sel = "";
  let kutip = false;
  for (let i = 0; i < teks.length; i++) {
    const c = teks[i];
    if (kutip) {
      if (c === '"' && teks[i + 1] === '"') {
        sel += '"';
        i++;
      } else if (c === '"') kutip = false;
      else sel += c;
    } else if (c === '"') kutip = true;
    else if (c === pemisah) {
      baris.push(sel);
      sel = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && teks[i + 1] === "\n") i++;
      baris.push(sel);
      hasil.push(baris);
      baris = [];
      sel = "";
    } else sel += c;
  }
  if (sel !== "" || baris.length) {
    baris.push(sel);
    hasil.push(baris);
  }
  return hasil.filter((b) => b.some((x) => String(x).trim() !== ""));
}

// ------------------------------------------------------- Compound File

const AKHIR = 0xfffffffe;

function aliran(buf: Buffer, namaDicari: string[]): Buffer {
  const geser = buf.readUInt16LE(0x1e);
  const ukuran = 1 << geser;
  if (ukuran !== 512 && ukuran !== 4096) throw new Error("Berkas Excel rusak.");
  const geserMini = buf.readUInt16LE(0x20);
  const batasMini = buf.readUInt32LE(0x38);
  const sektor = (id: number) => {
    const awal = (id + 1) * ukuran;
    if (awal + ukuran > buf.length) throw new Error("Berkas Excel terpotong.");
    return buf.subarray(awal, awal + ukuran);
  };

  /* Tabel FAT dari DIFAT: 109 di kepala, sisanya berantai. */
  const difat: number[] = [];
  for (let i = 0; i < 109; i++) difat.push(buf.readUInt32LE(0x4c + i * 4));
  let d = buf.readUInt32LE(0x44);
  for (let n = buf.readUInt32LE(0x48); n > 0 && d < AKHIR; n--) {
    const s = sektor(d);
    for (let i = 0; i < ukuran / 4 - 1; i++) difat.push(s.readUInt32LE(i * 4));
    d = s.readUInt32LE(ukuran - 4);
  }
  const fat: number[] = [];
  for (const f of difat.slice(0, buf.readUInt32LE(0x2c))) {
    if (f >= AKHIR) continue;
    const s = sektor(f);
    for (let i = 0; i < ukuran / 4; i++) fat.push(s.readUInt32LE(i * 4));
  }
  const rantai = (mulai: number, tabel: number[]) => {
    const ids: number[] = [];
    for (let id = mulai; id < AKHIR && ids.length <= tabel.length; id = tabel[id]) {
      if (id >= tabel.length) throw new Error("Berkas Excel rusak.");
      ids.push(id);
    }
    return ids;
  };
  const baca = (mulai: number) => Buffer.concat(rantai(mulai, fat).map(sektor));

  const dir = baca(buf.readUInt32LE(0x30));
  type Entri = { nama: string; jenis: number; mulai: number; besar: number };
  const entri: Entri[] = [];
  for (let o = 0; o + 128 <= dir.length; o += 128) {
    const pj = dir.readUInt16LE(o + 0x40);
    entri.push({
      nama: dir.subarray(o, o + Math.max(0, pj - 2)).toString("utf16le"),
      jenis: dir[o + 0x42],
      mulai: dir.readUInt32LE(o + 0x74),
      besar: dir.readUInt32LE(o + 0x78),
    });
  }
  const akar = entri.find((e) => e.jenis === 5);
  const e = entri.find((x) => x.jenis === 2 && namaDicari.includes(x.nama));
  if (!e) throw new Error("Bukan berkas pesanan Excel yang dikenal (tidak ada lembar kerja).");
  if (e.besar >= batasMini || !akar) return baca(e.mulai).subarray(0, e.besar);

  /* Aliran kecil di mini stream. */
  const ukMini = 1 << geserMini;
  const minifat: number[] = [];
  const mfMulai = buf.readUInt32LE(0x3c);
  if (mfMulai < AKHIR) {
    const m = baca(mfMulai);
    for (let i = 0; i + 4 <= m.length; i += 4) minifat.push(m.readUInt32LE(i));
  }
  const mini = baca(akar.mulai);
  return Buffer.concat(rantai(e.mulai, minifat).map((id) => mini.subarray(id * ukMini, (id + 1) * ukMini))).subarray(0, e.besar);
}

// ----------------------------------------------------------------- BIFF8

function rk(v: number): number {
  let n: number;
  if (v & 2) n = v >> 2;
  else {
    const b = Buffer.alloc(8);
    b.writeUInt32LE(0, 0);
    b.writeUInt32LE(v & 0xfffffffc, 4);
    n = b.readDoubleLE(0);
  }
  return v & 1 ? n / 100 : n;
}

/** Pembaca string Unicode BIFF8 yang bisa menyeberang batas rekaman CONTINUE. */
class Potongan {
  private i = 0;
  private k = 0;
  constructor(private bagian: Buffer[]) {}
  private get b() {
    return this.bagian[this.k];
  }
  private pastikan() {
    while (this.k < this.bagian.length && this.i >= this.b.length) {
      this.k++;
      this.i = 0;
    }
    if (this.k >= this.bagian.length) throw new Error("SST terpotong");
  }
  u8() {
    this.pastikan();
    return this.b[this.i++];
  }
  u16() {
    return this.u8() | (this.u8() << 8);
  }
  u32() {
    return (this.u16() | (this.u16() << 16)) >>> 0;
  }
  lewati(n: number) {
    for (let j = 0; j < n; j++) this.u8();
  }
  string(): string {
    const cch = this.u16();
    let flag = this.u8();
    const kaya = flag & 0x08 ? this.u16() : 0;
    const ext = flag & 0x04 ? this.u32() : 0;
    let s = "";
    let sisa = cch;
    while (sisa > 0) {
      this.pastikan();
      const lebar = flag & 1 ? 2 : 1;
      const muat = Math.min(sisa, Math.floor((this.b.length - this.i) / lebar));
      if (muat <= 0) {
        /* Batas CONTINUE di tengah karakter: rekaman baru diawali bendera lagi. */
        this.k++;
        this.i = 0;
        flag = this.u8();
        continue;
      }
      const potong = this.b.subarray(this.i, this.i + muat * lebar);
      s += lebar === 2 ? potong.toString("utf16le") : potong.toString("latin1");
      this.i += muat * lebar;
      sisa -= muat;
      if (sisa > 0 && this.i >= this.b.length) {
        this.k++;
        this.i = 0;
        flag = this.u8();
      }
    }
    this.lewati(kaya * 4 + ext);
    return s;
  }
}

function stringSel(d: Buffer, o: number): string {
  const cch = d.readUInt16LE(o);
  const flag = d[o + 2];
  let p = o + 3;
  if (flag & 0x08) p += 2;
  if (flag & 0x04) p += 4;
  return flag & 1 ? d.subarray(p, p + cch * 2).toString("utf16le") : d.subarray(p, p + cch).toString("latin1");
}

function bacaXls(buf: Buffer): Sel[][] {
  const wb = aliran(buf, ["Workbook", "Book"]);
  const sst: string[] = [];
  const sel = new Map<number, Map<number, Sel>>();
  const taruh = (r: number, c: number, v: Sel) => {
    let b = sel.get(r);
    if (!b) sel.set(r, (b = new Map()));
    b.set(c, v);
  };
  let lembar = 0; // 0 = global, 1 = lembar kerja pertama, 2 = sesudahnya
  let rumusMenunggu: [number, number] | null = null;

  let o = 0;
  while (o + 4 <= wb.length) {
    const jenis = wb.readUInt16LE(o);
    const pj = wb.readUInt16LE(o + 2);
    const d = wb.subarray(o + 4, o + 4 + pj);
    o += 4 + pj;
    if (jenis === 0x0809) {
      const tipe = d.length >= 4 ? d.readUInt16LE(2) : 0;
      if (tipe === 0x0010) lembar = lembar === 0 ? 1 : 2;
      continue;
    }
    if (jenis === 0x00fc && lembar === 0) {
      const bagian = [d.subarray(8)];
      while (o + 4 <= wb.length && wb.readUInt16LE(o) === 0x003c) {
        const p = wb.readUInt16LE(o + 2);
        bagian.push(wb.subarray(o + 4, o + 4 + p));
        o += 4 + p;
      }
      const n = d.readUInt32LE(4);
      const r = new Potongan(bagian);
      try {
        for (let i = 0; i < n; i++) sst.push(r.string());
      } catch {
        /* SST yang rusak di ujung: pakai yang sudah terbaca. */
      }
      continue;
    }
    if (lembar !== 1) continue;
    switch (jenis) {
      case 0x00fd: // LABELSST
        taruh(d.readUInt16LE(0), d.readUInt16LE(2), sst[d.readUInt32LE(6)] ?? "");
        break;
      case 0x0203: // NUMBER
        taruh(d.readUInt16LE(0), d.readUInt16LE(2), d.readDoubleLE(6));
        break;
      case 0x027e: // RK
        taruh(d.readUInt16LE(0), d.readUInt16LE(2), rk(d.readUInt32LE(6)));
        break;
      case 0x00bd: {
        // MULRK
        const r = d.readUInt16LE(0);
        const c0 = d.readUInt16LE(2);
        const n = (d.length - 6) / 6;
        for (let i = 0; i < n; i++) taruh(r, c0 + i, rk(d.readUInt32LE(4 + i * 6 + 2)));
        break;
      }
      case 0x0204: // LABEL
        taruh(d.readUInt16LE(0), d.readUInt16LE(2), stringSel(d, 6));
        break;
      case 0x0006: {
        // FORMULA: hasil angka langsung, hasil teks di rekaman STRING berikutnya
        const r = d.readUInt16LE(0);
        const c = d.readUInt16LE(2);
        if (d.readUInt16LE(12) !== 0xffff) taruh(r, c, d.readDoubleLE(6));
        else if (d[6] === 0) rumusMenunggu = [r, c];
        break;
      }
      case 0x0207: // STRING
        if (rumusMenunggu) taruh(rumusMenunggu[0], rumusMenunggu[1], stringSel(d, 0));
        rumusMenunggu = null;
        break;
      case 0x000a: // EOF lembar pertama
        lembar = 2;
        break;
    }
  }

  const barisMaks = Math.max(-1, ...sel.keys());
  const hasil: Sel[][] = [];
  for (let r = 0; r <= barisMaks; r++) {
    const b = sel.get(r);
    if (!b) continue;
    const kolomMaks = Math.max(...b.keys());
    const baris: Sel[] = [];
    for (let c = 0; c <= kolomMaks; c++) baris.push(b.get(c) ?? "");
    hasil.push(baris);
  }
  return hasil;
}
