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
  label: string;
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
  hiddenCount: number;
}

export interface CalendarArgs {
  visible: Booking[];
  rooms: Room[];
  month: Date;
  today: string;
  activeRooms: Room[];
  /** Chips drawn per day before collapsing into "+N lagi". */
  perDay: number;
}

/** Always six rows of seven, so the grid height never jumps between months. */
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
    const label = inMonth
      ? dayNum
      : dayNum < 1
        ? prevDays + dayNum
        : dayNum - daysInMonth;
    const dateStr = inMonth ? iso(new Date(y, m, dayNum)) : "";
    const occList = inMonth
      ? visible.filter((b) => b.checkIn <= dateStr && b.checkOut > dateStr)
      : [];
    const starts = inMonth ? visible.filter((b) => b.checkIn === dateStr) : [];

    cells.push({
      label,
      dateStr,
      inMonth,
      isToday: dateStr === today,
      conflictHere: occList.filter((b) => b.conflict).length > 1,
      occupied: occList.length,
      capacity: activeRooms.length,
      chips: starts.slice(0, perDay).map((b) => {
        const c = CH[b.channel];
        const room = byId.get(b.roomId);
        return {
          booking: b,
          label: `${b.guest.split(" ")[0]} · ${(room?.name ?? "").replace("Turtle ", "T")}`,
          bg: b.conflict ? "#FEE4E2" : c.bg,
          fg: b.conflict ? "#B42318" : c.fg,
          dot: b.conflict ? "#DC2626" : c.dot,
        };
      }),
      hiddenCount: Math.max(0, starts.length - perDay),
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
