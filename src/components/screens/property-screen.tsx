"use client";

import { Pill } from "@/components/ui/pill";
import { roomStatusColors } from "@/lib/pills";

export interface PropertyRoomRow {
  id: string;
  name: string;
  cap: string;
  price: string;
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

const TABLE_GRID = {
  gridTemplateColumns: "1.4fr .9fr .8fr 1fr .9fr",
  minWidth: 560,
};

export function PropertyScreen({ cards }: { cards: PropertyCard[] }) {
  return (
    <div>
      <div className="mb-1 text-[22px] font-bold">Properti &amp; Kamar</div>
      <div className="mb-5 text-[13.5px] text-slate-soft">
        Harga dasar per malam, status kamar, dan sinkronisasi iCal per unit.
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
                <div className="text-[12.5px] text-slate-soft">{p.location}</div>
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
                  <div className="text-[11.5px] text-slate-soft">Harga dasar</div>
                  <div className="text-[15px] font-bold">{p.price}</div>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <div
                className="grid bg-surface-mute px-5 py-[10px] font-mono text-[10.5px] tracking-[.07em] text-slate-mute uppercase"
                style={TABLE_GRID}
              >
                <div>Kamar</div>
                <div>Kapasitas</div>
                <div>Harga/malam</div>
                <div>iCal</div>
                <div>Status</div>
              </div>
              {p.roomList.map((r) => (
                <div
                  key={r.id}
                  className="grid items-center border-t border-line-row px-5 py-3 text-[13.5px]"
                  style={TABLE_GRID}
                >
                  <div className="font-medium">{r.name}</div>
                  <div className="text-slate">{r.cap}</div>
                  <div className="font-mono text-[12.5px]">{r.price}</div>
                  <div className="text-[12.5px] text-slate">{r.ical}</div>
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
