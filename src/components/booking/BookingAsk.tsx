"use client";

import { BOOKING_SUGGESTIONS, bookingReply, type Quote } from "@/lib/booking";
import type { Hotel } from "@/lib/hotels";
import type { Requirement } from "@/lib/requirements";
import { Handover } from "../results/Handover";
import { ScopedCopilot } from "../ScopedCopilot";

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
  if (showHandover) {
    return (
      <div className="border-line bg-surface rounded-lg border p-24">
        <Handover requirements={requirements} staysViewed={[hotel.name]} onBack={() => onHandover(false)} />
      </div>
    );
  }
  const late = requirements.some((r) => r.kind === "late-arrival");
  return (
    <ScopedCopilot
      title="Ask about this booking"
      intro="Copilot can explain anything on this page. It cannot change your booking or pay."
      placeholder="Ask about this booking"
      suggestions={BOOKING_SUGGESTIONS.filter(
        (s) => (q.refundable ? !/non-refundable/.test(s) : true) && (late || !/late-arrival/.test(s)),
      )}
      reply={(text) => bookingReply(text, hotel, q, flexibleQuote)}
      focusOnOpen
      onHide={onClose}
      onPerson={() => onHandover(true)}
    />
  );
}
