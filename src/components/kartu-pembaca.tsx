"use client";

import { useCallback, useEffect, useState } from "react";

interface Info {
  ada: boolean;
  sumber: "dashboard" | "environment" | null;
  akhir: string;
  bentukBenar: boolean | null;
  diubahOleh: string | null;
  diubahPada: string | null;
  bolehUbah: boolean;
}

/**
 * Pengaturan pembaca screenshot: memasukkan kunci API Anthropic tanpa membuka
 * panel hosting. Kuncinya tulis-saja: sesudah disimpan hanya empat huruf
 * terakhir yang terlihat. Developer dan pemilik mengubah; GM melihat.
 */
export function KartuPembaca() {
  const [i, setI] = useState<Info | null>(null);
  const [kunci, setKunci] = useState("");
  const [sibuk, setSibuk] = useState(false);
  const [pesan, setPesan] = useState<{ ok: boolean; teks: string } | null>(null);

  const muat = useCallback(async () => {
    const r = await fetch("/api/pembaca", { cache: "no-store" }).catch(() => null);
    if (r?.ok) setI(await r.json());
  }, []);
  useEffect(() => void muat(), [muat]);

  const panggil = async (method: string, body?: unknown) => {
    setSibuk(true);
    setPesan(null);
    const r = await fetch("/api/pembaca", { method, headers: { "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined }).catch(() => null);
    const o = (await r?.json().catch(() => null)) as (Partial<Info> & { galat?: string; hasil?: string; pesan?: string }) | null;
    setSibuk(false);
    return { r, o };
  };

  const simpan = async () => {
    const { r, o } = await panggil("PUT", { kunci });
    if (!r?.ok) return setPesan({ ok: false, teks: o?.galat ?? "Tidak bisa menyimpan kunci." });
    setKunci("");
    setI(o as Info);
    setPesan({ ok: true, teks: "Kunci tersimpan. Tekan Tes kunci untuk memastikan diterima." });
  };
  const hapus = async () => {
    if (!window.confirm("Hapus kunci yang disimpan di dashboard? Bila ada kunci di environment server, itu yang dipakai.")) return;
    const { r, o } = await panggil("DELETE");
    if (r?.ok) { setI(o as Info); setPesan({ ok: true, teks: "Kunci dihapus." }); } else setPesan({ ok: false, teks: "Tidak bisa menghapus kunci." });
  };
  const tes = async () => {
    const { o } = await panggil("POST");
    setPesan({ ok: o?.hasil === "diterima", teks: o?.pesan ?? o?.galat ?? "Tes belum bisa dijalankan." });
  };

  if (!i) return <div className="rounded-3xl bg-white p-5 ring-1 ring-panel-garis"><p className="text-[11px] font-bold tracking-[0.16em] text-panel-aksen uppercase">Pembaca screenshot</p><p className="mt-2 text-sm text-panel-utama/70">Memuat…</p></div>;

  return (
    <div className="rounded-3xl bg-white p-5 ring-1 ring-panel-garis">
      <p className="text-[11px] font-bold tracking-[0.16em] text-panel-aksen uppercase">Pembaca screenshot</p>
      <div className="mt-1 flex flex-wrap items-center gap-2">
        <p className="text-[1.0625rem] font-bold text-panel-utama">{i.ada ? "Aktif" : "Belum aktif"}</p>
        <span className={`rounded-full px-2 py-[2px] text-[11px] font-bold ${i.ada ? "bg-panel-lembut text-panel-aksen" : "bg-panel-merah-lembut text-panel-merah"}`}>
          {i.ada ? `kunci …${i.akhir} dari ${i.sumber === "dashboard" ? "dashboard" : "environment server"}` : "kunci kosong"}
        </span>
      </div>
      <p className="mt-2 text-[0.8125rem] leading-[1.55] text-panel-utama/75">
        Membaca screenshot pesan booking (misalnya WhatsApp Stay Raja Ampat) di Kalender, menjadi usulan pesanan yang tetap Anda periksa sebelum disimpan. Gambar dikirim ke Anthropic untuk dibaca, dan tiap pembacaan dikenai biaya di akun pemilik kunci. Membaca pesan teks tidak butuh kunci ini.
      </p>
      {i.ada && i.bentukBenar === false && <p className="mt-3 rounded-2xl bg-panel-merah-lembut px-4 py-3 text-[0.875rem] text-panel-merah">Kunci yang terpasang tidak berawalan sk-ant-, kemungkinan salah salin.</p>}
      {i.diubahOleh && <p className="mt-2 text-xs text-panel-utama/60">Terakhir diganti oleh {i.diubahOleh}.</p>}

      {i.bolehUbah ? (
        <>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <input type="password" autoComplete="off" spellCheck={false} value={kunci} onChange={(e) => setKunci(e.target.value)} placeholder={i.ada ? "Tempel kunci baru untuk mengganti" : "Tempel kunci API (sk-ant-…)"}
              className="min-w-0 flex-1 rounded-xl border border-panel-garis bg-panel-latar px-3 py-2 font-mono text-[13px] text-panel-utama outline-none focus:border-panel-aksen" />
            <button type="button" disabled={sibuk || !kunci.trim()} onClick={() => void simpan()} className="cursor-pointer rounded-full border-none bg-panel-utama px-5 py-2 text-[0.875rem] font-bold text-white hover:bg-panel-utama-2 disabled:cursor-not-allowed disabled:opacity-50">Simpan</button>
            <button type="button" disabled={sibuk || !i.ada} onClick={() => void tes()} className="cursor-pointer rounded-full border border-panel-utama bg-white px-4 py-2 text-[0.875rem] font-bold text-panel-utama hover:bg-panel-latar disabled:cursor-not-allowed disabled:opacity-50">Tes kunci</button>
            {i.sumber === "dashboard" && <button type="button" disabled={sibuk} onClick={() => void hapus()} className="cursor-pointer rounded-full border border-panel-merah bg-white px-4 py-2 text-[0.875rem] font-bold text-panel-merah disabled:opacity-50">Hapus</button>}
          </div>
          <p className="mt-2 text-xs text-panel-utama/60">Kunci dibuat di console.anthropic.com, bagian API keys. Setelah disimpan kunci tidak ditampilkan lagi; yang terlihat hanya empat huruf terakhir. Jangan menempelkannya di chat.</p>
        </>
      ) : (
        <p className="mt-3 text-[0.75rem] text-panel-utama/60">Hanya developer dan pemilik yang bisa mengganti kunci.</p>
      )}
      {pesan && <p className={`mt-3 rounded-2xl px-4 py-3 text-[0.875rem] ${pesan.ok ? "bg-panel-lembut text-panel-aksen" : "bg-panel-merah-lembut text-panel-merah"}`}>{pesan.teks}</p>}
    </div>
  );
}
