"use client";

import { Pill } from "@/components/ui/pill";
import { CH } from "@/lib/data";
import { dayDiff, fmt, fmtDate, fmtDateTime } from "@/lib/format";
import { statusColors } from "@/lib/pills";
import type { Booking, BookingStatus } from "@/lib/types";

export interface BookingDrawerProps {
  booking: Booking;
  roomName: string;
  narrow: boolean;
  showMoney: boolean;
  onClose: () => void;
  onSetStatus: (status: BookingStatus) => void;
}

const PRIMARY_ACTION =
  "w-full cursor-pointer rounded-[11px] border-none bg-teal py-[11px] text-[13px] font-medium text-white hover:bg-teal-deep";

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex-1">
      <div className="text-[11.5px] text-slate-soft">{label}</div>
      <div className="text-[14px] font-medium">{value}</div>
    </div>
  );
}

export function BookingDrawer({
  booking,
  roomName,
  narrow,
  showMoney,
  onClose,
  onSetStatus,
}: BookingDrawerProps) {
  const channel = CH[booking.channel];
  const nights = dayDiff(booking.checkIn, booking.checkOut);

  const nextStatus: Partial<
    Record<BookingStatus, { label: string; to: BookingStatus }>
  > = {
    Tentative: { label: "Konfirmasi booking", to: "Confirmed" },
    Confirmed: { label: "Tandai Check-in", to: "Checked-in" },
    "Checked-in": { label: "Tandai Check-out", to: "Checked-out" },
  };
  const advance = nextStatus[booking.status];

  return (
    <div
      className={
        narrow
          ? "fixed inset-0 z-[55] animate-pop-in overflow-auto bg-surface px-[18px] pt-5 pb-[26px]"
          : "max-h-screen w-[352px] shrink-0 animate-slide-in overflow-auto border-l border-line bg-surface px-[22px] pt-[22px] pb-[26px]"
      }
      role={narrow ? "dialog" : undefined}
      aria-modal={narrow ? true : undefined}
      aria-label={`Detail booking ${booking.guest}`}
    >
      <div className="mb-[18px] flex items-start gap-3">
        <div className="flex-1">
          <Pill colors={{ bg: channel.bg, fg: channel.fg }}>
            {booking.channel}
          </Pill>
          <div className="mt-[9px] text-[20px] leading-[1.25] font-bold">
            {booking.guest}
          </div>
          <div className="mt-1 font-mono text-[11.5px] text-slate-mute">
            {booking.id} ·{" "}
            {booking.src === "iCal" ? "impor iCal" : "input manual"}
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Tutup detail"
          className="h-[30px] w-[30px] shrink-0 cursor-pointer rounded-[10px] border border-line-strong bg-surface text-[14px] text-slate hover:bg-surface-hover"
        >
          ✕
        </button>
      </div>

      <div className="mb-[14px] rounded-2xl border border-line bg-surface-mute px-4 py-[14px]">
        <div className="mb-3 flex gap-4">
          <Field label="Check-in" value={fmtDate(booking.checkIn)} />
          <Field label="Check-out" value={fmtDate(booking.checkOut)} />
        </div>
        <div className="flex gap-4">
          <Field label="Kamar" value={roomName} />
          <Field label="Tamu" value={`${booking.pax} tamu`} />
        </div>
      </div>

      <div className="mb-4 flex gap-2">
        <Pill colors={statusColors(booking.status)}>{booking.status}</Pill>
      </div>

      {showMoney && (
        <div className="mb-[14px] flex justify-between rounded-2xl border border-line px-4 py-[14px] text-[13.5px]">
          <span className="text-slate">Total {nights} malam</span>
          <span className="font-bold">{fmt(booking.total)}</span>
        </div>
      )}

      <div className="mb-[9px] font-mono text-[10.5px] tracking-[.09em] text-slate-faint uppercase">
        Kontak &amp; catatan
      </div>
      <div className="mb-[18px] text-[13.5px] leading-[1.55] text-ink-soft">
        {booking.phone} — {booking.notes}
      </div>

      <div className="flex flex-col gap-2">
        {advance && (
          <button
            type="button"
            onClick={() => onSetStatus(advance.to)}
            className={PRIMARY_ACTION}
          >
            {advance.label}
          </button>
        )}
        <button
          type="button"
          onClick={() => onSetStatus("Cancelled")}
          className="w-full cursor-pointer rounded-[11px] border border-danger-edge bg-surface py-[11px] text-[13px] text-danger-ink"
        >
          Batalkan booking
        </button>
      </div>

      {/* Real trail: stamped by patchBooking when the booking actually
          changes, rather than the fixed date the prototype printed. */}
      <div className="mt-[18px] text-[11.5px] leading-[1.6] text-slate-ghost">
        {booking.updatedAt && (
          <>
            Terakhir diperbarui oleh {booking.updatedBy},{" "}
            {fmtDateTime(new Date(booking.updatedAt))}.{" "}
          </>
        )}
        Sumber data:{" "}
        {booking.src === "iCal"
          ? `feed iCal ${booking.channel}`
          : "input manual"}
      </div>
    </div>
  );
}
