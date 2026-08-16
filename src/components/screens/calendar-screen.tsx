"use client";

import type { CalendarCell } from "@/lib/derive";
import { WEEKDAYS } from "@/lib/format";

export interface CalendarScreenProps {
  narrow: boolean;
  /**
   * Phone widths. A month of named chips needs about 700px, so below this the
   * grid stops carrying names and becomes a density map instead.
   */
  compact: boolean;
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
  "cursor-pointer rounded-[11px] border border-line-strong bg-surface text-slate hover:bg-surface-hover";

function cellBackground(cell: CalendarCell) {
  if (!cell.inMonth) return "#FEFCF9";
  if (cell.conflictHere) return "#FDF6F3";
  if (cell.isToday) return "#F0F8F3";
  return "#FFFFFF";
}

/**
 * How full the day is, as a bar rather than a list of names.
 *
 * One measure on one track, so the eye compares day against day down a column
 * and across a week without reading anything. Colour carries only the two
 * states worth interrupting for: sold out, and sold twice. Everything in
 * between is the same green at a different length, because length is the
 * quantity and hue would be saying it a second time.
 */
function OccupancyMeter({ cell }: { cell: CalendarCell }) {
  if (!cell.inMonth || cell.capacity === 0) {
    return <div className="h-[5px]" />;
  }
  const ratio = Math.min(1, cell.occupied / cell.capacity);
  const full = cell.occupied >= cell.capacity;
  const fill = cell.conflictHere
    ? "var(--color-danger-ink)"
    : full
      ? "var(--color-gold)"
      : "var(--color-teal)";
  return (
    <div
      className="h-[5px] w-full overflow-hidden rounded-full bg-line-strong"
      role="img"
      aria-label={`${cell.occupied} dari ${cell.capacity} kamar terisi`}
    >
      <div
        className="h-full rounded-full"
        style={{ width: `${Math.max(ratio * 100, ratio > 0 ? 14 : 0)}%`, background: fill }}
      />
    </div>
  );
}

export function CalendarScreen({
  narrow,
  compact,
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
  /* Compact fits the seven columns to whatever width there is; wide keeps the
     700px floor so the named chips stay readable and the box scrolls. */
  const gridCols = {
    gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
    minWidth: compact ? 0 : narrow ? 700 : 0,
  };

  const stats = (
    <>
      <div>
        <div className="text-[11px] text-slate-soft">Okupansi bulan ini</div>
        <div className={compact ? "text-[17px] font-bold" : "text-[19px] font-bold"}>
          {occLabel}
        </div>
      </div>
      <div>
        <div className="text-[11px] text-slate-soft">Malam terjual</div>
        <div className={compact ? "text-[17px] font-bold" : "text-[19px] font-bold"}>
          {nightsLabel}
        </div>
      </div>
      {showMoney && (
        /* Spans the row on a phone rather than squeezing into a third column:
           a month past nine figures would not fit one, and a rupiah total that
           wraps mid-number is worse than one on its own line. */
        <div className={compact ? "col-span-2" : ""}>
          <div className="text-[11px] text-slate-soft">Pendapatan</div>
          <div className={compact ? "text-[17px] font-bold" : "text-[19px] font-bold"}>
            {revenueLabel}
          </div>
        </div>
      )}
    </>
  );

  return (
    <div>
      {conflictCount > 0 && (
        <div
          className={`mb-4 rounded-[14px] border border-danger-line bg-danger-tint px-4 py-[13px] ${
            compact ? "flex flex-col gap-[10px]" : "flex items-center gap-[14px]"
          }`}
        >
          <div className="flex items-start gap-[11px]">
            <span className="mt-[6px] h-[9px] w-[9px] shrink-0 rounded-full bg-danger" />
            <div className="flex-1 text-[13.5px] leading-[1.45] text-danger-deep">
              {conflictText}
            </div>
          </div>
          <button
            type="button"
            onClick={onReviewConflict}
            className={`cursor-pointer rounded-[10px] border border-danger bg-transparent px-[14px] py-2 text-[12.5px] font-medium text-danger hover:bg-danger hover:text-white ${
              compact ? "w-full" : "shrink-0"
            }`}
          >
            Tinjau
          </button>
        </div>
      )}

      {compact ? (
        <div className="mb-3">
          {/* Month and its two arrows on one line, pushed to the edges, so the
              row reads as a single control instead of three loose objects. */}
          <div className="mb-3 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={onPrevMonth}
              aria-label="Bulan sebelumnya"
              className={`${ARROW_BUTTON} h-[36px] w-[36px] text-[16px]`}
            >
              ‹
            </button>
            <div className="text-[18px] font-bold">{monthLabel}</div>
            <button
              type="button"
              onClick={onNextMonth}
              aria-label="Bulan berikutnya"
              className={`${ARROW_BUTTON} h-[36px] w-[36px] text-[16px]`}
            >
              ›
            </button>
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-3 rounded-[14px] border border-line-soft bg-surface px-4 py-[13px]">
            {stats}
          </div>
        </div>
      ) : (
        /* Both arrows together, then the month — the same stepper the report
           screen uses. Straddling the label meant a fixed 190px reservation to
           stop the second arrow sliding about between a short month and a long
           one, which left "Juli" with a hole beside it. */
        <div className="mb-[18px] flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-[10px]">
            <div className="flex items-center gap-[6px]">
              <button
                type="button"
                onClick={onPrevMonth}
                aria-label="Bulan sebelumnya"
                className={`${ARROW_BUTTON} h-[34px] w-[34px] text-[15px]`}
              >
                ‹
              </button>
              <button
                type="button"
                onClick={onNextMonth}
                aria-label="Bulan berikutnya"
                className={`${ARROW_BUTTON} h-[34px] w-[34px] text-[15px]`}
              >
                ›
              </button>
            </div>
            <div className="text-[22px] font-bold">{monthLabel}</div>
          </div>
          <div className="ml-auto flex flex-wrap gap-[22px]">{stats}</div>
        </div>
      )}

      <div
        className={`rounded-[20px] border border-line-soft bg-surface ${
          narrow && !compact
            ? "overflow-x-auto overflow-y-hidden"
            : "overflow-hidden"
        }`}
      >
        <div className="grid bg-surface-tint" style={gridCols}>
          {WEEKDAYS.map((d) => (
            <div
              key={d}
              className={`font-mono tracking-[.06em] uppercase ${
                compact
                  ? "px-1 py-[8px] text-center text-[10px] text-slate"
                  : "px-3 py-[11px] text-[11px] tracking-[.08em] text-slate-soft"
              }`}
            >
              {compact ? d.slice(0, 3) : d}
            </div>
          ))}
        </div>

        {compact ? (
          /*
           * Named chips need roughly 100px of column to be worth printing. At
           * seven to a phone there are fifty, so the old grid was 700px wide
           * inside a 360px box: three and a half columns visible, the rest
           * behind a sideways scroll, and a month view that could not show a
           * month. Here the whole month fits, each day says how full it is,
           * and tapping one opens the names underneath.
           */
          <div className="grid" style={gridCols}>
            {cells.map((cell, ci) => {
              const picked = selectedDate === cell.dateStr;
              return (
                <button
                  key={ci}
                  type="button"
                  onClick={() => onSelectDate(cell.dateStr)}
                  aria-pressed={picked}
                  aria-label={`${cell.dateStr}, ${cell.occupied} dari ${cell.capacity} kamar terisi`}
                  className="flex cursor-pointer flex-col items-center gap-[5px] border-r border-b border-line-fine px-[5px] py-[8px]"
                  style={{
                    background: cellBackground(cell),
                    outline: picked ? "2px solid var(--color-teal)" : undefined,
                    outlineOffset: -2,
                  }}
                >
                  {/* A neighbouring month's day is set back by colour, not by
                      fading the whole cell. At 45% opacity these numbers
                      measured 2.1:1 against their own background, and here
                      they are the only thing in the cell. */}
                  <span
                    className={
                      cell.isToday
                        ? "flex h-[24px] w-[24px] items-center justify-center rounded-full bg-teal text-[12px] font-bold text-white"
                        : `flex h-[24px] items-center justify-center text-[13px] font-medium ${
                            cell.inMonth ? "text-ink-soft" : "text-slate"
                          }`
                    }
                  >
                    {cell.label}
                  </span>
                  <OccupancyMeter cell={cell} />
                  <span
                    className="font-mono text-[10px] tabular-nums"
                    style={{
                      color: cell.conflictHere
                        ? "var(--color-danger-ink)"
                        : "var(--color-slate)",
                    }}
                  >
                    {cell.inMonth && cell.capacity > 0
                      ? `${cell.occupied}/${cell.capacity}`
                      : " "}
                  </span>
                </button>
              );
            })}
          </div>
        ) : (
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
        )}
      </div>

      {compact && (
        <p className="mt-[10px] px-1 text-[12px] leading-[1.5] text-slate-mute">
          Ketuk tanggal untuk melihat siapa saja yang menginap dan kamar mana
          yang masih kosong.
        </p>
      )}
    </div>
  );
}
