"use client";

import { useState } from "react";

import { ISLANDS, REST, VIEW, type MapIsland } from "@/lib/dampier";
import { EDDO, type MapCopy } from "@/lib/eddo-content";

/**
 * The Dampier Strait, one island at a time.
 *
 * The coastline is real. It is drawn from Indonesia's own village polygons and
 * every island name comes from the government island gazetteer, both under
 * Kepmendagri 300.2.2-2430/2025; `src/lib/dampier.ts` says where each file
 * came from and what was checked. Nothing on this map is a shape somebody
 * thought looked about right, which matters more here than it would for a
 * decorative drawing: a guest works out where they are going from it.
 *
 * What the map deliberately does NOT say is how long a crossing takes or what
 * the reef is doing this month. Nobody has told us, and a map that guesses at
 * that is worse than a map that leaves it out. Those words go in `map.places`
 * in `eddo-content.ts`, one paragraph per island in each of the seven
 * languages, and until they arrive the panel says plainly that they are still
 * to come and offers the family instead.
 *
 * The one thing it does say beyond names and shapes is which island the house
 * is on, and that is not a guess either: `EDDO.island` has said "Pulau
 * Mansuar" since long before this map existed.
 */

/* The same flat palette as the drawings elsewhere on this page. */
const SEA = "#BFE4DC";
const SEA_DEEP = "#A5D7CC";
const SHALLOW = "#DCF0EB";
const LAND = "#2C6B58";
const LAND_LIT = "#E8795F";

/**
 * Where each label sits relative to its island, in map units.
 *
 * A design decision, not a fact: the anchors in `dampier.ts` are the roomiest
 * point on each island and two of them, Arborek and Mansuar, are close enough
 * that the two pills would sit on top of each other. Which side the words go
 * is a cartographer's choice and is made here, where it can be seen, rather
 * than in the generated file, where it would look like data.
 */
const LABEL: Record<string, { dx: number; dy: number }> = {
  waigeo: { dx: 0, dy: 0 },
  gam: { dx: 0, dy: 0 },
  batanta: { dx: 0, dy: 0 },
  mansuar: { dx: -10, dy: 58 },
  kri: { dx: 46, dy: -46 },
  arborek: { dx: -6, dy: -52 },
  /* Friwin goes below its dot and Saonek above its own, because side by side
     they touched on a 390 pixel screen. Tuned at that width on purpose: the
     words stay the same size as the map grows, so the narrowest phone is the
     only place any of these can collide. */
  friwin: { dx: -30, dy: 48 },
  saonek: { dx: 28, dy: -44 },
};

/** Islands big enough that the label belongs on the land itself. */
const ON_LAND = new Set(["waigeo", "gam", "batanta"]);

/**
 * Which island the house is on, read from the site's own details.
 *
 * `EDDO.island` already says "Pulau Mansuar" and the header already says the
 * village is Yenbuba, so this is the site repeating itself rather than the map
 * guessing. It marks the island and not a spot on it: the island is a fact
 * already written down, a dot on a beach would be a fact nobody has given us.
 */
const HOME = ISLANDS.find((i) => `Pulau ${i.label}` === EDDO.island)?.id ?? null;

function Pin({
  island,
  on,
  onPick,
  label,
  home,
}: {
  island: MapIsland;
  on: boolean;
  onPick: () => void;
  label: string;
  home: string | null;
}) {
  const nudge = LABEL[island.id] ?? { dx: 0, dy: 0 };
  const big = ON_LAND.has(island.id);
  return (
    <>
      {/* The dot marks the island. It is separate from the words because on
          the small islands the words have to stand off to one side, and a
          label floating in open water with nothing tying it to the land is
          how a reader ends up looking in the wrong place. */}
      {!big && (
        <span
          aria-hidden="true"
          className={`absolute z-[1] block size-[8px] -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white transition-colors ${
            on ? "bg-[#E8795F]" : "bg-eddo-ink"
          }`}
          style={{
            left: `${(island.at[0] / VIEW.w) * 100}%`,
            top: `${(island.at[1] / VIEW.h) * 100}%`,
          }}
        />
      )}
      <button
        type="button"
        onClick={onPick}
        aria-pressed={on}
        className={`absolute z-[2] inline-flex -translate-x-1/2 -translate-y-1/2 cursor-pointer items-center gap-[5px] rounded-full border px-[9px] py-[4px] text-[10.5px] leading-[1.25] font-semibold whitespace-nowrap transition-colors sm:px-[11px] sm:py-[5px] sm:text-[12px] ${
          on
            ? "border-[#E8795F] bg-[#E8795F] text-white"
            : "border-eddo-line bg-white/95 text-eddo-ink hover:border-eddo hover:bg-white"
        }`}
        style={{
          left: `${((island.at[0] + nudge.dx) / VIEW.w) * 100}%`,
          top: `${((island.at[1] + nudge.dy) / VIEW.h) * 100}%`,
        }}
      >
        {home && (
          <svg
            viewBox="0 0 16 16"
            aria-hidden="true"
            className="size-[11px] shrink-0"
            fill="currentColor"
          >
            <path d="M8 1.6 1.7 7.1h1.7v7.3h3.1v-4.2h3v4.2h3.1V7.1h1.7z" />
          </svg>
        )}
        {label}
        {home && <span className="sr-only"> ({home})</span>}
      </button>
    </>
  );
}

/**
 * One decimal, in the reader's own notation.
 *
 * A German reader expects 1,7 and an English one 1.7, and hard-coding en-US
 * printed a full stop into all seven languages. Wrapped, because an unfamiliar
 * language tag makes `toLocaleString` throw and an island's area is not worth
 * a blank page: the same lesson `web-content.ts` learned about prices.
 */
function area(km2: number, locale: string): string {
  const opts = { maximumFractionDigits: 1 } as const;
  try {
    return km2.toLocaleString(locale || "en", opts);
  } catch {
    return km2.toLocaleString("en", opts);
  }
}

export function DampierMap({
  t,
  locale,
  onAsk,
}: {
  t: MapCopy;
  /** The page's own language tag, for the way it writes a decimal point. */
  locale: string;
  onAsk: (island: string) => void;
}) {
  const [picked, setPicked] = useState<string | null>(null);
  const island = ISLANDS.find((i) => i.id === picked) ?? null;
  const said = island ? t.places[island.id] : undefined;
  const name = island?.label ?? "";

  return (
    <div className="mt-9 grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-6">
      <div
        data-reveal
        className="relative overflow-hidden rounded-[22px] border border-eddo-line bg-eddo-tint"
      >
        <svg
          viewBox={`0 0 ${VIEW.w} ${VIEW.h}`}
          className="block h-auto w-full"
          role="img"
          aria-label={t.alt}
        >
          <defs>
            <linearGradient id="dampier-sea" x1="0" y1="0" x2="0.3" y2="1">
              <stop offset="0%" stopColor={SEA} />
              <stop offset="100%" stopColor={SEA_DEEP} />
            </linearGradient>
          </defs>
          <rect width={VIEW.w} height={VIEW.h} fill="url(#dampier-sea)" />

          {/*
           * Two long bands drifting across the water.
           *
           * They keep moving when the reader has asked for less motion, which
           * is on purpose and is the rule this project settled on after a
           * whole page sat frozen on Windows: Windows reports that preference
           * from "Animation effects", which is off on any machine set to
           * favour performance, so treating it as a request to stop
           * everything stops the site for most Windows users rather than for
           * the few people it was meant for. What stops is motion that
           * crosses the screen or arrives uninvited. This is neither: eight
           * units of drift inside a box, on a picture that is already there.
           */}
          <g data-swell fill={SHALLOW} opacity={0.36}>
            <path d="M-40 640q150-16 300 0t300 0 300 0 300 0 300 0v26q-150 16-300 0t-300 0-300 0-300 0-300 0z" />
            <path d="M-40 760q150-16 300 0t300 0 300 0 300 0 300 0v22q-150 16-300 0t-300 0-300 0-300 0-300 0z" />
          </g>

          {/* The shallow water each island sits in: the same outlines under a
              thick pale stroke. It is what makes an archipelago read as
              islands rather than as spilled ink. */}
          <g
            fill="none"
            stroke={SHALLOW}
            strokeWidth={9}
            strokeLinejoin="round"
            opacity={0.85}
          >
            <path d={REST} />
            {ISLANDS.map((i) => (
              <path key={i.id} d={i.d} />
            ))}
          </g>

          {/* Scenery: every island nobody named. Stroked in its own colour
              because the village polygons meet along shared borders that do
              not share vertices, and unstroked they show a hairline of sea
              through the middle of Waigeo. */}
          <path d={REST} fill={LAND} stroke={LAND} strokeWidth={1.4} />

          {ISLANDS.map((i) => (
            <path
              key={i.id}
              d={i.d}
              fill={i.id === picked ? LAND_LIT : LAND}
              stroke={i.id === picked ? LAND_LIT : LAND}
              strokeWidth={1.4}
              className="transition-[fill,stroke] duration-300"
            />
          ))}

          {/* A ring that opens once where the reader just pressed. Small, in
              place, and never the only sign of what is chosen: the island
              itself changes colour and so does its label. */}
          {island && (
            <circle
              key={island.id}
              data-ping
              cx={island.at[0]}
              cy={island.at[1]}
              r={26}
              fill="none"
              stroke={LAND_LIT}
              strokeWidth={4}
            />
          )}
        </svg>

        {ISLANDS.map((i) => (
          <Pin
            key={i.id}
            island={i}
            on={i.id === picked}
            label={i.label}
            home={i.id === HOME ? t.home : null}
            onPick={() => setPicked(i.id === picked ? null : i.id)}
          />
        ))}
      </div>

      {/*
       * The panel. `aria-live` because the map is a row of buttons that change
       * text somewhere else on the page, which a reader who cannot see the
       * colour change has no other way of noticing.
       */}
      <aside
        data-reveal
        aria-live="polite"
        className="flex flex-col rounded-[22px] border border-eddo-line bg-eddo-wash p-5 md:p-6"
      >
        {!island ? (
          <>
            <h3 className="m-0 text-[17px] leading-[1.25] font-bold text-eddo-ink">
              {t.emptyTitle}
            </h3>
            <p className="mt-3 mb-0 text-[13.5px] leading-[1.65] text-slate">{t.emptyBody}</p>
          </>
        ) : (
          <>
            <h3 className="m-0 text-[20px] leading-[1.2] font-bold text-eddo-ink">{name}</h3>
            {island.id === HOME && (
              <p className="mt-2 mb-0 text-[13px] leading-[1.5] font-semibold text-eddo-deep">
                {t.home}: {EDDO.name}, {EDDO.village}
              </p>
            )}
            {island.km2 !== null && (
              <p className="mt-2 mb-0 font-mono text-[11px] tracking-[.06em] text-slate-mute">
                {/* The label shouts, the figure does not: uppercasing the whole
                    line turned "km2" into "KM2", which is not a unit. */}
                <span className="uppercase">{t.area}</span>{" "}
                {area(island.km2, locale)} {t.km2}
              </p>
            )}
            <p className="mt-3 mb-0 text-[13.5px] leading-[1.65] text-slate">
              {said ?? t.soon}
            </p>
            <button
              type="button"
              onClick={() => onAsk(name)}
              className="mt-5 inline-flex cursor-pointer items-center justify-center gap-2 self-start rounded-full border border-eddo-line bg-surface px-[18px] py-[10px] text-[13px] font-medium text-eddo-ink transition-colors hover:border-eddo"
            >
              {t.ask(name)}
              <span aria-hidden="true">→</span>
            </button>
          </>
        )}
        <p className="mt-auto pt-5 mb-0 text-[11px] leading-[1.6] text-slate-mute">{t.credit}</p>
      </aside>
    </div>
  );
}
