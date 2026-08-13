"use client";

import { useEffect, useRef } from "react";

import { BrandLogo } from "@/components/brand-logo";

export interface TopBarProps {
  query: string;
  onQuery: (value: string) => void;
  onOpenForm: () => void;
  userName: string;
  userInitial: string;
  roleLabel: string;
  loginEmail: string;
  menuOpen: boolean;
  onToggleMenu: () => void;
  onCloseMenu: () => void;
  onLogout: () => void;
}

export function TopBar({
  query,
  onQuery,
  onOpenForm,
  userName,
  userInitial,
  roleLabel,
  loginEmail,
  menuOpen,
  onToggleMenu,
  onCloseMenu,
  onLogout,
}: TopBarProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onDocClick = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) onCloseMenu();
    };
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCloseMenu();
    };
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, [menuOpen, onCloseMenu]);

  return (
    <div className="flex flex-wrap items-center gap-5 border-b border-line px-[26px] py-[18px]">
      <div className="flex min-w-[210px] items-center gap-3">
        <BrandLogo size={40} className="shrink-0" />
        <div className="leading-[1.15]">
          <div className="text-[15px] font-bold whitespace-nowrap">
            Unmehopa Management
          </div>
          <div className="text-[12px] text-slate-soft">Booking Manager</div>
        </div>
      </div>

      <div className="flex max-w-[380px] min-w-[180px] flex-1 items-center gap-[10px] rounded-xl border border-line-search bg-surface-tint px-[14px] py-[9px]">
        <div className="h-[14px] w-[14px] shrink-0 rounded-full border-2 border-[#A9B8B2]" />
        <input
          type="text"
          value={query}
          onChange={(e) => onQuery(e.target.value)}
          placeholder="Cari nama tamu, kamar, atau kode booking"
          aria-label="Cari booking"
          className="w-full border-none bg-transparent text-[13.5px] outline-none"
        />
      </div>

      <div className="ml-auto flex items-center gap-[10px]">
        <button
          type="button"
          onClick={onOpenForm}
          className="cursor-pointer rounded-xl border-none bg-amber px-[18px] py-[11px] text-[13.5px] font-bold text-amber-deep shadow-[0_2px_0_var(--color-amber-shade)] hover:bg-amber-hover"
        >
          + Booking Baru
        </button>

        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={onToggleMenu}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            className="flex cursor-pointer items-center gap-[9px] rounded-full border-none bg-surface-tint py-[5px] pr-[14px] pl-[5px] hover:bg-[#EDF3F1]"
          >
            <span className="flex h-[30px] w-[30px] items-center justify-center rounded-full bg-teal text-[12.5px] font-bold text-white">
              {userInitial}
            </span>
            <span className="text-left leading-[1.1]">
              <span className="block text-[13px] font-medium">{userName}</span>
              <span className="block text-[11px] text-slate-soft">
                {roleLabel}
              </span>
            </span>
          </button>

          {menuOpen && (
            <div className="absolute top-[52px] right-0 z-40 w-[224px] animate-pop-in rounded-[14px] border border-line-search bg-surface p-2 shadow-[0_16px_40px_rgba(20,50,42,.14)]">
              <div className="mb-[6px] border-b border-line-fine px-[10px] pt-2 pb-[10px]">
                <div className="text-[13px] font-medium">{loginEmail}</div>
                <div className="text-[11.5px] text-slate-soft">
                  Peran {roleLabel}
                </div>
              </div>
              <button
                type="button"
                onClick={onLogout}
                className="w-full cursor-pointer rounded-[9px] border-none bg-transparent px-[10px] py-[9px] text-left text-[13px] text-danger-ink hover:bg-danger-tint"
              >
                Keluar dari akun
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
