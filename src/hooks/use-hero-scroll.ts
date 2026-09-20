"use client";

import { useEffect, useRef } from "react";

/**
 * Publishes how far the hero has been scrolled past, as `--p` on the element,
 * running 0 at rest to 1 when it has just left. The CSS decides what to do
 * with it.
 *
 * **Why the photograph scales instead of sliding.** The usual parallax moves
 * the picture at a fraction of the page's speed, which means it has to be
 * taller than its frame or it drags an empty edge into view. Making it taller
 * re-crops it, and this crop was chosen: the shot is banded, reef at the top,
 * huts across the middle, jungle at the foot, and centring is what keeps all
 * three and lands the huts just above the headline. A scale grows from that
 * same centre, so at rest the framing is untouched to the pixel, and there is
 * no edge to reveal at any point.
 *
 * **Why a custom property rather than styles per layer.** One number is
 * written per frame, to one element. The photograph, the scrim, and the words
 * each read it and do their own thing in the stylesheet, so adding a fourth
 * reaction costs a CSS rule and no more JavaScript.
 */
export function useHeroScroll<T extends HTMLElement>() {
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    /* Only when the reveal hook has taken charge. `data-anim` is dropped by
       the layout's failsafe when this never arrives, and a hero that reads a
       number nobody is writing would sit at its scrolled-past state for good.
       It is not a reduced-motion check: that decision is in the stylesheet,
       where it can be made per animation. */
    if (!el || document.documentElement.dataset.anim !== "on") return;

    let frame = 0;
    const write = () => {
      frame = 0;
      const height = el.offsetHeight || 1;
      /* Clamped, so a long page does not keep pushing the number past 1 and
         a rubber-band scroll upward does not push it below 0. */
      const p = Math.min(1, Math.max(0, window.scrollY / height));
      el.style.setProperty("--p", p.toFixed(4));
    };

    /* Coalesced to one write per frame. Scroll fires far more often than the
       screen updates, and the work here is a style write, which is the kind
       that costs nothing until it happens three times between two frames. */
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(write);
    };

    write();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return ref;
}
