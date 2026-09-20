/**
 * Build `src/lib/dampier.ts`: the Dampier Strait, ready to draw.
 *
 * Sources, both public and both read rather than recalled:
 *
 *  1. Village polygons and village points, Kemendagri, Kepmendagri
 *     300.2.2-2430/2025, via github.com/cahyadsn/wilayah_boundaries. In an
 *     archipelago a village polygon is an island or a slice of one, so their
 *     union is the coastline. These are the shapes on the map.
 *  2. The island gazetteer from the same decree, via github.com/cahyadsn/
 *     wilayah. This is where every island NAME comes from.
 *  3. OpenStreetMap land at 100 m, via github.com/simonepri/geo-maps. Used
 *     for one thing only: a whole island is one ring in it, so it says which
 *     village slices belong to the same island.
 *
 * Nothing here is drawn or named from memory. The check that makes that true
 * is at the bottom: each island on the pill list is found by dropping its
 * official gazetteer point onto the map, and the build fails if that point
 * does not land inside exactly one island. It has already caught one error,
 * an islet north-east of Gam that is Pulau Kurai and not, as I had it, Friwen.
 *
 * Two quirks of the sources, both verified before being relied on:
 *  - the gazetteer stores Papua Barat Daya latitudes as magnitudes, so Kri
 *    reads 0.5608 for an island at 0.5608 SOUTH;
 *  - the village file stores coordinates as [lat, lng], the opposite way round
 *    from GeoJSON.
 *
 * Run: npm run peta
 *
 * It fetches its three sources into `.peta-sumber/` the first time, which is
 * about two hundred megabytes and is not in git. Nothing else in the build
 * needs them: `src/lib/dampier.ts` is committed, and this only has to run
 * again if the frame moves or another island is added to the list above.
 */
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
/* Two hundred megabytes of public data. Not in git, and not needed unless the
   map itself is being rebuilt, which is why this fetches them on demand. */
const HERE = join(ROOT, ".peta-sumber");
const OUT = join(ROOT, "src", "lib", "dampier.ts");

const SOURCES = {
  "desa9603.sql":
    "https://raw.githubusercontent.com/cahyadsn/wilayah_boundaries/master/db/kel/96/wilayah_boundaries_kel_96.03.sql",
  "pulau.sql": "https://raw.githubusercontent.com/cahyadsn/wilayah/master/db/wilayah_pulau.sql",
  "lands-100m.geo.json":
    "https://github.com/simonepri/geo-maps/releases/latest/download/earth-lands-100m.geo.json",
};

mkdirSync(HERE, { recursive: true });
for (const [name, url] of Object.entries(SOURCES)) {
  const at = join(HERE, name);
  if (existsSync(at) && statSync(at).size > 1000) continue;
  console.log(`mengunduh ${name} ...`);
  execFileSync("curl", ["-sSL", "--fail", "-o", at, url], { stdio: "inherit" });
}
const read = (name) => readFileSync(join(HERE, name), "utf8");

/* The frame. Waisai in the top right, Batanta's north coast along the bottom,
   Mansuar and Kri in the middle of the water. It stops short of Piaynemo and
   the Fam group on the west on purpose: those are a different day out, and a
   frame that reaches them shrinks the strait itself to nothing. */
const FRAME = { w: 130.4, e: 130.98, s: -0.875, n: -0.355 };
const W = 1200;

/**
 * The islands that get a label and can be clicked, by their official name.
 *
 * Choosing which places a guest cares about is a design decision and is made
 * here, by hand. Where each one sits on the map is not a decision, and is not
 * made here: it is read from the gazetteer and checked below.
 */
const PILLS = [
  { gaz: "Pulau Waigeo", id: "waigeo" },
  { gaz: "Pulau Gam", id: "gam" },
  { gaz: "Pulau Mansuar", id: "mansuar" },
  { gaz: "Pulau Kri", id: "kri" },
  { gaz: "Pulau Batanta", id: "batanta" },
  { gaz: "Pulau Friwin", id: "friwin" },
  { gaz: "Pulau Saonek", id: "saonek" },
  /* Arborek is a village on an island the island gazetteer does not list, so
     its name and its shape both come from the village file. */
  { desa: "Arborek", id: "arborek" },
];

// ------------------------------------------------------------- projection

const LAT0 = ((FRAME.s + FRAME.n) / 2) * (Math.PI / 180);
const H = Math.round((W * (FRAME.n - FRAME.s)) / ((FRAME.e - FRAME.w) * Math.cos(LAT0)));
const px = (lat, lng) => [
  ((lng - FRAME.w) / (FRAME.e - FRAME.w)) * W,
  ((FRAME.n - lat) / (FRAME.n - FRAME.s)) * H,
];

// ------------------------------------------------------------- the sources

/** Village polygons and points. */
const villageSql = read("desa9603.sql");
const villageRow = /\('(96\.03\.[\d.]+)','([^']*)',(-?[\d.]+),(-?[\d.]+),'(\[.*?\])'\)/g;
const villages = [];
for (let m; (m = villageRow.exec(villageSql)); ) {
  let path;
  try {
    path = JSON.parse(m[5]);
  } catch {
    continue;
  }
  villages.push({ kode: m[1], nama: m[2], lat: +m[3], lng: +m[4], path });
}

/** The island gazetteer, Papua Barat Daya only. */
const gazSql = read("pulau.sql");
const gazRow = /\('(96\.[\d.]+)','([^']+)','(-?[\d.]+)','(-?[\d.]+)','([^']*)',(NULL|[\d.]+),/g;
const islands = [];
for (let m; (m = gazRow.exec(gazSql)); ) {
  islands.push({
    nama: m[2],
    lat: -Math.abs(+m[3]),
    lng: +m[4],
    luas: m[6] === "NULL" ? null : +m[6],
  });
}

/** OpenStreetMap land, used only to say which village slices share an island. */
const osm = JSON.parse(read("lands-100m.geo.json"));
const osmRings = [];
{
  const walk = (node) => {
    if (!Array.isArray(node) || node.length === 0) return;
    if (typeof node[0][0] === "number") osmRings.push(node);
    else node.forEach(walk);
  };
  /* This file is a bare GeometryCollection, not a FeatureCollection: reading
     it as features silently found nothing, and every island then looked like
     an island of its own. */
  const eat = (g) => {
    if (!g) return;
    if (g.type === "GeometryCollection") g.geometries.forEach(eat);
    else if (g.type === "FeatureCollection") g.features.forEach((f) => eat(f.geometry));
    else if (g.type === "Feature") eat(g.geometry);
    else walk(g.coordinates);
  };
  eat(osm);
}
if (!osmRings.length) {
  console.error("tidak ada cincin OSM terbaca; bentuk berkasnya berubah");
  process.exit(1);
}
/* Generous margin: an island half outside the frame still groups the village
   slices that are inside it. */
const M = 0.25;
const osmHere = osmRings.filter((r) =>
  r.some(
    ([x, y]) =>
      x >= FRAME.w - M && x <= FRAME.e + M && y >= FRAME.s - M && y <= FRAME.n + M,
  ),
);

// ------------------------------------------------------------------ geometry

/** Ray casting. `pt` and the ring are both [x, y] in the same order. */
function inside(ring, px_, py_) {
  let hit = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    if (yi > py_ !== yj > py_ && px_ < ((xj - xi) * (py_ - yi)) / (yj - yi) + xi) hit = !hit;
  }
  return hit;
}

function dp(pts, tol, keep, a, b) {
  const stack = [[a, b]];
  while (stack.length) {
    const [i0, i1] = stack.pop();
    const [ax, ay] = pts[i0];
    const [bx, by] = pts[i1];
    const dx = bx - ax;
    const dy = by - ay;
    const len = Math.hypot(dx, dy) || 1;
    let far = -1;
    let best = tol;
    for (let i = i0 + 1; i < i1; i++) {
      const [x, y] = pts[i];
      const d = Math.abs(dy * x - dx * y + bx * ay - by * ax) / len;
      if (d > best) {
        best = d;
        far = i;
      }
    }
    if (far > 0) {
      keep[far] = 1;
      stack.push([i0, far], [far, i1]);
    }
  }
}

/**
 * Douglas-Peucker, pinned at three points rather than two.
 *
 * A closed ring begins and ends on the same point. Pinned only at those two,
 * every other point measures zero from the line between them and the whole
 * island is thrown away: that is why Arborek was missing from the first draw.
 * So the point furthest from the start is pinned as well and the ring is
 * thinned as two halves.
 */
function thin(pts, tol) {
  if (pts.length < 5) return pts;
  const last = pts.length - 1;
  const keep = new Uint8Array(pts.length);
  keep[0] = keep[last] = 1;
  let far = 0;
  let best = -1;
  for (let i = 1; i < last; i++) {
    const d = Math.hypot(pts[i][0] - pts[0][0], pts[i][1] - pts[0][1]);
    if (d > best) {
      best = d;
      far = i;
    }
  }
  if (!far) return pts;
  keep[far] = 1;
  dp(pts, tol, keep, 0, far);
  dp(pts, tol, keep, far, last);
  return pts.filter((_, i) => keep[i]);
}

// ------------------------------------------------- village rings, projected

const PAD = 8;
const near = ([x, y]) => x >= -PAD && x <= W + PAD && y >= -PAD && y <= H + PAD;

const shapes = [];
for (const v of villages) {
  const walk = (node) => {
    if (!Array.isArray(node) || node.length === 0) return;
    if (typeof node[0][0] !== "number") {
      node.forEach(walk);
      return;
    }
    const pts = node.map(([lat, lng]) => px(lat, lng));
    if (!pts.some(near)) return;
    const span = Math.max(
      Math.max(...pts.map((p) => p[0])) - Math.min(...pts.map((p) => p[0])),
      Math.max(...pts.map((p) => p[1])) - Math.min(...pts.map((p) => p[1])),
    );
    /* Tolerance scaled to the shape. A flat 0.7 px is nothing against
       Waigeo's coast and is the whole of Arborek, which is four pixels tall. */
    /* A shape under a pixel and a half is a speck of ink in the sea. Twenty
       of them cost more bytes than Batanta and none of them can be seen. */
    if (span < 1.6) return;
    const t = thin(pts, Math.min(1.2, Math.max(0.06, span / 45)));
    if (t.length < 4) return;
    shapes.push({
      kode: v.kode,
      desa: v.nama,
      /* The mean of the ring's own points, un-projected, because grouping
         asks the OSM rings and those are in degrees. The mean and not a
         vertex: a vertex of a village polygon sits exactly on the coastline,
         where inside-or-outside is a coin toss. */
      probe: [
        node.reduce((n, p) => n + p[0], 0) / node.length,
        node.reduce((n, p) => n + p[1], 0) / node.length,
      ],
      pts: t,
      span,
    });
  };
  walk(v.path);
}

// ----------------------------------------------------------------- grouping

/**
 * Which village slices are the same island.
 *
 * Asked of the drawn shapes themselves, not of OpenStreetMap. OSM was tried
 * first and its Mansuar stops short of the real one, so Yenbuba at the east
 * tip fell outside and became an island of its own. Village boundaries that
 * run overland do not share vertices between files, but they do run within a
 * few metres of each other, and no two separate islands here are anywhere
 * near that close: the narrowest channel, Kri to Mansuar, is about a
 * kilometre, which is eighteen of these pixels.
 */
const JOIN = 1.4; // px, about 78 m at this scale
const parent = shapes.map((_, i) => i);
const find = (i) => (parent[i] === i ? i : (parent[i] = find(parent[i])));
const union = (a, b) => {
  const ra = find(a);
  const rb = find(b);
  if (ra !== rb) parent[rb] = ra;
};

/* Bucketed by a grid the size of the threshold, so each point only has to
   look at the nine cells around it instead of at all sixteen thousand. */
const cells = new Map();
shapes.forEach((s, i) => {
  for (const [x, y] of s.pts) {
    const k = `${Math.floor(x / JOIN)}:${Math.floor(y / JOIN)}`;
    if (!cells.has(k)) cells.set(k, []);
    cells.get(k).push([x, y, i]);
  }
});
for (const [k, list] of cells) {
  const [cx, cy] = k.split(":").map(Number);
  for (let dx = 0; dx <= 1; dx++) {
    for (let dy = -1; dy <= 1; dy++) {
      if (dx === 0 && dy < 0) continue;
      const other = cells.get(`${cx + dx}:${cy + dy}`);
      if (!other) continue;
      for (const [x1, y1, i] of list) {
        for (const [x2, y2, j] of other) {
          if (i === j) continue;
          if (Math.hypot(x1 - x2, y1 - y2) <= JOIN) union(i, j);
        }
      }
    }
  }
}

const groups = new Map();
shapes.forEach((s, i) => {
  const g = `g${find(i)}`;
  if (!groups.has(g)) groups.set(g, []);
  groups.get(g).push(s);
});

/**
 * A ring as an SVG path, written as small as it can be drawn.
 *
 * Whole units, and relative moves after the first. The frame is 1200 units
 * wide and the widest this is ever rendered is about 1080 pixels, so a unit is
 * already less than a pixel and a tenth of one is a number nobody can see.
 * Rounding first and then dropping the points that land on top of each other
 * took the file from 29 kB over the wire to well under twenty, which on a
 * phone on Waigeo is the difference between a map and a wait.
 */
const path = (s) => {
  const pts = [];
  for (const [x, y] of s.pts) {
    const p = [Math.round(x), Math.round(y)];
    const last = pts[pts.length - 1];
    if (!last || last[0] !== p[0] || last[1] !== p[1]) pts.push(p);
  }
  if (pts.length < 4) return "";
  let d = `M${pts[0][0]} ${pts[0][1]}`;
  let [px_, py_] = pts[0];
  for (const [x, y] of pts.slice(1)) {
    d += `l${x - px_} ${y - py_}`;
    px_ = x;
    py_ = y;
  }
  return d + "Z";
};

// ------------------------------------------------------------------- naming

const problems = [];

/**
 * Which island holds this lat/lng?
 *
 * The OSM rings are asked first, and in degrees, because they are whole
 * islands and they do not stop at the frame. Waigeo's official point is a
 * third of a degree north of the top edge; the island it names is very much
 * on the map, and only the unclipped ring can say so.
 */
function groupAt(lat, lng) {
  const [x, y] = px(lat, lng);
  if (x >= 0 && x <= W && y >= 0 && y <= H) {
    const hits = [];
    for (const [g, list] of groups) {
      if (list.some((s) => inside(s.pts, x, y))) hits.push(g);
    }
    if (hits.length) return hits;
  }
  /* Off the frame, or a few metres off its own coast. The OSM rings are whole
     islands and do not stop at the frame, so the one holding the point says
     which island it is; the drawn island is then the one with most of its
     outline inside that ring. Waigeo needs this: its official point is twenty
     kilometres north of the top edge, on an island that fills the corner. */
  const h = osmHere.findIndex((r) => inside(r, lng, lat));
  if (h < 0) return [];
  let bestG = null;
  let bestN = 0;
  for (const [g, list] of groups) {
    let n = 0;
    for (const s of list) {
      for (const [sx, sy] of s.pts) {
        const lngAt = FRAME.w + (sx / W) * (FRAME.e - FRAME.w);
        const latAt = FRAME.n - (sy / H) * (FRAME.n - FRAME.s);
        if (inside(osmHere[h], lngAt, latAt)) n++;
      }
    }
    if (n > bestN) {
      bestN = n;
      bestG = g;
    }
  }
  return bestG ? [bestG] : [];
}

/**
 * Where to put the label: the roomiest spot on the island, inside the frame.
 *
 * Not the official point, which is an anchor in a register and can sit off
 * the coast, off the frame, or on a headland three villages away. A grid is
 * walked over the island's drawn area and the point furthest from any edge
 * wins, so the words land on land and away from the water.
 */
function roomiest(list) {
  const xs = list.flatMap((s) => s.pts.map((p) => p[0]));
  const ys = list.flatMap((s) => s.pts.map((p) => p[1]));
  /* Kept well clear of the edge: the label is a pill with words in it, and
     Batanta's widest visible point is on the very bottom line of the frame. */
  const EDGE = 34;
  const lo = { x: Math.max(EDGE, Math.min(...xs)), y: Math.max(EDGE, Math.min(...ys)) };
  const hi = {
    x: Math.min(W - EDGE, Math.max(...xs)),
    y: Math.min(H - EDGE, Math.max(...ys)),
  };
  if (hi.x < lo.x || hi.y < lo.y) return null;
  const step = Math.max(2, Math.min(hi.x - lo.x, hi.y - lo.y) / 24);
  let best = null;
  let bestD = -1;
  for (let x = lo.x; x <= hi.x; x += step) {
    for (let y = lo.y; y <= hi.y; y += step) {
      if (!list.some((s) => inside(s.pts, x, y))) continue;
      let d = Infinity;
      for (const s of list) {
        for (const [sx, sy] of s.pts) {
          const e = Math.hypot(sx - x, sy - y);
          if (e < d) d = e;
        }
      }
      if (d > bestD) {
        bestD = d;
        best = [+x.toFixed(1), +y.toFixed(1)];
      }
    }
  }
  return best;
}

const pills = [];
for (const p of PILLS) {
  /* One name can be held by several islands across the province: there are
     two Pulau Gam in Papua Barat Daya, and the first in file order is the one
     four degrees away. So every record with the name is tried and exactly one
     of them has to land on this map. */
  const label = p.gaz ? p.gaz.replace(/^Pulau /, "") : p.desa;
  const records = p.gaz
    ? islands.filter((i) => i.nama === p.gaz)
    : villages.filter((v) => v.nama === p.desa);
  if (!records.length) {
    problems.push(`sumber tidak punya "${label}"`);
    continue;
  }
  const landed = records
    .map((r) => ({ r, hits: groupAt(r.lat, r.lng) }))
    .filter((c) => c.hits.length === 1);
  if (landed.length > 1) {
    problems.push(`"${label}" cocok dengan ${landed.length} pulau di peta ini`);
    continue;
  }
  const { lat, lng } = landed[0]?.r ?? records[0];
  let hits = landed[0]?.hits ?? groupAt(lat, lng);
  if (hits.length !== 1) {
    /* The gazetteer point is a label anchor, not a centroid, and on a narrow
       island it can sit a few metres offshore. Nearest shape within 4 px is
       still an unambiguous answer; anything further is a real disagreement
       between the two files and must be reported, not papered over. */
    const [x, y] = px(lat, lng);
    let bestG = null;
    let bestD = 4;
    for (const [g, list] of groups) {
      for (const s of list) {
        for (const [sx, sy] of s.pts) {
          const d = Math.hypot(sx - x, sy - y);
          if (d < bestD) {
            bestD = d;
            bestG = g;
          }
        }
      }
    }
    if (bestG) hits = [bestG];
  }
  if (hits.length !== 1) {
    problems.push(
      `"${label}" (${lat.toFixed(4)}, ${lng.toFixed(4)}) jatuh di ${hits.length} pulau`,
    );
    continue;
  }
  pills.push({
    id: p.id,
    label,
    group: hits[0],
    lat,
    lng,
    /* Stated by the gazetteer, blank there for the big inhabited islands. */
    km2: landed[0]?.r?.luas ?? null,
  });
}

/* An island with a name and no coastline. Possible in principle: the paths
   are rounded to whole units at the end, and a ring small enough to round
   down to a line would leave a label pointing at empty water. */
for (const p of pills) {
  const drawn = groups.get(p.group) ?? [];
  if (!drawn.map(path).join("")) problems.push(`"${p.label}" tidak punya bentuk apa pun`);
}

/* Two pills on one island would mean the grouping merged islands it should
   not have. Caught rather than drawn. */
const byGroup = new Map();
for (const p of pills) {
  if (byGroup.has(p.group)) {
    problems.push(`"${p.label}" dan "${byGroup.get(p.group)}" jatuh di pulau yang sama`);
  }
  byGroup.set(p.group, p.label);
}

if (problems.length) {
  console.error("PEMERIKSAAN GAGAL:");
  problems.forEach((p) => console.error("  " + p));
  process.exit(1);
}

// --------------------------------------------------------- what else is known
//
// Villages were going to be listed per island and are not, because the claim
// would not have been true. A village polygon here is an administrative area,
// not an island: Yenbuba's covers Kri and the east tip of Mansuar, Saonek's
// covers its island and a piece of Waigeo, and whichever island got the
// larger share of the drawing got the name. Kemendagri's village point cannot
// settle it either, being a register anchor rather than a settlement, 3.8 km
// from the town in Waisai's case.
//
// So the only thing added to the name is the island's own official area,
// which the gazetteer states outright. Everything a guest actually wants,
// how long the crossing takes and what the reef is like, is not in any of
// these files and comes from the family through `content/site.json`.

// The area travels with the record the naming step actually matched, so the
// two Pulau Gam cannot hand each other their figures.

// ------------------------------------------------------------------- output

const islandsOut = [];
for (const [g, list] of groups) {
  const pill = pills.find((p) => p.group === g);
  islandsOut.push({
    id: pill?.id ?? null,
    label: pill?.label ?? null,
    at: pill ? roomiest(list) : null,
    km2: pill?.km2 ?? null,
    d: list.map(path).join(""),
    area: list.reduce((n, s) => n + s.span * s.span, 0),
  });
}
islandsOut.sort((a, b) => b.area - a.area);

/* The named islands stay separate because each one is a button. The rest are
   scenery and go out as a single path: a hundred and thirty objects with an
   id, a label and a null anchor apiece cost more than the coastline does. */
const namedOut = islandsOut.filter((i) => i.id);
const restD = islandsOut.filter((i) => !i.id).map((i) => i.d).join("");

const bytes = namedOut.reduce((n, o) => n + o.d.length, 0) + restD.length;
console.log(
  `bingkai ${W}x${H} · pulau ${islandsOut.length} · berlabel ${namedOut.length} · ` +
    `jalur ${(bytes / 1024).toFixed(1)} kB`,
);
console.log("\nyang berlabel:");
for (const i of namedOut) {
  console.log(
    `  ${i.label.padEnd(10)} label di ${i.at.join(",").padEnd(13)} ` +
      `luas resmi ${i.km2 === null ? "tidak disebut" : i.km2 + " km2"}`,
  );
}

const ts = `/**
 * The Dampier Strait, drawn from public records rather than from memory.
 *
 * GENERATED FILE. Do not hand-edit. It is written by \`scripts/peta-dampier.mjs\`,
 * which is run with \`npm run peta\` and fetches its own sources. Every shape
 * and every name below is read out of one of three public datasets:
 *
 *  - shapes: the village polygons of Raja Ampat regency. In an archipelago a
 *    village polygon is an island or a slice of one, so their union is the
 *    coastline. Source: github.com/cahyadsn/wilayah_boundaries (MIT).
 *  - island names: the island gazetteer from the same decree. Source:
 *    github.com/cahyadsn/wilayah (MIT).
 *  - which slices share an island: OpenStreetMap land at 100 m, where a whole
 *    island is one ring. Source: github.com/simonepri/geo-maps (CC-BY-SA 4.0,
 *    from OpenStreetMap contributors, ODbL).
 *
 * The generator refuses to write this file unless every labelled island's
 * official point falls inside exactly one drawn island, so a label is never
 * further from its coast than the sources are from each other.
 *
 * What is NOT here, because nobody has told us yet: dive sites, snorkelling
 * spots and crossing times. Those are facts about this family's water, they
 * belong to the family, and they go in \`map.places\` in \`eddo-content.ts\`
 * where the rest of the words live. A map file is the wrong place to invent
 * them.
 */

/** Equirectangular, in degrees. Longitude is barely stretched this close to
    the equator: cos(${(LAT0 * (180 / Math.PI)).toFixed(3)} deg) = ${Math.cos(LAT0).toFixed(5)}. */
export const FRAME = ${JSON.stringify(FRAME).replace(/[{}]/g, (c) => (c === "{" ? "{ " : " }")).replace(/,/g, ", ").replace(/"(\w)":/g, "$1: ")} as const;

export const VIEW = { w: ${W}, h: ${H} } as const;

/** Turn a real coordinate into a point on the drawing. */
export function place(lat: number, lng: number): { x: number; y: number } {
  return {
    x: ((lng - FRAME.w) / (FRAME.e - FRAME.w)) * VIEW.w,
    y: ((FRAME.n - lat) / (FRAME.n - FRAME.s)) * VIEW.h,
  };
}

export type DampierIsland = {
  /** Matches a key under \`map.places\` in \`eddo-content.ts\`. */
  id: string;
  /** The island's official name, from the gazetteer. */
  label: string;
  /** The roomiest spot on the island: where its label belongs. */
  at: readonly [number, number];
  /** Area in square kilometres, where the gazetteer states one. */
  km2: number | null;
  /** Every village polygon of that island, as one path. */
  d: string;
};

/** The islands a reader can choose, largest first. */
export const ISLANDS: readonly DampierIsland[] = ${JSON.stringify(
  namedOut.map((i) => ({ id: i.id, label: i.label, at: i.at, km2: i.km2, d: i.d })),
  null,
  0,
)
  .replace(/\},\{/g, "},\n  {")
  .replace(/^\[/, "[\n  ")
  .replace(/\]$/, ",\n]")};

/**
 * Every other island in the frame, as one path.
 *
 * ${islandsOut.length - namedOut.length} of them, and not one of them is a button, so they are
 * scenery: drawn once, in one colour, behind everything that can be pressed.
 * Keeping them as separate objects cost more than the coastline itself.
 */
export const REST = ${JSON.stringify(restD)};
`;

writeFileSync(OUT, ts);
console.log(`\ntersimpan: ${OUT} (${(ts.length / 1024).toFixed(1)} kB)`);
