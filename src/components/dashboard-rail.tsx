"use client";

import { Pill } from "@/components/ui/pill";
import { CH, CHANNEL_LABELS } from "@/lib/data";
import { fmtDate, fmtShort } from "@/lib/format";
import type { Booking } from "@/lib/types";

export interface DayEntry {
  booking: Booking;
  roomName: string;
  /** Nights from today until check-in. Only set on the arrivals list. */
  leadDays?: number;
}

export interface DashboardRailProps {
  narrow: boolean;
  /** Arrivals from today through `upcomingDays`, soonest first. */
  upcoming: DayEntry[];
  upcomingDays: number;
  onSelect: (id: string) => void;
  /** Day picked on the calendar, or null for the standing list. */
  selectedDate: string | null;
  dayBookings: DayEntry[];
  onClearDate: () => void;
}

/** "Hari ini" / "Besok" earn a marker; past that the date itself is clearer. */
function leadLabel(days: number | undefined) {
  if (days === 0) return "Hari ini";
  if (days === 1) return "Besok";
  return undefined;
}

/**
 * Today's arrivals, or the guests staying on a day picked from the calendar,
 * parked in the right-hand column so they sit beside the grid instead of below
 * it.
 *
 * The rail shares its slot with `BookingDrawer` — the caller renders one or the
 * other, never both. That keeps the shell exactly as wide as it was, so the
 * measured-width rules that decide when the drawer becomes an overlay
 * (NARROW_MAX / DRAWER_OVERLAY_MAX in booking-manager.tsx) still hold.
 *
 * Below NARROW_MAX the shell stacks vertically, so the rail drops under the
 * calendar and renders as a card again.
 */

/** Badges the booking's source — which OTA, or WhatsApp / walk-in. */
function Row({
  guest,
  meta,
  lead,
  channel,
  onClick,
}: {
  guest: string;
  meta: string;
  lead?: string;
  channel: Booking["channel"];
  onClick: () => void;
}) {
  const c = CH[channel];
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full cursor-pointer flex-col gap-[3px] rounded-xl border border-line bg-surface-mute px-3 py-[9px] text-left hover:bg-surface-hover"
    >
      <span className="flex items-center gap-[9px]">
        <span
          className="h-2 w-2 shrink-0 rounded-[3px]"
          style={{ background: c.dot }}
        />
        <span className="min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-[13.5px] font-medium">
          {guest}
        </span>
        <Pill colors={{ bg: c.bg, fg: c.fg }}>{CHANNEL_LABELS[channel]}</Pill>
      </span>
      <span className="pl-[17px] text-[12px] text-slate-soft">
        {lead && <span className="font-medium text-teal">{lead} · </span>}
        {meta}
      </span>
    </button>
  );
}

function Section({
  title,
  hint,
  count,
  card,
  empty,
  children,
}: {
  title: string;
  hint?: string;
  count: number;
  card: boolean;
  empty: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className={
        card
          ? "min-w-[280px] flex-1 rounded-[18px] border border-line-soft bg-surface px-[18px] py-4"
          : ""
      }
    >
      <div className="mb-3 flex items-center gap-2">
        <h2 className="text-[14px] font-bold">{title}</h2>
        <span className="rounded-full bg-surface-tint px-[7px] py-[1px] font-mono text-[10.5px] text-slate-soft">
          {count}
        </span>
        {hint && (
          <span className="ml-auto text-[11.5px] text-slate-mute">{hint}</span>
        )}
      </div>
      <div className="flex flex-col gap-[9px]">
        {count === 0 ? (
          <div className="text-[13px] text-slate-mute">{empty}</div>
        ) : (
          children
        )}
      </div>
    </section>
  );
}

export function DashboardRail({
  narrow,
  upcoming,
  upcomingDays,
  onSelect,
  selectedDate,
  dayBookings,
  onClearDate,
}: DashboardRailProps) {
  const stay = (b: Booking) =>
    `${fmtShort(b.checkIn)} – ${fmtShort(b.checkOut)}`;

  /* A picked day replaces the standing lists rather than stacking above them:
     it answers a question the owner just asked, and it is the only place the
     bookings hidden behind "+N lagi" can be read. */
  const sections = selectedDate ? (
    <section
      className={
        narrow
          ? "min-w-[280px] flex-1 rounded-[18px] border border-line-soft bg-surface px-[18px] py-4"
          : ""
      }
    >
      <div className="mb-3 flex items-start gap-2">
        <div className="flex-1">
          <div className="text-[11.5px] text-slate-soft">Booking pada</div>
          <h2 className="text-[14px] font-bold">{fmtDate(selectedDate)}</h2>
        </div>
        <span className="mt-[2px] rounded-full bg-surface-tint px-[7px] py-[1px] font-mono text-[10.5px] text-slate-soft">
          {dayBookings.length}
        </span>
        <button
          type="button"
          onClick={onClearDate}
          aria-label="Tutup daftar tanggal"
          className="mt-[1px] flex h-[22px] w-[22px] cursor-pointer items-center justify-center rounded-full border-none bg-surface-tint text-[13px] text-slate hover:bg-surface-hover"
        >
          ×
        </button>
      </div>
      <div className="flex flex-col gap-[9px]">
        {dayBookings.length === 0 ? (
          <div className="text-[13px] text-slate-mute">
            Tidak ada tamu menginap pada tanggal ini.
          </div>
        ) : (
          dayBookings.map(({ booking, roomName }) => (
            <Row
              key={booking.id}
              guest={booking.guest}
              lead={booking.checkIn === selectedDate ? "Check-in" : undefined}
              meta={`${roomName} · ${stay(booking)}`}
              channel={booking.channel}
              onClick={() => onSelect(booking.id)}
            />
          ))
        )}
      </div>
    </section>
  ) : (
    <Section
      title="Check-in terdekat"
      hint={`${upcomingDays} hari ke depan`}
      count={upcoming.length}
      card={narrow}
      empty={`Tidak ada check-in dalam ${upcomingDays} hari ke depan.`}
    >
      {upcoming.map(({ booking, roomName, leadDays }) => (
        <Row
          key={booking.id}
          guest={booking.guest}
          lead={leadLabel(leadDays)}
          meta={`${roomName} · ${stay(booking)}`}
          channel={booking.channel}
          onClick={() => onSelect(booking.id)}
        />
      ))}
    </Section>
  );

  if (narrow) {
    return (
      <div className="flex flex-wrap gap-4 bg-surface-soft px-[14px] pb-6">
        {sections}
      </div>
    );
  }

  return (
    <aside className="flex max-h-screen w-[352px] shrink-0 flex-col gap-6 overflow-auto border-l border-line bg-surface px-[22px] pt-[22px] pb-[26px]">
      {sections}
    </aside>
  );
}
