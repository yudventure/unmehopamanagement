"use client";

import { Pill } from "@/components/ui/pill";
import { activeColors, roleColors } from "@/lib/pills";
import type { User } from "@/lib/types";

export interface UsersScreenProps {
  users: User[];
  /** Phone widths, where the five-column table becomes one card per person. */
  compact: boolean;
  onOpenInvite: () => void;
  onToggleUser: (user: User) => void;
}

const TABLE_GRID = {
  gridTemplateColumns: "1.6fr .8fr 1.1fr .7fr .9fr",
  minWidth: 640,
};

const TOGGLE_BUTTON =
  "cursor-pointer rounded-[10px] border border-line-strong bg-surface px-3 py-[7px] text-[12.5px]";

export function UsersScreen({
  users,
  compact,
  onOpenInvite,
  onToggleUser,
}: UsersScreenProps) {
  return (
    <div>
      <div className="mb-5 flex flex-wrap items-end gap-4">
        <div>
          <div className="mb-1 text-[22px] font-bold">Pengguna &amp; Peran</div>
          <div className="text-[13.5px] text-slate-soft">
            Owner melihat semua properti dan laporan keuangan. Staf hanya
            kalender, input booking, dan pembayaran di properti yang diizinkan.
          </div>
        </div>
        <button
          type="button"
          onClick={onOpenInvite}
          className={`cursor-pointer rounded-xl border-none bg-teal px-[18px] py-[11px] text-[13.5px] font-medium text-white hover:bg-teal-deep ${
            compact ? "w-full" : "ml-auto"
          }`}
        >
          + Undang pengelola
        </button>
      </div>

      {/*
       * A 640px table on a 360px screen puts Status and Aksi past the right
       * edge, where a sideways scroll nobody is told about is the only way to
       * reach them — so on a phone the one button that deactivates an account
       * was invisible. One card per person instead, with every field on it.
       */}
      {compact ? (
        <div className="flex flex-col gap-[10px]">
          {users.map((u) => (
            <div
              key={u.id}
              className="rounded-[16px] border border-line-soft bg-surface px-4 py-[13px]"
            >
              <div className="flex items-start gap-2">
                <div className="min-w-0 flex-1">
                  <div className="text-[14px] font-medium">{u.name}</div>
                  <div className="text-[12px] break-all text-slate-soft">
                    {u.email}
                  </div>
                </div>
                <Pill colors={activeColors(u.active)}>
                  {u.active ? "Aktif" : "Nonaktif"}
                </Pill>
              </div>

              <div className="mt-[10px] flex flex-wrap items-center gap-2">
                <Pill colors={roleColors(u.role)}>{u.role}</Pill>
                <span className="text-[12.5px] text-slate">{u.scope}</span>
              </div>

              {u.role !== "Owner" && (
                <button
                  type="button"
                  onClick={() => onToggleUser(u)}
                  className={`${TOGGLE_BUTTON} mt-3 w-full`}
                  style={{ color: u.active ? "#B04A3A" : "#216B4B" }}
                >
                  {u.active ? "Nonaktifkan" : "Aktifkan kembali"}
                </button>
              )}
            </div>
          ))}
        </div>
      ) : (
      <div className="overflow-hidden rounded-[20px] border border-line-soft bg-surface">
        <div className="overflow-x-auto">
          <div
            className="grid bg-surface-mute px-5 py-[10px] font-mono text-[10.5px] tracking-[.07em] text-slate-mute uppercase"
            style={TABLE_GRID}
          >
            <div>Nama</div>
            <div>Peran</div>
            <div>Akses properti</div>
            <div>Status</div>
            <div>Aksi</div>
          </div>
          {users.map((u) => (
            <div
              key={u.id}
              className="grid items-center border-t border-line-row px-5 py-[13px]"
              style={TABLE_GRID}
            >
              <div>
                <div className="text-[13.5px] font-medium">{u.name}</div>
                <div className="text-[12px] text-slate-soft">{u.email}</div>
              </div>
              <div>
                <Pill colors={roleColors(u.role)}>{u.role}</Pill>
              </div>
              <div className="text-[13px] text-slate">{u.scope}</div>
              <div>
                <Pill colors={activeColors(u.active)}>
                  {u.active ? "Aktif" : "Nonaktif"}
                </Pill>
              </div>
              <div>
                {u.role === "Owner" ? (
                  <span className="text-[12.5px] text-slate-mute">—</span>
                ) : (
                  <button
                    type="button"
                    onClick={() => onToggleUser(u)}
                    className={TOGGLE_BUTTON}
                    style={{ color: u.active ? "#B04A3A" : "#216B4B" }}
                  >
                    {u.active ? "Nonaktifkan" : "Aktifkan kembali"}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
      )}

      <div className="mt-[14px] text-[12.5px] leading-[1.6] text-slate-mute">
        Undangan dikirim lewat email berisi tautan pembuatan kata sandi. Akun
        yang dinonaktifkan kehilangan akses langsung tanpa menghapus jejak audit
        booking yang pernah diinput.
      </div>
    </div>
  );
}
