"use client";

import { useCallback, useEffect, useState } from "react";

import type { Statistik } from "@/lib/server/kunjungan";

type Pilihan = "all" | "turtle" | "eddo";

export interface StatistikScreenProps {
  /** Situs yang sedang dilihat. */
  situs: Pilihan;
  /** Yang boleh memilih situs: pemilik, developer, GM, dan PR. Manajer unit terkunci ke unitnya. */
  bolehPilih: boolean;
  onPilih: (s: Pilihan) => void;
}

const NAMA: Record<Pilihan, string> = { all: "Semua situs", turtle: "Turtle", eddo: "Eddo" };

const tanggalPendek = (t: string) => `${Number(t.slice(8))} ${["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"][Number(t.slice(5, 7)) - 1]}`;
const nama = (kode: string) => {
  try {
    return new Intl.DisplayNames(["id"], { type: "region" }).of(kode) ?? kode;
  } catch {
    return kode;
  }
};
const bendera = (kode: string) =>
  /^[A-Z]{2}$/.test(kode) ? String.fromCodePoint(...[...kode].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65)) : "";

function Ubin({ label, nilai, ket, gelap = false }: { label: string; nilai: number; ket: string; gelap?: boolean }) {
  return (
    <div className={`rounded-3xl px-5 py-5 ring-1 ${gelap ? "bg-panel-utama text-white ring-panel-utama" : "bg-white text-panel-utama ring-panel-garis"}`}>
      <p className={`text-[11px] font-bold tracking-[0.16em] uppercase ${gelap ? "text-white/80" : "text-panel-aksen"}`}>{label}</p>
      <p className="mt-2 text-[2.2rem] leading-none font-bold tabular-nums">{nilai.toLocaleString("id-ID")}</p>
      <p className={`mt-2 text-sm ${gelap ? "text-white/80" : "text-panel-utama/70"}`}>{ket}</p>
    </div>
  );
}

/**
 * Statistik pengunjung website, mengikuti panel DAMPIER: empat ubin, grafik
 * batang per hari (7 atau 30 hari), rincian satu hari, dan asal negara.
 *
 * Datanya dari penghitung milik sendiri (`/api/kunjungan`), bukan layanan
 * luar, dan penghitungan baru dimulai sejak fitur ini tayang.
 */
export function StatistikScreen({ situs, bolehPilih, onPilih }: StatistikScreenProps) {
  const [rentang, setRentang] = useState<7 | 30>(7);
  const [hari, setHari] = useState<string | null>(null);
  const [data, setData] = useState<{ boleh: string[]; statistik: Statistik } | null>(null);
  const [galat, setGalat] = useState("");

  const muat = useCallback(async () => {
    try {
      const q = new URLSearchParams({ situs, rentang: String(rentang) });
      if (hari) q.set("hari", hari);
      const res = await fetch(`/api/kunjungan?${q}`, { cache: "no-store" });
      if (!res.ok) {
        setGalat(res.status === 403 ? "Anda hanya bisa melihat statistik unit Anda." : "Statistik belum bisa dimuat.");
        return;
      }
      setData(await res.json());
      setGalat("");
    } catch {
      setGalat("Tidak bisa menghubungi server.");
    }
  }, [situs, rentang, hari]);

  useEffect(() => {
    void muat();
    const t = setInterval(() => document.visibilityState === "visible" && void muat(), 30_000);
    return () => clearInterval(t);
  }, [muat]);
  useEffect(() => setHari(null), [situs]);

  const st = data?.statistik;
  const puncak = Math.max(1, ...(st?.seri.map((x) => x.unik) ?? [1]));
  const totalNegara = (st?.negara30.reduce((n, x) => n + x.n, 0) ?? 0);
  const negaraTampil = st?.negara30.slice(0, 6) ?? [];
  const lain = (st?.negara30.slice(6) ?? []).reduce((n, x) => n + x.n, 0);
  const judulSitus = situs === "all" ? (data && data.boleh.length === 1 ? NAMA[data.boleh[0] as Pilihan] : "Semua situs") : NAMA[situs];

  return (
    <div className="grid gap-5">
      <section className="rounded-3xl bg-white p-5 ring-1 ring-panel-garis">
        <div className="flex flex-wrap items-start gap-3">
          <div>
            <p className="text-[11px] font-bold tracking-[0.16em] text-panel-aksen uppercase">Statistik situs</p>
            <h1 className="mt-1 text-[1.6rem] leading-tight font-bold text-panel-utama">Pengunjung website {judulSitus}</h1>
            <p className="mt-1 text-sm text-panel-utama/70">Pantau pengunjung dan tampilan halaman situs publik.</p>
          </div>
          <div className="ml-auto text-right text-xs text-panel-utama/60">
            <span className="mb-1 inline-flex items-center gap-1 rounded-full bg-panel-lembut px-2 py-[2px] font-bold text-panel-aksen">● Langsung</span>
            {st && <div>Diperbarui {new Intl.DateTimeFormat("id-ID", { timeZone: "Asia/Jayapura", hour: "2-digit", minute: "2-digit" }).format(new Date(st.diperbarui)).replace(":", ".")} WIT</div>}
          </div>
        </div>

        {bolehPilih && (
          <div role="group" aria-label="Pilih situs" className="mt-4 flex flex-wrap gap-2">
            {(["all", "turtle", "eddo"] as Pilihan[]).map((p) => (
              <button key={p} type="button" aria-pressed={situs === p} onClick={() => onPilih(p)}
                className={`cursor-pointer rounded-full border-none px-4 py-2 text-[0.875rem] ${situs === p ? "bg-panel-utama font-bold text-white" : "bg-panel-latar text-panel-utama hover:bg-panel-lembut"}`}>
                {NAMA[p]}
              </button>
            ))}
          </div>
        )}
        {galat && <p className="mt-3 text-sm text-panel-merah">{galat}</p>}
      </section>

      {st && (
        <>
          {st.mulai === null && (
            <p className="rounded-2xl bg-panel-latar px-5 py-4 text-[0.9375rem] text-panel-utama">
              Belum ada kunjungan tercatat. Penghitungan dimulai sejak fitur ini tayang, dan kunjungan Anda sendiri sebagai pengelola yang sedang masuk tidak dihitung.
            </p>
          )}
          <section aria-label="Angka kunjungan" className="grid grid-cols-2 gap-4 xl:grid-cols-4">
            <Ubin gelap label="Aktif sekarang" nilai={st.aktif} ket="pengunjung dalam 5 menit terakhir" />
            <Ubin label="Hari ini" nilai={st.hariIni.unik} ket={`${st.hariIni.tampil.toLocaleString("id-ID")} tampilan halaman`} />
            <Ubin label="7 hari terakhir" nilai={st.tujuhHari.unik} ket={`${st.tujuhHari.tampil.toLocaleString("id-ID")} tampilan halaman`} />
            <Ubin label="30 hari terakhir" nilai={st.tigaPuluhHari.unik} ket={`${st.tigaPuluhHari.tampil.toLocaleString("id-ID")} tampilan halaman`} />
          </section>

          <section className="grid gap-4 xl:grid-cols-[1fr_20rem]">
            <div className="rounded-3xl bg-white p-5 ring-1 ring-panel-garis">
              <div className="flex flex-wrap items-center gap-2">
                <div>
                  <p className="text-[1rem] font-bold text-panel-utama">Pengunjung per hari</p>
                  <p className="text-xs text-panel-utama/60">{tanggalPendek(st.seri[0].tanggal)} sampai {tanggalPendek(st.seri[st.seri.length - 1].tanggal)}</p>
                </div>
                <div role="tablist" aria-label="Rentang grafik" className="ml-auto flex gap-1 rounded-full bg-panel-latar p-1">
                  {([7, 30] as const).map((r) => (
                    <button key={r} type="button" role="tab" aria-selected={rentang === r} onClick={() => setRentang(r)}
                      className={`cursor-pointer rounded-full border-none px-3 py-1 text-[0.8125rem] ${rentang === r ? "bg-panel-utama font-bold text-white" : "bg-transparent text-panel-utama"}`}>
                      {r} hari
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-4 flex h-56 items-end gap-[3px]" role="img" aria-label={`Grafik pengunjung unik per hari, ${rentang} hari terakhir`}>
                {st.seri.map((x, i) => {
                  const tinggi = Math.max(x.unik ? 4 : 1, Math.round((x.unik / puncak) * 100));
                  const pilih = x.tanggal === st.detail.tanggal;
                  const tampil = rentang === 7 || x.unik === puncak || i === st.seri.length - 1;
                  return (
                    <button key={x.tanggal} type="button" onClick={() => setHari(x.tanggal)} title={`${tanggalPendek(x.tanggal)}: ${x.unik} pengunjung`}
                      className="group flex h-full min-w-0 flex-1 cursor-pointer flex-col items-center justify-end border-none bg-transparent p-0">
                      <span className={`mb-1 text-[10px] tabular-nums text-panel-utama/70 ${tampil ? "" : "opacity-0"}`}>{x.unik}</span>
                      <span className={`w-full rounded-t-md ${pilih ? "bg-panel-aksen" : "bg-panel-utama-2"} group-hover:opacity-80`} style={{ height: `${tinggi}%` }} />
                      <span className={`mt-1 text-[10px] ${i === st.seri.length - 1 ? "font-bold text-panel-utama" : "text-panel-utama/60"} ${rentang === 30 && i % 5 !== 0 && i !== st.seri.length - 1 ? "opacity-0" : ""}`}>
                        {i === st.seri.length - 1 ? "Hari ini" : tanggalPendek(x.tanggal)}
                      </span>
                    </button>
                  );
                })}
              </div>
              <p className="mt-3 text-xs text-panel-utama/60">Pilih batang untuk melihat rinciannya.</p>
              {/* Tabel untuk pembaca layar, dibungkus supaya tidak melebarkan halaman. */}
              <div className="sr-only">
                <table>
                  <caption>Pengunjung unik per hari</caption>
                  <tbody>{st.seri.map((x) => <tr key={x.tanggal}><th>{x.tanggal}</th><td>{x.unik}</td></tr>)}</tbody>
                </table>
              </div>
            </div>

            <div className="rounded-3xl bg-panel-lembut p-5">
              <p className="text-[1rem] font-bold text-panel-utama">Rincian {st.detail.tanggal === st.seri[st.seri.length - 1].tanggal ? "hari ini" : tanggalPendek(st.detail.tanggal)}</p>
              <p className="mt-4 text-xs text-panel-utama/70">Pengunjung unik</p>
              <p className="text-[2rem] leading-tight font-bold text-panel-utama tabular-nums">{st.detail.unik}</p>
              <p className="mt-3 text-xs text-panel-utama/70">Tampilan halaman</p>
              <p className="text-[2rem] leading-tight font-bold text-panel-utama tabular-nums">{st.detail.tampil}</p>
              <p className="mt-4 text-xs font-bold text-panel-utama/70">Negara teratas</p>
              {st.detail.negara.length === 0 ? <p className="mt-1 text-sm text-panel-utama/70">Belum ada.</p> : (
                <ul className="mt-1 grid gap-1 text-sm text-panel-utama">
                  {st.detail.negara.map(([k, n]) => <li key={k} className="flex justify-between gap-2"><span>{bendera(k)} {nama(k)}</span><span className="tabular-nums">{n}</span></li>)}
                </ul>
              )}
              <p className="mt-4 text-xs font-bold text-panel-utama/70">Halaman teratas</p>
              {st.detail.halaman.length === 0 ? <p className="mt-1 text-sm text-panel-utama/70">Belum ada.</p> : (
                <ul className="mt-1 grid gap-1 text-sm text-panel-utama">
                  {st.detail.halaman.map(([h, n]) => <li key={h} className="flex justify-between gap-2"><span className="min-w-0 truncate">{h}</span><span className="tabular-nums">{n}</span></li>)}
                </ul>
              )}
              <p className="mt-4 text-xs text-panel-utama/60">Satu pengunjung bisa membuka beberapa halaman.</p>
            </div>
          </section>

          <section className="rounded-3xl bg-panel-latar p-5">
            <p className="text-[1rem] font-bold text-panel-utama">Asal negara pengunjung</p>
            <p className="text-xs text-panel-utama/60">30 hari terakhir, {totalNegara} pengunjung yang negaranya diketahui{st.tanpaNegara ? `, ${st.tanpaNegara} belum diketahui` : ""}</p>
            {negaraTampil.length === 0 ? <p className="mt-3 text-sm text-panel-utama/70">Belum ada data negara.</p> : (
              <ul className="mt-4 grid gap-3 md:grid-cols-2">
                {negaraTampil.map((x) => (
                  <li key={x.kode} className="grid grid-cols-[9rem_1fr_auto] items-center gap-3 text-sm text-panel-utama">
                    <span className="truncate">{bendera(x.kode)} {nama(x.kode)}</span>
                    <span className="h-2 rounded-full bg-white"><span className="block h-2 rounded-full bg-panel-utama-2" style={{ width: `${Math.max(3, Math.round((x.n / Math.max(1, totalNegara)) * 100))}%` }} /></span>
                    <span className="tabular-nums">{x.n} · {Math.round((x.n / Math.max(1, totalNegara)) * 100)}%</span>
                  </li>
                ))}
                {lain > 0 && (
                  <li className="grid grid-cols-[9rem_1fr_auto] items-center gap-3 text-sm text-panel-utama">
                    <span>Negara lain ({Math.max(0, (st.negara30.length) - 6)})</span>
                    <span className="h-2 rounded-full bg-white"><span className="block h-2 rounded-full bg-panel-aksen/50" style={{ width: `${Math.max(3, Math.round((lain / Math.max(1, totalNegara)) * 100))}%` }} /></span>
                    <span className="tabular-nums">{lain} · {Math.round((lain / Math.max(1, totalNegara)) * 100)}%</span>
                  </li>
                )}
              </ul>
            )}
            <p className="mt-4 text-xs leading-[1.5] text-panel-utama/60">
              Penghitung milik sendiri: tanpa cookie, alamat IP tidak disimpan, pengunjung dikenali hanya dalam satu hari lewat sidik acak yang tidak bisa dilacak ke hari lain. Do Not Track dan Global Privacy Control dihormati, robot disaring, dan pengelola yang sedang masuk tidak dihitung. Negara diambil dari server bila tersedia; bila tidak, diperkirakan dari bahasa peramban, jadi hanya perkiraan.
              {st.situs.length > 1 && " Angka beberapa situs dijumlahkan; orang yang membuka dua situs dihitung dua kali."}
            </p>
          </section>
        </>
      )}
    </div>
  );
}
