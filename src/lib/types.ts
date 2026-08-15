export type PropertyKey = "turtle" | "eddo";

export type ChannelKey =
  | "Booking.com"
  | "Traveloka"
  | "Agoda"
  | "WhatsApp"
  | "Blokir";

export type BookingStatus =
  | "Tentative"
  | "Confirmed"
  | "Checked-in"
  | "Checked-out"
  | "Cancelled";

export type BookingSource = "manual" | "iCal";

export type Role = "owner" | "staf";

export type Screen =
  | "kalender"
  | "laporan"
  | "properti"
  | "sinkron"
  | "website"
  | "pengguna";

/** An OTA calendar pulled into a room. One room may carry several. */
export interface IcalFeed {
  id: string;
  roomId: string;
  channel: ChannelKey;
  url: string;
  /** When the owner added it. Sync state stays empty until a backend runs. */
  addedAt: string;
}

/** The secret in a room's outgoing feed URL, resettable. */
export interface ExportToken {
  roomId: string;
  token: string;
  createdAt: string;
}

export interface Room {
  id: string;
  prop: PropertyKey;
  name: string;
  cap: string;
  /** Base rate per night, in rupiah. */
  rate: number;
  active: boolean;
}

export interface Booking {
  id: string;
  roomId: string;
  guest: string;
  phone: string;
  pax: number;
  channel: ChannelKey;
  /** Plain date, YYYY-MM-DD. */
  checkIn: string;
  /** Plain date, YYYY-MM-DD. Exclusive — the guest leaves this morning. */
  checkOut: string;
  total: number;
  status: BookingStatus;
  notes: string;
  src: BookingSource;
  /** Set only when the booking is actually changed in-session. */
  updatedAt?: string;
  updatedBy?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: "Owner" | "Staf";
  scope: string;
  active: boolean;
}

export interface BookingForm {
  property: PropertyKey;
  room: string;
  checkIn: string;
  checkOut: string;
  guest: string;
  phone: string;
  pax: number | string;
  channel: ChannelKey;
  notes: string;
}

export interface InviteForm {
  name: string;
  email: string;
  role: "Owner" | "Staf";
  scope: string;
}
