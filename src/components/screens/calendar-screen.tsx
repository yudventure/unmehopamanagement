"use client";

import type { CalendarCell, CalendarWeek } from "@/lib/derive";
import { WEEKDAYS } from "@/lib/format";

export interface CalendarScreenProps {
  narrow: boolean;
  showMoney: boolean;
  conflictCount: number;
  conflictRoomName: string;
  onReviewConflict: () => void;
  monthLabel: string;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  occLabel: string;
  nightsLabel: string;
  revenueLabel: string;
  weeks: CalendarWeek[];
  /** Lanes drawn per week before the rest collapse into "+N lagi". */
  laneCap: number;
  onSelect: (id: string) => void;
  selectedDate: string | null;
  onSelectDate: (date: string) => void;
}

/* A booking bar sits in a lane below the date header; these three numbers are
   what keeps the overlay aligned with the cells underneath it. */
const HEADER_H = 34;
const LANE_H = 22;
const BAR_H = 19;

const ARROW_BUTTON =
  "h-[34px] w-[34px] cursor-pointer rounded-[11px] border border-line-strong bg-surface text-[15px] text-slate hover:bg-surface-hover";

function cellBackground(cell: CalendarCell) {
  if (!cell.inMonth) return "#FBFCFC";
  if (cell.conflictHere) return "#FFF7F6";
  if (cell.isToday) return "#F2FAF7";
  return "#FFFFFF";
}

export function CalendarScreen({
  narrow,
  showMoney,
  conflictCount,
  conflictRoomName,
  onReviewConflict,
  monthLabel,
  onPrevMonth,
  onNextMonth,
  occLabel,
  nightsLabel,
  revenueLabel,
  weeks,
  laneCap,
  onSelect,
  selectedDate,
  onSelectDate,
}: CalendarScreenProps) {
  const gridCols = {
    gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
    minWidth: narrow ? 700 : 0,
  };

  return (
    <div>
      {conflictCount > 0 && (
        <div className="mb-4 flex items-center gap-[14px] rounded-[14px] border border-danger-line bg-danger-tint px-4 py-[13px]">
          <span className="h-[9px] w-[9px] shrink-0 rounded-full bg-danger" />
          <div className="flex-1 text-[13.5px] text-danger-deep">
            {conflictCount} booking bertabrakan di {conflictRoomName} pada 20–22
            Agustus. Belum ada yang dihapus.
          </div>
          <button
            type="button"
            onClick={onReviewConflict}
            className="cursor-pointer rounded-[10px] border border-danger bg-transparent px-[14px] py-2 text-[12.5px] font-medium text-danger hover:bg-danger hover:text-white"
          >
            Tinjau
          </button>
        </div>
      )}

      <div className="mb-[18px] flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-[10px]">
          <button
            type="button"
            onClick={onPrevMonth}
            aria-label="Bulan sebelumnya"
            className={ARROW_BUTTON}
          >
            ‹
          </button>
          <div className="min-w-[190px] text-[22px] font-bold">{monthLabel}</div>
          <button
            type="button"
            onClick={onNextMonth}
            aria-label="Bulan berikutnya"
            className={ARROW_BUTTON}
          >
            ›
          </button>
        </div>
        <div className="ml-auto flex flex-wrap gap-[22px]">
          <div>
            <div className="text-[11.5px] text-slate-soft">Okupansi bulan ini</div>
            <div className="text-[19px] font-bold">{occLabel}</div>
          </div>
          <div>
            <div className="text-[11.5px] text-slate-soft">Malam terjual</div>
            <div className="text-[19px] font-bold">{nightsLabel}</div>
          </div>
          {showMoney && (
            <div>
              <div className="text-[11.5px] text-slate-soft">Pendapatan</div>
              <div className="text-[19px] font-bold">{revenueLabel}</div>
            </div>
          )}
        </div>
      </div>

      <div
        className={`rounded-[20px] border border-line-soft bg-surface ${
          narrow ? "overflow-x-auto overflow-y-hidden" : "overflow-hidden"
        }`}
      >
        <div className="grid bg-surface-tint" style={gridCols}>
          {WEEKDAYS.map((d) => (
            <div
              key={d}
              className="px-3 py-[11px] font-mono text-[11px] tracking-[.08em] text-slate-soft uppercase"
            >
              {d}
            </div>
          ))}
        </div>
        {weeks.map((week, wi) => {
          const shown = Math.min(week.lanes, laneCap);
          const rowHeight = Math.max(126, HEADER_H + shown * LANE_H + 22);
          return (
            <div key={wi} className="relative grid" style={gridCols}>
              {week.cells.map((cell, ci) => (
                <div
                  key={ci}
                  className="relative border-r border-b border-line-fine px-[11px] py-[10px]"
                  style={{
                    minHeight: rowHeight,
                    background: cellBackground(cell),
                    opacity: cell.inMonth ? 1 : 0.5,
                    /* Outline rather than a border: it paints inside the cell
                       without adding width, so picking a day cannot nudge the
                       grid the bars are positioned against. */
                    outline:
                      selectedDate === cell.dateStr
                        ? "2px solid var(--color-teal)"
                        : undefined,
                    outlineOffset: -2,
                  }}
                >
                  <div className="flex items-center justify-between">
                    {/* The date itself opens the day list. On a full day the
                        bars cover nearly the whole cell, so the cell at large
                        cannot be the target — this corner always is. */}
                    <button
                      type="button"
                      onClick={() => onSelectDate(cell.dateStr)}
                      aria-pressed={selectedDate === cell.dateStr}
                      aria-label={`Lihat booking pada ${cell.dateStr}`}
                      title="Lihat semua booking pada tanggal ini"
                      className={
                        cell.isToday
                          ? "flex h-[26px] w-[26px] cursor-pointer items-center justify-center rounded-full border-none bg-teal text-[12.5px] font-bold text-white hover:bg-teal-deep"
                          : "flex h-[26px] min-w-[26px] cursor-pointer items-center justify-center rounded-full border-none bg-transparent text-[13px] font-medium text-ink-soft hover:bg-surface-hover"
                      }
                    >
                      {cell.label}
                    </button>
                    {cell.inMonth && cell.capacity > 0 && (
                      <div
                        className="font-mono text-[10.5px]"
                        style={{
                          color:
                            cell.occupied >= cell.capacity
                              ? "#B42318"
                              : "#8B9C96",
                        }}
                      >
                        {cell.occupied}/{cell.capacity}
                      </div>
                    )}
                  </div>
                  {cell.hiddenCount > 0 && (
                    <button
                      type="button"
                      onClick={() => onSelectDate(cell.dateStr)}
                      title="Lihat semua booking pada tanggal ini"
                      className="absolute bottom-[6px] left-[11px] cursor-pointer rounded-[6px] border-none bg-transparent px-[3px] py-[1px] text-[11px] text-slate-mute underline decoration-dotted underline-offset-2 hover:bg-surface-hover hover:text-teal"
                    >
                      +{cell.hiddenCount} lagi
                    </button>
                  )}
                </div>
              ))}

              {/* Bars ride above the cells so one booking stays a single
                  element across the days it covers, instead of a chip repeated
                  per cell that the eye has to reassemble. */}
              <div className="pointer-events-none absolute inset-0">
                {week.spans
                  .filter((s) => s.lane < laneCap)
                  .map((s) => (
                    <button
                      key={s.booking.id}
                      type="button"
                      onClick={() => onSelect(s.booking.id)}
                      title={`${s.booking.guest} · ${s.booking.checkIn} → ${s.booking.checkOut}`}
                      className="pointer-events-auto absolute flex cursor-pointer items-center gap-[6px] overflow-hidden border-none px-[7px] text-left text-[11.5px]"
                      style={{
                        left: `calc(${(s.startCol / 7) * 100}% + 7px)`,
                        width: `calc(${(s.span / 7) * 100}% - 14px)`,
                        top: HEADER_H + s.lane * LANE_H,
                        height: BAR_H,
                        background: s.bg,
                        color: s.fg,
                        borderTopLeftRadius: s.continuesLeft ? 0 : 7,
                        borderBottomLeftRadius: s.continuesLeft ? 0 : 7,
                        borderTopRightRadius: s.continuesRight ? 0 : 7,
                        borderBottomRightRadius: s.continuesRight ? 0 : 7,
                      }}
                    >
                      {!s.continuesLeft && (
                        <span
                          className="h-3 w-[3px] shrink-0 rounded-[2px]"
                          style={{ background: s.dot }}
                        />
                      )}
                      <span className="min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap">
                        {s.label}
                      </span>
                    </button>
                  ))}
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}
