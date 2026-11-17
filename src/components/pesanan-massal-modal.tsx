"use client";

import { useState } from "react";

import { FIELD_INPUT, FIELD_SELECT, Modal, ModalHeader } from "@/components/ui/modal";
import { dayDiff } from "@/lib/format";
import type { BarisPesan } from "@/lib/baca-pesan";
import type { BookingStatus, ChannelKey, Room } from "@/lib/types";

/** Satu baris yang siap disimpan menjadi pesanan. */
export interface BarisSiap {
  guest: string;
  room: string;
  checkIn: string;
  checkOut: string;
  pax: number | null;
  /** Kosong berarti harganya tidak diketahui; pesanan ditandai tanpa harga. */
  total: number | null;
  channel: ChannelKey;
  sumberNama: string;
  status: BookingStatus;
  notes: string;
}

interface Baris {
  k: number;
  guest: string;
  room: string;
  checkIn: string;
  checkOut: string;
  pax: string;
  total: string;
  notes: string;
  status: "Tentative" | "Confirmed";
}

export interface PesananMassalModalProps {
  /** Hasil bacaan yang akan diperiksa, atau kosong untuk memulai dari satu baris. */
  awal: BarisPesan[];
  /** Nama sumber, misalnya "Stay Raja Ampat". Kosong untuk pesanan langsung. */
  sumber: string;
  /** Kamar yang boleh dipilih, sudah dibatasi ke unit yang sedang dibuka. */
  kamar: (Room & { unit: string })[];
  /** Apakah kamar itu sudah terisi pada rentang itu. */
  bentrok: (room: string, masuk: string, keluar: string) => boolean;
  onSimpan: (baris: BarisSiap[]) => string | null;
  onClose: () => void;
}

const TGL = /^\d{4}-\d{2}-\d{2}$/;
let urut = 0;

const dariBaca = (b: BarisPesan): Baris => ({
  k: ++urut, guest: b.guest, room: b.room, checkIn: b.checkIn, checkOut: b.checkOut,
  pax: b.pax ? String(b.pax) : "", total: b.total ? String(b.total) : "", notes: b.catatan, status: "Confirmed",
});
const kosong = (): Baris => ({
  k: ++urut, guest: "", room: "", checkIn: "", checkOut: "", pax: "", total: "", notes: "", status: "Confirmed",
});

const sedikit = "rounded-[9px] border bg-surface px-[10px] py-[8px] text-[13px] outline-none focus:border-teal";

/**
 * Memeriksa dan menyimpan beberapa pesanan sekaligus. Dipakai untuk "Tambah
 * banyak" dan untuk hasil bacaan pesan atau screenshot. Hasil bacaan hanya
 * usulan: yang tidak terbaca dibiarkan kosong dan berbingkai merah, dan tidak
 * ada yang disimpan sebelum tombol Simpan ditekan.
 */
export function PesananMassalModal({ awal, sumber, kamar, bentrok, onSimpan, onClose }: PesananMassalModalProps) {
  const [baris, setBaris] = useState<Baris[]>(() => (awal.length ? awal.map(dariBaca) : [kosong()]));
  const [galat, setGalat] = useState("");

  const ubah = (k: number, patch: Partial<Baris>) => {
    setBaris((b) => b.map((x) => (x.k === k ? { ...x, ...patch } : x)));
    setGalat("");
  };

  const masalah = (b: Baris): string[] => {
    const m: string[] = [];
    if (!b.guest.trim()) m.push("guest");
    if (!kamar.some((r) => r.id === b.room)) m.push("room");
    if (!TGL.test(b.checkIn)) m.push("checkIn");
    if (!TGL.test(b.checkOut) || (TGL.test(b.checkIn) && b.checkOut <= b.checkIn)) m.push("checkOut");
    return m;
  };
  const adaBentrok = (b: Baris, i: number) =>
    masalah(b).length === 0 &&
    (bentrok(b.room, b.checkIn, b.checkOut) ||
      baris.some((x, j) => j !== i && x.room === b.room && masalah(x).length === 0 && x.checkIn < b.checkOut && x.checkOut > b.checkIn));

  const simpan = () => {
    const bermasalah = baris.filter((b) => masalah(b).length);
    if (bermasalah.length) {
      setGalat(`${bermasalah.length} baris belum lengkap. Isi yang berbingkai merah atau hapus barisnya.`);
      return;
    }
    const siap: BarisSiap[] = baris.map((b) => ({
      guest: b.guest.trim(), room: b.room, checkIn: b.checkIn, checkOut: b.checkOut,
      pax: Number(b.pax) > 0 ? Math.round(Number(b.pax)) : null,
      total: Number(b.total.replace(/\D/g, "")) > 0 ? Number(b.total.replace(/\D/g, "")) : null,
      channel: sumber ? "OTA lain" : "WhatsApp", sumberNama: sumber, status: b.status,
      notes: b.notes.trim() || (sumber ? `Dari ${sumber}.` : "Dicatat dari Tambah banyak."),
    }));
    const g = onSimpan(siap);
    if (g) setGalat(g);
    else onClose();
  };

  const kelas = (b: Baris, f: string) => `${sedikit} ${masalah(b).includes(f) ? "border-danger" : "border-line-input"}`;

  return (
    <Modal onClose={onClose} z={70} maxWidth={1000} scroll labelledBy="massal-title">
      <ModalHeader id="massal-title" title={awal.length ? `Periksa pesanan${sumber ? ` dari ${sumber}` : ""}` : "Tambah banyak pesanan"} onClose={onClose} />
      <div className="mb-4 text-[13px] leading-[1.5] text-slate-soft">
        {awal.length
          ? "Ini hasil bacaan, bukan data yang sudah pasti. Periksa tiap baris dan lengkapi yang kosong. Tidak ada yang tersimpan sebelum Anda menekan Simpan."
          : "Isi satu baris per pesanan, lalu simpan semuanya sekaligus."}
        {sumber && " Harga dibiarkan kosong bila tidak tertulis; pesanannya ditandai belum berharga."}
      </div>

      {kamar.length === 0 && (
        <div className="mb-3 rounded-[12px] border border-amber-soft bg-amber-soft/40 px-3 py-[10px] text-[12.5px] text-amber-ink">
          Belum ada kamar yang bisa dipilih di unit ini. Kamar Turtle yang dibaca dari sistem lama belum bisa dicatat dari sini.
        </div>
      )}
      <div className="flex flex-col gap-3">
        {baris.map((b, i) => (
          <div key={b.k} className="rounded-[14px] border border-line-soft bg-surface-mute p-3">
            <div className="grid grid-cols-2 gap-2 md:grid-cols-6">
              <input aria-label="Nama tamu" placeholder="Nama tamu" value={b.guest} onChange={(e) => ubah(b.k, { guest: e.target.value })}
                className={`${kelas(b, "guest")} col-span-2`} />
              <select aria-label="Kamar" value={b.room} onChange={(e) => ubah(b.k, { room: e.target.value })} className={`${kelas(b, "room")} col-span-2`}>
                <option value="">Pilih kamar</option>
                {kamar.map((r) => <option key={r.id} value={r.id}>{r.name} ({r.unit})</option>)}
              </select>
              <input aria-label="Check-in" type="text" inputMode="numeric" placeholder="Masuk YYYY-MM-DD" value={b.checkIn}
                onChange={(e) => ubah(b.k, { checkIn: e.target.value.trim() })} className={kelas(b, "checkIn")} />
              <input aria-label="Check-out" type="text" inputMode="numeric" placeholder="Keluar YYYY-MM-DD" value={b.checkOut}
                onChange={(e) => ubah(b.k, { checkOut: e.target.value.trim() })} className={kelas(b, "checkOut")} />
              <input aria-label="Jumlah tamu" inputMode="numeric" placeholder="Tamu" value={b.pax} onChange={(e) => ubah(b.k, { pax: e.target.value.replace(/\D/g, "") })}
                className={`${sedikit} border-line-input`} />
              <input aria-label="Total rupiah" inputMode="numeric" placeholder="Total Rp (boleh kosong)" value={b.total}
                onChange={(e) => ubah(b.k, { total: e.target.value.replace(/\D/g, "") })} className={`${sedikit} border-line-input col-span-2`} />
              <select aria-label="Status" value={b.status} onChange={(e) => ubah(b.k, { status: e.target.value as Baris["status"] })} className={`${FIELD_SELECT} py-[8px] text-[13px] col-span-2`}>
                <option value="Confirmed">Dikonfirmasi</option>
                <option value="Tentative">Menunggu</option>
              </select>
              <button type="button" onClick={() => setBaris((x) => x.filter((y) => y.k !== b.k))} disabled={baris.length === 1}
                className="cursor-pointer rounded-[9px] border border-danger-line bg-surface px-3 py-[8px] text-[12.5px] text-danger-ink hover:bg-danger-tint disabled:cursor-not-allowed disabled:opacity-40 md:col-span-1">
                Hapus
              </button>
            </div>
            {b.notes && (
              <details className="mt-2 text-[12px] text-slate-mute">
                <summary className="cursor-pointer">Teks asli</summary>
                <pre className="mt-1 max-h-32 overflow-auto rounded-[9px] bg-surface p-2 whitespace-pre-wrap">{b.notes}</pre>
              </details>
            )}
            {TGL.test(b.checkIn) && TGL.test(b.checkOut) && b.checkOut > b.checkIn && (
              <div className="mt-1 text-[12px] text-slate-mute">{dayDiff(b.checkIn, b.checkOut)} malam</div>
            )}
            {adaBentrok(b, i) && (
              <div className="mt-1 text-[12px] font-medium text-danger-ink">Kamar ini sudah terisi pada tanggal itu. Tetap bisa disimpan, dan akan muncul sebagai bentrok.</div>
            )}
          </div>
        ))}
      </div>

      {galat && <div className="mt-3 text-[12.5px] text-danger-ink">{galat}</div>}

      <div className="mt-4 flex flex-wrap gap-[10px]">
        <button type="button" onClick={() => setBaris((b) => [...b, kosong()])}
          className="cursor-pointer rounded-xl border border-line-strong bg-surface px-4 py-3 text-[13.5px] font-medium hover:bg-surface-hover">
          + Tambah baris
        </button>
        <button type="button" onClick={simpan}
          className="ml-auto cursor-pointer rounded-xl border-none bg-teal px-6 py-3 text-[13.5px] font-bold text-white hover:bg-teal-deep">
          Simpan {baris.length} pesanan
        </button>
      </div>
    </Modal>
  );
}

export { FIELD_INPUT };
