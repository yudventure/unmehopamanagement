"use client";

import { CH, CHANNEL_KEYS } from "@/lib/data";
import type { ChannelFilter, PropFilter } from "@/lib/derive";
import type { Screen } from "@/lib/types";

export interface NavItem {
  key: Screen;
  label: string;
}

export interface SidebarProps {
  narrow: boolean;
  nav: NavItem[];
  screen: Screen;
  onScreen: (screen: Screen) => void;
  propCounts: { key: PropFilter; label: string; count: number }[];
  filterProp: PropFilter;
  onFilterProp: (key: PropFilter) => void;
  channelCounts: { key: ChannelFilter; label: string; count: number }[];
  filterCh: ChannelFilter;
  onFilterCh: (key: ChannelFilter) => void;
}

const SECTION_LABEL =
  "mb-[10px] font-mono text-[10.5px] tracking-[.09em] text-slate-faint uppercase";

function filterChrome(active: boolean) {
  return active
    ? "border-teal-line bg-teal-tint"
    : "border-transparent bg-transparent";
}

export function Sidebar({
  narrow,
  nav,
  screen,
  onScreen,
  propCounts,
  filterProp,
  onFilterProp,
  channelCounts,
  filterCh,
  onFilterCh,
}: SidebarProps) {
  return (
    <div
      className={
        narrow
          ? "flex w-full shrink-0 gap-2 overflow-x-auto border-b border-line px-[14px] py-3"
          : "flex w-[246px] shrink-0 flex-col gap-[22px] border-r border-line px-4 py-5"
      }
    >
      <nav className={narrow ? "flex gap-2" : "flex flex-col gap-1"}>
        {nav.map((item) => {
          const active = screen === item.key;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => onScreen(item.key)}
              aria-current={active ? "page" : undefined}
              className={`shrink-0 cursor-pointer rounded-xl border-none px-[14px] py-[11px] text-left text-[13.5px] whitespace-nowrap ${
                active ? "bg-teal font-bold text-white" : "bg-transparent text-ink-soft"
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </nav>

      {!narrow && (
        <>
          <div>
            <div className={SECTION_LABEL}>Properti</div>
            <div className="flex flex-col gap-[6px]">
              {propCounts.map((p) => (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => onFilterProp(p.key)}
                  aria-pressed={filterProp === p.key}
                  className={`flex w-full cursor-pointer items-center justify-between gap-2 rounded-[10px] border px-[11px] py-2 text-left text-[13px] text-ink-soft ${filterChrome(
                    filterProp === p.key,
                  )}`}
                >
                  <span>{p.label}</span>
                  <span className="font-mono text-[11px] text-slate-soft">
                    {p.count}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className={SECTION_LABEL}>Saluran</div>
            <div className="flex flex-col gap-2">
              {channelCounts.map((c) => (
                <button
                  key={c.key}
                  type="button"
                  onClick={() => onFilterCh(c.key)}
                  aria-pressed={filterCh === c.key}
                  className={`flex w-full cursor-pointer items-center gap-[9px] rounded-[10px] border px-[11px] py-[7px] text-[13px] text-ink-soft ${filterChrome(
                    filterCh === c.key,
                  )}`}
                >
                  <span
                    className="h-[9px] w-[9px] shrink-0 rounded-[3px]"
                    style={{
                      background:
                        c.key === "all"
                          ? "#C7D5D0"
                          : CH[c.key as (typeof CHANNEL_KEYS)[number]].dot,
                    }}
                  />
                  <span className="flex-1 text-left">{c.label}</span>
                  <span className="font-mono text-[11px] text-slate-soft">
                    {c.count}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-auto rounded-2xl bg-surface-tint px-[15px] py-[14px]">
            <div className="mb-[6px] text-[12px] text-slate-soft">
              Sinkron iCal terakhir
            </div>
            <div className="text-[13.5px] font-medium">12 menit lalu</div>
            <div className="mt-[9px] flex items-center gap-[7px]">
              <span className="inline-block h-[7px] w-[7px] rounded-full bg-ok" />
              <span className="text-[12px] text-slate">5 feed aktif, 1 gagal</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
