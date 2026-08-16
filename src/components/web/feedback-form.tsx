"use client";

import { useState } from "react";

import type { SiteCopy } from "@/lib/web-content";

/**
 * Somewhere to say what went wrong, or what could be better.
 *
 * This is not the enquiry form and should not be confused with it: nobody
 * booking a room is going to find it down here, and somebody who has already
 * stayed has nowhere else to put a thought. It goes to the same inbox through
 * the same route, flagged as feedback so the subject line says so.
 *
 * Email is optional on purpose. Requiring a reply address on a suggestion box
 * turns it into a support ticket, and the honest ones are often the anonymous
 * ones.
 */
type Status = "idle" | "sending" | "sent" | "empty" | "failed";

export function FeedbackForm({ t }: { t: SiteCopy }) {
  const f = t.footer.feedback;
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  /* Off-screen rather than display:none — the crudest bots skip anything
     hidden, and this one is meant to be filled in. */
  const [trap, setTrap] = useState("");

  const send = async () => {
    if (!message.trim()) {
      setStatus("empty");
      return;
    }
    setStatus("sending");
    try {
      const res = await fetch("/api/enquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "feedback",
          notes: message,
          email,
          website: trap,
        }),
      });
      /* 503 means no mail key is plugged in yet. Unlike the enquiry form there
         is no WhatsApp to fall back to — a suggestion is not a conversation —
         so it says so rather than pretending it sent. */
      setStatus(res.ok ? "sent" : "failed");
    } catch {
      setStatus("failed");
    }
  };

  const field =
    "w-full rounded-[10px] border border-white/20 bg-white/10 px-[13px] py-[10px] text-[13.5px] text-white outline-none transition-colors placeholder:text-white/45 focus:border-white/50";

  if (status === "sent") {
    return (
      <div className="rounded-[14px] border border-white/20 bg-white/10 px-4 py-[14px] text-[13px] leading-[1.6] text-white/85">
        {f.sent}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-[10px]">
      <label className="sr-only" htmlFor="feedback-message">
        {f.message}
      </label>
      <textarea
        id="feedback-message"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        rows={3}
        placeholder={f.messagePlaceholder}
        className={`${field} resize-y`}
      />

      <label className="sr-only" htmlFor="feedback-email">
        {f.email}
      </label>
      <input
        id="feedback-email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder={f.emailPlaceholder}
        inputMode="email"
        autoComplete="email"
        className={field}
      />

      <input
        value={trap}
        onChange={(e) => setTrap(e.target.value)}
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="absolute left-[-9999px] h-px w-px opacity-0"
      />

      <button
        type="button"
        onClick={send}
        disabled={status === "sending"}
        className={`mt-1 rounded-full border-none px-5 py-[11px] text-[13.5px] font-medium ${
          status === "sending"
            ? "cursor-wait bg-white/30 text-white/70"
            : "cursor-pointer bg-white text-ink hover:bg-surface-hover"
        }`}
      >
        {status === "sending" ? f.sending : f.submit}
      </button>

      {(status === "empty" || status === "failed") && (
        <div className="text-[12.5px] leading-[1.5] text-amber">
          {status === "empty" ? f.empty : f.failed}
        </div>
      )}
    </div>
  );
}
