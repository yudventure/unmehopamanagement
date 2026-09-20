"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { BookingDrawer } from "@/components/booking-drawer";
import { DataSourceNote, type SumberData } from "@/components/data-source-note";
import { BookingFormModal } from "@/components/booking-form-modal";
import { ConflictModal } from "@/components/conflict-modal";
import { DashboardRail } from "@/components/dashboard-rail";
import { InviteModal } from "@/components/invite-modal";
import { LoginScreen } from "@/components/login-screen";
import type { RoomPatch } from "@/components/room-edit-modal";
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
import { SyncScreen } from "@/components/screens/sync-screen";
import { UsersScreen } from "@/components/screens/users-screen";
import { WebsiteScreen } from "@/components/screens/website-screen";
import { Sidebar, type NavItem } from "@/components/sidebar";
import {
  bookingDariApi,
  kamarDariApi,
  terlewat,
  type ApiKalender,
} from "@/lib/dari-database";
import { TopBar } from "@/components/top-bar";
import { useViewportWidth } from "@/hooks/use-viewport-width";
import {
  CH,
  CHANNEL_KEYS,
  CHANNEL_LABELS,
  SEED_MONTH,
  SEED_TODAY,
  OWNER_EMAIL,
  PROPERTIES,
  STAFF_EMAIL,
  seedBookings,
  seedLedger,
  seedRooms,
  seedUsers,
} from "@/lib/data";
import {
  activeRoomsFor,
  buildCalendar,
  conflictDates,
  dailyOccupancy,
  findConflicts,
  freeRooms,
  hasClash,
  inMonth,
  monthStats,
  monthlyTrend,
  nightsInMonth,
  splitConflicts,
  visibleBookings,
  type ChannelFilter,
  type PropFilter,
} from "@/lib/derive";
import { MONTHS, dayDiff, fmt, fmtShort, iso, parse } from "@/lib/format";
import { bookingTotal } from "@/lib/pricing";
import { downloadCsv, downloadPdf, type ReportData } from "@/lib/report-export";
import type {
  Booking,
  BookingForm,
  BookingStatus,
  ChannelKey,
  ExportToken,
  IcalFeed,
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

/*
 * Phone. Measured on the viewport alone and never on the drawer, unlike `nw`:
 * opening a booking on a 1000px laptop must not turn the month grid into the
 * phone one. Between this and NARROW_MAX the shell is already stacked, but a
 * 700px calendar still fits, so the named chips stay.
 */
const PHONE_MAX = 640;

/** How far ahead the rail's arrivals list looks, in days. */
const UPCOMING_DAYS = 7;

/**
 * Berapa bulan ke belakang dan ke depan diambil dari database dalam sekali
 * permintaan.
 *
 * Satu bulan tidak cukup: grafik tren di layar Laporan membentang delapan bulan
 * ke belakang dan tiga ke depan dari bulan yang dilaporkan, dan bulan itu bisa
 * digeser. Mengambil per bulan berarti satu perjalanan ke server tiap kali
 * panah ditekan — di pulau dengan koneksi lambat itu terasa.
 *
 * Dua belas ke tiap arah menutupi seluruh yang bisa digambar tanpa mengambil
 * apa pun lagi. Untuk lima belas kamar itu paling banyak beberapa ratus baris,
 * dan Postgres menjawabnya lewat indeks gist yang memang dibuat untuk
 * pertanyaan bentuk ini.
 */
const JENDELA_BULAN = 12;

/**
 * Months either side of the reported one in the trend chart. Eight back covers
 * a full swing from peak to trough; three forward is as far as the book is
 * filled in enough to be worth reading.
 */
const TREND_BACK = 8;
const TREND_FORWARD = 3;

const OWNER_SCREENS: Screen[] = [
  "kalender",
  "laporan",
  "properti",
  "sinkron",
  "website",
  "pengguna",
];
const STAFF_SCREENS: Screen[] = ["kalender", "properti"];

const NAV_LABELS: Record<Screen, string> = {
  kalender: "Kalender",
  laporan: "Laporan",
  properti: "Properti & Kamar",
  sinkron: "Sinkronisasi OTA",
  website: "Website",
  pengguna: "Pengguna & Peran",
};

export interface BookingManagerProps {
  /** Screen shown right after signing in. */
  layarAwal?: Screen;
  /** Whether the page already found a valid session cookie. The manager is
      only rendered at all when it did, so this starts the view signed in
      instead of drawing a login over a page that has already arrived. */
  signedIn?: boolean;
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
  signedIn = false,
  modeStaf = false,
  bookingPerHari = 4,
}: BookingManagerProps) {
  const [rooms, setRooms] = useState(seedRooms);
  /* August is the seeded month; the year around it comes from `seedLedger`, on
     its own generator, so the report has a season to plot rather than a single
     column. It is handed the seeded book so it can step around those nights. */
  const [bookings, setBookings] = useState<Booking[]>(() => {
    const seeded = seedBookings(rooms);
    return seeded.concat(seedLedger(rooms, seeded));
  });
  const [users, setUsers] = useState<User[]>(seedUsers);

  const [screen, setScreen] = useState<Screen>(layarAwal);
  const [month, setMonth] = useState(SEED_MONTH);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  /** Day picked on the calendar, listed in the rail. Null = default rail. */
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [filterProp, setFilterProp] = useState<PropFilter>("all");
  const [filterCh, setFilterCh] = useState<ChannelFilter>("all");

  const [formOpen, setFormOpen] = useState(false);
  const [conflictOpen, setConflictOpen] = useState(false);
  const [compare, setCompare] = useState(false);
  const [pdfBusy, setPdfBusy] = useState(false);
  const [feeds, setFeeds] = useState<IcalFeed[]>([]);
  const [tokens, setTokens] = useState<ExportToken[]>([]);
  const [form, setForm] = useState<BookingForm>(EMPTY_FORM);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [invite, setInvite] = useState<InviteForm>(EMPTY_INVITE);

  const [auth, setAuth] = useState(signedIn);
  const [role, setRole] = useState<Role>("owner");
  /* Empty, and on neither role, for the reason `sign-in.tsx` gives: a login
     that arrives pre-filled is a demo of a login. */
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPass, setLoginPass] = useState("");
  const [loginRole, setLoginRole] = useState<Role | null>(null);
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

  /* Filled in after mount. The page is prerendered, so reading location during
     render would break the build and then mismatch on hydrate. */
  const [origin, setOrigin] = useState("https://unmehopa.example");
  useEffect(() => setOrigin(window.location.origin), []);

  /*
   * Today, and the month the calendar opens on, come from the real clock —
   * both settled after mount for the same reason as `origin`. A page rendered
   * at build time cannot know what day it is when somebody opens it.
   *
   * `SEED_TODAY` is only the first paint's stand-in, never the answer.
   */
  const [today, setToday] = useState(SEED_TODAY);
  useEffect(() => {
    const now = new Date();
    setToday(iso(now));
    setMonth(new Date(now.getFullYear(), now.getMonth(), 1));
  }, []);

  /*
   * Dari mana isi layar ini berasal, dan pengambilannya.
   *
   * Hanya setelah masuk: `/api/calendar` menjawab 404 tanpa cookie sesi, dan
   * meminta sebelum itu berarti satu permintaan yang sudah pasti ditolak pada
   * tiap kali halaman dibuka.
   *
   * Data contoh dibiarkan di tempatnya sampai ada yang sungguhan menggantikan
   * seluruhnya. Mengosongkan layar lebih dulu berarti kalender kosong selama
   * beberapa ratus milidetik yang terbaca seperti "tidak ada tamu" — dan kalau
   * permintaannya gagal, terbaca begitu selamanya. Catatan di atas kisi yang
   * mengatakan mana yang sedang dilihat.
   */
  const [sumber, setSumber] = useState<SumberData>({ keadaan: "memuat" });
  useEffect(() => {
    if (!auth) return;

    const batal = new AbortController();
    const now = new Date();
    const dari = iso(new Date(now.getFullYear(), now.getMonth() - JENDELA_BULAN, 1));
    const sampai = iso(
      new Date(now.getFullYear(), now.getMonth() + JENDELA_BULAN + 1, 1),
    );

    void (async () => {
      try {
        const res = await fetch(`/api/calendar?from=${dari}&to=${sampai}`, {
          signal: batal.signal,
        });
        if (!res.ok) {
          setSumber({
            keadaan: "gagal",
            pesan: `Server menjawab ${res.status}.`,
          });
          return;
        }
        const data = (await res.json()) as ApiKalender;
        if (!data.configured) {
          setSumber({ keadaan: "contoh" });
          return;
        }

        const kamar = kamarDariApi(data.rooms ?? []);
        /* Tersambung tapi tanpa kamar bukan "tidak ada tamu", melainkan
           pemasangan yang belum selesai. Data contoh tetap di layar, dan
           catatannya menyebut workflow yang mengisinya. */
        if (kamar.length === 0) {
          setSumber({ keadaan: "kosong" });
          return;
        }

        const baris = data.bookings ?? [];
        setRooms(kamar);
        setBookings(bookingDariApi(baris));
        setSumber({ keadaan: "database", terlewat: terlewat(baris) });
      } catch {
        /* Permintaan yang dibatalkan saat komponennya dilepas bukan kegagalan
           yang perlu dilaporkan ke siapa pun. */
        if (batal.signal.aborted) return;
        setSumber({
          keadaan: "gagal",
          pesan: "Tidak bisa menghubungi server.",
        });
      }
    })();

    return () => batal.abort();
  }, [auth]);

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
  const phone = vw <= PHONE_MAX;

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

  /* The banner speaks for one of these two lists, never both. A live overlap
     is work; a past one is a record, and mixing them in one red sentence is
     how the red stops meaning anything. */
  const { live: liveConflicts, past: pastConflicts } = useMemo(
    () => splitConflicts(conflicts, today),
    [conflicts, today],
  );
  const bannerPairs = liveConflicts.length ? liveConflicts : pastConflicts;
  const conflictTone = liveConflicts.length ? "danger" : "past";

  /* Names the room and the nights actually double-sold, instead of the fixed
     sentence the prototype printed. */
  const conflictText = useMemo(() => {
    if (!bannerPairs.length) return "";
    const p = bannerPairs[0];
    const room = roomById.get(p.roomId)?.name ?? "";
    const last = iso(
      new Date(parse(p.from).getTime() + (p.nights - 1) * 86400000),
    );
    const when =
      p.nights === 1
        ? fmtShort(p.from)
        : `${fmtShort(p.from)}–${fmtShort(last)}`;
    const head = `${room} terjual dua kali pada ${when}`;

    /* Past reads in the past tense and says so outright, so nobody spends a
       morning chasing a room that was freed up weeks ago. */
    if (conflictTone === "past") {
      return bannerPairs.length === 1
        ? `Pernah bentrok: ${head}. Tanggalnya sudah lewat.`
        : `${bannerPairs.length} bentrok yang sudah lewat. Terbaru: ${head}.`;
    }

    return bannerPairs.length === 1
      ? `${head}. Belum ada yang dihapus.`
      : `${bannerPairs.length} bentrok kamar. Terdekat: ${head}.`;
  }, [bannerPairs, conflictTone, roomById]);

  const cells = useMemo(
    () =>
      buildCalendar({
        visible,
        rooms,
        month,
        today: today,
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

  /* The month before the reported one, computed whether or not the comparison
     is switched on — it is four small loops, and keeping it unconditional
     means the toggle only decides what is drawn, never what is known. */
  const prevMonth = useMemo(
    () => new Date(month.getFullYear(), month.getMonth() - 1, 1),
    [month],
  );
  const prevStats = useMemo(
    () => monthStats(visible, prevMonth, activeRooms),
    [visible, prevMonth, activeRooms],
  );

  const trend = useMemo(
    () =>
      monthlyTrend(
        visible,
        activeRooms,
        month,
        TREND_BACK,
        TREND_FORWARD,
        today,
      ),
    [visible, activeRooms, month],
  );

  const daily = useMemo(
    () => dailyOccupancy(visible, month, activeRooms, today),
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

  /* Tokens are minted in the click handler, never during render: the page is
     prerendered, so a random value at render time would not match on hydrate. */
  const newToken = () => {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    return Array.from(bytes, (x) => x.toString(16).padStart(2, "0")).join("");
  };

  const addFeed = useCallback(
    (roomId: string, channel: ChannelKey, url: string): string | null => {
      if (!url) return "URL iCal wajib diisi.";
      if (!/^https?:\/\/\S+$/i.test(url))
        return "URL harus diawali http:// atau https://.";
      if (feeds.some((f) => f.roomId === roomId && f.url === url))
        return "URL ini sudah terdaftar untuk kamar tersebut.";
      setFeeds((prev) =>
        prev.concat({
          id: `FD${Date.now().toString(36)}`,
          roomId,
          channel,
          url,
          addedAt: new Date().toISOString(),
        }),
      );
      flash("Feed impor ditambahkan.");
      return null;
    },
    [feeds, flash],
  );

  const removeFeed = useCallback(
    (id: string) => {
      setFeeds((prev) => prev.filter((f) => f.id !== id));
      flash("Feed impor dihapus.");
    },
    [flash],
  );

  const mintToken = useCallback((roomId: string) => {
    setTokens((prev) =>
      prev
        .filter((t) => t.roomId !== roomId)
        .concat({
          roomId,
          token: newToken(),
          createdAt: new Date().toISOString(),
        }),
    );
  }, []);

  const issueToken = useCallback(
    (roomId: string) => {
      mintToken(roomId);
      flash("URL ekspor dibuat.");
    },
    [mintToken, flash],
  );

  const resetToken = useCallback(
    (roomId: string) => {
      mintToken(roomId);
      flash("Token direset. URL lama tidak berlaku lagi.");
    },
    [mintToken, flash],
  );

  /* Room configuration now moves as one saved edit rather than a live field,
     so it validates in one place and can be rejected as a whole. */
  const saveRoom = useCallback(
    (roomId: string, patch: RoomPatch): string | null => {
      const name = patch.name.trim();
      const cap = patch.cap.trim();
      if (!name) return "Nama kamar wajib diisi.";
      if (!cap) return "Kapasitas wajib diisi.";
      if (!(patch.rate > 0)) return "Harga per malam harus lebih dari 0.";
      /* A room's name is how it is identified everywhere else — calendar
         chips, the rail's free-room list, arrivals. Two rooms sharing one
         name would make all of those unreadable. */
      const taken = rooms.some(
        (r) => r.id !== roomId && r.name.toLowerCase() === name.toLowerCase(),
      );
      if (taken) return `Sudah ada kamar bernama "${name}".`;

      setRooms((prev) =>
        prev.map((r) =>
          r.id === roomId
            ? { ...r, name, cap, rate: patch.rate, active: patch.active }
            : r,
        ),
      );
      flash(`${name} diperbarui.`);
      return null;
    },
    [rooms, flash],
  );

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
      /* Sama untuk booking yang dibuat di sini, karena belum ada server yang
         memberi keduanya. Begitu POST /api/bookings ada, `id` datang dari
         database dan `code` dari kolomnya sendiri. */
      const kode = "BK" + String(9100 + bookings.length).slice(-4);
      const booking: Booking = {
        id: kode,
        code: kode,
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
   * chooser on the login screen, which only prefills an address.
   * Reading it from the chooser meant signing in with a staff address while it
   * still said "Owner" handed out Owner access, including the screens and the
   * rupiah figures staff are not supposed to see.
   */
  const doLogin = useCallback(async () => {
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

    /* The password is checked by the server, which is the only place a check
       means anything. This used to be the line that was missing entirely: the
       field was tested for being non-empty and then anyone was let in. */
    let ok = false;
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: loginPass }),
      });
      if (res.status === 503) {
        setLoginError("Login belum disiapkan di server. Isi DASHBOARD_PASSWORD.");
        return;
      }
      ok = res.ok;
    } catch {
      setLoginError("Tidak bisa menghubungi server.");
      return;
    }
    if (!ok) {
      setLoginError("Email atau kata sandi salah.");
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
    /* The cookie is what grants access, so signing out has to reach the server
       for it. Fire and forget, then reload: a failed request must still clear
       the view rather than leave somebody looking at a manager they believe
       they have left. */
    void fetch("/api/login", { method: "DELETE" }).finally(() => {
      try {
        window.sessionStorage.removeItem("unmehopa_email");
      } catch {
        /* Storage can be refused; it changes nothing that matters here. */
      }
      window.location.reload();
    });
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

  /* Counted over the month on screen, not the whole book. The ledger now runs
     a year either side, and a channel total spanning all of it would sit next
     to a calendar showing one month and read as that month's. */
  const monthBook = useMemo(
    () =>
      scopedBookings.filter(
        (b) => b.status !== "Cancelled" && inMonth(b, month),
      ),
    [scopedBookings, month],
  );

  const channelCounts = [
    {
      key: "all" as ChannelFilter,
      label: "Semua saluran",
      count: monthBook.length,
    },
    ...CHANNEL_KEYS.map((k) => ({
      key: k as ChannelFilter,
      label: k,
      count: monthBook.filter((b) => b.channel === k).length,
    })),
  ];

  /* Arrivals from today through the coming week, soonest first. A window
     rather than just today, so a quiet day still shows what is on its way. */
  const upcoming = visible
    .filter((b) => {
      const lead = dayDiff(today, b.checkIn);
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
      leadDays: dayDiff(today, b.checkIn),
    }));

  /* Everyone staying on the picked date, room order — including the ones the
     calendar had to hide behind "+N lagi". */
  /**
   * Read from the scoped book rather than the filtered view. The panel answers
   * an operational question — who is in tonight, and which rooms are free to
   * prepare — and that answer must not change because a channel filter or a
   * search term happens to be on.
   */
  const occupiedOn = useMemo(() => {
    if (!selectedDate) return [];
    return scopedBookings.filter(
      (b) =>
        b.status !== "Cancelled" &&
        b.checkIn <= selectedDate &&
        b.checkOut > selectedDate,
    );
  }, [selectedDate, scopedBookings]);

  const dayBookings = useMemo(
    () =>
      occupiedOn
        .map((b) => ({
          booking: b,
          roomName: roomById.get(b.roomId)?.name ?? "",
        }))
        .sort((a, b) => a.roomName.localeCompare(b.roomName)),
    [occupiedOn, roomById],
  );

  /* A room under renovation is not "kosong" — it cannot be sold — so it is
     named separately instead of padding the free list. */
  const dayRooms = useMemo(() => {
    if (!selectedDate) return { free: [], renovating: [] };
    const taken = new Set(occupiedOn.map((b) => b.roomId));
    return {
      free: scopedRooms
        .filter((r) => r.active && !taken.has(r.id))
        .map((r) => r.name),
      renovating: scopedRooms.filter((r) => !r.active).map((r) => r.name),
    };
  }, [selectedDate, occupiedOn, scopedRooms]);

  /* Bookings with at least one night inside the reported month. The book now
     runs a year either side, so anything averaged over "all bookings" would
     quietly become an all-time figure sitting under a monthly heading. */
  const monthBookings = useMemo(
    () => visible.filter((b) => inMonth(b, month)),
    [visible, month],
  );
  const prevMonthBookings = useMemo(
    () => visible.filter((b) => inMonth(b, prevMonth)),
    [visible, prevMonth],
  );

  const meanStay = (list: Booking[]) =>
    list.length
      ? list.reduce((t, b) => t + dayDiff(b.checkIn, b.checkOut), 0) /
        list.length
      : 0;

  const avgStayNum = meanStay(monthBookings);
  const avgStay = monthBookings.length ? avgStayNum.toFixed(1) + " malam" : "—";
  const adr = stats.nights ? stats.revenue / stats.nights : 0;
  const prevAdr = prevStats.nights ? prevStats.revenue / prevStats.nights : 0;
  const prevLabel = `${MONTHS[prevMonth.getMonth()]} ${prevMonth.getFullYear()}`;

  /**
   * A signed change against the previous month. `goodWhenUp` is null where the
   * direction carries no verdict on its own — a longer average stay is neither
   * a win nor a loss.
   */
  const delta = (
    now: number,
    before: number,
    unit: (n: number) => string,
    goodWhenUp: boolean | null,
  ): Kpi["delta"] => {
    if (!compare) return undefined;
    if (!prevStats.nights)
      return { text: `${prevLabel} belum ada data`, good: null };
    const diff = now - before;
    if (Math.abs(diff) < 0.05)
      return { text: `sama dengan ${prevLabel}`, good: null };
    const sign = diff > 0 ? "+" : "−";
    return {
      text: `${sign}${unit(Math.abs(diff))} vs ${prevLabel}`,
      good: goodWhenUp === null ? null : diff > 0 === goodWhenUp,
    };
  };

  const kpis: Kpi[] = [
    {
      label: "Okupansi",
      value: `${stats.occPct}%`,
      sub: `${stats.nights} dari ${stats.capacity} malam`,
      delta: delta(
        stats.occPct,
        prevStats.occPct,
        (n) => `${Math.round(n)} poin`,
        true,
      ),
    },
    showMoney
      ? {
          label: "Pendapatan kotor",
          value: fmt(stats.revenue),
          sub: "sebelum komisi OTA",
          delta: delta(stats.revenue, prevStats.revenue, fmt, true),
        }
      : {
          label: "Malam terjual",
          value: String(stats.nights),
          sub: "seluruh properti",
          delta: delta(
            stats.nights,
            prevStats.nights,
            (n) => `${Math.round(n)} malam`,
            true,
          ),
        },
    {
      label: "ADR",
      value: showMoney && stats.nights ? fmt(adr) : "—",
      sub: "rata-rata per malam terjual",
      delta: showMoney ? delta(adr, prevAdr, fmt, true) : undefined,
    },
    {
      label: "Lama menginap",
      value: avgStay,
      sub: "rata-rata semua saluran",
      delta: delta(
        avgStayNum,
        meanStay(prevMonthBookings),
        (n) => `${n.toFixed(1)} malam`,
        null,
      ),
    },
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

  /**
   * Everything both exports read, assembled once. The CSV and the PDF have to
   * agree with the screen down to the last figure, so neither recomputes
   * anything — they format what the report is already showing.
   */
  const buildReport = (): ReportData => {
    const propName = (key: PropertyKey) =>
      PROPERTIES.find((p) => p.key === key)?.name ?? "";
    return {
      monthLabel,
      monthKey: `${y}-${String(m + 1).padStart(2, "0")}`,
      showMoney,
      scopeLabel:
        filterProp === "all"
          ? allowedProps.map(propName).join(" + ")
          : propName(filterProp),
      kpis: kpis.map((k) => ({ label: k.label, value: k.value, sub: k.sub })),
      channels: (Object.entries(stats.byChannel) as [string, number][])
        .sort((a, b) => b[1] - a[1])
        .map(([label, value]) => ({
          label,
          value,
          share: Math.round((value / Math.max(1, stats.revenue)) * 100),
        })),
      rooms: activeRooms.map((r) => ({
        name: r.name,
        pct: Math.round(((stats.byRoom[r.id] ?? 0) / daysInMonth) * 100),
        nights: stats.byRoom[r.id] ?? 0,
      })),
      trend,
      daily,
      commission: stats.commission,
      generatedAt: new Date(),
      rows: monthBookings
        .slice()
        .sort(
          (a, b) =>
            a.checkIn.localeCompare(b.checkIn) ||
            (roomById.get(a.roomId)?.name ?? "").localeCompare(
              roomById.get(b.roomId)?.name ?? "",
            ),
        )
        .map((b) => {
          const room = roomById.get(b.roomId);
          const nights = dayDiff(b.checkIn, b.checkOut);
          const inside = nightsInMonth(b, y, m);
          return {
            /* Kolomnya bernama "Kode" dan dibaca manusia, jadi kodenya yang
               masuk. `id` dari database adalah cuid yang tidak berarti apa-apa
               di sebuah CSV yang dibuka pemiliknya. */
            id: b.code,
            property: room ? propName(room.prop) : "",
            room: room?.name ?? "",
            guest: b.guest,
            phone: b.phone,
            pax: b.pax,
            channel: CHANNEL_LABELS[b.channel],
            checkIn: b.checkIn,
            checkOut: b.checkOut,
            nights,
            nightsInMonth: inside,
            status: b.status,
            total: b.total,
            valueInMonth: (b.total / nights) * inside,
          };
        }),
    };
  };

  const exportCsv = () => {
    const data = buildReport();
    downloadCsv(data);
    flash(`${data.rows.length} booking diekspor ke CSV.`);
  };

  const exportPdf = async () => {
    setPdfBusy(true);
    try {
      await downloadPdf(buildReport());
      flash("Laporan PDF diunduh.");
    } catch {
      flash("Gagal menyiapkan PDF. Coba lagi.");
    } finally {
      setPdfBusy(false);
    }
  };

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
        ical: feeds.some((f) => f.roomId === r.id)
          ? `${feeds.filter((f) => f.roomId === r.id).length} feed`
          : "Belum diatur",
        status: r.active ? "Aktif" : "Renovasi",
        active: r.active,
        /* Bookings not yet finished — what a switch to renovation would
           strand. Counted from the whole book, not the filtered view. */
        upcoming: scopedBookings.filter(
          (b) =>
            b.roomId === r.id &&
            b.status !== "Cancelled" &&
            b.checkOut > today,
        ).length,
      })),
    };
  });

  const formRoom = roomById.get(form.room) ?? rooms[0];
  const formNights = Math.max(1, dayDiff(form.checkIn, form.checkOut));

  /* What else the owner could put this stay in. Read off `bookings` and not
     the filtered view: a sidebar filter must never be able to offer a room
     that something else is already sitting in. */
  const formAvailability = useMemo(
    () => freeRooms(bookings, rooms, form.property, form.checkIn, form.checkOut),
    [bookings, rooms, form.property, form.checkIn, form.checkOut],
  );

  // ---------------------------------------------------------------- render

  return (
    <>
      {/*
       * Full-bleed: the shell is the viewport edge to edge, with no frame and
       * no ground showing around it.
       *
       * The sidebar used to be a solid green column. At a sidebar's width that
       * much saturated colour is the first thing the eye lands on, every time,
       * before any of the work on the screen. It now carries the same weight
       * the rest of the manager does, a white panel and a hairline, and the
       * green is spent where it means something: the screen you are on.
       */}
      <div className="min-h-screen">
        <div
          className={
            nw
              ? "flex min-h-screen flex-col bg-surface"
              : "flex min-h-screen bg-canvas"
          }
        >
          {!nw && (
            <Sidebar
              narrow={false}
              nav={nav}
              screen={screen}
              onScreen={setScreen}
              propCounts={propCounts}
              feedCount={feeds.length}
              filterProp={filterProp}
              onFilterProp={setFilterProp}
              channelCounts={channelCounts}
              filterCh={filterCh}
              onFilterCh={setFilterCh}
            />
          )}

          <div
            className={
              nw
                ? "flex min-h-screen flex-col"
                : "flex min-w-0 flex-1 flex-col bg-surface"
            }
          >
            <TopBar
              showBrand={nw}
              compact={phone}
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

            {nw && (
              <Sidebar
                narrow
                nav={nav}
                screen={screen}
                onScreen={setScreen}
                propCounts={propCounts}
                feedCount={feeds.length}
                filterProp={filterProp}
                onFilterProp={setFilterProp}
                channelCounts={channelCounts}
                filterCh={filterCh}
                onFilterCh={setFilterCh}
              />
            )}

            <div
              className={`flex flex-1 items-stretch ${
                nw ? "flex-col" : "flex-row"
              }`}
            >
              <div
                className={`min-w-0 flex-1 bg-surface-soft ${
                  nw ? "px-[14px] pt-4 pb-6" : "px-[26px] pt-[22px] pb-[30px]"
                }`}
              >
                {/* Di atas isi tiap layar, bukan hanya kalender: okupansi di
                    Laporan dan tarif di Properti dibangkitkan dari sumber yang
                    sama, jadi peringatan yang cuma muncul di satu layar akan
                    membuat dua layar lain terbaca sebagai kenyataan. */}
                <DataSourceNote sumber={sumber} />

                {screen === "kalender" && (
                  <CalendarScreen
                    narrow={nw}
                    compact={phone}
                    showMoney={showMoney}
                    conflictCount={bannerPairs.length}
                    conflictTone={conflictTone}
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
                    compact={phone}
                    monthLabel={monthLabel}
                    prevLabel={prevLabel}
                    kpis={kpis}
                    channelRows={channelRows}
                    roomRows={roomRows}
                    commissionLabel={
                      showMoney
                        ? fmt(stats.commission)
                        : "disembunyikan untuk peran Staf"
                    }
                    trend={trend}
                    daily={daily}
                    anchorKey={`${y}-${String(m + 1).padStart(2, "0")}`}
                    compareKey={`${prevMonth.getFullYear()}-${String(
                      prevMonth.getMonth() + 1,
                    ).padStart(2, "0")}`}
                    showMoney={showMoney}
                    compare={compare}
                    onToggleCompare={() => setCompare((v) => !v)}
                    onExportCsv={exportCsv}
                    onExportPdf={exportPdf}
                    pdfBusy={pdfBusy}
                    onPrevMonth={() => setMonth(new Date(y, m - 1, 1))}
                    onNextMonth={() => setMonth(new Date(y, m + 1, 1))}
                  />
                )}

                {screen === "properti" && (
                  <PropertyScreen
                    compact={phone}
                    cards={propertyCards}
                    showMoney={showMoney}
                    canEdit={isOwner}
                    onSaveRoom={saveRoom}
                  />
                )}

                {screen === "sinkron" && isOwner && (
                  <SyncScreen
                    rooms={scopedRooms}
                    feeds={feeds}
                    tokens={tokens}
                    onAddFeed={addFeed}
                    onRemoveFeed={removeFeed}
                    onIssueToken={issueToken}
                    onResetToken={resetToken}
                    origin={origin}
                  />
                )}

                {screen === "website" && isOwner && (
                  <WebsiteScreen editor={userName} />
                )}

                {screen === "pengguna" && isOwner && (
                  <UsersScreen
                    compact={phone}
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
                  dayRooms={dayRooms}
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
      </div>

      {conflictOpen && bannerPairs.length > 0 && (
        <ConflictModal
          pairs={bannerPairs}
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
          availability={formAvailability}
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
