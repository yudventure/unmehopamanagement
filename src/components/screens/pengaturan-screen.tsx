"use client";

import { useCallback, useEffect, useState } from "react";

import { KartuGalat, type PeringatanGalat } from "@/components/galat-panel";
import { KartuPembaca } from "@/components/kartu-pembaca";
import { SakelarSistemLama } from "@/components/sakelar-sistem-lama";

interface Pembayaran {
  serverKey: { ada: boolean; bentuk: string | null; akhir: string };
  clientKey: { ada: boolean; bentuk: string | null; akhir: string };
  mode: "sandbox" | "produksi";
  siap: boolean;
  bolehUji: boolean;
  peringatan: string[];
  notifikasiUrl: string;
}

const kartu = "rounded-3xl bg-white p-5 ring-1 ring-panel-garis";
const judul = "text-[11px] font-bold tracking-[0.16em] text-panel-aksen uppercase";

function Chip({ ok, children }: { ok: boolean; children: React.ReactNode }) {
  return <span className={`rounded-full px-2 py-[2px] text-[11px] font-bold ${ok ? "bg-panel-lembut text-panel-aksen" : "bg-panel-merah-lembut text-panel-merah"}`}>{children}</span>;
}

function KartuMidtrans() {
  const [p, setP] = useState<Pembayaran | null>(null);
  const [tes, setTes] = useState<{ hasil: string; pesan: string } | null>(null);
  const [sibuk, setSibuk] = useState(false);
  const [salin, setSalin] = useState(false);

  const muat = useCallback(async () => {
    const r = await fetch("/api/pembayaran", { cache: "no-store" }).catch(() => null);
    if (r?.ok) setP(await r.json());
  }, []);
  useEffect(() => void muat(), [muat]);

  const jalankanTes = async () => {
    setSibuk(true);
    setTes(null);
    const r = await fetch("/api/pembayaran/tes", { method: "POST" }).catch(() => null);
    const o = (await r?.json().catch(() => null)) as { hasil?: string; pesan?: string; galat?: string } | null;
    setTes(o?.hasil ? { hasil: o.hasil, pesan: o.pesan ?? "" } : { hasil: "tidak-jelas", pesan: o?.galat ?? "Tes belum bisa dijalankan." });
    setSibuk(false);
  };

  if (!p) return <div className={kartu}><p className={judul}>Pembayaran Midtrans</p><p className="mt-2 text-sm text-panel-utama/70">Memuat…</p></div>;

  return (
    <div className={kartu}>
      <p className={judul}>Pembayaran Midtrans</p>
      <div className="mt-1 flex flex-wrap items-center gap-2">
        <p className="text-[1.0625rem] font-bold text-panel-utama">{p.siap ? "Siap menerima pembayaran" : "Belum siap"}</p>
        <Chip ok={p.mode === "sandbox"}>{p.mode === "sandbox" ? "Mode sandbox (uji)" : "Mode produksi (uang sungguhan)"}</Chip>
      </div>

      <ul className="mt-3 grid gap-2 text-[0.875rem] text-panel-utama">
        <li className="flex flex-wrap items-center gap-2 rounded-2xl bg-panel-latar px-4 py-3">
          <span className="font-semibold">Server key</span>
          <Chip ok={p.serverKey.ada}>{p.serverKey.ada ? "terpasang" : "kosong"}</Chip>
          {p.serverKey.ada && <span className="text-panel-utama/70">bentuk {p.serverKey.bentuk === "tidak-dikenal" ? "tidak dikenal" : p.serverKey.bentuk}, berakhiran …{p.serverKey.akhir}</span>}
        </li>
        <li className="flex flex-wrap items-center gap-2 rounded-2xl bg-panel-latar px-4 py-3">
          <span className="font-semibold">Client key</span>
          <Chip ok={p.clientKey.ada}>{p.clientKey.ada ? "terpasang" : "kosong"}</Chip>
          {p.clientKey.ada && <span className="text-panel-utama/70">bentuk {p.clientKey.bentuk === "tidak-dikenal" ? "tidak dikenal" : p.clientKey.bentuk}, berakhiran …{p.clientKey.akhir}</span>}
        </li>
      </ul>
      {p.peringatan.length > 0 && (
        <ul className="mt-3 grid gap-2">
          {p.peringatan.map((w) => <li key={w} className="rounded-2xl bg-panel-merah-lembut px-4 py-3 text-[0.875rem] text-panel-merah">{w}</li>)}
        </ul>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-3">
        {p.bolehUji && <button type="button" onClick={() => void jalankanTes()} disabled={sibuk || !p.serverKey.ada || !p.bolehUji}
          className="cursor-pointer rounded-full border-none bg-panel-utama px-5 py-2 text-[0.875rem] font-bold text-white hover:bg-panel-utama-2 disabled:cursor-not-allowed disabled:opacity-50">
          {sibuk ? "Menguji…" : "Tes server key"}
        </button>}
        <span className="text-xs text-panel-utama/60">{p.bolehUji ? "Menanyakan satu pesanan yang tidak ada ke Midtrans. Tidak ada yang dibuat atau ditagih." : "Hanya developer dan pemilik yang bisa mengubah kunci dan menjalankan tes."}</span>
      </div>
      {tes && (
        <p className={`mt-3 rounded-2xl px-4 py-3 text-[0.875rem] ${tes.hasil === "diterima" ? "bg-panel-lembut text-panel-aksen" : "bg-panel-merah-lembut text-panel-merah"}`}>{tes.pesan}</p>
      )}

      <div className="mt-5">
        <p className="text-[0.9375rem] font-bold text-panel-utama">URL notifikasi pembayaran</p>
        <p className="mt-1 text-[0.8125rem] leading-[1.5] text-panel-utama/70">
          Tempel di dashboard Midtrans pada pengaturan notifikasi pembayaran (Payment Notification URL, biasanya di Settings lalu Configuration). Tanpa ini Midtrans tidak memberi tahu server bahwa tamu sudah membayar.
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <code className="min-w-0 flex-1 overflow-hidden rounded-xl bg-panel-latar px-3 py-2 font-mono text-[12px] text-ellipsis whitespace-nowrap text-panel-utama">{p.notifikasiUrl}</code>
          <button type="button" onClick={() => { void navigator.clipboard?.writeText(p.notifikasiUrl); setSalin(true); setTimeout(() => setSalin(false), 1600); }}
            className="cursor-pointer rounded-full border border-panel-utama bg-white px-4 py-2 text-[0.8125rem] font-bold text-panel-utama hover:bg-panel-latar">{salin ? "Tersalin" : "Salin"}</button>
        </div>
      </div>

      <div className="mt-5 rounded-2xl bg-panel-latar p-4">
        <p className="text-[0.9375rem] font-bold text-panel-utama">Cara menyiapkan</p>
        <ol className="mt-2 grid list-decimal gap-2 pl-5 text-[0.8125rem] leading-[1.55] text-panel-utama/85">
          <li>Masuk ke dashboard Midtrans, <strong>sandbox dulu</strong>, lalu buka Settings dan Access Keys. Salin Client key dan Server key (atau buat yang baru bila dashboard Anda menyediakannya). Sandbox dan produksi punya kunci sendiri.</li>
          <li><strong>Server key</strong> dipasang di panel Hostinger, Variabel environment, sebagai <code>MIDTRANS_SERVER_KEY</code>. Server key rahasia: jangan ditempel di chat atau di repositori.</li>
          <li><strong>Client key</strong> dipasang di GitHub, Settings, Actions, Variables, sebagai <code>NEXT_PUBLIC_MIDTRANS_CLIENT_KEY</code>. Nilainya tertanam saat build, jadi jalankan ulang Build di <code>main</code> sesudahnya.</li>
          <li>Mode produksi hanya dengan <code>MIDTRANS_IS_PRODUCTION=true</code> dan kunci produksi. Kunci sandbox berawalan <code>SB-</code> dan akan ditolak di produksi.</li>
          <li>Tempel URL notifikasi di atas di dashboard Midtrans, lalu tekan <strong>Tes server key</strong>. Cobalah satu pembayaran sandbox dari situs sebelum beralih ke produksi.</li>
        </ol>
      </div>
    </div>
  );
}

/**
 * Pengaturan dashboard: galat, sakelar sistem lama, pembaca screenshot, dan
 * pembayaran Midtrans. Developer dan pemilik mengubah; general manager hanya
 * melihat (layarnya hanya terbuka bagi mereka bertiga).
 */
export function PengaturanScreen({ galat, muatGalat }: { galat: { peringatan: PeringatanGalat[]; bolehHapus: boolean } | null; muatGalat: () => Promise<void> }) {
  return (
    <div className="grid gap-5">
      <section className="rounded-3xl bg-white p-5 ring-1 ring-panel-garis">
        <p className={judul}>Perusahaan</p>
        <h1 className="mt-1 text-[1.6rem] leading-tight font-bold text-panel-utama">Pengaturan</h1>
        <p className="mt-1 text-sm text-panel-utama/70">Sakelar dan penyiapan yang dulu harus dilakukan lewat panel hosting.</p>
      </section>
      <KartuGalat data={galat} muat={muatGalat} />
      <SakelarSistemLama />
      <KartuPembaca />
      <KartuMidtrans />
    </div>
  );
}
