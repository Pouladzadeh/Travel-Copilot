"use client";

import { useState } from "react";
import { updateBooking, useBooking } from "@/lib/bookingRecord";
import { hotelById } from "@/lib/hotels";
import { Button } from "../Button";
import { Dialog } from "../Dialog";
import { Icon } from "../Icon";
import { StatusPill } from "../StatusPill";

/**
 * Message the hotel (Figma 95:1600 / dialog 79:1322). Copilot may draft the
 * text; only the traveler sends it. SAMPLE: nothing leaves the browser.
 */
export function MessageHotelForm({
  hotelId,
  draft,
  kind,
  onDone,
}: {
  hotelId: string;
  draft?: string;
  kind?: "request";
  onDone: () => void;
}) {
  const h = hotelById(hotelId);
  const booking = useBooking();
  const reservation = booking && booking.hotelId === hotelId && !booking.cancelledOn ? booking.confirmation : undefined;
  const [text, setText] = useState(draft ?? "");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState(false);
  if (!h) return <p className="text-body-m text-fg">This hotel could not be found.</p>;

  if (sent) {
    return (
      <div className="flex flex-col gap-16" role="status">
        <p className="text-body-m text-fg flex items-start gap-8">
          <Icon name="pill-check" size={16} />
          Sent to {h.name}. The hotel’s reply goes to your email{reservation ? " and to Trips" : ""}. Most hotels answer within a day.
        </p>
        <p className="text-body-s text-fg-tertiary">Sample data: no message was actually sent.</p>
        <div className="flex justify-end">
          <Button onClick={onDone}>Done</Button>
        </div>
      </div>
    );
  }

  return (
    <form
      className="flex flex-col gap-20"
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        if (!text.trim()) {
          setError(true);
          return;
        }
        if (reservation)
          updateBooking((b) => ({ ...b, messages: [...(b.messages ?? []), { at: new Date().toISOString(), text: text.trim() }] }));
        setSent(true);
      }}
    >
      <div className="flex flex-col gap-2">
        <p className="text-body-s text-fg-secondary">To</p>
        <p className="text-label-m text-fg">{h.name} · front desk</p>
        <p className="text-body-s text-fg-secondary">
          {reservation ? `Reservation ${reservation} is attached.` : "No reservation is attached. Ask anything before you book."}
        </p>
      </div>
      <div className="flex flex-col gap-8">
        <div className="flex items-center gap-8">
          <label htmlFor="msg" className="text-label-m text-fg">
            Your message
          </label>
          {draft && <StatusPill type="copilot" label="Drafted by Copilot" />}
        </div>
        <textarea
          id="msg"
          value={text}
          rows={4}
          onChange={(e) => {
            setText(e.target.value);
            setError(false);
          }}
          placeholder={
            kind === "request" ? "For example: a high floor, a cot, or an early breakfast." : "Write your question for the hotel."
          }
          aria-invalid={error || undefined}
          aria-describedby="msg-note"
          className={`bg-surface text-body-l text-fg placeholder:text-fg-tertiary w-full resize-y rounded-md border p-12 outline-none focus:border-2 focus:border-[var(--color-border-focus)] focus:p-[11px] ${error ? "border-[var(--color-text-danger)]" : "border-line-input"}`}
        />
        <p id="msg-note" className={`text-body-s ${error ? "text-fg-danger" : "text-fg-secondary"}`}>
          {error ? "Write a message before you send it." : "Edit anything before you send. Copilot does not send messages for you."}
        </p>
      </div>
      <p className="text-body-s text-fg-tertiary">
        The hotel’s reply goes to your email{reservation ? " and to Trips" : ""}. Most hotels answer within a day.
      </p>
      <div className="flex items-center justify-end gap-12">
        <Button variant="ghost" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit">Send message</Button>
      </div>
    </form>
  );
}

export function MessageHotelDialog(p: { hotelId: string; draft?: string; kind?: "request"; onClose: () => void }) {
  return (
    <Dialog title="Message the hotel" onClose={p.onClose}>
      <MessageHotelForm hotelId={p.hotelId} draft={p.draft} kind={p.kind} onDone={p.onClose} />
    </Dialog>
  );
}
