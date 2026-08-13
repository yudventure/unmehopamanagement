"use client";

import { useState } from "react";
import { LoginIllustration } from "@/components/login-illustration";
import { OWNER_EMAIL, STAFF_EMAIL } from "@/lib/data";
import type { Role } from "@/lib/types";

/**
 * The hero panel ships an inline illustration, so nothing is required in
 * `public/`. Point NEXT_PUBLIC_LOGIN_HERO at a file there (e.g.
 * `/login-hero.jpg`) to swap in a real photograph instead; if that file 404s
 * the panel falls back to the illustration rather than a broken image.
 */
const HERO_SRC = process.env.NEXT_PUBLIC_LOGIN_HERO ?? "";

const DEMO_PASSWORD = "demo1234";

export interface LoginScreenProps {
  narrow: boolean;
  email: string;
  password: string;
  role: Role;
  error: string;
  onEmail: (value: string) => void;
  onPassword: (value: string) => void;
  onRole: (role: Role) => void;
  onSubmit: () => void;
}

function LoginHero() {
  const [broken, setBroken] = useState(false);

  return (
    <div className="relative min-w-0 flex-1 bg-teal-tint">
      {HERO_SRC && !broken ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={HERO_SRC}
          alt=""
          onError={() => setBroken(true)}
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        <LoginIllustration className="absolute inset-0 h-full w-full" />
      )}
    </div>
  );
}

/**
 * Boxed field with the label sitting above the value inside the same border,
 * and a brand-coloured bar on the focused row.
 */
function Field({
  label,
  value,
  onChange,
  type,
  placeholder,
  autoComplete,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type: string;
  placeholder: string;
  autoComplete: string;
}) {
  const [focused, setFocused] = useState(false);

  return (
    <label className="relative flex cursor-text flex-col gap-[3px] px-[15px] py-[9px]">
      <span
        aria-hidden
        className={`absolute top-0 bottom-0 left-0 w-[3px] rounded-r-[3px] ${
          focused ? "bg-teal" : "bg-transparent"
        }`}
      />
      <span className="text-[11.5px] text-slate-mute">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className="border-none bg-transparent p-0 text-[14.5px] font-medium text-ink outline-none placeholder:font-normal placeholder:text-slate-ghost"
      />
    </label>
  );
}

export function LoginScreen({
  narrow,
  email,
  password,
  role,
  error,
  onEmail,
  onPassword,
  onRole,
  onSubmit,
}: LoginScreenProps) {
  /* Cosmetic until real sessions land — there is nothing yet to remember. */
  const [remember, setRemember] = useState(false);
  const [showReset, setShowReset] = useState(false);

  const fillDemo = () => {
    onEmail(role === "owner" ? OWNER_EMAIL : STAFF_EMAIL);
    onPassword(DEMO_PASSWORD);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center overflow-auto bg-canvas p-7">
      <div
        className="m-auto flex w-full overflow-hidden rounded-[26px] bg-surface shadow-[0_30px_70px_rgba(20,50,42,.16)]"
        style={{
          maxWidth: narrow ? 430 : 1000,
          minHeight: narrow ? "auto" : 604,
        }}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit();
          }}
          className={`flex shrink-0 flex-col ${
            narrow ? "w-full px-[26px] pt-[30px] pb-7" : "w-[430px] px-[46px] py-[40px]"
          }`}
        >
          <div className="flex items-center gap-[10px]">
            <div className="flex h-[34px] w-[34px] items-center justify-center rounded-[12px] bg-teal text-[15px] font-bold text-white">
              R
            </div>
            <div className="text-[17px] font-bold tracking-[-.01em] text-teal">
              Rumah Papua
            </div>
          </div>

          <div className="mt-auto pt-10">
            <h1 className="text-[26px] leading-[1.28] font-bold tracking-[-.02em] text-balance text-ink">
              Satu kalender untuk semua booking homestay Anda
            </h1>
            <p className="mt-[14px] text-[13.5px] leading-[1.5] text-pretty text-slate-soft">
              Selamat datang kembali, silakan masuk ke akun Anda.
            </p>
          </div>

          <div className="mt-[26px] overflow-hidden rounded-[12px] border-[1.5px] border-line-input">
            <Field
              label="Alamat Email"
              value={email}
              onChange={onEmail}
              type="text"
              placeholder="nama@rumahpapua.id"
              autoComplete="username"
            />
            <div className="h-px bg-line-input" />
            <Field
              label="Kata Sandi"
              value={password}
              onChange={onPassword}
              type="password"
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </div>

          <div className="mt-[14px] flex items-center justify-between">
            <label className="flex cursor-pointer items-center gap-[7px] text-[12.5px] text-slate-soft">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="h-[13px] w-[13px] accent-teal"
              />
              Ingat saya
            </label>
            <button
              type="button"
              onClick={() => setShowReset((v) => !v)}
              className="cursor-pointer border-none bg-transparent p-0 text-[12.5px] text-slate-soft hover:text-teal hover:underline"
            >
              Lupa kata sandi?
            </button>
          </div>

          {showReset && (
            <div className="mt-[10px] rounded-[10px] bg-teal-tint px-[13px] py-[9px] text-[12px] leading-[1.5] text-slate">
              Hubungi Owner untuk mereset akun Anda. Reset mandiri lewat email
              belum tersedia.
            </div>
          )}

          {error && (
            <div className="mt-[14px] rounded-[10px] border border-danger-line bg-danger-tint px-[13px] py-[9px] text-[12.5px] text-danger-ink">
              {error}
            </div>
          )}

          <div className="mt-[22px] flex gap-[11px]">
            <button
              type="submit"
              className="min-w-[122px] flex-1 cursor-pointer rounded-[9px] border-[1.5px] border-teal bg-teal py-[12px] text-[14px] font-bold text-white hover:border-teal-deep hover:bg-teal-deep"
            >
              Masuk
            </button>
            <button
              type="button"
              onClick={fillDemo}
              className="min-w-[122px] flex-1 cursor-pointer rounded-[9px] border-[1.5px] border-teal bg-surface py-[12px] text-[14px] font-bold text-teal hover:bg-teal-tint"
            >
              Isi akun demo
            </button>
          </div>

          <div className="mt-[26px] flex flex-wrap items-center gap-x-[18px] gap-y-[6px]">
            <span className="text-[12.5px] text-slate-mute">
              Atau masuk sebagai
            </span>
            {(
              [
                { key: "owner", name: "Owner" },
                { key: "staf", name: "Staf" },
              ] as const
            ).map((r) => (
              <button
                key={r.key}
                type="button"
                onClick={() => onRole(r.key)}
                aria-pressed={role === r.key}
                className={`cursor-pointer border-none bg-transparent p-0 text-[12.5px] font-bold hover:underline ${
                  role === r.key ? "text-teal underline" : "text-slate-faint"
                }`}
              >
                {r.name}
              </button>
            ))}
          </div>
        </form>

        {!narrow && <LoginHero />}
      </div>
    </div>
  );
}
