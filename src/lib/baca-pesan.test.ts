import { test } from "node:test";
import assert from "node:assert/strict";
import { bacaPesan } from "./baca-pesan";

const KAMAR = [
  { id: "E1", name: "Rumah 01" },
  { id: "E3", name: "Rumah 03" },
];
const HARI_INI = "2026-11-17";

test("rentang dengan bulan dan nama tamu", () => {
  const [b] = bacaPesan("Atas nama: Budi Santoso\n12-15 Nov\n2 orang\nRumah 03", KAMAR, HARI_INI);
  assert.equal(b.guest, "Budi Santoso");
  assert.equal(b.checkIn, "2026-11-12");
  assert.equal(b.checkOut, "2026-11-15");
  assert.equal(b.pax, 2);
  assert.equal(b.room, "E3");
});

test("check in dan check out berlabel, urutan terbalik", () => {
  const [b] = bacaPesan("Check out 19/11/2026\nCheck in 12/11/2026", KAMAR, HARI_INI);
  assert.equal(b.checkIn, "2026-11-12");
  assert.equal(b.checkOut, "2026-11-19");
});

test("satu tanggal dan jumlah malam", () => {
  const [b] = bacaPesan("Nama: Lina\nDatang 20 Desember 2026, 3 malam", KAMAR, HARI_INI);
  assert.equal(b.checkIn, "2026-12-20");
  assert.equal(b.checkOut, "2026-12-23");
});

test("tanggal tanpa tahun yang sudah lewat jauh berarti tahun depan", () => {
  const [b] = bacaPesan("3-6 Feb", KAMAR, HARI_INI);
  assert.equal(b.checkIn, "2027-02-03");
});

test("beberapa pesanan dipisah baris kosong", () => {
  const r = bacaPesan("a/n Ani\n1-3 Des 2026\n\na/n Bayu\n5-9 Des 2026", KAMAR, HARI_INI);
  assert.equal(r.length, 2);
  assert.deepEqual(r.map((x) => x.guest), ["Ani", "Bayu"]);
});

test("daftar bernomor dipecah", () => {
  const r = bacaPesan("1. Nama: Ani 1-3 Des 2026\n2. Nama: Bayu 5-9 Des 2026", KAMAR, HARI_INI);
  assert.equal(r.length, 2);
});

test("tidak ada tanggal berarti tidak ada baris, bukan tebakan", () => {
  assert.deepEqual(bacaPesan("Halo kak, apakah masih ada kamar?", KAMAR, HARI_INI), []);
});

test("yang tidak ketemu dibiarkan kosong", () => {
  const [b] = bacaPesan("12-15 Nov", KAMAR, HARI_INI);
  assert.equal(b.guest, "");
  assert.equal(b.pax, null);
  assert.equal(b.room, "");
  assert.equal(b.total, null);
});

test("tanggal mustahil diabaikan", () => {
  assert.deepEqual(bacaPesan("31/02/2026", KAMAR, HARI_INI), []);
});

test("total hanya bila disebut jelas", () => {
  const [b] = bacaPesan("Total Rp 1.500.000\n12-14 Nov", KAMAR, HARI_INI);
  assert.equal(b.total, 1500000);
});
