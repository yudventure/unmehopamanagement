"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { BookingDrawer } from "@/components/booking-drawer";
import { DataSourceNote, type SumberData } from "@/components/data-source-note";
import { BookingFormModal } from "@/components/booking-form-modal";
import { hitungStok, type Rekaman } from "@/lib/modul";
import { ConflictModal, type Selesai, type SolusiTamu } from "@/components/conflict-modal";
import { DashboardRail } from "@/components/dashboard-rail";
import { InviteModal } from "@/components/invite-modal";
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
import { SistemLamaScreen } from "@/components/screens/sistem-lama-screen";
import { SistemLamaPanel } from "@/components/sistem-lama-panel";
import {
  useKamarLama,
  useSesiLama,
  useSistemLama,
} from "@/components/sistem-lama-data";
import { PREFIKS_KAMAR, bookingDariLama } from "@/lib/dari-sistem-lama";
import {
  AKTIVITAS,
  ringkasSelam,
  sesiPerHari,
  type SesiLama,
} from "@/lib/sistem-lama-bentuk";
import { SyncScreen } from "@/components/screens/sync-screen";
import { LABEL_PERAN, aksesPenuh, layarUntuk, lihatSemua, lihatUang, ubahKamar } from "@/lib/peran";
import type { AkunPublik } from "@/lib/server/akun";
import { UsersScreen } from "@/components/screens/users-screen";
import { WebsiteScreen } from "@/components/screens/website-screen";
import { RangkaPanel, type Kabar, type NavGroup, type NavItem } from "@/components/rangka-panel";
import { FilterKalender } from "@/components/filter-kalender";
import { KalenderHero } from "@/components/kalender-hero";
import { PanelPesanan } from "@/components/panel-pesanan";
import { PesananMassalModal, type BarisSiap } from "@/components/pesanan-massal-modal";
import { bacaPesan, type BarisPesan } from "@/lib/baca-pesan";
import { RingkasanScreen, type Pintasan, type StokPerhatian } from "@/components/screens/ringkasan-screen";
import { PitaGalat, useGalat } from "@/components/galat-panel";
import { PenyediaJemput } from "@/components/jemput";
import { GudangScreen } from "@/components/screens/gudang-screen";
import { KeuanganScreen, type PendapatanBooking } from "@/components/screens/keuangan-screen";
import { SdmScreen } from "@/components/screens/sdm-screen";
import { PengaturanScreen } from "@/components/screens/pengaturan-screen";
import { StatistikScreen } from "@/components/screens/statistik-screen";
import {
  bookingDariApi,
  kamarDariApi,
  terlewat,
  type ApiKalender,
} from "@/lib/dari-database";
import { useViewportWidth } from "@/hooks/use-viewport-width";
import {
  CH,
  CHANNEL_KEYS,
  CHANNEL_LABELS,
  PROPERTIES,
  PROPERTIES_BERKAMAR,
  seedRooms,
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
  ringkasStats,
  splitConflicts,
  kunciBentrok,
  visibleBookings,
  type ChannelFilter,
  type PropFilter,
} from "@/lib/derive";
import { MONTHS, dayDiff, fmt, fmtShort, iso, parse } from "@/lib/format";
import { bookingTotal } from "@/lib/pricing";
import { downloadCsv, downloadPdf, type ReportData } from "@/lib/report-export";
import type {
  Booking,
  Room,
  BookingForm,
  BookingStatus,
  ChannelKey,
  Sambungan,
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

/**
 * Unit yang punya dive center. Sekarang hanya Turtle; Eddo menyiapkannya untuk
 * tahun depan. Mengubah Eddo menjadi `true` cukup untuk memunculkan "Jadwal
 * Dive Center" di bagian Eddo, bagi akun yang memegang properti Dive Center.
 * Datanya sendiri (jadwal, booking selam) masih satu unit `divecenter`; yang
 * dipisah per unit induk saat Eddo benar-benar mulai.
 */
const DIVE_CENTER_DI: Record<"turtle" | "eddo", boolean> = { turtle: true, eddo: false };

const NAV_LABELS: Record<Screen, string> = {
  ringkasan: "Ringkasan",
  kalender: "Kalender",
  laporan: "Laporan",
  properti: "Properti & Kamar",
  sinkron: "Sinkronisasi kalender",
  lama: "Sistem lama",
  website: "Website",
  statistik: "Statistik pengunjung",
  keuangan: "Keuangan & Aset",
  sdm: "SDM & Gaji",
  gudang: "Stok Gudang",
  pengaturan: "Pengaturan",
  pengguna: "Pengguna & Peran",
};

export interface BookingManagerProps {
  /** Screen shown right after signing in. */
  layarAwal?: Screen;
  /** Akun yang sedang masuk. Dashboard hanya dirender kalau halamannya sudah
      menemukan sesi yang sah, jadi tidak ada login yang digambar di atasnya. */
  akun: AkunPublik;
  /** Semua akun untuk developer dan pemilik; selain itu hanya akun sendiri. */
  daftarAkun: AkunPublik[];
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
  peran: "staf",
  scope: "Turtle Homestay",
  sandi: "",
};

/** Kirim JSON ke server. Kembali berisi pesan galat untuk pemilik, atau null bila berhasil. */
async function kirim(url: string, metode: string, isi: unknown): Promise<string | null> {
  try {
    const res = await fetch(url, {
      method: metode,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(isi),
    });
    if (res.ok) return null;
    const o = (await res.json().catch(() => ({}))) as { galat?: string };
    return o.galat ?? `Server menjawab ${res.status}.`;
  } catch {
    return "Tidak bisa menghubungi server.";
  }
}

/** Pengganti sesaat sebelum jam peramban terbaca; bukan jawabannya. */
const AWAL_BULAN = new Date(2026, 0, 1);
const AWAL_HARI = "2026-01-01";

/** Akun di server jadi baris di halaman Pengguna. */
function keUser(a: AkunPublik): User {
  return {
    id: a.email,
    peran: a.peran,
    name: a.nama,
    email: a.email,
    role: lihatSemua(a.peran) ? "Owner" : "Staf",
    scope: a.scope,
    active: a.aktif,
  };
}

export function BookingManager({
  layarAwal = "ringkasan",
  akun,
  daftarAkun,
  modeStaf = false,
  bookingPerHari = 4,
}: BookingManagerProps) {
  const [rooms, setRooms] = useState(seedRooms);
  /* Kosong sampai ada booking sungguhan. Tidak ada booking karangan: kalender
     dan laporan menampilkan apa yang ada di database dan sistem lama. */
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [users, setUsers] = useState<User[]>(() => daftarAkun.map(keUser));

  const [screen, setScreen] = useState<Screen>(layarAwal);
  const [month, setMonth] = useState(AWAL_BULAN);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  /** Day picked on the calendar, listed in the rail. Null = default rail. */
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [filterProp, setFilterProp] = useState<PropFilter>("all");
  const [filterCh, setFilterCh] = useState<ChannelFilter>("all");

  const [formOpen, setFormOpen] = useState(false);
  const [conflictOpen, setConflictOpen] = useState(false);
  /* Bentrok yang sudah dinyatakan selesai (kompensasi dan sebagainya), per kunci pasangan. */
  const [selesaiMap, setSelesaiMap] = useState<Record<string, Selesai & { roomId: string }>>({});
  const [compare, setCompare] = useState(false);
  const [pdfBusy, setPdfBusy] = useState(false);
  const [sambungan, setSambungan] = useState<Sambungan[]>([]);
  const [sedangJalan, setSedangJalan] = useState(false);
  const [form, setForm] = useState<BookingForm>(EMPTY_FORM);
  const [inviteOpen, setInviteOpen] = useState(false);
  /** Pemeriksaan banyak pesanan: kosong (Tambah banyak) atau hasil bacaan. */
  const [massal, setMassal] = useState<{ awal: BarisPesan[]; sumber: string } | null>(null);
  const [invite, setInvite] = useState<InviteForm>(EMPTY_INVITE);

  const [auth, setAuth] = useState(true);
  /* Peran dan alamat datang dari akun di server, bukan dari pilihan di layar. */
  const loginEmail = akun.email;
  const [menuOpen, setMenuOpen] = useState(false);

  const [toast, setToast] = useState("");
  const galat = useGalat(lihatSemua(akun.peran));
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
   * `AWAL_HARI` is only the first paint's stand-in, never the answer.
   */
  const [today, setToday] = useState(AWAL_HARI);
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

  /** Kamar, pesanan, dan sambungan dari buku di server. Benar bila berhasil. */
  const muatBuku = useCallback(async (signal?: AbortSignal): Promise<boolean> => {
    try {
      const res = await fetch("/api/buku", { signal, cache: "no-store" });
      if (!res.ok) return false;
      const d = (await res.json()) as {
        kamar: Room[];
        pesanan: Booking[];
        sambungan: Sambungan[];
      };
      setRooms(d.kamar);
      setBookings(d.pesanan);
      setSambungan(d.sambungan);
      /* Penyelesaian bentrok ikut dimuat; gagal memuatnya tidak boleh menggagalkan buku. */
      fetch("/api/bentrok", { signal, cache: "no-store" })
        .then((r) => (r.ok ? r.json() : null))
        .then((o: { selesai?: Record<string, Selesai & { roomId: string }> } | null) => o?.selesai && setSelesaiMap(o.selesai))
        .catch(() => undefined);
      setSumber({ keadaan: "lokal" });
      return true;
    } catch {
      return false;
    }
  }, []);
  const lokal = sumber.keadaan === "lokal";

  /* Kamar dan pesanan bisa berubah di perangkat lain, dan bacaan latar server
     menambah malam dari situs luar. Segarkan tiap menit selagi tab terbuka. */
  useEffect(() => {
    if (!lokal) return;
    const t = setInterval(() => {
      if (document.visibilityState === "visible") void muatBuku();
    }, 60_000);
    return () => clearInterval(t);
  }, [lokal, muatBuku]);

  useEffect(() => {
    if (!auth) return;

    const batal = new AbortController();
    const now = new Date();
    const dari = iso(
      new Date(now.getFullYear(), now.getMonth() - JENDELA_BULAN, 1),
    );
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
          /* Tanpa database, kamar, pesanan, dan sambungan kalender hidup di
             berkas server. Gagal membacanya jatuh ke keadaan "contoh" yang
             jujur: layar kosong dan tidak ada yang tersimpan. */
          const ok = await muatBuku(batal.signal);
          if (!ok && !batal.signal.aborted) setSumber({ keadaan: "contoh" });
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
  /* Layar yang boleh dibuka, dan siapa yang melihat semua unit dan rupiah,
     ditentukan peran akunnya di `lib/peran.ts`. */
  const layar = layarUntuk(akun.peran);
  const isOwner = lihatSemua(akun.peran);
  const showMoney = lihatUang(akun.peran) && !modeStaf;
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
    /* Dive center dijalankan Turtle, jadi yang memegang Turtle memegangnya juga
       (sama dengan `propertiBoleh` di server). */
    if (match?.key === "turtle") return ["turtle", "divecenter"];
    return match ? [match.key] : [];
  }, [isOwner, currentUser]);

  /*
   * Turtle dari sistem lama, kalau tersambung.
   *
   * Menggantikan, bukan menemani. Kamar Turtle di data kami bernama
   * "Turtle 01" sampai "Turtle 10" — nama yang dibangkitkan pembangkit di masa
   * prototipe, tidak pernah jadi nama kamar siapa pun dan tidak pernah
   * diucapkan ke tamu. Kamar sungguhannya ada di sistem lama, dan pemiliknya
   * menetapkan penamaan ikut sistem lama. Kalau keduanya ditampilkan
   * berdampingan, okupansi dihitung atas kamar yang separuhnya tidak pernah
   * ada.
   *
   * Eddo tidak tersentuh: sistem lama ini milik Turtle.
   */
  const { jawaban: jawabanLama } = useSistemLama();
  const lamaAktif = Boolean(jawabanLama?.ok && jawabanLama.bookings?.length && jawabanLama.pakaiDiKalender !== false);
  /* Jadwal dive centre punya sakelarnya sendiri: tetap terbaca walau booking
     sistem lama tidak dipakai di kalender. */
  const jadwalLamaAktif = Boolean(jawabanLama?.ok && jawabanLama.jadwal !== false);
  const kamarLama = useKamarLama(lamaAktif);

  /* Jadwal dive centre — kegiatan, bukan menginap. Tidak ikut ke `bookings`:
     sebuah trip menyelam tidak memegang kamar, dan memasukkannya ke sana akan
     terhitung sebagai malam terjual. Ia digambar di sel harinya sendiri. */
  const sesiLama = useSesiLama(jadwalLamaAktif);
  const sesiPerTanggal = useMemo(() => sesiPerHari(sesiLama), [sesiLama]);

  /* Jadwal dive centre pada bulan yang sedang dilihat. Dihitung dari peta yang
     sama yang menggambar pitanya di kisi, jadi angka di strip dan yang terlihat
     di kalender tidak bisa berselisih. */
  /* Sesi pada tanggal yang dipilih di kalender, dan sesi pada jendela yang
     sama dengan daftar check-in di atasnya — supaya dua angka yang berdampingan
     di rail menjawab rentang waktu yang sama. */
  const selamHari = useMemo(
    () => (selectedDate ? (sesiPerTanggal.get(selectedDate) ?? []) : []),
    [sesiPerTanggal, selectedDate],
  );

  const selamMendatang = useMemo(() => {
    const out: SesiLama[] = [];
    for (const [tanggal, daftar] of sesiPerTanggal) {
      const jarak = dayDiff(today, tanggal);
      if (jarak >= 0 && jarak <= UPCOMING_DAYS) out.push(...daftar);
    }
    return out.sort(
      (a, b) =>
        a.tanggal.localeCompare(b.tanggal) ||
        AKTIVITAS.indexOf(a.aktivitas) - AKTIVITAS.indexOf(b.aktivitas),
    );
  }, [sesiPerTanggal, today]);

  const selamBulanIni = useMemo(() => {
    const awal = iso(new Date(month.getFullYear(), month.getMonth(), 1));
    const akhir = iso(new Date(month.getFullYear(), month.getMonth() + 1, 1));
    const dalam: SesiLama[] = [];
    for (const [tanggal, daftar] of sesiPerTanggal) {
      if (tanggal >= awal && tanggal < akhir) dalam.push(...daftar);
    }
    return ringkasSelam(dalam);
  }, [sesiPerTanggal, month]);

  const dariLama = useMemo(
    () =>
      lamaAktif
        ? bookingDariLama(jawabanLama?.bookings ?? [], kamarLama)
        : null,
    [lamaAktif, jawabanLama, kamarLama],
  );

  const rooms2 = useMemo(
    () =>
      dariLama
        ? [...rooms.filter((r) => r.prop !== "turtle"), ...dariLama.rooms]
        : rooms,
    [rooms, dariLama],
  );
  const bookings2 = useMemo(() => {
    if (!dariLama) return bookings;
    const turtle = new Set(
      rooms.filter((r) => r.prop === "turtle").map((r) => r.id),
    );
    return [
      ...bookings.filter((b) => !turtle.has(b.roomId)),
      ...dariLama.bookings,
    ];
  }, [bookings, rooms, dariLama]);

  /* Everything downstream reads these, never `rooms`/`bookings` directly, so
     the scope cannot be sidestepped by one screen forgetting to apply it. */
  const scopedRooms = useMemo(
    () => rooms2.filter((r) => allowedProps.includes(r.prop)),
    [rooms2, allowedProps],
  );
  const scopedBookings = useMemo(() => {
    const ids = new Set(scopedRooms.map((r) => r.id));
    return bookings2.filter((b) => ids.has(b.roomId));
  }, [bookings2, scopedRooms]);

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
  const semuaBentrok = useMemo(
    () => findConflicts(scopedBookings),
    [scopedBookings],
  );
  /* Yang sudah diselesaikan keluar dari peringatan, penanda kalender, dan
     hitungan; ia tetap bisa dilihat dan dibuka lagi di jendela bentrok. */
  const conflicts = useMemo(
    () => semuaBentrok.filter((p) => !selesaiMap[kunciBentrok(p)]),
    [semuaBentrok, selesaiMap],
  );
  const bentrokSelesai = useMemo(
    () => semuaBentrok.flatMap((pair) => (selesaiMap[kunciBentrok(pair)] ? [{ pair, rec: selesaiMap[kunciBentrok(pair)] }] : [])),
    [semuaBentrok, selesaiMap],
  );
  const conflictDays = useMemo(() => conflictDates(conflicts), [conflicts]);
  const conflictIds = useMemo(
    () => new Set(conflicts.flatMap((p) => [p.a.id, p.b.id])),
    [conflicts],
  );

  const terbukaJumlah = useRef(0);
  const selesaikanBentrok = useCallback(
    async (pair: { roomId: string; a: { id: string }; b: { id: string }; from: string; to: string }, solusi: Record<string, SolusiTamu>) => {
      const g = await kirim("/api/bentrok", "PUT", { roomId: pair.roomId, a: pair.a.id, b: pair.b.id, from: pair.from, to: pair.to, selesai: true, solusi });
      if (g) return g;
      await muatBuku();
      /* Yang terakhir selesai: jendelanya tidak punya pekerjaan lagi, tutup. */
      if (terbukaJumlah.current <= 1) setConflictOpen(false);
      flash("Bentrok ditandai sudah diselesaikan.");
      return null;
    },
    [muatBuku, flash],
  );
  const bukaLagiBentrok = useCallback(
    async (pair: { roomId: string; a: { id: string }; b: { id: string }; from: string; to: string }) => {
      const g = await kirim("/api/bentrok", "PUT", { roomId: pair.roomId, a: pair.a.id, b: pair.b.id, from: pair.from, to: pair.to, selesai: false });
      if (g) return flash(g);
      await muatBuku();
      flash("Bentrok dibuka lagi.");
    },
    [muatBuku, flash],
  );

  /* The banner speaks for one of these two lists, never both. A live overlap
     is work; a past one is a record, and mixing them in one red sentence is
     how the red stops meaning anything. */
  const { live: liveConflicts, past: pastConflicts } = useMemo(
    () => splitConflicts(conflicts, today),
    [conflicts, today],
  );
  const bannerPairs = liveConflicts.length ? liveConflicts : pastConflicts;
  terbukaJumlah.current = bannerPairs.length;
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

  /* Dua angka sisanya dari PRD F6.1. Tidak ikut `month` di daftar
     ketergantungannya, dan itu benar: menggeser kalender ke Desember tidak
     mengubah berapa booking yang masuk minggu ini atau berapa yang belum
     dibayar hari ini. */
  const ringkas = useMemo(() => ringkasStats(visible, today), [visible, today]);

  /** Pendapatan yang nol semata-mata karena malamnya belum berharga. */
  const tanpaHarga = stats.malamTanpaHarga > 0 && stats.revenue === 0;

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
      const asal = bookings.find((b) => b.id === id);
      if (asal?.src === "iCal") {
        flash("Booking dari situs luar diubah di situs itu, bukan di sini.");
        return;
      }
      const stamp = {
        updatedAt: new Date().toISOString(),
        updatedBy: userName,
      };
      setBookings((prev) =>
        prev.map((b) => (b.id === id ? { ...b, ...patch, ...stamp } : b)),
      );
      flash(msg);
      /* Tersimpan di server supaya tidak hilang dan ikut ke tautan ekspor. */
      if (lokal && asal) {
        void kirim("/api/pesanan", "PATCH", {
          id,
          status: patch.status,
          notes: patch.notes,
          paid: patch.paid,
        }).then((g) => {
          if (g) {
            flash(g);
            void muatBuku();
          }
        });
      }
    },
    [flash, userName, bookings, lokal, muatBuku],
  );

  /* Sambungan kalender ke situs luar. Semua lewat server: tautannya dibaca
     di sana, dan tautan ekspornya disajikan dari sana. */
  const tambahSambungan = useCallback(
    async (roomId: string, nama: string, url: string): Promise<string | null> => {
      if (roomId.startsWith(PREFIKS_KAMAR))
        return "Kamar Turtle masih dibaca dari sistem lama, jadi belum bisa disambungkan ke situs luar dari sini.";
      const g = await kirim("/api/sinkron", "POST", { roomId, nama, url });
      if (g) return g;
      await muatBuku();
      flash(url ? `${nama} tersambung.` : `${nama} ditambahkan, tautan ekspor siap.`);
      return null;
    },
    [flash, muatBuku],
  );

  const hapusSambungan = useCallback(
    async (id: string) => {
      const g = await kirim("/api/sinkron", "DELETE", { id });
      if (g) return flash(g);
      await muatBuku();
      flash("Sambungan dihapus.");
    },
    [flash, muatBuku],
  );

  const ubahUrlSambungan = useCallback(
    async (id: string, url: string): Promise<string | null> => {
      const g = await kirim("/api/sinkron", "PATCH", { id, url });
      if (g) return g;
      await muatBuku();
      flash("Tautan disimpan dan dibaca.");
      return null;
    },
    [flash, muatBuku],
  );

  const kamarLainSambungan = useCallback(
    async (id: string, kamarLain: string[]): Promise<string | null> => {
      const g = await kirim("/api/sinkron", "PATCH", { id, kamarLain });
      if (g) return g;
      await muatBuku();
      flash(kamarLain.length ? "Bacaan dibagikan ke kamar yang kosong." : "Bacaan kembali ke satu kamar.");
      return null;
    },
    [flash, muatBuku],
  );

  const tokenBaruSambungan = useCallback(
    async (id: string) => {
      const g = await kirim("/api/sinkron", "PATCH", { id, tokenBaru: true });
      if (g) return flash(g);
      await muatBuku();
      flash("Tautan ekspor baru dibuat. Yang lama tidak berlaku lagi.");
    },
    [flash, muatBuku],
  );

  const jalankanSinkron = useCallback(async () => {
    setSedangJalan(true);
    const g = await kirim("/api/sinkron/jalankan", "POST", {});
    await muatBuku();
    setSedangJalan(false);
    flash(g ?? "Semua sambungan dibaca ulang.");
  }, [flash, muatBuku]);

  /* Room configuration now moves as one saved edit rather than a live field,
     so it validates in one place and can be rejected as a whole. */
  /** Menyimpan seluruh daftar kamar ke server, dan memulihkan dari server bila ditolak. */
  const simpanKamar = useCallback(
    async (daftar: Room[]): Promise<string | null> => {
      const g = await kirim("/api/kamar", "PUT", { kamar: daftar });
      if (g) void muatBuku();
      return g;
    },
    [muatBuku],
  );

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

      let next: Room[];
      if (roomId.startsWith("__baru__:")) {
        const prop = roomId.slice("__baru__:".length) as PropertyKey;
        /* Awalan dan nomor dari kamar yang sudah ada di properti itu, supaya
           kamar baru mengikuti penamaan yang berlaku (T11 setelah T10). */
        const milik = rooms.filter((r) => r.prop === prop);
        const awalan = milik[0]?.id.replace(/\d+$/, "") || prop.charAt(0).toUpperCase();
        const nomor = Math.max(
          0,
          ...rooms
            .filter((r) => r.id.startsWith(awalan) && /^\d+$/.test(r.id.slice(awalan.length)))
            .map((r) => Number(r.id.slice(awalan.length))),
        );
        let id = `${awalan}${nomor + 1}`;
        while (rooms.some((r) => r.id === id)) id += "x";
        next = [...rooms, { id, prop, name, cap, rate: patch.rate, active: patch.active }];
      } else {
        next = rooms.map((r) =>
          r.id === roomId
            ? { ...r, name, cap, rate: patch.rate, active: patch.active }
            : r,
        );
      }
      setRooms(next);
      flash(roomId.startsWith("__baru__:") ? `${name} ditambahkan.` : `${name} diperbarui.`);
      if (lokal) void simpanKamar(next).then((g) => g && flash(g));
      return null;
    },
    [rooms, flash, lokal, simpanKamar],
  );

  const deleteRoom = useCallback(
    (roomId: string): string | null => {
      const r = rooms.find((x) => x.id === roomId);
      if (!r) return null;
      if (!lokal) return "Menghapus kamar butuh penyimpanan di server.";
      const next = rooms.filter((x) => x.id !== roomId);
      setRooms(next);
      void simpanKamar(next).then((g) => g ? flash(g) : flash(`${r.name} dihapus.`));
      return null;
    },
    [rooms, lokal, simpanKamar, flash],
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
    /* Dari kalender sebuah unit, pesanan baru dimulai di unit itu. Dari Semua
       unit, pilihannya terbuka untuk unit mana pun yang boleh dicatat. */
    const unit = filterProp !== "all" && filterProp !== "divecenter" && allowedProps.includes(filterProp) ? filterProp : null;
    const prop = unit ?? (allowedProps.includes(form.property) ? form.property : allowedProps[0]);
    if (prop && prop !== form.property) setFormProperty(prop);
    /* Tanggal bawaan form adalah sisa data contoh yang lama. Bila sudah lewat,
       mulai dari hari ini dan besok. */
    if (form.checkIn < today) {
      const besok = iso(new Date(parse(today).getFullYear(), parse(today).getMonth(), parse(today).getDate() + 1));
      setForm((prev) => ({ ...prev, checkIn: today, checkOut: besok }));
    }
    setFormOpen(true);
  }, [allowedProps, form.property, form.checkIn, setFormProperty, filterProp, today]);

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
        /* Id unik lintas perangkat; kode hanya yang diucapkan ke tamu. */
        id: `BK${Date.now().toString(36)}`,
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
        createdAt: today,
      };

      setBookings((prev) => prev.concat(booking));
      if (lokal) {
        void kirim("/api/pesanan", "POST", booking).then((g) => {
          if (g) {
            flash(g);
            void muatBuku();
          }
        });
      }
      setFormOpen(false);
      setSelectedId(booking.id);
      setScreen("kalender");
      flash(
        status === "Confirmed"
          ? "Booking dikonfirmasi."
          : "Booking disimpan, hold 1×24 jam.",
      );
    },
    [form, roomById, bookings.length, flash, lokal, today, muatBuku],
  );

  /** Nama sumber untuk pesan yang ditempel. Stay Raja Ampat adalah agen yang mengirim tamu lewat WhatsApp. */
  const SUMBER_PESAN = "Stay Raja Ampat";

  /** Kamar yang boleh dipilih di pemeriksaan banyak pesanan: unit yang sedang dibuka, hanya yang bisa dicatat. */
  const kamarPesan = useMemo(
    () =>
      scopedRooms
        .filter((r) => r.active && !r.id.startsWith(PREFIKS_KAMAR) && (filterProp === "all" || r.prop === filterProp))
        .map((r) => ({ ...r, unit: PROPERTIES.find((p) => p.key === r.prop)?.name ?? r.prop })),
    [scopedRooms, filterProp],
  );

  const bacaTeks = useCallback(
    (teks: string): string | null => {
      const baris = bacaPesan(teks, kamarPesan.map((r) => ({ id: r.id, name: r.name })), today);
      if (baris.length === 0) return "Tidak ada tanggal yang bisa dikenali di pesan itu. Isi lewat Tambah banyak, atau periksa pesannya.";
      setMassal({ awal: baris, sumber: SUMBER_PESAN });
      return null;
    },
    [kamarPesan, today],
  );

  const bacaGambar = useCallback(
    async (berkas: File): Promise<string | null> => {
      if (berkas.size > 5 * 1024 * 1024) return "Gambar terlalu besar. Maksimal 5 MB.";
      const data = await new Promise<string>((ok, gagal) => {
        const r = new FileReader();
        r.onload = () => ok(String(r.result));
        r.onerror = () => gagal(new Error("baca"));
        r.readAsDataURL(berkas);
      }).catch(() => "");
      if (!data) return "Gambar tidak bisa dibuka.";
      try {
        const res = await fetch("/api/baca-pesan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ gambar: data, jenis: berkas.type, hariIni: today, kamar: kamarPesan.map((r) => r.name) }),
        });
        const o = (await res.json().catch(() => ({}))) as { galat?: string; baris?: BarisPesan[] };
        if (!res.ok) return o.galat ?? `Server menjawab ${res.status}.`;
        const baris = (o.baris ?? []).map((b) => ({
          ...b,
          /* Nama kamar dari bacaan dicocokkan ke kamar yang ada. */
          room: kamarPesan.find((r) => r.name.toLowerCase() === b.room.toLowerCase())?.id ?? "",
        }));
        if (baris.length === 0) return "Tidak ada pesanan yang terbaca di screenshot itu. Coba tempel teksnya.";
        setMassal({ awal: baris, sumber: SUMBER_PESAN });
        return null;
      } catch {
        return "Tidak bisa menghubungi server.";
      }
    },
    [kamarPesan, today],
  );

  const simpanBanyak = useCallback(
    (baris: BarisSiap[]): string | null => {
      const dibuat: Booking[] = [];
      for (const [i, b] of baris.entries()) {
        const kamar = rooms2.find((r) => r.id === b.room);
        if (!kamar) return `Kamar untuk ${b.guest} tidak ditemukan.`;
        const malam = Math.max(1, dayDiff(b.checkIn, b.checkOut));
        const unik = `BK${Date.now().toString(36)}${i}`;
        dibuat.push({
          id: unik,
          code: "BK" + String(9100 + bookings.length + i).slice(-4),
          roomId: b.room,
          guest: b.guest,
          phone: "-",
          pax: b.pax,
          channel: b.channel,
          checkIn: b.checkIn,
          checkOut: b.checkOut,
          /* Harga hanya bila tertulis atau bila pesanan langsung (tarif kamar).
             Pesanan dari agen tanpa harga ditandai belum berharga, bukan nol. */
          total: b.total ?? (b.sumberNama ? 0 : bookingTotal(kamar.rate, malam, b.channel)),
          ...(b.total === null && b.sumberNama ? { tanpaHarga: true } : {}),
          status: b.status,
          notes: b.notes,
          src: "manual",
          createdAt: today,
          ...(b.sumberNama ? { sumberNama: b.sumberNama } : {}),
        });
      }
      setBookings((prev) => prev.concat(dibuat));
      flash(`${dibuat.length} pesanan disimpan.`);
      if (lokal) {
        void (async () => {
          const gagal: string[] = [];
          for (const d of dibuat) {
            const g = await kirim("/api/pesanan", "POST", d);
            if (g) gagal.push(`${d.guest}: ${g}`);
          }
          if (gagal.length) {
            flash(`${gagal.length} pesanan belum tersimpan di server. ${gagal[0]}`);
            void muatBuku();
          }
        })();
      }
      return null;
    },
    [rooms2, bookings.length, today, flash, lokal, muatBuku],
  );

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

  const toggleUser = useCallback(
    async (user: User) => {
      const res = await fetch("/api/akun", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user.email, aktif: !user.active }),
      }).catch(() => null);
      if (!res?.ok) {
        const o = (await res?.json().catch(() => ({}))) as { galat?: string } | undefined;
        flash(o?.galat ?? "Tidak bisa menyimpan perubahan akun.");
        return;
      }
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

  const sendInvite = useCallback(async () => {
    if (!invite.name.trim() || !invite.email.trim() || !invite.sandi) {
      flash("Nama, email, dan kata sandi awal wajib diisi.");
      return;
    }
    const res = await fetch("/api/akun", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nama: invite.name,
        email: invite.email,
        sandi: invite.sandi,
        peran: invite.peran,
        scope: invite.scope,
      }),
    }).catch(() => null);
    const o = (await res?.json().catch(() => ({}))) as
      | { galat?: string; akun?: AkunPublik }
      | undefined;
    if (!res?.ok || !o?.akun) {
      flash(o?.galat ?? "Tidak bisa membuat akun.");
      return;
    }
    setUsers((prev) => prev.concat(keUser(o.akun!)));
    setInviteOpen(false);
    flash(`Akun ${o.akun.email} dibuat.`);
    setInvite(EMPTY_INVITE);
  }, [invite, flash]);

  // ------------------------------------------------------------ view models

  /* Kartu HARI INI di bawah menu: satu kalimat utuh dari booking yang ada. */
  /* Siapa yang datang dan pulang hari ini, untuk tombol di kartu HARI INI. */
  const tamuHariIni = useMemo(() => {
    const aktifB = scopedBookings.filter((b) => b.status !== "Cancelled" && b.status !== "Tidak datang");
    const unitDari = (roomId: string) => {
      const r = roomById.get(roomId);
      return PROPERTIES.find((p) => p.key === r?.prop)?.name ?? "";
    };
    const ke = (b: Booking, sudah: boolean) => ({
      id: b.id,
      guest: b.guest,
      kamar: roomById.get(b.roomId)?.name ?? b.roomId,
      unit: unitDari(b.roomId),
      saluran: b.sumberNama ?? CHANNEL_LABELS[b.channel],
      sudah,
    });
    return {
      masuk: aktifB.filter((b) => b.checkIn === today).map((b) => ke(b, b.status === "Checked-in" || b.status === "Checked-out")),
      keluar: aktifB.filter((b) => b.checkOut === today).map((b) => ke(b, b.status === "Checked-out")),
    };
  }, [scopedBookings, roomById, today]);

  /* Unit sebuah booking: kamar dari buku kita, atau Turtle bila kamarnya dari sistem lama. */
  const unitBooking = useCallback(
    (b: Booking): PropertyKey | null => roomById.get(b.roomId)?.prop ?? (b.roomId.startsWith("lama-") ? "turtle" : null),
    [roomById],
  );

  /* Pendapatan booking untuk layar Keuangan: yang tiba di bulan itu, dari harga
     yang sudah diisi di kalender. Yang belum berharga dihitung terpisah. */
  const pendapatanBooking = useCallback(
    (bulan: string, unit: PropFilter): PendapatanBooking => {
      const hasil: PendapatanBooking = { total: 0, jumlah: 0, tanpaHarga: 0 };
      for (const b of scopedBookings) {
        if (b.status === "Cancelled" || b.status === "Tidak datang" || !b.checkIn.startsWith(bulan)) continue;
        const u = unitBooking(b);
        if (unit !== "all" && u !== unit) continue;
        hasil.jumlah += 1;
        if (b.total > 0) hasil.total += b.total;
        else hasil.tanpaHarga += 1;
      }
      return hasil;
    },
    [scopedBookings, unitBooking],
  );

  /* Kamar terisi 30 hari ke depan per unit, untuk memperkirakan kebutuhan barang gudang. */
  const kamarMalam30 = useMemo(() => {
    const hasil: Partial<Record<PropertyKey, number>> = {};
    const akhir = iso(new Date(parse(today).getTime() + 30 * 86400000));
    for (const b of scopedBookings) {
      if (b.status === "Cancelled" || b.status === "Tidak datang") continue;
      const u = unitBooking(b);
      if (!u) continue;
      const dari = b.checkIn > today ? b.checkIn : today;
      const sampai = b.checkOut < akhir ? b.checkOut : akhir;
      const malam = dayDiff(dari, sampai);
      if (malam > 0) hasil[u] = (hasil[u] ?? 0) + malam;
    }
    return hasil;
  }, [scopedBookings, unitBooking, today]);

  /* Stok gudang yang habis atau menipis, untuk Ringkasan. Hanya akun yang punya
     layar Gudang; dimuat saat Ringkasan dibuka dan diperbarui tiap dua menit. */
  const [gudangMentah, setGudangMentah] = useState<{ barang: Rekaman[]; mutasi: Rekaman[] } | null>(null);
  const adaGudang = layar.includes("gudang");
  useEffect(() => {
    if (!adaGudang || screen !== "ringkasan") return;
    let batal = false;
    const muat = () =>
      fetch("/api/modul/gudang", { cache: "no-store" })
        .then((r) => (r.ok ? r.json() : null))
        .then((o: { data?: { barang?: Rekaman[]; mutasi?: Rekaman[] } } | null) => {
          if (!batal && o?.data) setGudangMentah({ barang: o.data.barang ?? [], mutasi: o.data.mutasi ?? [] });
        })
        .catch(() => undefined);
    void muat();
    const t = setInterval(muat, 120_000);
    return () => {
      batal = true;
      clearInterval(t);
    };
  }, [adaGudang, screen]);
  const stokPerhatian = useMemo<(StokPerhatian & { unit: PropertyKey[] }) | null>(() => {
    if (!gudangMentah) return null;
    const baris = hitungStok(gudangMentah.barang, gudangMentah.mutasi, kamarMalam30);
    const habis = baris.filter((b) => b.status === "Habis");
    const menipis = baris.filter((b) => b.status === "Menipis");
    if (!habis.length && !menipis.length) return null;
    return {
      habis: habis.length,
      menipis: menipis.length,
      contoh: [...habis, ...menipis].slice(0, 3).map((b) => b.nama),
      unit: [...new Set([...habis, ...menipis].map((b) => b.unit))],
    };
  }, [gudangMentah, kamarMalam30]);

  const hariIniKalimat = useMemo(() => {
    if (!layar.includes("kalender")) return "Pilih halaman yang Anda butuhkan dari menu.";
    const aktif = scopedBookings.filter(
      (b) => b.status !== "Cancelled" && b.status !== "Tidak datang",
    );
    const tiba = aktif.filter((b) => b.checkIn === today).length;
    const pulang = aktif.filter((b) => b.checkOut === today).length;
    const tunggu = aktif.filter((b) => b.status === "Tentative").length;
    if (!tiba && !pulang && !tunggu) return "Belum ada tamu tiba atau pulang hari ini.";
    const bagian: string[] = [];
    if (tiba) bagian.push(`${tiba} tamu tiba`);
    if (pulang) bagian.push(`${pulang} pulang`);
    const awal = bagian.length ? bagian.join(" dan ") + " hari ini." : "";
    return `${awal}${tunggu ? ` ${tunggu} booking menunggu konfirmasi.` : ""}`.trim();
  }, [scopedBookings, today, layar]);

  const kabarMenunggu = useMemo<Kabar[]>(
    () =>
      scopedBookings
        .filter((b) => b.status === "Tentative")
        .sort((a, b) => a.checkIn.localeCompare(b.checkIn))
        .map((b) => ({
          id: b.id,
          judul: b.guest,
          baris: `${b.code}, tiba ${fmtShort(b.checkIn)}`,
        })),
    [scopedBookings],
  );

  /**
   * Menu per unit. Pemilik, general manager, dan developer melihat satu bagian
   * "Semua unit" dan satu bagian per unit (Turtle, Eddo, Dive Center), masing-
   * masing dengan halamannya sendiri. Manajer unit dan staf hanya melihat
   * bagian unit mereka. Keuangan, HRD, dan PR hanya halaman perannya.
   *
   * Dive Center tidak punya kamar, jadi hanya kalender (jadwal selam). Sistem
   * lama adalah milik Turtle, jadi duduk di bagian Turtle.
   */
  /* Kepala kalender dan panel pesanan: dari booking unit yang sedang dibuka,
     tanpa saringan saluran dan pencarian, supaya angkanya tidak ikut berubah
     saat orang mengetik di kotak cari. */
  const unitAktifIds = useMemo(
    () => new Set(scopedRooms.filter((r) => filterProp === "all" || r.prop === filterProp).map((r) => r.id)),
    [scopedRooms, filterProp],
  );
  const daftarPanel = useMemo(
    () =>
      scopedBookings
        .filter((b) => unitAktifIds.has(b.roomId))
        .map((b) => ({ booking: b, kamar: roomById.get(b.roomId)?.name ?? "" })),
    [scopedBookings, unitAktifIds, roomById],
  );
  const heroData = useMemo(() => {
    const aktifB = daftarPanel.map((d) => d.booking).filter((b) => b.status !== "Cancelled" && b.status !== "Tidak datang");
    const kamarAktif = scopedRooms.filter((r) => r.active && (filterProp === "all" || r.prop === filterProp));
    const ids = new Set(kamarAktif.map((r) => r.id));
    const terisi = new Set(aktifB.filter((b) => ids.has(b.roomId) && b.checkIn <= today && b.checkOut > today).map((b) => b.roomId)).size;
    const batas = iso(new Date(parse(today).getFullYear(), parse(today).getMonth(), parse(today).getDate() + 7));
    return {
      kamar: kamarAktif.length,
      terisi,
      kedatangan: aktifB.filter((b) => b.checkIn >= today && b.checkIn <= batas).length,
    };
  }, [daftarPanel, scopedRooms, filterProp, today]);

  const navGrup = useMemo<NavGroup[]>(() => {
    const butir = (k: Screen, unit?: string, label?: string): NavItem => ({
      key: k, label: label ?? NAV_LABELS[k], unit,
    });
    const ada = (k: Screen) => layar.includes(k);
    const grup: NavGroup[] = [{ id: "awal", label: "", items: [butir("ringkasan")] }];
    const perUnit = isOwner || akun.peran === "manajer" || akun.peran === "staf";
    if (perUnit) {
      const bergantungUnit: Screen[] = ["kalender", "laporan", "properti", "sinkron", "statistik", "keuangan", "sdm", "gudang"];
      if (isOwner && allowedProps.length > 1) {
        grup.push({
          id: "semua",
          label: "Semua unit",
          items: bergantungUnit.filter(ada).map((k) => butir(k, "all")),
        });
      }
      const punyaDive = allowedProps.includes("divecenter");
      for (const u of allowedProps) {
        if (u === "divecenter") continue;
        const nama = PROPERTIES.find((p) => p.key === u)?.name ?? u;
        /* Dive center ikut di bawah unit yang menjalankannya, tepat di bawah
           Kalender: dua kalender yang paling sering dibuka berdampingan. */
        const jadwalDive =
          DIVE_CENTER_DI[u as "turtle" | "eddo"] && punyaDive && ada("kalender")
            ? [butir("kalender", "divecenter", "Jadwal Dive Center")]
            : [];
        const items: NavItem[] = [
          ...bergantungUnit.filter(ada).flatMap((k) => (k === "kalender" ? [butir(k, u), ...jadwalDive] : [butir(k, u)])),
          ...(ada("website") ? [butir("website", u)] : []),
          ...(u === "turtle" && ada("lama") ? [butir("lama", u)] : []),
        ];
        if (items.length) grup.push({ id: u, label: nama, items });
      }
      /* Dive center yang akunnya tidak memegang unit induknya, misalnya
         manajer dive center: bagiannya sendiri, dengan nama induknya. */
      const induk = (["turtle", "eddo"] as const).find((u) => DIVE_CENTER_DI[u]);
      if (punyaDive && induk && !allowedProps.includes(induk) && ada("kalender")) {
        const nama = PROPERTIES.find((p) => p.key === induk)?.name ?? induk;
        grup.push({
          id: "divecenter",
          label: `Dive Center ${nama.split(" ")[0]}`,
          items: [butir("kalender", "divecenter", "Jadwal Dive Center")],
        });
      }
      const umum = (["pengaturan", "pengguna"] as Screen[]).filter(ada).map((k) => butir(k));
      if (umum.length) grup.push({ id: "perusahaan", label: "Perusahaan", items: umum });
    } else {
      const sisa = layar
        .filter((k) => k !== "ringkasan")
        .map((k) => butir(k, (["kalender", "laporan", "properti", "sinkron", "statistik", "keuangan", "sdm", "gudang"] as Screen[]).includes(k) ? "all" : undefined));
      if (sisa.length) grup.push({ id: "peran", label: "", items: sisa });
    }
    return grup;
  }, [layar, isOwner, akun.peran, allowedProps]);

  /** Membuka satu item menu: layarnya, dan unitnya bila layar itu bergantung pada unit. */
  const bukaMenu = useCallback((n: NavItem) => {
    setScreen(n.key);
    if (n.unit !== undefined) setFilterProp(n.unit as PropFilter);
    setSelectedId(null);
  }, []);

  const pintasan = useMemo<Pintasan[]>(() => {
    const ket: Partial<Record<Screen, string>> = {
      kalender: "Kalender booking.", laporan: "Okupansi dan pendapatan.", properti: "Kamar, tarif, dan statusnya.",
      sinkron: "Sambungan kalender ke situs luar.", lama: "Data dari sistem lama Turtle.",
      website: "Isi dan foto website.", keuangan: "Pemasukan, pengeluaran, aset, dan laba.", sdm: "Pegawai, absensi, gaji, asuransi, inventaris.", gudang: "Stok tisu, amenitis, dan barang pelayanan.", statistik: "Pengunjung website dan asal negara.", pengguna: "Akun, peran, dan akses unit.", pengaturan: "Sakelar sistem lama dan penyiapan pembayaran.",
    };
    const hasil: Pintasan[] = [];
    for (const g of navGrup) {
      if (g.id === "awal") continue;
      if (g.label && g.id !== "perusahaan") {
        hasil.push({
          id: g.id, label: g.label, ket: g.items.map((i) => i.label).join(", "),
          ikon: g.items[0].key, onPilih: () => bukaMenu(g.items[0]),
        });
      } else {
        for (const i of g.items)
          hasil.push({ id: `${g.id}-${i.key}`, label: i.label, ket: ket[i.key] ?? "", ikon: i.key, onPilih: () => bukaMenu(i) });
      }
    }
    return hasil;
  }, [navGrup, bukaMenu]);

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
              /* Angka di sebelah nama adalah ukuran unitnya. Untuk homestay
                 itu jumlah kamar; untuk dive centre, kamar tidak ada, jadi
                 yang dihitung kegiatan yang dijadwalkannya. Nol di sana akan
                 terbaca sebagai unit kosong, padahal jadwalnya justru yang
                 paling padat. */
              count: p.kamar
                ? scopedRooms.filter((r) => r.prop === p.key).length
                : AKTIVITAS.length,
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
  /* Hanya unit yang sedang dibuka (Turtle, Eddo, atau semua): kamar kosong
     Turtle tidak boleh tercampur kamar Eddo. Dive Center ikut Turtle. */
  const dalamUnitDipilih = useCallback(
    (prop: PropertyKey | null) =>
      filterProp === "all" || prop === filterProp || (filterProp === "turtle" && prop === "divecenter"),
    [filterProp],
  );
  const occupiedOn = useMemo(() => {
    if (!selectedDate) return [];
    return scopedBookings.filter(
      (b) =>
        b.status !== "Cancelled" &&
        b.status !== "Tidak datang" &&
        b.checkIn <= selectedDate &&
        b.checkOut > selectedDate &&
        dalamUnitDipilih(unitBooking(b)),
    );
  }, [selectedDate, scopedBookings, dalamUnitDipilih, unitBooking]);

  const dayBookings = useMemo(
    () =>
      occupiedOn
        .map((b) => ({
          booking: b,
          roomName: roomById.get(b.roomId)?.name ?? "",
        }))
        .sort((a, b) => a.roomName.localeCompare(b.roomName, "id", { numeric: true })),
    [occupiedOn, roomById],
  );

  /* Yang pulang pagi itu: tidak menginap malam itu, tapi kamarnya perlu
     dibereskan hari itu. */
  const dayCheckouts = useMemo(() => {
    if (!selectedDate) return [];
    return scopedBookings
      .filter((b) => b.status !== "Cancelled" && b.status !== "Tidak datang" && b.checkOut === selectedDate && dalamUnitDipilih(unitBooking(b)))
      .map((b) => ({ booking: b, roomName: roomById.get(b.roomId)?.name ?? "" }))
      .sort((a, b) => a.roomName.localeCompare(b.roomName, "id", { numeric: true }));
  }, [selectedDate, scopedBookings, dalamUnitDipilih, unitBooking, roomById]);

  /* A room under renovation is not "kosong" — it cannot be sold — so it is
     named separately instead of padding the free list. */
  const dayRooms = useMemo(() => {
    if (!selectedDate) return { free: [], renovating: [], total: 0, perUnit: [] };
    const taken = new Set(occupiedOn.map((b) => b.roomId));
    const kamarUnit = scopedRooms.filter((r) => dalamUnitDipilih(r.prop) && (PROPERTIES.find((p) => p.key === r.prop)?.kamar ?? true));
    const urut = (a: string, b: string) => a.localeCompare(b, "id", { numeric: true });
    /* Di Semua unit, ketersediaan dipisah per unit: kamar Turtle dan Eddo
       tidak boleh terbaca sebagai satu daftar. */
    const perUnit = PROPERTIES.filter((p) => p.kamar)
      .map((p) => {
        const k = kamarUnit.filter((r) => r.prop === p.key && r.active);
        const kosong = k.filter((r) => !taken.has(r.id)).map((r) => r.name).sort(urut);
        return { nama: p.name, free: kosong, total: k.length };
      })
      .filter((u) => u.total > 0);
    return {
      free: kamarUnit.filter((r) => r.active && !taken.has(r.id)).map((r) => r.name).sort(urut),
      renovating: kamarUnit.filter((r) => !r.active).map((r) => r.name).sort(urut),
      total: kamarUnit.filter((r) => r.active).length,
      perUnit,
    };
  }, [selectedDate, occupiedOn, scopedRooms, dalamUnitDipilih]);

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

  /* Layar ini soal kamar dan okupansinya, jadi dive centre tidak muncul:
     kartunya akan berisi nol kamar, nol malam, dan okupansi nol persen —
     tiga angka yang semuanya benar dan semuanya salah artinya. */
  const propertyCards: PropertyCard[] = PROPERTIES_BERKAMAR.filter((p) =>
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
        ical: sambungan.some((f) => f.roomId === r.id)
          ? `${sambungan.filter((f) => f.roomId === r.id).length} situs`
          : "Belum diatur",
        status: r.active ? "Aktif" : "Renovasi",
        active: r.active,
        /* Bookings not yet finished — what a switch to renovation would
           strand. Counted from the whole book, not the filtered view. */
        upcoming: scopedBookings.filter(
          (b) =>
            b.roomId === r.id && b.status !== "Cancelled" && b.checkOut > today,
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
    () =>
      freeRooms(bookings, rooms, form.property, form.checkIn, form.checkOut),
    [bookings, rooms, form.property, form.checkIn, form.checkOut],
  );

  // ---------------------------------------------------------------- render

  return (
    <PenyediaJemput bolehUbah={layar.includes("kalender") && akun.peran !== "keuangan"} aktif={layar.includes("kalender")}>
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
      <RangkaPanel
        nav={navGrup}
        screen={screen}
        unit={filterProp}
        onScreen={bukaMenu}
        nama={userName}
        email={loginEmail}
        peran={LABEL_PERAN[akun.peran]}
        hariIni={hariIniKalimat}
        tamuHariIni={tamuHariIni}
        onBukaTamu={(id) => {
          /* Rinciannya ada di kalender: berpindah ke sana lalu membuka booking itu. */
          setScreen("kalender");
          setSelectedId(id);
        }}
        kabar={kabarMenunggu}
        query={query}
        onQuery={setQuery}
        onLogout={doLogout}
      >
        <div className={`flex gap-6 ${nw ? "flex-col" : "flex-row items-stretch"}`}>
          <div className="w-full min-w-0 flex-1">
                {screen !== "pengaturan" && <PitaGalat jumlah={galat.data?.peringatan.length ?? 0} onLihat={() => setScreen("pengaturan")} />}
                {/* Di atas isi tiap layar, bukan hanya kalender: okupansi di
                    Laporan dan tarif di Properti dibangkitkan dari sumber yang
                    sama, jadi peringatan yang cuma muncul di satu layar akan
                    membuat dua layar lain terbaca sebagai kenyataan.

                    Kecuali satu. "Sistem lama" tidak mengambil dari sumber itu
                    sama sekali — isinya dibaca langsung dari sistem client dan
                    justru sungguhan. Di sana catatan ini tepat terbalik:
                    kalimat "tidak satu pun berasal dari booking sungguhan"
                    berdiri di atas daftar yang seluruhnya booking sungguhan,
                    yang persis jenis kesalahan yang catatan ini ada untuk
                    mencegahnya. Layar itu membawa keterangannya sendiri. */}
                {screen === "kalender" && (
                  <KalenderHero
                    nama={filterProp === "all" ? "Semua unit" : (PROPERTIES.find((p) => p.key === filterProp)?.name ?? "")}
                    lokasi={filterProp === "all" ? undefined : PROPERTIES.find((p) => p.key === filterProp)?.location}
                    jumlahKamar={heroData.kamar}
                    malamIni={heroData.kamar ? { terisi: heroData.terisi, dari: heroData.kamar } : null}
                    kedatangan7={heroData.kedatangan}
                    okupansiBulan={heroData.kamar ? stats.occPct : null}
                    bulanLabel={MONTHS[month.getMonth()]}
                    hanyaJadwal={filterProp === "divecenter"}
                  />
                )}

                {filterProp !== "all" &&
                  (["laporan", "properti", "sinkron", "lama", "website"] as Screen[]).includes(screen) && (
                    <div className="mb-4">
                      <p className="text-[11px] font-bold tracking-[0.16em] text-panel-aksen uppercase">Unit</p>
                      <p className="text-[1.5rem] leading-tight font-bold text-panel-utama">
                        {PROPERTIES.find((p) => p.key === filterProp)?.name}
                      </p>
                    </div>
                  )}

                {screen !== "lama" && screen !== "statistik" && screen !== "pengaturan" && screen !== "keuangan" && screen !== "sdm" && screen !== "gudang" && (
                  <DataSourceNote sumber={sumber} lamaTersambung={lamaAktif} />
                )}

                {/* Kalendernya utuh di sini, bukan sebaris ringkasan: yang
                    bernama Kalender adalah layar ini, dan kalender kosong di
                    layar bernama Kalender tidak terbantu oleh kalender lain di
                    tempat lain. Kenapa tidak dilebur ke kisi di bawahnya ada
                    di `sistem-lama-panel.tsx`. */}
                {screen === "kalender" &&
                  (isOwner || allowedProps.includes("turtle")) &&
                  /* Sistem lamanya milik Turtle. Waktu filternya disetel ke
                     Eddo, menampilkan kalender Turtle di sana bukan sekadar
                     tidak relevan — ia menjawab pertanyaan yang tidak
                     ditanyakan, dengan kamar yang bukan kamar Eddo. */
                  (filterProp === "all" || filterProp === "turtle") && (
                    <SistemLamaPanel onBuka={() => setScreen("lama")} />
                  )}

                {screen === "ringkasan" && (
                  <RingkasanScreen
                    nama={userName}
                    peran={LABEL_PERAN[akun.peran]}
                    bookings={scopedBookings}
                    rooms={scopedRooms}
                    today={today}
                    showMoney={showMoney}
                    pintasan={pintasan}
                    adaKalender={layar.includes("kalender")}
                    bentrok={conflicts.length}
                    stok={stokPerhatian}
                    onBukaGudang={() => {
                      /* Satu unit yang bermasalah: langsung ke unit itu. Beberapa: semua unit bila akunnya boleh, selain itu unitnya sendiri. */
                      const u = stokPerhatian?.unit.map((x) => (x === "divecenter" ? "turtle" : x)) ?? [];
                      const unik = [...new Set(u)];
                      setFilterProp(unik.length === 1 ? (unik[0] as PropFilter) : isOwner ? "all" : ((allowedProps.find((x) => x !== "divecenter") ?? "all") as PropFilter));
                      setScreen("gudang");
                      setSelectedId(null);
                    }}
                    onBukaBentrok={() => {
                      /* Peninjauannya di Kalender: berpindah ke sana lalu membuka daftar bentrok. */
                      setScreen("kalender");
                      setConflictOpen(true);
                    }}
                    onBukaBooking={(id) => {
                      setScreen("kalender");
                      setSelectedId(id);
                    }}
                  />
                )}

                {screen === "kalender" && filterProp !== "divecenter" && (
                  <FilterKalender
                    propCounts={[]}
                    filterProp={filterProp}
                    onFilterProp={setFilterProp}
                    channelCounts={channelCounts}
                    filterCh={filterCh}
                    onFilterCh={setFilterCh}
                  />
                )}

                {screen === "kalender" && (
                  <CalendarScreen
                    /* Eddo tidak punya dive centre sendiri, jadi jadwalnya
                       tidak ikut ke sana. Selain itu ia ikut — dan waktu
                       dive centre yang dipilih, ia satu-satunya yang ada. */
                    sesiPerTanggal={
                      filterProp === "divecenter" ? sesiPerTanggal : undefined
                    }
                    narrow={nw}
                    compact={phone}
                    showMoney={showMoney}
                    conflictCount={bannerPairs.length}
                    selesaiCount={bentrokSelesai.length}
                    conflictTone={conflictTone}
                    conflictText={conflictText}
                    onReviewConflict={() => setConflictOpen(true)}
                    monthLabel={monthLabel}
                    onPrevMonth={() => setMonth(new Date(y, m - 1, 1))}
                    onNextMonth={() => setMonth(new Date(y, m + 1, 1))}
                    occLabel={`${stats.occPct}%`}
                    nightsLabel={`${stats.nights} malam`}
                    /* Nol rupiah dari malam yang semuanya belum berharga
                       terlihat persis seperti nol rupiah karena tidak ada yang
                       terjual. Dua pernyataan yang sangat berbeda. Dihitung
                       sekali di `tanpaHarga` supaya kalimat dan cara
                       menggambarnya tidak bisa berselisih: pernah terjadi
                       kalimatnya benar tapi tetap digambar setebal nominal. */
                    revenueLabel={
                      tanpaHarga ? "belum ada harga" : fmt(stats.revenue)
                    }
                    newLabel={
                      ringkas.bookingBaru === null
                        ? "belum dicatat"
                        : `${ringkas.bookingBaru} booking`
                    }
                    receivableLabel={
                      ringkas.piutang !== null
                        ? fmt(ringkas.piutang)
                        : ringkas.piutangSebab === "tanpa-harga"
                          ? "belum ada harga untuk dihitung"
                          : "belum ada pembayaran yang dicatat"
                    }
                    checkinLabel={`${upcoming.length} tamu`}
                    belumDicatat={{
                      pendapatan: tanpaHarga,
                      baru: ringkas.bookingBaru === null,
                      piutang: ringkas.piutang === null,
                    }}
                    hanyaJadwal={filterProp === "divecenter"}
                    selamBulanIni={selamBulanIni}
                    lamaTersambung={jadwalLamaAktif}
                    cells={cells}
                    onSelect={setSelectedId}
                    selectedDate={selectedDate}
                    onSelectDate={pickDate}
                  />
                )}

                {screen === "laporan" && layar.includes("laporan") && (
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
                    cards={propertyCards.filter((c) => filterProp === "all" || c.key === filterProp)}
                    showMoney={showMoney}
                    canEdit={ubahKamar(akun.peran)}
                    onSaveRoom={saveRoom}
                    onDeleteRoom={deleteRoom}
                  />
                )}

                {screen === "sinkron" && layar.includes("sinkron") && (
                  <SyncScreen
                    rooms={scopedRooms.filter((r) => filterProp === "all" || r.prop === filterProp)}
                    sambungan={sambungan}
                    origin={origin}
                    onAdd={tambahSambungan}
                    onRemove={hapusSambungan}
                    onUbahUrl={ubahUrlSambungan}
                    onTokenBaru={tokenBaruSambungan}
                    onKamarLain={kamarLainSambungan}
                    onImporBerubah={async (pesan) => {
                      await muatBuku();
                      flash(pesan);
                    }}
                    onJalankan={jalankanSinkron}
                    sedangJalan={sedangJalan}
                    turtleDariLama={lamaAktif}
                  />
                )}

                {screen === "lama" && layar.includes("lama") && <SistemLamaScreen />}

                {screen === "website" && layar.includes("website") && (
                  <WebsiteScreen
                    editor={userName}
                    situs={
                      filterProp === "eddo"
                        ? "eddo"
                        : filterProp === "turtle" || filterProp === "divecenter"
                          ? "turtle"
                          : undefined
                    }
                  />
                )}

                {screen === "statistik" && layar.includes("statistik") && (
                  <StatistikScreen
                    situs={filterProp === "eddo" ? "eddo" : filterProp === "turtle" || filterProp === "divecenter" ? "turtle" : "all"}
                    bolehPilih={isOwner || akun.peran === "pr"}
                    onPilih={(s) => setFilterProp(s)}
                  />
                )}

                {screen === "keuangan" && layar.includes("keuangan") && (
                  <KeuanganScreen filter={filterProp} pendapatan={pendapatanBooking} hariIni={today} />
                )}

                {screen === "sdm" && layar.includes("sdm") && <SdmScreen filter={filterProp} hariIni={today} />}

                {screen === "gudang" && layar.includes("gudang") && (
                  <GudangScreen filter={filterProp} hariIni={today} kamarMalam30={kamarMalam30} />
                )}

                {screen === "pengaturan" && layar.includes("pengaturan") && (
                  <PengaturanScreen galat={galat.data} muatGalat={galat.muat} />
                )}

                {screen === "pengguna" && layar.includes("pengguna") && (
                  <UsersScreen
                    compact={phone}
                    users={users}
                    onOpenInvite={() => setInviteOpen(true)}
                    onToggleUser={toggleUser}
                    bolehAtur={aksesPenuh(akun.peran)}
                    emailSaya={akun.email}
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
                  dayCheckouts={dayCheckouts}
                  onClearDate={() => setSelectedDate(null)}
                  selamHari={selamHari}
                  selamMendatang={selamMendatang}
                  /* Aturan yang sama dengan kisi: Eddo tidak punya dive centre
                     sendiri, jadi blok ini tidak ikut ke sana. */
                  adaSelam={filterProp !== "eddo"}
                  tanpaKedatangan={filterProp !== "divecenter"}
                  atas={
                    filterProp === "divecenter" ? undefined : (
                      <PanelPesanan
                        bolehCatat={layar.includes("kalender") && akun.peran !== "keuangan"}
                        onTambah={openForm}
                        onTambahBanyak={() => setMassal({ awal: [], sumber: "" })}
                        onBacaTeks={bacaTeks}
                        onBacaGambar={bacaGambar}
                        sumberPesan={SUMBER_PESAN}
                        today={today}
                        daftar={daftarPanel}
                        onTandai={(id, status) =>
                          patchBooking(id, { status }, status === "Checked-in" ? "Tamu ditandai sudah datang." : "Tamu ditandai sudah pulang.")
                        }
                        onBuka={setSelectedId}
                      />
                    )
                  }
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
      </RangkaPanel>

      {conflictOpen && (bannerPairs.length > 0 || bentrokSelesai.length > 0) && (
        <ConflictModal
          pairs={bannerPairs}
          selesai={bentrokSelesai}
          bolehSelesaikan={layar.includes("kalender") && akun.peran !== "keuangan"}
          onSelesaikan={selesaikanBentrok}
          onBukaLagi={(p) => void bukaLagiBentrok(p)}
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

      {massal && (
        <PesananMassalModal
          awal={massal.awal}
          sumber={massal.sumber}
          kamar={kamarPesan}
          bentrok={(room, masuk, keluar) => hasClash(bookings2, room, masuk, keluar)}
          onSimpan={simpanBanyak}
          onClose={() => setMassal(null)}
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

      {toast && (
        <div
          role="status"
          className="fixed bottom-7 left-1/2 z-[60] -translate-x-1/2 animate-pop-in rounded-xl bg-ink px-5 py-3 text-[13.5px] text-white"
        >
          {toast}
        </div>
      )}
    </PenyediaJemput>
  );
}
