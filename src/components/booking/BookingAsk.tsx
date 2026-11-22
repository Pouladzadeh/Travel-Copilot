"use client";

import { useEffect, useRef, useState } from "react";
import { BOOKING_SUGGESTIONS, bookingReply, type Quote } from "@/lib/booking";
import type { Hotel } from "@/lib/hotels";
import type { Requirement } from "@/lib/requirements";
import { Button } from "../Button";
import { CopilotComposer } from "../CopilotComposer";
import { CopilotMessage } from "../CopilotMessage";
import { Icon } from "../Icon";
import { RequirementChip } from "../RequirementChip";
import { Handover } from "../results/Handover";

type Msg =
  | { id: number; role: "traveler"; text: string }
  | { id: number; role: "copilot"; text: string; source?: string; person?: boolean; rating?: "up" | "down" };

/**
 * "Ask about this booking" (Figma moment 120:927). Closed until asked for,
 * scoped to this booking: it explains the page, suggests no other hotels or
 * extras, and cannot change the booking or pay.
 */
export function BookingAsk({
  hotel,
  q,
  flexibleQuote,
  requirements,
  showHandover,
  onHandover,
  onClose,
}: {
  hotel: Hotel;
  q: Quote;
  flexibleQuote?: Quote;
  requirements: Requirement[];
  showHandover: boolean;
  onHandover: (open: boolean) => void;
  onClose: () => void;
}) {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [busy, setBusy] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => () => clearTimeout(timer.current), []);
  useEffect(() => heading.current?.focus(), []);

  function ask(text: string) {
    if (busy) return;
    const id = Date.now();
    setMsgs((m) => [...m, { id, role: "traveler", text }]);
    setBusy(true);
    timer.current = setTimeout(() => {
      const a = bookingReply(text, hotel, q, flexibleQuote);
      setMsgs((m) => [...m, { id: id + 1, role: "copilot", ...a }]);
      setBusy(false);
    }, 600);
  }

  const asked = new Set(msgs.filter((m) => m.role === "traveler").map((m) => m.text));
  const suggestions = BOOKING_SUGGESTIONS.filter(
    (s) =>
      !asked.has(s) &&
      (q.refundable ? !/non-refundable/.test(s) : true) &&
      (requirements.some((r) => r.kind === "late-arrival") || !/late-arrival/.test(s)),
  );
  const lastQuestion = [...msgs].reverse().find((m) => m.role === "traveler")?.text;

  return (
    <section
      aria-labelledby="ask-booking-heading"
      className="border-line bg-surface flex max-h-[calc(100vh-32px)] flex-col gap-16 overflow-y-auto rounded-lg border p-24"
    >
      {showHandover ? (
        <Handover requirements={requirements} staysViewed={[hotel.name]} openQuestion={lastQuestion} onBack={() => onHandover(false)} />
      ) : (
        <>
          <div className="flex items-center gap-8">
            <Icon name="sparkle" size={20} />
            <h2 id="ask-booking-heading" ref={heading} tabIndex={-1} className="text-heading-s text-fg flex-1 outline-none">
              Ask about this booking
            </h2>
            <Button variant="ghost" onClick={onClose} className="!min-h-0 !px-0 !py-0">
              Hide
            </Button>
          </div>
          <p className="text-body-m text-fg-secondary">Copilot can explain anything on this page. It cannot change your booking or pay.</p>

          <div className="flex flex-col gap-16" aria-live="polite">
            {msgs.map((m) =>
              m.role === "traveler" ? (
                <CopilotMessage key={m.id} role="traveler">
                  {m.text}
                </CopilotMessage>
              ) : (
                <div key={m.id} className="flex flex-col gap-12">
                  <CopilotMessage
                    role="copilot"
                    showFeedback
                    feedback={m.rating ?? null}
                    onFeedback={(r) =>
                      setMsgs((all) =>
                        all.map((x) => (x.id === m.id && x.role === "copilot" ? { ...x, rating: x.rating === r ? undefined : r } : x)),
                      )
                    }
                    onReport={() => (window.location.href = `/report?answer=booking-${m.id}`)}
                  >
                    {m.text}
                  </CopilotMessage>
                  {m.source && <p className="text-label-m text-fg-link">Source: {m.source}</p>}
                  {m.person && (
                    <Button variant="secondary" onClick={() => onHandover(true)} className="self-start">
                      Talk to a person
                    </Button>
                  )}
                </div>
              ),
            )}
            {busy && <p className="text-body-s text-fg-secondary">Copilot is answering…</p>}
          </div>

          {suggestions.length > 0 && !busy && (
            <div className="flex flex-wrap gap-8">
              {suggestions.slice(0, msgs.length ? 2 : 3).map((s) => (
                <RequirementChip key={s} state="suggested" label={s} onClick={() => ask(s)} />
              ))}
            </div>
          )}
          <CopilotComposer placeholder="Ask about this booking" disabled={busy} disabledText="Copilot is answering…" onSend={ask} />
        </>
      )}
    </section>
  );
}
