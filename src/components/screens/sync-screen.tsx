"use client";

import { useState } from "react";

import { Pill } from "@/components/ui/pill";
import { CH, CHANNEL_LABELS, PROPERTIES } from "@/lib/data";
import { fmtDateTime } from "@/lib/format";
import type { ChannelKey, ExportToken, IcalFeed, Room } from "@/lib/types";

/** Only these publish an iCal calendar; WhatsApp and Blokir have none. */
const OTA_CHANNELS: ChannelKey[] = ["Booking.com", "Agoda", "Traveloka"];

export interface SyncScreenProps {
  rooms: Room[];
  feeds: IcalFeed[];
  tokens: ExportToken[];
  onAddFeed: (
    roomId: string,
    channel: ChannelKey,
    url: string,
  ) => string | null;
  onRemoveFeed: (id: string) => void;
  onIssueToken: (roomId: string) => void;
  onResetToken: (roomId: string) => void;
  /** Base the export URL is built on, e.g. https://unmehopa.example. */
  origin: string;
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-[6px] font-mono text-[10.5px] tracking-[.08em] text-slate-faint uppercase">
        {title}
      </div>
      {children}
    </div>
  );
}

function ExportRow({
  room,
  token,
  origin,
  onIssue,
  onReset,
}: {
  room: Room;
  token?: ExportToken;
  origin: string;
  onIssue: () => void;
  onReset: () => void;
}) {
  const [copied, setCopied] = useState(false);

  if (!token) {
    return (
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-[12.5px] text-slate-mute">
          Belum ada URL ekspor untuk kamar ini.
        </span>
        <button
          type="button"
          onClick={onIssue}
          className="cursor-pointer rounded-[9px] border border-teal bg-surface px-[13px] py-[6px] text-[12.5px] font-medium text-teal hover:bg-teal-tint"
        >
          Buat URL ekspor
        </button>
      </div>
    );
  }

  const url = `${origin}/api/ical/${token.token}.ics`;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <code className="min-w-0 flex-1 overflow-hidden rounded-[9px] border border-line-input bg-surface px-[11px] py-[7px] font-mono text-[11.5px] text-ellipsis whitespace-nowrap text-ink-soft">
        {url}
      </code>
      <button
        type="button"
        onClick={() => {
          navigator.clipboard?.writeText(url);
          setCopied(true);
          setTimeout(() => setCopied(false), 1600);
        }}
        className="cursor-pointer rounded-[9px] border border-line-strong bg-surface px-[13px] py-[7px] text-[12.5px] font-medium hover:bg-surface-hover"
      >
        {copied ? "Tersalin" : "Salin"}
      </button>
      <button
        type="button"
        onClick={onReset}
        title="Buat token baru — URL lama langsung tidak berlaku"
        className="cursor-pointer rounded-[9px] border border-line-strong bg-surface px-[13px] py-[7px] text-[12.5px] text-slate hover:bg-surface-hover"
      >
        Reset token
      </button>
      <span className="w-full font-mono text-[10.5px] text-slate-faint">
        dibuat {fmtDateTime(new Date(token.createdAt))}
      </span>
    </div>
  );
}

function ImportBlock({
  room,
  feeds,
  onAdd,
  onRemove,
}: {
  room: Room;
  feeds: IcalFeed[];
  onAdd: (channel: ChannelKey, url: string) => string | null;
  onRemove: (id: string) => void;
}) {
  const [channel, setChannel] = useState<ChannelKey>("Booking.com");
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");

  const submit = () => {
    const problem = onAdd(channel, url.trim());
    if (problem) {
      setError(problem);
      return;
    }
    setUrl("");
    setError("");
  };

  return (
    <div className="flex flex-col gap-[7px]">
      {feeds.map((f) => (
        <div
          key={f.id}
          className="flex flex-wrap items-center gap-2 rounded-[10px] border border-line bg-surface px-[11px] py-[7px]"
        >
          <Pill colors={{ bg: CH[f.channel].bg, fg: CH[f.channel].fg }}>
            {CHANNEL_LABELS[f.channel]}
          </Pill>
          <code className="min-w-0 flex-1 overflow-hidden font-mono text-[11.5px] text-ellipsis whitespace-nowrap text-slate">
            {f.url}
          </code>
          <span className="font-mono text-[10.5px] text-amber-ink">
            belum pernah ditarik
          </span>
          <button
            type="button"
            onClick={() => onRemove(f.id)}
            className="cursor-pointer rounded-[8px] border-none bg-transparent px-2 py-1 text-[12px] text-danger hover:bg-danger-tint"
          >
            Hapus
          </button>
        </div>
      ))}

      <div className="flex flex-wrap items-center gap-2">
        <select
          value={channel}
          onChange={(e) => setChannel(e.target.value as ChannelKey)}
          aria-label={`Saluran feed untuk ${room.name}`}
          className="rounded-[9px] border border-line-input bg-surface px-[10px] py-[7px] text-[12.5px] outline-none focus:border-teal"
        >
          {OTA_CHANNELS.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <input
          value={url}
          onChange={(e) => {
            setUrl(e.target.value);
            setError("");
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") submit();
          }}
          placeholder="https://… URL iCal dari extranet OTA"
          aria-label={`URL iCal untuk ${room.name}`}
          className="min-w-[220px] flex-1 rounded-[9px] border border-line-input bg-surface px-[11px] py-[7px] font-mono text-[11.5px] outline-none focus:border-teal"
        />
        <button
          type="button"
          onClick={submit}
          className="cursor-pointer rounded-[9px] border-none bg-teal px-[15px] py-[8px] text-[12.5px] font-bold text-white hover:bg-teal-deep"
        >
          Tambah
        </button>
      </div>
      {error && <div className="text-[12px] text-danger-ink">{error}</div>}
    </div>
  );
}

/**
 * Where the owner collects the iCal URLs on both directions. Nothing here
 * fetches or serves anything yet — there is no backend — so every feed reads
 * "belum pernah ditarik" rather than inventing a sync time, and the export URL
 * is labelled as not yet live so it does not get pasted into an extranet that
 * would only fail to reach it.
 */
export function SyncScreen({
  rooms,
  feeds,
  tokens,
  onAddFeed,
  onRemoveFeed,
  onIssueToken,
  onResetToken,
  origin,
}: SyncScreenProps) {
  const tokenFor = new Map(tokens.map((t) => [t.roomId, t]));
  const feedsFor = (roomId: string) => feeds.filter((f) => f.roomId === roomId);
  const props = PROPERTIES.filter((p) => rooms.some((r) => r.prop === p.key));

  return (
    <div>
      <div className="mb-1 text-[22px] font-bold">Sinkronisasi OTA</div>
      <div className="mb-4 max-w-[760px] text-[13.5px] leading-[1.55] text-slate-soft">
        Dua arah per kamar. <strong>Impor</strong> menarik kalender dari OTA ke
        sini. <strong>Ekspor</strong> memberi OTA satu URL berisi seluruh
        booking kamar ini, supaya tanggal yang sudah terjual — termasuk lewat
        WhatsApp — otomatis terblokir di semua platform.
      </div>

      <div className="mb-6 flex items-start gap-[12px] rounded-[14px] border border-amber-soft bg-amber-soft/40 px-4 py-[13px]">
        <span className="mt-[5px] h-[9px] w-[9px] shrink-0 rounded-full bg-amber-shade" />
        <div className="text-[13px] leading-[1.55] text-amber-ink">
          <strong>Penarikan otomatis belum berjalan.</strong> URL yang Anda
          simpan di sini tersimpan sebagai pengaturan, tapi belum ada yang
          menariknya — itu butuh database dan penjadwal di server. URL ekspor
          juga <strong>belum bisa diakses OTA</strong>, jadi jangan dipasang di
          extranet dulu; kumpulkan saja URL impornya sekarang.
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {props.map((p) => (
          <div
            key={p.key}
            className="overflow-hidden rounded-[20px] border border-line-soft bg-surface"
          >
            <div className="flex flex-wrap items-center gap-3 border-b border-line-fine px-5 py-4">
              <div className="text-[16px] font-bold">{p.name}</div>
              <div className="text-[12.5px] text-slate-soft">{p.location}</div>
              <div className="ml-auto font-mono text-[11.5px] text-slate-mute">
                {
                  feeds.filter((f) =>
                    rooms.some((r) => r.id === f.roomId && r.prop === p.key),
                  ).length
                }{" "}
                feed impor
              </div>
            </div>

            <div className="flex flex-col">
              {rooms
                .filter((r) => r.prop === p.key)
                .map((room) => (
                  <div
                    key={room.id}
                    className="flex flex-col gap-[14px] border-t border-line-row px-5 py-[18px] first:border-t-0"
                  >
                    <div className="flex items-center gap-[10px]">
                      <div className="text-[14px] font-bold">{room.name}</div>
                      {!room.active && (
                        <span className="rounded-full bg-amber-soft px-[8px] py-[2px] text-[11px] text-amber-ink">
                          Renovasi
                        </span>
                      )}
                    </div>

                    <Section title="Impor dari OTA">
                      <ImportBlock
                        room={room}
                        feeds={feedsFor(room.id)}
                        onAdd={(c, u) => onAddFeed(room.id, c, u)}
                        onRemove={onRemoveFeed}
                      />
                    </Section>

                    <Section title="Ekspor ke OTA">
                      <ExportRow
                        room={room}
                        token={tokenFor.get(room.id)}
                        origin={origin}
                        onIssue={() => onIssueToken(room.id)}
                        onReset={() => onResetToken(room.id)}
                      />
                    </Section>
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
