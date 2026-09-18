"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Which section of a one-page site the reader is currently in.
 *
 * The bar's links were highlighting the first one always, because "which is
 * current" was answered by position in the list rather than by where the reader
 * had got to. On a page with five anchors that meant the nav said "Home" while
 * somebody was reading the questions at the foot of it.
 *
 * ## Why scroll position rather than an IntersectionObserver
 *
 * An observer answers "is this on screen", which is the wrong question here:
 * these sections differ in height by a factor of three, so two are on screen at
 * once for most of the page and the answer flickers between them depending on
 * which crossed the edge last. Reading the positions directly answers the
 * question actually being asked, which is "which section has the reader reached
 * and not yet left", and gives the same answer every time for the same scroll
 * offset.
 *
 * `offset` is the fixed bar, because a section whose heading is hidden behind
 * the bar has not been reached yet as far as the reader is concerned.
 *
 * ## The foot of the page
 *
 * The last section is usually short, so scrolling to the very bottom can stop
 * with its top still below the bar and the previous section still winning.
 * Then the nav points at something the reader has already scrolled past and
 * cannot get back to by scrolling further. At the bottom, the last one wins.
 */
export function useActiveSection(ids: string[], offset = 96) {
  const [active, setActive] = useState(ids[0] ?? "");

  /* The caller builds this array inside its own render, so it is a new array
     every time even when the ids have not changed. The joined string is what
     actually decides whether this has to be set up again. */
  const held = useRef(ids);
  held.current = ids;
  const key = ids.join("|");

  useEffect(() => {
    let queued = false;

    const read = () => {
      queued = false;
      const list = held.current;
      if (!list.length) return;

      const doc = document.documentElement;
      /* Two pixels of slack: a page whose height is a fraction lands a pixel
         short of its own bottom and would never qualify. */
      if (window.scrollY + window.innerHeight >= doc.scrollHeight - 2) {
        setActive(list[list.length - 1]);
        return;
      }

      /* The ids are in document order, so the last one whose top has passed
         the bar is the one the reader is inside. */
      let current = list[0];
      for (const id of list) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= offset) current = id;
      }
      setActive(current);
    };

    /* Scroll fires far more often than the screen is painted, and this reads
       layout, which is the one thing worth not doing sixty times between two
       frames. */
    const onScroll = () => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(read);
    };

    read();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [key, offset]);

  return active;
}
