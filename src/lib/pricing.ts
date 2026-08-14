import type { ChannelKey } from "./types";

/**
 * OTA listings carry a markup so the platform's commission does not come out
 * of the owner's net. WhatsApp bookings and walk-ins pay the posted rate, and
 * a block is not a sale at all.
 */
export const OTA_MARKUP = 1.12;

export function channelMarkup(channel: ChannelKey): number {
  return channel === "WhatsApp" || channel === "Blokir" ? 1 : OTA_MARKUP;
}

/**
 * The one place a booking's value is worked out. Seeded bookings and ones
 * typed into the form both come through here — they used to disagree, so a
 * Booking.com booking entered by hand was worth 12% less than an identical
 * imported one.
 */
export function bookingTotal(
  rate: number,
  nights: number,
  channel: ChannelKey,
): number {
  return rate * nights * channelMarkup(channel);
}
