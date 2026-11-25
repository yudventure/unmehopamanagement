"use client";

import { useState } from "react";

import { fmtShort } from "@/lib/format";

type StatusCocok = "cocok" | "tanggal-beda" | "kamar-kurang" | "tidak-ada" | "batal-masih-ada";
interface BarisCocok {
  nomor: string;
  tamu: string;
  checkIn: string;
  checkOut: string;
  kamar: number;
  batal: boolean;
  status: StatusCocok;
  cara: "nomor" | "nama" | null;
  kamarLama: string[];
  tanggalLama: string | null;
  selam: { tanggal: string; aktivitas: string; label: string; pax: number | null }[];
}
interface Sesi {
  tanggal: string;
  aktivitas: string;
  label: string;
  pax: number | null;
  kamar: string[];
}
interface Hasil {
  dibaca: string;
  baris: BarisCocok[];
  hanyaDiLama: { nomor: string; tamu: string; checkIn: string; checkOut: string; kamar: string }[];
  jadwal: Sesi[];
  ringkas: Record<StatusCocok, number> & { hanyaDiLama: number; sesi: number };
}

const LABEL: Record<StatusCocok, string> = {
  cocok: "Cocok",
  "tanggal-beda": "Tanggal berbeda",
  "kamar-kurang": "Jumlah kamar kurang",
  "tidak-ada": "Belum ada di sistem lama",
  "batal-masih-ada": "Batal di Booking.com, masih ada di sistem lama",
};
const WARNA: Record<StatusCocok, string> = {
  cocok: "bg-teal-soft text-teal-deep",
  "tanggal-beda": "bg-amber-soft text-amber-ink",
  "kamar-kurang": "bg-amber-soft text-amber-ink",
  "tidak-ada": "bg-danger-soft text-danger-ink",
  "batal-masih-ada": "bg-danger-soft text-danger-ink",
};

const rentang = (a: string, b: string) => `${fmtShort(a)}–${fmtShort(b)}`;

function unduhCsv(h: Hasil) {
  const sel = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
  const baris = [
    ["Nomor pemesanan", "Tamu", "Check-in", "Check-out", "Kamar (Booking.com)", "Status", "Dicocokkan lewat", "Kamar di sistem lama", "Tanggal di sistem lama", "Jadwal dive center"].map(sel).join(";"),
    ...h.baris.map((b) =>
      [
        b.nomor, b.tamu, b.checkIn, b.checkOut, b.kamar, LABEL[b.status], b.cara ?? "", b.kamarLama.join(", "),
        b.tanggalLama ? b.tanggalLama.replace("|", " s/d ") : "",
        b.selam.map((s) => `${s.tanggal} ${s.label}${s.pax ? ` (${s.pax} pax)` : ""}`).join(" | "),
      ].map(sel).join(";"),
    ),
    "",
    ["Hanya di sistem lama", "", "", "", "", "", "", "", "", ""].map(sel).join(";"),
    ...h.hanyaDiLama.map((l) => [l.nomor, l.tamu, l.checkIn, l.checkOut, "", "Tidak ada di impor Booking.com", "", l.kamar, "", ""].map(sel).join(";")),
  ].join("\r\n");
  const url = URL.createObjectURL(new Blob(["﻿" + baris], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = `Cocok-Booking-SistemLama-${h.dibaca.slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

/**
 * Mencocokkan pesanan Booking.com yang diimpor dengan sistem lama, dengan
 * jadwal dive center tamu yang cocok. Hanya membaca kedua sumber.
 */
export function CocokBookingLama({ hariIni }: { hariIni: string }) {
  const [h, setH] = useState<Hasil | null>(null);
  const [galat, setGalat] = useState("");
  const [sibuk, setSibuk] = useState(false);
  const [saring, setSaring] = useState<"masalah" | "semua" | "selam">("masalah");

  const jalankan = async () => {
    setSibuk(true);
    setGalat("");
    try {
      const r = await fetch(`/api/sistem-lama/cocok?hariIni=${hariIni}`, { cache: "no-store" });
      const o = (await r.json().catch(() => ({}))) as Hasil & { galat?: string };
      if (!r.ok) setGalat(o.galat ?? `Server menjawab ${r.status}.`);
      else setH(o);
    } catch {
      setGalat("Tidak bisa menghubungi server.");
    } finally {
      setSibuk(false);
    }
  };

  const tampil = h
    ? h.baris.filter((b) => (saring === "semua" ? true : saring === "selam" ? b.selam.length > 0 : b.status !== "cocok"))
    : [];
  const bermasalah = h ? h.baris.filter((b) => b.status !== "cocok").length : 0;

  return (
    <section className="mb-5 rounded-[20px] border border-line-soft bg-surface px-4 py-4">
      <div className="flex flex-wrap items-start gap-3">
        <div className="min-w-0 flex-1">
          <div className="text-[15px] font-bold">Cocokkan Booking.com dengan sistem lama</div>
          <p className="mt-1 text-[12.5px] leading-[1.55] text-slate-soft">
            Tiap pesanan Booking.com yang diimpor (yang belum selesai) dicari di sistem lama lewat nomor konfirmasi, atau nama dan tanggal check-in. Kelihatan kamar mana yang dipakai di sistem lama, tanggal yang berbeda, pesanan yang belum dicatat staf, dan jadwal dive center tamunya. Hanya membaca.
          </p>
        </div>
        <button type="button" disabled={sibuk} onClick={() => void jalankan()} className="cursor-pointer rounded-[10px] border-none bg-teal px-4 py-[9px] text-[13px] font-bold text-white hover:bg-teal-deep disabled:opacity-50">
          {sibuk ? "Mencocokkan…" : h ? "Cocokkan ulang" : "Cocokkan sekarang"}
        </button>
        {h && (
          <button type="button" onClick={() => unduhCsv(h)} className="cursor-pointer rounded-[10px] border border-line-strong bg-surface px-4 py-[9px] text-[13px] font-medium hover:bg-surface-hover">
            Unduh CSV
          </button>
        )}
      </div>
      {galat && <p role="alert" className="mt-3 rounded-[10px] bg-danger-tint px-3 py-2 text-[12.5px] text-danger-deep">{galat}</p>}

      {h && (
        <>
          <div className="mt-3 flex flex-wrap gap-2 text-[12px]">
            {(Object.keys(LABEL) as StatusCocok[]).map((k) => (
              <span key={k} className={`rounded-full px-[10px] py-[3px] font-semibold ${WARNA[k]}`}>{LABEL[k]}: {h.ringkas[k]}</span>
            ))}
            <span className="rounded-full bg-surface-tint px-[10px] py-[3px] font-semibold text-slate">Hanya di sistem lama: {h.ringkas.hanyaDiLama}</span>
            <span className="rounded-full bg-surface-tint px-[10px] py-[3px] font-semibold text-slate">Sesi dive center 3 bulan: {h.ringkas.sesi}</span>
          </div>

          <div className="mt-3 flex flex-wrap gap-2" role="tablist">
            {([["masalah", `Perlu dicek (${bermasalah})`], ["semua", `Semua (${h.baris.length})`], ["selam", `Ikut dive center (${h.baris.filter((b) => b.selam.length).length})`]] as const).map(([k, l]) => (
              <button key={k} type="button" role="tab" aria-selected={saring === k} onClick={() => setSaring(k)} className={`cursor-pointer rounded-full border px-3 py-[5px] text-[12.5px] font-medium ${saring === k ? "border-teal bg-teal text-white" : "border-line-strong bg-surface text-ink-soft hover:bg-surface-hover"}`}>
                {l}
              </button>
            ))}
          </div>

          {tampil.length === 0 ? (
            <p className="mt-3 rounded-[12px] bg-surface-mute px-4 py-4 text-center text-[13px] text-slate-soft">{saring === "masalah" ? "Semua pesanan Booking.com yang belum selesai sudah cocok dengan sistem lama." : "Tidak ada."}</p>
          ) : (
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[46rem] border-collapse text-left text-[12.5px]">
                <thead>
                  <tr className="text-[11.5px] text-slate-mute">
                    <th className="px-2 py-2">Pesanan Booking.com</th>
                    <th className="px-2 py-2">Menginap</th>
                    <th className="px-2 py-2">Status</th>
                    <th className="px-2 py-2">Di sistem lama</th>
                    <th className="px-2 py-2">Jadwal dive center</th>
                  </tr>
                </thead>
                <tbody>
                  {tampil.map((b) => (
                    <tr key={b.nomor} className="border-t border-line-soft align-top">
                      <td className="px-2 py-2"><span className="font-semibold">{b.tamu || "—"}</span><span className="block font-mono text-[11px] text-slate-mute">#{b.nomor}{b.kamar > 1 ? ` · ${b.kamar} kamar` : ""}</span></td>
                      <td className="px-2 py-2 whitespace-nowrap">{rentang(b.checkIn, b.checkOut)}</td>
                      <td className="px-2 py-2"><span className={`rounded-full px-2 py-[2px] text-[11px] font-bold ${WARNA[b.status]}`}>{LABEL[b.status]}</span></td>
                      <td className="px-2 py-2">
                        {b.kamarLama.length ? b.kamarLama.join(", ") : b.status === "tidak-ada" ? "—" : "kamar belum dicatat"}
                        {b.tanggalLama && b.status === "tanggal-beda" && <span className="block text-[11px] text-amber-ink">sistem lama: {rentang(...(b.tanggalLama.split("|") as [string, string]))}</span>}
                        {b.cara === "nama" && <span className="block text-[11px] text-slate-mute">dicocokkan lewat nama, periksa lagi</span>}
                      </td>
                      <td className="px-2 py-2">
                        {b.selam.length ? (
                          <ul className="grid gap-[2px]">{b.selam.map((s, i) => <li key={i}>{fmtShort(s.tanggal)} · {s.label}{s.pax ? ` (${s.pax} pax)` : ""}</li>)}</ul>
                        ) : (
                          <span className="text-slate-mute">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {h.hanyaDiLama.length > 0 && (
            <details className="mt-4">
              <summary className="cursor-pointer text-[13px] font-semibold">Hanya ada di sistem lama ({h.hanyaDiLama.length}): pesanan dari saluran lain, atau Booking.com yang belum diimpor</summary>
              <ul className="mt-2 grid gap-1 text-[12.5px]">
                {h.hanyaDiLama.map((l, i) => (
                  <li key={`${l.nomor}-${i}`} className="rounded-[8px] bg-surface-mute px-3 py-[6px]">
                    <span className="font-semibold">{l.tamu || "tanpa nama"}</span> · {rentang(l.checkIn, l.checkOut)} · {l.kamar || "kamar belum dicatat"}
                    {l.nomor && <span className="font-mono text-[11px] text-slate-mute"> · {l.nomor}</span>}
                  </li>
                ))}
              </ul>
            </details>
          )}

          <details className="mt-3">
            <summary className="cursor-pointer text-[13px] font-semibold">Jadwal dive center dari sistem lama ({h.jadwal.length} sesi, 3 bulan ke depan)</summary>
            {h.jadwal.length === 0 ? (
              <p className="mt-2 text-[12.5px] text-slate-soft">Sistem lama tidak mengirim sesi.</p>
            ) : (
              <ul className="mt-2 grid gap-1 text-[12.5px]">
                {h.jadwal.map((s, i) => (
                  <li key={i} className="rounded-[8px] bg-surface-mute px-3 py-[6px]">
                    <span className="font-semibold">{fmtShort(s.tanggal)}</span> · {s.label}{s.pax ? ` · ${s.pax} pax` : ""}{s.kamar.length ? ` · ${s.kamar.join(", ")}` : ""}
                  </li>
                ))}
              </ul>
            )}
          </details>
          <p className="mt-3 text-[11.5px] text-slate-mute">Dibaca {new Date(h.dibaca).toLocaleString("id-ID")}. Impor ulang file pesanan Booking.com supaya pesanan terbaru ikut dicocokkan.</p>
        </>
      )}
    </section>
  );
}
