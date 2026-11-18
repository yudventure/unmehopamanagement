"use client";

import { useMemo, useState } from "react";

import { KepalaModul, cocokUnit, Stat, TabBar, TabelModul, bulanIni, kartu, judulKecil, namaUnit, useModul, type FilterUnit } from "@/components/data-modul";
import { fmt, fmtDate } from "@/lib/format";
import { KATEGORI_KELUAR, hitungAset, hitungGaji, type Rekaman } from "@/lib/modul";
import type { PropertyKey } from "@/lib/types";

export interface PendapatanBooking {
  total: number;
  jumlah: number;
  /** Booking di bulan itu yang belum diberi harga di kalender. */
  tanpaHarga: number;
}

type Tab = "ringkas" | "catatan" | "aset";

const jumlahAngka = (rs: Rekaman[]) => rs.reduce((s, r) => s + (Number(r.jumlah) || 0), 0);

/**
 * Keuangan dan aset per unit: pendapatan dari kalender, pemasukan dan
 * pengeluaran yang dicatat, penyusutan aset, dan laba bersih perkiraan.
 *
 * Pendapatan booking dibaca dari kalender (yang sudah diberi harga), tidak
 * diketik ulang. Booking tanpa harga disebut, supaya laba yang kelihatan besar
 * karena harganya belum diisi tidak terbaca sebagai kenyataan.
 */
export function KeuanganScreen({ filter, pendapatan, hariIni }: { filter: FilterUnit; pendapatan: (bulan: string, unit: FilterUnit) => PendapatanBooking; hariIni: string }) {
  const keu = useModul("keuangan");
  const sdm = useModul("sdm");
  const [tab, setTab] = useState<Tab>("ringkas");
  const [bulan, setBulan] = useState(bulanIni());

  const hitung = useMemo(() => {
    const dalamUnit = (r: Rekaman) => cocokUnit(filter, r.unit);
    const transaksi = (keu.data.transaksi ?? []).filter((r) => dalamUnit(r) && String(r.tanggal ?? "").startsWith(bulan));
    const masuk = transaksi.filter((r) => r.jenis === "Pemasukan");
    const keluar = transaksi.filter((r) => r.jenis === "Pengeluaran");
    /* Pembelian aset dicatat sebagai arus kas tapi tidak dibebankan di laba:
       bebannya masuk lewat penyusutan, dan menghitung keduanya dua kali. */
    const keluarBeban = keluar.filter((r) => r.kategori !== "Pembelian aset");
    const pembelianAset = jumlahAngka(keluar.filter((r) => r.kategori === "Pembelian aset"));
    const aset = (keu.data.aset ?? []).filter(dalamUnit);
    const akhirBulan = `${bulan}-28`;
    const perAset = aset.map((a) => ({ a, h: hitungAset(a, akhirBulan) }));
    const penyusutanBulan = perAset.filter(({ h }) => h.berjalan).reduce((s, { h }) => s + h.perBulan, 0);
    const book = pendapatan(bulan, filter);
    const masukLain = jumlahAngka(masuk);
    const keluarTotal = jumlahAngka(keluarBeban);
    const laba = book.total + masukLain - keluarTotal - penyusutanBulan;
    const perKategori = KATEGORI_KELUAR.map((k) => ({ k, n: jumlahAngka(keluarBeban.filter((r) => r.kategori === k)) })).filter((x) => x.n > 0);
    const perUnit = (["turtle", "eddo", "divecenter"] as PropertyKey[]).map((u) => {
      const t = (keu.data.transaksi ?? []).filter((r) => r.unit === u && String(r.tanggal ?? "").startsWith(bulan));
      return { u, masuk: jumlahAngka(t.filter((r) => r.jenis === "Pemasukan")), keluar: jumlahAngka(t.filter((r) => r.jenis === "Pengeluaran" && r.kategori !== "Pembelian aset")), booking: pendapatan(bulan, u).total };
    }).filter((x) => keu.unit.includes(x.u));
    return {
      book, masukLain, keluarTotal, pembelianAset, penyusutanBulan, laba, perKategori, perUnit,
      hargaPerolehan: aset.reduce((s, a) => s + (Number(a.harga) || 0), 0),
      nilaiBuku: perAset.reduce((s, { h }) => s + h.nilaiBuku, 0),
      jumlahAset: aset.length,
      rusak: aset.filter((a) => a.kondisi === "Rusak" || a.kondisi === "Perlu perbaikan").length,
      aset: perAset,
    };
  }, [keu.data, keu.unit, filter, bulan, pendapatan]);

  const estGaji = useMemo(() => {
    const peg = (sdm.data.pegawai ?? []).filter((r) => cocokUnit(filter, r.unit));
    return hitungGaji(peg, sdm.data.absensi ?? [], bulan, sdm.parameter).reduce((s, b) => s + b.biaya, 0);
  }, [sdm.data, sdm.parameter, filter, bulan]);
  const gajiTercatat = useMemo(() => jumlahAngka((keu.data.transaksi ?? []).filter((r) => (cocokUnit(filter, r.unit)) && r.jenis === "Pengeluaran" && r.kategori === "Gaji dan upah" && String(r.tanggal ?? "").startsWith(bulan))), [keu.data, filter, bulan]);

  if (!keu.siap) return <section className={kartu}><p className="text-sm text-panel-utama/70">{keu.galatMuat || "Memuat…"}</p></section>;

  return (
    <div className="grid gap-5">
      <KepalaModul
        judul="Keuangan & Aset"
        filter={filter}
        ket="Pendapatan dari kalender, pemasukan dan pengeluaran yang dicatat, penyusutan aset, dan laba bersih perkiraan."
        hanyaLihat={keu.akses === "baca"}
      />
      <div className="flex flex-wrap items-center gap-3">
        <TabBar tabs={[{ id: "ringkas", label: "Ringkasan" }, { id: "catatan", label: "Catatan keuangan" }, { id: "aset", label: "Aset" }]} aktif={tab} onPilih={setTab} />
        {tab === "ringkas" && (
          <label className="ml-auto flex items-center gap-2 text-[0.8125rem] font-semibold text-panel-utama">
            Bulan
            <input type="month" value={bulan} onChange={(e) => e.target.value && setBulan(e.target.value)} className="rounded-xl border border-panel-garis bg-white px-3 py-2 text-[0.875rem]" />
          </label>
        )}
      </div>

      {tab === "ringkas" && (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Stat judul="Pendapatan booking" nilai={fmt(hitung.book.total)} ket={hitung.book.jumlah ? `${hitung.book.jumlah} booking tiba bulan ini${hitung.book.tanpaHarga ? `; ${hitung.book.tanpaHarga} belum diberi harga di kalender` : ""}` : "Belum ada booking tiba bulan ini"} nada={hitung.book.tanpaHarga ? "merah" : undefined} />
            <Stat judul="Pemasukan lain" nilai={fmt(hitung.masukLain)} ket="Yang dicatat di tab Catatan keuangan" />
            <Stat judul="Pengeluaran" nilai={fmt(hitung.keluarTotal)} ket={hitung.pembelianAset ? `Belum termasuk pembelian aset ${fmt(hitung.pembelianAset)}` : "Di luar pembelian aset"} />
            <Stat judul="Penyusutan aset" nilai={fmt(hitung.penyusutanBulan)} ket="Garis lurus, dari tab Aset" />
          </div>
          <Stat judul="Laba bersih perkiraan" nilai={fmt(hitung.laba)} nada={hitung.laba < 0 ? "merah" : "hijau"} ket="Pendapatan booking + pemasukan lain − pengeluaran − penyusutan. Perkiraan: hanya sebaik catatan yang sudah diisi." />

          {sdm.siap && (
            <section className={kartu}>
              <p className={judulKecil}>Gaji bulan ini</p>
              <p className="mt-1 text-[0.9375rem] text-panel-utama">Estimasi biaya gaji dari SDM: <strong>{fmt(estGaji)}</strong> per bulan (gaji, tunjangan, iuran perusahaan, cadangan THR). Gaji yang dicatat di pengeluaran: <strong>{fmt(gajiTercatat)}</strong>.</p>
              {estGaji > 0 && gajiTercatat === 0 && <p className="mt-2 rounded-2xl bg-panel-merah-lembut px-4 py-3 text-[0.8125rem] text-panel-merah">Gaji belum dicatat sebagai pengeluaran bulan ini, jadi laba di atas belum menanggung biaya gaji.</p>}
            </section>
          )}

          {hitung.perKategori.length > 0 && (
            <section className={kartu}>
              <p className={judulKecil}>Pengeluaran per kategori</p>
              <ul className="mt-2 grid gap-2">
                {hitung.perKategori.sort((a, b) => b.n - a.n).map((x) => (
                  <li key={x.k} className="text-[0.875rem] text-panel-utama">
                    <div className="flex justify-between gap-3"><span>{x.k}</span><span className="font-semibold tabular-nums">{fmt(x.n)}</span></div>
                    <div className="mt-1 h-2 rounded-full bg-panel-latar"><div className="h-2 rounded-full bg-panel-aksen" style={{ width: `${Math.max(3, Math.round((x.n / hitung.keluarTotal) * 100))}%` }} /></div>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {filter === "all" && hitung.perUnit.length > 1 && (
            <section className={kartu}>
              <p className={judulKecil}>Per unit</p>
              <div className="mt-2 overflow-x-auto">
                <table className="w-full min-w-[30rem] border-collapse text-left text-[0.875rem] text-panel-utama">
                  <thead><tr className="text-[0.75rem] font-bold text-panel-utama/60"><th className="px-2 py-2">Unit</th><th className="px-2 py-2 text-right">Pendapatan booking</th><th className="px-2 py-2 text-right">Pemasukan lain</th><th className="px-2 py-2 text-right">Pengeluaran</th></tr></thead>
                  <tbody>{hitung.perUnit.map((x) => <tr key={x.u} className="border-t border-panel-garis"><td className="px-2 py-2">{namaUnit(x.u)}</td><td className="px-2 py-2 text-right tabular-nums">{fmt(x.booking)}</td><td className="px-2 py-2 text-right tabular-nums">{fmt(x.masuk)}</td><td className="px-2 py-2 text-right tabular-nums">{fmt(x.keluar)}</td></tr>)}</tbody>
                </table>
              </div>
            </section>
          )}
        </>
      )}

      {tab === "catatan" && (
        <TabelModul modul={keu} koleksiId="transaksi" filter={filter} ket="Pemasukan dan pengeluaran di luar booking kalender. Booking tidak perlu diketik ulang di sini." kosong="Belum ada catatan. Tekan Tambah untuk mencatat pemasukan atau pengeluaran pertama." />
      )}

      {tab === "aset" && (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Stat judul="Harga perolehan" nilai={fmt(hitung.hargaPerolehan)} ket={`${hitung.jumlahAset} aset`} />
            <Stat judul="Nilai buku sekarang" nilai={fmt(hitung.nilaiBuku)} ket={`Per ${fmtDate(hariIni)}, setelah penyusutan`} />
            <Stat judul="Perlu perhatian" nilai={String(hitung.rusak)} ket="Aset rusak atau perlu perbaikan" nada={hitung.rusak ? "merah" : undefined} />
          </div>
          <TabelModul
            modul={keu}
            koleksiId="aset"
            filter={filter}
            urut={(a, b) => String(a.nama).localeCompare(String(b.nama))}
            ket="Daftar aset unit. Penyusutan garis lurus: (harga − nilai sisa) ÷ umur manfaat. Isi umur 0 untuk tanah."
            kosong="Belum ada aset. Tekan Tambah, lalu isi harga dan tanggal perolehan yang sebenarnya."
            kolomTambahan={[
              { judul: "Penyusutan/bln", kanan: true, isi: (r) => { const h = hitungAset(r, hariIni); return h.disusutkan ? fmt(h.perBulan) : "—"; } },
              { judul: "Nilai buku", kanan: true, isi: (r) => fmt(hitungAset(r, hariIni).nilaiBuku) },
            ]}
          />
        </>
      )}
    </div>
  );
}
