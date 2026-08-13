"use client";

import {
  FIELD_INPUT,
  FIELD_LABEL,
  FIELD_SELECT,
  Modal,
  ModalHeader,
} from "@/components/ui/modal";
import type { InviteForm } from "@/lib/types";

export interface InviteModalProps {
  invite: InviteForm;
  onChange: <K extends keyof InviteForm>(key: K, value: InviteForm[K]) => void;
  onClose: () => void;
  onSend: () => void;
}

const SCOPES = ["Turtle Homestay", "Eddo Homestay", "Semua properti"];
const ROLES: InviteForm["role"][] = ["Staf", "Owner"];

export function InviteModal({
  invite,
  onChange,
  onClose,
  onSend,
}: InviteModalProps) {
  return (
    <Modal onClose={onClose} z={70} maxWidth={460} labelledBy="invite-title">
      <ModalHeader id="invite-title" title="Undang pengelola" onClose={onClose} />
      <div className="mb-[18px] text-[13px] text-slate-soft">
        Staf hanya bisa mengelola properti yang dipilih di bawah.
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
            placeholder="nama@rumahpapua.id"
            className={FIELD_INPUT}
          />
        </label>
        <div className="grid grid-cols-2 gap-[14px]">
          <label className={FIELD_LABEL}>
            Peran
            <select
              value={invite.role}
              onChange={(e) =>
                onChange("role", e.target.value as InviteForm["role"])
              }
              className={FIELD_SELECT}
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
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
        Kirim undangan
      </button>
    </Modal>
  );
}
