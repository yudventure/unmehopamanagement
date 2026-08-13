"use client";

import {
  FIELD_INPUT,
  FIELD_LABEL,
  FIELD_SELECT,
  Modal,
  ModalHeader,
} from "@/components/ui/modal";
import { PROPERTIES } from "@/lib/data";
import { fmt } from "@/lib/format";
import type { BookingForm, ChannelKey, PropertyKey, Room } from "@/lib/types";

export interface BookingFormModalProps {
  form: BookingForm;
  rooms: Room[];
  nights: number;
  rate: number;
  /** The requested range already collides with something on that room. */
  clash: boolean;
  onChange: <K extends keyof BookingForm>(key: K, value: BookingForm[K]) => void;
  onProperty: (property: PropertyKey) => void;
  onClose: () => void;
  onSaveTentative: () => void;
  onSaveConfirmed: () => void;
}

const CHANNEL_OPTIONS: ChannelKey[] = [
  "WhatsApp",
  "Booking.com",
  "Traveloka",
  "Agoda",
];

export function BookingFormModal({
  form,
  rooms,
  nights,
  rate,
  clash,
  onChange,
  onProperty,
  onClose,
  onSaveTentative,
  onSaveConfirmed,
}: BookingFormModalProps) {
  const roomOptions = rooms.filter((r) => r.prop === form.property);

  return (
    <Modal onClose={onClose} z={50} maxWidth={560} scroll labelledBy="form-title">
      <ModalHeader id="form-title" title="Booking baru" onClose={onClose} />
      <div className="mb-[18px] text-[13px] text-slate-soft">
        Untuk booking WhatsApp, walk-in, atau OTA tanpa iCal.
      </div>

      <div className="grid grid-cols-2 gap-[14px]">
        <label className={FIELD_LABEL}>
          Properti
          <select
            value={form.property}
            onChange={(e) => onProperty(e.target.value as PropertyKey)}
            className={FIELD_SELECT}
          >
            {PROPERTIES.map((p) => (
              <option key={p.key} value={p.key}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
        <label className={FIELD_LABEL}>
          Kamar
          <select
            value={form.room}
            onChange={(e) => onChange("room", e.target.value)}
            className={FIELD_SELECT}
          >
            {roomOptions.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
                {r.active ? "" : " (renovasi)"}
              </option>
            ))}
          </select>
        </label>
        <label className={FIELD_LABEL}>
          Check-in
          <input
            type="date"
            value={form.checkIn}
            onChange={(e) => onChange("checkIn", e.target.value)}
            className={FIELD_INPUT}
          />
        </label>
        <label className={FIELD_LABEL}>
          Check-out
          <input
            type="date"
            value={form.checkOut}
            onChange={(e) => onChange("checkOut", e.target.value)}
            className={FIELD_INPUT}
          />
        </label>
      </div>

      <div
        role="status"
        className={`mt-[14px] rounded-xl border px-[14px] py-[11px] text-[12.5px] ${
          clash
            ? "border-danger-line bg-danger-tint text-danger-ink"
            : "border-teal-line bg-teal-tint text-teal-deep"
        }`}
      >
        {clash
          ? "Kamar ini sudah terisi pada rentang tanggal tersebut. Pilih kamar atau tanggal lain."
          : "Kamar tersedia untuk rentang tanggal ini."}
      </div>

      <div className="mt-[14px] grid grid-cols-2 gap-[14px]">
        <label className={FIELD_LABEL}>
          Nama tamu
          <input
            type="text"
            value={form.guest}
            onChange={(e) => onChange("guest", e.target.value)}
            placeholder="Nama lengkap"
            className={FIELD_INPUT}
          />
        </label>
        <label className={FIELD_LABEL}>
          No. WhatsApp
          <input
            type="text"
            value={form.phone}
            onChange={(e) => onChange("phone", e.target.value)}
            placeholder="0812xxxxxxx"
            className={FIELD_INPUT}
          />
        </label>
        <label className={FIELD_LABEL}>
          Jumlah tamu
          <input
            type="number"
            min={1}
            value={form.pax}
            onChange={(e) => onChange("pax", e.target.value)}
            className={FIELD_INPUT}
          />
        </label>
        <label className={FIELD_LABEL}>
          Saluran
          <select
            value={form.channel}
            onChange={(e) => onChange("channel", e.target.value as ChannelKey)}
            className={FIELD_SELECT}
          >
            {CHANNEL_OPTIONS.map((c) => (
              <option key={c} value={c}>
                {c === "WhatsApp" ? "WhatsApp / langsung" : c}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-[14px] flex items-center justify-between rounded-[14px] border border-line bg-surface-mute px-4 py-[13px]">
        <div className="text-[13px] text-slate">
          Total {nights} malam × {fmt(rate)}
        </div>
        <div className="text-[17px] font-bold">{fmt(rate * nights)}</div>
      </div>

      <label className={`${FIELD_LABEL} mt-[14px]`}>
        Catatan
        <textarea
          value={form.notes}
          onChange={(e) => onChange("notes", e.target.value)}
          rows={2}
          placeholder="Jemput di dermaga, alergi makanan laut, dll."
          className={`${FIELD_INPUT} resize-y`}
        />
      </label>

      <div className="mt-5 flex gap-[10px]">
        <button
          type="button"
          onClick={onSaveTentative}
          className="flex-1 cursor-pointer rounded-xl border border-line-input bg-surface py-3 text-[13.5px] font-medium hover:bg-surface-hover"
        >
          Simpan sebagai Tentative
        </button>
        <button
          type="button"
          onClick={onSaveConfirmed}
          className="flex-1 cursor-pointer rounded-xl border-none bg-teal py-3 text-[13.5px] font-bold text-white hover:bg-teal-deep"
        >
          Simpan &amp; Konfirmasi
        </button>
      </div>
    </Modal>
  );
}
