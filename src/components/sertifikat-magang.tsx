"use client";

import { useMemo, useState } from "react";

import { TabelModul, kartu, judulKecil, namaUnit, tombolTepi, tombolUtama, cocokUnit, type DataModul, type FilterUnit } from "@/components/data-modul";
import { PROPERTIES } from "@/lib/data";
import { fmtDate } from "@/lib/format";
import type { Rekaman } from "@/lib/modul";
import { amankanTeks, buatSertifikatPdf, namaBerkasSertifikat, type DataSertifikat } from "@/lib/sertifikat-pdf";
import type { PropertyKey } from "@/lib/types";
import { PROPERTY } from "@/lib/web-content";

/** Penerbit, alamat, logo, dan warna per unit. Dive Center diterbitkan atas nama Turtle. */
function identitas(unit: PropertyKey): Pick<DataSertifikat, "penerbit" | "alamat" | "logo" | "warna"> {
  if (unit === "eddo") {
    const p = PROPERTIES.find((x) => x.key === "eddo");
    return { penerbit: p?.name ?? "Eddo Homestay", alamat: `${p?.location ?? ""}, Raja Ampat`, logo: "/eddo-logo.webp", warna: [31, 91, 120] };
  }
  return { penerbit: PROPERTY.name, alamat: `${PROPERTY.village}, ${PROPERTY.island}, Raja Ampat`, logo: "/logo.png", warna: [43, 84, 67] };
}

async function unduh(r: Rekaman) {
  const blob = await buatSertifikatPdf({
    nomor: String(r.nomor ?? ""),
    nama: String(r.nama ?? ""),
    posisi: String(r.posisi ?? ""),
    mulai: String(r.mulai ?? ""),
    selesai: String(r.selesai ?? ""),
    terbit: String(r.terbit ?? ""),
    kota: String(r.kota ?? ""),
    penandatangan: String(r.penandatangan ?? ""),
    jabatanTtd: String(r.jabatanTtd ?? ""),
    bahasa: (String(r.bahasa ?? "") as DataSertifikat["bahasa"]) || "Indonesia dan English",
    catatan: String(r.catatan ?? ""),
    ...identitas(r.unit),
  });
  const url = URL.createObjectURL(blob);
  const tautan = document.createElement("a");
  tautan.href = url;
  tautan.download = namaBerkasSertifikat(String(r.nama ?? ""));
  document.body.appendChild(tautan);
  tautan.click();
  tautan.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

const isian = "w-full rounded-xl border border-panel-garis bg-panel-latar px-3 py-2 text-[0.875rem] text-panel-utama outline-none focus:border-panel-aksen";

/** Formulir terbit: diisi dari data pegawai, sisanya orangnya yang menentukan. */
function FormTerbit({ p, modul, hariIni, onTutup }: { p: Rekaman; modul: DataModul; hariIni: string; onTutup: () => void }) {
  const lama = (modul.data.sertifikat ?? []).slice().sort((x, y) => String(y.terbit ?? "").localeCompare(String(x.terbit ?? "")));
  const tahun = hariIni.slice(0, 4);
  const urut = (modul.data.sertifikat ?? []).filter((x) => String(x.terbit ?? "").startsWith(tahun)).length + 1;
  const [v, setV] = useState<Record<string, string>>({
    nomor: `MAGANG-${tahun}-${String(urut).padStart(3, "0")}`,
    nama: String(p.nama ?? ""),
    posisi: String(p.jabatan ?? ""),
    mulai: String(p.mulai ?? ""),
    selesai: String(p.selesai ?? ""),
    terbit: hariIni,
    kota: String(lama[0]?.kota ?? "Raja Ampat"),
    penandatangan: String(lama[0]?.penandatangan ?? ""),
    jabatanTtd: String(lama[0]?.jabatanTtd ?? ""),
    bahasa: String(lama[0]?.bahasa ?? "Indonesia dan English"),
    catatan: "",
  });
  const [galat, setGalat] = useState("");
  const [sibuk, setSibuk] = useState(false);
  const ubah = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setV((x) => ({ ...x, [k]: e.target.value }));
  const hurufDiubah = amankanTeks(v.nama).diubah || amankanTeks(v.posisi).diubah;

  const simpan = async () => {
    if (v.mulai && v.selesai && v.selesai < v.mulai) return setGalat("Tanggal selesai lebih awal dari tanggal mulai.");
    setSibuk(true);
    setGalat("");
    const g = await modul.simpan("sertifikat", p.unit, { ...v, pegawai: p.id });
    if (g) {
      setGalat(g);
      setSibuk(false);
      return;
    }
    await unduh({ ...v, id: "", unit: p.unit } as Rekaman);
    onTutup();
  };

  const bidang: [string, string, string?][] = [
    ["nomor", "Nomor sertifikat", "Usulan urutan tahun ini; ubah sesuai penomoran Anda."],
    ["nama", "Nama di sertifikat"],
    ["posisi", "Bidang atau posisi magang", "Misalnya Front office, Housekeeping, Dive center."],
  ];
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-panel-utama/40 p-4" onPointerDown={(e) => e.target === e.currentTarget && onTutup()}>
      <div role="dialog" aria-modal="true" aria-label="Terbitkan sertifikat magang" className="max-h-[92vh] w-full max-w-[36rem] overflow-y-auto rounded-3xl bg-white p-5 shadow-panel-angkat">
        <p className={judulKecil}>Sertifikat magang · {namaUnit(p.unit)}</p>
        <h2 className="mt-1 text-[1.25rem] font-bold text-panel-utama">{String(p.nama)}</h2>
        <div className="mt-4 grid gap-3">
          {bidang.map(([k, label, ket]) => (
            <label key={k} className="grid gap-1 text-[0.8125rem] font-semibold text-panel-utama">
              {label}
              <input value={v[k]} onChange={ubah(k)} maxLength={120} className={isian} />
              {ket && <span className="text-[0.75rem] font-normal text-panel-utama/60">{ket}</span>}
            </label>
          ))}
          <div className="grid gap-3 sm:grid-cols-3">
            {([["mulai", "Mulai magang"], ["selesai", "Selesai magang"], ["terbit", "Tanggal terbit"]] as const).map(([k, label]) => (
              <label key={k} className="grid gap-1 text-[0.8125rem] font-semibold text-panel-utama">
                {label}
                <input type="date" value={v[k]} onChange={ubah(k)} className={isian} />
              </label>
            ))}
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-1 text-[0.8125rem] font-semibold text-panel-utama">
              Nama penandatangan
              <input value={v.penandatangan} onChange={ubah("penandatangan")} maxLength={120} className={isian} />
            </label>
            <label className="grid gap-1 text-[0.8125rem] font-semibold text-panel-utama">
              Jabatan penandatangan
              <input value={v.jabatanTtd} onChange={ubah("jabatanTtd")} maxLength={120} placeholder="Misalnya Pemilik atau Manajer" className={isian} />
            </label>
            <label className="grid gap-1 text-[0.8125rem] font-semibold text-panel-utama">
              Tempat terbit
              <input value={v.kota} onChange={ubah("kota")} maxLength={120} className={isian} />
            </label>
            <label className="grid gap-1 text-[0.8125rem] font-semibold text-panel-utama">
              Bahasa
              <select value={v.bahasa} onChange={ubah("bahasa")} className={isian}>
                {["Indonesia dan English", "Indonesia", "English"].map((b) => <option key={b}>{b}</option>)}
              </select>
            </label>
          </div>
          <label className="grid gap-1 text-[0.8125rem] font-semibold text-panel-utama">
            Kalimat tambahan (opsional)
            <textarea rows={2} value={v.catatan} onChange={ubah("catatan")} maxLength={200} placeholder="Misalnya: dengan hasil sangat baik" className={`${isian} resize-none`} />
          </label>
          {hurufDiubah && <p className="rounded-2xl bg-amber-100 px-4 py-2 text-[0.8125rem] text-amber-950">Ada huruf yang tidak tersedia di huruf PDF (misalnya ń atau ł); di sertifikat ditulis tanpa tanda, seperti n atau l.</p>}
        </div>
        {galat && <p role="alert" className="mt-3 rounded-2xl bg-panel-merah-lembut px-4 py-3 text-[0.875rem] text-panel-merah">{galat}</p>}
        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" disabled={sibuk} onClick={() => void simpan()} className={tombolUtama}>{sibuk ? "Membuat…" : "Terbitkan dan unduh PDF"}</button>
          <button type="button" onClick={onTutup} className={tombolTepi}>Batal</button>
        </div>
        <p className="mt-3 text-[0.75rem] text-panel-utama/60">Sertifikat tersimpan di riwayat di bawah dan bisa diunduh lagi kapan saja.</p>
      </div>
    </div>
  );
}

/**
 * Sertifikat magang di SDM: pegawai berstatus Magang, tombol terbitkan, dan
 * riwayat sertifikat yang bisa diunduh ulang sebagai PDF.
 */
export function SertifikatMagang({ modul, filter, hariIni }: { modul: DataModul; filter: FilterUnit; hariIni: string }) {
  const [terbit, setTerbit] = useState<Rekaman | null>(null);
  const [sibuk, setSibuk] = useState("");
  const bolehTulis = modul.tulisKoleksi.includes("sertifikat");
  const magang = useMemo(
    () => (modul.data.pegawai ?? []).filter((p) => p.status === "Magang" && cocokUnit(filter, p.unit)).sort((a, b) => String(b.selesai ?? "").localeCompare(String(a.selesai ?? ""))),
    [modul.data.pegawai, filter],
  );
  const jumlahSertifikat = (id: string) => (modul.data.sertifikat ?? []).filter((s) => s.pegawai === id).length;

  return (
    <div className="grid gap-5">
      <section className={kartu}>
        <p className={judulKecil}>Pegawai magang</p>
        <p className="mt-1 text-[0.8125rem] text-panel-utama/70">Pegawai dengan status kerja Magang. Isi tanggal Selesai kerja di tab Pegawai bila magangnya sudah berakhir.</p>
        {magang.length === 0 ? (
          <p className="mt-3 rounded-2xl bg-panel-latar px-4 py-5 text-center text-[0.875rem] text-panel-utama/70">Belum ada pegawai berstatus Magang di unit ini.</p>
        ) : (
          <ul className="mt-3 grid gap-2">
            {magang.map((p) => {
              const n = jumlahSertifikat(p.id);
              const selesai = p.selesai && String(p.selesai) <= hariIni;
              return (
                <li key={p.id} className="flex flex-wrap items-center gap-3 rounded-2xl bg-panel-latar px-4 py-3">
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[0.9375rem] font-semibold text-panel-utama">{String(p.nama)}</span>
                    <span className="block text-[0.75rem] text-panel-utama/65">
                      {String(p.jabatan)} · {p.mulai ? fmtDate(String(p.mulai)) : "mulai belum diisi"} – {p.selesai ? fmtDate(String(p.selesai)) : "selesai belum diisi"}
                      {filter === "all" ? ` · ${namaUnit(p.unit)}` : ""}
                    </span>
                  </span>
                  <span className={`rounded-full px-2 py-[2px] text-[11px] font-bold ${n ? "bg-panel-lembut text-panel-aksen" : selesai ? "bg-amber-100 text-amber-900" : "bg-white text-panel-utama/60 ring-1 ring-panel-garis"}`}>
                    {n ? `${n} sertifikat` : selesai ? "Selesai, belum bersertifikat" : "Masih magang"}
                  </span>
                  {bolehTulis && <button type="button" onClick={() => setTerbit(p)} className={tombolUtama}>Buat sertifikat</button>}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <TabelModul
        modul={modul}
        koleksiId="sertifikat"
        filter={filter}
        judul="Riwayat sertifikat"
        ket="Pilih baris untuk mengubah isinya; tombol Unduh membuat PDF-nya lagi."
        kosong="Belum ada sertifikat yang diterbitkan."
        urut={(a, b) => String(b.terbit ?? "").localeCompare(String(a.terbit ?? ""))}
        kolomTambahan={[
          {
            judul: "PDF",
            isi: (r) => (
              <button
                type="button"
                disabled={sibuk === r.id}
                onClick={async (e) => {
                  e.stopPropagation();
                  setSibuk(r.id);
                  await unduh(r).catch(() => undefined);
                  setSibuk("");
                }}
                className="cursor-pointer rounded-full border border-panel-utama bg-white px-3 py-1 text-[0.75rem] font-bold text-panel-utama hover:bg-panel-latar disabled:opacity-50"
              >
                {sibuk === r.id ? "Membuat…" : "Unduh"}
              </button>
            ),
          },
        ]}
      />

      {terbit && <FormTerbit p={terbit} modul={modul} hariIni={hariIni} onTutup={() => setTerbit(null)} />}
    </div>
  );
}
