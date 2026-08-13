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

/**
 * One booking's run across a single week row. A stay that crosses a Saturday
 * is cut into one segment per row, each remembering whether it is continuing
 * so the bar can be drawn open-ended on that side.
 */
export interface BookingSpan {
  booking: Booking;
  label: string;
  bg: string;
  fg: string;
  dot: string;
  /** Column 0-6 where this segment starts, and how many columns it covers. */
  startCol: number;
  span: number;
  /** Stacking row within the week, assigned so segments never overlap. */
  lane: number;
  continuesLeft: boolean;
  continuesRight: boolean;
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
  /** Bookings on this day pushed past the lane cap. */
  hiddenCount: number;
}

export interface CalendarWeek {
  cells: CalendarCell[];
  spans: BookingSpan[];
  /** Lanes occupied in this row, before the cap is applied. */
  lanes: number;
}

export interface CalendarArgs {
  visible: Booking[];
  rooms: Room[];
  month: Date;
  today: string;
  activeRooms: Room[];
  /** Lanes drawn per week before the rest collapse into "+N lagi". */
  perDay: number;
}

const DAY = 86400000;
const shift = (date: string, days: number) =>
  iso(new Date(parse(date).getTime() + days * DAY));

/**
 * Always six rows of seven, so the grid height never jumps between months.
 *
 * Every cell carries a real date, including the neighbour-month days at either
 * end, so a stay straddling the month boundary still draws as one unbroken run
 * instead of stopping at the edge.
 */
export function buildCalendar({
  visible,
  rooms,
  month,
  today,
  activeRooms,
  perDay,
}: CalendarArgs): CalendarWeek[] {
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
    const occList = visible.filter(
      (b) => b.checkIn <= dateStr && b.checkOut > dateStr,
    );

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
      hiddenCount: 0,
    });
  }

  const weeks: CalendarWeek[] = [];
  for (let w = 0; w < 6; w++) {
    const rowCells = cells.slice(w * 7, w * 7 + 7);
    const first = rowCells[0].dateStr;
    const last = rowCells[6].dateStr;

    const spans = visible
      .filter((b) => b.checkIn <= last && b.checkOut > first)
      .map((b) => {
        let s = 0;
        while (s < 6 && rowCells[s].dateStr < b.checkIn) s += 1;
        let e = 6;
        while (e > 0 && rowCells[e].dateStr >= b.checkOut) e -= 1;
        const c = CH[b.channel];
        const room = byId.get(b.roomId);
        return {
          booking: b,
          label: `${b.guest.split(" ")[0]} · ${room?.name ?? ""}`,
          bg: b.conflict ? "#FEE4E2" : c.bg,
          fg: b.conflict ? "#B42318" : c.fg,
          dot: b.conflict ? "#DC2626" : c.dot,
          startCol: s,
          span: e - s + 1,
          lane: 0,
          continuesLeft: b.checkIn < first,
          continuesRight: b.checkOut > shift(last, 1),
        };
      })
      /* Longest run first at a given start, so the wide bars settle into the
         top lanes and the short ones fill in beneath. Id breaks ties to keep
         the layout stable across re-renders. */
      .sort(
        (a, b) =>
          a.startCol - b.startCol ||
          b.span - a.span ||
          a.booking.id.localeCompare(b.booking.id),
      );

    const laneEnd: number[] = [];
    spans.forEach((s) => {
      let lane = 0;
      while (lane < laneEnd.length && laneEnd[lane] >= s.startCol) lane += 1;
      s.lane = lane;
      laneEnd[lane] = s.startCol + s.span - 1;
    });

    rowCells.forEach((cell, col) => {
      cell.hiddenCount = spans.filter(
        (s) => s.lane >= perDay && s.startCol <= col && s.startCol + s.span > col,
      ).length;
    });

    weeks.push({ cells: rowCells, spans, lanes: laneEnd.length });
  }

  return weeks;
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
