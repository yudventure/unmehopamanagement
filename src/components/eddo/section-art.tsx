/**
 * The line drawings that sit beside the section headings.
 *
 * One colour, no fills, and every one of them a thing that happens here: the
 * house on its stilts, the islands a boat trip goes to, the longboat that takes
 * you, and a turtle. They are drawn rather than photographed for the same
 * reason the rest of this site's artwork is — there are no photographs of most
 * of it yet — but unlike a placeholder these are not waiting to be replaced.
 * They are ornament, and they sit at about a third opacity so a heading still
 * wins the reader's eye.
 *
 * ## Why they are all built the same way
 *
 * Every scene is 96 tall with the water across the bottom at roughly the same
 * height, and drawn at the same units per pixel, so the four read as one set
 * however far apart on the page they land. Only the width varies with the room
 * a section has: three are 300 wide and the islands are 460. Everything is a
 * `<path>`, including the circles, because the draw-on below needs
 * `pathLength` and Safari has been late to that on the basic shapes.
 *
 * ## The two kinds of movement
 *
 * They arrive by being drawn: each stroke is one normalised unit long, starts
 * fully offset, and animates to nothing, so the line appears to be laid down.
 * The order is deliberate — ground first, then what stands on it, then what
 * moves through it — which is roughly how a person would draw the same scene.
 * That runs once, off the section's own reveal.
 *
 * Then a few parts keep moving for as long as the page is open: the water
 * drifts, the boat rocks, a fish crosses, bubbles rise. These are set going
 * after the drawing has finished, and they are transforms and nothing else, so
 * no frame of them costs a layout.
 *
 * All of it is in `globals.css` under "eddo section drawings", including the
 * rule that stops the lot when the reader has asked for less motion — in which
 * case the scenes are simply there, complete and still, which is what a
 * drawing normally is.
 *
 * ## What was wrong before it was right
 *
 * Four passes, each one because the thing had been rendered and looked at
 * rather than reasoned about. The karst rocks that Raja Ampat is known for
 * came out as apples, then as onions, then as tulips; at ninety pixels a lone
 * rounded silhouette on a waterline is a fruit, and the fix was to stop drawing
 * a rock and draw an island instead. The trees on it were first arrows and then
 * map pins before they were trees. A side-on snorkeller was a tadpole twice
 * over and was abandoned for the turtle, which reads at a glance and is also
 * what the sister dive centre down the beach is named after.
 */

import type React from "react";

/**
 * Shared attributes.
 *
 * Sized in attributes as well as in the viewBox: an `<svg>` carrying only a
 * viewBox has no intrinsic size, and while Chromium hands it the parent's box,
 * Safari hands it nothing at all.
 */
const ART = (w = 300) =>
  ({
    viewBox: `0 0 ${w} 96`,
    width: w,
    height: 96,
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.6,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": true,
    "data-art": "",
  }) as const;

/**
 * One drawn stroke, and `at` is when it starts.
 *
 * `pathLength` is the whole trick: it renormalises the path to one unit, so a
 * dash of 1 covers it exactly whether the stroke is a roof ridge or a wave
 * across the whole box. Without it every path would need measuring first.
 */
function S({ d, at = 0 }: { d: string; at?: number }) {
  return <path d={d} pathLength={1} data-draw style={{ animationDelay: `${at}ms` }} />;
}

/**
 * A wave across the box and beyond it, so drifting it cannot show an end.
 *
 * It starts a whole period off the left edge and runs a period past the right,
 * and the drift shifts it by exactly one period, which is what makes the loop
 * seamless. Widen the box and this has to grow with it, or the sea stops short
 * of the frame.
 */
function sea(y: number, amp: number, w = 300) {
  const n = Math.ceil((w + 144) / 24);
  let d = `M-48 ${y}q12 ${-amp} 24 0`;
  for (let i = 1; i < n; i += 1) d += "t24 0";
  return d;
}

// --------------------------------------------------------------- the scenes

/** Rooms: a house on stilts over the water, with the ladder guests go in by. */
export function HouseArt({ className }: { className?: string }) {
  return (
    <svg {...ART()} className={className}>
      {/* the shore, so the palm is standing on something */}
      <S d="M0 74c16-4 34-5 54-3" />
      <S d="M46 73C44 61 40 49 33 40" at={40} />
      <S d="M33 40C24 31 13 30 6 36" at={90} />
      <S d="M33 40C27 28 16 21 7 22" at={120} />
      <S d="M33 40C38 26 50 20 60 23" at={150} />
      <S d="M33 40C42 32 55 32 62 39" at={180} />
      {/* roof first, then the walls under it, then what holds it up */}
      <S d="M116 32 158 11l42 21" at={230} />
      <S d="M112 32h92" at={280} />
      <S d="M124 32v20" at={320} />
      <S d="M192 32v20" at={320} />
      <S d="M110 52h96" at={360} />
      <S d="M149 52V38h17v14" at={400} />
      <S d="M120 52v22" at={440} />
      <S d="M140 52v24" at={460} />
      <S d="M176 52v24" at={480} />
      <S d="M196 52v22" at={500} />
      {/* the ladder down into the sea */}
      <S d="M202 53l8 28" at={550} />
      <S d="M212 52l7 26" at={550} />
      <S d="M205 62h8" at={590} />
      <S d="M208 71h8" at={610} />
      <g data-drift>
        <S d={sea(79, 5)} at={650} />
      </g>
      <g data-drift="slow">
        <S d={sea(89, 4)} at={720} />
      </g>
    </svg>
  );
}

/**
 * Around us: the islands a day out goes to, birds over them, a fish under.
 *
 * The long one, 460 wide rather than 300. It has the top-right corner of its
 * section to itself since the button moved to the foot, and the same three
 * shapes stretched to fill that would have been three shapes with gaps; so it
 * gained a fourth island instead. The extra islands are the same drawings
 * moved sideways rather than new ones, which keeps every trunk on the ridge
 * point it was solved for.
 */
export function IslandArt({ className }: { className?: string }) {
  return (
    <svg {...ART(460)} className={className}>
      {/* A ridge meeting the water at both ends rather than a free-standing
          karst rock: the rock is the more truthful shape for Raja Ampat and
          the one that would not stop reading as fruit at this size.

          Every trunk starts at a point solved on the ridge curve, so no tree
          floats above the ground it stands on, and each crown is a pair of
          scallops rather than a disc, which at eight pixels was a map pin. */}
      <g transform="translate(66 0)">
        <S d="M92 77C104 74 112 66 122 58c8-6 16-6 24 0 10 8 18 16 32 19" />
        <S d="M113 65v-6" at={170} />
        <S d="M107 60q3-5 6 0 3-5 6 0" at={185} />
        <S d="M129 55v-8" at={215} />
        <S d="M122 48q3.5-6 7 0 3.5-6 7 0" at={230} />
        <S d="M155 65v-6" at={260} />
        <S d="M149.5 60q2.75-4.5 5.5 0 2.75-4.5 5.5 0" at={275} />
      </g>
      <g transform="translate(128 0)">
        <S d="M196 77c10-2 16-7 22-13 4-4 8-4 11 0 5 6 11 11 19 13" at={320} />
        <S d="M222 62v-6" at={400} />
        <S d="M217 57q2.5-4.5 5 0 2.5-4.5 5 0" at={415} />
      </g>
      <S d="M40 77c7-1 11-4 15-8 3-3 5-3 8 0 4 4 8 7 13 8" at={445} />
      <g transform="translate(378 0)">
        <S d="M40 77c7-1 11-4 15-8 3-3 5-3 8 0 4 4 8 7 13 8" at={470} />
        <S d="M55 69v-5" at={490} />
        <S d="M50.5 64.5q2.25-4 4.5 0 2.25-4 4.5 0" at={505} />
      </g>
      <g data-glide>
        <S d="M22 20q6-5 11 0" at={520} />
        <S d="M33 20q6-5 11 0" at={545} />
        <S d="M29 29q4-4 8 0" at={570} />
      </g>
      <g data-drift>
        <S d={sea(77, 5, 460)} at={600} />
      </g>
      <g data-swim>
        <S d="M296 88c5-5 15-5 20 0-5 5-15 5-20 0z" at={660} />
        <S d="M296 88l-6-4v8z" at={690} />
      </g>
    </svg>
  );
}

/** What we arrange: the longboat, which is how everything here happens. */
export function BoatArt({ className }: { className?: string }) {
  return (
    <svg {...ART()} className={className}>
      <g data-bob>
        <S d="M38 56h174" />
        <S d="M44 56c10 16 38 21 78 21s68-5 78-21" at={70} />
        <S d="M38 56l-9-12" at={160} />
        <S d="M212 56l7-9" at={190} />
        <S d="M74 56V44h76v12" at={230} />
        <S d="M69 44h86" at={290} />
        {/* The motor on the transom. It is twenty pixels of cowling and a leg
            in the water, and at that size no amount of detail makes it read as
            an engine on its own — what says the boat is under power is the
            wake below, which is why that is dashed and moving. */}
        <S d="M206 40h18v12h-18z" at={340} />
        <S d="M217 52l6 14" at={430} />
        <S d="M219 66h9" at={460} />
      </g>
      <path data-wake d="M230 67c14 3 26 4 42 2" />
      <path data-wake d="M233 75c11 2 20 2 30 1" />
      <g data-drift>
        <S d={sea(73, 5)} at={470} />
      </g>
      <g data-drift="slow">
        <S d={sea(87, 4)} at={540} />
      </g>
    </svg>
  );
}

/** Questions: a turtle, which is what is under the jetty and what the dive
 *  centre next door is called. */
export function TurtleArt({ className }: { className?: string }) {
  return (
    <svg {...ART()} className={className}>
      <g data-bob>
        <S d="M116 54c0-13 15-22 34-22s34 9 34 22-15 22-34 22-34-9-34-22z" />
        <S d="M128 44c13-5 31-5 44 0" at={220} />
        <S d="M126 62c14 5 34 5 48 0" at={270} />
        <S d="M142 40v-7" at={310} />
        <S d="M158 40v-7" at={325} />
        <S d="M142 66v7" at={340} />
        <S d="M158 66v7" at={355} />
        <S d="M184 48c10-3 19 1 20 6s-9 9-20 6" at={380} />
        <S d="M197 51h.5" at={430} />
        <S d="M172 38c5-10 17-17 25-15 2 6-5 15-15 19" at={450} />
        <S d="M170 70c6 9 18 14 25 11 1-5-7-12-17-15" at={500} />
        <S d="M120 66c-10 4-16 10-14 14 6 3 14-3 19-10" at={550} />
      </g>
      <path data-rise d="M204 34a2.4 2.4 0 1 0 4.8 0 2.4 2.4 0 1 0-4.8 0" style={{ animationDelay: "200ms" }} />
      <path data-rise d="M212 38a1.7 1.7 0 1 0 3.4 0 1.7 1.7 0 1 0-3.4 0" style={{ animationDelay: "1500ms" }} />
      <g data-swim>
        <S d="M64 82c5-5 15-5 20 0-5 5-15 5-20 0z" at={640} />
        <S d="M64 82l-6-4v8z" at={670} />
      </g>
      {/* The surface, far above, so the turtle is plainly underneath it. */}
      <g data-drift>
        <S d={sea(14, 4)} at={700} />
      </g>
    </svg>
  );
}

/**
 * What each of them is wrapped in, so the four sit the same way.
 *
 * `h-auto` is not decoration. The `height` attribute above is there so Safari
 * gives the thing a size at all, and it keeps that 96 whatever width a
 * utility class sets: the drawing then letterboxes inside a box taller than
 * itself, leaving a band of nothing above and below that only shows up as a
 * gap under a heading. Letting the height follow the width fixes it, and the
 * attribute still does its job before the stylesheet arrives.
 */
export const ART_BOX = "h-auto shrink-0 text-eddo-deep/35";
