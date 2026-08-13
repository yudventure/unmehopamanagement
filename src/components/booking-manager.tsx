"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { BookingDrawer } from "@/components/booking-drawer";
import { BookingFormModal } from "@/components/booking-form-modal";
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
  hasClash,
  monthStats,
  visibleBookings,
  type ChannelFilter,
  type PropFilter,
} from "@/lib/derive";
import { MONTHS, dayDiff, fmt } from "@/lib/format";
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
   * Booking bars stacked per week row before the rest collapse into "+N lagi".
   * Higher than the prototype's 3: a bar now holds its lane for the whole stay
   * rather than just the arrival day, so three lanes hid most of the month.
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
  bookingPerHari = 6,
}: BookingManagerProps) {
  const [rooms] = useState(seedRooms);
  const [bookings, setBookings] = useState<Booking[]>(() => seedBookings(rooms));
  const [users, setUsers] = useState<User[]>(seedUsers);

  const [screen, setScreen] = useState<Screen>(layarAwal);
  const [month, setMonth] = useState(DEMO_MONTH);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [filterProp, setFilterProp] = useState<PropFilter>("all");
  const [filterCh, setFilterCh] = useState<ChannelFilter>("all");

  const [formOpen, setFormOpen] = useState(false);
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

  const roomById = useMemo(
    () => new Map(rooms.map((r) => [r.id, r])),
    [rooms],
  );

  const visible = useMemo(
    () => visibleBookings({ bookings, rooms, filterProp, filterCh, query }),
    [bookings, rooms, filterProp, filterCh, query],
  );

  const activeRooms = useMemo(
    () => activeRoomsFor(rooms, filterProp),
    [rooms, filterProp],
  );

  const selected = useMemo(
    () => bookings.find((b) => b.id === selectedId) ?? null,
    [bookings, selectedId],
  );

  const narrow = vw <= NARROW_MAX;
  const nw = narrow || (!!selected && vw <= DRAWER_OVERLAY_MAX);

  const y = month.getFullYear();
  const m = month.getMonth();
  const daysInMonth = new Date(y, m + 1, 0).getDate();
  const monthLabel = `${MONTHS[m]} ${y}`;

  const weeks = useMemo(
    () =>
      buildCalendar({
        visible,
        rooms,
        month,
        today: DEMO_TODAY,
        activeRooms,
        perDay,
      }),
    [visible, rooms, month, activeRooms, perDay],
  );

  const stats = useMemo(
    () => monthStats(visible, month, activeRooms),
    [visible, month, activeRooms],
  );

  const conflicts = useMemo(() => visible.filter((b) => b.conflict), [visible]);

  const currentUser = users.find((u) => u.email === loginEmail);
  const userName = currentUser?.name ?? (isOwner ? "Owner" : "Staf");
  const userInitial = (currentUser?.name ?? "?").charAt(0).toUpperCase();

  // ---------------------------------------------------------------- actions

  const patchBooking = useCallback(
    (id: string, patch: Partial<Booking>, msg: string) => {
      setBookings((prev) =>
        prev.map((b) => (b.id === id ? { ...b, ...patch } : b)),
      );
      flash(msg);
    },
    [flash],
  );

  const setFormField = useCallback(
    <K extends keyof BookingForm>(key: K, value: BookingForm[K]) => {
      setForm((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  const setFormProperty = useCallback(
    (property: PropertyKey) => {
      const first = rooms.find((r) => r.prop === property);
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

  const saveBooking = useCallback(
    (status: Extract<BookingStatus, "Tentative" | "Confirmed">) => {
      if (!form.guest.trim()) {
        flash("Nama tamu wajib diisi.");
        return;
      }
      const room = roomById.get(form.room);
      if (!room) return;

      const nights = Math.max(1, dayDiff(form.checkIn, form.checkOut));
      const total = room.rate * nights;
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
        paid: 0,
        pay: "Belum bayar",
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

  const doLogin = useCallback(() => {
    if (!loginEmail.trim() || !loginPass.trim()) {
      setLoginError("Email dan kata sandi wajib diisi.");
      return;
    }
    const allowed = loginRole === "owner" ? OWNER_SCREENS : STAFF_SCREENS;
    setAuth(true);
    setRole(loginRole);
    setLoginError("");
    setLoginPass("");
    setScreen(allowed.includes(layarAwal) ? layarAwal : "kalender");
    setSelectedId(null);
  }, [loginEmail, loginPass, loginRole, layarAwal]);

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

  const propCounts = [
    { key: "all" as PropFilter, label: "Semua properti", count: rooms.length },
    ...PROPERTIES.map((p) => ({
      key: p.key as PropFilter,
      label: p.name,
      count: rooms.filter((r) => r.prop === p.key).length,
    })),
  ];

  const channelCounts = [
    { key: "all" as ChannelFilter, label: "Semua saluran", count: visible.length },
    ...CHANNEL_KEYS.map((k) => ({
      key: k as ChannelFilter,
      label: k,
      count: bookings.filter((b) => b.channel === k).length,
    })),
  ];

  const todayIn = visible
    .filter((b) => b.checkIn === DEMO_TODAY)
    .map((b) => ({
      booking: b,
      roomName: roomById.get(b.roomId)?.name ?? "",
      dotColor: CH[b.channel].dot,
    }));

  const unpaid = visible
    .filter((b) => b.total > b.paid)
    .sort((a, b) => a.checkIn.localeCompare(b.checkIn))
    .slice(0, 4);

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

  const propertyCards: PropertyCard[] = PROPERTIES.map((p) => {
    const rs = rooms.filter((r) => r.prop === p.key);
    const live = rs.filter((r) => r.active);
    const soldNights = live.reduce((t, r) => t + (stats.byRoom[r.id] ?? 0), 0);
    const cap = live.length * daysInMonth;
    return {
      key: p.key,
      name: p.name,
      location: p.location,
      rooms: `${rs.length} kamar`,
      occ: cap ? `${Math.round((soldNights / cap) * 100)}%` : "0%",
      price: fmt(Math.min(...rs.map((r) => r.rate))) + "+",
      roomList: rs.map((r) => ({
        id: r.id,
        name: r.name,
        cap: r.cap,
        price: fmt(r.rate),
        ical: r.active
          ? r.prop === "turtle"
            ? "3 feed aktif"
            : "2 feed aktif"
          : "dijeda",
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
            onOpenForm={() => setFormOpen(true)}
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
                nw
                  ? "px-[14px] pt-4 pb-6"
                  : "px-[26px] pt-[22px] pb-[30px]"
              }`}
            >
              {screen === "kalender" && (
                <CalendarScreen
                  narrow={nw}
                  showMoney={showMoney}
                  conflictCount={conflicts.length}
                  conflictRoomName={
                    conflicts.length
                      ? (roomById.get(conflicts[0].roomId)?.name ?? "")
                      : ""
                  }
                  onReviewConflict={() =>
                    conflicts[0] && setSelectedId(conflicts[0].id)
                  }
                  monthLabel={monthLabel}
                  onPrevMonth={() => setMonth(new Date(y, m - 1, 1))}
                  onNextMonth={() => setMonth(new Date(y, m + 1, 1))}
                  occLabel={`${stats.occPct}%`}
                  nightsLabel={`${stats.nights} malam`}
                  revenueLabel={fmt(stats.revenue)}
                  weeks={weeks}
                  laneCap={perDay}
                  onSelect={setSelectedId}
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
                    flash("Perbandingan antar bulan belum tersedia di versi ini.")
                  }
                />
              )}

              {screen === "properti" && <PropertyScreen cards={propertyCards} />}

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
                todayIn={todayIn}
                unpaid={unpaid}
                onSelect={setSelectedId}
              />
            )}

            {selected && (
              <BookingDrawer
                booking={selected}
                roomName={roomById.get(selected.roomId)?.name ?? ""}
                narrow={nw}
                showMoney={showMoney}
                auditName={currentUser?.name ?? "Yud"}
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
                onMarkPaid={() =>
                  patchBooking(
                    selected.id,
                    { paid: selected.total, pay: "Lunas" },
                    "Pelunasan tercatat.",
                  )
                }
              />
            )}
          </div>
        </div>
      </div>

      {formOpen && (
        <BookingFormModal
          form={form}
          rooms={rooms}
          nights={formNights}
          rate={formRoom.rate}
          clash={hasClash(bookings, form.room, form.checkIn, form.checkOut)}
          onChange={setFormField}
          onProperty={setFormProperty}
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
