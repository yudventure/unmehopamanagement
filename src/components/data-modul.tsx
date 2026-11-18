"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { PROPERTIES } from "@/lib/data";
import { fmt, fmtDate } from "@/lib/format";
import { KOLEKSI, PARAMETER_AWAL, type Bidang, type Koleksi, type Modul, type ParameterSdm, type Rekaman } from "@/lib/modul";
import type { PropertyKey } from "@/lib/types";

export type FilterUnit = "all" | PropertyKey;

export interface DataModul {
  siap: boolean;
  galatMuat: string;
  data: Record<string, Rekaman[]>;
  akses: "tulis" | "baca";
  tulisKoleksi: string[];
  unit: PropertyKey[];
  parameter: ParameterSdm;
  bolehUbahParameter: boolean;
  muat: () => Promise<void>;
  simpan: (koleksi: string, unit: PropertyKey, data: Record<string, unknown>, id?: string) => Promise<string | null>;
  hapus: (koleksi: string, id: string) => Promise<string | null>;
  simpanParameter: (p: ParameterSdm) => Promise<string | null>;
}

/** Memuat dan menyimpan data satu modul. Semua pemeriksaan sebenarnya di server; ini hanya penghubung. */
export function useModul(modul: Modul): DataModul {
  const [s, setS] = useState<{ siap: boolean; galatMuat: string; data: Record<string, Rekaman[]>; akses: "tulis" | "baca"; tulisKoleksi: string[]; unit: PropertyKey[]; parameter: ParameterSdm; bolehUbahParameter: boolean }>({
    siap: false, galatMuat: "", data: {}, akses: "baca", tulisKoleksi: [], unit: [], parameter: PARAMETER_AWAL, bolehUbahParameter: false,
  });

  const muat = useCallback(async () => {
    try {
      const r = await fetch(`/api/modul/${modul}`, { cache: "no-store" });
      if (!r.ok) return setS((x) => ({ ...x, galatMuat: "Data belum bisa dimuat dari server." }));
      const o = await r.json();
      setS({ siap: true, galatMuat: "", data: o.data ?? {}, akses: o.akses, tulisKoleksi: o.tulisKoleksi ?? [], unit: o.unit ?? [], parameter: o.parameter ?? PARAMETER_AWAL, bolehUbahParameter: Boolean(o.bolehUbahParameter) });
    } catch {
      setS((x) => ({ ...x, galatMuat: "Tidak bisa menghubungi server." }));
    }
  }, [modul]);
  useEffect(() => void muat(), [muat]);

  const kirim = async (url: string, method: string, body?: unknown): Promise<string | null> => {
    try {
      const r = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
      if (r.ok) {
        await muat();
        return null;
      }
      const o = (await r.json().catch(() => ({}))) as { galat?: string };
      return o.galat ?? (r.status === 404 ? "Anda tidak berhak mengubah ini." : `Server menjawab ${r.status}.`);
    } catch {
      return "Tidak bisa menghubungi server.";
    }
  };

  return {
    ...s,
    muat,
    simpan: (koleksi, unit, data, id) => kirim(`/api/modul/${modul}`, "POST", { koleksi, unit, data, id }),
    hapus: (koleksi, id) => kirim(`/api/modul/${modul}?koleksi=${encodeURIComponent(koleksi)}&id=${encodeURIComponent(id)}`, "DELETE"),
    simpanParameter: (parameter) => kirim(`/api/modul/${modul}`, "PUT", { parameter }),
  };
}

/** Dive Center dijalankan Turtle, jadi melihat Turtle berarti melihat Dive Center juga. */
export const cocokUnit = (filter: FilterUnit, unit: string) => filter === "all" || filter === unit || (filter === "turtle" && unit === "divecenter");

export const namaUnit = (u: string) => PROPERTIES.find((p) => p.key === u)?.name ?? u;

export const kartu = "rounded-3xl bg-white p-5 ring-1 ring-panel-garis";
export const judulKecil = "text-[11px] font-bold tracking-[0.16em] text-panel-aksen uppercase";
const isian = "w-full rounded-xl border border-panel-garis bg-panel-latar px-3 py-2 text-[0.875rem] text-panel-utama outline-none focus:border-panel-aksen";
export const tombolUtama = "cursor-pointer rounded-full border-none bg-panel-utama px-5 py-2 text-[0.875rem] font-bold text-white hover:bg-panel-utama-2 disabled:cursor-not-allowed disabled:opacity-50";
export const tombolTepi = "cursor-pointer rounded-full border border-panel-utama bg-white px-4 py-2 text-[0.8125rem] font-bold text-panel-utama hover:bg-panel-latar disabled:cursor-not-allowed disabled:opacity-50";

/** Nama yang tampil untuk sebuah catatan yang dirujuk: pegawai atau barang. */
export const namaRekaman = (r?: Rekaman) => String(r?.nama ?? r?.barang ?? "");

function sel(b: Bidang, nilai: string | number | undefined, rujukan: Record<string, Rekaman[]>) {
  if (nilai === undefined || nilai === "") return "";
  if (b.tipe === "rujuk") return namaRekaman((rujukan[b.ke!] ?? []).find((x) => x.id === nilai)) || "(sudah dihapus)";
  if (b.tipe === "tanggal") return fmtDate(String(nilai));
  if (b.tipe === "angka") return b.satuan === "Rp" ? fmt(Number(nilai)) : `${Number(nilai).toLocaleString("id-ID")}${b.satuan ? ` ${b.satuan}` : ""}`;
  return String(nilai);
}

/** Formulir tambah atau ubah satu catatan, dibangun dari skema koleksinya. */
function FormRekaman({
  k, awal, unitPilihan, unitAwal, rujukan, bolehHapus, onSimpan, onHapus, onTutup,
}: {
  k: Koleksi;
  awal?: Rekaman;
  unitPilihan: PropertyKey[];
  unitAwal: PropertyKey;
  rujukan: Record<string, Rekaman[]>;
  bolehHapus: boolean;
  onSimpan: (unit: PropertyKey, data: Record<string, unknown>) => Promise<string | null>;
  onHapus?: () => Promise<string | null>;
  onTutup: () => void;
}) {
  const [unit, setUnit] = useState<PropertyKey>(awal?.unit ?? unitAwal);
  const [nilai, setNilai] = useState<Record<string, string | number>>(() => {
    const o: Record<string, string | number> = {};
    for (const b of k.bidang) o[b.k] = (awal?.[b.k] as string | number | undefined) ?? b.awal ?? "";
    return o;
  });
  const [galat, setGalat] = useState("");
  const [sibuk, setSibuk] = useState(false);

  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === "Escape" && onTutup();
    document.addEventListener("keydown", esc);
    return () => document.removeEventListener("keydown", esc);
  }, [onTutup]);

  const kirim = async () => {
    setSibuk(true);
    setGalat("");
    const g = await onSimpan(unit, nilai);
    if (g) {
      setGalat(g);
      setSibuk(false);
    } else onTutup();
  };
  const hapus = async () => {
    if (!onHapus || !window.confirm("Hapus catatan ini? Ini tidak bisa dibatalkan.")) return;
    setSibuk(true);
    const g = await onHapus();
    if (g) {
      setGalat(g);
      setSibuk(false);
    } else onTutup();
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-panel-utama/40 p-4" onPointerDown={(e) => e.target === e.currentTarget && onTutup()}>
      <div role="dialog" aria-modal="true" aria-label={k.judul} className="max-h-[90vh] w-full max-w-[34rem] overflow-y-auto rounded-3xl bg-white p-5 shadow-panel-angkat">
        <div className="mb-4 flex items-start gap-3">
          <div>
            <p className={judulKecil}>{awal ? "Ubah" : "Tambah"}</p>
            <h2 className="text-[1.25rem] font-bold text-panel-utama">{k.judul}</h2>
          </div>
          <button type="button" onClick={onTutup} aria-label="Tutup" className="ml-auto flex size-9 cursor-pointer items-center justify-center rounded-full border-none bg-panel-latar text-panel-utama hover:bg-panel-lembut">✕</button>
        </div>

        <div className="grid gap-3">
          {unitPilihan.length > 1 && !awal && (
            <label className="grid gap-1 text-[0.8125rem] font-semibold text-panel-utama">
              Unit
              <select value={unit} onChange={(e) => setUnit(e.target.value as PropertyKey)} className={isian}>
                {unitPilihan.map((u) => <option key={u} value={u}>{namaUnit(u)}</option>)}
              </select>
            </label>
          )}
          {k.bidang.map((b) => (
            <label key={b.k} className="grid gap-1 text-[0.8125rem] font-semibold text-panel-utama">
              <span>{b.label}{b.wajib ? <span className="text-panel-merah"> *</span> : null}</span>
              {b.tipe === "pilih" ? (
                <select value={nilai[b.k]} onChange={(e) => setNilai((n) => ({ ...n, [b.k]: e.target.value }))} className={isian}>
                  {!b.wajib || nilai[b.k] === "" ? <option value="">{b.wajib ? "Pilih…" : "—"}</option> : null}
                  {b.opsi!.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              ) : b.tipe === "rujuk" ? (
                <select value={nilai[b.k]} onChange={(e) => setNilai((n) => ({ ...n, [b.k]: e.target.value }))} className={isian}>
                  <option value="">{b.wajib ? "Pilih…" : "—"}</option>
                  {(rujukan[b.ke!] ?? []).filter((x) => x.unit === unit).map((x) => <option key={x.id} value={x.id}>{namaRekaman(x)}</option>)}
                </select>
              ) : b.tipe === "catatan" ? (
                <textarea rows={2} maxLength={400} value={nilai[b.k]} onChange={(e) => setNilai((n) => ({ ...n, [b.k]: e.target.value }))} className={`${isian} resize-none`} />
              ) : b.tipe === "angka" ? (
                <span className="flex items-center gap-2">
                  {b.satuan === "Rp" && <span className="text-panel-utama/70">Rp</span>}
                  <input type="number" inputMode="decimal" step="any" min={b.negatif ? undefined : 0} value={nilai[b.k]} onChange={(e) => setNilai((n) => ({ ...n, [b.k]: e.target.value }))} className={isian} />
                  {b.satuan && b.satuan !== "Rp" && <span className="shrink-0 text-panel-utama/70">{b.satuan}</span>}
                </span>
              ) : (
                <input type={b.tipe === "tanggal" ? "date" : "text"} maxLength={120} value={nilai[b.k]} onChange={(e) => setNilai((n) => ({ ...n, [b.k]: e.target.value }))} className={isian} />
              )}
              {b.ket && <span className="text-[0.75rem] font-normal text-panel-utama/60">{b.ket}</span>}
            </label>
          ))}
        </div>

        {galat && <p role="alert" className="mt-3 rounded-2xl bg-panel-merah-lembut px-4 py-3 text-[0.875rem] text-panel-merah">{galat}</p>}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button type="button" disabled={sibuk} onClick={() => void kirim()} className={tombolUtama}>{sibuk ? "Menyimpan…" : "Simpan"}</button>
          <button type="button" onClick={onTutup} className={tombolTepi}>Batal</button>
          {awal && bolehHapus && (
            <button type="button" disabled={sibuk} onClick={() => void hapus()} className="ml-auto cursor-pointer rounded-full border border-panel-merah bg-white px-4 py-2 text-[0.8125rem] font-bold text-panel-merah hover:bg-panel-merah-lembut disabled:opacity-50">Hapus</button>
          )}
        </div>
        {awal?.diubahOleh && <p className="mt-3 text-[0.75rem] text-panel-utama/60">Terakhir diubah oleh {String(awal.diubahOleh)}.</p>}
      </div>
    </div>
  );
}

export interface KolomTambahan {
  judul: string;
  isi: (r: Rekaman) => React.ReactNode;
  kanan?: boolean;
}

/**
 * Tabel satu koleksi dengan tombol tambah dan ubah, dibangun dari skema.
 * Unit mengikuti pilihan di menu: satu unit tidak menampilkan kolom unit.
 */
export function TabelModul({
  modul, koleksiId, filter, urut, judul, ket, kosong, kolomTambahan = [], rujukan = {}, saring,
}: {
  modul: DataModul;
  koleksiId: string;
  filter: FilterUnit;
  urut?: (a: Rekaman, b: Rekaman) => number;
  judul?: string;
  ket?: string;
  kosong?: string;
  kolomTambahan?: KolomTambahan[];
  rujukan?: Record<string, Rekaman[]>;
  saring?: (r: Rekaman) => boolean;
}) {
  const k = KOLEKSI.find((x) => x.id === koleksiId)!;
  const [form, setForm] = useState<{ rekaman?: Rekaman } | null>(null);
  const bolehTulis = modul.tulisKoleksi.includes(koleksiId);
  const bolehHapus = bolehTulis && !modul.tulisKoleksi.every((x) => x === "mutasi");
  const unitPilihan = modul.unit.filter((u) => cocokUnit(filter, u));
  const rows = useMemo(() => {
    const l = (modul.data[koleksiId] ?? []).filter((r) => cocokUnit(filter, r.unit) && (!saring || saring(r)));
    return l.sort(urut ?? ((a, b) => String(b.tanggal ?? b.dibuat ?? "").localeCompare(String(a.tanggal ?? a.dibuat ?? ""))));
  }, [modul.data, koleksiId, filter, urut, saring]);
  const bidang = k.kolom.map((c) => k.bidang.find((b) => b.k === c)!);
  const rujuk = { ...modul.data, ...rujukan };

  return (
    <div className={kartu}>
      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className={judulKecil}>{judul ?? k.judul}</p>
          {ket && <p className="mt-1 text-[0.8125rem] leading-[1.5] text-panel-utama/70">{ket}</p>}
        </div>
        {bolehTulis && unitPilihan.length > 0 && <button type="button" onClick={() => setForm({})} className={tombolUtama}>+ Tambah</button>}
      </div>

      {rows.length === 0 ? (
        <p className="mt-3 rounded-2xl bg-panel-latar px-4 py-5 text-center text-[0.875rem] text-panel-utama/70">{kosong ?? `Belum ada ${k.satuanJamak}.`}</p>
      ) : (
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[34rem] border-collapse text-left text-[0.875rem] text-panel-utama">
            <thead>
              <tr className="text-[0.75rem] font-bold text-panel-utama/60">
                {filter === "all" && <th className="px-2 py-2">Unit</th>}
                {bidang.map((b) => <th key={b.k} className={`px-2 py-2 ${b.tipe === "angka" ? "text-right" : ""}`}>{b.label.replace(" per bulan", "")}</th>)}
                {kolomTambahan.map((c) => <th key={c.judul} className={`px-2 py-2 ${c.kanan ? "text-right" : ""}`}>{c.judul}</th>)}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} onClick={() => bolehTulis && setForm({ rekaman: r })} className={`border-t border-panel-garis ${bolehTulis ? "cursor-pointer hover:bg-panel-latar" : ""}`}>
                  {filter === "all" && <td className="px-2 py-2 text-panel-utama/70">{namaUnit(r.unit).split(" ")[0]}</td>}
                  {bidang.map((b) => <td key={b.k} className={`max-w-[16rem] truncate px-2 py-2 ${b.tipe === "angka" ? "text-right tabular-nums" : ""}`}>{sel(b, r[b.k], rujuk)}</td>)}
                  {kolomTambahan.map((c) => <td key={c.judul} className={`px-2 py-2 ${c.kanan ? "text-right tabular-nums" : ""}`}>{c.isi(r)}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {bolehTulis && rows.length > 0 && <p className="mt-2 text-[0.75rem] text-panel-utama/60">Pilih satu baris untuk mengubahnya.</p>}

      {form && (
        <FormRekaman
          k={k}
          awal={form.rekaman}
          unitPilihan={unitPilihan}
          unitAwal={unitPilihan[0] ?? "turtle"}
          rujukan={rujuk}
          bolehHapus={bolehHapus}
          onSimpan={(unit, data) => modul.simpan(koleksiId, unit, data, form.rekaman?.id)}
          onHapus={form.rekaman ? () => modul.hapus(koleksiId, form.rekaman!.id) : undefined}
          onTutup={() => setForm(null)}
        />
      )}
    </div>
  );
}

/** Deretan tab di dalam satu layar. */
export function TabBar<T extends string>({ tabs, aktif, onPilih }: { tabs: { id: T; label: string; jumlah?: number }[]; aktif: T; onPilih: (t: T) => void }) {
  return (
    <div role="tablist" className="flex flex-wrap gap-2">
      {tabs.map((t) => (
        <button
          key={t.id}
          type="button"
          role="tab"
          aria-selected={aktif === t.id}
          onClick={() => onPilih(t.id)}
          className={`cursor-pointer rounded-full border px-4 py-2 text-[0.875rem] font-semibold ${aktif === t.id ? "border-panel-utama bg-panel-utama text-white" : "border-panel-garis bg-white text-panel-utama hover:bg-panel-latar"}`}
        >
          {t.label}
          {t.jumlah ? <span className={`ml-2 rounded-full px-2 py-[1px] text-[0.75rem] ${aktif === t.id ? "bg-white/20" : "bg-panel-merah-lembut text-panel-merah"}`}>{t.jumlah}</span> : null}
        </button>
      ))}
    </div>
  );
}

/** Satu angka ringkasan. `nada` menandai yang perlu mata: merah untuk yang bermasalah. */
export function Stat({ judul, nilai, ket, nada }: { judul: string; nilai: string; ket?: string; nada?: "merah" | "hijau" }) {
  return (
    <div className={`rounded-2xl p-4 ring-1 ${nada === "merah" ? "bg-panel-merah-lembut ring-panel-merah/30" : "bg-white ring-panel-garis"}`}>
      <p className="text-[0.75rem] font-bold tracking-[0.08em] text-panel-utama/60 uppercase">{judul}</p>
      <p className={`mt-1 text-[1.4rem] leading-tight font-bold tabular-nums ${nada === "merah" ? "text-panel-merah" : nada === "hijau" ? "text-panel-aksen" : "text-panel-utama"}`}>{nilai}</p>
      {ket && <p className="mt-1 text-[0.75rem] leading-[1.4] text-panel-utama/65">{ket}</p>}
    </div>
  );
}

/** Kepala layar: nama unit yang sedang dilihat dan satu kalimat tentang isinya. */
export function KepalaModul({ judul, filter, ket, hanyaLihat }: { judul: string; filter: FilterUnit; ket: string; hanyaLihat?: boolean }) {
  return (
    <section className={kartu}>
      <p className={judulKecil}>{filter === "all" ? "Semua unit" : namaUnit(filter)}</p>
      <h1 className="mt-1 text-[1.6rem] leading-tight font-bold text-panel-utama">{judul}</h1>
      <p className="mt-1 text-sm text-panel-utama/70">{ket}</p>
      {hanyaLihat && <p className="mt-2 inline-block rounded-full bg-panel-latar px-3 py-1 text-[0.75rem] font-bold text-panel-utama/70">Hanya melihat</p>}
    </section>
  );
}

export const bulanIni = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};
