"use client";

import { useEffect, useRef } from "react";

import { BrandLogo } from "@/components/brand-logo";

export interface TopBarProps {
  /** Wide, the wordmark lives on the green shell; narrow, there is no shell. */
  showBrand: boolean;
  /** Phone widths, where the bar is two tight rows instead of one wide one. */
  compact: boolean;
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

/* The vertical padding is on the input, not on this shell, so the whole pill
   is the tap target. With it here the field was a 20px band inside a 38px
   pill, and a thumb landing on the padding did nothing at all. */
const SEARCH_SHELL =
  "flex items-center gap-[10px] rounded-[11px] border border-line-input bg-surface-mute transition-colors focus-within:border-teal-line focus-within:bg-surface";

/**
 * The search field, on a phone as well as on a desk.
 *
 * A `<form>` around one field is not ceremony here, it is the whole point: it
 * is what turns the phone keyboard's return key into a "cari" key and gives
 * the press somewhere to land. The list has already filtered on every letter
 * typed, so there is nothing left to submit — what the press is actually for
 * is putting the keyboard away, which on a small screen is half the results
 * back. Hence the blur and nothing else.
 *
 * It stays a form rather than a lone key handler so the same press works for
 * a keyboard, a screen reader, and the on-screen key, all without three
 * separate paths.
 */
function SearchField({
  query,
  onQuery,
  placeholder,
  shellClass,
  dotClass,
  inputClass,
}: {
  query: string;
  onQuery: (value: string) => void;
  placeholder: string;
  shellClass: string;
  dotClass: string;
  inputClass: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <form
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        inputRef.current?.blur();
      }}
      className={`${SEARCH_SHELL} ${shellClass}`}
    >
      <div className={`shrink-0 rounded-full border-2 border-slate-ghost ${dotClass}`} />
      <input
        ref={inputRef}
        type="search"
        value={query}
        onChange={(e) => onQuery(e.target.value)}
        placeholder={placeholder}
        aria-label="Cari booking"
        enterKeyHint="search"
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        className={`w-full min-w-0 border-none bg-transparent outline-none ${inputClass}`}
      />
    </form>
  );
}

export function TopBar({
  showBrand,
  compact,
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

  const menu = menuOpen && (
    <div className="absolute top-[46px] right-0 z-40 w-[224px] animate-pop-in rounded-[14px] border border-line-search bg-surface p-2 shadow-[0_16px_40px_rgba(20,50,42,.14)]">
      <div className="mb-[6px] border-b border-line-fine px-[10px] pt-2 pb-[10px]">
        <div className="text-[13px] font-medium">{userName}</div>
        <div className="text-[12px] break-all text-slate-soft">{loginEmail}</div>
        <div className="text-[11.5px] text-slate-soft">Peran {roleLabel}</div>
      </div>
      <button
        type="button"
        onClick={onLogout}
        className="w-full cursor-pointer rounded-[9px] border-none bg-transparent px-[10px] py-[9px] text-left text-[13px] text-danger-ink hover:bg-danger-tint"
      >
        Keluar dari akun
      </button>
    </div>
  );

  /*
   * On a phone the wide bar wrapped into three tall bands — wordmark, then a
   * full-width search, then a row holding the button and a name plate — which
   * spent about 340px of an 844px screen before a single booking appeared.
   *
   * Two rows instead. Identity and account sit on the first; the search and the
   * one action that starts work sit on the second. The name plate goes: the
   * initial in its disc already says who is signed in, and the full name, the
   * address, and the role are all in the menu one tap away.
   */
  if (compact) {
    return (
      <div className="border-b border-line px-[14px] py-[11px]">
        <div className="flex items-center gap-[10px]">
          <BrandLogo size={32} className="shrink-0" />
          <div className="min-w-0 flex-1 leading-[1.15]">
            <div className="truncate text-[14.5px] font-bold">
              Unmehopa Management
            </div>
            <div className="text-[11.5px] text-slate-soft">Booking Manager</div>
          </div>

          <div className="relative shrink-0" ref={menuRef}>
            <button
              type="button"
              onClick={onToggleMenu}
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              aria-label={`Akun ${userName}, peran ${roleLabel}`}
              className="flex h-[36px] w-[36px] cursor-pointer items-center justify-center rounded-full border-none bg-teal text-[13.5px] font-bold text-white"
            >
              {userInitial}
            </button>
            {menu}
          </div>
        </div>

        <div className="mt-[11px] flex items-center gap-2">
          <SearchField
            query={query}
            onQuery={onQuery}
            placeholder="Cari tamu, kamar, kode"
            shellClass="min-w-0 flex-1 px-[13px]"
            dotClass="h-[13px] w-[13px]"
            inputClass="py-[10px] text-[13px]"
          />
          <button
            type="button"
            onClick={onOpenForm}
            className="shrink-0 cursor-pointer rounded-[11px] border-none bg-teal px-[15px] py-[10px] text-[13px] font-semibold whitespace-nowrap text-white transition-colors hover:bg-teal-deep"
          >
            + Booking
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-3 border-b border-line px-[26px] py-[16px]">
      {showBrand && (
        <div className="flex shrink-0 items-center gap-3">
          <BrandLogo size={38} className="shrink-0" />
          <div className="leading-[1.15]">
            <div className="text-[15px] font-bold whitespace-nowrap">
              Unmehopa Management
            </div>
            <div className="text-[12px] text-slate-soft">Booking Manager</div>
          </div>
        </div>
      )}

      {/* Takes the whole gap between brand and actions and centres the field
          inside it, so the search sits mid-bar rather than tucked against the
          wordmark. */}
      <div className="flex min-w-[200px] flex-1 justify-center">
        <SearchField
          query={query}
          onQuery={onQuery}
          placeholder="Cari nama tamu, kamar, atau kode booking"
          shellClass="w-full max-w-[460px] px-[16px]"
          dotClass="h-[14px] w-[14px]"
          inputClass="py-[11px] text-[13.5px]"
        />
      </div>

      <div className="flex shrink-0 items-center gap-[10px]">
        <button
          type="button"
          onClick={onOpenForm}
          className="cursor-pointer rounded-[11px] border-none bg-teal px-[18px] py-[11px] text-[13.5px] font-semibold text-white transition-colors hover:bg-teal-deep"
        >
          + Booking Baru
        </button>

        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={onToggleMenu}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            className="flex cursor-pointer items-center gap-[9px] rounded-full border-none bg-surface-tint py-[5px] pr-[14px] pl-[5px] hover:bg-surface-hover"
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
          {menu}
        </div>
      </div>
    </div>
  );
}
