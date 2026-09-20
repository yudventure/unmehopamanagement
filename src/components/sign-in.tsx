"use client";

import { useEffect, useState } from "react";

import { LoginScreen } from "@/components/login-screen";
import { OWNER_EMAIL, STAFF_EMAIL } from "@/lib/data";
import type { Role } from "@/lib/types";

/**
 * The sign-in screen, standing on its own in front of the booking manager.
 *
 * Separate from the manager rather than inside it, because the page decides
 * which of the two to render and an unsigned visitor should not be sent the
 * manager at all. A login drawn on top of a page that has already arrived is a
 * curtain, not a door.
 *
 * The password is checked by `/api/login`, never here. What comes back is an
 * `httpOnly` cookie this component cannot read, which is the point: nothing on
 * this page can hand that cookie to anyone.
 */
export function SignIn() {
  /* Both boxes start empty, and the role chooser starts on neither. A sign-in
     that opens with somebody's address already in it is a demo: it publishes
     what an account here is called, and it makes a member of staff clear the
     owner's address before typing their own. */
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [narrow, setNarrow] = useState(false);

  /* The illustration half is dropped on a phone. Measured after mount rather
     than guessed, and kept in step with the window so rotating a tablet does
     not leave it wrong. */
  useEffect(() => {
    const check = () => setNarrow(window.innerWidth < 900);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  /* The chooser only fills an address in, and only when somebody presses it.
     What a signed-in person may see is decided from the account the address
     belongs to, never from this. */
  const pickRole = (next: Role) => {
    setRole(next);
    setEmail(next === "owner" ? OWNER_EMAIL : STAFF_EMAIL);
  };

  const submit = async () => {
    if (busy) return;
    if (!email.trim() || !password.trim()) {
      setError("Email dan kata sandi wajib diisi.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (res.ok) {
        /* Remembered so the manager opens as the person who just signed in.
           It is a label, not a permission: the cookie is what grants access,
           and the account behind the address is what limits it. */
        try {
          window.sessionStorage.setItem("unmehopa_email", email.trim());
        } catch {
          /* Private windows refuse storage. Losing the prefill is not worth
             refusing the sign-in over. */
        }
        /* A reload rather than a state flip, so the page is rendered again by
           the server with the cookie in hand. */
        window.location.reload();
        return;
      }

      if (res.status === 503) {
        setError("Login belum disiapkan di server. Isi DASHBOARD_PASSWORD.");
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
      role={role}
      error={error}
      onEmail={setEmail}
      onPassword={setPassword}
      onRole={pickRole}
      onSubmit={submit}
    />
  );
}
