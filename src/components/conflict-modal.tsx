"use client";

import { useState } from "react";

import { Modal, ModalHeader } from "@/components/ui/modal";
import { Pill } from "@/components/ui/pill";
import { CH, CHANNEL_LABELS } from "@/lib/data";
import type { ConflictPair } from "@/lib/derive";
import { dayDiff, fmt, fmtDate, fmtShort, iso, parse } from "@/lib/format";
import { statusColors } from "@/lib/pills";
import type { Booking } from "@/lib/types";

export type JenisSolusi = "tetap" | "pindah" | "kompensasi" | "tanggal" | "lain";
export interface SolusiTamu {
  jenis: JenisSolusi;
  catatan: string;
}
export interface Selesai {
  solusi: Record<string, SolusiTamu>;
  oleh: string;
  pada: string;
}

const LABEL_SOLUSI: Record<JenisSolusi, string> = {
  tetap: "Tetap di kamar ini",
  pindah: "Pindah ke kamar lain",
  kompensasi: "Diberi kompensasi (diskon, refund, dll)",
  tanggal: "Ganti tanggal",
  lain: "Solusi lain",
};
const BUTUH_CATATAN: JenisSolusi[] = ["kompensasi", "lain"];

export interface ConflictModalProps {
  pairs: ConflictPair[];
  /** Bentrok yang sudah dinyatakan selesai, beserta solusi tiap tamu. */
  selesai?: { pair: ConflictPair; rec: Selesai }[];
  /** Menyimpan penyelesaian. Kembali berisi pesan galat, atau null bila berhasil. */
  onSelesaikan?: (pair: ConflictPair, solusi: Record<string, SolusiTamu>) => Promise<string | null>;
  onBukaLagi?: (pair: ConflictPair) => void;
  bolehSelesaikan?: boolean;
  roomName: (roomId: string) => string;
  showMoney: boolean;
  onClose: () => void;
  onCancelBooking: (id: string) => void;
  onCheckIn: (id: string) => void;
  onOpenDetail: (id: string) => void;
}

/**
 * The nights actually sold twice — `to` is a checkout morning, so the last
 * contested night is the day before it. Stepped with parse/iso rather than
 * toISOString, which would shift the date back a day in Asia/Jayapura.
 */
function overlapLabel(pair: ConflictPair) {
  const first = fmtShort(pair.from);
  if (pair.nights === 1) return first;
  const last = fmtShort(
    iso(new Date(parse(pair.from).getTime() + (pair.nights - 1) * 86400000)),
  );
  return `${first} – ${last}`;
}

function Side({
  booking,
  showMoney,
  onCancelBooking,
  onCheckIn,
  onOpenDetail,
}: {
  booking: Booking;
  showMoney: boolean;
  onCancelBooking: (id: string) => void;
  onCheckIn: (id: string) => void;
  onOpenDetail: (id: string) => void;
}) {
  const c = CH[booking.channel];
  const nights = dayDiff(booking.checkIn, booking.checkOut);

  return (
    <div className="flex min-w-[260px] flex-1 flex-col rounded-2xl border border-line-strong bg-surface-mute p-4">
      <div className="mb-[10px] flex items-center gap-2">
        <Pill colors={{ bg: c.bg, fg: c.fg }}>
          {CHANNEL_LABELS[booking.channel]}
        </Pill>
        <Pill colors={statusColors(booking.status)}>{booking.status}</Pill>
      </div>

      <div className="text-[16px] font-bold">{booking.guest}</div>
      <div className="mt-[2px] font-mono text-[11.5px] text-slate-soft">
        {booking.code} ·{" "}
        {booking.src === "iCal" ? "impor iCal" : "input manual"}
      </div>

      <dl className="mt-3 flex flex-col gap-[7px] text-[13px]">
        <div className="flex justify-between gap-3">
          <dt className="text-slate">Menginap</dt>
          <dd className="text-right font-medium">
            {fmtDate(booking.checkIn)} → {fmtDate(booking.checkOut)}
          </dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-slate">Lama</dt>
          <dd className="font-medium">
            {nights} malam
            {booking.pax === null ? "" : ` · ${booking.pax} tamu`}
          </dd>
        </div>
        {showMoney && (
          <div className="flex justify-between gap-3">
            <dt className="text-slate">Nilai</dt>
            <dd className="font-medium">{fmt(booking.total)}</dd>
          </div>
        )}
      </dl>

      <p className="mt-3 mb-4 text-[12.5px] leading-[1.45] text-slate-soft">
        {booking.notes}
      </p>

      <div className="mt-auto flex flex-col gap-2">
        <button
          type="button"
          onClick={() => onCheckIn(booking.id)}
          className="w-full cursor-pointer rounded-[11px] border-none bg-teal py-[10px] text-[13px] font-bold text-white hover:bg-teal-deep"
        >
          Pertahankan &amp; tandai Check-in
        </button>
        <button
          type="button"
          onClick={() => onCancelBooking(booking.id)}
          className="w-full cursor-pointer rounded-[11px] border border-danger bg-transparent py-[10px] text-[13px] font-medium text-danger hover:bg-danger hover:text-white"
        >
          Batalkan booking ini
        </button>
        <button
          type="button"
          onClick={() => onOpenDetail(booking.id)}
          className="cursor-pointer border-none bg-transparent py-[2px] text-[12px] text-slate-soft underline hover:text-teal"
        >
          Lihat detail lengkap
        </button>
      </div>
    </div>
  );
}

/** Formulir "sudah diselesaikan": kedua tamu harus punya solusi, termasuk yang tetap di kamar itu. */
function FormSelesai({ pair, onSimpan, onBatal }: { pair: ConflictPair; onSimpan: (s: Record<string, SolusiTamu>) => Promise<string | null>; onBatal: () => void }) {
  const [nilai, setNilai] = useState<Record<string, SolusiTamu>>({
    [pair.a.id]: { jenis: "" as JenisSolusi, catatan: "" },
    [pair.b.id]: { jenis: "" as JenisSolusi, catatan: "" },
  });
  const [galat, setGalat] = useState("");
  const [sibuk, setSibuk] = useState(false);
  const ubah = (id: string, patch: Partial<SolusiTamu>) => setNilai((n) => ({ ...n, [id]: { ...n[id], ...patch } }));
  const lengkap = [pair.a, pair.b].every((b) => {
    const x = nilai[b.id];
    return x.jenis && (!BUTUH_CATATAN.includes(x.jenis) || x.catatan.trim());
  });
  const simpan = async () => {
    setSibuk(true);
    setGalat("");
    const g = await onSimpan(nilai);
    if (g) {
      setGalat(g);
      setSibuk(false);
    }
  };
  return (
    <div className="mt-3 rounded-2xl border-2 border-teal bg-surface p-4">
      <p className="text-[14px] font-bold">Sudah diselesaikan: apa solusi untuk masing-masing tamu?</p>
      <p className="mt-1 text-[12.5px] leading-[1.5] text-slate">
        Kedua tamu harus punya solusi, termasuk yang tetap di kamar ini. Tidak ada booking yang dibatalkan atau diubah; bentrok ini hanya berhenti menjadi peringatan.
      </p>
      <div className="mt-3 flex flex-wrap gap-3">
        {[pair.a, pair.b].map((b) => (
          <div key={b.id} className="flex min-w-[240px] flex-1 flex-col gap-2 rounded-xl bg-surface-mute p-3">
            <div className="text-[13.5px] font-bold">{b.guest}</div>
            <select
              value={nilai[b.id].jenis}
              onChange={(e) => ubah(b.id, { jenis: e.target.value as JenisSolusi })}
              className="rounded-[10px] border border-line-input bg-white px-3 py-2 text-[13px]"
            >
              <option value="">Pilih solusi…</option>
              {(Object.keys(LABEL_SOLUSI) as JenisSolusi[]).map((j) => (
                <option key={j} value={j}>{LABEL_SOLUSI[j]}</option>
              ))}
            </select>
            <textarea
              value={nilai[b.id].catatan}
              onChange={(e) => ubah(b.id, { catatan: e.target.value })}
              rows={2}
              maxLength={300}
              placeholder={BUTUH_CATATAN.includes(nilai[b.id].jenis) ? "Wajib: tulis kompensasi atau solusinya" : "Catatan (opsional), misalnya kamar tujuan"}
              className="resize-none rounded-[10px] border border-line-input bg-white px-3 py-2 text-[13px]"
            />
          </div>
        ))}
      </div>
      {galat && <p className="mt-3 rounded-[10px] bg-danger-tint px-3 py-2 text-[13px] text-danger-deep">{galat}</p>}
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" disabled={!lengkap || sibuk} onClick={() => void simpan()} className={`rounded-[11px] border-none px-5 py-[10px] text-[13px] font-bold ${lengkap && !sibuk ? "cursor-pointer bg-teal text-white hover:bg-teal-deep" : "cursor-not-allowed bg-surface-tint text-slate-mute"}`}>
          {sibuk ? "Menyimpan…" : "Simpan: sudah diselesaikan"}
        </button>
        <button type="button" onClick={onBatal} className="cursor-pointer rounded-[11px] border border-line-input bg-transparent px-4 py-[10px] text-[13px] text-slate hover:bg-surface-hover">Batal</button>
      </div>
    </div>
  );
}

/** Satu pasangan bentrok: isinya (judul dan kedua sisi) lalu tombol dan formulir "sudah diselesaikan". */
function PasanganBentrok({ pair, bolehSelesaikan, onSelesaikan, children }: { pair: ConflictPair; bolehSelesaikan: boolean; onSelesaikan?: ConflictModalProps["onSelesaikan"]; children: React.ReactNode }) {
  const [buka, setBuka] = useState(false);
  return (
    <section>
      {children}
      {bolehSelesaikan && onSelesaikan && (
        buka ? (
          <FormSelesai pair={pair} onSimpan={(s) => onSelesaikan(pair, s)} onBatal={() => setBuka(false)} />
        ) : (
          <button
            type="button"
            onClick={() => setBuka(true)}
            className="mt-3 w-full cursor-pointer rounded-[11px] border-2 border-teal bg-transparent py-[10px] text-[13px] font-bold text-teal-deep hover:bg-teal hover:text-white"
          >
            Sudah diselesaikan: kedua tamu mendapat solusi
          </button>
        )
      )}
    </section>
  );
}

/**
 * Side-by-side view of a room sold twice, so the owner can compare the two
 * claims and act on either without leaving the screen. Opening one booking in
 * the drawer — what "Tinjau" used to do — showed only half the problem.
 */
export function ConflictModal({
  pairs,
  selesai = [],
  onSelesaikan,
  onBukaLagi,
  bolehSelesaikan = false,
  roomName,
  showMoney,
  onClose,
  onCancelBooking,
  onCheckIn,
  onOpenDetail,
}: ConflictModalProps) {
  return (
    <Modal
      onClose={onClose}
      z={70}
      maxWidth={860}
      scroll
      labelledBy="conflict-title"
    >
      <ModalHeader
        id="conflict-title"
        title={
          pairs.length > 1 ? `${pairs.length} bentrok kamar` : pairs.length === 1 ? "Bentrok kamar" : "Bentrok yang sudah diselesaikan"
        }
        onClose={onClose}
      />
      <p className="mt-1 mb-5 text-[13px] leading-[1.5] text-slate">
        {pairs.length > 0
          ? "Dua booking mengklaim kamar yang sama pada malam yang sama. Pilih satu untuk dipertahankan dan batalkan yang lain, atau tandai sudah diselesaikan bila keduanya sudah mendapat solusi (misalnya kompensasi) — belum ada yang dihapus."
          : "Tidak ada bentrok yang menunggu. Ini yang sudah dinyatakan selesai; bisa dibuka lagi bila perlu."}
      </p>

      <div className="flex flex-col gap-6">
        {pairs.map((pair) => (
          <PasanganBentrok key={`${pair.a.id}-${pair.b.id}-${pair.from}`} pair={pair} bolehSelesaikan={bolehSelesaikan && !!onSelesaikan} onSelesaikan={onSelesaikan}>
            <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-[12px] border border-danger-line bg-danger-tint px-[14px] py-[10px]">
              <span className="h-[9px] w-[9px] shrink-0 rounded-full bg-danger" />
              <span className="text-[13.5px] font-bold text-danger-deep">
                {roomName(pair.roomId)}
              </span>
              <span className="text-[13px] text-danger-ink">
                terjual dua kali pada {overlapLabel(pair)}
              </span>
              <span className="ml-auto font-mono text-[11.5px] text-danger-ink">
                {pair.nights} malam bentrok
              </span>
            </div>

            <div className="flex flex-wrap gap-3">
              <Side
                booking={pair.a}
                showMoney={showMoney}
                onCancelBooking={onCancelBooking}
                onCheckIn={onCheckIn}
                onOpenDetail={onOpenDetail}
              />
              <Side
                booking={pair.b}
                showMoney={showMoney}
                onCancelBooking={onCancelBooking}
                onCheckIn={onCheckIn}
                onOpenDetail={onOpenDetail}
              />
            </div>
          </PasanganBentrok>
        ))}
      </div>

      {selesai.length > 0 && (
        <div className="mt-8">
          <p className="mb-3 text-[14px] font-bold text-teal-deep">Sudah diselesaikan ({selesai.length})</p>
          <div className="flex flex-col gap-3">
            {selesai.map(({ pair, rec }) => (
              <div key={`${pair.a.id}-${pair.b.id}-${pair.from}`} className="rounded-2xl border border-line-strong bg-surface-mute p-4">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span className="rounded-full bg-teal px-2 py-[1px] text-[11px] font-bold text-white">Selesai</span>
                  <span className="text-[13.5px] font-bold">{roomName(pair.roomId)}</span>
                  <span className="text-[13px] text-slate">{overlapLabel(pair)}</span>
                  {onBukaLagi && bolehSelesaikan && (
                    <button type="button" onClick={() => onBukaLagi(pair)} className="ml-auto cursor-pointer border-none bg-transparent text-[12px] text-slate-soft underline hover:text-teal">Buka lagi</button>
                  )}
                </div>
                <ul className="mt-2 grid gap-1 text-[13px]">
                  {[pair.a, pair.b].map((b) => {
                    const x = rec.solusi[b.id];
                    return (
                      <li key={b.id}>
                        <strong>{b.guest}</strong>: {x ? LABEL_SOLUSI[x.jenis] : "—"}
                        {x?.catatan ? <span className="text-slate"> ({x.catatan})</span> : null}
                      </li>
                    );
                  })}
                </ul>
                <p className="mt-2 text-[11.5px] text-slate-soft">Dicatat oleh {rec.oleh}, {new Date(rec.pada).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}.</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </Modal>
  );
}
