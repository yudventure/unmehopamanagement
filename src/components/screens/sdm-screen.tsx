"use client";

import { useMemo, useState } from "react";

import { KepalaModul, cocokUnit, Stat, TabBar, TabelModul, bulanIni, kartu, judulKecil, namaUnit, tombolUtama, useModul, type DataModul, type FilterUnit } from "@/components/data-modul";
import { SertifikatMagang } from "@/components/sertifikat-magang";
import { fmt } from "@/lib/format";
import { LABEL_PARAMETER, PARAMETER_AWAL, STATUS_ABSEN, SUMBER_PARAMETER, hitungGaji, type ParameterSdm, type Rekaman } from "@/lib/modul";

type Tab = "biaya" | "pegawai" | "absensi" | "asuransi" | "inventaris" | "sertifikat" | "acuan";

const isian = "w-full rounded-xl border border-panel-garis bg-panel-latar px-3 py-2 text-[0.875rem] text-panel-utama outline-none focus:border-panel-aksen";

/** Absen satu hari: satu baris per pegawai aktif, status dipilih langsung dan tersimpan. */
function AbsenHarian({ modul, filter, hariIni }: { modul: DataModul; filter: FilterUnit; hariIni: string }) {
  const [tanggal, setTanggal] = useState(hariIni);
  const [galat, setGalat] = useState("");
  const [sibuk, setSibuk] = useState(false);
  const bolehTulis = modul.tulisKoleksi.includes("absensi");
  const pegawai = (modul.data.pegawai ?? []).filter((p) => p.aktif !== "Nonaktif" && (cocokUnit(filter, p.unit))).sort((a, b) => String(a.nama).localeCompare(String(b.nama)));
  const catatan = (modul.data.absensi ?? []).filter((a) => a.tanggal === tanggal);
  const dari = (id: string) => catatan.find((a) => a.pegawai === id);

  const atur = async (p: Rekaman, status: string) => {
    setGalat("");
    const ada = dari(p.id);
    if (!status) {
      if (ada) setGalat((await modul.hapus("absensi", ada.id)) ?? "");
      return;
    }
    setGalat((await modul.simpan("absensi", p.unit, { tanggal, pegawai: p.id, status, catatan: ada?.catatan ?? "" }, ada?.id)) ?? "");
  };
  const semuaHadir = async () => {
    setSibuk(true);
    for (const p of pegawai.filter((x) => !dari(x.id))) {
      const g = await modul.simpan("absensi", p.unit, { tanggal, pegawai: p.id, status: "Hadir", catatan: "" });
      if (g) {
        setGalat(g);
        break;
      }
    }
    setSibuk(false);
  };

  return (
    <div className={kartu}>
      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className={judulKecil}>Absen harian</p>
          <p className="mt-1 text-[0.8125rem] text-panel-utama/70">Pilih status tiap pegawai; tersimpan begitu dipilih.</p>
        </div>
        <input type="date" value={tanggal} onChange={(e) => e.target.value && setTanggal(e.target.value)} className="rounded-xl border border-panel-garis bg-white px-3 py-2 text-[0.875rem]" />
        {bolehTulis && <button type="button" disabled={sibuk || pegawai.every((p) => dari(p.id))} onClick={() => void semuaHadir()} className={tombolUtama}>{sibuk ? "Menyimpan…" : "Tandai yang kosong Hadir"}</button>}
      </div>
      {galat && <p role="alert" className="mt-3 rounded-2xl bg-panel-merah-lembut px-4 py-3 text-[0.875rem] text-panel-merah">{galat}</p>}
      {pegawai.length === 0 ? (
        <p className="mt-3 rounded-2xl bg-panel-latar px-4 py-5 text-center text-[0.875rem] text-panel-utama/70">Belum ada pegawai aktif. Tambahkan di tab Pegawai.</p>
      ) : (
        <ul className="mt-3 grid gap-2">
          {pegawai.map((p) => (
            <li key={p.id} className="flex flex-wrap items-center gap-3 rounded-2xl bg-panel-latar px-4 py-3">
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[0.9375rem] font-semibold text-panel-utama">{String(p.nama)}</span>
                <span className="block truncate text-[0.75rem] text-panel-utama/60">{String(p.jabatan)}{filter === "all" ? ` · ${namaUnit(p.unit)}` : ""}</span>
              </span>
              <select
                aria-label={`Status ${String(p.nama)}`}
                disabled={!bolehTulis}
                value={String(dari(p.id)?.status ?? "")}
                onChange={(e) => void atur(p, e.target.value)}
                className={`rounded-xl border px-3 py-2 text-[0.875rem] font-semibold ${dari(p.id)?.status === "Alpa" ? "border-panel-merah bg-panel-merah-lembut text-panel-merah" : dari(p.id)?.status === "Hadir" ? "border-panel-aksen bg-panel-lembut text-panel-aksen" : "border-panel-garis bg-white text-panel-utama"}`}
              >
                <option value="">Belum diisi</option>
                {STATUS_ABSEN.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Angka acuan aturan gaji. Bisa diubah oleh yang berhak; semua orang bisa melihatnya dan sumbernya. */
function Acuan({ modul }: { modul: DataModul }) {
  const [p, setP] = useState<Record<string, string>>(() => Object.fromEntries(Object.entries(modul.parameter).map(([k, v]) => [k, String(v)])));
  const [pesan, setPesan] = useState<{ ok: boolean; teks: string } | null>(null);
  const [sibuk, setSibuk] = useState(false);
  const simpan = async () => {
    setSibuk(true);
    const g = await modul.simpanParameter(p as unknown as ParameterSdm);
    setPesan(g ? { ok: false, teks: g } : { ok: true, teks: "Angka acuan tersimpan." });
    setSibuk(false);
  };
  return (
    <div className="grid gap-5">
      <section className={kartu}>
        <p className={judulKecil}>Angka acuan perhitungan gaji</p>
        <p className="mt-1 text-[0.8125rem] leading-[1.55] text-panel-utama/75">
          Dipakai di estimasi biaya gaji untuk semua unit. Awalnya diisi dari aturan yang berlaku umum, tetapi ini <strong>perkiraan</strong>: cocokkan dengan BPJS dan konsultan pajak Anda sebelum dipakai untuk membayar. PPh 21 tidak dihitung.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {(Object.keys(PARAMETER_AWAL) as (keyof ParameterSdm)[]).map((k) => (
            <label key={k} className="grid gap-1 text-[0.8125rem] font-semibold text-panel-utama">
              {LABEL_PARAMETER[k].label} <span className="font-normal text-panel-utama/60">({LABEL_PARAMETER[k].satuan})</span>
              <input type="number" inputMode="decimal" step="any" min={0} disabled={!modul.bolehUbahParameter} value={p[k] ?? ""} onChange={(e) => setP((x) => ({ ...x, [k]: e.target.value }))} className={isian} />
              <span className="text-[0.75rem] font-normal leading-[1.4] text-panel-utama/60">{LABEL_PARAMETER[k].ket}</span>
            </label>
          ))}
        </div>
        {modul.bolehUbahParameter ? (
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button type="button" disabled={sibuk} onClick={() => void simpan()} className={tombolUtama}>{sibuk ? "Menyimpan…" : "Simpan angka acuan"}</button>
            <button type="button" onClick={() => setP(Object.fromEntries(Object.entries(PARAMETER_AWAL).map(([k, v]) => [k, String(v)])))} className="cursor-pointer border-none bg-transparent text-[0.8125rem] text-panel-utama/70 underline">Kembalikan ke awal</button>
          </div>
        ) : (
          <p className="mt-3 text-[0.75rem] text-panel-utama/60">Hanya developer, pemilik, GM, dan HRD yang bisa mengubahnya.</p>
        )}
        {pesan && <p className={`mt-3 rounded-2xl px-4 py-3 text-[0.875rem] ${pesan.ok ? "bg-panel-lembut text-panel-aksen" : "bg-panel-merah-lembut text-panel-merah"}`}>{pesan.teks}</p>}
      </section>
      <section className={kartu}>
        <p className={judulKecil}>Sumber</p>
        <ul className="mt-2 grid list-disc gap-1 pl-5 text-[0.8125rem] text-panel-utama/80">
          {SUMBER_PARAMETER.map((s) => <li key={s.url}><a href={s.url} target="_blank" rel="noreferrer" className="underline">{s.teks}</a></li>)}
        </ul>
        <p className="mt-2 text-[0.75rem] text-panel-utama/60">Sumber-sumber ini blog dan berita, bukan situs resmi BPJS; beberapa angka (batas upah, kelas risiko JKK) berbeda antar sumber. Periksa ke BPJS Kesehatan dan BPJS Ketenagakerjaan.</p>
      </section>
    </div>
  );
}

/**
 * SDM per unit: pegawai, absensi, biaya gaji, asuransi kesehatan, dan
 * inventaris serta kebutuhan pegawai.
 *
 * Tabelnya kosong sampai diisi, dan angka acuan iuran ada di tab sendiri
 * dengan sumbernya: gaji dan iuran adalah angka yang dibayarkan ke orang
 * sungguhan, jadi tidak ada yang diisi dari tebakan.
 */
export function SdmScreen({ filter, hariIni }: { filter: FilterUnit; hariIni: string }) {
  const sdm = useModul("sdm");
  const [tab, setTab] = useState<Tab>("biaya");
  const [bulan, setBulan] = useState(bulanIni());

  const dalam = (r: Rekaman) => cocokUnit(filter, r.unit);
  const pegawai = useMemo(() => (sdm.data.pegawai ?? []).filter(dalam), [sdm.data.pegawai, filter]); // eslint-disable-line react-hooks/exhaustive-deps
  const gaji = useMemo(() => hitungGaji(pegawai, sdm.data.absensi ?? [], bulan, sdm.parameter), [pegawai, sdm.data.absensi, bulan, sdm.parameter]);
  const total = useMemo(
    () => ({
      biaya: gaji.reduce((s, b) => s + b.biaya, 0),
      upah: gaji.reduce((s, b) => s + b.upah, 0),
      iuran: gaji.reduce((s, b) => s + b.iuranPerusahaan, 0),
      thr: gaji.reduce((s, b) => s + b.thr, 0),
      diterima: gaji.reduce((s, b) => s + b.diterima, 0),
    }),
    [gaji],
  );

  /* Hal yang perlu ditindaklanjuti, sebagai kalimat. */
  const peringatan = useMemo(() => {
    const w: string[] = [];
    const aktif = pegawai.filter((p) => p.aktif !== "Nonaktif");
    const kes = new Set((sdm.data.asuransi ?? []).filter((a) => a.jenis === "BPJS Kesehatan" && a.status === "Aktif").map((a) => a.pegawai));
    const tk = new Set((sdm.data.asuransi ?? []).filter((a) => a.jenis === "BPJS Ketenagakerjaan" && a.status === "Aktif").map((a) => a.pegawai));
    const tanpaKes = aktif.filter((p) => p.ikutBpjs !== "Tidak" && !kes.has(p.id));
    const tanpaTk = aktif.filter((p) => p.ikutBpjs !== "Tidak" && !tk.has(p.id));
    if (tanpaKes.length) w.push(`${tanpaKes.length} pegawai belum tercatat punya BPJS Kesehatan aktif: ${tanpaKes.slice(0, 4).map((p) => String(p.nama)).join(", ")}${tanpaKes.length > 4 ? ", …" : ""}.`);
    if (tanpaTk.length) w.push(`${tanpaTk.length} pegawai belum tercatat punya BPJS Ketenagakerjaan aktif.`);
    const bawah = gaji.filter((b) => b.dibawahUmp);
    if (bawah.length) w.push(`${bawah.length} pegawai bergaji pokok di bawah UMP acuan ${fmt(sdm.parameter.ump)}: ${bawah.slice(0, 4).map((b) => b.nama).join(", ")}.`);
    const lewat = (sdm.data.asuransi ?? []).filter((a) => dalam(a) && a.sampai && String(a.sampai) < hariIni && a.status === "Aktif");
    if (lewat.length) w.push(`${lewat.length} kepesertaan asuransi sudah lewat masa berlakunya.`);
    return w;
  }, [pegawai, gaji, sdm.data.asuransi, sdm.parameter.ump, hariIni, filter]); // eslint-disable-line react-hooks/exhaustive-deps

  const kebutuhan = useMemo(() => {
    const inv = (sdm.data.inventaris ?? []).filter(dalam);
    const kurang = inv.filter((i) => Number(i.butuh) > Number(i.punya));
    return { jumlah: kurang.length, biaya: kurang.reduce((s, i) => s + (Number(i.butuh) - Number(i.punya)) * Number(i.harga || 0), 0), tanpaHarga: kurang.filter((i) => !Number(i.harga)).length };
  }, [sdm.data.inventaris, filter]); // eslint-disable-line react-hooks/exhaustive-deps

  /* Rekap absensi bulan dipilih, per pegawai. */
  const rekap = useMemo(() => {
    return pegawai.filter((p) => p.aktif !== "Nonaktif").map((p) => {
      const a = (sdm.data.absensi ?? []).filter((x) => x.pegawai === p.id && String(x.tanggal ?? "").startsWith(bulan));
      const hitung = (s: string) => a.filter((x) => x.status === s).length;
      return { p, hadir: hitung("Hadir"), izin: hitung("Izin"), sakit: hitung("Sakit"), cuti: hitung("Cuti"), alpa: hitung("Alpa"), libur: hitung("Libur") };
    });
  }, [pegawai, sdm.data.absensi, bulan]);

  if (!sdm.siap) return <section className={kartu}><p className="text-sm text-panel-utama/70">{sdm.galatMuat || "Memuat…"}</p></section>;

  const pilihBulan = (
    <label className="ml-auto flex items-center gap-2 text-[0.8125rem] font-semibold text-panel-utama">
      Bulan
      <input type="month" value={bulan} onChange={(e) => e.target.value && setBulan(e.target.value)} className="rounded-xl border border-panel-garis bg-white px-3 py-2 text-[0.875rem]" />
    </label>
  );

  return (
    <div className="grid gap-5">
      <KepalaModul judul="SDM & Gaji" filter={filter} ket="Pegawai, absensi, estimasi biaya gaji, asuransi kesehatan, dan inventaris serta kebutuhan pegawai." hanyaLihat={sdm.akses === "baca"} />
      <div className="flex flex-wrap items-center gap-3">
        <TabBar
          tabs={[
            { id: "biaya", label: "Biaya gaji", jumlah: peringatan.length },
            { id: "pegawai", label: "Pegawai" },
            { id: "absensi", label: "Absensi" },
            { id: "asuransi", label: "Asuransi" },
            { id: "inventaris", label: "Inventaris & kebutuhan", jumlah: kebutuhan.jumlah },
            { id: "sertifikat", label: "Sertifikat magang" },
            { id: "acuan", label: "Angka acuan" },
          ]}
          aktif={tab}
          onPilih={setTab}
        />
        {(tab === "biaya" || tab === "absensi") && pilihBulan}
      </div>

      {tab === "biaya" && (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Stat judul="Biaya gaji per bulan" nilai={fmt(total.biaya)} ket={`${gaji.length} pegawai aktif; per tahun ${fmt(total.biaya * 12)}`} />
            <Stat judul="Gaji dan tunjangan" nilai={fmt(total.upah)} />
            <Stat judul="Iuran BPJS perusahaan" nilai={fmt(total.iuran)} ket="Kesehatan, JHT, JP, JKK, JKM" />
            <Stat judul="Cadangan THR" nilai={fmt(total.thr)} ket="Per bulan, supaya THR tidak mengejutkan" />
          </div>
          {peringatan.length > 0 && (
            <ul className="grid gap-2">{peringatan.map((w) => <li key={w} role="alert" className="rounded-2xl bg-panel-merah-lembut px-4 py-3 text-[0.875rem] text-panel-merah">{w}</li>)}</ul>
          )}
          <section className={kartu}>
            <p className={judulKecil}>Estimasi gaji per pegawai</p>
            <p className="mt-1 text-[0.8125rem] text-panel-utama/70">Biaya penuh perusahaan, dan perkiraan yang diterima pegawai bulan dipilih (setelah potongan alpa dan iuran pekerja; tanpa PPh 21).</p>
            {gaji.length === 0 ? (
              <p className="mt-3 rounded-2xl bg-panel-latar px-4 py-5 text-center text-[0.875rem] text-panel-utama/70">Belum ada pegawai aktif. Tambahkan di tab Pegawai.</p>
            ) : (
              <div className="mt-3 overflow-x-auto">
                <table className="w-full min-w-[44rem] border-collapse text-left text-[0.875rem] text-panel-utama">
                  <thead><tr className="text-[0.75rem] font-bold text-panel-utama/60"><th className="px-2 py-2">Pegawai</th>{filter === "all" && <th className="px-2 py-2">Unit</th>}<th className="px-2 py-2 text-right">Gaji + tunjangan</th><th className="px-2 py-2 text-right">Iuran perusahaan</th><th className="px-2 py-2 text-right">THR/bln</th><th className="px-2 py-2 text-right">Biaya penuh</th><th className="px-2 py-2 text-right">Alpa</th><th className="px-2 py-2 text-right">Diterima</th></tr></thead>
                  <tbody>
                    {gaji.map((b) => (
                      <tr key={b.id} className="border-t border-panel-garis">
                        <td className="px-2 py-2"><span className="font-semibold">{b.nama}</span><span className="block text-[0.75rem] text-panel-utama/60">{b.jabatan}</span></td>
                        {filter === "all" && <td className="px-2 py-2 text-panel-utama/70">{namaUnit(b.unit).split(" ")[0]}</td>}
                        <td className={`px-2 py-2 text-right tabular-nums ${b.dibawahUmp ? "font-bold text-panel-merah" : ""}`}>{fmt(b.upah)}</td>
                        <td className="px-2 py-2 text-right tabular-nums">{fmt(b.iuranPerusahaan)}</td>
                        <td className="px-2 py-2 text-right tabular-nums">{fmt(b.thr)}</td>
                        <td className="px-2 py-2 text-right font-semibold tabular-nums">{fmt(b.biaya)}</td>
                        <td className="px-2 py-2 text-right tabular-nums">{b.alpa ? `${b.alpa} hari (−${fmt(b.potonganAlpa)})` : "—"}</td>
                        <td className="px-2 py-2 text-right tabular-nums">{fmt(b.diterima)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot><tr className="border-t-2 border-panel-utama font-bold"><td className="px-2 py-2" colSpan={filter === "all" ? 5 : 4}>Total</td><td className="px-2 py-2 text-right tabular-nums">{fmt(total.biaya)}</td><td className="px-2 py-2" /><td className="px-2 py-2 text-right tabular-nums">{fmt(total.diterima)}</td></tr></tfoot>
                </table>
              </div>
            )}
          </section>
        </>
      )}

      {tab === "pegawai" && <TabelModul modul={sdm} koleksiId="pegawai" filter={filter} urut={(a, b) => String(a.nama).localeCompare(String(b.nama))} ket="Gaji pokok dan tunjangan dipakai di estimasi biaya gaji." kosong="Belum ada pegawai. Tekan Tambah dan isi data yang sebenarnya." />}

      {tab === "absensi" && (
        <>
          <AbsenHarian modul={sdm} filter={filter} hariIni={hariIni} />
          <section className={kartu}>
            <p className={judulKecil}>Rekap bulan dipilih</p>
            {rekap.length === 0 ? (
              <p className="mt-2 text-[0.875rem] text-panel-utama/70">Belum ada pegawai aktif.</p>
            ) : (
              <div className="mt-3 overflow-x-auto">
                <table className="w-full min-w-[34rem] border-collapse text-left text-[0.875rem] text-panel-utama">
                  <thead><tr className="text-[0.75rem] font-bold text-panel-utama/60"><th className="px-2 py-2">Pegawai</th><th className="px-2 py-2 text-right">Hadir</th><th className="px-2 py-2 text-right">Izin</th><th className="px-2 py-2 text-right">Sakit</th><th className="px-2 py-2 text-right">Cuti</th><th className="px-2 py-2 text-right">Libur</th><th className="px-2 py-2 text-right">Alpa</th></tr></thead>
                  <tbody>{rekap.map((r) => <tr key={r.p.id} className="border-t border-panel-garis"><td className="px-2 py-2 font-semibold">{String(r.p.nama)}</td><td className="px-2 py-2 text-right tabular-nums">{r.hadir}</td><td className="px-2 py-2 text-right tabular-nums">{r.izin}</td><td className="px-2 py-2 text-right tabular-nums">{r.sakit}</td><td className="px-2 py-2 text-right tabular-nums">{r.cuti}</td><td className="px-2 py-2 text-right tabular-nums">{r.libur}</td><td className={`px-2 py-2 text-right tabular-nums ${r.alpa ? "font-bold text-panel-merah" : ""}`}>{r.alpa}</td></tr>)}</tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}

      {tab === "asuransi" && <TabelModul modul={sdm} koleksiId="asuransi" filter={filter} ket="Kepesertaan BPJS dan asuransi tiap pegawai. Pegawai yang belum tercatat muncul di peringatan tab Biaya gaji." kosong="Belum ada kepesertaan. Tekan Tambah untuk mencatat BPJS atau asuransi pegawai." />}

      {tab === "inventaris" && (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Stat judul="Barang yang masih kurang" nilai={String(kebutuhan.jumlah)} nada={kebutuhan.jumlah ? "merah" : undefined} ket="Jumlah yang dibutuhkan lebih besar dari yang ada" />
            <Stat judul="Estimasi biaya kebutuhan" nilai={fmt(kebutuhan.biaya)} ket={kebutuhan.tanpaHarga ? `${kebutuhan.tanpaHarga} barang yang kurang belum diberi perkiraan harga` : "Kekurangan × perkiraan harga satuan"} />
          </div>
          <TabelModul modul={sdm} koleksiId="inventaris" filter={filter} urut={(a, b) => String(a.barang).localeCompare(String(b.barang))} ket="Barang yang dipegang pegawai dan yang masih dibutuhkan: seragam, alat kerja, alat keselamatan." kosong="Belum ada barang. Tekan Tambah, misalnya seragam atau alat kerja." kolomTambahan={[{ judul: "Kurang", kanan: true, isi: (r) => Math.max(0, Number(r.butuh) - Number(r.punya)) || "—" }]} />
        </>
      )}

      {tab === "sertifikat" && <SertifikatMagang modul={sdm} filter={filter} hariIni={hariIni} />}

      {tab === "acuan" && <Acuan modul={sdm} />}
    </div>
  );
}
