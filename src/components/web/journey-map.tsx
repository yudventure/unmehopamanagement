"use client";

import { useEffect, useState } from "react";

import { LOCATION, MAP_LINKS, type SiteCopy } from "@/lib/web-content";

/**
 * Where the homestay is, as a drawn map you can press.
 *
 * The thumbnail is a sketch and says so. It is not trying to be a map you
 * navigate by; it is trying to answer the question the section is already
 * asking, which is what the four steps look like laid out in space: Sorong on
 * the mainland, a ferry north-east to Waisai, and a boat back down to Kri.
 * A real map at this size shows almost none of that.
 *
 * Pressing it opens the real thing: an OpenStreetMap frame at the exact
 * coordinates, the plus code to copy, and a link out to Google Maps for
 * whoever is going to navigate with it. The frame is only requested once the
 * dialog is open, so nobody's browser talks to a map server for a page they
 * scrolled past.
 *
 * Positions come from real coordinates, projected linearly. Over half a degree
 * near the equator that is accurate enough that the three places sit in the
 * right relationship to each other, which is all the sketch claims.
 */

const PLACES = {
  sorong: { lat: -0.878, lng: 131.255 },
  waisai: { lat: -0.433, lng: 130.818 },
  home: { lat: LOCATION.lat, lng: LOCATION.lng },
};

/* The frame the sketch is drawn in, in degrees. */
const BOX = { n: -0.36, s: -0.95, w: 130.58, e: 131.34 };
const W = 320;
const H = 248;

const px = (p: { lat: number; lng: number }) => ({
  x: ((p.lng - BOX.w) / (BOX.e - BOX.w)) * W,
  y: ((BOX.n - p.lat) / (BOX.n - BOX.s)) * H,
});

const S = px(PLACES.sorong);
const WA = px(PLACES.waisai);
const HO = px(PLACES.home);

export function JourneyMap({ t }: { t: SiteCopy }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  /* The live frame is opt-in. Two reasons, and the second is the stronger:
     nobody's browser should talk to a map server for a dialog they opened to
     read an address, and an <iframe> that fails to reach its host renders the
     browser's own broken-page icon, which is a worse thing to ship than a
     drawing that always works. */
  const [live, setLive] = useState(false);
  const m = t.journey.map;

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

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(
        `${LOCATION.plusCode} ${LOCATION.area}, ${LOCATION.admin}`,
      );
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
        className="group relative mt-6 block w-full cursor-pointer overflow-hidden rounded-[22px] border border-line-strong bg-teal-tint p-0 text-left transition-colors hover:border-teal-line"
      >
        <Sketch t={t} />
        <span className="pointer-events-none absolute bottom-3 left-3 rounded-full bg-ink/85 px-[13px] py-[7px] text-[12px] font-medium text-white">
          {m.open}
        </span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[80] flex items-start justify-center overflow-auto bg-ink/60 p-4 backdrop-blur-sm sm:items-center sm:p-6"
          onClick={() => setOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="map-title"
            onClick={(e) => e.stopPropagation()}
            className="my-auto w-full max-w-[720px] animate-pop-in overflow-hidden rounded-[18px] bg-surface shadow-[0_30px_80px_-30px_rgba(15,30,26,.55)]"
          >
            <div className="flex items-start gap-4 border-b border-line px-6 py-5">
              <div className="min-w-0 flex-1">
                <h2
                  id="map-title"
                  className="m-0 text-[20px] leading-[1.2] font-bold tracking-[-.015em]"
                >
                  {m.title}
                </h2>
                <p className="mt-[6px] mb-0 text-[13px] leading-[1.55] text-slate">
                  {LOCATION.area}, {LOCATION.admin}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label={t.enquiry.close}
                className="mt-[2px] flex h-[32px] w-[32px] shrink-0 cursor-pointer items-center justify-center rounded-full border border-line-strong bg-surface text-[15px] text-slate hover:bg-surface-hover"
              >
                ✕
              </button>
            </div>

            {live ? (
              <iframe
                src={MAP_LINKS.embed}
                title={m.title}
                loading="lazy"
                referrerPolicy="no-referrer"
                className="block h-[300px] w-full border-0 bg-teal-tint sm:h-[380px]"
              />
            ) : (
              <div className="relative bg-teal-tint">
                <Sketch t={t} />
                <button
                  type="button"
                  onClick={() => setLive(true)}
                  className="absolute bottom-4 left-4 cursor-pointer rounded-full border-none bg-ink px-[16px] py-[9px] text-[12.5px] font-medium text-white hover:bg-ink-soft"
                >
                  {m.live}
                </button>
              </div>
            )}

            <div className="px-6 py-5">
              <div className="flex flex-wrap items-center gap-[10px]">
                <code className="rounded-[8px] bg-surface-mute px-[10px] py-[6px] font-mono text-[13px] text-ink">
                  {LOCATION.plusCode}
                </code>
                <span className="font-mono text-[12.5px] text-slate">
                  {LOCATION.lat.toFixed(6)}, {LOCATION.lng.toFixed(6)}
                </span>
                <button
                  type="button"
                  onClick={copy}
                  className="cursor-pointer rounded-full border border-line-strong bg-surface px-[13px] py-[6px] text-[12.5px] text-slate hover:bg-surface-hover"
                >
                  {copied ? m.copied : m.copy}
                </button>
              </div>

              <div className="mt-5 flex flex-wrap gap-[10px]">
                <a
                  href={MAP_LINKS.google}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center rounded-full bg-ink px-6 py-[12px] text-[14px] font-medium text-white no-underline hover:bg-ink-soft hover:no-underline"
                >
                  {m.google}
                </a>
                <a
                  href={MAP_LINKS.osm}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center rounded-full border border-line-strong bg-surface px-6 py-[12px] text-[14px] font-medium text-ink no-underline hover:bg-surface-hover hover:no-underline"
                >
                  {m.osm}
                </a>
              </div>

              <p className="mt-4 mb-0 text-[12.5px] leading-[1.55] text-slate">
                {m.note}
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/**
 * The drawn map. Sketch, not survey.
 *
 * Every shape is anchored to a projected coordinate rather than hand-placed,
 * so the islands cannot drift away from the pins sitting on them. Their
 * outlines are invented; their positions are not.
 */
function Sketch({ t }: { t: SiteCopy }) {
  const m = t.journey.map;

  /* An island as a lumpy ellipse around a point. Enough to read as land
     without pretending to be a coastline. */
  const island = (
    c: { x: number; y: number },
    rx: number,
    ry: number,
    tilt = 0,
  ) => (
    <g transform={`rotate(${tilt} ${c.x} ${c.y})`}>
      <ellipse
        cx={c.x}
        cy={c.y}
        rx={rx}
        ry={ry}
        fill="#cbe7d7"
        stroke="#a9d4bd"
        strokeWidth="1.5"
      />
      <ellipse
        cx={c.x - rx * 0.45}
        cy={c.y + ry * 0.35}
        rx={rx * 0.5}
        ry={ry * 0.62}
        fill="#cbe7d7"
        stroke="#a9d4bd"
        strokeWidth="1.5"
      />
    </g>
  );

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="block h-auto w-full"
      role="img"
      aria-label={m.sketchAlt}
      data-move
    >
      <rect width={W} height={H} fill="#eaf5ef" />

      {/* Sea texture: a few long, still lines. This water is a backdrop, not
          the subject, so it gets far less than the season cards do. */}
      {[38, 92, 146, 200].map((y) => (
        <line
          key={y}
          x1="0"
          x2={W}
          y1={y}
          y2={y}
          stroke="#2f8a63"
          strokeWidth="1"
          opacity="0.06"
        />
      ))}

      {/* Waigeo, the big island Waisai sits on: north and east of it. */}
      {island({ x: WA.x + 74, y: WA.y - 6 }, 96, 46, -8)}
      {/* Salawati, filling the water between Sorong and the islands. */}
      {island({ x: S.x - 96, y: S.y + 18 }, 58, 30, 6)}
      {/* The Sorong peninsula, bottom right. */}
      {island({ x: S.x + 34, y: S.y + 30 }, 62, 34, -4)}
      {/* Mansuar, the long one, with Kri — the islet the homestay stands on —
          off its north-east end. The pin sits on Kri, which is why the small
          shape is the one under it: the homestay is not on Mansuar, and a
          sketch that puts it there is still a map saying the wrong island. */}
      {island({ x: HO.x + 54, y: HO.y + 10 }, 38, 15, -6)}
      <ellipse
        cx={HO.x + 4}
        cy={HO.y + 2}
        rx="15"
        ry="7"
        fill="#cbe7d7"
        stroke="#a9d4bd"
        strokeWidth="1.5"
      />

      {/* The route the four cards describe: fly in, ferry up, boat back down.
          Dashes move along it so it reads as a direction, not a border. */}
      <path
        d={`M${S.x} ${S.y} Q ${(S.x + WA.x) / 2 + 30} ${(S.y + WA.y) / 2 - 20} ${WA.x} ${WA.y}`}
        fill="none"
        stroke="#8b8274"
        strokeWidth="1.8"
        strokeDasharray="7 5"
        style={{ animation: "routeDash 1.6s linear infinite" }}
      />
      <path
        d={`M${WA.x} ${WA.y} Q ${(WA.x + HO.x) / 2 + 16} ${(WA.y + HO.y) / 2 + 14} ${HO.x} ${HO.y}`}
        fill="none"
        stroke="#2f8a63"
        strokeWidth="2"
        strokeDasharray="7 5"
        style={{ animation: "routeDash 1.6s linear infinite" }}
      />

      <Dot p={S} label={m.sorong} anchor="end" />
      <Dot p={WA} label={m.waisai} anchor="start" />

      {/* The homestay. Two rings going out under a solid pin, which is the one
          thing on this drawing anybody is looking for. */}
      <g transform={`translate(${HO.x} ${HO.y})`}>
        {[0, 1.4].map((delay) => (
          <circle
            key={delay}
            r="13"
            fill="#2f8a63"
            style={{
              animation: `pinPulse 2.8s ease-out ${delay}s infinite`,
              transformOrigin: "center",
            }}
          />
        ))}
        <circle r="7" fill="#216b4b" stroke="#ffffff" strokeWidth="2.5" />
        <text
          x="0"
          y="-15"
          textAnchor="middle"
          fontSize="11.5"
          fontWeight="700"
          fill="#241f18"
        >
          {m.here}
        </text>
      </g>
    </svg>
  );
}

function Dot({
  p,
  label,
  anchor,
}: {
  p: { x: number; y: number };
  label: string;
  anchor: "start" | "end";
}) {
  return (
    <g transform={`translate(${p.x} ${p.y})`}>
      <circle r="4.5" fill="#8b8274" stroke="#ffffff" strokeWidth="2" />
      <text
        x={anchor === "end" ? -9 : 9}
        y="4"
        textAnchor={anchor}
        fontSize="11"
        fill="#4a4238"
      >
        {label}
      </text>
    </g>
  );
}
