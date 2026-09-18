"use client";

import { useEffect, useRef, useState } from "react";

import { IsletScene, JettyScene } from "@/components/web/scenes";

/**
 * The room photographs, one at a time, with a way back and a way on.
 *
 * There is no maximum. The page hands it whatever `public/` holds, so adding a
 * eleventh photograph is dropping a file in a folder, not editing this file.
 * With no photographs at all it shows the two drawn scenes instead, which is
 * what the rest of the site does while the real pictures are still to be
 * taken: a page that is complete without them rather than a page with holes.
 *
 * Why a transform and not a scroller: a scroll-snap strip is fewer lines, but
 * its position is a scroll offset, and a scroll offset cannot be told apart
 * from a reader's own half-swipe. The index here is the only state, so the
 * dots, the counter and the buttons cannot disagree with the picture.
 */
/** A photograph, and the same photograph cut down for a narrow screen. */
export interface RoomPhoto {
  src: string;
  narrow: string | null;
}

export function RoomCarousel({
  photos,
  alt,
  prev,
  next,
  counter,
}: {
  photos: RoomPhoto[];
  /** Given the photograph's number and the total, in the reader's language. */
  alt: (n: number, of: number) => string;
  prev: string;
  next: string;
  /** Read out as the picture changes, and printed in the corner. */
  counter: (n: number, of: number) => string;
}) {
  const drawn = photos.length === 0;
  const count = drawn ? 2 : photos.length;
  const [at, setAt] = useState(0);
  const touch = useRef<number | null>(null);

  /* A photograph removed from the folder while a reader is on it would leave
     the index past the end. Cheap to guard, impossible to debug later. */
  useEffect(() => {
    if (at > count - 1) setAt(0);
  }, [at, count]);

  const go = (d: number) => setAt((v) => (v + d + count) % count);

  return (
    <div
      className="relative aspect-[4/3] overflow-hidden rounded-[24px] border border-line bg-eddo-tint"
      onKeyDown={(e) => {
        if (e.key === "ArrowLeft") go(-1);
        if (e.key === "ArrowRight") go(1);
      }}
      /* Swiping is how this is used on the phone it will mostly be read on,
         and two coordinates are all it takes. */
      onTouchStart={(e) => {
        touch.current = e.touches[0].clientX;
      }}
      onTouchEnd={(e) => {
        const from = touch.current;
        touch.current = null;
        if (from === null) return;
        const dx = e.changedTouches[0].clientX - from;
        if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
      }}
    >
      <div
        className="flex h-full w-full transition-transform duration-500 ease-out motion-reduce:transition-none"
        style={{ transform: `translate3d(-${at * 100}%, 0, 0)` }}
      >
        {drawn
          ? [
              <JettyScene key="a" className="h-full w-full shrink-0 grow-0 basis-full" />,
              <IsletScene key="b" warm className="h-full w-full shrink-0 grow-0 basis-full" />,
            ]
          : photos.map((p, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={p.src}
                src={p.src}
                /* Two widths, and the browser picks. Without this every screen
                   was sent the wide file: measured on a 390px phone, the box is
                   348 CSS pixels, so 696 real ones against 1440 sent, which is
                   three quarters of the bytes spent on detail the screen cannot
                   paint.

                   `sizes` has to describe the box and not the window, or the
                   browser works from the full width and picks the wide file
                   anyway. The 40px is the page's own side padding. */
                {...(p.narrow
                  ? {
                      srcSet: `${p.narrow} 720w, ${p.src} 1200w`,
                      sizes: "(min-width: 1024px) 560px, calc(100vw - 40px)",
                    }
                  : {})}
                alt={alt(i + 1, count)}
                /* All of them lazy, including the first.

                   It used to be eager, on the reasoning that the first picture
                   is the one the reader is waiting for. True of a picture at
                   the top of a page; this carousel is most of a screen further
                   down, and measuring showed the cost of that word: 262 KB
                   fetched before the page could be used, for a photograph
                   nobody had scrolled to. */
                loading="lazy"
                decoding="async"
                className="h-full w-full shrink-0 grow-0 basis-full object-cover"
              />
            ))}
      </div>

      {count > 1 && (
        <>
          <button
            type="button"
            onClick={() => go(-1)}
            aria-label={prev}
            className="absolute top-1/2 left-3 flex h-[40px] w-[40px] -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border-none bg-white/90 text-eddo-ink shadow-[0_6px_20px_-8px_rgba(18,52,58,.6)] transition-colors hover:bg-white"
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M15 5l-7 7 7 7" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => go(1)}
            aria-label={next}
            className="absolute top-1/2 right-3 flex h-[40px] w-[40px] -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border-none bg-white/90 text-eddo-ink shadow-[0_6px_20px_-8px_rgba(18,52,58,.6)] transition-colors hover:bg-white"
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* The count in words for a screen reader, the same count in figures
              for everyone else. */}
          <span className="sr-only" aria-live="polite">
            {counter(at + 1, count)}
          </span>
          <span
            aria-hidden="true"
            className="absolute top-4 right-4 rounded-full bg-eddo-ink/70 px-[10px] py-[4px] font-mono text-[11px] text-white"
          >
            {at + 1}/{count}
          </span>

          {/* Dots only while they can be told apart. Past a dozen they are a
              row of identical specks and the counter is doing the work. */}
          {count <= 12 && (
            <div className="absolute inset-x-0 bottom-4 flex justify-center gap-[7px]">
              {Array.from({ length: count }, (_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setAt(i)}
                  aria-label={counter(i + 1, count)}
                  aria-current={i === at}
                  className={`h-[7px] cursor-pointer rounded-full border-none transition-all ${
                    i === at ? "w-[20px] bg-white" : "w-[7px] bg-white/60 hover:bg-white/85"
                  }`}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
