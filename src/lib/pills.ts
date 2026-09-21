import type { BookingStatus } from "./types";

export interface PillColors {
  bg: string;
  fg: string;
}

/*
 * Chip fills, hard-coded rather than tokenised because `Pill` takes colours as
 * values (channels supply theirs from `CH`). They sit in the same warm family
 * as the theme: mint for a settled state, sand for one still in motion, clay
 * for a cancellation.
 */
const MINT: PillColors = { bg: "#DCEFE3", fg: "#216B4B" };
const SAND: PillColors = { bg: "#F7EEDD", fg: "#8A6524" };
const CLAY: PillColors = { bg: "#FBE3DA", fg: "#B04A3A" };
const STONE: PillColors = { bg: "#F2EBE0", fg: "#6B6357" };

/* Clay untuk dua keadaan yang sama akibatnya: kamarnya dipegang dan tidak ada
   yang menempatinya. Yang satu karena dibatalkan, yang satu karena tamunya
   tidak datang — bedanya penting untuk laporan, bukan untuk warna. */
export function statusColors(status: BookingStatus): PillColors {
  return status === "Cancelled" || status === "Tidak datang" ? CLAY : STONE;
}

export function roleColors(role: "Owner" | "Staf"): PillColors {
  return role === "Owner" ? MINT : STONE;
}

export function activeColors(active: boolean): PillColors {
  return active ? MINT : STONE;
}

export function roomStatusColors(active: boolean): PillColors {
  return active ? MINT : SAND;
}
