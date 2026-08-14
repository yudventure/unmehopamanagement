"use client";

import { useState } from "react";

import type { DayOccupancy, MonthPoint } from "@/lib/derive";
import { MONTHS, WEEKDAYS, fmt, fmtDate } from "@/lib/format";

/**
 * Occupancy, drawn twice: across the months so a season is visible, and across
 * the days of one month so its shape is.
 *
 * Both are single-measure column charts in the brand teal — one hue, magnitude
 * carried by height alone. The second, lighter step never means a different
 * thing; it means the same measure in a period that has not finished, so the
 * bar is not yet the whole story. That distinction is the only reason there is
 * a legend at all.
 *
 * Every value is reachable three ways: the axis, the readout that follows the
 * pointer, and a table view — so nothing is gated behind a hover.
 */

const PLOT_H = 156;
const AXIS = [0, 25, 50, 75, 100];

const TEAL = "#0E7C6B";
/** Same hue, one step light. 3.4:1 on white — still a legible mark. */
const TEAL_OPEN = "#3E9A8B";

function Gridlines() {
  return (
    <>
      {AXIS.map((g) => (
        <div
          key={g}
          className="pointer-events-none absolute inset-x-0 border-t border-line-strong"
          style={{ bottom: `${g}%` }}
        />
      ))}
    </>
  );
}

/**
 * The plot box, with its scale parked in the caller's left gutter rather than
 * inside the box. Sitting inside, the ticks are drawn under the first column —
 * invisible at any width narrow enough for that column to reach them.
 *
 * The top padding is room for the 100% tick and for a value label riding a
 * full-height bar; both are placed from the baseline and would otherwise sit
 * half outside the box.
 */
function Plot({ children }: { children: React.ReactNode }) {
  return (
    <div className="pt-[9px]">
      <div className="relative" style={{ height: PLOT_H }}>
        <div className="pointer-events-none absolute inset-y-0 left-[-38px] w-[30px]">
          {AXIS.map((g) => (
            <span
              key={g}
              className="absolute right-0 translate-y-[-50%] font-mono text-[9.5px] text-slate-mute tabular-nums"
              style={{ bottom: `${g}%` }}
            >
              {g}%
            </span>
          ))}
        </div>
        {children}
      </div>
    </div>
  );
}

function CardHead({
  title,
  readout,
  showTable,
  onToggleTable,
}: {
  title: string;
  readout: React.ReactNode;
  showTable: boolean;
  onToggleTable: () => void;
}) {
  return (
    <div className="mb-[14px] flex flex-wrap items-start gap-3">
      <div className="min-w-0 flex-1">
        <div className="text-[14px] font-bold">{title}</div>
        <div className="mt-[3px] min-h-[17px] text-[12.5px] text-slate-soft">
          {readout}
        </div>
      </div>
      <button
        type="button"
        onClick={onToggleTable}
        aria-pressed={showTable}
        className={`shrink-0 cursor-pointer rounded-[9px] border px-[11px] py-[5px] text-[12px] ${
          showTable
            ? "border-teal bg-teal-tint font-medium text-teal-deep"
            : "border-line-strong bg-surface text-slate hover:bg-surface-hover"
        }`}
      >
        Tabel
      </button>
    </div>
  );
}

/** A null colour draws the swatch as an outlined tint — for band, not mark. */
function Legend({
  items,
}: {
  items: { color: string | null; label: string }[];
}) {
  return (
    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-[6px]">
      {items.map((i) => (
        <span key={i.label} className="flex items-center gap-[7px]">
          <span
            className={`h-[9px] w-[9px] rounded-[2px] ${
              i.color ? "" : "border border-line-strong bg-surface-mute"
            }`}
            style={i.color ? { background: i.color } : undefined}
          />
          <span className="text-[12px] text-slate-soft">{i.label}</span>
        </span>
      ))}
    </div>
  );
}

function DataTable({
  head,
  rows,
}: {
  head: string[];
  rows: (string | number)[][];
}) {
  return (
    <div className="max-h-[340px] overflow-auto">
      <table className="w-full border-collapse text-[12.5px]">
        <thead>
          <tr>
            {head.map((h, i) => (
              <th
                key={h}
                className={`sticky top-0 border-b border-line-strong bg-surface py-[6px] font-mono text-[10px] font-normal tracking-[.06em] text-slate-mute uppercase ${
                  i === 0 ? "text-left" : "text-right"
                }`}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={String(r[0])}>
              {r.map((cell, i) => (
                <td
                  key={i}
                  className={`border-b border-line-row py-[6px] ${
                    i === 0
                      ? "text-left"
                      : "text-right font-mono text-[11.5px] tabular-nums"
                  }`}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ------------------------------------------------------------- monthly trend

export function TrendChart({
  points,
  anchorKey,
  compareKey,
  showMoney,
}: {
  points: MonthPoint[];
  /** The month the rest of the report is about. */
  anchorKey: string;
  /** Highlighted alongside it while the comparison is on. */
  compareKey: string | null;
  showMoney: boolean;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const [table, setTable] = useState(false);

  const settled = points.filter((p) => p.settled);
  const busiest = settled.reduce<MonthPoint | null>(
    (best, p) => (!best || p.pct > best.pct ? p : best),
    null,
  );
  const quietest = settled.reduce<MonthPoint | null>(
    (worst, p) => (!worst || p.pct < worst.pct ? p : worst),
    null,
  );

  const hovered = hover === null ? null : points[hover];
  const readout = hovered ? (
    <>
      <strong className="font-medium text-ink">
        {MONTHS[hovered.monthIndex]} {hovered.year}
      </strong>{" "}
      · {hovered.pct}% · {hovered.nights} dari {hovered.capacity} malam
      {showMoney && <> · {fmt(hovered.revenue)}</>}
      {!hovered.settled && !hovered.current && " · belum lewat"}
    </>
  ) : busiest && quietest ? (
    <>
      Bulan tersibuk {MONTHS[busiest.monthIndex]} {busiest.year} ({busiest.pct}
      %), paling sepi {MONTHS[quietest.monthIndex]} {quietest.year} (
      {quietest.pct}%).
    </>
  ) : (
    "Belum ada bulan yang selesai di rentang ini."
  );

  return (
    <div className="rounded-[18px] border border-line-soft bg-surface px-5 py-[18px]">
      <CardHead
        title="Tren okupansi per bulan"
        readout={readout}
        showTable={table}
        onToggleTable={() => setTable((v) => !v)}
      />

      {table ? (
        <DataTable
          head={["Bulan", "Malam", "Kapasitas", "Okupansi", ...(showMoney ? ["Pendapatan"] : [])]}
          rows={points.map((p) => [
            `${MONTHS[p.monthIndex]} ${p.year}`,
            p.nights,
            p.capacity,
            `${p.pct}%`,
            ...(showMoney ? [fmt(p.revenue)] : []),
          ])}
        />
      ) : (
        <>
          <div className="relative pl-[38px]">
            <Plot>
              <Gridlines />
              <div className="absolute inset-0 flex items-end gap-[2px]">
                {points.map((p, i) => {
                  const open = !p.settled && !p.current;
                  const marked =
                    p.key === anchorKey ||
                    p.key === compareKey ||
                    p.key === busiest?.key ||
                    p.key === quietest?.key;
                  return (
                    <button
                      key={p.key}
                      type="button"
                      onMouseEnter={() => setHover(i)}
                      onMouseLeave={() => setHover(null)}
                      onFocus={() => setHover(i)}
                      onBlur={() => setHover(null)}
                      aria-label={`${MONTHS[p.monthIndex]} ${p.year}: ${p.pct} persen, ${p.nights} dari ${p.capacity} malam`}
                      className={`relative flex h-full flex-1 cursor-pointer flex-col justify-end border-none px-0 ${
                        hover === i ? "bg-surface-tint" : "bg-transparent"
                      }`}
                    >
                      {marked && (
                        <span className="absolute inset-x-0 font-mono text-[10px] text-ink tabular-nums"
                          style={{ bottom: `calc(${p.pct}% + 4px)` }}
                        >
                          {p.pct}
                        </span>
                      )}
                      <span
                        className="mx-auto block w-full max-w-[26px] rounded-t-[4px]"
                        style={{
                          height: `${Math.max(p.pct, 0.8)}%`,
                          background: open ? TEAL_OPEN : TEAL,
                          /* The reported month is ringed in its own hue; the
                             month it is being measured against gets a neutral
                             ring, so the pair reads without a third colour. */
                          outline:
                            p.key === anchorKey
                              ? `2px solid ${TEAL}`
                              : p.key === compareKey
                                ? "2px solid #9BABA5"
                                : undefined,
                          outlineOffset:
                            p.key === anchorKey || p.key === compareKey
                              ? "2px"
                              : undefined,
                        }}
                      />
                    </button>
                  );
                })}
              </div>
            </Plot>

            <div className="mt-[7px] flex gap-[2px]">
              {points.map((p) => (
                <span
                  key={p.key}
                  className={`flex-1 text-center text-[11px] leading-[1.3] ${
                    p.key === anchorKey
                      ? "font-bold text-ink"
                      : "text-slate-soft"
                  }`}
                >
                  {MONTHS[p.monthIndex].slice(0, 3)}
                  <span className="block font-mono text-[9.5px] text-slate-faint">
                    &apos;{String(p.year).slice(2)}
                  </span>
                </span>
              ))}
            </div>
          </div>

          <Legend
            items={[
              { color: TEAL, label: "Bulan yang sudah selesai" },
              {
                color: TEAL_OPEN,
                label: "Belum lewat — baru sebagian yang terisi",
              },
            ]}
          />
        </>
      )}
    </div>
  );
}

// ------------------------------------------------------------ daily occupancy

export function DailyChart({
  days,
  monthLabel,
}: {
  days: DayOccupancy[];
  monthLabel: string;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const [table, setTable] = useState(false);

  const avg = days.length
    ? Math.round(days.reduce((t, d) => t + d.pct, 0) / days.length)
    : 0;
  const peak = days.reduce<DayOccupancy | null>(
    (best, d) => (!best || d.pct > best.pct ? d : best),
    null,
  );
  const trough = days.reduce<DayOccupancy | null>(
    (worst, d) => (!worst || d.pct < worst.pct ? d : worst),
    null,
  );

  const hovered = hover === null ? null : days[hover];
  const readout = hovered ? (
    <>
      <strong className="font-medium text-ink">
        {WEEKDAYS[hovered.dow]}, {fmtDate(hovered.date)}
      </strong>{" "}
      · {hovered.occupied} dari {hovered.capacity} kamar · {hovered.pct}%
      {hovered.isToday && " · hari ini"}
    </>
  ) : peak && trough ? (
    <>
      Rata-rata {avg}%. Paling ramai tanggal {peak.day} ({peak.pct}%), paling
      lengang tanggal {trough.day} ({trough.pct}%).
    </>
  ) : (
    "Tidak ada kamar aktif di cakupan ini."
  );

  return (
    <div className="rounded-[18px] border border-line-soft bg-surface px-5 py-[18px]">
      <CardHead
        title={`Okupansi harian ${monthLabel}`}
        readout={readout}
        showTable={table}
        onToggleTable={() => setTable((v) => !v)}
      />

      {table ? (
        <DataTable
          head={["Tanggal", "Terisi", "Kamar aktif", "Okupansi"]}
          rows={days.map((d) => [
            `${WEEKDAYS[d.dow]}, ${fmtDate(d.date)}`,
            d.occupied,
            d.capacity,
            `${d.pct}%`,
          ])}
        />
      ) : (
        <>
          <div className="relative pl-[38px]">
            <Plot>
              <Gridlines />

              <div className="absolute inset-0 flex items-end gap-[2px]">
                {days.map((d, i) => (
                  <button
                    key={d.date}
                    type="button"
                    onMouseEnter={() => setHover(i)}
                    onMouseLeave={() => setHover(null)}
                    onFocus={() => setHover(i)}
                    onBlur={() => setHover(null)}
                    aria-label={`${fmtDate(d.date)}: ${d.occupied} dari ${d.capacity} kamar, ${d.pct} persen`}
                    className={`relative flex h-full flex-1 cursor-pointer flex-col justify-end border-none px-0 ${
                      hover === i
                        ? "bg-surface-tint"
                        : d.isWeekend
                          ? "bg-surface-mute"
                          : "bg-transparent"
                    }`}
                  >
                    <span
                      className="mx-auto block w-full max-w-[16px] rounded-t-[3px]"
                      style={{
                        height: `${Math.max(d.pct, 0.8)}%`,
                        background: d.past || d.isToday ? TEAL : TEAL_OPEN,
                        outline: d.isToday ? `2px solid ${TEAL}` : undefined,
                        outlineOffset: d.isToday ? "2px" : undefined,
                      }}
                    />
                  </button>
                ))}
              </div>

              {/* Drawn last so it reads over the columns it is measuring, and
                  solid rather than dashed — a dashed rule reads as a forecast
                  when all it marks is the month's own average. */}
              <div
                className="pointer-events-none absolute inset-x-0 border-t border-slate-ghost"
                style={{ bottom: `${avg}%` }}
              >
                <span className="absolute right-0 -translate-y-full bg-surface px-[3px] pb-[1px] font-mono text-[9.5px] text-slate-mute">
                  rata-rata {avg}%
                </span>
              </div>
            </Plot>

            <div className="mt-[7px] flex gap-[2px]">
              {days.map((d) => (
                <span
                  key={d.date}
                  className={`flex-1 text-center font-mono text-[9.5px] tabular-nums ${
                    d.isToday
                      ? "font-bold text-teal-deep"
                      : d.isWeekend
                        ? "text-slate-mute"
                        : "text-slate-faint"
                  }`}
                >
                  {d.day === 1 || d.day % 5 === 0 || d.isToday ? d.day : ""}
                </span>
              ))}
            </div>
          </div>

          <Legend
            items={[
              { color: TEAL, label: "Sudah lewat" },
              { color: TEAL_OPEN, label: "Belum lewat — masih bisa bertambah" },
              { color: null, label: "Sabtu & Minggu" },
            ]}
          />
        </>
      )}
    </div>
  );
}
