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

export type Screen = "kalender" | "laporan" | "properti" | "pengguna";

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
