"use client";

import { useEffect, useState } from "react";

/**
 * The shell's layout switches on measured width rather than a media query:
 * the drawer has to overlay whenever sidebar (246px) + drawer (352px) would
 * squeeze the content column below ~560px, which is a decision about the
 * viewport *and* the open drawer — not something CSS alone can express.
 *
 * Starts at 1440 so server and first client render agree, then corrects on mount.
 */
export function useViewportWidth(initial = 1440): number {
  const [vw, setVw] = useState(initial);

  useEffect(() => {
    const onResize = () => setVw(window.innerWidth);
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return vw;
}
