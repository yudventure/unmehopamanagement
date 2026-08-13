"use client";

import { useEffect } from "react";

export const FIELD_LABEL =
  "flex flex-col gap-[6px] text-[12.5px] text-slate";
export const FIELD_INPUT =
  "rounded-[11px] border border-line-input px-3 py-[10px] text-[13.5px] outline-none focus:border-teal";
export const FIELD_SELECT = `${FIELD_INPUT} bg-surface`;

export interface ModalProps {
  onClose: () => void;
  /** Stacking order — the invite modal sits above the booking form. */
  z: number;
  maxWidth: number;
  scroll?: boolean;
  labelledBy: string;
  children: React.ReactNode;
}

export function Modal({
  onClose,
  z,
  maxWidth,
  scroll = false,
  labelledBy,
  children,
}: ModalProps) {
  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onEsc);
    return () => document.removeEventListener("keydown", onEsc);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 flex items-center justify-center bg-[rgba(18,38,32,.42)] p-6"
      style={{ zIndex: z }}
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        onClick={(e) => e.stopPropagation()}
        className={`w-full animate-pop-in rounded-3xl bg-surface px-[26px] pt-6 pb-[26px] ${
          scroll ? "max-h-[92vh] overflow-auto" : ""
        }`}
        style={{ maxWidth }}
      >
        {children}
      </div>
    </div>
  );
}

export function ModalHeader({
  id,
  title,
  onClose,
}: {
  id: string;
  title: string;
  onClose: () => void;
}) {
  return (
    <div className="mb-1 flex items-center">
      <div id={id} className="flex-1 text-[19px] font-bold">
        {title}
      </div>
      <button
        type="button"
        onClick={onClose}
        aria-label="Tutup"
        className="h-[30px] w-[30px] cursor-pointer rounded-[10px] border border-line-strong bg-surface text-slate hover:bg-surface-hover"
      >
        ✕
      </button>
    </div>
  );
}
