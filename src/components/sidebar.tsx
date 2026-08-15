"use client";

import { BrandLogo } from "@/components/brand-logo";
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
  /** Import feeds the owner has registered. Zero means nothing is wired up. */
  feedCount: number;
  filterProp: PropFilter;
  onFilterProp: (key: PropFilter) => void;
  channelCounts: { key: ChannelFilter; label: string; count: number }[];
  filterCh: ChannelFilter;
  onFilterCh: (key: ChannelFilter) => void;
}

/*
 * Wide, the sidebar is the green of the shell itself — there is no panel, the
 * frame simply shows through, and everything on it is white at one of three
 * strengths. Narrow, it collapses to a scrolling nav row inside the white
 * panel, where those same whites would be invisible; that branch keeps the
 * light treatment.
 */
const SECTION_LABEL =
  "mb-[10px] font-mono text-[10.5px] tracking-[.09em] uppercase text-white/55";

export function Sidebar({
  narrow,
  nav,
  screen,
  onScreen,
  propCounts,
  feedCount,
  filterProp,
  onFilterProp,
  channelCounts,
  filterCh,
  onFilterCh,
}: SidebarProps) {
  if (narrow) {
    return (
      <div className="flex w-full shrink-0 gap-2 overflow-x-auto border-b border-line px-[14px] py-3">
        {nav.map((item) => {
          const active = screen === item.key;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => onScreen(item.key)}
              aria-current={active ? "page" : undefined}
              className={`shrink-0 cursor-pointer rounded-xl border-none px-[14px] py-[11px] text-left text-[13.5px] whitespace-nowrap ${
                active
                  ? "bg-teal font-bold text-white"
                  : "bg-transparent text-ink-soft"
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className="flex w-[248px] shrink-0 flex-col gap-[22px] px-[18px] pt-[22px] pb-[18px]">
      <div className="flex items-center gap-[10px] px-[6px]">
        {/* The mark is drawn in deep greens, which vanish on the shell. A white
            disc gives it back its own ground instead of recolouring it. */}
        <span className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-full bg-surface">
          <BrandLogo size={30} />
        </span>
        {/* Two deliberate lines. On one, at a sidebar's width, the wordmark
            wraps of its own accord and drops its third line onto the rule. */}
        <div className="leading-[1.2]">
          <div className="text-[15px] font-bold text-white">Unmehopa</div>
          <div className="text-[12.5px] text-white/70">Management</div>
        </div>
      </div>

      <nav className="flex flex-col gap-[3px] border-t border-white/15 pt-[18px]">
        {nav.map((item) => {
          const active = screen === item.key;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => onScreen(item.key)}
              aria-current={active ? "page" : undefined}
              className={`cursor-pointer rounded-[12px] border-none px-[14px] py-[11px] text-left text-[13.5px] whitespace-nowrap ${
                active
                  ? "bg-surface font-bold text-teal-deep"
                  : "bg-transparent text-white/85 hover:bg-white/12"
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* Empty for an account scoped to one property — the heading would
          stand over nothing. */}
      <div className={propCounts.length ? "" : "hidden"}>
        <div className={SECTION_LABEL}>Properti</div>
        <div className="flex flex-col gap-[4px]">
          {propCounts.map((p) => (
            <button
              key={p.key}
              type="button"
              onClick={() => onFilterProp(p.key)}
              aria-pressed={filterProp === p.key}
              className={`flex w-full cursor-pointer items-center justify-between gap-2 rounded-[10px] border-none px-[11px] py-[7px] text-left text-[13px] ${
                filterProp === p.key
                  ? "bg-white/18 font-medium text-white"
                  : "bg-transparent text-white/75 hover:bg-white/10"
              }`}
            >
              <span>{p.label}</span>
              <span className="font-mono text-[11px] text-white/60">
                {p.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <div className={SECTION_LABEL}>Saluran</div>
        <div className="flex flex-col gap-[4px]">
          {channelCounts.map((c) => (
            <button
              key={c.key}
              type="button"
              onClick={() => onFilterCh(c.key)}
              aria-pressed={filterCh === c.key}
              className={`flex w-full cursor-pointer items-center gap-[9px] rounded-[10px] border-none px-[11px] py-[6px] text-[13px] ${
                filterCh === c.key
                  ? "bg-white/18 font-medium text-white"
                  : "bg-transparent text-white/75 hover:bg-white/10"
              }`}
            >
              <span
                className="h-[9px] w-[9px] shrink-0 rounded-[3px]"
                style={{
                  background:
                    c.key === "all"
                      ? "rgba(255,255,255,.5)"
                      : CH[c.key as (typeof CHANNEL_KEYS)[number]].dot,
                }}
              />
              <span className="flex-1 text-left">{c.label}</span>
              <span className="font-mono text-[11px] text-white/60">
                {c.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Sits directly under the channel list rather than pinned to the foot
          of the column: on a long screen the foot is below the fold, and this
          is the one thing here that is a notice rather than a control.

          Reports the real state, which is that no feed is wired up yet. It
          used to print "12 menit lalu · 5 feed aktif" as fixed text, which
          reads as a working sync to anyone being shown the app. */}
      <div className="rounded-[16px] bg-white/12 px-[15px] py-[14px]">
        <div className="mb-[6px] text-[12px] text-white/65">
          Sinkronisasi iCal
        </div>
        <div className="flex items-center gap-[7px]">
          <span className="inline-block h-[7px] w-[7px] rounded-full bg-amber" />
          <span className="text-[13.5px] font-medium text-white">
            {feedCount ? `${feedCount} feed terdaftar` : "Belum tersambung"}
          </span>
        </div>
        <div className="mt-[7px] text-[12px] leading-[1.45] text-white/65">
          {feedCount
            ? "Belum pernah ditarik — penjadwal jalan setelah backend siap."
            : "Belum ada feed OTA terpasang. Booking dari Booking.com, Agoda, dan Traveloka masih dicatat manual."}
        </div>
      </div>
    </div>
  );
}
