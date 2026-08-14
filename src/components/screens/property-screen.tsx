"use client";

import { useState } from "react";

import {
  RoomEditModal,
  type RoomEditTarget,
  type RoomPatch,
} from "@/components/room-edit-modal";
import { Pill } from "@/components/ui/pill";
import { roomStatusColors } from "@/lib/pills";

export interface PropertyRoomRow extends RoomEditTarget {
  /** Formatted for display; empty when the viewer may not see money. */
  price: string;
  ical: string;
  status: string;
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

/**
 * Column widths per variant. The room name takes the slack when the rate
 * column is hidden; the action column is a fixed button width.
 */
const gridFor = (showMoney: boolean, canEdit: boolean) => {
  const cols = [
    showMoney ? "1.4fr" : "1.6fr",
    showMoney ? ".9fr" : "1fr",
    showMoney ? "1fr" : null,
    "1fr",
    ".9fr",
    canEdit ? "84px" : null,
  ].filter(Boolean) as string[];
  return {
    gridTemplateColumns: cols.join(" "),
    minWidth: (showMoney ? 620 : 480) + (canEdit ? 84 : 0),
  };
};

export function PropertyScreen({
  cards,
  showMoney,
  canEdit,
  onSaveRoom,
}: {
  cards: PropertyCard[];
  /** Staff see no rupiah anywhere, so the rate column collapses for them. */
  showMoney: boolean;
  /** Only an owner may change how a room is configured. */
  canEdit: boolean;
  onSaveRoom: (id: string, patch: RoomPatch) => string | null;
}) {
  /* Draft state belongs to the dialog, so it lives here rather than in the
     app shell: nothing outside this screen needs to know a room is open for
     editing, and closing the dialog throws the draft away. */
  const [editing, setEditing] = useState<PropertyRoomRow | null>(null);

  return (
    <div>
      <div className="mb-1 text-[22px] font-bold">Properti &amp; Kamar</div>
      <div className="mb-5 text-[13.5px] text-slate-soft">
        {canEdit
          ? "Klik Edit untuk mengubah nama, kapasitas, harga, atau status kamar. Booking baru memakai harga yang berlaku saat disimpan."
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
                style={gridFor(showMoney, canEdit)}
              >
                <div>Kamar</div>
                <div>Kapasitas</div>
                {showMoney && <div>Harga/malam</div>}
                <div>iCal</div>
                <div>Status</div>
                {canEdit && <div className="text-right">Aksi</div>}
              </div>
              {p.roomList.map((r) => (
                <div
                  key={r.id}
                  className="grid items-center border-t border-line-row px-5 py-3 text-[13.5px]"
                  style={gridFor(showMoney, canEdit)}
                >
                  <div className="font-medium">{r.name}</div>
                  <div className="text-slate">{r.cap}</div>
                  {showMoney && (
                    <div className="font-mono text-[12.5px] text-ink-soft">
                      {r.price}
                    </div>
                  )}
                  <div className="text-[12.5px] text-slate-mute">{r.ical}</div>
                  <div>
                    <Pill colors={roomStatusColors(r.active)}>{r.status}</Pill>
                  </div>
                  {canEdit && (
                    <div className="text-right">
                      <button
                        type="button"
                        onClick={() => setEditing(r)}
                        aria-label={`Ubah detail ${r.name}`}
                        className="cursor-pointer rounded-[9px] border border-line-strong bg-surface px-[13px] py-[6px] text-[12.5px] font-medium text-ink-soft hover:border-teal hover:text-teal"
                      >
                        Edit
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {editing && (
        <RoomEditModal
          room={editing}
          showMoney={showMoney}
          onClose={() => setEditing(null)}
          onSave={onSaveRoom}
        />
      )}
    </div>
  );
}
