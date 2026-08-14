"use client";

import { useEffect, useState } from "react";

import { Pill } from "@/components/ui/pill";
import { roomStatusColors } from "@/lib/pills";

export interface PropertyRoomRow {
  id: string;
  name: string;
  cap: string;
  /** Formatted for display; empty when the viewer may not see money. */
  price: string;
  /** Raw rate, for the editor. */
  rate: number;
  ical: string;
  status: string;
  active: boolean;
}

export interface PropertyCard {
  key: string;
  name: string;
  location: string;
  rooms: string;
  occ: string;
  price: string;
  roomList: PropertyRoomRow[];
}

const gridFor = (showMoney: boolean) => ({
  gridTemplateColumns: showMoney
    ? "1.4fr .9fr 1fr 1fr .9fr"
    : "1.6fr 1fr 1fr .9fr",
  minWidth: showMoney ? 620 : 480,
});

const digits = (s: string) => s.replace(/\D/g, "");
const grouped = (n: number) => n.toLocaleString("id-ID");

/**
 * Editable nightly rate, grouped as you type so it reads like money rather
 * than a raw field. Held as text while editing — a half-deleted number must
 * not momentarily reprice the room — and committed on blur or Enter. A blank
 * or zero entry snaps back instead of writing a free room.
 */
function RateField({
  rate,
  onCommit,
}: {
  rate: number;
  onCommit: (value: number) => void;
}) {
  const [draft, setDraft] = useState(grouped(rate));
  useEffect(() => setDraft(grouped(rate)), [rate]);

  const commit = () => {
    const next = Number(digits(draft));
    if (next > 0) onCommit(next);
    else setDraft(grouped(rate));
  };

  return (
    <div className="flex items-center gap-[5px]">
      <span className="text-[12px] text-slate-mute">Rp</span>
      <input
        value={draft}
        onChange={(e) => {
          const d = digits(e.target.value);
          setDraft(d ? grouped(Number(d)) : "");
        }}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.currentTarget.blur();
          if (e.key === "Escape") {
            setDraft(grouped(rate));
            e.currentTarget.blur();
          }
        }}
        inputMode="numeric"
        aria-label="Harga per malam"
        className="w-[96px] rounded-[8px] border border-line-input bg-surface px-2 py-[5px] text-right font-mono text-[12.5px] outline-none focus:border-teal"
      />
    </div>
  );
}

export function PropertyScreen({
  cards,
  showMoney,
  onRate,
}: {
  cards: PropertyCard[];
  /** Staff see no rupiah anywhere, so the rate column collapses for them. */
  showMoney: boolean;
  onRate: (roomId: string, rate: number) => void;
}) {
  return (
    <div>
      <div className="mb-1 text-[22px] font-bold">Properti &amp; Kamar</div>
      <div className="mb-5 text-[13.5px] text-slate-soft">
        {showMoney
          ? "Harga dasar per malam bisa diubah langsung di tabel. Booking baru memakai harga yang berlaku saat disimpan."
          : "Kapasitas dan status kamar."}
      </div>

      <div className="flex flex-col gap-4">
        {cards.map((p) => (
          <div
            key={p.key}
            className="overflow-hidden rounded-[20px] border border-line-soft bg-surface"
          >
            <div className="flex flex-wrap items-center gap-[14px] border-b border-line-fine px-5 py-4">
              <div>
                <div className="text-[16px] font-bold">{p.name}</div>
                <div className="text-[12.5px] text-slate-soft">
                  {p.location}
                </div>
              </div>
              <div className="ml-auto flex flex-wrap gap-5">
                <div>
                  <div className="text-[11.5px] text-slate-soft">Kamar</div>
                  <div className="text-[15px] font-bold">{p.rooms}</div>
                </div>
                <div>
                  <div className="text-[11.5px] text-slate-soft">Okupansi</div>
                  <div className="text-[15px] font-bold">{p.occ}</div>
                </div>
                <div>
                  <div className="text-[11.5px] text-slate-soft">
                    Harga dasar
                  </div>
                  <div className="text-[15px] font-bold">{p.price}</div>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <div
                className="grid bg-surface-mute px-5 py-[10px] font-mono text-[10.5px] tracking-[.07em] text-slate-mute uppercase"
                style={gridFor(showMoney)}
              >
                <div>Kamar</div>
                <div>Kapasitas</div>
                {showMoney && <div>Harga/malam</div>}
                <div>iCal</div>
                <div>Status</div>
              </div>
              {p.roomList.map((r) => (
                <div
                  key={r.id}
                  className="grid items-center border-t border-line-row px-5 py-3 text-[13.5px]"
                  style={gridFor(showMoney)}
                >
                  <div className="font-medium">{r.name}</div>
                  <div className="text-slate">{r.cap}</div>
                  {showMoney && (
                    <RateField
                      rate={r.rate}
                      onCommit={(value) => onRate(r.id, value)}
                    />
                  )}
                  <div className="text-[12.5px] text-slate-mute">{r.ical}</div>
                  <div>
                    <Pill colors={roomStatusColors(r.active)}>{r.status}</Pill>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
