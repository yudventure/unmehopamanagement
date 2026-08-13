"use client";

import { Pill } from "@/components/ui/pill";
import type { CalendarCell } from "@/lib/derive";
import { WEEKDAYS, fmtShort } from "@/lib/format";
import { payColors } from "@/lib/pills";
import type { Booking } from "@/lib/types";

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
  cells: CalendarCell[];
  onSelect: (id: string) => void;
  todayIn: { booking: Booking; roomName: string; dotColor: string }[];
  unpaid: Booking[];
}

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
  cells,
  onSelect,
  todayIn,
  unpaid,
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
        <div className="grid" style={gridCols}>
          {cells.map((cell, i) => (
            <div
              key={i}
              className="min-h-[126px] border-r border-b border-line-fine px-[11px] py-[10px]"
              style={{
                background: cellBackground(cell),
                opacity: cell.inMonth ? 1 : 0.5,
              }}
            >
              <div className="mb-[7px] flex items-center justify-between">
                <div
                  className={
                    cell.isToday
                      ? "flex h-[26px] w-[26px] items-center justify-center rounded-full bg-teal text-[12.5px] font-bold text-white"
                      : "pl-[3px] text-[13px] font-medium text-ink-soft"
                  }
                >
                  {cell.label}
                </div>
                {cell.inMonth && cell.capacity > 0 && (
                  <div
                    className="font-mono text-[10.5px]"
                    style={{
                      color:
                        cell.occupied >= cell.capacity ? "#B42318" : "#8B9C96",
                    }}
                  >
                    {cell.occupied}/{cell.capacity}
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-1">
                {cell.chips.map((chip) => (
                  <button
                    key={chip.booking.id}
                    type="button"
                    onClick={() => onSelect(chip.booking.id)}
                    className="flex w-full min-w-0 cursor-pointer items-center gap-[6px] overflow-hidden rounded-[7px] border-none px-[7px] py-[5px] text-left text-[11.5px]"
                    style={{ background: chip.bg, color: chip.fg }}
                  >
                    <span
                      className="h-3 w-[3px] shrink-0 rounded-[2px]"
                      style={{ background: chip.dot }}
                    />
                    <span className="min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap">
                      {chip.label}
                    </span>
                  </button>
                ))}
                {cell.hiddenCount > 0 && (
                  <div className="pl-[3px] text-[11px] text-slate-mute">
                    +{cell.hiddenCount} lagi
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-4">
        <div className="min-w-[280px] flex-1 rounded-[18px] border border-line-soft bg-surface px-[18px] py-4">
          <div className="mb-3 text-[14px] font-bold">Check-in hari ini</div>
          <div className="flex flex-col gap-[9px]">
            {todayIn.map(({ booking, roomName, dotColor }) => (
              <button
                key={booking.id}
                type="button"
                onClick={() => onSelect(booking.id)}
                className="flex w-full cursor-pointer items-center gap-3 rounded-xl border border-line bg-surface-mute px-3 py-[10px] text-left hover:bg-surface-hover"
              >
                <span
                  className="h-2 w-2 rounded-[3px]"
                  style={{ background: dotColor }}
                />
                <span className="flex-1 text-[13.5px] font-medium">
                  {booking.guest}
                </span>
                <span className="text-[12px] text-slate-soft">{roomName}</span>
                <Pill colors={payColors(booking.pay)}>{booking.pay}</Pill>
              </button>
            ))}
            {todayIn.length === 0 && (
              <div className="text-[13px] text-slate-mute">
                Tidak ada check-in pada tanggal ini.
              </div>
            )}
          </div>
        </div>

        <div className="min-w-[280px] flex-1 rounded-[18px] border border-line-soft bg-surface px-[18px] py-4">
          <div className="mb-3 text-[14px] font-bold">Belum lunas</div>
          <div className="flex flex-col gap-[9px]">
            {unpaid.map((booking) => (
              <button
                key={booking.id}
                type="button"
                onClick={() => onSelect(booking.id)}
                className="flex w-full cursor-pointer items-center gap-3 rounded-xl border border-line bg-surface-mute px-3 py-[10px] text-left hover:bg-surface-hover"
              >
                <span className="flex-1 text-[13.5px] font-medium">
                  {booking.guest}
                </span>
                <span className="text-[12px] text-slate-soft">
                  {fmtShort(booking.checkIn)}
                </span>
                <Pill colors={payColors(booking.pay)}>{booking.pay}</Pill>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
