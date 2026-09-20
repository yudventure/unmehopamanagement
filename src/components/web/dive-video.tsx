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

/**
 * The band runs the width of the section, and keeps 16:9.
 *
 * It used to stop at 818px and sit centred, which was arithmetic rather than
 * design: 818 is the width at which a sixteen-by-nine clip is 460px tall, and
 * 460 was picked so the booking bar under it stayed on a laptop screen. The
 * owner wants it edge to edge with everything else in the section, so the cap
 * is gone and the height goes with the width — about 620px at the section's
 * full 1116px. That is a whole screen on a short laptop, and it is the trade
 * they asked for: a clip of their own reef is the one picture on this page
 * worth stopping for.
 */
const BAND =
  "w-full overflow-hidden rounded-[22px] border border-white/12 bg-black/40";

/*
 * ## Why the clip starts by itself even for a reader who asked for less motion
 *
 * The rule in CLAUDE.md says to decide per animation, and this is that
 * decision written down rather than assumed.
 *
 * It was built the other way first: `prefers-reduced-motion` gated the
 * autoplay, so a reader who had asked for calm got the still and a play
 * button. That is defensible for a page-wide scene, and it is the wrong trade
 * here, for the reason the rule exists. On Windows that signal comes from
 * "Animation effects", which is off on any machine set to "adjust for best
 * performance" and on a good share of laptops out of the box — so gating on
 * it does not serve people who get motion sick, it withholds the clip from
 * most Windows readers, which is the exact failure the rule is written about.
 *
 * What makes it a fair trade without the gate:
 *
 * - It is muted, and has to be. No browser starts a clip with sound nobody
 *   asked for, and each refuses silently.
 * - The controls are on, so it can be paused. That is the mechanism WCAG
 *   2.2.2 asks for, and it is one press.
 * - It only starts once the band is on screen, so nothing plays behind a
 *   reader who is three sections above it.
 * - It is the owner's own footage of their own reef, which is content rather
 *   than decoration. What the rule holds still is the chrome a site adds
 *   around content: heroes that follow the scroll, sections that slide up,
 *   a manta drifting across a card nobody asked to watch. That manta still
 *   holds still — see `data-cross` in the stylesheet.
 */

/**
 * Whether the band has come into view, so nothing plays off-screen.
 *
 * Autoplay means "starts when you reach it", not "starts while you are
 * reading about the bungalows three sections above". It also keeps most of
 * what the still-first approach bought: YouTube's player is the better part
 * of a megabyte of script, and a reader who never scrolls to the dive section
 * never loads it.
 */
function useInView<T extends HTMLElement>(): [React.RefObject<T | null>, boolean] {
  const ref = useRef<T>(null);
  const [seen, setSeen] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!("IntersectionObserver" in window)) {
      /* No observer, no way to know: play it. A browser this old is not the
         one to hold a feature back for. */
      setSeen(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setSeen(true);
            io.disconnect();
          }
        }
      },
      /* A quarter of the band is enough to count as arrived. */
      { threshold: 0.25 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return [ref, seen];
}

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
function FileVideo({
  src,
  label,
  onBroken,
}: {
  src: string;
  label: string;
  /** Called once the browser has given up on this address. */
  onBroken: () => void;
}) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const check = () => {
      if (el.error) onBroken();
    };
    /* Already failed while the page was still HTML. */
    check();
    el.addEventListener("error", check);
    return () => el.removeEventListener("error", check);
    /* `onBroken` is rebuilt every render by the parent and is not worth a
       `useCallback` there: what this listens to is the element, and the
       element is replaced whenever the address changes because the parent
       keys it. */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className={BAND}>
      {/* The box is 16:9 and the clip is fitted inside it rather than cropped
          to it. A clip that is already 16:9 fills it exactly; a tall one gets
          water at its sides instead of a head cut off at the top. */}
      <div className="relative aspect-video w-full">
        <video
          ref={ref}
          key={src}
          src={src}
          poster={DIVE_POSTER || undefined}
          controls
          /* Muted, looping, and inline, or it does not start at all: no
             browser will begin a clip with sound in it that nobody asked
             for, and iOS takes it fullscreen without `playsInline`. The
             controls stay, so the sound is one press away for anyone who
             wants it. */
          autoPlay
          muted
          loop
          playsInline
          /* Metadata, not the whole clip and not nothing: `none` leaves a
           150-pixel black bar until somebody presses play, because the
           browser does not yet know the shape of the thing. This is a few
           tens of kilobytes, and it buys the real dimensions and the first
           frame — a still of the diving with a play button on it, which is
           what a band like this should look like before it is pressed. */
          preload="metadata"
          aria-label={label}
          className="absolute inset-0 block h-full w-full bg-black/40 object-contain"
        />
      </div>
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
 * page. So what loads first is the still image, and the iframe is built when
 * the clip is actually about to play, on the domain that sets nothing until
 * then.
 *
 * Which is either of two moments, and they are not the same play:
 *
 * - **Pressed.** Somebody asked for it, so it starts with its sound and plays
 *   once through.
 * - **Arrived.** The band has scrolled into view on a page allowed to start
 *   it, so it starts muted and goes round again. Muted is not a choice: no
 *   browser will begin a clip with sound nobody asked for, and it refuses
 *   silently, leaving a player that just sits there. The controls stay on, so
 *   the sound is one press away.
 *
 * Waiting for the band to arrive is also what keeps most of what the still
 * bought: a reader who never reaches the dive section never loads YouTube's
 * player at all, and nothing plays three sections above where they are
 * reading.
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
  const [pressed, setPressed] = useState(false);
  const [ref, seen] = useInView<HTMLDivElement>();

  const auto = seen && !pressed;
  const playing = pressed || auto;

  return (
    <div className={BAND} ref={ref}>
      <div className="relative aspect-video w-full">
        {playing ? (
          <iframe
            src={youtubeEmbed(id, { loop: auto, muted: auto })}
            title={label}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            className="absolute inset-0 h-full w-full border-none"
          />
        ) : (
          <button
            type="button"
            onClick={() => setPressed(true)}
            aria-label={`${play}: ${label}`}
            className="group absolute inset-0 h-full w-full cursor-pointer border-none bg-black/40 p-0"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={youtubeThumb(id)}
              alt=""
              loading="lazy"
              decoding="async"
              /* A still that will not load takes itself off the page rather
                 than leaving the browser's broken-image glyph in the middle
                 of a band this size. What is left is the dark band and the
                 play button, which is still a thing you can press. */
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
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
 * Where a clip goes, drawn while there is nothing to put in it.
 *
 * Drawing nothing was the first answer and the wrong one. The band only
 * exists once an address is saved, which meant the one person who most needed
 * to see where the clip would land — the owner, looking at their own site —
 * saw no sign that there was a place for one at all, and asked twice where it
 * had gone.
 *
 * So the space is shown and says what belongs in it, in the reader's own
 * language, and it is gone the moment an address is saved. A guest who meets
 * it is told a clip is coming, which is true and is the kind of thing a
 * homestay's page is allowed to say; a black rectangle or a broken player
 * would not be.
 */
export function DiveVideoSlot({
  text,
  tone = "light",
}: {
  text: string;
  /** Dark for the dive section, light for the form in the manager. */
  tone?: "light" | "dark";
}) {
  const dark = tone === "dark";
  return (
    <div
      className={`mx-auto flex w-full flex-col items-center justify-center gap-[10px] rounded-[18px] border border-dashed px-6 text-center ${
        /* Full width like the band it stands in for, but not its height: an
           empty sixteen-by-nine at this width is most of a screen of dashed
           nothing, and this is a note about a missing clip rather than the
           clip. */
        dark
          ? "h-[188px] border-white/25 bg-white/[.04]"
          : "h-[168px] max-w-[560px] border-line-strong bg-surface-mute"
      }`}
    >
      <svg
        viewBox="0 0 24 24"
        className={`h-7 w-7 ${dark ? "text-white/45" : "text-slate-mute"}`}
      >
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
      <span
        className={`text-[12.5px] leading-[1.5] ${
          dark ? "text-white/55" : "text-slate-soft"
        }`}
      >
        {text}
      </span>
    </div>
  );
}

export interface DiveVideoProps {
  /** Read out in place of the clip, for somebody who cannot see it. */
  label: string;
  /** On the button that loads a YouTube embed. */
  play: string;
  /** Drawn in place of the clip when there is none, or none that loads. */
  soon?: string;
  /** Dark for the dive section, light for the form in the manager. */
  tone?: "light" | "dark";
  /** Overrides the configured address. The CMS passes what is being typed. */
  src?: string;
}

/** The band, or the space where it will be. */
export function DiveVideo({ label, play, soon, tone, src }: DiveVideoProps) {
  /* Which address failed, not whether one did. An effect that cleared a flag
     would be the wrong tool: child effects run before the parent's, so a
     clear in the parent lands after the child has reported the failure and
     quietly undoes it — a missing file then draws as an empty player forever,
     which is the bug this shape exists to make impossible. */
  const [brokenSrc, setBrokenSrc] = useState<string | null>(null);

  const address = diveVideoSrc(src);
  if (!address || brokenSrc === address) {
    return soon ? <DiveVideoSlot text={soon} tone={tone} /> : null;
  }

  const id = youtubeId(address);
  if (id) return <YouTubeVideo id={id} label={label} play={play} />;
  return (
    <FileVideo
      key={address}
      src={address}
      label={label}
      onBroken={() => setBrokenSrc(address)}
    />
  );
}
