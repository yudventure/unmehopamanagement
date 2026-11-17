"use client";

import { useCallback, useEffect, useState } from "react";

export interface PeringatanGalat {
  id: string;
  jenis: "keadaan" | "catatan";
  sumber: string;
  pesan: string;
  jumlah?: number;
  terakhir?: string;
}

const tanggal = (iso?: string) => {
  if (!iso) return "";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleString("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
};

/** Memuat peringatan galat dan memuat ulang tiap dua menit. Null bila akun tidak berhak melihatnya. */
export function useGalat(aktif: boolean) {
  const [data, setData] = useState<{ peringatan: PeringatanGalat[]; bolehHapus: boolean } | null>(null);
  const muat = useCallback(async () => {
    try {
      const r = await fetch("/api/galat", { cache: "no-store" });
      if (r.ok) setData(await r.json());
    } catch {
      /* Peringatan yang tidak termuat tidak boleh merusak layar. */
    }
  }, []);
  useEffect(() => {
    if (!aktif) return;
    void muat();
    const t = setInterval(() => void muat(), 120_000);
    return () => clearInterval(t);
  }, [aktif, muat]);
  return { data: aktif ? data : null, muat };
}

/** Pita merah di atas panel: ada galat yang perlu dilihat. Tidak tampil bila bersih. */
export function PitaGalat({ jumlah, onLihat }: { jumlah: number; onLihat: () => void }) {
  if (jumlah <= 0) return null;
  return (
    <div role="alert" className="mb-4 flex flex-wrap items-center gap-3 rounded-2xl bg-panel-merah-lembut px-4 py-3 text-[0.875rem] text-panel-merah ring-1 ring-panel-merah/30">
      <span aria-hidden className="text-base">⚠</span>
      <p className="min-w-0 flex-1 font-semibold">{jumlah === 1 ? "Ada 1 galat yang perlu diperiksa." : `Ada ${jumlah} galat yang perlu diperiksa.`}</p>
      <button type="button" onClick={onLihat} className="cursor-pointer rounded-full border-none bg-panel-merah px-4 py-1.5 text-[0.8125rem] font-bold text-white hover:opacity-90">Lihat</button>
    </div>
  );
}

/** Kartu di Pengaturan: daftar galat dan, untuk yang berhak, tombol membersihkan catatan. */
export function KartuGalat({ data, muat }: { data: { peringatan: PeringatanGalat[]; bolehHapus: boolean } | null; muat: () => Promise<void> }) {
  const [sibuk, setSibuk] = useState(false);
  const hapus = async (id?: string) => {
    setSibuk(true);
    await fetch(`/api/galat${id ? `?id=${encodeURIComponent(id)}` : ""}`, { method: "DELETE" }).catch(() => null);
    await muat();
    setSibuk(false);
  };
  if (!data) return null;
  const ada = data.peringatan.length > 0;
  const adaCatatan = data.peringatan.some((p) => p.jenis === "catatan");
  return (
    <div className="rounded-3xl bg-white p-5 ring-1 ring-panel-garis">
      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-bold tracking-[0.16em] text-panel-aksen uppercase">Galat dan peringatan</p>
          <p className="mt-1 text-[1.0625rem] font-bold text-panel-utama">{ada ? `${data.peringatan.length} perlu diperiksa` : "Tidak ada galat"}</p>
        </div>
        {data.bolehHapus && adaCatatan && (
          <button type="button" disabled={sibuk} onClick={() => void hapus()} className="cursor-pointer rounded-full border border-panel-utama bg-white px-4 py-2 text-[0.8125rem] font-bold text-panel-utama hover:bg-panel-latar disabled:opacity-50">Bersihkan catatan</button>
        )}
      </div>
      {ada ? (
        <ul className="mt-3 grid gap-2">
          {data.peringatan.map((p) => (
            <li key={p.id} className="flex flex-wrap items-start gap-3 rounded-2xl bg-panel-merah-lembut px-4 py-3 text-[0.875rem] text-panel-merah">
              <div className="min-w-0 flex-1">
                <p className="font-bold">{p.sumber}{p.jumlah && p.jumlah > 1 ? ` · ${p.jumlah} kali` : ""}</p>
                <p className="mt-0.5 leading-[1.5]">{p.pesan}</p>
                {p.terakhir && <p className="mt-0.5 text-[0.75rem] opacity-75">{p.jenis === "catatan" ? "Terakhir" : "Dicoba"} {tanggal(p.terakhir)}</p>}
              </div>
              {data.bolehHapus && p.jenis === "catatan" && (
                <button type="button" disabled={sibuk} onClick={() => void hapus(p.id)} className="cursor-pointer rounded-full border border-panel-merah bg-white px-3 py-1 text-[0.75rem] font-bold text-panel-merah disabled:opacity-50">Tutup</button>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-sm text-panel-utama/70">Pembayaran, sinkronisasi kalender, sistem lama, dan pembaca screenshot sedang tidak melaporkan masalah.</p>
      )}
      <p className="mt-3 text-xs text-panel-utama/60">Keadaan yang salah (kunci bertabrakan, sambungan gagal) hilang sendiri begitu diperbaiki. Catatan galat disimpan tujuh hari.</p>
    </div>
  );
}
