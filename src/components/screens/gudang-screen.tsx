"use client";

import { useMemo, useState } from "react";

import { KepalaModul, cocokUnit, Stat, TabBar, TabelModul, kartu, judulKecil, namaUnit, tombolTepi, tombolUtama, useModul, type DataModul, type FilterUnit } from "@/components/data-modul";
import { fmt } from "@/lib/format";
import { hitungStok, type BarisStok } from "@/lib/modul";
import type { PropertyKey } from "@/lib/types";

type Tab = "stok" | "barang" | "mutasi";

/** Catat masuk atau keluar satu barang dari barisnya, tanpa membuka tab Keluar masuk. */
function CatatCepat({ baris, jenis, modul, hariIni, onTutup }: { baris: BarisStok; jenis: "Masuk" | "Keluar"; modul: DataModul; hariIni: string; onTutup: () => void }) {
  const [jumlah, setJumlah] = useState("");
  const [galat, setGalat] = useState("");
  const [sibuk, setSibuk] = useState(false);
  const kirim = async () => {
    setSibuk(true);
    setGalat("");
    const g = await modul.simpan("mutasi", baris.unit, { tanggal: hariIni, barang: baris.id, jenis, jumlah, harga: jenis === "Masuk" ? baris.harga : 0, catatan: "" });
    if (g) {
      setGalat(g);
      setSibuk(false);
    } else onTutup();
  };
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-panel-utama/40 p-4" onPointerDown={(e) => e.target === e.currentTarget && onTutup()}>
      <div role="dialog" aria-modal="true" aria-label={`Catat ${jenis.toLowerCase()}`} className="w-full max-w-[24rem] rounded-3xl bg-white p-5 shadow-panel-angkat">
        <p className={judulKecil}>Barang {jenis.toLowerCase()}</p>
        <h2 className="mt-1 text-[1.15rem] font-bold text-panel-utama">{baris.nama}</h2>
        <p className="text-[0.8125rem] text-panel-utama/70">Stok sekarang {baris.stok} {baris.satuan}</p>
        <label className="mt-3 grid gap-1 text-[0.8125rem] font-semibold text-panel-utama">
          Jumlah ({baris.satuan})
          <input autoFocus type="number" inputMode="decimal" min={0} step="any" value={jumlah} onChange={(e) => setJumlah(e.target.value)} onKeyDown={(e) => e.key === "Enter" && jumlah && void kirim()} className="rounded-xl border border-panel-garis bg-panel-latar px-3 py-2 text-[0.875rem]" />
        </label>
        {galat && <p role="alert" className="mt-3 rounded-2xl bg-panel-merah-lembut px-4 py-3 text-[0.875rem] text-panel-merah">{galat}</p>}
        <div className="mt-4 flex gap-2">
          <button type="button" disabled={sibuk || !jumlah} onClick={() => void kirim()} className={tombolUtama}>{sibuk ? "Menyimpan…" : "Simpan"}</button>
          <button type="button" onClick={onTutup} className={tombolTepi}>Batal</button>
        </div>
      </div>
    </div>
  );
}

const CHIP: Record<BarisStok["status"], string> = {
  Habis: "bg-panel-merah text-white",
  Menipis: "bg-amber-500 text-white",
  Cukup: "bg-panel-lembut text-panel-aksen",
};

/**
 * Stok gudang per unit: barang pelayanan dan operasional (tisu, amenitis,
 * linen, perlengkapan kebersihan). Stok dihitung dari catatan keluar masuk,
 * bukan diketik, jadi selalu bisa ditelusuri.
 *
 * Kebutuhan 30 hari memakai kamar terisi 30 hari ke depan dari kalender dikali
 * pemakaian per kamar per malam yang diisi pengelola; barang yang pemakaiannya
 * belum diisi tidak diperkirakan, bukan ditebak.
 */
export function GudangScreen({ filter, hariIni, kamarMalam30 }: { filter: FilterUnit; hariIni: string; kamarMalam30: Partial<Record<PropertyKey, number>> }) {
  const g = useModul("gudang");
  const [tab, setTab] = useState<Tab>("stok");
  const [catat, setCatat] = useState<{ baris: BarisStok; jenis: "Masuk" | "Keluar" } | null>(null);
  const bolehMutasi = g.tulisKoleksi.includes("mutasi");

  const stok = useMemo(() => {
    const barang = (g.data.barang ?? []).filter((b) => cocokUnit(filter, b.unit));
    const idBarang = new Set(barang.map((b) => b.id));
    return hitungStok(barang, (g.data.mutasi ?? []).filter((m) => idBarang.has(String(m.barang))), kamarMalam30).sort((a, b) => (a.status === b.status ? a.nama.localeCompare(b.nama) : a.status === "Habis" ? -1 : b.status === "Habis" ? 1 : a.status === "Menipis" ? -1 : 1));
  }, [g.data, filter, kamarMalam30]);

  const ringkas = useMemo(() => {
    const belanja = stok.filter((b) => b.perluBeli > 0);
    return {
      habis: stok.filter((b) => b.status === "Habis").length,
      menipis: stok.filter((b) => b.status === "Menipis").length,
      nilai: stok.reduce((s, b) => s + Math.max(0, b.stok) * b.harga, 0),
      belanja,
      biayaBelanja: belanja.reduce((s, b) => s + b.perluBeli * b.harga, 0),
      tanpaHarga: belanja.filter((b) => !b.harga).length,
    };
  }, [stok]);

  if (!g.siap) return <section className={kartu}><p className="text-sm text-panel-utama/70">{g.galatMuat || "Memuat…"}</p></section>;
  const unitIni = filter === "all" ? null : filter;

  return (
    <div className="grid gap-5">
      <KepalaModul judul="Stok Gudang" filter={filter} ket="Barang pelayanan dan operasional: tisu, amenitis kamar, linen, perlengkapan kebersihan. Stok dihitung dari catatan keluar masuk." hanyaLihat={g.akses === "baca"} />
      <TabBar tabs={[{ id: "stok", label: "Stok & belanja", jumlah: ringkas.habis + ringkas.menipis }, { id: "barang", label: "Daftar barang" }, { id: "mutasi", label: "Keluar masuk" }]} aktif={tab} onPilih={setTab} />

      {tab === "stok" && (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Stat judul="Habis" nilai={String(ringkas.habis)} nada={ringkas.habis ? "merah" : undefined} ket="Stok nol atau kurang" />
            <Stat judul="Menipis" nilai={String(ringkas.menipis)} nada={ringkas.menipis ? "merah" : undefined} ket="Di bawah atau sama dengan stok minimum" />
            <Stat judul="Nilai persediaan" nilai={fmt(ringkas.nilai)} ket="Stok × perkiraan harga satuan" />
            <Stat judul="Perkiraan belanja" nilai={fmt(ringkas.biayaBelanja)} ket={ringkas.tanpaHarga ? `${ringkas.tanpaHarga} barang yang perlu dibeli belum diberi harga` : `${ringkas.belanja.length} barang perlu dibeli`} />
          </div>

          {ringkas.belanja.length > 0 && (
            <section className={kartu}>
              <p className={judulKecil}>Daftar belanja</p>
              <p className="mt-1 text-[0.8125rem] text-panel-utama/70">Sampai stok minimum, atau sampai cukup untuk 30 hari ke depan bila pemakaian per malam sudah diisi.</p>
              <ul className="mt-3 grid gap-2">
                {ringkas.belanja.map((b) => (
                  <li key={b.id} className="flex flex-wrap items-center gap-2 rounded-2xl bg-panel-latar px-4 py-2 text-[0.875rem] text-panel-utama">
                    <span className="min-w-0 flex-1 font-semibold">{b.nama}{filter === "all" ? <span className="font-normal text-panel-utama/60"> · {namaUnit(b.unit).split(" ")[0]}</span> : null}</span>
                    <span className="tabular-nums">beli {b.perluBeli} {b.satuan}</span>
                    <span className="w-28 text-right tabular-nums text-panel-utama/70">{b.harga ? fmt(b.perluBeli * b.harga) : "harga belum diisi"}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className={kartu}>
            <p className={judulKecil}>Stok sekarang</p>
            {stok.length === 0 ? (
              <p className="mt-3 rounded-2xl bg-panel-latar px-4 py-5 text-center text-[0.875rem] text-panel-utama/70">Belum ada barang. Buka tab Daftar barang, tambahkan barangnya, lalu catat stok awalnya di Keluar masuk.</p>
            ) : (
              <div className="mt-3 overflow-x-auto">
                <table className="w-full min-w-[40rem] border-collapse text-left text-[0.875rem] text-panel-utama">
                  <thead><tr className="text-[0.75rem] font-bold text-panel-utama/60"><th className="px-2 py-2">Barang</th>{filter === "all" && <th className="px-2 py-2">Unit</th>}<th className="px-2 py-2 text-right">Stok</th><th className="px-2 py-2 text-right">Minimum</th><th className="px-2 py-2 text-right">Butuh 30 hari</th><th className="px-2 py-2">Status</th>{bolehMutasi && <th className="px-2 py-2" />}</tr></thead>
                  <tbody>
                    {stok.map((b) => (
                      <tr key={b.id} className="border-t border-panel-garis">
                        <td className="px-2 py-2"><span className="font-semibold">{b.nama}</span><span className="block text-[0.75rem] text-panel-utama/60">{b.kategori}</span></td>
                        {filter === "all" && <td className="px-2 py-2 text-panel-utama/70">{namaUnit(b.unit).split(" ")[0]}</td>}
                        <td className="px-2 py-2 text-right tabular-nums">{b.stok} {b.satuan}</td>
                        <td className="px-2 py-2 text-right tabular-nums">{b.minimum}</td>
                        <td className="px-2 py-2 text-right tabular-nums">{b.kebutuhan30 === null ? <span className="text-panel-utama/50">belum diisi</span> : b.kebutuhan30}</td>
                        <td className="px-2 py-2"><span className={`rounded-full px-2 py-[2px] text-[11px] font-bold ${CHIP[b.status]}`}>{b.status}</span></td>
                        {bolehMutasi && (
                          <td className="px-2 py-2 whitespace-nowrap">
                            <button type="button" onClick={() => setCatat({ baris: b, jenis: "Masuk" })} className="mr-1 cursor-pointer rounded-full border border-panel-aksen bg-white px-3 py-1 text-[0.75rem] font-bold text-panel-aksen hover:bg-panel-lembut">+ Masuk</button>
                            <button type="button" onClick={() => setCatat({ baris: b, jenis: "Keluar" })} className="cursor-pointer rounded-full border border-panel-utama bg-white px-3 py-1 text-[0.75rem] font-bold text-panel-utama hover:bg-panel-latar">− Keluar</button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {unitIni === null && stok.length > 0 && <p className="mt-2 text-[0.75rem] text-panel-utama/60">Kebutuhan 30 hari dihitung per unit dari kamar terisi 30 hari ke depan di kalender.</p>}
          </section>
        </>
      )}

      {tab === "barang" && <TabelModul modul={g} koleksiId="barang" filter={filter} urut={(a, b) => String(a.nama).localeCompare(String(b.nama))} ket="Isi stok minimum dan pemakaian per kamar per malam supaya daftar belanja dan kebutuhan 30 hari terhitung." kosong="Belum ada barang. Tekan Tambah, misalnya tisu, sabun, sampo, handuk." />}

      {tab === "mutasi" && <TabelModul modul={g} koleksiId="mutasi" filter={filter} ket="Setiap barang masuk, keluar, atau koreksi hasil hitung ulang. Stok barang dihitung dari sini." kosong="Belum ada catatan. Catat stok awal sebagai Masuk." />}

      {catat && <CatatCepat baris={catat.baris} jenis={catat.jenis} modul={g} hariIni={hariIni} onTutup={() => setCatat(null)} />}
    </div>
  );
}
