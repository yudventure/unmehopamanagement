"use client";

import type { CalendarCell } from "@/lib/derive";
import { WEEKDAYS } from "@/lib/format";

export interface CalendarScreenProps {
  narrow: boolean;
  showMoney: boolean;
  conflictCount: number;
  /** Ready-made sentence naming the room and the nights sold twice. */
  conflictText: string;
  onReviewConflict: () => void;
  monthLabel: string;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  occLabel: string;
  nightsLabel: string;
  revenueLabel: string;
  cells: CalendarCell[];
  onSelect: (id: string) => void;
  selectedDate: string | null;
  onSelectDate: (date: string) => void;
}

const ARROW_BUTTON =
  "h-[34px] w-[34px] cursor-pointer rounded-[11px] border border-line-strong bg-surface text-[15px] text-slate hover:bg-surface-hover";

function cellBackground(cell: CalendarCell) {
  if (!cell.inMonth) return "#FEFCF9";
  if (cell.conflictHere) return "#FDF6F3";
  if (cell.isToday) return "#F0F8F3";
  return "#FFFFFF";
}

export function CalendarScreen({
  narrow,
  showMoney,
  conflictCount,
  conflictText,
  onReviewConflict,
  monthLabel,
  onPrevMonth,
  onNextMonth,
  occLabel,
  nightsLabel,
  revenueLabel,
  cells,
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
            {conflictText}
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
          <div className="min-w-[190px] text-[22px] font-bold">
            {monthLabel}
          </div>
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
            <div className="text-[11.5px] text-slate-soft">
              Okupansi bulan ini
            </div>
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
        <div className="grid" style={gridCols}>
          {cells.map((cell, ci) => (
            <div
              key={ci}
              className="relative min-h-[126px] border-r border-b border-line-fine px-[11px] py-[10px]"
              style={{
                background: cellBackground(cell),
                opacity: cell.inMonth ? 1 : 0.5,
                /* Outline rather than a border: it paints inside the cell
                       and adds no width, so picking a day cannot nudge the
                       grid sideways. */
                outline:
                  selectedDate === cell.dateStr
                    ? "2px solid var(--color-teal)"
                    : undefined,
                outlineOffset: -2,
              }}
            >
              {/* The whole header strip opens the day list — the date, the
                  counter, and the empty space between them. Below it the chips
                  are their own targets, so this band is where a click can mean
                  "the day" rather than "this booking". */}
              <button
                type="button"
                onClick={() => onSelectDate(cell.dateStr)}
                aria-pressed={selectedDate === cell.dateStr}
                aria-label={`Lihat booking pada ${cell.dateStr}`}
                title="Lihat semua booking pada tanggal ini"
                className="flex w-full cursor-pointer items-center justify-between rounded-[9px] border-none bg-transparent px-[3px] py-[2px] text-left hover:bg-surface-hover"
              >
                <span
                  className={
                    cell.isToday
                      ? "flex h-[26px] w-[26px] items-center justify-center rounded-full bg-teal text-[12.5px] font-bold text-white"
                      : "flex h-[26px] min-w-[26px] items-center justify-center text-[13px] font-medium text-ink-soft"
                  }
                >
                  {cell.label}
                </span>
                {cell.inMonth && cell.capacity > 0 && (
                  <span
                    className="font-mono text-[10.5px]"
                    style={{
                      color:
                        cell.occupied >= cell.capacity ? "#B04A3A" : "#9D9486",
                    }}
                  >
                    {cell.occupied}/{cell.capacity}
                  </span>
                )}
              </button>
              <div className="mt-[7px] flex flex-col gap-1">
                {cell.chips.map((chip) => (
                  <button
                    key={chip.booking.id}
                    type="button"
                    onClick={() => onSelect(chip.booking.id)}
                    title={`${chip.booking.guest} · ${chip.booking.checkIn} → ${chip.booking.checkOut}`}
                    className="flex w-full min-w-0 cursor-pointer flex-col gap-[1px] overflow-hidden rounded-[7px] border-none px-[7px] py-[4px] text-left"
                    style={{ background: chip.bg, color: chip.fg }}
                  >
                    <span className="flex w-full min-w-0 items-center gap-[5px]">
                      <span
                        className="h-3 w-[3px] shrink-0 rounded-[2px]"
                        style={{ background: chip.dot }}
                      />
                      <span className="min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-[11.5px] font-medium">
                        {chip.label}
                      </span>
                      {chip.nightLabel && (
                        <span
                          className="shrink-0 font-mono text-[9.5px] opacity-70"
                          title={`Malam ke-${chip.nightLabel.split("/")[0]} dari ${chip.nightLabel.split("/")[1]}`}
                        >
                          {chip.nightLabel}
                        </span>
                      )}
                    </span>
                    <span className="min-w-0 overflow-hidden pl-[8px] text-[9.5px] text-ellipsis whitespace-nowrap opacity-75">
                      {chip.room}
                    </span>
                  </button>
                ))}
                {cell.hiddenCount > 0 && (
                  <button
                    type="button"
                    onClick={() => onSelectDate(cell.dateStr)}
                    title="Lihat semua booking pada tanggal ini"
                    className="cursor-pointer self-start rounded-[6px] border-none bg-transparent px-[3px] py-[1px] text-[11px] text-slate-mute underline decoration-dotted underline-offset-2 hover:bg-surface-hover hover:text-teal"
                  >
                    +{cell.hiddenCount} lagi
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
