"use client";

import { useRef, useState } from "react";

import { LencanaJemput } from "@/components/jemput";
import { Pill } from "@/components/ui/pill";
import { CH, CHANNEL_LABELS } from "@/lib/data";
import { fmtShort } from "@/lib/format";
import type { Booking, BookingStatus } from "@/lib/types";

export interface PanelPesananProps {
  /** Boleh mencatat pesanan dan menandai tamu. Peran tanpa itu hanya melihat. */
  bolehCatat: boolean;
  onTambah: () => void;
  onTambahBanyak: () => void;
  /** Teks pesan yang ditempel. Kembali berisi pesan bila tidak ada yang terbaca. */
  onBacaTeks: (teks: string) => string | null;
  /** Screenshot. Kembali berisi pesan galat, atau null bila berhasil. */
  onBacaGambar: (berkas: File) => Promise<string | null>;
  sumberPesan: string;
  today: string;
  /** Booking yang boleh dilihat, beserta nama kamarnya. */
  daftar: { booking: Booking; kamar: string }[];
  onTandai: (id: string, status: Extract<BookingStatus, "Checked-in" | "Checked-out">) => void;
  onBuka: (id: string) => void;
}

const tambahHari = (s: string, n: number) =>
  new Date(Date.parse(`${s}T00:00:00Z`) + n * 864e5).toISOString().slice(0, 10);

type Rentang = "hari" | "besok" | "depan" | "lalu";
const TAB: { k: Rentang; label: string }[] = [
  { k: "hari", label: "Hari ini" },
  { k: "besok", label: "Besok" },
  { k: "depan", label: "7 hari ke depan" },
  { k: "lalu", label: "7 hari lalu" },
];

function rentang(k: Rentang, today: string): [string, string] {
  switch (k) {
    case "hari": return [today, today];
    case "besok": return [tambahHari(today, 1), tambahHari(today, 1)];
    case "depan": return [today, tambahHari(today, 7)];
    case "lalu": return [tambahHari(today, -7), tambahHari(today, -1)];
  }
}

const aktif = (b: Booking) => b.status !== "Cancelled" && b.status !== "Tidak datang";
/** Hanya pesanan yang dicatat di sini yang bisa ditandai. Booking dari situs luar dan sistem lama berasal dari sumbernya. */
const bisaDitandai = (b: Booking) => b.src === "manual" && b.channel !== "Sistem lama";

function Baris({
  b, kamar, tipe, bolehCatat, onTandai, onBuka,
}: {
  b: Booking;
  kamar: string;
  tipe: "masuk" | "keluar";
  bolehCatat: boolean;
  onTandai: PanelPesananProps["onTandai"];
  onBuka: (id: string) => void;
}) {
  const c = CH[b.channel];
  const sudah = tipe === "masuk" ? b.status === "Checked-in" || b.status === "Checked-out" : b.status === "Checked-out";
  return (
    <div className="rounded-2xl bg-panel-latar px-3 py-[10px]">
      <button type="button" onClick={() => onBuka(b.id)} className="flex w-full cursor-pointer flex-col gap-[2px] border-none bg-transparent p-0 text-left">
        <span className="flex items-center gap-2">
          <span className="h-2 w-2 shrink-0 rounded-[3px]" style={{ background: c.dot }} />
          <span className="min-w-0 flex-1 truncate text-[13.5px] font-semibold text-panel-utama">{b.guest}</span>
          <Pill colors={{ bg: c.bg, fg: c.fg }}>{b.sumberNama ?? CHANNEL_LABELS[b.channel]}</Pill>
        </span>
        <span className="pl-4 text-[12px] text-panel-utama/70">
          {kamar} · {fmtShort(b.checkIn)} – {fmtShort(b.checkOut)}
          {b.pax ? ` · ${b.pax} tamu` : ""}
        </span>
        <span className="pl-4">
          <LencanaJemput id={b.id} lengkap />
        </span>
      </button>
      {bolehCatat && bisaDitandai(b) && (
        <div className="mt-2 pl-4">
          {sudah ? (
            <span className="text-[12px] font-semibold text-panel-aksen">{tipe === "masuk" ? "Sudah datang" : "Sudah pulang"}</span>
          ) : (
            <button
              type="button"
              onClick={() => onTandai(b.id, tipe === "masuk" ? "Checked-in" : "Checked-out")}
              className="cursor-pointer rounded-full border-none bg-panel-utama px-4 py-[6px] text-[12.5px] font-bold text-white hover:bg-panel-utama-2"
            >
              {tipe === "masuk" ? "Sudah datang" : "Sudah pulang"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Panel di samping kalender: tambah pesanan, baca pesan dan screenshot dari
 * Stay Raja Ampat, dan daftar check-in dan check-out. Dibuat seperti kalender
 * mitra DAMPIER supaya pengelola unit sampai staf admin bekerja dari satu
 * tempat di samping kalender.
 */
export function PanelPesanan(p: PanelPesananProps) {
  const [tab, setTab] = useState<Rentang>("depan");
  const [teks, setTeks] = useState("");
  const [pesan, setPesan] = useState("");
  const [sibuk, setSibuk] = useState(false);
  const berkas = useRef<HTMLInputElement>(null);

  const [dari, sampai] = rentang(tab, p.today);
  const masuk = p.daftar
    .filter(({ booking: b }) => aktif(b) && b.checkIn >= dari && b.checkIn <= sampai)
    .sort((a, b) => a.booking.checkIn.localeCompare(b.booking.checkIn));
  const keluar = p.daftar
    .filter(({ booking: b }) => aktif(b) && b.checkOut >= dari && b.checkOut <= sampai)
    .sort((a, b) => a.booking.checkOut.localeCompare(b.booking.checkOut));

  const baca = () => {
    const g = p.onBacaTeks(teks);
    setPesan(g ?? "");
    if (!g) setTeks("");
  };

  const gambar = async (f: File | undefined) => {
    if (!f) return;
    setSibuk(true);
    setPesan("");
    const g = await p.onBacaGambar(f);
    setSibuk(false);
    setPesan(g ?? "");
    if (berkas.current) berkas.current.value = "";
  };

  const kartu = "rounded-3xl bg-white p-4 ring-1 ring-panel-garis";
  const judul = "text-[11px] font-bold tracking-[0.16em] text-panel-aksen uppercase";

  return (
    <div className="flex flex-col gap-4">
      {p.bolehCatat && (
        <div className="flex flex-col gap-2">
          <button type="button" onClick={p.onTambah}
            className="w-full cursor-pointer rounded-full border-none bg-panel-utama py-3 text-[0.9375rem] font-bold text-white hover:bg-panel-utama-2">
            Tambah pesanan
          </button>
          <button type="button" onClick={p.onTambahBanyak}
            className="w-full cursor-pointer rounded-full border-[1.5px] border-panel-utama bg-white py-3 text-[0.9375rem] font-bold text-panel-utama hover:bg-panel-latar">
            Tambah banyak
          </button>
        </div>
      )}

      {p.bolehCatat && (
        <section className={kartu}>
          <p className={judul}>Pesan {p.sumberPesan}</p>
          <p className="mt-2 text-[0.8125rem] leading-[1.5] text-panel-utama/75">
            Tempel pesan booking WhatsApp {p.sumberPesan}, atau unggah screenshotnya. Hasilnya diperiksa dulu sebelum disimpan.
          </p>
          <textarea
            value={teks}
            onChange={(e) => { setTeks(e.target.value); setPesan(""); }}
            rows={4}
            placeholder="Tempel pesan di sini"
            aria-label={`Pesan ${p.sumberPesan}`}
            className="mt-3 w-full resize-y rounded-2xl border border-panel-garis bg-panel-latar p-3 text-[0.875rem] text-panel-utama outline-none focus:border-panel-aksen"
          />
          <div className="mt-2 flex flex-wrap gap-2">
            <button type="button" onClick={baca} disabled={!teks.trim()}
              className="cursor-pointer rounded-full border-none bg-panel-utama px-4 py-2 text-[0.8125rem] font-bold text-white hover:bg-panel-utama-2 disabled:cursor-not-allowed disabled:opacity-50">
              Baca pesan
            </button>
            <button type="button" onClick={() => berkas.current?.click()} disabled={sibuk}
              className="cursor-pointer rounded-full border border-panel-utama bg-white px-4 py-2 text-[0.8125rem] font-bold text-panel-utama hover:bg-panel-latar disabled:cursor-wait disabled:opacity-60">
              {sibuk ? "Membaca…" : "Baca screenshot"}
            </button>
            <input ref={berkas} type="file" accept="image/png,image/jpeg,image/webp,image/gif" className="hidden"
              aria-label="Unggah screenshot" onChange={(e) => void gambar(e.target.files?.[0])} />
          </div>
          <p className="mt-2 text-[0.75rem] leading-[1.45] text-panel-utama/60">
            Screenshot dikirim ke layanan AI untuk dibaca, dan tiap pembacaan berbiaya. Teks dibaca di sini tanpa dikirim ke mana pun.
          </p>
          {pesan && <p className="mt-2 text-[0.8125rem] font-medium text-panel-merah">{pesan}</p>}
        </section>
      )}

      <section className={kartu}>
        <p className={judul}>Check-in dan check-out</p>
        <div role="tablist" aria-label="Rentang" className="mt-3 flex flex-wrap gap-[6px]">
          {TAB.map((t) => (
            <button key={t.k} type="button" role="tab" aria-selected={tab === t.k} onClick={() => setTab(t.k)}
              className={`cursor-pointer rounded-full border-none px-3 py-[6px] text-[0.8125rem] ${tab === t.k ? "bg-panel-utama font-bold text-white" : "bg-panel-latar text-panel-utama hover:bg-panel-lembut"}`}>
              {t.label}
            </button>
          ))}
        </div>

        <div className="mt-4">
          <p className="mb-2 flex items-center gap-2 text-[0.9375rem] font-bold text-panel-utama">
            Check-in, tamu datang
            <span className="rounded-full bg-panel-lembut px-2 py-[1px] text-[0.75rem]">{masuk.length}</span>
          </p>
          <div className="flex flex-col gap-2">
            {masuk.length === 0 ? (
              <p className="text-[0.8125rem] text-panel-utama/70">Tidak ada tamu datang di rentang ini.</p>
            ) : (
              masuk.map(({ booking, kamar }) => (
                <Baris key={booking.id} b={booking} kamar={kamar} tipe="masuk" bolehCatat={p.bolehCatat} onTandai={p.onTandai} onBuka={p.onBuka} />
              ))
            )}
          </div>
        </div>

        <div className="mt-5">
          <p className="mb-2 flex items-center gap-2 text-[0.9375rem] font-bold text-panel-utama">
            Check-out, tamu pulang
            <span className="rounded-full bg-panel-lembut px-2 py-[1px] text-[0.75rem]">{keluar.length}</span>
          </p>
          <div className="flex flex-col gap-2">
            {keluar.length === 0 ? (
              <p className="text-[0.8125rem] text-panel-utama/70">Tidak ada tamu pulang di rentang ini.</p>
            ) : (
              keluar.map(({ booking, kamar }) => (
                <Baris key={booking.id} b={booking} kamar={kamar} tipe="keluar" bolehCatat={p.bolehCatat} onTandai={p.onTandai} onBuka={p.onBuka} />
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
