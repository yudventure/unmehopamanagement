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
  /** Nights any two bookings both claim, shaded on the grid. */
  conflictDays: Set<string>;
  /** Bookings caught in an overlap, drawn in the danger palette. */
  conflictIds: Set<string>;
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
  conflictDays,
  conflictIds,
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
      conflictHere: conflictDays.has(dateStr),
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
          bg: conflictIds.has(b.id) ? "#FBE3DA" : c.bg,
          fg: conflictIds.has(b.id) ? "#B04A3A" : c.fg,
          dot: conflictIds.has(b.id) ? "#DC2626" : c.dot,
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

/** Two bookings claiming the same room on the same nights. */
export interface ConflictPair {
  roomId: string;
  a: Booking;
  b: Booking;
  /** First night both claim. */
  from: string;
  /** Morning the overlap ends — exclusive, like `checkOut`. */
  to: string;
  nights: number;
}

/**
 * Every overlapping pair, found by comparing dates rather than reading a flag
 * on the seed — a double booking entered by hand has to surface the same way an
 * imported one does.
 *
 * Deliberately fed the unfiltered book: a sidebar filter narrows what you are
 * looking at, and must never be able to hide a room sold twice.
 */
export function findConflicts(bookings: Booking[]): ConflictPair[] {
  const byRoom = new Map<string, Booking[]>();
  bookings.forEach((b) => {
    if (b.status === "Cancelled") return;
    const list = byRoom.get(b.roomId);
    if (list) list.push(b);
    else byRoom.set(b.roomId, [b]);
  });

  const pairs: ConflictPair[] = [];
  byRoom.forEach((list, roomId) => {
    const sorted = [...list].sort((x, y) => x.checkIn.localeCompare(y.checkIn));
    for (let i = 0; i < sorted.length; i += 1) {
      for (let j = i + 1; j < sorted.length; j += 1) {
        const a = sorted[i];
        const b = sorted[j];
        /* Sorted by arrival, so once one starts after `a` ends, so does
           everything behind it. */
        if (b.checkIn >= a.checkOut) break;
        const from = a.checkIn > b.checkIn ? a.checkIn : b.checkIn;
        const to = a.checkOut < b.checkOut ? a.checkOut : b.checkOut;
        pairs.push({ roomId, a, b, from, to, nights: dayDiff(from, to) });
      }
    }
  });
  return pairs;
}

/** Nights covered by any overlap, for shading those days on the grid. */
export function conflictDates(pairs: ConflictPair[]): Set<string> {
  const out = new Set<string>();
  pairs.forEach((p) => {
    for (let d = 0; d < p.nights; d += 1) {
      out.add(iso(new Date(parse(p.from).getTime() + d * 86400000)));
    }
  });
  return out;
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

/**
 * Which rooms in a property are free for a whole stay, not just one night.
 *
 * Telling somebody their room is taken and stopping there leaves them to try
 * the other nine one at a time. This answers the question they actually have.
 *
 * `hasClash` per room rather than a set of occupied ids: a stay overlaps the
 * range if it starts before the checkout and ends after the check-in, which is
 * a comparison against the range and not against any single date in it.
 *
 * Rooms under renovation come back separately. They can still be booked from
 * the form — an owner may well take one that is about to reopen — but they do
 * not belong in a list headed "free", and a name in that list is a suggestion.
 */
export function freeRooms(
  bookings: Booking[],
  rooms: Room[],
  property: string,
  checkIn: string,
  checkOut: string,
): { free: Room[]; renovating: Room[]; occupied: number } {
  const inProperty = rooms.filter((r) => r.prop === property);
  const vacant = inProperty.filter(
    (r) => !hasClash(bookings, r.id, checkIn, checkOut),
  );
  return {
    free: vacant.filter((r) => r.active),
    renovating: vacant.filter((r) => !r.active),
    occupied: inProperty.length - vacant.length,
  };
}

// ------------------------------------------------------------------- trends

/** Nights of this stay that land inside the given month. */
export function nightsInMonth(b: Booking, y: number, m: number): number {
  const span = dayDiff(b.checkIn, b.checkOut);
  let n = 0;
  for (let d = 0; d < span; d += 1) {
    const dt = new Date(parse(b.checkIn).getTime() + d * 86400000);
    if (dt.getMonth() === m && dt.getFullYear() === y) n += 1;
  }
  return n;
}

/** A booking with at least one night in the month — what the month "contains". */
export function inMonth(b: Booking, month: Date): boolean {
  return nightsInMonth(b, month.getFullYear(), month.getMonth()) > 0;
}

export interface DayOccupancy {
  date: string;
  /** Day of month as printed. */
  day: number;
  /** 0 = Minggu. */
  dow: number;
  occupied: number;
  capacity: number;
  pct: number;
  isToday: boolean;
  isWeekend: boolean;
  past: boolean;
}

/**
 * Rooms sold per night across one month. This is the shape a month actually
 * has — the monthly average hides a fortnight that ran full and a fortnight
 * that ran empty behind one number.
 */
export function dailyOccupancy(
  visible: Booking[],
  month: Date,
  activeRooms: Room[],
  today: string,
): DayOccupancy[] {
  const y = month.getFullYear();
  const m = month.getMonth();
  const daysInMonth = new Date(y, m + 1, 0).getDate();
  const capacity = activeRooms.length;

  const sold = new Map<string, number>();
  visible.forEach((b) => {
    const span = dayDiff(b.checkIn, b.checkOut);
    for (let d = 0; d < span; d += 1) {
      const dt = new Date(parse(b.checkIn).getTime() + d * 86400000);
      if (dt.getMonth() !== m || dt.getFullYear() !== y) continue;
      const key = iso(dt);
      sold.set(key, (sold.get(key) ?? 0) + 1);
    }
  });

  const out: DayOccupancy[] = [];
  for (let day = 1; day <= daysInMonth; day += 1) {
    const dt = new Date(y, m, day);
    const date = iso(dt);
    const occupied = sold.get(date) ?? 0;
    out.push({
      date,
      day,
      dow: dt.getDay(),
      occupied,
      capacity,
      pct: capacity ? Math.round((occupied / capacity) * 100) : 0,
      isToday: date === today,
      isWeekend: dt.getDay() === 0 || dt.getDay() === 6,
      past: date < today,
    });
  }
  return out;
}

export interface MonthPoint {
  /** "2026-08" — stable key for React and for the CSV. */
  key: string;
  year: number;
  monthIndex: number;
  nights: number;
  capacity: number;
  pct: number;
  revenue: number;
  /** The month has run its course; nothing more can be sold into it. */
  settled: boolean;
  /** Today falls inside this month. */
  current: boolean;
}

/**
 * A window of months around `anchor`, each with its own occupancy and revenue.
 *
 * Months still ahead are reported exactly as what they are — sold so far, not
 * a forecast. They read low next to a settled month and that is the honest
 * picture: in August you have not yet sold December. Callers draw them
 * differently for the same reason.
 */
export function monthlyTrend(
  visible: Booking[],
  activeRooms: Room[],
  anchor: Date,
  back: number,
  forward: number,
  today: string,
): MonthPoint[] {
  const out: MonthPoint[] = [];
  const todayY = parse(today).getFullYear();
  const todayM = parse(today).getMonth();

  for (let i = -back; i <= forward; i += 1) {
    const d = new Date(anchor.getFullYear(), anchor.getMonth() + i, 1);
    const y = d.getFullYear();
    const m = d.getMonth();
    const daysInMonth = new Date(y, m + 1, 0).getDate();

    let nights = 0;
    let revenue = 0;
    visible.forEach((b) => {
      const n = nightsInMonth(b, y, m);
      if (!n) return;
      nights += n;
      revenue += (b.total / dayDiff(b.checkIn, b.checkOut)) * n;
    });

    const capacity = activeRooms.length * daysInMonth;
    const ordinal = y * 12 + m;
    out.push({
      key: `${y}-${String(m + 1).padStart(2, "0")}`,
      year: y,
      monthIndex: m,
      nights,
      capacity,
      pct: capacity ? Math.round((nights / capacity) * 100) : 0,
      revenue,
      settled: ordinal < todayY * 12 + todayM,
      current: ordinal === todayY * 12 + todayM,
    });
  }
  return out;
}
