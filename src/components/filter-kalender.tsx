"use client";

import type { ChannelFilter, PropFilter } from "@/lib/derive";

export interface FilterKalenderProps {
  propCounts: { key: PropFilter; label: string; count: number }[];
  filterProp: PropFilter;
  onFilterProp: (key: PropFilter) => void;
  channelCounts: { key: ChannelFilter; label: string; count: number }[];
  filterCh: ChannelFilter;
  onFilterCh: (key: ChannelFilter) => void;
}

function Pil({ aktif, onClick, children }: { aktif: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={aktif}
      className={`cursor-pointer rounded-full border-none px-4 py-2 text-[0.875rem] transition-colors ${
        aktif ? "bg-panel-utama font-semibold text-white" : "bg-panel-latar text-panel-utama hover:bg-panel-lembut"
      }`}
    >
      {children}
    </button>
  );
}

/** Saringan properti dan saluran, dulu di menu samping, sekarang di atas kalender. */
export function FilterKalender({
  propCounts, filterProp, onFilterProp, channelCounts, filterCh, onFilterCh,
}: FilterKalenderProps) {
  return (
    <div className="mb-5 grid gap-3 rounded-3xl bg-white p-4 ring-1 ring-panel-garis">
      {propCounts.length > 1 && (
        <div>
          <p className="mb-2 text-[11px] font-bold tracking-[0.16em] text-panel-aksen uppercase">Properti</p>
          <div className="flex flex-wrap gap-2">
            {propCounts.map((p) => (
              <Pil key={p.key} aktif={filterProp === p.key} onClick={() => onFilterProp(p.key)}>
                {p.label} <span className="opacity-70">{p.count}</span>
              </Pil>
            ))}
          </div>
        </div>
      )}
      <div>
        <p className="mb-2 text-[11px] font-bold tracking-[0.16em] text-panel-aksen uppercase">Saluran</p>
        <div className="flex flex-wrap gap-2">
          {channelCounts.map((c) => (
            <Pil key={c.key} aktif={filterCh === c.key} onClick={() => onFilterCh(c.key)}>
              {c.label} <span className="opacity-70">{c.count}</span>
            </Pil>
          ))}
        </div>
      </div>
    </div>
  );
}
