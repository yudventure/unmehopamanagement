import { MONTHS, fmt, fmtDate, fmtDateTime } from "./format";
import type { DayOccupancy, MonthPoint } from "./derive";

/** One booking as it appears in the exported ledger. */
export interface ReportRow {
  id: string;
  property: string;
  room: string;
  guest: string;
  phone: string;
  /** Null bila belum dicatat. Dikosongkan di berkas, bukan ditulis nol. */
  pax: number | null;
  channel: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  /** Of those nights, how many fall inside the reported month. */
  nightsInMonth: number;
  status: string;
  total: number;
  /** The share of `total` earned in the reported month. */
  valueInMonth: number;
}

export interface ReportData {
  monthLabel: string;
  /** "2026-08" — used for the filename, so exports sort by month. */
  monthKey: string;
  /** Staff never see rupiah; every money column drops out rather than blanks. */
  showMoney: boolean;
  scopeLabel: string;
  kpis: { label: string; value: string; sub: string }[];
  channels: { label: string; value: number; share: number }[];
  rooms: { name: string; pct: number; nights: number }[];
  trend: MonthPoint[];
  daily: DayOccupancy[];
  rows: ReportRow[];
  commission: number;
  generatedAt: Date;
}

export const monthName = (p: MonthPoint) => MONTHS[p.monthIndex];
export const monthShort = (p: MonthPoint) =>
  `${MONTHS[p.monthIndex].slice(0, 3)} ${String(p.year).slice(2)}`;

// ---------------------------------------------------------------------- CSV

/**
 * Semicolon-separated, with a UTF-8 BOM.
 *
 * Both are for Excel in an Indonesian locale: it reads `;` as the field
 * separator when the decimal mark is a comma, and without the BOM it renders
 * the accented guest names as mojibake. Numbers go out unformatted so they
 * arrive as numbers, not as text that happens to look like money.
 */
function csvCell(v: string | number): string {
  const s = String(v);
  return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function csvBlock(rows: (string | number)[][]): string {
  return rows.map((r) => r.map(csvCell).join(";")).join("\r\n");
}

export function buildCsv(d: ReportData): string {
  const money = d.showMoney;

  const summary: (string | number)[][] = [
    ["Laporan Unmehopa Management"],
    ["Bulan", d.monthLabel],
    ["Cakupan", d.scopeLabel],
    ["Dibuat", fmtDateTime(d.generatedAt)],
    [],
    ["Ringkasan"],
    ...d.kpis.map((k) => [k.label, k.value, k.sub]),
    [],
    ["Okupansi per bulan"],
    ["Bulan", "Malam terjual", "Kapasitas", "Okupansi %", ...(money ? ["Pendapatan"] : []), "Status"],
    ...d.trend.map((p) => [
      `${monthName(p)} ${p.year}`,
      p.nights,
      p.capacity,
      p.pct,
      ...(money ? [Math.round(p.revenue)] : []),
      p.settled ? "selesai" : p.current ? "berjalan" : "baru terisi sebagian",
    ]),
    [],
    ["Okupansi harian " + d.monthLabel],
    ["Tanggal", "Kamar terisi", "Kamar aktif", "Okupansi %"],
    ...d.daily.map((x) => [x.date, x.occupied, x.capacity, x.pct]),
    [],
    ["Okupansi per kamar"],
    ["Kamar", "Malam terjual", "Okupansi %"],
    ...d.rooms.map((r) => [r.name, r.nights, r.pct]),
  ];

  if (money) {
    summary.push(
      [],
      ["Pendapatan per saluran"],
      ["Saluran", "Pendapatan", "Porsi %"],
      ...d.channels.map((c) => [c.label, Math.round(c.value), c.share]),
      ["Estimasi komisi OTA", Math.round(d.commission), ""],
    );
  }

  const header = [
    "Kode",
    "Properti",
    "Kamar",
    "Tamu",
    "Telepon",
    "Tamu (pax)",
    "Saluran",
    "Check-in",
    "Check-out",
    "Malam",
    "Malam di bulan ini",
    "Status",
    ...(money ? ["Nilai booking", "Nilai di bulan ini"] : []),
  ];

  const ledger: (string | number)[][] = [
    [],
    ["Daftar booking " + d.monthLabel],
    header,
    ...d.rows.map((r) => [
      r.id,
      r.property,
      r.room,
      r.guest,
      r.phone,
      /* Sel kosong, bukan 0. Nol tamu adalah pernyataan yang salah, dan di
         kolom angka ia akan ikut terjumlah oleh siapa pun yang membuka
         berkas ini di spreadsheet. */
      r.pax ?? "",
      r.channel,
      r.checkIn,
      r.checkOut,
      r.nights,
      r.nightsInMonth,
      r.status,
      ...(money ? [Math.round(r.total), Math.round(r.valueInMonth)] : []),
    ]),
  ];

  return "﻿" + csvBlock([...summary, ...ledger]);
}

/** Hands the browser a file. Revoked on the next tick so the tab keeps nothing. */
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

export function downloadCsv(d: ReportData) {
  downloadBlob(
    new Blob([buildCsv(d)], { type: "text/csv;charset=utf-8" }),
    `laporan-unmehopa-${d.monthKey}.csv`,
  );
}

// ---------------------------------------------------------------------- PDF

const TEAL: [number, number, number] = [14, 124, 107];
const TEAL_LIGHT: [number, number, number] = [62, 154, 139];
const INK: [number, number, number] = [22, 33, 30];
const SLATE: [number, number, number] = [122, 139, 133];
const LINE: [number, number, number] = [226, 234, 231];

/**
 * A one-page summary, not the whole ledger — the row-by-row detail is what the
 * CSV is for, and 60-odd booking rows would push this to four pages nobody
 * prints. jsPDF is imported on demand so it stays out of the initial bundle.
 */
export async function downloadPdf(d: ReportData) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "pt", format: "a4" });

  const M = 40;
  const W = doc.internal.pageSize.getWidth();
  const CW = W - M * 2;
  let y = 54;

  const setInk = (c: [number, number, number]) => doc.setTextColor(...c);

  doc.setFont("helvetica", "bold").setFontSize(9);
  setInk(TEAL);
  doc.text("UNMEHOPA MANAGEMENT", M, y);

  y += 22;
  doc.setFont("helvetica", "bold").setFontSize(19);
  setInk(INK);
  doc.text(`Laporan ${d.monthLabel}`, M, y);

  y += 15;
  doc.setFont("helvetica", "normal").setFontSize(9);
  setInk(SLATE);
  doc.text(
    `${d.scopeLabel} · dibuat ${fmtDateTime(d.generatedAt)}`,
    M,
    y,
  );

  // KPI row.
  y += 16;
  const boxW = (CW - 3 * 8) / 4;
  d.kpis.forEach((k, i) => {
    const x = M + i * (boxW + 8);
    doc.setDrawColor(...LINE).setLineWidth(0.8);
    doc.roundedRect(x, y, boxW, 56, 6, 6);
    doc.setFont("helvetica", "normal").setFontSize(7.5);
    setInk(SLATE);
    doc.text(k.label, x + 9, y + 15);
    doc.setFont("helvetica", "bold").setFontSize(13);
    setInk(INK);
    doc.text(k.value, x + 9, y + 33);
    doc.setFont("helvetica", "normal").setFontSize(7);
    setInk(SLATE);
    doc.text(k.sub, x + 9, y + 47, { maxWidth: boxW - 18 });
  });
  y += 56;

  // ---- monthly trend
  y += 26;
  doc.setFont("helvetica", "bold").setFontSize(11);
  setInk(INK);
  doc.text("Tren okupansi", M, y);
  doc.setFont("helvetica", "normal").setFontSize(7.5);
  setInk(SLATE);
  doc.text(
    "Batang gelap: bulan yang sudah selesai. Batang muda: bulan yang belum lewat, baru terisi sebagian.",
    M,
    y + 12,
  );

  y += 24;
  const plotH = 96;
  const base = y + plotH;
  /* The scale sits inside the left margin, the way it does on screen — parked
     past the right edge it would print within a few points of the paper. */
  const GUTTER = 26;
  const plotX = M + GUTTER;
  const plotW = CW - GUTTER;

  doc.setDrawColor(...LINE).setLineWidth(0.6);
  [0, 25, 50, 75, 100].forEach((g) => {
    const gy = base - (g / 100) * plotH;
    doc.line(plotX, gy, plotX + plotW, gy);
    doc.setFont("helvetica", "normal").setFontSize(6);
    setInk(SLATE);
    doc.text(`${g}%`, plotX - 4, gy + 2, { align: "right" });
  });

  const slot = plotW / d.trend.length;
  const barW = Math.min(20, slot - 4);
  d.trend.forEach((p, i) => {
    const x = plotX + i * slot + (slot - barW) / 2;
    const h = Math.max(1, (p.pct / 100) * plotH);
    doc.setFillColor(...(p.settled || p.current ? TEAL : TEAL_LIGHT));
    doc.rect(x, base - h, barW, h, "F");
    doc.setFont("helvetica", p.current ? "bold" : "normal").setFontSize(6);
    setInk(SLATE);
    doc.text(monthShort(p), x + barW / 2, base + 10, { align: "center" });
    doc.setFontSize(6.5);
    setInk(INK);
    doc.text(`${p.pct}`, x + barW / 2, base - h - 3, { align: "center" });
  });
  y = base + 18;

  // ---- daily occupancy
  y += 22;
  doc.setFont("helvetica", "bold").setFontSize(11);
  setInk(INK);
  doc.text(`Okupansi harian ${d.monthLabel}`, M, y);

  y += 12;
  const dH = 70;
  const dBase = y + dH;
  doc.setDrawColor(...LINE).setLineWidth(0.6);
  doc.line(plotX, dBase, plotX + plotW, dBase);
  doc.setFont("helvetica", "normal").setFontSize(6);
  setInk(SLATE);
  doc.text("100%", plotX - 4, y + 3, { align: "right" });
  doc.text("0%", plotX - 4, dBase + 2, { align: "right" });

  const dSlot = plotW / d.daily.length;
  const dBar = Math.min(12, dSlot - 2);
  d.daily.forEach((x, i) => {
    const bx = plotX + i * dSlot + (dSlot - dBar) / 2;
    const h = Math.max(0.6, (x.pct / 100) * dH);
    doc.setFillColor(...(x.past ? TEAL : TEAL_LIGHT));
    doc.rect(bx, dBase - h, dBar, h, "F");
    if (x.day === 1 || x.day % 5 === 0) {
      doc.setFont("helvetica", "normal").setFontSize(5.5);
      setInk(SLATE);
      doc.text(String(x.day), bx + dBar / 2, dBase + 8, { align: "center" });
    }
  });
  y = dBase + 16;

  // ---- tables
  const tableTop = y + 18;
  const colW = (CW - 16) / 2;

  const table = (
    x0: number,
    title: string,
    head: string[],
    body: (string | number)[][],
  ) => {
    let ty = tableTop;
    doc.setFont("helvetica", "bold").setFontSize(11);
    setInk(INK);
    doc.text(title, x0, ty);
    ty += 14;
    doc.setFont("helvetica", "bold").setFontSize(7);
    setInk(SLATE);
    head.forEach((h, i) =>
      doc.text(h, i === 0 ? x0 : x0 + colW, ty, {
        align: i === 0 ? "left" : "right",
      }),
    );
    ty += 4;
    doc.setDrawColor(...LINE).setLineWidth(0.6);
    doc.line(x0, ty, x0 + colW, ty);
    ty += 12;
    body.forEach((row) => {
      doc.setFont("helvetica", "normal").setFontSize(8);
      setInk(INK);
      doc.text(String(row[0]), x0, ty, { maxWidth: colW * 0.55 });
      doc.text(String(row[1]), x0 + colW, ty, { align: "right" });
      ty += 13;
    });
    return ty;
  };

  const left = d.showMoney
    ? table(
        M,
        "Pendapatan per saluran",
        ["Saluran", "Pendapatan"],
        d.channels.map((c) => [c.label, fmt(c.value)]),
      )
    : tableTop;

  const right = table(
    M + colW + 16,
    "Okupansi per kamar",
    ["Kamar", "Okupansi"],
    d.rooms.map((r) => [r.name, `${r.pct}%`]),
  );

  y = Math.max(left, right) + 6;

  if (d.showMoney) {
    doc.setFont("helvetica", "normal").setFontSize(7.5);
    setInk(SLATE);
    doc.text(
      `Estimasi komisi OTA ${fmt(d.commission)}, dihitung dari tarif per platform yang diisi manual.`,
      M,
      y,
    );
    y += 12;
  }

  const pageH = doc.internal.pageSize.getHeight();
  doc.setFont("helvetica", "normal").setFontSize(7);
  setInk(SLATE);
  doc.text(
    `Ringkasan ${d.monthLabel}. Rincian per booking ada di ekspor CSV. Dicetak ${fmtDate(
      `${d.generatedAt.getFullYear()}-${String(d.generatedAt.getMonth() + 1).padStart(2, "0")}-${String(d.generatedAt.getDate()).padStart(2, "0")}`,
    )}.`,
    M,
    pageH - 28,
  );

  doc.save(`laporan-unmehopa-${d.monthKey}.pdf`);
}
