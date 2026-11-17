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

const EDIT_BUTTON =
  "cursor-pointer rounded-[9px] border border-line-strong bg-surface px-[13px] py-[6px] text-[12.5px] font-medium text-ink-soft hover:border-teal hover:text-teal";

export function PropertyScreen({
  cards,
  compact,
  showMoney,
  canEdit,
  onSaveRoom,
  onDeleteRoom,
}: {
  cards: PropertyCard[];
  /** Phone widths, where the room table becomes one card per room. */
  compact: boolean;
  /** Staff see no rupiah anywhere, so the rate column collapses for them. */
  showMoney: boolean;
  /** Only an owner may change how a room is configured. */
  canEdit: boolean;
  onSaveRoom: (id: string, patch: RoomPatch) => string | null;
  onDeleteRoom: (id: string) => string | null;
}) {
  /* Draft state belongs to the dialog, so it lives here rather than in the
     app shell: nothing outside this screen needs to know a room is open for
     editing, and closing the dialog throws the draft away. */
  const [editing, setEditing] = useState<PropertyRoomRow | null>(null);
  /* Kamar baru memakai id sementara `__baru__:<properti>`, yang dikenali
     penyimpanannya dan diganti id sungguhan. */
  const [barunya, setBarunya] = useState<PropertyRoomRow | null>(null);
  const tambah = (prop: string) =>
    setBarunya({
      id: `__baru__:${prop}`,
      name: "",
      cap: "2 dewasa",
      rate: 0,
      active: true,
      upcoming: 0,
      price: "",
      ical: "",
      status: "Aktif",
    });

  return (
    <div>
      <div className="mb-1 text-[22px] font-bold">Properti &amp; Kamar</div>
      <div className="mb-5 text-[13.5px] text-slate-soft">
        {canEdit
          ? "Atur jumlah kamar dengan Tambah kamar, atau Edit lalu Hapus untuk kamar yang belum pernah dipakai. Klik Edit untuk mengubah nama, kapasitas, harga, atau status kamar. Booking baru memakai harga yang berlaku saat disimpan."
          : "Kapasitas dan status kamar."}
      </div>

      <div className="flex flex-col gap-4">
        {cards.map((p) => (
          <div
            key={p.key}
            className="overflow-hidden rounded-[20px] border border-line-soft bg-surface"
          >
            <div
              className={`border-b border-line-fine px-5 py-4 ${
                compact
                  ? "flex flex-col gap-3"
                  : "flex flex-wrap items-center gap-[14px]"
              }`}
            >
              <div>
                <div className="text-[16px] font-bold">{p.name}</div>
                <div className="text-[12.5px] text-slate-soft">
                  {p.location}
                </div>
              </div>
              <div
                className={
                  compact ? "grid grid-cols-3 gap-2" : "ml-auto flex flex-wrap gap-5"
                }
              >
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
              {canEdit && (
                <button
                  type="button"
                  onClick={() => tambah(p.key)}
                  className="cursor-pointer rounded-[10px] border-none bg-teal px-[14px] py-[8px] text-[12.5px] font-bold text-white hover:bg-teal-deep"
                >
                  + Tambah kamar
                </button>
              )}
            </div>

            {/*
             * The table is 704px wide with the rate and action columns on it,
             * so a phone showed the first three and put Edit past the right
             * edge — the very button the paragraph above tells the owner to
             * press. One row per card here, nothing off-screen.
             */}
            {compact ? (
              <div className="flex flex-col">
                {p.roomList.map((r) => (
                  <div
                    key={r.id}
                    className="flex items-start gap-3 border-t border-line-row px-4 py-3"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[14px] font-medium">
                          {r.name}
                        </span>
                        <Pill colors={roomStatusColors(r.active)}>
                          {r.status}
                        </Pill>
                      </div>
                      <div className="mt-[3px] text-[12.5px] text-slate">
                        {r.cap}
                        {showMoney && (
                          <>
                            {" · "}
                            <span className="font-mono text-ink-soft">
                              {r.price}
                            </span>
                          </>
                        )}
                      </div>
                      <div className="mt-[2px] text-[12px] text-slate-soft">
                        iCal {r.ical}
                      </div>
                    </div>
                    {canEdit && (
                      <button
                        type="button"
                        onClick={() => setEditing(r)}
                        aria-label={`Ubah detail ${r.name}`}
                        className={`${EDIT_BUTTON} mt-[2px] shrink-0`}
                      >
                        Edit
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
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
                        className={EDIT_BUTTON}
                      >
                        Edit
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
            )}
          </div>
        ))}
      </div>

      {editing && (
        <RoomEditModal
          room={editing}
          showMoney={showMoney}
          onClose={() => setEditing(null)}
          onSave={onSaveRoom}
          onDelete={onDeleteRoom}
        />
      )}

      {barunya && (
        <RoomEditModal
          room={barunya}
          showMoney
          baru
          onClose={() => setBarunya(null)}
          onSave={onSaveRoom}
        />
      )}
    </div>
  );
}
