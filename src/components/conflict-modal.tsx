"use client";

import { Modal, ModalHeader } from "@/components/ui/modal";
import { Pill } from "@/components/ui/pill";
import { CH, CHANNEL_LABELS } from "@/lib/data";
import type { ConflictPair } from "@/lib/derive";
import { dayDiff, fmt, fmtDate, fmtShort, iso, parse } from "@/lib/format";
import { statusColors } from "@/lib/pills";
import type { Booking } from "@/lib/types";

export interface ConflictModalProps {
  pairs: ConflictPair[];
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
        {booking.id} · {booking.src === "iCal" ? "impor iCal" : "input manual"}
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
            {nights} malam · {booking.pax} tamu
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

/**
 * Side-by-side view of a room sold twice, so the owner can compare the two
 * claims and act on either without leaving the screen. Opening one booking in
 * the drawer — what "Tinjau" used to do — showed only half the problem.
 */
export function ConflictModal({
  pairs,
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
          pairs.length > 1 ? `${pairs.length} bentrok kamar` : "Bentrok kamar"
        }
        onClose={onClose}
      />
      <p className="mt-1 mb-5 text-[13px] leading-[1.5] text-slate">
        Dua booking mengklaim kamar yang sama pada malam yang sama. Pilih satu
        untuk dipertahankan dan batalkan yang lain — belum ada yang dihapus.
      </p>

      <div className="flex flex-col gap-6">
        {pairs.map((pair) => (
          <section key={`${pair.a.id}-${pair.b.id}`}>
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
          </section>
        ))}
      </div>
    </Modal>
  );
}
