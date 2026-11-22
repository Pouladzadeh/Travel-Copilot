/**
 * After booking: the "Before you travel" checklist (Confirmation 17:475) and
 * the calendar file and receipt. Built from the reservation and hotel data,
 * so it only says what Copilot could or could not confirm while choosing.
 */
import type { PillType } from "@/components/StatusPill";
import { money2, quote } from "./booking";
import type { BookingRecord } from "./bookingRecord";
import { dayLabel, nights } from "./dates";
import type { Hotel } from "./hotels";
import { decodeRequirements, type Requirement } from "./requirements";

export type ChecklistItem = {
  key: string;
  title: string;
  text: string;
  source: string;
  pill: { type: PillType; label: string };
  draft?: string;
  call?: boolean;
  person?: boolean;
};

export const requirementsOf = (b: BookingRecord): Requirement[] => decodeRequirements(b.requirements);

export function bookingQuote(b: BookingRecord, h: Hotel) {
  const n = nights(b.checkIn, b.checkOut);
  const q = quote(h, b.rate, n);
  // The price paid wins over today's rate (it may have changed during checkout).
  return q.perNight === b.perNight ? q : quote(h, b.rate, n, b.perNight);
}

export function beforeYouTravel(b: BookingRecord, h: Hotel): ChecklistItem[] {
  const reqs = requirementsOf(b);
  const late = reqs.some((r) => r.kind === "late-arrival");
  const q = bookingQuote(b, h);
  const arrival = b.arrival || (late ? "after midnight" : "");
  const arrivalShort = arrival.replace(/^After midnight, /i, "");
  const items: ChecklistItem[] = [];

  if (late) {
    const byStatus: Record<Hotel["late"]["status"], ChecklistItem> = {
      confirmed: {
        key: "hold",
        title: "Confirm the late-arrival hold",
        text: `The hotel’s policy page does not say how long a room is held after midnight. Message or call the hotel and mention that you arrive ${arrivalShort || "after midnight"}.`,
        source: `Source: ${h.late.source}`,
        pill: { type: "unconfirmed", label: "Still to confirm" },
        draft: `Hello, I have reservation ${b.confirmation} and arrive ${arrivalShort || "after midnight"} on ${dayLabel(b.checkIn)}. Can you confirm my room will be held until then?`,
        call: true,
      },
      conditional: {
        key: "hold",
        title: "Call ahead on the day you arrive",
        text: "The night porter lets guests in after midnight only if you call on the day you arrive. Save the hotel’s number now.",
        source: `Source: ${h.late.source}`,
        pill: { type: "conditional", label: `On ${dayLabel(b.checkIn)}` },
        draft: `Hello, I have reservation ${b.confirmation} and arrive ${arrivalShort || "after midnight"} on ${dayLabel(b.checkIn)}. Please let the night porter know to expect me.`,
        call: true,
      },
      unconfirmed: {
        key: "hold",
        title: "Confirm someone can check you in after midnight",
        text: "I could not confirm front desk hours after 11 pm. Ask the hotel before you travel.",
        source: `Source: ${h.late.source}`,
        pill: { type: "unconfirmed", label: "Still to confirm" },
        draft: `Hello, I have reservation ${b.confirmation} and arrive ${arrivalShort || "after midnight"} on ${dayLabel(b.checkIn)}. Will someone be at the front desk to check me in?`,
        call: true,
      },
      no: {
        key: "hold",
        title: "This hotel does not check in after midnight",
        text: "The front desk closes at 11:00 pm. Talk to a person about your options.",
        source: `Source: ${h.late.source}`,
        pill: { type: "danger", label: "Does not match" },
        person: true,
      },
    };
    items.push(byStatus[h.late.status]);
  }

  if (b.arrival) {
    items.push({
      key: "arrival",
      title: "Your arrival time was sent",
      text: `The hotel received “${b.arrival}” with your reservation.`,
      source: "Source: your reservation",
      pill: { type: "confirmed", label: "Done" },
    });
  }

  if (b.cancelledOn) {
    items.push({
      key: "cancellation",
      title: "This booking is cancelled",
      text: `You cancelled on ${dayLabel(b.cancelledOn)}. ${q.refundable ? `${money2(b.total)} is refunded to the card ending in ${b.last4}.` : ""}`.trim(),
      source: "Source: your reservation",
      pill: { type: "danger", label: "Cancelled" },
    });
  } else if (q.refundable) {
    const until = q.freeUntil ? dayLabel(q.freeUntil) : undefined;
    items.push({
      key: "cancellation",
      title: until ? `Free cancellation until ${until}` : "You can cancel for free",
      text: `You can cancel in Manage booking${until ? ` until ${until}` : ""}.${q.afterDeadline ? ` After that, ${q.afterDeadline}.` : ""}`,
      source: "Source: hotel rate rules",
      pill: { type: "confirmed", label: until ? `Free until ${until.split(", ")[1]}` : "Free cancellation" },
    });
  } else {
    items.push({
      key: "cancellation",
      title: "This booking cannot be cancelled",
      text: "It cannot be cancelled or changed. If something goes wrong, talk to a person.",
      source: "Source: hotel rate rules",
      pill: { type: "danger", label: "Non-refundable" },
      person: true,
    });
  }

  items.push({
    key: "getting-there",
    title: "Getting there",
    text: `About ${h.airportMinutes} minutes by car from Miami International Airport${late ? " late at night" : ""}.`,
    source: "Source: map estimate",
    pill: { type: "copilot", label: "For your trip" },
  });
  return items;
}

/** "Your requirements (arriving after midnight, quiet, up to $300 a night), your question about free cancellation, and this conversation." */
export function keptSummary(b: BookingRecord, hasConversation: boolean) {
  const reqs = requirementsOf(b).filter((r) => r.kind !== "free-cancellation" || !b.askedAboutCancelling);
  const parts: string[] = [];
  if (reqs.length) parts.push(`Your requirements (${reqs.map((r) => r.label.charAt(0).toLowerCase() + r.label.slice(1)).join(", ")})`);
  if (b.askedAboutCancelling) parts.push("your question about free cancellation");
  if (hasConversation) parts.push("this conversation");
  if (!parts.length) return "Nothing. You did not tell Copilot anything for this trip.";
  const list = parts.length === 1 ? parts[0] : `${parts.slice(0, -1).join(", ")}, and ${parts.at(-1)}`;
  return `${list.charAt(0).toUpperCase()}${list.slice(1)}. ${parts.length === 1 && !hasConversation && !reqs.length ? "It is" : "They are"} used only to help with this trip, and you can delete them at any time.`;
}

/* ── Files the traveler can take away ───────────────────────────── */

const icsDate = (iso: string) => iso.replace(/-/g, "");
const esc = (s: string) => s.replace(/[\\,;]/g, (m) => `\\${m}`);

/** An all-day calendar event for the stay. */
export function calendarFile(b: BookingRecord, h: Hotel) {
  const end = new Date(`${b.checkOut}T00:00:00Z`);
  end.setUTCDate(end.getUTCDate() + 1);
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//HelloWorld sample//Travel Copilot//EN",
    "BEGIN:VEVENT",
    `UID:${b.confirmation}@helloworld.example`,
    `DTSTAMP:${new Date()
      .toISOString()
      .replace(/[-:]/g, "")
      .replace(/\.\d+Z$/, "Z")}`,
    `DTSTART;VALUE=DATE:${icsDate(b.checkIn)}`,
    `DTEND;VALUE=DATE:${end.toISOString().slice(0, 10).replace(/-/g, "")}`,
    `SUMMARY:${esc(`Stay at ${h.name}`)}`,
    `LOCATION:${esc(h.address ?? h.neighborhood)}`,
    `DESCRIPTION:${esc(`Confirmation ${b.confirmation}. Check-in ${h.checkInFrom.toLowerCase()}, check-out ${h.checkOutUntil.toLowerCase()}. Hotel phone ${h.phone}. Sample data from a portfolio project.`)}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

export function receiptText(b: BookingRecord, h: Hotel) {
  const q = bookingQuote(b, h);
  return [
    "HelloWorld · Receipt (SAMPLE DATA, nothing was charged)",
    "",
    `Confirmation number: ${b.confirmation}`,
    `Hotel: ${h.name}`,
    `Room: ${q.room}`,
    `Dates: ${dayLabel(b.checkIn)} to ${dayLabel(b.checkOut)}, ${q.nights} ${q.nights === 1 ? "night" : "nights"}`,
    "",
    `${q.nights} nights × ${money2(q.perNight)}: ${money2(q.subtotal)}`,
    `Taxes and fees: ${money2(q.taxes)}`,
    `Paid: ${money2(q.total)} (card ending in ${b.last4})`,
    `Cancellation: ${q.refundable ? `free${q.freeUntil ? ` until ${dayLabel(q.freeUntil)}` : ""}` : "non-refundable"}`,
  ].join("\n");
}

export function download(name: string, type: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
