---
name: peta-wilayah-indonesia
description: Build a real, clickable map of somewhere in Indonesia (an island group, a strait, a regency, a village) from the government's own registers, so every coastline and every place name on it is checkable. Use whenever a page needs a map of an Indonesian place and the shapes or names would otherwise be drawn from memory or traced by eye. Covers which datasets to fetch and what is wrong with each of them, which sources are unreachable from a sandboxed session, the geometry the pipeline needs, the check that makes the build fail rather than ship a wrong name, and the interaction and motion pattern for the finished map.
---

# A map of an Indonesian place, from the registers

## The rule this exists to enforce

A coastline and a place name are facts. On a tourist map they are load-bearing
facts: somebody reads one and gets on a boat. So nothing on the map is drawn
or named from memory, and the build refuses to write the data file if a name
cannot be placed from an official source.

That check is not ceremony. On the first real run it caught the islet
north-east of Gam, which I had confidently labelled Friwen. It is Pulau Kurai;
Friwin is a different island several kilometres south. Had the check not been
there, the wrong name would have shipped and read as authoritative.

Three things follow from the rule:

- Shapes come from a register, never from tracing a screenshot or a video.
- Names come from a register, matched to a shape by dropping the register's
  own coordinate into the drawn polygon, not by eye.
- Anything the registers do not contain — how long a crossing takes, what the
  reef is like, where a homestay's jetty is — is left out and marked as
  missing, with a slot for the owner to fill.

## What is reachable, and what is not

From a sandboxed Claude Code session on this project, tested:

| Source | Works |
|---|---|
| `raw.githubusercontent.com` | yes |
| `github.com/.../releases/download/...` | yes |
| `api.github.com` (repos outside session scope) | **no**, 403 by policy |
| GitHub code/repo **search** API | **no**, blocked |
| Overpass (`overpass-api.de`, `overpass.kumi.systems`, `z.`) | **no** |
| `nominatim.openstreetmap.org`, `api.openstreetmap.org`, OSM tiles | **no** |
| `en.wikipedia.org`, `wikidata.org` over curl or `WebFetch` | **no** |
| `WebSearch` tool | yes, and it returns quoted coordinates |

So: fetch data by **exact raw URL** from GitHub. When a repo's file layout is
unknown and the API will not list it, `git clone --filter=tree:0 --no-checkout`
then `git ls-tree -r --name-only HEAD` gets the whole file list cheaply. That
is how `db/kel/96/wilayah_boundaries_kel_96.03.sql` was found after seven wrong
path guesses.

Use `WebSearch` to sanity-check a coordinate against an outside source before
trusting a dataset's convention. That is how the latitude-sign quirk below was
confirmed rather than assumed.

## The datasets

All three are public. The first two are the Indonesian government's own,
published under Kepmendagri 300.2.2-2430/2025.

**1. Village polygons — the shapes.**
`https://raw.githubusercontent.com/cahyadsn/wilayah_boundaries/master/db/kel/<PP>/wilayah_boundaries_kel_<PP.KK>.sql`
(`96` is Papua Barat Daya, `96.03` Raja Ampat). MIT. Rows are
`('kode','nama',lat,lng,'[[[[lat,lng],...]]]')`. In an archipelago a village
polygon is an island or a slice of one, so the union of them is the coastline.
This is the only source fine enough to contain Arborek, Friwin and Saonek.

**2. The island gazetteer — the names.**
`https://raw.githubusercontent.com/cahyadsn/wilayah/master/db/wilayah_pulau.sql`
MIT. Rows are `('kode','nama','lat','lng','status',luas,'notes')`: 17,106
officially named islands with a point and, for most, an area in km².

**3. OpenStreetMap land — only for grouping.**
`https://github.com/simonepri/geo-maps/releases/latest/download/earth-lands-100m.geo.json`
(112 MB; 250m is 78 MB and near-identical in Indonesia). CC-BY-SA 4.0 from
OSM, ODbL. A whole island is one ring in it, which is useful for saying which
village slices share an island and for holding an island that runs off the
frame. Do **not** use it for the coastline itself; see the ladder below.

Administrative names and codes, if needed:
`https://raw.githubusercontent.com/cahyadsn/wilayah/master/db/wilayah.sql`.

Fetch into a gitignored directory on demand, from the generator itself. Commit
the generated data file, not the 200 MB of sources.

## The resolution ladder, and where each one stops

Measured on the Dampier Strait box, which is about 65 km across:

| Source | Islands found |
|---|---|
| Natural Earth 10m | **3** (Waigeo, Gam, part of Batanta) |
| OSM land 250 m | 13 |
| OSM land 100 m | 13, essentially the same file here |
| Village polygons | everything, including 400 m Arborek |

The jump from 250 m to 100 m changed a 671-point ring to 682 points. The gap
is in the survey, not the simplification, so do not reach for a finer OSM file
expecting small islands to appear. Go to the village polygons instead.

## Quirks that will cost you an hour each

Every one of these was hit and verified.

- **Latitude is stored as a magnitude** in the island gazetteer's Papua Barat
  Daya block. Pulau Kri reads `'0.5608'` for an island at 0.5608 **south**.
  Confirmed three ways before relying on it: against a coordinate returned by
  `WebSearch`, against Wikipedia's figure for Batanta, and against the
  coastline file itself. Filtering without `-Math.abs()` silently returns
  seven islands instead of 632.
- **Village polygons are `[lat, lng]`**, the opposite of GeoJSON.
- **`geo-maps` files are a bare `GeometryCollection`**, not a FeatureCollection.
  Reading `osm.features` finds nothing and fails silently, and every island
  then looks like an island of its own.
- **One name, several islands.** There are two `Pulau Gam` in Papua Barat Daya,
  four degrees apart. `find(i => i.nama === name)` takes the wrong one. Try
  every record with the name and require exactly one to land on the map.
- **A village's published point is a register anchor, not a settlement.**
  Kemendagri puts Waisai 3.8 km from where Wikipedia has the town, and
  Kapisawar's point lands in open water north of the island it is on. Never
  draw a village dot at it.
- **Village polygons cross islands.** Yenbuba's covers Kri and the east tip of
  Mansuar; Saonek's covers its island and a piece of Waigeo. So "the villages
  on this island" cannot be derived from this data and should not be published
  as if it could. Area share and point-in-polygon both give plausible, wrong
  answers.

## The pipeline

Six steps. A complete working generator is `scripts/peta-dampier.mjs` in
yudventure/unmehopamanagement; if this skill has been copied into another repo
without it, start from that file.

### 1. Frame and projection

Pick the box by hand and say in a comment why the edges are where they are.
Equirectangular is exact enough near the equator: at 0.6° the longitude
correction is cos(0.6°) = 0.99994, under a metre across the whole map.

```js
const H = Math.round((W * (F.n - F.s)) / ((F.e - F.w) * Math.cos(LAT0)));
const px = (lat, lng) => [
  ((lng - F.w) / (F.e - F.w)) * W,
  ((F.n - lat) / (F.n - F.s)) * H,
];
```

### 2. Thin the rings — and mind the closed-ring trap

Douglas-Peucker pinned only at the first and last point of a **closed** ring
measures every other point as zero from a zero-length segment and throws the
whole island away. That is a silent bug: the map still renders, just without
Arborek. Pin a third point, the one furthest from the start, and thin the two
halves.

```js
function thin(pts, tol) {
  if (pts.length < 5) return pts;
  const last = pts.length - 1;
  const keep = new Uint8Array(pts.length);
  keep[0] = keep[last] = 1;
  let far = 0, best = -1;
  for (let i = 1; i < last; i++) {
    const d = Math.hypot(pts[i][0] - pts[0][0], pts[i][1] - pts[0][1]);
    if (d > best) { best = d; far = i; }
  }
  if (!far) return pts;
  keep[far] = 1;
  dp(pts, tol, keep, 0, far);
  dp(pts, tol, keep, far, last);
  return pts.filter((_, i) => keep[i]);
}
```

Scale the tolerance to the shape, `min(1.2, max(0.06, span / 45))`. A flat
tolerance that suits Waigeo's coast is the entire width of a small island.

### 3. Group slices into islands

Not by asking OpenStreetMap, which was tried: its Mansuar stops short of the
real one, so Yenbuba at the east tip fell outside and became its own island.
Group on the drawn shapes. Adjacent village boundaries do not share vertices
between files but they run within a few metres of each other, and no two
separate islands are that close — the narrowest channel in the Dampier Strait
is about a kilometre, eighteen pixels at a 1200-unit width.

Union-find over points bucketed into a grid the size of the threshold, so each
point looks at nine cells instead of at all sixteen thousand.

### 4. Name, and refuse to guess

For each place that gets a label, take its official record, drop its
coordinate on the map, and require exactly one island to contain it. Push
anything else onto a `problems` list and `process.exit(1)` before writing.
Checks worth having:

- the point lands in exactly one drawn island;
- no two labels land on the same island (the grouping merged something);
- every labelled island has a non-empty path (rounding can flatten a ring).

A point a few metres off its own coast is fine to resolve by nearest shape
within a small radius. A point off the frame entirely — Waigeo's official
point is 20 km north of the top edge — is resolved through the unclipped OSM
ring that contains it, then to the drawn island with most of its outline
inside that ring.

### 5. Place the labels

Not at the official point, which can sit offshore, off-frame, or on a headland
three villages away. Walk a grid over the island's drawn area and take the
point furthest from any edge, kept about 34 units clear of the frame edge so a
pill full of words still fits.

Per-island nudges belong in the **component**, not in the generated file: which
side a label sits on is a cartographer's decision, and in the data file it
would read as fact.

### 6. Emit small

Round to whole units and write relative `l` commands after the first `M`. On
the Dampier Strait that took the file from 29 kB gzipped to 10 kB, with no
visible difference: the frame is 1200 units wide and renders at most ~1080 px,
so a unit is already under a pixel. Drop shapes under ~1.6 units across, and
join everything unlabelled into one `REST` path — a hundred-odd objects each
with an id, a label and a null anchor cost more than the coastline.

## The map on the page

- **Islands are `<path>` in an SVG; labels are real HTML `<button>`s positioned
  over it** with `left: x/W*100%`. Buttons give focus rings, `aria-pressed`,
  keyboard access and text that does not scale with the map.
- Small islands get a dot at the anchor **and** a label offset from it. A label
  floating in water with nothing tying it to land sends the reader to the wrong
  place.
- The detail panel carries `aria-live="polite"`: pressing a button changes text
  elsewhere on the page, and a reader who cannot see the colour change has no
  other way of noticing.
- Selection must be carried by plain state — fill colour and button state — and
  never only by an animation.
- Tune label collisions at the narrowest width you support. Labels stay a fixed
  size as the map grows, so the phone is the only place they can collide.

### Motion

Follow the project's per-animation rule (see `CLAUDE.md`): decide for each
animation, never gate the lot behind `prefers-reduced-motion`. On a map, a
slow swell drifting a few units inside the box and a ring that opens once where
the reader just pressed both keep running — neither crosses the screen, and the
ring is a reply to a press rather than something arriving uninvited. Give the
ring `opacity: 0` at rest so that with no JavaScript it is simply absent.

Prove it with Playwright rather than asserting it:

```js
await browser.newContext({ reducedMotion: "reduce" });
```

Sample the computed transform twice a second apart under both settings, and
check that nothing on the map has `opacity: 0` or zero size because of it.

## Checking the result

A passing assertion will not catch a label sitting on top of another label or
an island hidden under its own pill. Render it and look at it, and also read
the rectangles back and compare them in numbers, at every width you support.

The test that found the real faults did this, per width (1440, 1024, 768, 390):

```js
const pins = [...document.querySelectorAll("#peta button[aria-pressed]")]
  .map((b) => ({ name: b.textContent.trim(), ...b.getBoundingClientRect().toJSON() }));
```

then asserted: every island has a button; no two rectangles intersect; all of
them sit inside the map's own rectangle; none is under 24 by 24. Plus, once:
pressing one changes the panel and lights exactly one island, pressing it
again clears it, the keyboard reaches it and the focus ring shows, and the
swell's computed transform differs a second apart under **both** motion
settings with nothing left at `opacity: 0`.

Two of those caught something. The overlap check found Friwin and Saonek
touching at 390 px and nowhere else. The "nothing hidden" check is what makes
the reduced-motion decision safe to keep.
