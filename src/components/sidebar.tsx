"use client";

import { useCallback, useEffect, useRef, useState } from "react";

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
  "mb-[10px] font-mono text-[10.5px] tracking-[.09em] uppercase text-slate-mute";

/*
 * The narrow nav scrolls sideways because six labels will not fit on a phone.
 * Before, the last one was simply sliced by the viewport edge mid-word, which
 * reads as a broken layout rather than as "there is more this way". These two
 * fades say it instead, and each one disappears at the end it belongs to so a
 * fully scrolled row does not still promise something beyond it.
 */
function NarrowNav({
  nav,
  screen,
  onScreen,
}: Pick<SidebarProps, "nav" | "screen" | "onScreen">) {
  const scroller = useRef<HTMLDivElement>(null);
  const active = useRef<HTMLButtonElement>(null);
  const [edges, setEdges] = useState({ start: false, end: false });

  const measure = useCallback(() => {
    const el = scroller.current;
    if (!el) return;
    /* 4px of slack, not 1: scrollWidth rounds up and scrollLeft lands on
       fractions, so a row scrolled fully to its end can still read a pixel or
       two short and keep promising something that is not there. */
    const max = el.scrollWidth - el.clientWidth;
    setEdges({ start: el.scrollLeft > 4, end: el.scrollLeft < max - 4 });
  }, []);

  useEffect(() => {
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [measure]);

  /* Switching screens from elsewhere (the day list, a deep link) can leave the
     current tab off-screen. Bring it back — and clear of the fades, which are
     36px wide: "nearest" parks the pill flush against the edge, right under
     the wash, so the tab you just chose is the one you cannot read. */
  useEffect(() => {
    const el = scroller.current;
    const pill = active.current;
    if (!el || !pill) return;
    const pad = 40;
    const left = pill.offsetLeft - pad;
    const right = pill.offsetLeft + pill.offsetWidth + pad;
    if (left < el.scrollLeft) el.scrollLeft = Math.max(0, left);
    else if (right > el.scrollLeft + el.clientWidth)
      el.scrollLeft = right - el.clientWidth;
    measure();
  }, [screen, measure]);

  return (
    <div className="relative shrink-0 border-b border-line">
      <div
        ref={scroller}
        onScroll={measure}
        className="scrollbar-none flex gap-[6px] overflow-x-auto px-[14px] py-[9px]"
      >
        {nav.map((item) => {
          const on = screen === item.key;
          return (
            <button
              key={item.key}
              ref={on ? active : undefined}
              type="button"
              onClick={() => onScreen(item.key)}
              aria-current={on ? "page" : undefined}
              className={`shrink-0 cursor-pointer rounded-[11px] border-none px-[13px] py-[9px] text-left text-[13px] whitespace-nowrap ${
                on
                  ? "bg-teal font-bold text-white"
                  : "bg-surface-tint text-ink-soft"
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </div>

      {edges.start && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 left-0 w-9 bg-gradient-to-r from-surface from-35% to-transparent"
        />
      )}
      {edges.end && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 right-0 w-9 bg-gradient-to-l from-surface from-35% to-transparent"
        />
      )}
    </div>
  );
}

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
    return <NarrowNav nav={nav} screen={screen} onScreen={onScreen} />;
  }

  return (
    <div className="flex w-[256px] shrink-0 flex-col gap-[22px] border-r border-line bg-surface px-[16px] pt-[22px] pb-[18px]">
      <div className="flex items-center gap-[10px] px-[6px]">
        {/* The mark is drawn in deep greens, which vanish on the shell. A white
            disc gives it back its own ground instead of recolouring it. */}
        <span className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-full bg-teal-tint ring-1 ring-teal-line">
          <BrandLogo size={30} />
        </span>
        {/* Two deliberate lines. On one, at a sidebar's width, the wordmark
            wraps of its own accord and drops its third line onto the rule. */}
        <div className="leading-[1.2]">
          <div className="text-[15px] font-bold text-ink">Unmehopa</div>
          <div className="text-[12.5px] text-slate">Management</div>
        </div>
      </div>

      <nav className="flex flex-col gap-[2px] border-t border-line pt-[18px]">
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
                  ? "bg-teal-tint font-bold text-teal-deep"
                  : "bg-transparent text-ink-soft hover:bg-surface-tint"
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
                  ? "bg-surface-tint font-medium text-ink"
                  : "bg-transparent text-slate hover:bg-surface-tint"
              }`}
            >
              <span>{p.label}</span>
              <span className="font-mono text-[11px] text-slate-mute">
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
                  ? "bg-surface-tint font-medium text-ink"
                  : "bg-transparent text-slate hover:bg-surface-tint"
              }`}
            >
              <span
                className="h-[9px] w-[9px] shrink-0 rounded-[3px]"
                style={{
                  background:
                    c.key === "all"
                      ? "var(--color-slate-ghost)"
                      : CH[c.key as (typeof CHANNEL_KEYS)[number]].dot,
                }}
              />
              <span className="flex-1 text-left">{c.label}</span>
              <span className="font-mono text-[11px] text-slate-mute">
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
      <div className="rounded-[14px] border border-line bg-surface-mute px-[15px] py-[14px]">
        <div className="mb-[6px] text-[12px] text-slate-soft">
          Sinkronisasi iCal
        </div>
        <div className="flex items-center gap-[7px]">
          <span className="inline-block h-[7px] w-[7px] rounded-full bg-amber-shade" />
          <span className="text-[13.5px] font-medium text-ink">
            {feedCount ? `${feedCount} feed terdaftar` : "Belum tersambung"}
          </span>
        </div>
        <div className="mt-[7px] text-[12px] leading-[1.45] text-slate-soft">
          {feedCount
            ? "Belum pernah ditarik — penjadwal jalan setelah backend siap."
            : "Belum ada feed OTA terpasang. Booking dari Booking.com, Agoda, dan Traveloka masih dicatat manual."}
        </div>
      </div>
    </div>
  );
}
