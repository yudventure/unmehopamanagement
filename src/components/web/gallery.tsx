"use client";

import { useCallback, useEffect, useState } from "react";

import type { GalleryItem } from "@/lib/gallery";
import type { SiteCopy } from "@/lib/web-content";

/**
 * A grid of photographs that opens one at a time.
 *
 * The lead photograph takes two columns because a gallery of equal squares has
 * no way to say which picture is the one to look at, and here it always is:
 * the aerial for the homestay, the manta for the diving.
 *
 * Everything is lazy below the first two. Six photographs at island upload
 * sizes weigh more than the rest of the page put together, and most visitors
 * will not scroll this far.
 *
 * One photograph is a shape, not a failure: with a single item the grid stands
 * down and it runs full width, which is the honest presentation of a gallery
 * that has one thing in it.
 */
export function Gallery({
  items,
  t,
  tone = "light",
}: {
  items: GalleryItem[];
  t: SiteCopy;
  /** `dark` for the diving section, which sits on ink. */
  tone?: "light" | "dark";
}) {
  const g = t.about.gallery;
  const [at, setAt] = useState<number | null>(null);
  const single = items.length === 1;

  const close = useCallback(() => setAt(null), []);
  const step = useCallback(
    (by: number) =>
      setAt((i) => (i === null ? null : (i + by + items.length) % items.length)),
    [items.length],
  );

  useEffect(() => {
    if (at === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    };
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", onKey);
    };
  }, [at, close, step]);

  const caption = (key: string) => g.captions[key] ?? "";
  const frame = tone === "dark" ? "bg-white/8" : "bg-surface-tint";

  return (
    <>
      <div
        className={
          single
            ? ""
            : /* Three columns, not four. With the lead taking two columns and
                 two rows, three columns leaves exactly five cells for the five
                 remaining photographs; four left one orphaned on its own row
                 beside a hole the width of half the page. */
              "grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3"
        }
      >
        {items.map((item, i) => (
          <button
            key={item.src}
            type="button"
            onClick={() => setAt(i)}
            aria-label={`${caption(item.caption)} — ${g.open}`}
            className={`group relative block cursor-pointer overflow-hidden rounded-[18px] border-none p-0 ${frame} ${
              single
                ? "aspect-[16/9] w-full"
                : i === 0
                  ? "col-span-2 aspect-[16/10] md:row-span-2 md:aspect-auto"
                  : "aspect-[4/3]"
            }`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={item.src}
              alt={caption(item.caption)}
              loading={i < 2 ? "eager" : "lazy"}
              decoding="async"
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
            />
            {/* Only the lead photograph carries its caption on the thumbnail.
                On the small ones the type would be larger than the picture. */}
            {(single || i === 0) && (
              /* The scrim carries most of its weight where the type actually
                 sits rather than fading evenly to the foot. Over the aerial,
                 a bright patch of jungle came through the old ramp and took
                 this caption to 4:1. The shadow is the second line: a
                 photograph can put anything anywhere, and a gradient cannot
                 know where. */
              <span className="pointer-events-none absolute inset-x-0 bottom-0 bg-[linear-gradient(180deg,rgba(6,20,18,0)_0%,rgba(6,20,18,.34)_28%,rgba(6,20,18,.78)_62%,rgba(6,20,18,.93)_100%)] px-5 pt-12 pb-4 text-left text-[13px] leading-[1.5] text-white [text-shadow:0_1px_10px_rgba(6,20,18,.85)]">
                {caption(item.caption)}
              </span>
            )}
          </button>
        ))}
      </div>

      {at !== null && (
        <div
          className="fixed inset-0 z-[90] flex flex-col bg-ink/92 p-3 backdrop-blur-sm sm:p-6"
          onClick={close}
        >
          <div className="flex items-center justify-between gap-4 px-1 pb-3">
            <span className="font-mono text-[12.5px] text-white/70">
              {at + 1} / {items.length}
            </span>
            <button
              type="button"
              onClick={close}
              aria-label={t.enquiry.close}
              className="flex h-[34px] w-[34px] cursor-pointer items-center justify-center rounded-full border border-white/25 bg-transparent text-[15px] text-white hover:bg-white/10"
            >
              ✕
            </button>
          </div>

          <div
            role="dialog"
            aria-modal="true"
            aria-label={caption(items[at].caption)}
            onClick={(e) => e.stopPropagation()}
            className="flex min-h-0 flex-1 items-center gap-2 sm:gap-4"
          >
            {items.length > 1 && (
              <Arrow dir="prev" label={g.prev} onClick={() => step(-1)} />
            )}

            {/* The image is absolutely placed inside a flex-sized box rather
                than being the flex item itself. An <img> carries an intrinsic
                aspect ratio, so at a fixed width its height is derived and it
                will not shrink below it however the flex rules are written —
                a tall photograph overflowed the screen and pushed its own
                caption off the bottom. Sizing the box and letting the picture
                letterbox inside it is the only version that holds. */}
            <figure className="m-0 flex min-h-0 flex-1 flex-col items-center justify-center gap-4">
              <div className="relative min-h-0 w-full flex-1">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={items[at].src}
                  alt={caption(items[at].caption)}
                  className="absolute inset-0 h-full w-full rounded-[14px] object-contain"
                />
              </div>
              <figcaption className="max-w-[620px] shrink-0 text-center text-[13.5px] leading-[1.55] text-white/80">
                {caption(items[at].caption)}
              </figcaption>
            </figure>

            {items.length > 1 && (
              <Arrow dir="next" label={g.next} onClick={() => step(1)} />
            )}
          </div>
        </div>
      )}
    </>
  );
}

function Arrow({
  dir,
  label,
  onClick,
}: {
  dir: "prev" | "next";
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="flex h-[44px] w-[44px] shrink-0 cursor-pointer items-center justify-center rounded-full border border-white/25 bg-ink/60 text-[18px] text-white hover:bg-white/15"
    >
      <span aria-hidden="true">{dir === "prev" ? "‹" : "›"}</span>
    </button>
  );
}
