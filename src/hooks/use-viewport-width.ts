"use client";

import { useEffect, useState } from "react";

/**
 * The shell's layout switches on measured width rather than a media query:
 * the drawer has to overlay whenever sidebar (246px) + drawer (352px) would
 * squeeze the content column below ~560px, which is a decision about the
 * viewport *and* the open drawer — not something CSS alone can express.
 *
 * Starts at 1440 so server and first client render agree, then corrects on mount.
 *
 * Measured off `documentElement.clientWidth`, which is the layout viewport —
 * the same width a CSS media query would test — rather than `innerWidth`,
 * which on a phone reports the visual viewport and moves with pinch zoom.
 *
 * And watched with a ResizeObserver, not the resize event alone. A phone does
 * not have its layout viewport settled at mount: the browser applies
 * initial-scale and folds away its own chrome a frame or two later, and it does
 * not always fire `resize` when it does. Measured here on a 390px screen, the
 * first reading came back 670 and nothing ever corrected it, so the app spent
 * the whole session laid out for a tablet it was not running on. The observer
 * sees the change whether or not an event announces it.
 */
export function useViewportWidth(initial = 1440): number {
  const [vw, setVw] = useState(initial);

  useEffect(() => {
    const read = () =>
      setVw(document.documentElement.clientWidth || window.innerWidth);
    read();

    const ro = new ResizeObserver(read);
    ro.observe(document.documentElement);
    window.addEventListener("resize", read);
    window.addEventListener("orientationchange", read);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", read);
      window.removeEventListener("orientationchange", read);
    };
  }, []);

  return vw;
}
