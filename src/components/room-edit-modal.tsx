"use client";

import { useState } from "react";

import {
  FIELD_INPUT,
  FIELD_LABEL,
  Modal,
  ModalHeader,
} from "@/components/ui/modal";

/** The room fields this dialog owns. Everything else on the row is derived. */
export interface RoomEditTarget {
  id: string;
  name: string;
  cap: string;
  rate: number;
  active: boolean;
  /** Bookings still to come on this room — a renovation would strand them. */
  upcoming: number;
}

export interface RoomPatch {
  name: string;
  cap: string;
  rate: number;
  active: boolean;
}

export interface RoomEditModalProps {
  room: RoomEditTarget;
  /** Staff never see rupiah, so the rate field is left out entirely for them. */
  showMoney: boolean;
  onClose: () => void;
  /** Returns a message when the save is rejected, or null when it went in. */
  onSave: (id: string, patch: RoomPatch) => string | null;
  /** Kamar baru: judul dan tombol berubah, dan selalu bisa disimpan. */
  baru?: boolean;
  /** Menghapus kamar. Kembali berisi alasan bila ditolak. */
  onDelete?: (id: string) => string | null;
}

const digits = (s: string) => s.replace(/\D/g, "");
const grouped = (n: number) => n.toLocaleString("id-ID");

function StatusChoice({
  active,
  onChange,
}: {
  active: boolean;
  onChange: (value: boolean) => void;
}) {
  const chip = (on: boolean) =>
    `flex-1 cursor-pointer rounded-[11px] border px-3 py-[10px] text-[13px] ${
      on
        ? "border-teal bg-teal-tint font-bold text-teal-deep"
        : "border-line-input bg-surface text-slate"
    }`;

  return (
    <div className="flex flex-col gap-[6px] text-[12.5px] text-slate">
      Status kamar
      <div className="flex gap-[10px]">
        <button
          type="button"
          onClick={() => onChange(true)}
          aria-pressed={active}
          className={chip(active)}
        >
          Aktif
        </button>
        <button
          type="button"
          onClick={() => onChange(false)}
          aria-pressed={!active}
          className={chip(!active)}
        >
          Renovasi
        </button>
      </div>
    </div>
  );
}

/**
 * Room detail editor. The table used to take a nightly rate straight from an
 * inline field, which meant a stray keystroke on the wrong row repriced a room
 * with nothing to confirm and nothing to cancel. Every change now goes through
 * this dialog, so it is deliberate and can be abandoned with Escape.
 */
export function RoomEditModal({
  room,
  showMoney,
  onClose,
  onSave,
  baru = false,
  onDelete,
}: RoomEditModalProps) {
  const [name, setName] = useState(room.name);
  const [cap, setCap] = useState(room.cap);
  const [rate, setRate] = useState(grouped(room.rate));
  const [active, setActive] = useState(room.active);
  const [error, setError] = useState("");

  const nextRate = showMoney ? Number(digits(rate)) : room.rate;
  const dirty =
    baru ||
    name !== room.name ||
    cap !== room.cap ||
    nextRate !== room.rate ||
    active !== room.active;

  const submit = () => {
    const problem = onSave(room.id, {
      name,
      cap,
      rate: nextRate,
      active,
    });
    if (problem) {
      setError(problem);
      return;
    }
    onClose();
  };

  const onEnter = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") submit();
  };

  return (
    <Modal onClose={onClose} z={70} maxWidth={460} labelledBy="room-edit-title">
      <ModalHeader
        id="room-edit-title"
        title={baru ? "Tambah kamar" : "Ubah detail kamar"}
        onClose={onClose}
      />
      <div className="mb-[18px] text-[13px] leading-[1.5] text-slate-soft">
        {baru
          ? "Kamar baru langsung muncul di kalender dan bisa disambungkan ke situs pemesanan."
          : "Perubahan berlaku untuk booking berikutnya. Booking yang sudah tercatat tetap memakai harga saat disimpan."}
      </div>

      <div className="flex flex-col gap-[14px]">
        <label className={FIELD_LABEL}>
          Nama kamar
          <input
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setError("");
            }}
            onKeyDown={onEnter}
            placeholder="mis. Turtle 01"
            className={FIELD_INPUT}
          />
        </label>

        <label className={FIELD_LABEL}>
          Kapasitas
          <input
            type="text"
            value={cap}
            onChange={(e) => {
              setCap(e.target.value);
              setError("");
            }}
            onKeyDown={onEnter}
            placeholder="mis. 2 dewasa + 2 anak"
            className={FIELD_INPUT}
          />
        </label>

        {showMoney && (
          <label className={FIELD_LABEL}>
            Harga per malam
            <span className="flex items-center gap-[8px]">
              <span className="text-[13px] text-slate-mute">Rp</span>
              <input
                value={rate}
                onChange={(e) => {
                  const d = digits(e.target.value);
                  setRate(d ? grouped(Number(d)) : "");
                  setError("");
                }}
                onKeyDown={onEnter}
                inputMode="numeric"
                aria-label="Harga per malam"
                className={`${FIELD_INPUT} flex-1 font-mono`}
              />
            </span>
          </label>
        )}

        <StatusChoice active={active} onChange={setActive} />

        {/* Turning a room off does not move anyone out of it. If bookings are
            already on the books, whoever flips the switch needs to know. */}
        {!active && room.active && room.upcoming > 0 && (
          <div className="rounded-[12px] border border-amber-soft bg-amber-soft/40 px-3 py-[10px] text-[12.5px] leading-[1.5] text-amber-ink">
            Kamar ini masih punya {room.upcoming} booking yang belum selesai.
            Menandainya renovasi tidak membatalkan booking itu — hubungi
            tamunya, atau pindahkan ke kamar lain dulu.
          </div>
        )}
      </div>

      {error && <div className="mt-3 text-[12.5px] text-danger-ink">{error}</div>}

      <div className="mt-5 flex gap-[10px]">
        <button
          type="button"
          onClick={onClose}
          className="cursor-pointer rounded-xl border border-line-strong bg-surface px-4 py-3 text-[13.5px] font-medium hover:bg-surface-hover"
        >
          Batal
        </button>
        <button
          type="button"
          onClick={submit}
          disabled={!dirty}
          className={`flex-1 rounded-xl border-none py-3 text-[13.5px] font-bold ${
            dirty
              ? "cursor-pointer bg-teal text-white hover:bg-teal-deep"
              : "cursor-not-allowed bg-surface-tint text-slate-mute"
          }`}
        >
          {baru ? "Tambah kamar" : dirty ? "Simpan perubahan" : "Belum ada perubahan"}
        </button>
      </div>

      {onDelete && !baru && (
        <div className="mt-4 rounded-[12px] bg-surface-mute px-3 py-[10px] text-[12.5px] leading-[1.5] text-slate">
          {room.upcoming > 0
            ? "Kamar yang masih punya booking tidak bisa dihapus. Nonaktifkan saja."
            : "Menghapus kamar membuangnya dari kalender. Kamar yang pernah punya booking atau sambungan kalender tidak bisa dihapus, nonaktifkan saja."}
          <button
            type="button"
            disabled={room.upcoming > 0}
            onClick={() => {
              const problem = onDelete(room.id);
              if (problem) setError(problem);
              else onClose();
            }}
            className="mt-2 block cursor-pointer rounded-[9px] border border-danger-line bg-surface px-3 py-[6px] text-[12.5px] font-medium text-danger-ink hover:bg-danger-tint disabled:cursor-not-allowed disabled:opacity-50"
          >
            Hapus kamar ini
          </button>
        </div>
      )}
    </Modal>
  );
}
