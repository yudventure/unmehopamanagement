"use client";

import { useEffect } from "react";

/**
 * Brings `[data-reveal]` elements in as they reach the viewport, once each.
 *
 * Three decisions are worth the words:
 *
 * **The hidden state is CSS, not React.** Marking an element is a `data-reveal`
 * attribute in the markup and nothing else — no wrapper component, no extra
 * node, no state. This follows what `[data-sea]` and `[data-move]` already do
 * in this codebase, and it means a section can be marked without changing its
 * shape. It also keeps the movement to opacity and transform, so nothing here
 * can shift the layout, and an anchor still lands where it says it will.
 *
 * **Nothing is hidden until the browser has proved it can show it again.** The
 * rule that hides is behind `html[data-anim]`, which the root layout's inline
 * script sets before the first paint and drops again if this hook never
 * arrives. So the failure mode of every part of this, whether no JavaScript, no
 * IntersectionObserver or a bundle that never loaded, is the plain page and
 * never a blank one.
 *
 * A reader who has asked for less motion is no longer one of those cases. The
 * hook still runs for them and still marks each section as it arrives; the
 * stylesheet is what decides that the marking lands instantly instead of
 * sliding. Deciding it here meant deciding it for every animation at once,
 * which froze the line drawings on every Windows machine tuned for speed.
 *
 * **Revealing is one-way.** An element that has arrived is left alone and
 * unobserved. Fading things back out as they leave sounds tidier and is not:
 * it means the page flickers when someone scrolls back up to re-read
 * something, which is exactly when they want it to hold still.
 */
export function useReveal() {
  useEffect(() => {
    const root = document.documentElement;

    /* Not armed: the layout's failsafe has already given up, so the page is
       showing everything and there is nothing left to reveal. */
    if (!("anim" in root.dataset)) return;

    /* Claims the flag, which is what stops the failsafe from firing. */
    root.dataset.anim = "on";

    const marked = document.querySelectorAll<HTMLElement>("[data-reveal]");
    const show = (el: HTMLElement) => {
      el.dataset.shown = "";
    };

    if (!("IntersectionObserver" in window)) {
      marked.forEach(show);
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          show(entry.target as HTMLElement);
          io.unobserve(entry.target);
        }
      },
      {
        /*
         * Starts the moment a sliver clears the fold, so the movement is over
         * by the time the element is properly in front of the reader. Waiting
         * for a real fraction of it means they watch it arrive, and watching a
         * page arrive reads as the page being slow.
         *
         * Whatever is already on screen is caught by the observer's own first
         * callback, which runs before the next paint. It still animates,
         * because the first paint already happened with it hidden.
         */
        rootMargin: "0px 0px -8% 0px",
        threshold: 0.01,
      },
    );

    marked.forEach((el) => io.observe(el));

    /*
     * Anything marked that appears later is picked up too.
     *
     * This is a safety net rather than a feature, and it is here because of
     * what it catches. A `[data-reveal]` element that React replaces — a list
     * keyed on text that has just been translated, say — comes back as a fresh
     * node with no marker on it and nothing watching it, which means it stays
     * at zero opacity for good. The lists that could do that have stable keys
     * now, but "a section silently disappeared" is too expensive a way to find
     * out that a later one does not.
     */
    const added = new MutationObserver((records) => {
      for (const record of records) {
        for (const node of record.addedNodes) {
          if (!(node instanceof HTMLElement)) continue;
          if (node.matches("[data-reveal]:not([data-shown])")) io.observe(node);
          node
            .querySelectorAll<HTMLElement>("[data-reveal]:not([data-shown])")
            .forEach((el) => io.observe(el));
        }
      }
    });
    added.observe(document.body, { childList: true, subtree: true });

    return () => {
      io.disconnect();
      added.disconnect();
    };
  }, []);
}
