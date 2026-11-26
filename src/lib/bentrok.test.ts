import { test } from "node:test";
import assert from "node:assert/strict";
import { findConflicts } from "./derive";
import type { Booking } from "./types";

const bk = (id: string, roomId: string, checkIn: string, checkOut: string, status: Booking["status"] = "Confirmed") =>
  ({ id, code: id, roomId, guest: id, phone: "", pax: 1, channel: "WhatsApp", checkIn, checkOut, total: 0, status, notes: "", src: "manual" }) as Booking;

test("check-out dan check-in di hari yang sama bukan bentrok", () => {
  assert.equal(findConflicts([bk("a", "T1", "2027-01-10", "2027-01-14"), bk("b", "T1", "2027-01-14", "2027-01-18")]).length, 0);
});

test("berurutan rapat tiga tamu tetap bersih", () => {
  const l = [bk("a", "T1", "2027-01-01", "2027-01-03"), bk("b", "T1", "2027-01-03", "2027-01-05"), bk("c", "T1", "2027-01-05", "2027-01-06")];
  assert.equal(findConflicts(l).length, 0);
});

test("irisan satu malam: mulai malam check-in, selesai pagi check-out", () => {
  const [p] = findConflicts([bk("a", "T1", "2027-01-10", "2027-01-14"), bk("b", "T1", "2027-01-13", "2027-01-18")]);
  assert.deepEqual([p.from, p.to, p.nights], ["2027-01-13", "2027-01-14", 1]);
});

test("kamar lain atau batal bukan bentrok", () => {
  assert.equal(findConflicts([bk("a", "T1", "2027-01-10", "2027-01-14"), bk("b", "T2", "2027-01-11", "2027-01-12")]).length, 0);
  assert.equal(findConflicts([bk("a", "T1", "2027-01-10", "2027-01-14"), bk("b", "T1", "2027-01-11", "2027-01-12", "Cancelled")]).length, 0);
});
