"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { BookingDrawer } from "@/components/booking-drawer";
import { BookingFormModal } from "@/components/booking-form-modal";
import { ConflictModal } from "@/components/conflict-modal";
import { DashboardRail } from "@/components/dashboard-rail";
import { InviteModal } from "@/components/invite-modal";
import { LoginScreen } from "@/components/login-screen";
import { CalendarScreen } from "@/components/screens/calendar-screen";
import {
  ReportScreen,
  type ChannelRow,
  type Kpi,
} from "@/components/screens/report-screen";
import {
  PropertyScreen,
  type PropertyCard,
} from "@/components/screens/property-screen";
import { UsersScreen } from "@/components/screens/users-screen";
import { Sidebar, type NavItem } from "@/components/sidebar";
import { TopBar } from "@/components/top-bar";
import { useViewportWidth } from "@/hooks/use-viewport-width";
import {
  CH,
  CHANNEL_KEYS,
  DEMO_MONTH,
  DEMO_TODAY,
  OWNER_EMAIL,
  PROPERTIES,
  STAFF_EMAIL,
  seedBookings,
  seedRooms,
  seedUsers,
} from "@/lib/data";
import {
  activeRoomsFor,
  buildCalendar,
  conflictDates,
  findConflicts,
  hasClash,
  monthStats,
  visibleBookings,
  type ChannelFilter,
  type PropFilter,
} from "@/lib/derive";
import { MONTHS, dayDiff, fmt, fmtShort, iso, parse } from "@/lib/format";
import { bookingTotal } from "@/lib/pricing";
import type {
  Booking,
  BookingForm,
  BookingStatus,
  InviteForm,
  PropertyKey,
  Role,
  Screen,
  User,
} from "@/lib/types";

/**
 * Below this width the sidebar collapses to a nav row and the detail drawer
 * goes full-screen. Above 900 but at or below 1160 the drawer still overlays,
 * because sidebar (246) + drawer (352) would leave the content column under
 * ~560px — a squeeze the calendar grid cannot absorb.
 */
const NARROW_MAX = 900;
const DRAWER_OVERLAY_MAX = 1160;

/** How far ahead the rail's arrivals list looks, in days. */
const UPCOMING_DAYS = 7;

const OWNER_SCREENS: Screen[] = ["kalender", "laporan", "properti", "pengguna"];
const STAFF_SCREENS: Screen[] = ["kalender", "properti"];

const NAV_LABELS: Record<Screen, string> = {
  kalender: "Kalender",
  laporan: "Laporan",
  properti: "Properti & Kamar",
  pengguna: "Pengguna & Peran",
};

export interface BookingManagerProps {
  /** Screen shown right after signing in. */
  layarAwal?: Screen;
  /** Hide every rupiah figure, the way staff accounts see the app. */
  modeStaf?: boolean;
  /**
   * Booking chips drawn per calendar day before the rest collapse into
   * "+N lagi". Higher than the prototype's 3: a stay now appears on every
   * night it occupies, not only its arrival day, so days carry more chips.
   */
  bookingPerHari?: number;
}

const EMPTY_FORM: BookingForm = {
  property: "turtle",
  room: "T1",
  checkIn: "2026-08-18",
  checkOut: "2026-08-21",
  guest: "",
  phone: "",
  pax: 2,
  channel: "WhatsApp",
  notes: "",
};

const EMPTY_INVITE: InviteForm = {
  name: "",
  email: "",
  role: "Staf",
  scope: "Turtle Homestay",
};

export function BookingManager({
  layarAwal = "kalender",
  modeStaf = false,
  bookingPerHari = 4,
}: BookingManagerProps) {
  const [rooms, setRooms] = useState(seedRooms);
  const [bookings, setBookings] = useState<Booking[]>(() =>
    seedBookings(rooms),
  );
  const [users, setUsers] = useState<User[]>(seedUsers);

  const [screen, setScreen] = useState<Screen>(layarAwal);
  const [month, setMonth] = useState(DEMO_MONTH);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  /** Day picked on the calendar, listed in the rail. Null = default rail. */
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [filterProp, setFilterProp] = useState<PropFilter>("all");
  const [filterCh, setFilterCh] = useState<ChannelFilter>("all");

  const [formOpen, setFormOpen] = useState(false);
  const [conflictOpen, setConflictOpen] = useState(false);
  const [form, setForm] = useState<BookingForm>(EMPTY_FORM);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [invite, setInvite] = useState<InviteForm>(EMPTY_INVITE);

  const [auth, setAuth] = useState(false);
  const [role, setRole] = useState<Role>("owner");
  const [loginEmail, setLoginEmail] = useState(OWNER_EMAIL);
  const [loginPass, setLoginPass] = useState("");
  const [loginRole, setLoginRole] = useState<Role>("owner");
  const [loginError, setLoginError] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);

  const [toast, setToast] = useState("");
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flash = useCallback((msg: string) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 2400);
  }, []);

  useEffect(
    () => () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    },
    [],
  );

  const vw = useViewportWidth();
  const isOwner = role === "owner";
  const showMoney = isOwner && !modeStaf;
  const perDay = bookingPerHari;

  const currentUser = users.find((u) => u.email === loginEmail);

  /**
   * Properties this account is allowed to touch, from its `scope`. The field
   * existed but was only ever printed in the users table, so a staff member
   * assigned to one homestay could see, filter and edit the other one.
   *
   * An unrecognised scope resolves to nothing rather than everything — this is
   * a permission boundary, so it fails closed.
   */
  const allowedProps = useMemo<PropertyKey[]>(() => {
    const all = PROPERTIES.map((p) => p.key);
    if (isOwner || currentUser?.scope === "Semua properti") return all;
    const match = PROPERTIES.find((p) => p.name === currentUser?.scope);
    return match ? [match.key] : [];
  }, [isOwner, currentUser]);

  /* Everything downstream reads these, never `rooms`/`bookings` directly, so
     the scope cannot be sidestepped by one screen forgetting to apply it. */
  const scopedRooms = useMemo(
    () => rooms.filter((r) => allowedProps.includes(r.prop)),
    [rooms, allowedProps],
  );
  const scopedBookings = useMemo(() => {
    const ids = new Set(scopedRooms.map((r) => r.id));
    return bookings.filter((b) => ids.has(b.roomId));
  }, [bookings, scopedRooms]);

  const roomById = useMemo(
    () => new Map(scopedRooms.map((r) => [r.id, r])),
    [scopedRooms],
  );

  const visible = useMemo(
    () =>
      visibleBookings({
        bookings: scopedBookings,
        rooms: scopedRooms,
        filterProp,
        filterCh,
        query,
      }),
    [scopedBookings, scopedRooms, filterProp, filterCh, query],
  );

  const activeRooms = useMemo(
    () => activeRoomsFor(scopedRooms, filterProp),
    [scopedRooms, filterProp],
  );

  const selected = useMemo(
    () => scopedBookings.find((b) => b.id === selectedId) ?? null,
    [scopedBookings, selectedId],
  );

  /* Clicking the same day again clears it. The booking drawer shares the
     rail's slot, so any open drawer has to close or the list stays hidden. */
  const pickDate = useCallback((date: string) => {
    setSelectedId(null);
    setSelectedDate((cur) => (cur === date ? null : date));
  }, []);

  const narrow = vw <= NARROW_MAX;
  const nw = narrow || (!!selected && vw <= DRAWER_OVERLAY_MAX);

  const y = month.getFullYear();
  const m = month.getMonth();
  const daysInMonth = new Date(y, m + 1, 0).getDate();
  const monthLabel = `${MONTHS[m]} ${y}`;

  /* Computed over every booking, not the filtered view: a sidebar filter must
     never be able to hide a room that has been sold twice. Declared ahead of
     the calendar, which shades its days from these. */
  const conflicts = useMemo(
    () => findConflicts(scopedBookings),
    [scopedBookings],
  );
  const conflictDays = useMemo(() => conflictDates(conflicts), [conflicts]);
  const conflictIds = useMemo(
    () => new Set(conflicts.flatMap((p) => [p.a.id, p.b.id])),
    [conflicts],
  );

  /* Names the room and the nights actually double-sold, instead of the fixed
     sentence the prototype printed. */
  const conflictText = useMemo(() => {
    if (!conflicts.length) return "";
    const p = conflicts[0];
    const room = roomById.get(p.roomId)?.name ?? "";
    const last = iso(
      new Date(parse(p.from).getTime() + (p.nights - 1) * 86400000),
    );
    const when =
      p.nights === 1
        ? fmtShort(p.from)
        : `${fmtShort(p.from)}–${fmtShort(last)}`;
    const head = `${room} terjual dua kali pada ${when}`;
    return conflicts.length === 1
      ? `${head}. Belum ada yang dihapus.`
      : `${conflicts.length} bentrok kamar. Terdekat: ${head}.`;
  }, [conflicts, roomById]);

  const cells = useMemo(
    () =>
      buildCalendar({
        visible,
        rooms,
        month,
        today: DEMO_TODAY,
        activeRooms,
        perDay,
        conflictDays,
        conflictIds,
      }),
    [visible, rooms, month, activeRooms, perDay, conflictDays, conflictIds],
  );

  const stats = useMemo(
    () => monthStats(visible, month, activeRooms),
    [visible, month, activeRooms],
  );

  const userName = currentUser?.name ?? (isOwner ? "Owner" : "Staf");
  const userInitial = (currentUser?.name ?? "?").charAt(0).toUpperCase();

  // ---------------------------------------------------------------- actions

  /* Every change stamps who and when, which is what the drawer's trail
     prints. Nothing else writes those two fields. */
  const patchBooking = useCallback(
    (id: string, patch: Partial<Booking>, msg: string) => {
      const stamp = {
        updatedAt: new Date().toISOString(),
        updatedBy: userName,
      };
      setBookings((prev) =>
        prev.map((b) => (b.id === id ? { ...b, ...patch, ...stamp } : b)),
      );
      flash(msg);
    },
    [flash, userName],
  );

  const setRoomRate = useCallback((roomId: string, rate: number) => {
    setRooms((prev) => prev.map((r) => (r.id === roomId ? { ...r, rate } : r)));
  }, []);

  const setFormField = useCallback(
    <K extends keyof BookingForm>(key: K, value: BookingForm[K]) => {
      setForm((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  const setFormProperty = useCallback(
    (property: PropertyKey) => {
      const first = scopedRooms.find((r) => r.prop === property);
      setForm((prev) => ({
        ...prev,
        property,
        room: first ? first.id : prev.room,
      }));
    },
    [rooms],
  );

  const setInviteField = useCallback(
    <K extends keyof InviteForm>(key: K, value: InviteForm[K]) => {
      setInvite((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  /* The blank form defaults to Turtle; an Eddo-only account must not open it
     pointed at a property it cannot book. */
  const openForm = useCallback(() => {
    const prop = allowedProps.includes(form.property)
      ? form.property
      : allowedProps[0];
    if (prop && prop !== form.property) setFormProperty(prop);
    setFormOpen(true);
  }, [allowedProps, form.property, setFormProperty]);

  const saveBooking = useCallback(
    (status: Extract<BookingStatus, "Tentative" | "Confirmed">) => {
      if (!form.guest.trim()) {
        flash("Nama tamu wajib diisi.");
        return;
      }
      const room = roomById.get(form.room);
      if (!room) return;

      const nights = Math.max(1, dayDiff(form.checkIn, form.checkOut));
      const total = bookingTotal(room.rate, nights, form.channel);
      const booking: Booking = {
        id: "BK" + String(9100 + bookings.length).slice(-4),
        roomId: form.room,
        guest: form.guest.trim(),
        phone: form.phone || "-",
        pax: Number(form.pax) || 2,
        channel: form.channel,
        checkIn: form.checkIn,
        checkOut: form.checkOut,
        total,
        status,
        notes: form.notes || "Booking baru dari input manual.",
        src: "manual",
      };

      setBookings((prev) => prev.concat(booking));
      setFormOpen(false);
      setSelectedId(booking.id);
      setScreen("kalender");
      flash(
        status === "Confirmed"
          ? "Booking dikonfirmasi."
          : "Booking disimpan, hold 1×24 jam.",
      );
    },
    [form, roomById, bookings.length, flash],
  );

  /**
   * The role comes from the account the email belongs to, never from the
   * chooser on the login screen — that chooser only prefills a demo address.
   * Reading it from the chooser meant signing in with a staff address while it
   * still said "Owner" handed out Owner access, including the screens and the
   * rupiah figures staff are not supposed to see.
   */
  const doLogin = useCallback(() => {
    const email = loginEmail.trim().toLowerCase();
    if (!email || !loginPass.trim()) {
      setLoginError("Email dan kata sandi wajib diisi.");
      return;
    }
    const account = users.find((u) => u.email.toLowerCase() === email);
    if (!account) {
      setLoginError("Email tidak terdaftar.");
      return;
    }
    if (!account.active) {
      setLoginError("Akun ini dinonaktifkan. Hubungi Owner.");
      return;
    }

    const actual: Role = account.role === "Owner" ? "owner" : "staf";
    const allowed = actual === "owner" ? OWNER_SCREENS : STAFF_SCREENS;
    setAuth(true);
    setRole(actual);
    setLoginRole(actual);
    setLoginEmail(account.email);
    setLoginError("");
    setLoginPass("");
    setScreen(allowed.includes(layarAwal) ? layarAwal : "kalender");
    setSelectedId(null);
    setSelectedDate(null);
  }, [loginEmail, loginPass, users, layarAwal]);

  const doLogout = useCallback(() => {
    setAuth(false);
    setMenuOpen(false);
    setSelectedId(null);
    setFormOpen(false);
    setInviteOpen(false);
  }, []);

  const pickLoginRole = useCallback((next: Role) => {
    setLoginRole(next);
    setLoginEmail(next === "owner" ? OWNER_EMAIL : STAFF_EMAIL);
  }, []);

  const toggleUser = useCallback(
    (user: User) => {
      if (user.role === "Owner") return;
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, active: !u.active } : u)),
      );
      flash(
        user.active
          ? `${user.name} dinonaktifkan.`
          : `${user.name} diaktifkan kembali.`,
      );
    },
    [flash],
  );

  const sendInvite = useCallback(() => {
    if (!invite.name.trim() || !invite.email.trim()) {
      flash("Nama dan email pengelola wajib diisi.");
      return;
    }
    setUsers((prev) =>
      prev.concat({
        id: "U" + (prev.length + 1),
        name: invite.name.trim(),
        email: invite.email.trim(),
        role: invite.role,
        scope: invite.scope,
        active: true,
      }),
    );
    setInviteOpen(false);
    flash(`Undangan dikirim ke ${invite.email.trim()}.`);
    setInvite(EMPTY_INVITE);
  }, [invite, flash]);

  // ------------------------------------------------------------ view models

  const nav: NavItem[] = (isOwner ? OWNER_SCREENS : STAFF_SCREENS).map((k) => ({
    key: k,
    label: NAV_LABELS[k],
  }));

  /* One allowed property needs no chooser — the list would just repeat the
     same count twice. */
  const propCounts =
    allowedProps.length > 1
      ? [
          {
            key: "all" as PropFilter,
            label: "Semua properti",
            count: scopedRooms.length,
          },
          ...PROPERTIES.filter((p) => allowedProps.includes(p.key)).map(
            (p) => ({
              key: p.key as PropFilter,
              label: p.name,
              count: scopedRooms.filter((r) => r.prop === p.key).length,
            }),
          ),
        ]
      : [];

  const channelCounts = [
    {
      key: "all" as ChannelFilter,
      label: "Semua saluran",
      count: visible.length,
    },
    ...CHANNEL_KEYS.map((k) => ({
      key: k as ChannelFilter,
      label: k,
      count: scopedBookings.filter((b) => b.channel === k).length,
    })),
  ];

  /* Arrivals from today through the coming week, soonest first. A window
     rather than just today, so a quiet day still shows what is on its way. */
  const upcoming = visible
    .filter((b) => {
      const lead = dayDiff(DEMO_TODAY, b.checkIn);
      return lead >= 0 && lead <= UPCOMING_DAYS;
    })
    .sort(
      (a, b) =>
        a.checkIn.localeCompare(b.checkIn) ||
        (roomById.get(a.roomId)?.name ?? "").localeCompare(
          roomById.get(b.roomId)?.name ?? "",
        ),
    )
    .map((b) => ({
      booking: b,
      roomName: roomById.get(b.roomId)?.name ?? "",
      leadDays: dayDiff(DEMO_TODAY, b.checkIn),
    }));

  /* Everyone staying on the picked date, room order — including the ones the
     calendar had to hide behind "+N lagi". */
  const dayBookings = useMemo(() => {
    if (!selectedDate) return [];
    return visible
      .filter((b) => b.checkIn <= selectedDate && b.checkOut > selectedDate)
      .map((b) => ({
        booking: b,
        roomName: roomById.get(b.roomId)?.name ?? "",
      }))
      .sort((a, b) => a.roomName.localeCompare(b.roomName));
  }, [selectedDate, visible, roomById]);

  const avgStay = visible.length
    ? (
        visible.reduce((t, b) => t + dayDiff(b.checkIn, b.checkOut), 0) /
        visible.length
      ).toFixed(1) + " malam"
    : "—";

  const kpis: Kpi[] = [
    {
      label: "Okupansi",
      value: `${stats.occPct}%`,
      sub: `${stats.nights} dari ${stats.capacity} malam`,
    },
    showMoney
      ? {
          label: "Pendapatan kotor",
          value: fmt(stats.revenue),
          sub: "sebelum komisi OTA",
        }
      : {
          label: "Malam terjual",
          value: String(stats.nights),
          sub: "seluruh properti",
        },
    {
      label: "ADR",
      value:
        showMoney && stats.nights ? fmt(stats.revenue / stats.nights) : "—",
      sub: "rata-rata per malam terjual",
    },
    { label: "Lama menginap", value: avgStay, sub: "rata-rata semua saluran" },
  ];

  const channelValues = Object.entries(stats.byChannel) as [string, number][];
  const maxChannel = Math.max(1, ...channelValues.map(([, v]) => v));
  const channelRows: ChannelRow[] = channelValues
    .sort((a, b) => b[1] - a[1])
    .map(([key, value]) => ({
      label: key,
      value: showMoney ? fmt(value) : "—",
      pct: `${Math.round((value / Math.max(1, stats.revenue)) * 100)}%`,
      barPct: Math.round((value / maxChannel) * 100),
      color: CH[key as keyof typeof CH].dot,
    }));

  const roomRows = activeRooms.map((r) => ({
    name: r.name,
    pct: Math.round(((stats.byRoom[r.id] ?? 0) / daysInMonth) * 100),
  }));

  const propertyCards: PropertyCard[] = PROPERTIES.filter((p) =>
    allowedProps.includes(p.key),
  ).map((p) => {
    const rs = scopedRooms.filter((r) => r.prop === p.key);
    const live = rs.filter((r) => r.active);
    const soldNights = live.reduce((t, r) => t + (stats.byRoom[r.id] ?? 0), 0);
    const cap = live.length * daysInMonth;
    return {
      key: p.key,
      name: p.name,
      location: p.location,
      rooms: `${rs.length} kamar`,
      occ: cap ? `${Math.round((soldNights / cap) * 100)}%` : "0%",
      price: showMoney ? fmt(Math.min(...rs.map((r) => r.rate))) + "+" : "",
      roomList: rs.map((r) => ({
        id: r.id,
        name: r.name,
        cap: r.cap,
        price: showMoney ? fmt(r.rate) : "",
        rate: r.rate,
        ical: "Belum diatur",
        status: r.active ? "Aktif" : "Renovasi",
        active: r.active,
      })),
    };
  });

  const formRoom = roomById.get(form.room) ?? rooms[0];
  const formNights = Math.max(1, dayDiff(form.checkIn, form.checkOut));

  // ---------------------------------------------------------------- render

  return (
    <>
      {/* Full-bleed: the shell is the viewport, with no canvas margin around it. */}
      <div className="flex min-h-screen">
        <div className="flex w-full flex-col bg-surface">
          <TopBar
            query={query}
            onQuery={setQuery}
            onOpenForm={openForm}
            userName={userName}
            userInitial={userInitial}
            roleLabel={isOwner ? "Owner" : "Staf"}
            loginEmail={loginEmail}
            menuOpen={menuOpen}
            onToggleMenu={() => setMenuOpen((v) => !v)}
            onCloseMenu={() => setMenuOpen(false)}
            onLogout={doLogout}
          />

          <div
            className={`flex min-h-[760px] items-stretch ${
              nw ? "flex-col" : "flex-row"
            }`}
          >
            <Sidebar
              narrow={nw}
              nav={nav}
              screen={screen}
              onScreen={setScreen}
              propCounts={propCounts}
              filterProp={filterProp}
              onFilterProp={setFilterProp}
              channelCounts={channelCounts}
              filterCh={filterCh}
              onFilterCh={setFilterCh}
            />

            <div
              className={`min-w-0 flex-1 bg-surface-soft ${
                nw ? "px-[14px] pt-4 pb-6" : "px-[26px] pt-[22px] pb-[30px]"
              }`}
            >
              {screen === "kalender" && (
                <CalendarScreen
                  narrow={nw}
                  showMoney={showMoney}
                  conflictCount={conflicts.length}
                  conflictText={conflictText}
                  onReviewConflict={() => setConflictOpen(true)}
                  monthLabel={monthLabel}
                  onPrevMonth={() => setMonth(new Date(y, m - 1, 1))}
                  onNextMonth={() => setMonth(new Date(y, m + 1, 1))}
                  occLabel={`${stats.occPct}%`}
                  nightsLabel={`${stats.nights} malam`}
                  revenueLabel={fmt(stats.revenue)}
                  cells={cells}
                  onSelect={setSelectedId}
                  selectedDate={selectedDate}
                  onSelectDate={pickDate}
                />
              )}

              {screen === "laporan" && isOwner && (
                <ReportScreen
                  monthLabel={monthLabel}
                  kpis={kpis}
                  channelRows={channelRows}
                  roomRows={roomRows}
                  commissionLabel={
                    showMoney
                      ? fmt(stats.commission)
                      : "disembunyikan untuk peran Staf"
                  }
                  onExport={() =>
                    flash("Ekspor CSV belum tersedia di versi ini.")
                  }
                  onCompare={() =>
                    flash(
                      "Perbandingan antar bulan belum tersedia di versi ini.",
                    )
                  }
                />
              )}

              {screen === "properti" && (
                <PropertyScreen
                  cards={propertyCards}
                  showMoney={showMoney}
                  onRate={setRoomRate}
                />
              )}

              {screen === "pengguna" && isOwner && (
                <UsersScreen
                  users={users}
                  onOpenInvite={() => setInviteOpen(true)}
                  onToggleUser={toggleUser}
                />
              )}
            </div>

            {screen === "kalender" && !selected && (
              <DashboardRail
                narrow={nw}
                upcoming={upcoming}
                upcomingDays={UPCOMING_DAYS}
                onSelect={setSelectedId}
                selectedDate={selectedDate}
                dayBookings={dayBookings}
                onClearDate={() => setSelectedDate(null)}
              />
            )}

            {selected && (
              <BookingDrawer
                booking={selected}
                roomName={roomById.get(selected.roomId)?.name ?? ""}
                narrow={nw}
                showMoney={showMoney}
                onClose={() => setSelectedId(null)}
                onSetStatus={(status) =>
                  patchBooking(
                    selected.id,
                    { status },
                    status === "Confirmed"
                      ? "Booking dikonfirmasi."
                      : status === "Checked-in"
                        ? "Tamu ditandai check-in."
                        : status === "Checked-out"
                          ? "Tamu ditandai check-out."
                          : "Booking dibatalkan.",
                  )
                }
              />
            )}
          </div>
        </div>
      </div>

      {conflictOpen && conflicts.length > 0 && (
        <ConflictModal
          pairs={conflicts}
          roomName={(id) => roomById.get(id)?.name ?? ""}
          showMoney={showMoney}
          onClose={() => setConflictOpen(false)}
          onCancelBooking={(id) =>
            patchBooking(id, { status: "Cancelled" }, "Booking dibatalkan.")
          }
          onCheckIn={(id) =>
            patchBooking(
              id,
              { status: "Checked-in" },
              "Tamu ditandai check-in.",
            )
          }
          onOpenDetail={(id) => {
            setConflictOpen(false);
            setSelectedId(id);
          }}
        />
      )}

      {formOpen && (
        <BookingFormModal
          form={form}
          rooms={scopedRooms}
          nights={formNights}
          rate={formRoom.rate}
          clash={hasClash(bookings, form.room, form.checkIn, form.checkOut)}
          onChange={setFormField}
          onProperty={setFormProperty}
          allowedProps={allowedProps}
          onClose={() => setFormOpen(false)}
          onSaveTentative={() => saveBooking("Tentative")}
          onSaveConfirmed={() => saveBooking("Confirmed")}
        />
      )}

      {inviteOpen && (
        <InviteModal
          invite={invite}
          onChange={setInviteField}
          onClose={() => setInviteOpen(false)}
          onSend={sendInvite}
        />
      )}

      {!auth && (
        <LoginScreen
          narrow={nw}
          email={loginEmail}
          password={loginPass}
          role={loginRole}
          error={loginError}
          onEmail={setLoginEmail}
          onPassword={setLoginPass}
          onRole={pickLoginRole}
          onSubmit={doLogin}
        />
      )}

      {toast && (
        <div
          role="status"
          className="fixed bottom-7 left-1/2 z-[60] -translate-x-1/2 animate-pop-in rounded-xl bg-ink px-5 py-3 text-[13.5px] text-white"
        >
          {toast}
        </div>
      )}
    </>
  );
}
