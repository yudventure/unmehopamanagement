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
        /* Kodenya, bukan `id`-nya. Keduanya sama pada data contoh, tapi dari
           database `id` adalah cuid yang tidak pernah dilihat siapa pun,
           sementara `code` justru yang diucapkan ke tamu lewat telepon dan
           yang diketik orang ke kotak ini. */
        b.code.toLowerCase().includes(q)
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
  /** Hanya dari booking yang harganya diketahui. */
  revenue: number;
  /**
   * Malam yang terjual tapi harganya tidak dikirim sumbernya.
   *
   * Dihitung terpisah supaya layar bisa mengatakan "Rp sekian, dari sekian
   * malam yang berharga" alih-alih menjumlahkan nol ke dalam pendapatan.
   * Menjumlahkan nol terlihat persis seperti penjualan yang memang nol.
   */
  malamTanpaHarga: number;
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
  let malamTanpaHarga = 0;
  const byChannel: Partial<Record<ChannelKey, number>> = {};
  const byRoom: Record<string, number> = {};

  visible.forEach((b) => {
    const span = dayDiff(b.checkIn, b.checkOut);
    for (let d = 0; d < span; d++) {
      const dt = new Date(parse(b.checkIn).getTime() + d * 86400000);
      if (dt.getMonth() === m && dt.getFullYear() === y) {
        nights++;
        byRoom[b.roomId] = (byRoom[b.roomId] ?? 0) + 1;

        /* Malamnya tetap dihitung — kamarnya memang terisi, dan okupansi
           adalah pertanyaan tentang kamar, bukan tentang uang. Yang dilewati
           cuma bagian uangnya. */
        if (b.tanpaHarga) {
          malamTanpaHarga++;
          continue;
        }
        const per = b.total / span;
        revenue += per;
        commission += per * CH[b.channel].com;
        byChannel[b.channel] = (byChannel[b.channel] ?? 0) + per;
      }
    }
  });

  const capacity = activeRooms.length * daysInMonth;
  return {
    nights,
    revenue,
    malamTanpaHarga,
    commission,
    byChannel,
    byRoom,
    capacity,
    occPct: capacity ? Math.round((nights / capacity) * 100) : 0,
  };
}

/**
 * Dua angka sisanya dari dashboard ringkas PRD F6.1: booking baru dan piutang
 * berjalan.
 *
 * Terpisah dari `monthStats` karena keduanya tidak terikat bulan yang sedang
 * dilihat. Menggeser kalender ke Desember tidak mengubah berapa booking yang
 * masuk minggu ini, dan tidak mengubah berapa yang belum dibayar hari ini.
 *
 * ## Null bukan nol, dan itu inti berkas ini
 *
 * Keduanya bisa memulangkan null, artinya **belum diketahui**. Itu bukan
 * kehati-hatian berlebihan, melainkan satu-satunya jawaban yang benar:
 *
 * - Tidak ada satu pun booking yang membawa `createdAt` berarti tanggal
 *   masuknya memang tidak pernah dicatat. Menjawab "0 booking baru" berarti
 *   mengatakan tidak ada yang memesan minggu ini, dan itu pernyataan yang
 *   berbeda.
 * - Tidak ada satu pun pembayaran yang tercatat berarti piutangnya akan
 *   terhitung **sebesar seluruh pendapatan**. Angka itu bukan cuma salah, ia
 *   salah ke arah yang menakutkan, dan ia akan terlihat persis seperti angka
 *   yang benar.
 *
 * Yang memanggil wajib menulis null sebagai "belum dicatat", bukan sebagai 0
 * dan bukan sebagai Rp 0.
 */
export interface RingkasStats {
  /** Booking yang masuk dalam `hari` terakhir. Null bila tidak pernah dicatat. */
  bookingBaru: number | null;
  /** Nilai menginap yang sudah berjalan dan belum dibayar. Null bila tidak
   *  bisa diketahui — sebabnya di `piutangSebab`. */
  piutang: number | null;
  /**
   * Kenapa piutangnya tidak bisa dihitung.
   *
   * Dua sebab yang sangat berbeda, dan keduanya pernah menghasilkan "Rp 0"
   * yang terbaca sebagai "tidak ada yang berutang": belum ada satu pun
   * pembayaran yang dicatat, atau tidak satu pun booking punya nominal yang
   * diketahui. Layar harus bisa mengatakan yang mana, karena yang pertama
   * diperbaiki dengan mencatat pembayaran dan yang kedua dengan mengisi harga.
   */
  piutangSebab: "tanpa-pembayaran" | "tanpa-harga" | null;
}

/** Berapa hari ke belakang yang dianggap "baru" di F6.1. */
export const HARI_BARU = 7;

export function ringkasStats(
  visible: Booking[],
  today: string,
  hari: number = HARI_BARU,
): RingkasStats {
  /* Batas bawah inklusif: `hari` hari terakhir termasuk hari ini. */
  const batas = iso(new Date(parse(today).getTime() - (hari - 1) * 86400000));

  let adaTanggalMasuk = false;
  let baru = 0;
  let adaPembayaran = false;
  let piutang = 0;
  /* Apakah ada satu pun booking yang benar-benar ikut terhitung. Tanpa ini,
     jumlah yang tetap nol karena semuanya dilewati tidak bisa dibedakan dari
     jumlah yang nol karena semuanya sudah lunas — dan yang pertama dinyatakan
     sebagai "Rp 0" adalah kebalikan dari kebenarannya. */
  let adaTerhitung = false;

  for (const b of visible) {
    if (b.createdAt) {
      adaTanggalMasuk = true;
      if (b.createdAt >= batas && b.createdAt <= today) baru += 1;
    }
    if (b.paid !== undefined) adaPembayaran = true;

    /* Piutang hanya dari menginap yang sudah dimulai. Booking bulan depan
       memang belum dibayar, tapi belum jatuh tempo juga — memasukkannya
       membuat angka ini naik tiap kali ada pesanan baru, yang membacanya
       terbalik dari maksudnya. */
    if (b.status === "Cancelled" || b.channel === "Blokir") continue;
    /* Tanpa harga tidak ada yang bisa dikatakan tentang berapa yang belum
       dibayar. Memasukkannya sebagai nol berarti menyatakan lunas. */
    if (b.tanpaHarga) continue;
    if (b.checkIn > today) continue;
    adaTerhitung = true;
    piutang += Math.max(0, b.total - (b.paid ?? 0));
  }

  const bisa = adaPembayaran && adaTerhitung;
  return {
    bookingBaru: adaTanggalMasuk ? baru : null,
    piutang: bisa ? piutang : null,
    piutangSebab: bisa
      ? null
      : adaTerhitung
        ? "tanpa-pembayaran"
        : "tanpa-harga",
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

/**
 * Splits the overlaps into the ones still worth interrupting someone over and
 * the ones that are only a record now.
 *
 * `to` is the morning the overlap ends and is exclusive, so an overlap whose
 * `to` has arrived has no contested night left in it. Everything from that
 * point on is history: the guests have been and gone, and whatever was done
 * about it was done. Before this split the banner treated the two the same,
 * which meant a double booking from last month sat at the top of the calendar
 * in the same red as one arriving tomorrow, every day, with no way to put it
 * down — and an alarm that cannot be answered is an alarm people stop reading.
 *
 * Neither list is thrown away. A past overlap still shades its nights on the
 * grid and still draws both bookings in the danger palette, because it did
 * happen and someone may still be owed an explanation for it. It just stops
 * being the loudest thing on the screen.
 */
export function splitConflicts(
  pairs: ConflictPair[],
  today: string,
): { live: ConflictPair[]; past: ConflictPair[] } {
  const live: ConflictPair[] = [];
  const past: ConflictPair[] = [];
  for (const pair of pairs) (pair.to > today ? live : past).push(pair);
  /* Soonest first, so "Terdekat" in the banner is the one it names. Past runs
     the other way: the most recent is the one still worth asking about. */
  live.sort((a, b) => a.from.localeCompare(b.from));
  past.sort((a, b) => b.from.localeCompare(a.from));
  return { live, past };
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
      /* Sama seperti `monthStats`: malamnya dihitung, uangnya tidak dikarang.
         Grafik tren yang menjumlahkan nol akan menggambar pendapatan jatuh
         di bulan yang justru penuh. */
      if (b.tanpaHarga) return;
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
