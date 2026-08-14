"use client";

import { DailyChart, TrendChart } from "@/components/screens/report-charts";
import type { DayOccupancy, MonthPoint } from "@/lib/derive";

export interface Kpi {
  label: string;
  value: string;
  sub: string;
  /**
   * Set only while the comparison is on. `good` is null where the direction
   * carries no verdict — a longer stay is neither win nor loss on its own.
   */
  delta?: { text: string; good: boolean | null };
}

export interface ChannelRow {
  label: string;
  value: string;
  pct: string;
  /** Width of the bar relative to the largest channel, 0–100. */
  barPct: number;
  color: string;
}

export interface RoomRow {
  name: string;
  pct: number;
}

export interface ReportScreenProps {
  monthLabel: string;
  prevLabel: string;
  kpis: Kpi[];
  channelRows: ChannelRow[];
  roomRows: RoomRow[];
  commissionLabel: string;
  trend: MonthPoint[];
  daily: DayOccupancy[];
  anchorKey: string;
  compareKey: string;
  showMoney: boolean;
  compare: boolean;
  onToggleCompare: () => void;
  onExportCsv: () => void;
  onExportPdf: () => void;
  /** True while jsPDF is being fetched and the page drawn. */
  pdfBusy: boolean;
  /** Shared with the calendar — both screens report the same month. */
  onPrevMonth: () => void;
  onNextMonth: () => void;
}

const STEP_BUTTON =
  "flex h-[30px] w-[30px] cursor-pointer items-center justify-center rounded-[10px] border border-line-strong bg-surface text-[15px] text-slate hover:bg-surface-hover";

const GHOST_BUTTON =
  "cursor-pointer rounded-xl border border-line-strong bg-surface px-4 py-[10px] text-[13px] hover:bg-surface-hover";

function DeltaLine({ delta }: { delta: NonNullable<Kpi["delta"]> }) {
  const tone =
    delta.good === null
      ? "text-slate-soft"
      : delta.good
        ? "text-teal-deep"
        : "text-danger-ink";
  return <div className={`mt-[6px] text-[12px] font-medium ${tone}`}>{delta.text}</div>;
}

export function ReportScreen({
  monthLabel,
  prevLabel,
  kpis,
  channelRows,
  roomRows,
  commissionLabel,
  trend,
  daily,
  anchorKey,
  compareKey,
  showMoney,
  compare,
  onToggleCompare,
  onExportCsv,
  onExportPdf,
  pdfBusy,
  onPrevMonth,
  onNextMonth,
}: ReportScreenProps) {
  return (
    <div>
      <div className="mb-1 flex flex-wrap items-center gap-3">
        <div className="text-[22px] font-bold">Laporan {monthLabel}</div>
        {/* The same month the calendar is on — stepping it here saves crossing
            back to that screen just to move the report a month. */}
        <div className="flex gap-[6px]">
          <button
            type="button"
            onClick={onPrevMonth}
            aria-label="Bulan sebelumnya"
            className={STEP_BUTTON}
          >
            ‹
          </button>
          <button
            type="button"
            onClick={onNextMonth}
            aria-label="Bulan berikutnya"
            className={STEP_BUTTON}
          >
            ›
          </button>
        </div>
      </div>
      <div className="mb-5 text-[13.5px] text-slate-soft">
        Okupansi dan pendapatan seluruh properti. Nilai OTA sudah dikurangi
        estimasi komisi.
      </div>

      <div className="mb-[18px] grid grid-cols-[repeat(auto-fit,minmax(190px,1fr))] gap-[14px]">
        {kpis.map((k) => (
          <div
            key={k.label}
            className="rounded-[18px] border border-line-soft bg-surface px-[18px] py-4"
          >
            <div className="mb-2 text-[12px] text-slate-soft">{k.label}</div>
            <div className="text-[26px] font-bold tracking-[-.01em]">
              {k.value}
            </div>
            <div className="mt-[6px] text-[12px] text-slate-mute">{k.sub}</div>
            {k.delta && <DeltaLine delta={k.delta} />}
          </div>
        ))}
      </div>

      <div className="mb-4 flex flex-col gap-4">
        <TrendChart
          points={trend}
          anchorKey={anchorKey}
          compareKey={compare ? compareKey : null}
          showMoney={showMoney}
        />
        <DailyChart days={daily} monthLabel={monthLabel} />
      </div>

      <div className="flex flex-wrap gap-4">
        <div className="min-w-[320px] flex-[1.2] rounded-[18px] border border-line-soft bg-surface px-5 py-[18px]">
          <div className="mb-4 text-[14px] font-bold">Pendapatan per saluran</div>
          <div className="flex flex-col gap-[14px]">
            {channelRows.map((c) => (
              <div key={c.label}>
                <div className="mb-[6px] flex items-center gap-[9px]">
                  <span
                    className="h-[10px] w-[10px] rounded-[3px]"
                    style={{ background: c.color }}
                  />
                  <span className="flex-1 text-[13.5px]">{c.label}</span>
                  <span className="text-[13.5px] font-bold">{c.value}</span>
                  <span className="w-[44px] text-right font-mono text-[11.5px] text-slate-soft">
                    {c.pct}
                  </span>
                </div>
                <div className="h-[9px] overflow-hidden rounded-full bg-surface-hover">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${c.barPct}%`, background: c.color }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-[18px] border-t border-dashed border-line-strong pt-[14px] text-[12.5px] text-slate-soft">
            Estimasi komisi OTA bulan ini {commissionLabel}, dihitung dari tarif
            per platform yang diisi manual.
          </div>
        </div>

        <div className="min-w-[300px] flex-1 rounded-[18px] border border-line-soft bg-surface px-5 py-[18px]">
          <div className="mb-4 text-[14px] font-bold">Okupansi per kamar</div>
          <div className="flex flex-col gap-[10px]">
            {roomRows.map((r) => (
              <div key={r.name} className="flex items-center gap-3">
                <span className="w-[96px] overflow-hidden text-ellipsis whitespace-nowrap text-[12.5px] text-slate">
                  {r.name}
                </span>
                <span className="block h-[9px] flex-1 overflow-hidden rounded-full bg-surface-hover">
                  <span
                    className="block h-full rounded-full bg-teal"
                    style={{ width: `${r.pct}%` }}
                  />
                </span>
                <span className="w-[38px] text-right font-mono text-[11.5px] text-ink">
                  {r.pct}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button type="button" onClick={onExportCsv} className={GHOST_BUTTON}>
          Ekspor CSV
        </button>
        <button
          type="button"
          onClick={onExportPdf}
          disabled={pdfBusy}
          className={`${GHOST_BUTTON} ${pdfBusy ? "cursor-wait text-slate-mute" : ""}`}
        >
          {pdfBusy ? "Menyiapkan PDF…" : "Unduh PDF"}
        </button>
        <button
          type="button"
          onClick={onToggleCompare}
          aria-pressed={compare}
          className={
            compare
              ? "cursor-pointer rounded-xl border border-teal bg-teal-tint px-4 py-[10px] text-[13px] font-medium text-teal-deep"
              : GHOST_BUTTON
          }
        >
          {compare ? `Bandingkan: aktif (${prevLabel})` : "Bandingkan dengan bulan lalu"}
        </button>
        <span className="text-[12px] text-slate-mute">
          CSV berisi rincian per booking; PDF berisi ringkasan satu halaman.
        </span>
      </div>
    </div>
  );
}
