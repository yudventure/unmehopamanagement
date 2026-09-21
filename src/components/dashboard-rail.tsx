"use client";

import { Pill } from "@/components/ui/pill";
import { CH, CHANNEL_LABELS } from "@/lib/data";
import { WARNA_AKTIVITAS } from "@/lib/dari-sistem-lama";
import { fmtDate, fmtShort } from "@/lib/format";
import type { RingkasSelam, SesiLama } from "@/lib/sistem-lama-bentuk";
import { ringkasSelam } from "@/lib/sistem-lama-bentuk";
import type { Booking } from "@/lib/types";

export interface DayEntry {
  booking: Booking;
  roomName: string;
  /** Nights from today until check-in. Only set on the arrivals list. */
  leadDays?: number;
}

/**
 * Satu blok jadwal selam, dipisahkan dari bagian kamar dengan garis yang
 * sengaja tidak sama.
 *
 * Pemisah di rail ini semuanya garis rambut krem — "Kamar kosong" memakai yang
 * itu. Kalau selam ikut memakainya juga, keduanya terbaca sebagai dua bagian
 * dari daftar yang sama, padahal satuannya berbeda: kamar dihitung per malam,
 * selam per sesi dan per orang. Garis putus-putus teal mengatakan "ini hal
 * lain" sebelum satu kata pun dibaca.
 */
function BlokSelam({
  judul,
  ringkas,
  sesi,
  kosong,
}: {
  judul: string;
  ringkas: RingkasSelam;
  sesi: SesiLama[];
  kosong: string;
}) {
  return (
    <div className="mt-5 border-t-2 border-dashed border-teal-line pt-4">
      <div className="mb-[9px] flex items-center gap-2">
        <h3 className="text-[13px] font-bold">{judul}</h3>
        <span className="rounded-full bg-teal-tint px-[7px] py-[1px] font-mono text-[10.5px] text-teal-deep">
          {ringkas.sesi}
        </span>
        {/* Yang ditanyakan orang yang menyiapkan perahu besok pagi bukan
            berapa sesi, melainkan berapa orang. Jadi angka itu yang dipasang
            paling kanan, tempat mata berhenti. */}
        <span className="ml-auto text-[11.5px] text-slate-mute">
          {ringkas.pax === null
            ? "jumlah tamu belum dicatat"
            : `${ringkas.pax} tamu terdaftar`}
        </span>
      </div>

      {ringkas.sesi === 0 ? (
        <div className="text-[13px] text-slate-mute">{kosong}</div>
      ) : (
        <div className="flex flex-col gap-[7px]">
          {sesi.map((s, i) => {
            const w = WARNA_AKTIVITAS[s.aktivitas];
            return (
              <div
                key={`${s.tanggal}-${s.aktivitas}-${i}`}
                className="flex items-center gap-[9px] rounded-[10px] px-[10px] py-[7px]"
                style={{ background: w.bg }}
              >
                <span
                  className="h-[8px] w-[8px] shrink-0 rounded-full"
                  style={{ background: w.dot }}
                />
                <span
                  className="min-w-0 flex-1 truncate text-[12.5px] font-medium"
                  style={{ color: w.fg }}
                  title={s.label}
                >
                  {s.label}
                </span>
                <span
                  className="shrink-0 font-mono text-[11.5px]"
                  style={{ color: w.fg }}
                >
                  {s.pax === null ? "— tamu" : `${s.pax} tamu`}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {ringkas.tanpaPax > 0 && (
        <div className="mt-[9px] text-[11.5px] leading-[1.45] text-slate-mute">
          {ringkas.tanpaPax} sesi belum mencatat jumlah tamunya, jadi tidak ikut
          terhitung.
        </div>
      )}
    </div>
  );
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
  /** Rooms free on the picked day, and any that cannot be sold at all. */
  dayRooms: { free: string[]; renovating: string[] };
  onClearDate: () => void;
  /** Sesi selam pada hari yang dipilih. Kosong berarti tidak ada. */
  selamHari?: SesiLama[];
  /** Sesi selam pada jendela check-in yang sama dengan daftar di atasnya. */
  selamMendatang?: SesiLama[];
  /** Eddo tidak punya dive centre sendiri, jadi blok ini tidak ikut ke sana. */
  adaSelam?: boolean;
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
  footer,
}: {
  title: string;
  hint?: string;
  count: number;
  card: boolean;
  empty: string;
  children: React.ReactNode;
  /**
   * Digambar di luar pilihan kosong-atau-isi.
   *
   * `children` diganti seluruhnya oleh kalimat "kosong" waktu hitungannya nol,
   * dan itu benar untuk daftarnya sendiri. Tapi blok selam bukan bagian dari
   * daftar itu — ia hal lain yang kebetulan tinggal di bawahnya, dan kalau
   * ikut terbuang, ia menghilang tepat pada hari yang tidak ada check-in:
   * hari yang justru paling sering ditanyakan "hari ini ada trip apa".
   */
  footer?: React.ReactNode;
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
      {footer}
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
  dayRooms,
  onClearDate,
  selamHari = [],
  selamMendatang = [],
  adaSelam = false,
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

      {/* Which rooms are free that night — the other half of the question,
          and what tells the staff what to make up. */}
      <div className="mt-5 border-t border-line-soft pt-4">
        <div className="mb-[9px] flex items-center gap-2">
          <h3 className="text-[13px] font-bold">Kamar kosong</h3>
          <span className="rounded-full bg-surface-tint px-[7px] py-[1px] font-mono text-[10.5px] text-slate-soft">
            {dayRooms.free.length}
          </span>
        </div>
        {dayRooms.free.length === 0 ? (
          <div className="text-[13px] text-slate-mute">
            Penuh — semua kamar terisi.
          </div>
        ) : (
          <div className="flex flex-wrap gap-[6px]">
            {dayRooms.free.map((name) => (
              <span
                key={name}
                className="rounded-[8px] border border-teal-line bg-teal-tint px-[9px] py-[4px] text-[12px] text-teal-deep"
              >
                {name}
              </span>
            ))}
          </div>
        )}
        {dayRooms.renovating.length > 0 && (
          <div className="mt-[9px] text-[11.5px] leading-[1.45] text-slate-mute">
            {dayRooms.renovating.join(", ")} sedang renovasi, jadi tidak
            dihitung sebagai kamar kosong.
          </div>
        )}
      </div>

      {adaSelam && (
        <BlokSelam
          judul="Selam & trip"
          ringkas={ringkasSelam(selamHari)}
          sesi={selamHari}
          kosong="Tidak ada sesi selam pada tanggal ini."
        />
      )}
    </section>
  ) : (
    <Section
      title="Check-in terdekat"
      hint={`${upcomingDays} hari ke depan`}
      count={upcoming.length}
      card={narrow}
      empty={`Tidak ada check-in dalam ${upcomingDays} hari ke depan.`}
      footer={
        adaSelam ? (
          <BlokSelam
            judul="Selam & trip"
            ringkas={ringkasSelam(selamMendatang)}
            sesi={selamMendatang}
            kosong={`Tidak ada sesi selam dalam ${upcomingDays} hari ke depan.`}
          />
        ) : undefined
      }
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
