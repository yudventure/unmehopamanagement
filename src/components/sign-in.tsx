"use client";

import { useEffect, useState } from "react";

import { LoginScreen } from "@/components/login-screen";

/**
 * Layar masuk, berdiri sendiri di depan dashboard.
 *
 * Terpisah dari dashboard karena halamanlah yang memutuskan mana yang
 * dirender, dan pengunjung tanpa sesi tidak boleh dikirimi dashboardnya sama
 * sekali. Login yang digambar di atas halaman yang sudah tiba adalah tirai,
 * bukan pintu.
 *
 * Kedua kotak mulai kosong dan tidak ada pilihan peran: peran datang dari akun
 * tempat alamat itu terdaftar, di server. Kata sandi diperiksa oleh
 * `/api/login`, bukan di sini; yang kembali adalah cookie `httpOnly` yang tidak
 * bisa dibaca skrip mana pun di halaman ini.
 *
 * Kalau belum ada akun sama sekali, layar yang sama berganti menjadi
 * penyiapan akun developer pertama (`/api/penyiapan`).
 */
export function SignIn({ perluPenyiapan = false }: { perluPenyiapan?: boolean }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [kunci, setKunci] = useState("");
  const [nama, setNama] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [narrow, setNarrow] = useState(false);
  const [siap, setSiap] = useState(perluPenyiapan);

  /* Separuh ilustrasi dibuang di ponsel. Diukur setelah mount, dan mengikuti
     jendela supaya memutar tablet tidak meninggalkan ukuran yang salah. */
  useEffect(() => {
    const check = () => setNarrow(window.innerWidth < 900);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const submit = async () => {
    if (busy) return;
    if (!email.trim() || !password) {
      setError("Email dan kata sandi wajib diisi.");
      return;
    }
    if (siap && (!kunci.trim() || !nama.trim())) {
      setError("Kunci penyiapan, nama, email, dan kata sandi wajib diisi.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const res = await fetch(siap ? "/api/penyiapan" : "/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          siap ? { kunci, nama, email, sandi: password } : { email, password },
        ),
      });
      if (res.ok) {
        /* Dimuat ulang, bukan membalik state, supaya halaman dirender lagi
           oleh server dengan cookie di tangan. */
        window.location.reload();
        return;
      }
      const o = (await res.json().catch(() => ({}))) as { galat?: string; error?: string };
      if (res.status === 409 && o.error === "belum-ada-akun") {
        setSiap(true);
        setError("");
      } else if (res.status === 429) {
        setError("Terlalu banyak percobaan. Tunggu beberapa menit.");
      } else if (siap) {
        setError(o.galat ?? "Penyiapan gagal.");
      } else {
        setError("Email atau kata sandi salah.");
      }
    } catch {
      setError("Tidak bisa menghubungi server.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <LoginScreen
      narrow={narrow}
      email={email}
      password={password}
      error={error}
      busy={busy}
      onEmail={setEmail}
      onPassword={setPassword}
      onSubmit={submit}
      plain={siap}
      heading={siap ? "Buat akun developer pertama" : undefined}
      intro={
        siap
          ? "Belum ada akun. Isi kunci penyiapan dari panel hosting, lalu buat akun yang akan mengatur semua akun lain. Kata sandi paling sedikit 10 huruf."
          : undefined
      }
      submitLabel={siap ? "Buat akun dan masuk" : undefined}
      extraFields={
        siap
          ? [
              { label: "Kunci penyiapan", value: kunci, onChange: setKunci, type: "password", placeholder: "Dari panel hosting", autoComplete: "off" },
              { label: "Nama", value: nama, onChange: setNama, placeholder: "Nama lengkap", autoComplete: "name" },
            ]
          : []
      }
    />
  );
}
