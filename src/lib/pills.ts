import type { BookingStatus } from "./types";

export interface PillColors {
  bg: string;
  fg: string;
}

export function statusColors(status: BookingStatus): PillColors {
  return status === "Cancelled"
    ? { bg: "#FEE4E2", fg: "#B42318" }
    : { bg: "#F0F5F3", fg: "#3C4B46" };
}

export function roleColors(role: "Owner" | "Staf"): PillColors {
  return role === "Owner"
    ? { bg: "#D6F2E7", fg: "#0B5F52" }
    : { bg: "#F0F5F3", fg: "#3C4B46" };
}

export function activeColors(active: boolean): PillColors {
  return active
    ? { bg: "#D6F2E7", fg: "#0B5F52" }
    : { bg: "#ECEFEE", fg: "#5C6E68" };
}

export function roomStatusColors(active: boolean): PillColors {
  return active
    ? { bg: "#D6F2E7", fg: "#0B5F52" }
    : { bg: "#FDF0CE", fg: "#8A6200" };
}
