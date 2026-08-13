"use client";

export interface Kpi {
  label: string;
  value: string;
  sub: string;
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
  kpis: Kpi[];
  channelRows: ChannelRow[];
  roomRows: RoomRow[];
  commissionLabel: string;
  onExport: () => void;
  onCompare: () => void;
}

const GHOST_BUTTON =
  "cursor-pointer rounded-xl border border-line-strong bg-surface px-4 py-[10px] text-[13px] hover:bg-surface-hover";

export function ReportScreen({
  monthLabel,
  kpis,
  channelRows,
  roomRows,
  commissionLabel,
  onExport,
  onCompare,
}: ReportScreenProps) {
  return (
    <div>
      <div className="mb-1 text-[22px] font-bold">Laporan {monthLabel}</div>
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
          </div>
        ))}
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

      <div className="mt-4 flex gap-3">
        <button type="button" onClick={onExport} className={GHOST_BUTTON}>
          Ekspor CSV
        </button>
        <button type="button" onClick={onCompare} className={GHOST_BUTTON}>
          Bandingkan dengan bulan lalu
        </button>
      </div>
    </div>
  );
}
