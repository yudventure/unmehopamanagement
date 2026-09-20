"use client";

import { useEffect, useRef, useState } from "react";

import { SITE_CONFIG } from "@/lib/site-config";
import { youtubeEmbed, youtubeId, youtubeThumb } from "@/lib/video";

/**
 * The clip above the booking bar, from wherever the owner put it.
 *
 * Three sources, in the order somebody would reach for them: what the CMS
 * holds, an environment variable for a deployment that serves its media from
 * somewhere else, and `public/dive.mp4` for a file simply dropped into the
 * repository. The last one is a default rather than a promise — nothing is
 * drawn until a file is actually there, which is what `broken` below is for.
 *
 * The CMS field takes a YouTube address or a file, because those are the two
 * things an owner actually has. A file is the better of the two and the harder
 * to produce: no third party, no advertisement in front of somebody's holiday,
 * and a 200MB upload into a git repository that nobody should be asked to do.
 */
const CONFIGURED = (SITE_CONFIG.diveVideo ?? "").trim();
const FROM_ENV = (process.env.NEXT_PUBLIC_DIVE_VIDEO ?? "").trim();
const DEFAULT_FILE = "/dive.mp4";
const DIVE_POSTER = process.env.NEXT_PUBLIC_DIVE_POSTER ?? "";

/** What the page should try, given what has been filled in. */
export function diveVideoSrc(override?: string): string {
  const own = (override ?? "").trim();
  if (own) return own;
  if (CONFIGURED) return CONFIGURED;
  if (FROM_ENV) return FROM_ENV;
  return DEFAULT_FILE;
}

/** Whether anything at all has been filled in, for a screen that wants to say so. */
export function diveVideoSet(): boolean {
  return Boolean(CONFIGURED || FROM_ENV);
}

const BAND =
  "mx-auto w-full max-w-[818px] overflow-hidden rounded-[22px] border border-white/12 bg-black/40";

/**
 * A file, played here.
 *
 * `onError` is not enough and this is why: the element is server-rendered, so
 * the browser starts fetching the file and gives up on it **before React has
 * hydrated**. A handler attached after that has already happened never fires,
 * which left an empty player on a site with no video in it — the exact failure
 * this was written to avoid. So the error is read off the element on mount,
 * and listened for as well in case the fetch is still running.
 */
function FileVideo({ src, label }: { src: string; label: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [broken, setBroken] = useState(false);

  /* One effect, keyed on the address, and the order inside it matters.
     Clearing first and checking second is what makes a new address a fresh
     attempt — typing over a broken path in the CMS should try the new one
     rather than stay hidden — while still catching a file that had already
     failed before this ran. Split into two effects, the clear runs after the
     check and undoes it, and a missing file is drawn as an empty player
     forever. It was, until this was written the other way round. */
  useEffect(() => {
    setBroken(false);
    const el = ref.current;
    if (!el) return;
    const check = () => {
      if (el.error) setBroken(true);
    };
    /* Already failed while the page was still HTML. */
    check();
    el.addEventListener("error", check);
    return () => el.removeEventListener("error", check);
  }, [src]);

  if (broken) return null;

  return (
    <div className={BAND}>
      <video
        ref={ref}
        key={src}
        src={src}
        poster={DIVE_POSTER || undefined}
        controls
        playsInline
        /* Metadata, not the whole clip and not nothing: `none` leaves a
           150-pixel black bar until somebody presses play, because the
           browser does not yet know the shape of the thing. This is a few
           tens of kilobytes, and it buys the real dimensions and the first
           frame — a still of the diving with a play button on it, which is
           what a band like this should look like before it is pressed. */
        preload="metadata"
        aria-label={label}
        className="block h-auto max-h-[460px] w-full bg-black/40 object-contain"
      />
    </div>
  );
}

/**
 * A YouTube video, as a still until somebody asks for it.
 *
 * The embed is not drawn on load. YouTube's iframe is most of a megabyte of
 * script, and it is a third party watching a guest read about a homestay; on
 * the connection this site is actually read on — a phone on Mansuar, or one
 * abroad deciding whether to come — that is the single heaviest thing on the
 * page, in front of a clip most readers will not press. So what loads is the
 * still image, and the iframe is created by the press itself, on the domain
 * that sets nothing until then.
 */
function YouTubeVideo({
  id,
  label,
  play,
}: {
  id: string;
  label: string;
  play: string;
}) {
  const [playing, setPlaying] = useState(false);

  return (
    <div className={BAND}>
      <div className="relative aspect-video w-full">
        {playing ? (
          <iframe
            src={youtubeEmbed(id)}
            title={label}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            className="absolute inset-0 h-full w-full border-none"
          />
        ) : (
          <button
            type="button"
            onClick={() => setPlaying(true)}
            aria-label={`${play}: ${label}`}
            className="group absolute inset-0 h-full w-full cursor-pointer border-none bg-black/40 p-0"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={youtubeThumb(id)}
              alt=""
              loading="lazy"
              decoding="async"
              /* `cover` rather than `contain`: YouTube's still is always 4:3
                 with black bars baked into the top and bottom, so contained it
                 would draw its own letterbox inside ours. */
              className="absolute inset-0 h-full w-full object-cover"
            />
            <span
              aria-hidden="true"
              className="absolute top-1/2 left-1/2 flex h-[62px] w-[62px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-black/55 transition-colors group-hover:bg-black/75"
            >
              <svg viewBox="0 0 24 24" className="ml-[3px] h-[26px] w-[26px]">
                <path d="M8 5.5v13l11-6.5z" fill="#fff" />
              </svg>
            </span>
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * Where a clip goes, for a screen that should show the space even when it is
 * empty — which is the CMS and nowhere else.
 *
 * The public page draws nothing until there is something to draw: an empty
 * dashed rectangle on a page a guest is reading is an unfinished site, and
 * says so. The person who needs to see the empty space is the owner, in the
 * form where they are about to fill it.
 */
export function DiveVideoSlot({ text }: { text: string }) {
  return (
    <div className="flex aspect-video w-full max-w-[560px] flex-col items-center justify-center gap-[10px] rounded-[18px] border border-dashed border-line-strong bg-surface-mute px-6 text-center">
      <svg viewBox="0 0 24 24" className="h-7 w-7 text-slate-mute">
        <rect
          x="2.5"
          y="5.5"
          width="14"
          height="13"
          rx="2.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        />
        <path
          d="M16.5 10.5 21.5 8v8l-5-2.5z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      </svg>
      <span className="text-[12.5px] leading-[1.5] text-slate-soft">{text}</span>
    </div>
  );
}

export interface DiveVideoProps {
  /** Read out in place of the clip, for somebody who cannot see it. */
  label: string;
  /** On the button that loads a YouTube embed. */
  play: string;
  /** Overrides the configured address. The CMS passes what is being typed. */
  src?: string;
}

/** The band itself, or nothing at all when there is no clip to put in it. */
export function DiveVideo({ label, play, src }: DiveVideoProps) {
  const address = diveVideoSrc(src);
  if (!address) return null;

  const id = youtubeId(address);
  if (id) return <YouTubeVideo id={id} label={label} play={play} />;
  return <FileVideo src={address} label={label} />;
}
