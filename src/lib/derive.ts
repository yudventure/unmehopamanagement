import { CH } from "./data";
import { dayDiff, iso, parse } from "./format";
import type { Booking, ChannelKey, PropertyKey, Room } from "./types";

export type PropFilter = PropertyKey | "all";
export type ChannelFilter = ChannelKey | "all";

export interface VisibleArgs {
  bookings: Booking[];
  rooms: Room[];
  filterProp: PropFilter;
  filterCh: ChannelFilter;
  query: string;
}

/** Sidebar filters + search box, applied together. Cancelled bookings drop out. */
export function visibleBookings({
  bookings,
  rooms,
  filterProp,
  filterCh,
  query,
}: VisibleArgs): Booking[] {
  const q = query.trim().toLowerCase();
  const byId = new Map(rooms.map((r) => [r.id, r]));
  return bookings.filter((b) => {
    const r = byId.get(b.roomId);
    if (!r) return false;
    if (filterProp !== "all" && r.prop !== filterProp) return false;
    if (filterCh !== "all" && b.channel !== filterCh) return false;
    if (
      q &&
      !(
        b.guest.toLowerCase().includes(q) ||
        r.name.toLowerCase().includes(q) ||
        b.id.toLowerCase().includes(q)
      )
    )
      return false;
    return b.status !== "Cancelled";
  });
}

export function activeRoomsFor(rooms: Room[], filterProp: PropFilter): Room[] {
  return rooms.filter(
    (r) => r.active && (filterProp === "all" || r.prop === filterProp),
  );
}

export interface Chip {
  booking: Booking;
  /** Guest's first name. */
  label: string;
  /**
   * Room, on its own line. Guest and room together overflow a day column, and
   * truncating the room is exactly what dropping the abbreviation avoided.
   */
  room: string;
  /** "2/4" on a multi-night stay, empty on a one-nighter. */
  nightLabel: string;
  bg: string;
  fg: string;
  dot: string;
}

export interface CalendarCell {
  /** Day number as printed — leading/trailing cells show the neighbour month's. */
  label: number;
  dateStr: string;
  inMonth: boolean;
  isToday: boolean;
  /** Two or more overlapping iCal bookings land on this day. */
  conflictHere: boolean;
  occupied: number;
  capacity: number;
  chips: Chip[];
  /** Bookings on this day pushed past the per-day cap. */
  hiddenCount: number;
}

export interface CalendarArgs {
  visible: Booking[];
  rooms: Room[];
  month: Date;
  today: string;
  activeRooms: Room[];
  /** Chips drawn per day before the rest collapse into "+N lagi". */
  perDay: number;
}

/**
 * Always six rows of seven, so the grid height never jumps between months.
 *
 * A booking appears on every night it occupies, not just its arrival day, so
 * the length of a stay is readable straight off the grid. Chips are ordered by
 * room, which keeps a given booking at roughly the same height from one day to
 * the next — without that the eye cannot follow a stay across the week.
 */
export function buildCalendar({
  visible,
  rooms,
  month,
  today,
  activeRooms,
  perDay,
}: CalendarArgs): CalendarCell[] {
  const y = month.getFullYear();
  const m = month.getMonth();
  const daysInMonth = new Date(y, m + 1, 0).getDate();
  const firstDow = new Date(y, m, 1).getDay();
  const prevDays = new Date(y, m, 0).getDate();
  const byId = new Map(rooms.map((r) => [r.id, r]));

  const cells: CalendarCell[] = [];
  for (let i = 0; i < 42; i++) {
    const dayNum = i - firstDow + 1;
    const inMonth = dayNum >= 1 && dayNum <= daysInMonth;
    const dateStr = iso(new Date(y, m, dayNum));
    const occList = visible
      .filter((b) => b.checkIn <= dateStr && b.checkOut > dateStr)
      .sort((a, b) => {
        const ra = byId.get(a.roomId)?.name ?? "";
        const rb = byId.get(b.roomId)?.name ?? "";
        return ra.localeCompare(rb) || a.id.localeCompare(b.id);
      });

    cells.push({
      label: inMonth
        ? dayNum
        : dayNum < 1
          ? prevDays + dayNum
          : dayNum - daysInMonth,
      dateStr,
      inMonth,
      isToday: dateStr === today,
      conflictHere: occList.filter((b) => b.conflict).length > 1,
      occupied: occList.length,
      capacity: activeRooms.length,
      chips: occList.slice(0, perDay).map((b) => {
        const c = CH[b.channel];
        const room = byId.get(b.roomId);
        const nights = dayDiff(b.checkIn, b.checkOut);
        const nth = dayDiff(b.checkIn, dateStr) + 1;
        return {
          booking: b,
          label: b.guest.split(" ")[0],
          room: room?.name ?? "",
          /* Says both that the stay runs past tonight and where tonight sits
             inside it, so the same name on four days reads as one booking
             rather than four separate ones. */
          nightLabel: nights > 1 ? `${nth}/${nights}` : "",
          bg: b.conflict ? "#FEE4E2" : c.bg,
          fg: b.conflict ? "#B42318" : c.fg,
          dot: b.conflict ? "#DC2626" : c.dot,
        };
      }),
      hiddenCount: Math.max(0, occList.length - perDay),
    });
  }

  return cells;
}

export interface MonthStats {
  nights: number;
  revenue: number;
  commission: number;
  byChannel: Partial<Record<ChannelKey, number>>;
  byRoom: Record<string, number>;
  capacity: number;
  occPct: number;
}

/**
 * Revenue is spread evenly across a booking's nights, so a stay that straddles
 * a month boundary only books the nights that actually fall inside the month.
 */
export function monthStats(
  visible: Booking[],
  month: Date,
  activeRooms: Room[],
): MonthStats {
  const y = month.getFullYear();
  const m = month.getMonth();
  const daysInMonth = new Date(y, m + 1, 0).getDate();

  let nights = 0;
  let revenue = 0;
  let commission = 0;
  const byChannel: Partial<Record<ChannelKey, number>> = {};
  const byRoom: Record<string, number> = {};

  visible.forEach((b) => {
    const span = dayDiff(b.checkIn, b.checkOut);
    for (let d = 0; d < span; d++) {
      const dt = new Date(parse(b.checkIn).getTime() + d * 86400000);
      if (dt.getMonth() === m && dt.getFullYear() === y) {
        nights++;
        const per = b.total / span;
        revenue += per;
        commission += per * CH[b.channel].com;
        byChannel[b.channel] = (byChannel[b.channel] ?? 0) + per;
        byRoom[b.roomId] = (byRoom[b.roomId] ?? 0) + 1;
      }
    }
  });

  const capacity = activeRooms.length * daysInMonth;
  return {
    nights,
    revenue,
    commission,
    byChannel,
    byRoom,
    capacity,
    occPct: capacity ? Math.round((nights / capacity) * 100) : 0,
  };
}

/** True when the requested range collides with anything already on that room. */
export function hasClash(
  bookings: Booking[],
  roomId: string,
  checkIn: string,
  checkOut: string,
): boolean {
  return bookings.some(
    (b) =>
      b.roomId === roomId &&
      b.status !== "Cancelled" &&
      b.checkIn < checkOut &&
      b.checkOut > checkIn,
  );
}
