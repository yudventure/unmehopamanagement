"use client";

import { useState } from "react";
import { BrandLogo } from "@/components/brand-logo";
import { LoginIllustration } from "@/components/login-illustration";

/**
 * The hero panel ships an inline illustration, so nothing is required in
 * `public/`. Point NEXT_PUBLIC_LOGIN_HERO at a file there (e.g.
 * `/login-hero.jpg`) to swap in a real photograph instead; if that file 404s
 * the panel falls back to the illustration rather than a broken image.
 */
const HERO_SRC = process.env.NEXT_PUBLIC_LOGIN_HERO ?? "";


export interface LoginScreenProps {
  narrow: boolean;
  email: string;
  password: string;
  error: string;
  onEmail: (value: string) => void;
  onPassword: (value: string) => void;
  onSubmit: () => void;
  /** Sedang mengirim; tombol menahan klik kedua. */
  busy?: boolean;
  /**
   * Penyiapan akun developer pertama memakai layar yang sama, dengan isian
   * tambahan di atas email (kunci, nama) dan kalimat sendiri.
   */
  heading?: string;
  intro?: string;
  submitLabel?: string;
  extraFields?: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    type?: string;
    placeholder: string;
    autoComplete: string;
  }[];
  /** Tanpa "Ingat saya" dan "Lupa kata sandi", untuk layar penyiapan. */
  plain?: boolean;
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
 * The eye, and the eye with a line through it.
 *
 * Drawn here rather than imported: it is the only glyph this screen has, and
 * a file of one icon is a file to go looking for.
 */
function EyeIcon({ off }: { off: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
      {off && <path d="M4 20 20 4" />}
    </svg>
  );
}

/**
 * Boxed field with the label sitting above the value inside the same border,
 * and a brand-coloured bar on the focused row.
 *
 * `trailing` is for anything that belongs inside the box beside the value —
 * today the one button that shows the password. It sits outside the `label`
 * rather than within it, because a button inside a label is also a click on
 * the label, and the browser answers that by focusing the input: pressing the
 * eye would move the caret as well as reveal the text.
 */
function Field({
  label,
  value,
  onChange,
  type,
  placeholder,
  autoComplete,
  trailing,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type: string;
  placeholder: string;
  autoComplete: string;
  trailing?: React.ReactNode;
}) {
  const [focused, setFocused] = useState(false);

  return (
    <div className="relative flex items-stretch">
      <span
        aria-hidden
        className={`absolute top-0 bottom-0 left-0 w-[3px] rounded-r-[3px] ${
          focused ? "bg-teal" : "bg-transparent"
        }`}
      />
      <label className="flex min-w-0 flex-1 cursor-text flex-col gap-[3px] px-[15px] py-[9px]">
        <span className="text-[11.5px] text-slate-mute">{label}</span>
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className="w-full border-none bg-transparent p-0 text-[14.5px] font-medium text-ink outline-none placeholder:font-normal placeholder:text-slate-mute"
        />
      </label>
      {trailing}
    </div>
  );
}

export function LoginScreen({
  narrow,
  email,
  password,
  error,
  onEmail,
  onPassword,
  onSubmit,
  busy = false,
  heading = "Satu kalender untuk semua booking homestay Anda",
  intro = "Selamat datang kembali, silakan masuk ke akun Anda.",
  submitLabel = "Masuk",
  extraFields = [],
  plain = false,
}: LoginScreenProps) {
  /* Cosmetic until real sessions land — there is nothing yet to remember. */
  const [remember, setRemember] = useState(false);
  const [showReset, setShowReset] = useState(false);
  /* Off until asked for, and never remembered between visits: a password
     left readable on a shared laptop is the thing this button exists to make
     optional, not the thing it should default to. */
  const [showPass, setShowPass] = useState(false);


  return (
    <div className="fixed inset-0 z-[100] flex overflow-auto bg-surface">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}
        className={`flex min-h-full flex-col ${
          narrow
            ? "w-full px-[26px] pt-[30px] pb-7"
            : "w-[42%] min-w-[430px] max-w-[560px] shrink-0 px-[52px] py-[42px]"
        }`}
      >
        <div className="flex items-center gap-[10px]">
          <BrandLogo size={42} className="shrink-0" />
          <div className="text-[17px] font-bold tracking-[-.01em] text-teal">
            Unmehopa Management
          </div>
        </div>

        {/* Centred in the leftover height so the form sits mid-panel on tall
            screens instead of drifting to the bottom edge. */}
        <div className="flex flex-1 flex-col justify-center py-10">
          <div>
            <h1 className="text-[26px] leading-[1.28] font-bold tracking-[-.02em] text-balance text-ink">
              {heading}
            </h1>
            <p className="mt-[14px] text-[13.5px] leading-[1.5] text-pretty text-slate-soft">
              {intro}
            </p>
          </div>

          <div className="mt-[26px] overflow-hidden rounded-[12px] border-[1.5px] border-line-input">
            {extraFields.map((f) => (
              <div key={f.label}>
                <Field
                  label={f.label}
                  value={f.value}
                  onChange={f.onChange}
                  type={f.type ?? "text"}
                  placeholder={f.placeholder}
                  autoComplete={f.autoComplete}
                />
                <div className="h-px bg-line-input" />
              </div>
            ))}
            <Field
              label="Alamat Email"
              value={email}
              onChange={onEmail}
              type="email"
              placeholder="nama@perusahaan.com"
              autoComplete="username"
            />
            <div className="h-px bg-line-input" />
            <Field
              label="Kata Sandi"
              value={password}
              onChange={onPassword}
              type={showPass ? "text" : "password"}
              /* Words, not dots. A row of bullets in the placeholder reads as
                 a password already typed — which is exactly what it was taken
                 for — and a field that looks filled is a field nobody fills. */
              placeholder="Masukkan kata sandi"
              autoComplete={plain ? "new-password" : "current-password"}
              trailing={
                <button
                  type="button"
                  onClick={() => setShowPass((v) => !v)}
                  /* Keeps the caret where it was: without this the button
                     takes focus, and somebody checking a typo mid-word has to
                     click back into the field to carry on. */
                  onMouseDown={(e) => e.preventDefault()}
                  aria-pressed={showPass}
                  aria-label={
                    showPass ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"
                  }
                  title={showPass ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
                  className={`mr-[7px] flex w-[40px] shrink-0 cursor-pointer items-center justify-center self-stretch rounded-[9px] border-none bg-transparent ${
                    showPass ? "text-teal" : "text-slate-mute"
                  } hover:bg-surface-hover hover:text-teal`}
                >
                  <EyeIcon off={showPass} />
                </button>
              }
            />
          </div>

          {!plain && (
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
          )}

          {showReset && !plain && (
            <div className="mt-[10px] rounded-[10px] bg-teal-tint px-[13px] py-[9px] text-[12px] leading-[1.5] text-slate">
              Hubungi developer atau pemilik untuk mengatur ulang kata sandi
              Anda dari halaman Pengguna.
            </div>
          )}

          {error && (
            <div className="mt-[14px] rounded-[10px] border border-danger-line bg-danger-tint px-[13px] py-[9px] text-[12.5px] text-danger-ink">
              {error}
            </div>
          )}

          <div className="mt-[22px]">
            <button
              type="submit"
              disabled={busy}
              className="w-full disabled:cursor-wait disabled:opacity-70 cursor-pointer rounded-[9px] border-[1.5px] border-teal bg-teal py-[12px] text-[14px] font-bold text-white hover:border-teal-deep hover:bg-teal-deep"
            >
              {busy ? "Memproses…" : submitLabel}
            </button>
          </div>

        </div>
      </form>

      {!narrow && <LoginHero />}
    </div>
  );
}
