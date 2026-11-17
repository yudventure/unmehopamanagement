import "server-only";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { PROPERTIES } from "@/lib/data";
import { layarUntuk, lihatSemua } from "@/lib/peran";
import { SESSION_COOKIE, valid } from "@/lib/session";
import type { Akun } from "@/lib/server/akun";
import type { PropertyKey, Screen } from "@/lib/types";

/** Akun yang sedang masuk, atau null. Pemeriksaan ke akunnya, bukan hanya cookie. */
export async function akunMasuk(): Promise<Akun | null> {
  const jar = await cookies();
  return valid(jar.get(SESSION_COOKIE)?.value);
}

/** Jawaban untuk yang tidak berhak: 404, seperti rute lain, bukan pengakuan bahwa rutenya ada. */
export const tidakAda = () => NextResponse.json({ error: "not-found" }, { status: 404 });
export const galat = (pesan: string, status = 400) => NextResponse.json({ galat: pesan }, { status });

export const bolehLayar = (a: Akun, layar: Screen) => layarUntuk(a.peran).includes(layar);

/** Properti yang boleh disentuh akun ini, dari `scope` seperti di dashboard. */
export function propertiBoleh(a: Akun): PropertyKey[] {
  const semua = PROPERTIES.map((p) => p.key);
  if (lihatSemua(a.peran) || a.scope === "Semua properti") return semua;
  const cocok = PROPERTIES.find((p) => p.name === a.scope);
  /* Dive center dijalankan Turtle, jadi yang memegang Turtle memegangnya juga. */
  if (cocok?.key === "turtle") return ["turtle", "divecenter"];
  return cocok ? [cocok.key] : [];
}

/** Properti sebuah kamar, atau null kalau kamarnya tidak ada. */
export async function propertiKamar(roomId: string): Promise<PropertyKey | null> {
  const { ambilKamar } = await import("@/lib/server/buku");
  return (await ambilKamar()).find((r) => r.id === roomId)?.prop ?? null;
}

/** Boleh mencatat dan mengubah pesanan: yang punya Kalender, kecuali keuangan yang hanya melihat. */
export const bolehCatat = (a: Akun) => bolehLayar(a, "kalender") && a.peran !== "keuangan";
