import type { BookingStatus, PaymentStatus } from "./types";

export interface PillColors {
  bg: string;
  fg: string;
}

const PAY_COLORS: Record<PaymentStatus, PillColors> = {
  Lunas: { bg: "#D6F2E7", fg: "#0B5F52" },
  "DP masuk": { bg: "#FDF0CE", fg: "#8A6200" },
  "Belum bayar": { bg: "#FEE4E2", fg: "#B42318" },
  "Dibayar via OTA": { bg: "#E8EEFB", fg: "#1D4ED8" },
};

export function payColors(pay: PaymentStatus): PillColors {
  return PAY_COLORS[pay] ?? { bg: "#F0F5F3", fg: "#5C6E68" };
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
