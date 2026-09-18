"use client";

import { useEffect, useRef, type RefObject } from "react";

/**
 * Closes something when the reader's attention goes elsewhere.
 *
 * A menu that can only be closed by the control that opened it is a menu a
 * reader has to aim at twice: once to give up on it, once to hit the small
 * round button they were not looking at. Everywhere else on the web, pressing
 * somewhere else is how you say no, and Escape is how a keyboard says it.
 *
 * ## Why it takes a list of elements
 *
 * The obvious version watches one box and closes when the press lands outside
 * it. That version breaks on the common arrangement, which is a trigger in one
 * place and a panel in another: pressing the trigger to close counts as
 * "outside the panel", so this fires, and then the trigger's own handler
 * toggles it back. The menu flickers shut and open, or refuses to close at all,
 * depending on which runs last.
 *
 * So the caller names every element that counts as "still inside", and nothing
 * fires until the press is outside all of them.
 *
 * ## Why pointerdown rather than click
 *
 * A click is only reported once the press and the release have both landed on
 * the same element. Press inside a menu, drag out, release, and no click is
 * ever reported, so the menu stays open with the reader pointing somewhere
 * else. `pointerdown` also covers mouse, pen and touch in one listener, which
 * is what "click or touch outside" actually means.
 */
export function useDismiss(
  boxes: RefObject<HTMLElement | null>[],
  onDismiss: () => void,
  active: boolean,
) {
  /* Held in a ref so that a caller passing an inline arrow, which is every
     caller, does not tear the listeners down and put them back on each render
     of the page around it. */
  const latest = useRef(onDismiss);
  latest.current = onDismiss;

  /* The array itself is new on every render even when its contents are not, so
     it cannot go in the dependency list without the same problem. Its length
     is what actually matters and never changes in practice. */
  const held = useRef(boxes);
  held.current = boxes;

  useEffect(() => {
    if (!active) return;

    const away = (e: PointerEvent) => {
      const target = e.target as Node | null;
      if (!target) return;
      const inside = held.current.some((b) => b.current?.contains(target));
      if (!inside) latest.current();
    };

    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") latest.current();
    };

    document.addEventListener("pointerdown", away);
    document.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("pointerdown", away);
      document.removeEventListener("keydown", key);
    };
  }, [active]);
}
