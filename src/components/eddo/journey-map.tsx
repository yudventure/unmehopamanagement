"use client";

import { useEffect, useState } from "react";

import {
  EDDO,
  EDDO_LOCATION,
  EDDO_MAP_LINKS,
  type EddoCopy,
} from "@/lib/eddo-content";
import { ISLANDS, REST, VIEW, place } from "@/lib/perjalanan";

/**
 * The journey, drawn: Sorong, Waisai, and the house.
 *
 * The coastline is the real one, from Indonesia's own village boundary
 * records by way of `src/lib/perjalanan.ts`, and the three markers sit on real
 * coordinates. That matters more here than on a decorative drawing, because
 * this picture is answering "can I actually get there" and a reader works out
 * distances from it. The Turtle site answers the same question with a sketch
 * that says outright its island outlines are invented; this one did not have
 * to, because by the time it was drawn the real outlines were already in the
 * repository.
 *
 * Pressing it opens the address: the exact coordinates, the plus code, and
 * links out to Google Maps and OpenStreetMap for whoever is going to navigate
 * with it. The live map frame is requested only when somebody asks for it, so
 * nobody's browser talks to a map server for a page they scrolled past.
 */

const SEA = "#BFE4DC";
const SEA_DEEP = "#A5D7CC";
const SHALLOW = "#DCF0EB";
const LAND = "#2C6B58";
const LAND_HOME = "#3E8A72";
const ROUTE = "#12333C";
const HOME = "#E8795F";

const SOQ = place(EDDO_LOCATION.sorong.lat, EDDO_LOCATION.sorong.lng);
const WAISAI = place(EDDO_LOCATION.waisai.lat, EDDO_LOCATION.waisai.lng);
const HOUSE = place(EDDO_LOCATION.home.lat, EDDO_LOCATION.home.lng);

/**
 * A curve between two points, bowed to one side.
 *
 * Bowed rather than straight because two straight lines meeting at Waisai read
 * as a fold in the paper. The bow is a drawing decision; the two ends are not.
 */
const arc = (
  a: { x: number; y: number },
  b: { x: number; y: number },
  bow: [number, number],
) =>
  `M${a.x} ${a.y}Q${(a.x + b.x) / 2 + bow[0]} ${(a.y + b.y) / 2 + bow[1]} ${b.x} ${b.y}`;

/** The island whose shape the house stands on, so it can be picked out. */
const MANSUAR = ISLANDS.find((i) => `Pulau ${i.label}` === EDDO.island) ?? null;

/**
 * Orientation labels, and where they sit.
 *
 * Mansuar is deliberately absent: the house pin is on it and already names it,
 * and a second label a few pixels away would be two names for one island. The
 * nudges are in map units and are a cartographer's choice, which is why they
 * are here and not in the generated file.
 */
const NAMED: Record<string, { dx: number; dy: number }> = {
  waigeo: { dx: 0, dy: 26 },
  batanta: { dx: 0, dy: 0 },
  salawati: { dx: 0, dy: -18 },
};

/**
 * A dot on a coordinate, with its name beside it.
 *
 * The dot is what is anchored, not the pair. Centring the whole row on the
 * point put half a label's width of dot outside the frame for the house,
 * which sits a tenth of the way across: on a phone the dot was off the map
 * entirely and the name floated in open water. So the dot is pulled back by
 * its own half-width and the words go to whichever side has room, which for
 * Sorong, near the right edge, is the left.
 */
function Marker({
  at,
  label,
  side = "right",
  home = false,
}: {
  at: { x: number; y: number };
  label: string;
  side?: "left" | "right";
  home?: boolean;
}) {
  const dot = home ? 13 : 9;
  return (
    <span
      className={`pointer-events-none absolute z-[2] flex -translate-y-1/2 items-center gap-[6px] ${
        side === "left" ? "flex-row-reverse" : ""
      }`}
      style={{
        left: `${(at.x / VIEW.w) * 100}%`,
        top: `${(at.y / VIEW.h) * 100}%`,
        marginLeft: side === "left" ? undefined : -dot / 2,
        marginRight: side === "left" ? -dot / 2 : undefined,
        transform: side === "left" ? "translate(-100%, -50%)" : undefined,
      }}
    >
      <span
        className={
          home
            ? "block size-[13px] shrink-0 rounded-full border-[3px] border-white bg-[#E8795F] shadow-[0_1px_4px_rgba(18,51,60,.4)]"
            : "block size-[9px] shrink-0 rounded-full border-2 border-white bg-eddo-ink"
        }
      />
      <span
        className={`rounded-full px-[8px] py-[3px] text-[10.5px] leading-[1.25] whitespace-nowrap sm:text-[12px] ${
          home
            ? "bg-[#E8795F] font-bold text-white"
            : "bg-white/92 font-semibold text-eddo-ink"
        }`}
      >
        {label}
      </span>
    </span>
  );
}

/** The picture itself, used both as the thumbnail and inside the dialog. */
function Drawing({ m }: { m: EddoCopy["journey"]["map"] }) {
  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${VIEW.w} ${VIEW.h}`}
        className="block h-auto w-full"
        role="img"
        aria-label={m.alt}
      >
        <defs>
          <linearGradient id="eddo-journey-sea" x1="0" y1="0" x2="0.25" y2="1">
            <stop offset="0%" stopColor={SEA} />
            <stop offset="100%" stopColor={SEA_DEEP} />
          </linearGradient>
        </defs>
        <rect width={VIEW.w} height={VIEW.h} fill="url(#eddo-journey-sea)" />

        {/* The shallows every island sits in: the same outlines under a thick
            pale stroke, which is what makes an archipelago read as islands
            rather than as spilled ink. */}
        <g fill="none" stroke={SHALLOW} strokeWidth={10} strokeLinejoin="round" opacity={0.8}>
          <path d={REST} />
          {ISLANDS.map((i) => (
            <path key={i.id} d={i.d} />
          ))}
        </g>

        {/* Stroked in its own colour because the village polygons meet along
            shared borders that do not share vertices, and unstroked they show
            a hairline of sea through the middle of Waigeo. */}
        <path d={REST} fill={LAND} stroke={LAND} strokeWidth={1.4} />
        {ISLANDS.map((i) => (
          <path
            key={i.id}
            d={i.d}
            fill={i.id === MANSUAR?.id ? LAND_HOME : LAND}
            stroke={i.id === MANSUAR?.id ? LAND_HOME : LAND}
            strokeWidth={1.4}
          />
        ))}

        {/*
         * The two legs the steps describe. The dashes travel along them so
         * each reads as a direction rather than a border, and they keep
         * travelling when the reader has asked for less motion: the line does
         * not move, only the gaps in it, which is a few pixels inside a box
         * rather than something crossing the screen. The project's note in
         * `globals.css` sets out why that distinction is the one that matters
         * on Windows.
         */}
        <g fill="none" strokeLinecap="round" data-route>
          <path d={arc(SOQ, WAISAI, [70, -70])} stroke={ROUTE} strokeWidth={4} opacity={0.5} />
          <path d={arc(WAISAI, HOUSE, [-34, 34])} stroke={HOME} strokeWidth={5} />
        </g>

        {/* Two rings opening under the pin, which is the one thing on this
            drawing anybody is looking for. They are decoration only: the pin
            and its label are plain elements and carry the meaning. */}
        <g data-pin transform={`translate(${HOUSE.x} ${HOUSE.y})`}>
          <circle r={18} fill={HOME} />
          <circle r={18} fill={HOME} style={{ animationDelay: "1.4s" }} />
        </g>
      </svg>

      {ISLANDS.filter((i) => NAMED[i.id]).map((i) => (
        <span
          key={i.id}
          aria-hidden="true"
          className="pointer-events-none absolute z-[1] hidden -translate-x-1/2 -translate-y-1/2 text-[10px] font-bold tracking-[.04em] text-white/85 uppercase sm:block sm:text-[11.5px]"
          style={{
            left: `${((i.at[0] + NAMED[i.id].dx) / VIEW.w) * 100}%`,
            top: `${((i.at[1] + NAMED[i.id].dy) / VIEW.h) * 100}%`,
          }}
        >
          {i.label}
        </span>
      ))}

      {/* Sorong sits a tenth of the way in from the right edge, so its name
          goes on the inside. */}
      <Marker at={SOQ} label={m.sorong} side="left" />
      <Marker at={WAISAI} label={m.waisai} />
      <Marker at={HOUSE} label={m.here} home />
    </div>
  );
}

export function JourneyMap({ t }: { t: EddoCopy }) {
  const m = t.journey.map;
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  /* The live frame is opt-in. Two reasons, and the second is the stronger:
     nobody's browser should talk to a map server for a dialog they opened to
     read an address, and an iframe that fails to reach its host renders the
     browser's own broken-page icon, which is worse to ship than a drawing
     that always works. */
  const [live, setLive] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  /* A fresh open starts on the drawing again. */
  useEffect(() => {
    if (!open) setLive(false);
  }, [open]);

  const address = `${EDDO_LOCATION.plusCode} ${EDDO_LOCATION.area}, ${EDDO_LOCATION.admin}`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* Clipboard refused. The text is on screen and selectable anyway. */
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={m.open}
        className="group relative mt-6 block w-full cursor-pointer overflow-hidden rounded-[22px] border border-eddo-line bg-eddo-tint p-0 text-left transition-colors hover:border-eddo"
      >
        <Drawing m={m} />
        <span className="pointer-events-none absolute bottom-3 left-3 z-[3] rounded-full bg-eddo-ink/88 px-[13px] py-[7px] text-[12px] font-medium text-white">
          {m.open}
        </span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[120] flex items-start justify-center overflow-auto bg-eddo-ink/60 p-4 backdrop-blur-sm sm:items-center sm:p-6"
          onClick={() => setOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="eddo-map-title"
            onClick={(e) => e.stopPropagation()}
            className="my-auto w-full max-w-[760px] overflow-hidden rounded-[18px] bg-surface shadow-[0_30px_80px_-30px_rgba(18,51,60,.55)]"
          >
            <div className="flex items-start gap-4 border-b border-eddo-line px-6 py-5">
              <div className="min-w-0 flex-1">
                <h2
                  id="eddo-map-title"
                  className="m-0 text-[20px] leading-[1.2] font-bold tracking-[-.015em] text-eddo-ink"
                >
                  {m.title}
                </h2>
                <p className="mt-[6px] mb-0 text-[13px] leading-[1.55] text-slate">
                  {EDDO_LOCATION.area}, {EDDO_LOCATION.admin}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label={t.enquiry.close}
                className="mt-[2px] flex size-[32px] shrink-0 cursor-pointer items-center justify-center rounded-full border border-eddo-line bg-surface text-[15px] text-slate hover:bg-eddo-wash"
              >
                ✕
              </button>
            </div>

            {live ? (
              <iframe
                src={EDDO_MAP_LINKS.embed}
                title={m.title}
                loading="lazy"
                referrerPolicy="no-referrer"
                className="block h-[300px] w-full border-0 bg-eddo-tint sm:h-[380px]"
              />
            ) : (
              <div className="relative bg-eddo-tint">
                <Drawing m={m} />
                <button
                  type="button"
                  onClick={() => setLive(true)}
                  className="absolute bottom-4 left-4 z-[3] cursor-pointer rounded-full border-none bg-eddo-ink px-[16px] py-[9px] text-[12.5px] font-medium text-white hover:bg-eddo-dark"
                >
                  {m.live}
                </button>
              </div>
            )}

            <div className="px-6 py-5">
              <div className="flex flex-wrap items-center gap-[10px]">
                <code className="rounded-[8px] bg-eddo-wash px-[10px] py-[6px] font-mono text-[13px] text-eddo-ink">
                  {EDDO_LOCATION.plusCode}
                </code>
                <span className="font-mono text-[12.5px] text-slate">
                  {EDDO_LOCATION.home.lat.toFixed(6)}, {EDDO_LOCATION.home.lng.toFixed(6)}
                </span>
                <button
                  type="button"
                  onClick={copy}
                  className="cursor-pointer rounded-full border border-eddo-line bg-surface px-[13px] py-[6px] text-[12.5px] text-slate hover:bg-eddo-wash"
                >
                  {copied ? m.copied : m.copy}
                </button>
              </div>

              <div className="mt-5 flex flex-wrap gap-[10px]">
                <a
                  href={EDDO_MAP_LINKS.google}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center rounded-full bg-eddo-deep px-6 py-[12px] text-[14px] font-medium text-white no-underline hover:bg-eddo-dark hover:no-underline"
                >
                  {m.google}
                </a>
                <a
                  href={EDDO_MAP_LINKS.osm}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center rounded-full border border-eddo-line bg-surface px-6 py-[12px] text-[14px] font-medium text-eddo-ink no-underline hover:border-eddo hover:no-underline"
                >
                  {m.osm}
                </a>
              </div>

              <p className="mt-4 mb-0 text-[12.5px] leading-[1.55] text-slate">{m.note}</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
