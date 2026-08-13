"use client";

import { useState } from "react";
import type { Role } from "@/lib/types";

/**
 * The design leaves the right-hand panel as a fillable photo slot. Drop an
 * image into `public/` and point NEXT_PUBLIC_LOGIN_HERO at it (e.g.
 * `/login-hero.jpg`); with the variable unset the panel renders the empty-slot
 * framing from the design instead of requesting a file that isn't there.
 */
const HERO_SRC = process.env.NEXT_PUBLIC_LOGIN_HERO ?? "";

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

const ROLE_CHOICES: { key: Role; name: string; hint: string }[] = [
  { key: "owner", name: "Owner", hint: "Penuh + laporan" },
  { key: "staf", name: "Staf", hint: "Kalender & booking" },
];

const FIELD_LABEL =
  "flex flex-col gap-[7px] font-mono text-[10px] tracking-[.12em] text-slate-mute uppercase";
const FIELD_INPUT =
  "border-none border-b-[1.5px] border-line-input bg-transparent px-[2px] py-[9px] font-sans text-[14.5px] outline-none focus:border-teal";

function LoginHero() {
  const [broken, setBroken] = useState(false);
  const showPlaceholder = !HERO_SRC || broken;

  return (
    <div className="relative min-w-0 flex-1 bg-teal-deep">
      {showPlaceholder ? (
        <div className="absolute inset-0 flex items-center justify-center p-8">
          <div className="flex h-full w-full items-center justify-center rounded-[10px] border-[1.5px] border-dashed border-white/35 px-6 text-center text-[12.5px] leading-[1.5] font-medium text-white/60">
            Foto aerial homestay / laut Raja Ampat
          </div>
        </div>
      ) : (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={HERO_SRC}
          alt=""
          onError={() => setBroken(true)}
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}

      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(to top, rgba(6,44,38,.82) 0%, rgba(6,44,38,.18) 46%, rgba(6,44,38,0) 72%)",
        }}
      />

      <div className="pointer-events-none absolute right-9 bottom-[34px] left-9">
        <div className="mb-[10px] font-mono text-[10.5px] tracking-[.18em] text-white/70 uppercase">
          Raja Ampat, Papua Barat Daya
        </div>
        <div className="text-[31px] leading-[1.14] font-bold tracking-[-.02em] text-white">
          Satu kalender untuk
          <br />
          semua saluran booking
        </div>
        <div className="mt-[22px] flex gap-[26px] border-t border-white/20 pt-5">
          {[
            { value: "12", label: "kamar aktif" },
            { value: "4", label: "saluran tersinkron" },
            { value: "0", label: "double booking" },
          ].map((s) => (
            <div key={s.label}>
              <div className="text-[19px] font-bold text-white">{s.value}</div>
              <div className="text-[11.5px] text-white/70">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
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
  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center overflow-auto bg-canvas p-7">
      <div
        className="m-auto flex w-full overflow-hidden rounded-[26px] bg-surface shadow-[0_30px_70px_rgba(20,50,42,.16)]"
        style={{
          maxWidth: narrow ? 430 : 980,
          minHeight: narrow ? "auto" : 586,
        }}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit();
          }}
          className={`flex shrink-0 flex-col ${
            narrow ? "w-full px-[26px] pt-[30px] pb-7" : "w-[430px] px-[42px] py-[38px]"
          }`}
        >
          <div className="mb-auto flex items-center gap-[11px]">
            <div className="flex h-[38px] w-[38px] items-center justify-center rounded-[13px] bg-teal text-[16px] font-bold text-white">
              R
            </div>
            <div className="leading-[1.15]">
              <div className="text-[15px] font-bold">Rumah Papua</div>
              <div className="text-[12px] text-slate-soft">Booking Manager</div>
            </div>
          </div>

          <div className="mt-9 mb-6">
            <div className="mb-3 font-mono text-[10.5px] tracking-[.16em] text-teal uppercase">
              Masuk
            </div>
            <div className="mb-2 text-[27px] leading-[1.2] font-bold tracking-[-.02em]">
              Selamat datang kembali
            </div>
            <div className="text-[13.5px] leading-[1.55] text-pretty text-slate-soft">
              Kelola seluruh bookingan Turtle dan Eddo Homestay dari satu
              kalender.
            </div>
          </div>

          <div className="flex flex-col gap-[14px]">
            <label className={FIELD_LABEL}>
              Email
              <input
                type="text"
                value={email}
                onChange={(e) => onEmail(e.target.value)}
                placeholder="nama@rumahpapua.id"
                autoComplete="username"
                className={FIELD_INPUT}
              />
            </label>
            <label className={FIELD_LABEL}>
              Kata sandi
              <input
                type="password"
                value={password}
                onChange={(e) => onPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                className={FIELD_INPUT}
              />
            </label>
          </div>

          <div className="mt-[22px]">
            <div className="mb-[9px] font-mono text-[10px] tracking-[.12em] text-slate-mute uppercase">
              Masuk sebagai
            </div>
            <div className="flex gap-2">
              {ROLE_CHOICES.map((r) => (
                <button
                  key={r.key}
                  type="button"
                  onClick={() => onRole(r.key)}
                  aria-pressed={role === r.key}
                  className={`flex-1 cursor-pointer rounded-[13px] border-[1.5px] px-[13px] py-[11px] text-left text-ink ${
                    role === r.key
                      ? "border-teal bg-teal-tint"
                      : "border-line-strong bg-surface"
                  }`}
                >
                  <span className="block text-[13px] font-bold">{r.name}</span>
                  <span className="mt-[2px] block text-[11.5px] text-slate-soft">
                    {r.hint}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="mt-4 rounded-[11px] border border-danger-line bg-danger-tint px-[13px] py-[10px] text-[12.5px] text-danger-ink">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="mt-6 w-full cursor-pointer rounded-[13px] border-none bg-teal py-[14px] text-[14.5px] font-bold tracking-[.01em] text-white hover:bg-teal-deep"
          >
            Masuk ke dashboard
          </button>
          <div className="mt-4 text-[12.5px] text-slate-mute">
            Lupa kata sandi? Hubungi Owner untuk reset akun.
          </div>
        </form>

        {!narrow && <LoginHero />}
      </div>
    </div>
  );
}
