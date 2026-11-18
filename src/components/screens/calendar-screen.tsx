"use client";

import type { CalendarCell } from "@/lib/derive";
import { WARNA_AKTIVITAS } from "@/lib/dari-sistem-lama";
import type { RingkasSelam, SesiLama } from "@/lib/sistem-lama-bentuk";
import { WEEKDAYS } from "@/lib/format";

export interface CalendarScreenProps {
  narrow: boolean;
  /**
   * Phone widths. A month of named chips needs about 700px, so below this the
   * grid stops carrying names and becomes a density map instead.
   */
  compact: boolean;
  showMoney: boolean;
  conflictCount: number;
  /** Bentrok yang sudah diselesaikan (kompensasi dan sebagainya); ditautkan ke jendela bentrok. */
  selesaiCount?: number;
  /**
   * Which kind of overlap the banner is speaking for. `danger` is one whose
   * contested nights are still ahead and is drawn to interrupt; `past` is one
   * that has already happened, kept on the screen as a record and drawn so it
   * reads as one.
   */
  conflictTone: "danger" | "past";
  /** Ready-made sentence naming the room and the nights sold twice. */
  conflictText: string;
  onReviewConflict: () => void;
  monthLabel: string;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  occLabel: string;
  nightsLabel: string;
  revenueLabel: string;
  /**
   * Tiga sisanya dari dashboard ringkas PRD F6.1. Dikirim sebagai kalimat
   * jadi, sama seperti tiga di atasnya, supaya layar ini tidak perlu tahu
   * apa-apa soal cara menghitungnya.
   *
   * `belumDicatat` menandai mana yang bukan angka melainkan ketiadaan
   * catatan — piutang tanpa satu pun pembayaran tercatat akan terhitung
   * sebesar seluruh pendapatan, dan angka itu salah ke arah yang menakutkan.
   */
  newLabel: string;
  receivableLabel: string;
  checkinLabel: string;
  /**
   * Mana di antara nilai-nilai itu yang bukan angka melainkan ketiadaan
   * catatan. Ketiganya harus ikut: "belum ada harga" yang digambar setebal
   * Rp 12.500.000 di sebelahnya akan terbaca sebagai nominal dari sudut mata,
   * dan strip ini justru dibaca dari sudut mata.
   */
  belumDicatat: { pendapatan: boolean; baru: boolean; piutang: boolean };
  /**
   * Dive centre yang sedang dipilih: yang dijadwalkannya sesi, bukan kamar.
   *
   * Keenam angka di strip semuanya diturunkan dari kamar — okupansi, malam
   * terjual, pendapatan per malam, piutang menginap. Dibiarkan tergambar, unit
   * ini akan melaporkan okupansi nol persen dan pendapatan nol rupiah, yang
   * dua-duanya benar secara hitungan dan dua-duanya salah artinya. Jadi
   * strip-nya diganti, bukan dikosongkan.
   */
  hanyaJadwal?: boolean;
  /**
   * Jadwal dive centre pada bulan yang sedang dilihat.
   *
   * Angka sesi saja tidak menjawab apa pun — "ada 40 sesi" tidak memberi tahu
   * berapa orang yang datang, kegiatan apa yang penuh, atau apakah perahunya
   * perlu dua. Jadi yang dikirim ringkasan, bukan satu bilangan.
   */
  selamBulanIni?: RingkasSelam;
  /** Apakah sistem lama — satu-satunya sumber jadwal itu — sedang tersambung. */
  lamaTersambung?: boolean;
  cells: CalendarCell[];
  /**
   * Jadwal dive centre per tanggal, dari sistem lama. Kosong berarti belum
   * tersambung — dan sel yang kosong memang tidak menggambar apa-apa, bukan
   * menggambar "nol trip".
   */
  sesiPerTanggal?: Map<string, SesiLama[]>;
  onSelect: (id: string) => void;
  selectedDate: string | null;
  onSelectDate: (date: string) => void;
}

const ARROW_BUTTON =
  "cursor-pointer rounded-[11px] border border-line-strong bg-surface text-slate hover:bg-surface-hover";

function cellBackground(cell: CalendarCell) {
  /* Through the tokens rather than as literals, so the manager's own
     palette reaches the grid too. Written straight into the file, these
     four stayed the old cream while everything around them changed. */
  if (!cell.inMonth) return "var(--color-surface-out)";
  if (cell.conflictHere) return "var(--color-danger-cell)";
  if (cell.isToday) return "var(--color-teal-tint)";
  return "var(--color-surface)";
}

/**
 * How full the day is, as a bar rather than a list of names.
 *
 * One measure on one track, so the eye compares day against day down a column
 * and across a week without reading anything. Colour carries only the two
 * states worth interrupting for: sold out, and sold twice. Everything in
 * between is the same green at a different length, because length is the
 * quantity and hue would be saying it a second time.
 */
/**
 * Jadwal dive centre di dalam sel hari.
 *
 * Satu pil per aktivitas, dengan nama dan jumlah pax. Namanya ditulis penuh
 * dan tidak disingkat: aturan proyek ini menetapkan penamaan ikut sistem lama,
 * dan "SSI Dive Course" yang dipendekkan jadi "SSI" adalah kosakata baru yang
 * cuma ada di layar ini.
 */
function PitaSesi({ sesi }: { sesi?: SesiLama[] }) {
  if (!sesi || sesi.length === 0) return null;
  return (
    <div className="mt-[5px] flex flex-col gap-[3px]">
      {sesi.map((s, i) => {
        const w = WARNA_AKTIVITAS[s.aktivitas];
        return (
          <div
            key={`${s.aktivitas}-${i}`}
            title={`${s.label}${s.pax ? ` — ${s.pax} pax` : ""}${
              s.kamar.length ? ` · ${s.kamar.join(", ")}` : ""
            }`}
            className="flex items-center gap-[5px] overflow-hidden rounded-[6px] px-[6px] py-[2px] text-[10.5px] leading-[1.4]"
            style={{ background: w.bg, color: w.fg }}
          >
            <span className="truncate">{s.aktivitas}</span>
            {s.pax !== null && (
              <span className="ml-auto shrink-0 font-mono tabular-nums">
                {s.pax}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

/**
 * Versi telepon: titik saja.
 *
 * Di lebar telepon kisi ini sudah berhenti membawa nama — `compact` mengubahnya
 * jadi peta kepadatan. Menaruh nama aktivitas di sel selebar 50 px berarti
 * memotongnya jadi dua huruf, yang tidak memberi tahu apa pun. Titiknya
 * mengatakan "ada kegiatan hari itu", dan hari yang dipilih membuka daftarnya.
 */
function TitikSesi({ sesi }: { sesi?: SesiLama[] }) {
  if (!sesi || sesi.length === 0) return null;
  return (
    <div className="flex items-center gap-[2px]">
      {sesi.slice(0, 4).map((s, i) => (
        <span
          key={`${s.aktivitas}-${i}`}
          className="h-[4px] w-[4px] rounded-full"
          style={{ background: WARNA_AKTIVITAS[s.aktivitas].dot }}
        />
      ))}
    </div>
  );
}

function OccupancyMeter({ cell }: { cell: CalendarCell }) {
  if (!cell.inMonth || cell.capacity === 0) {
    return <div className="h-[5px]" />;
  }
  const ratio = Math.min(1, cell.occupied / cell.capacity);
  const full = cell.occupied >= cell.capacity;
  const fill = cell.conflictHere
    ? "var(--color-danger-ink)"
    : full
      ? "var(--color-gold)"
      : "var(--color-teal)";
  return (
    <div
      className="h-[5px] w-full overflow-hidden rounded-full bg-line-strong"
      role="img"
      aria-label={`${cell.occupied} dari ${cell.capacity} kamar terisi`}
    >
      <div
        className="h-full rounded-full"
        style={{
          width: `${Math.max(ratio * 100, ratio > 0 ? 14 : 0)}%`,
          background: fill,
        }}
      />
    </div>
  );
}

export function CalendarScreen({
  narrow,
  compact,
  showMoney,
  conflictCount,
  selesaiCount = 0,
  conflictTone,
  conflictText,
  onReviewConflict,
  monthLabel,
  onPrevMonth,
  onNextMonth,
  occLabel,
  nightsLabel,
  revenueLabel,
  newLabel,
  receivableLabel,
  checkinLabel,
  belumDicatat,
  hanyaJadwal = false,
  selamBulanIni,
  lamaTersambung = false,
  cells,
  sesiPerTanggal,
  onSelect,
  selectedDate,
  onSelectDate,
}: CalendarScreenProps) {
  /* Compact fits the seven columns to whatever width there is; wide keeps the
     700px floor so the named chips stay readable and the box scrolls. */
  const gridCols = {
    gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
    minWidth: compact ? 0 : narrow ? 700 : 0,
  };

  /**
   * Satu angka di strip ringkas.
   *
   * `unknown` menggambarnya beda: lebih kecil, tidak tebal, warna redup. Itu
   * bukan hiasan — "belum dicatat" yang digambar setebal dan sebesar angka
   * akan terbaca sebagai angka dari sudut mata, dan strip ini justru dibaca
   * dari sudut mata.
   */
  const Stat = ({
    label,
    value,
    unknown = false,
    span = false,
  }: {
    label: string;
    value: string;
    unknown?: boolean;
    span?: boolean;
  }) => (
    <div className={span && compact ? "col-span-2" : ""}>
      <div className="text-[11px] text-slate-soft">{label}</div>
      <div
        className={
          unknown
            ? "text-[13px] leading-[1.45] text-slate-faint"
            : compact
              ? "text-[17px] font-bold"
              : "text-[19px] font-bold"
        }
      >
        {value}
      </div>
    </div>
  );

  /*
   * Lima angka yang diminta PRD F6.1, ditambah malam terjual yang sudah ada.
   *
   * Check-in tujuh hari juga ada sebagai daftar di rail kanan, dan
   * pengulangannya disengaja: di layar HP rail itu berada di bawah kalender,
   * jadi angka yang paling sering ditanyakan pagi-pagi — siapa datang minggu
   * ini — hanya terlihat setelah menggulung melewati seluruh kisi.
   */
  const sesiBulanIni = selamBulanIni?.sesi ?? 0;

  const stats = hanyaJadwal ? (
    <>
      <Stat
        label="Sesi bulan ini"
        value={`${sesiBulanIni} sesi`}
        unknown={sesiBulanIni === 0}
      />
      {/* Tamu terdaftar, bukan persentase. Sistem lama mengirim berapa yang
          ikut, tidak berapa yang muat — tidak ada kapasitas perahu dan tidak
          ada batas per guide, jadi penyebutnya harus dikarang untuk membuat
          persen, dan persen berpenyebut karangan terbaca persis seperti
          persen yang benar. */}
      <Stat
        label="Tamu terdaftar"
        value={
          selamBulanIni?.pax === null || selamBulanIni === undefined
            ? "belum dicatat"
            : `${selamBulanIni.pax} tamu`
        }
        unknown={!selamBulanIni || selamBulanIni.pax === null}
      />
    </>
  ) : (
    <>
      <Stat label="Okupansi bulan ini" value={occLabel} />
      <Stat label="Malam terjual" value={nightsLabel} />
      {showMoney && (
        /* Spans the row on a phone rather than squeezing into a third column:
           a month past nine figures would not fit one, and a rupiah total that
           wraps mid-number is worse than one on its own line. */
        <Stat
          label="Pendapatan"
          value={revenueLabel}
          unknown={belumDicatat.pendapatan}
          span
        />
      )}
      {/* Rentangnya disebut di label, sama seperti tetangganya. "Booking baru"
          saja tidak mengatakan baru menurut apa, dan angka tanpa rentang di
          strip yang dibaca sekilas akan ditebak — biasanya sebagai bulan ini,
          yang bukan itu maksudnya. */}
      <Stat
        label="Booking baru 7 hari"
        value={newLabel}
        unknown={belumDicatat.baru}
      />
      <Stat label="Check-in 7 hari" value={checkinLabel} />
      {showMoney && (
        <Stat
          label="Piutang berjalan"
          value={receivableLabel}
          unknown={belumDicatat.piutang}
          span
        />
      )}
    </>
  );

  return (
    <div>
      {/* Kisi kosong tanpa satu kalimat pun terbaca sebagai layar rusak, dan
          dua sebab yang sangat berbeda menghasilkan kisi yang sama persis:
          sumbernya belum tersambung, atau bulannya memang lowong. Yang kedua
          kabar biasa; yang pertama berarti tidak ada yang tahu apa-apa. */}
      {hanyaJadwal && sesiBulanIni === 0 && (
        <div className="mb-4 rounded-[14px] border border-line-strong bg-surface-mute px-4 py-[13px] text-[12.5px] leading-[1.55] text-slate">
          {lamaTersambung
            ? "Tidak ada sesi terjadwal pada bulan ini."
            : "Jadwal dive centre dibaca dari sistem lama, dan sistem itu belum tersambung — jadi bulan yang kosong di sini belum tentu bulan yang lowong."}
        </div>
      )}

      {selesaiCount > 0 && !hanyaJadwal && (
        <div className="mb-4 flex flex-wrap items-center gap-3 rounded-[14px] border border-teal bg-surface-mute px-4 py-[10px] text-[13px] text-teal-deep">
          <span aria-hidden className="flex h-[20px] w-[20px] items-center justify-center rounded-full bg-teal text-[12px] font-bold text-white">✓</span>
          <span className="font-semibold">{selesaiCount} bentrok sudah diselesaikan</span>
          <button type="button" onClick={onReviewConflict} className="cursor-pointer border-none bg-transparent text-[12.5px] text-slate underline hover:text-teal">Lihat</button>
        </div>
      )}

      {conflictCount > 0 && !hanyaJadwal && (
        <div
          role="alert"
          className={`mb-4 rounded-[14px] border-2 px-4 py-[14px] ${
            conflictTone === "danger"
              ? "border-danger bg-danger text-white shadow-[0_6px_18px_-6px_rgba(176,56,38,0.55)]"
              : "border-amber-500 bg-amber-100 text-amber-950"
          } ${
            compact
              ? "flex flex-col gap-[10px]"
              : "flex items-center gap-[14px]"
          }`}
        >
          <div className="flex items-start gap-[11px]">
            <span
              aria-hidden
              className={`flex h-[24px] w-[24px] shrink-0 items-center justify-center rounded-full text-[14px] font-bold ${
                conflictTone === "danger" ? "bg-white text-danger" : "bg-amber-500 text-white"
              }`}
            >
              !
            </span>
            <div className="flex-1 text-[14.5px] leading-[1.45] font-bold">
              {conflictTone === "danger" && <span className="mr-2 rounded-full bg-white px-2 py-[1px] text-[11px] tracking-[0.1em] text-danger uppercase">Mendesak</span>}
              {conflictText}
            </div>
          </div>
          <button
            type="button"
            onClick={onReviewConflict}
            className={`cursor-pointer rounded-[10px] border-none px-[16px] py-2 text-[13px] font-bold ${
              conflictTone === "danger"
                ? "bg-white text-danger hover:bg-red-50"
                : "bg-amber-500 text-white hover:bg-amber-600"
            } ${compact ? "w-full" : "shrink-0"}`}
          >
            Tinjau
          </button>
        </div>
      )}

      {compact ? (
        <div className="mb-3">
          {/* Month and its two arrows on one line, pushed to the edges, so the
              row reads as a single control instead of three loose objects. */}
          <div className="mb-3 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={onPrevMonth}
              aria-label="Bulan sebelumnya"
              className={`${ARROW_BUTTON} h-[36px] w-[36px] text-[16px]`}
            >
              ‹
            </button>
            <div className="text-[18px] font-bold">{monthLabel}</div>
            <button
              type="button"
              onClick={onNextMonth}
              aria-label="Bulan berikutnya"
              className={`${ARROW_BUTTON} h-[36px] w-[36px] text-[16px]`}
            >
              ›
            </button>
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-3 rounded-[14px] border border-line-soft bg-surface px-4 py-[13px]">
            {stats}
          </div>
        </div>
      ) : (
        /* Both arrows together, then the month — the same stepper the report
           screen uses. Straddling the label meant a fixed 190px reservation to
           stop the second arrow sliding about between a short month and a long
           one, which left "Juli" with a hole beside it. */
        <div className="mb-[18px] flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-[10px]">
            <div className="flex items-center gap-[6px]">
              <button
                type="button"
                onClick={onPrevMonth}
                aria-label="Bulan sebelumnya"
                className={`${ARROW_BUTTON} h-[34px] w-[34px] text-[15px]`}
              >
                ‹
              </button>
              <button
                type="button"
                onClick={onNextMonth}
                aria-label="Bulan berikutnya"
                className={`${ARROW_BUTTON} h-[34px] w-[34px] text-[15px]`}
              >
                ›
              </button>
            </div>
            <div className="text-[22px] font-bold">{monthLabel}</div>
          </div>
          <div className="ml-auto flex flex-wrap gap-[22px]">{stats}</div>
        </div>
      )}

      {/* Rincian per kegiatan. Inilah yang hilang waktu strip-nya cuma
          menyebut jumlah sesi: yang ditanyakan orang yang menyiapkan besok
          bukan "berapa sesi", melainkan "diving berapa orang, snorkeling
          berapa". */}
      {hanyaJadwal && selamBulanIni && selamBulanIni.per.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-[7px]">
          {selamBulanIni.per.map((b) => {
            const w = WARNA_AKTIVITAS[b.aktivitas];
            return (
              <span
                key={b.aktivitas}
                className="flex items-center gap-[7px] rounded-[10px] px-[10px] py-[6px] text-[12.5px]"
                style={{ background: w.bg, color: w.fg }}
              >
                <span
                  className="h-[8px] w-[8px] shrink-0 rounded-full"
                  style={{ background: w.dot }}
                />
                <span className="font-medium">{b.aktivitas}</span>
                <span className="font-mono text-[11.5px] opacity-80">
                  {b.sesi} sesi
                  {b.pax === null ? "" : ` · ${b.pax} tamu`}
                </span>
              </span>
            );
          })}
        </div>
      )}

      {/* Sesi yang belum mencatat jumlah tamunya disebut, bukan diam-diam
          dilewati waktu menjumlah. */}
      {hanyaJadwal && selamBulanIni && selamBulanIni.tanpaPax > 0 && (
        <div className="mb-4 text-[12px] leading-[1.5] text-slate-mute">
          {selamBulanIni.tanpaPax} sesi belum mencatat jumlah tamunya, jadi
          tidak ikut terhitung di angka di atas.
        </div>
      )}

      <div
        className={`rounded-[20px] border border-line-soft bg-surface ${
          narrow && !compact
            ? "overflow-x-auto overflow-y-hidden"
            : "overflow-hidden"
        }`}
      >
        <div className="grid bg-surface-tint" style={gridCols}>
          {WEEKDAYS.map((d) => (
            <div
              key={d}
              className={`font-mono tracking-[.06em] uppercase ${
                compact
                  ? "px-1 py-[8px] text-center text-[10px] text-slate"
                  : "px-3 py-[11px] text-[11px] tracking-[.08em] text-slate-soft"
              }`}
            >
              {compact ? d.slice(0, 3) : d}
            </div>
          ))}
        </div>

        {compact ? (
          /*
           * Named chips need roughly 100px of column to be worth printing. At
           * seven to a phone there are fifty, so the old grid was 700px wide
           * inside a 360px box: three and a half columns visible, the rest
           * behind a sideways scroll, and a month view that could not show a
           * month. Here the whole month fits, each day says how full it is,
           * and tapping one opens the names underneath.
           */
          <div className="grid" style={gridCols}>
            {cells.map((cell, ci) => {
              const picked = selectedDate === cell.dateStr;
              return (
                <button
                  key={ci}
                  type="button"
                  onClick={() => onSelectDate(cell.dateStr)}
                  aria-pressed={picked}
                  aria-label={`${cell.dateStr}, ${cell.occupied} dari ${cell.capacity} kamar terisi`}
                  className="flex cursor-pointer flex-col items-center gap-[5px] border-r border-b border-line-fine px-[5px] py-[8px]"
                  style={{
                    background: cellBackground(cell),
                    outline: picked ? "2px solid var(--color-teal)" : undefined,
                    outlineOffset: -2,
                  }}
                >
                  {/* A neighbouring month's day is set back by colour, not by
                      fading the whole cell. At 45% opacity these numbers
                      measured 2.1:1 against their own background, and here
                      they are the only thing in the cell. */}
                  <span
                    className={
                      cell.isToday
                        ? "flex h-[24px] w-[24px] items-center justify-center rounded-full bg-teal text-[12px] font-bold text-white"
                        : `flex h-[24px] items-center justify-center text-[13px] font-medium ${
                            cell.inMonth ? "text-ink-soft" : "text-slate"
                          }`
                    }
                  >
                    {cell.label}
                  </span>
                  <OccupancyMeter cell={cell} />
                  <span
                    className="font-mono text-[10px] tabular-nums"
                    style={{
                      color: cell.conflictHere
                        ? "var(--color-danger-ink)"
                        : "var(--color-slate)",
                    }}
                  >
                    {cell.inMonth && cell.capacity > 0
                      ? `${cell.occupied}/${cell.capacity}`
                      : " "}
                  </span>
                  <TitikSesi sesi={sesiPerTanggal?.get(cell.dateStr)} />
                </button>
              );
            })}
          </div>
        ) : (
          <div className="grid" style={gridCols}>
            {cells.map((cell, ci) => (
              <div
                key={ci}
                className="relative min-h-[126px] border-r border-b border-line-fine px-[11px] py-[10px]"
                style={{
                  background: cellBackground(cell),
                  opacity: cell.inMonth ? 1 : 0.5,
                  /* Outline rather than a border: it paints inside the cell
                       and adds no width, so picking a day cannot nudge the
                       grid sideways. */
                  outline:
                    selectedDate === cell.dateStr
                      ? "2px solid var(--color-teal)"
                      : undefined,
                  outlineOffset: -2,
                }}
              >
                {/* The whole header strip opens the day list — the date, the
                  counter, and the empty space between them. Below it the chips
                  are their own targets, so this band is where a click can mean
                  "the day" rather than "this booking". */}
                <button
                  type="button"
                  onClick={() => onSelectDate(cell.dateStr)}
                  aria-pressed={selectedDate === cell.dateStr}
                  aria-label={`Lihat booking pada ${cell.dateStr}`}
                  title="Lihat semua booking pada tanggal ini"
                  className="flex w-full cursor-pointer items-center justify-between rounded-[9px] border-none bg-transparent px-[3px] py-[2px] text-left hover:bg-surface-hover"
                >
                  <span
                    className={
                      cell.isToday
                        ? "flex h-[26px] w-[26px] items-center justify-center rounded-full bg-teal text-[12.5px] font-bold text-white"
                        : "flex h-[26px] min-w-[26px] items-center justify-center text-[13px] font-medium text-ink-soft"
                    }
                  >
                    {cell.label}
                  </span>
                  {cell.inMonth && cell.capacity > 0 && (
                    <span
                      className="font-mono text-[10.5px]"
                      style={{
                        color:
                          cell.occupied >= cell.capacity
                            ? "var(--color-danger-ink)"
                            : /* Was #9D9486, measured 2.99:1 on white. This is a
                                 count somebody reads, not decoration. */
                              "var(--color-slate-mute)",
                      }}
                    >
                      {cell.occupied}/{cell.capacity}
                    </span>
                  )}
                </button>

                <PitaSesi sesi={sesiPerTanggal?.get(cell.dateStr)} />
                <div className="mt-[7px] flex flex-col gap-1">
                  {cell.chips.map((chip) => (
                    <button
                      key={chip.booking.id}
                      type="button"
                      onClick={() => onSelect(chip.booking.id)}
                      title={`${chip.booking.guest} · ${chip.booking.checkIn} → ${chip.booking.checkOut}`}
                      className="flex w-full min-w-0 cursor-pointer flex-col gap-[1px] overflow-hidden rounded-[7px] border-none px-[7px] py-[4px] text-left"
                      style={{ background: chip.bg, color: chip.fg }}
                    >
                      <span className="flex w-full min-w-0 items-center gap-[5px]">
                        <span
                          className="h-3 w-[3px] shrink-0 rounded-[2px]"
                          style={{ background: chip.dot }}
                        />
                        <span className="min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-[11.5px] font-medium">
                          {chip.label}
                        </span>
                        {chip.nightLabel && (
                          <span
                            className="shrink-0 font-mono text-[9.5px] opacity-70"
                            title={`Malam ke-${chip.nightLabel.split("/")[0]} dari ${chip.nightLabel.split("/")[1]}`}
                          >
                            {chip.nightLabel}
                          </span>
                        )}
                      </span>
                      <span className="min-w-0 overflow-hidden pl-[8px] text-[9.5px] text-ellipsis whitespace-nowrap opacity-75">
                        {chip.room}
                      </span>
                    </button>
                  ))}
                  {cell.hiddenCount > 0 && (
                    <button
                      type="button"
                      onClick={() => onSelectDate(cell.dateStr)}
                      title="Lihat semua booking pada tanggal ini"
                      className="cursor-pointer self-start rounded-[6px] border-none bg-transparent px-[3px] py-[1px] text-[11px] text-slate-mute underline decoration-dotted underline-offset-2 hover:bg-surface-hover hover:text-teal"
                    >
                      +{cell.hiddenCount} lagi
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {compact && (
        <p className="mt-[10px] px-1 text-[12px] leading-[1.5] text-slate-mute">
          Ketuk tanggal untuk melihat siapa saja yang menginap dan kamar mana
          yang masih kosong.
        </p>
      )}
    </div>
  );
}
