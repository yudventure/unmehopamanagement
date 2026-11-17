"use client";

import {
  FIELD_INPUT,
  FIELD_LABEL,
  FIELD_SELECT,
  Modal,
  ModalHeader,
} from "@/components/ui/modal";
import { LABEL_PERAN, PERAN } from "@/lib/peran";
import type { InviteForm } from "@/lib/types";

export interface InviteModalProps {
  invite: InviteForm;
  onChange: <K extends keyof InviteForm>(key: K, value: InviteForm[K]) => void;
  onClose: () => void;
  onSend: () => void;
}

const SCOPES = ["Turtle Homestay", "Eddo Homestay", "Semua properti"];

export function InviteModal({
  invite,
  onChange,
  onClose,
  onSend,
}: InviteModalProps) {
  return (
    <Modal onClose={onClose} z={70} maxWidth={460} labelledBy="invite-title">
      <ModalHeader id="invite-title" title="Tambah pengguna" onClose={onClose} />
      <div className="mb-[18px] text-[13px] text-slate-soft">
        Staf hanya bisa mengelola properti yang dipilih di bawah. Beri kata sandi awal (paling sedikit 10 huruf) dan sampaikan langsung ke orangnya.
      </div>

      <div className="flex flex-col gap-[14px]">
        <label className={FIELD_LABEL}>
          Nama
          <input
            type="text"
            value={invite.name}
            onChange={(e) => onChange("name", e.target.value)}
            placeholder="Nama pengelola"
            className={FIELD_INPUT}
          />
        </label>
        <label className={FIELD_LABEL}>
          Email
          <input
            type="text"
            value={invite.email}
            onChange={(e) => onChange("email", e.target.value)}
            placeholder="nama@perusahaan.com"
            className={FIELD_INPUT}
          />
        </label>
        <label className={FIELD_LABEL}>
          Kata sandi awal
          <input
            type="text"
            value={invite.sandi}
            onChange={(e) => onChange("sandi", e.target.value)}
            placeholder="Paling sedikit 10 huruf"
            autoComplete="off"
            className={FIELD_INPUT}
          />
        </label>
        <div className="grid grid-cols-2 gap-[14px]">
          <label className={FIELD_LABEL}>
            Peran
            <select
              value={invite.peran}
              onChange={(e) =>
                onChange("peran", e.target.value as InviteForm["peran"])
              }
              className={FIELD_SELECT}
            >
              {PERAN.map((r) => (
                <option key={r} value={r}>
                  {LABEL_PERAN[r]}
                </option>
              ))}
            </select>
          </label>
          <label className={FIELD_LABEL}>
            Akses properti
            <select
              value={invite.scope}
              onChange={(e) => onChange("scope", e.target.value)}
              className={FIELD_SELECT}
            >
              {SCOPES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <button
        type="button"
        onClick={onSend}
        className="mt-5 w-full cursor-pointer rounded-xl border-none bg-teal py-3 text-[13.5px] font-bold text-white hover:bg-teal-deep"
      >
        Buat akun
      </button>
    </Modal>
  );
}
