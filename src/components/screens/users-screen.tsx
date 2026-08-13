"use client";

import { Pill } from "@/components/ui/pill";
import { activeColors, roleColors } from "@/lib/pills";
import type { User } from "@/lib/types";

export interface UsersScreenProps {
  users: User[];
  onOpenInvite: () => void;
  onToggleUser: (user: User) => void;
}

const TABLE_GRID = {
  gridTemplateColumns: "1.6fr .8fr 1.1fr .7fr .9fr",
  minWidth: 640,
};

export function UsersScreen({
  users,
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
          className="ml-auto cursor-pointer rounded-xl border-none bg-teal px-[18px] py-[11px] text-[13.5px] font-medium text-white hover:bg-teal-deep"
        >
          + Undang pengelola
        </button>
      </div>

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
                  <span className="text-[12.5px] text-slate-ghost">—</span>
                ) : (
                  <button
                    type="button"
                    onClick={() => onToggleUser(u)}
                    className="cursor-pointer rounded-[10px] border border-line-strong bg-surface px-3 py-[7px] text-[12.5px]"
                    style={{ color: u.active ? "#B42318" : "#0B5F52" }}
                  >
                    {u.active ? "Nonaktifkan" : "Aktifkan kembali"}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-[14px] text-[12.5px] leading-[1.6] text-slate-mute">
        Undangan dikirim lewat email berisi tautan pembuatan kata sandi. Akun
        yang dinonaktifkan kehilangan akses langsung tanpa menghapus jejak audit
        booking yang pernah diinput.
      </div>
    </div>
  );
}
