/**
 * Booking (Figma 15:327, 104:1648, states 76:143, moment 120:927).
 * The checks, prices and Copilot's answers on this page all come from the
 * hotel data and the traveler's search. Copilot here is read-only: it
 * explains the page and never changes the booking or pays (Rule 5).
 */
import type { PillType } from "@/components/StatusPill";
import { dayLabel } from "./dates";
import type { Hotel } from "./hotels";
import type { Requirement } from "./requirements";

export type Rate = "lowest" | "flexible";

export const money2 = (n: number) => `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export type Quote = {
  rate: Rate;
  room: string;
  perNight: number;
  nights: number;
  subtotal: number;
  taxes: number;
  total: number;
  refundable: boolean;
  freeUntil?: string;
  /** What happens after the free-cancellation deadline. */
  afterDeadline?: string;
};

/** A rate the hotel offers. Totals follow the same taxes-and-fees ratio as the rest of the sample data. */
export function quote(h: Hotel, rate: Rate, nights: number, perNightOverride?: number): Quote {
  const flex = rate === "flexible" && h.flexibleRate ? h.flexibleRate : undefined;
  const perNight = perNightOverride ?? (flex ? flex.pricePerNight : h.pricePerNight);
  const designedTotal = nights === 3 && perNightOverride === undefined ? (flex ? flex.total : h.total) : undefined;
  const total = designedTotal ?? Math.round(perNight * nights * 1.128);
  const subtotal = perNight * nights;
  return {
    rate: flex ? "flexible" : "lowest",
    room: flex ? `${h.room.name} · flexible` : h.room.name,
    perNight,
    nights,
    subtotal,
    taxes: total - subtotal,
    total,
    refundable: flex ? true : h.freeCancellation,
    freeUntil: flex ? flex.freeUntil : h.freeUntil,
    afterDeadline: flex?.afterDeadline,
  };
}

export type Check = {
  key: string;
  label: string;
  answer: string;
  source: string;
  pill: { type: PillType; label: string };
  /** How the summary counts it. */
  verdict: "differs" | "check" | "match";
  action?: "switch-flexible" | "call";
};

export function bookingChecks({
  hotel: h,
  q,
  requirements,
  askedAboutCancelling,
  destination,
  checkIn,
  checkOut,
  flexibleQuote,
}: {
  hotel: Hotel;
  q: Quote;
  /** The flexible rate at today's price, when it differs from the stored one (price changed). */
  flexibleQuote?: Quote;
  requirements: Requirement[];
  askedAboutCancelling: boolean;
  destination: string;
  checkIn: string;
  checkOut: string;
}): Check[] {
  const checks: Check[] = [];
  const flexible = h.flexibleRate && q.rate === "lowest" ? (flexibleQuote ?? quote(h, "flexible", q.nights)) : undefined;

  if (q.refundable) {
    const until = q.freeUntil ? ` until ${dayLabel(q.freeUntil)}` : "";
    checks.push({
      key: "cancellation",
      label: "Cancellation",
      answer: `You can cancel for free${until}.${askedAboutCancelling ? " That matches what you asked about earlier." : ""}`,
      source: "Source: hotel rate rules",
      pill: { type: "confirmed", label: "Matches" },
      verdict: "match",
    });
  } else {
    checks.push({
      key: "cancellation",
      label: "Cancellation",
      answer: [
        "This rate cannot be cancelled or changed.",
        askedAboutCancelling ? "You asked about free cancellation earlier." : "",
        flexible ? `The flexible rate costs ${money(flexible.total - q.total)} more in total.` : "",
      ]
        .filter(Boolean)
        .join(" "),
      source: "Source: hotel rate rules",
      pill: { type: "danger", label: "Non-refundable" },
      verdict: "differs",
      action: flexible ? "switch-flexible" : undefined,
    });
  }

  const late = requirements.some((r) => r.kind === "late-arrival");
  if (late) {
    checks.push({
      key: "hold",
      label: "Late-arrival hold",
      answer:
        "The policy page does not say how long a room is held for late arrivals. Your arrival time is added below so the hotel sees it with the reservation.",
      source: `Source: ${h.late.source}`,
      pill: { type: "unconfirmed", label: "Check with hotel" },
      verdict: "check",
      action: "call",
    });
    const arrive = `You said you arrive after midnight on ${dayLabel(checkIn)}.`;
    const byStatus = {
      confirmed: { text: `${arrive} The front desk is open 24 hours.`, pill: { type: "confirmed", label: "Matches" }, verdict: "match" },
      conditional: {
        text: `${arrive} The night porter lets you in if you call on the day you arrive.`,
        pill: { type: "conditional", label: "If you call ahead" },
        verdict: "check",
      },
      unconfirmed: {
        text: `${arrive} The listing does not publish front desk hours after 11 pm.`,
        pill: { type: "unconfirmed", label: "Unconfirmed" },
        verdict: "check",
      },
      no: { text: `${arrive} The front desk closes at 11:00 pm.`, pill: { type: "danger", label: "Does not match" }, verdict: "differs" },
    } as const;
    const s = byStatus[h.late.status];
    checks.push({
      key: "arrival",
      label: "Arrival time",
      answer: s.text,
      source: `Source: ${h.late.source}`,
      pill: { ...s.pill },
      verdict: s.verdict,
    });
  }

  const sameCity = h.neighborhood.toLowerCase().includes(destination.toLowerCase());
  checks.push({
    key: "destination",
    label: "Destination",
    answer: `You searched for ${destination}. This hotel is in ${h.neighborhood}.`,
    source: "Source: hotel address",
    pill: sameCity ? { type: "confirmed", label: "Matches" } : { type: "unconfirmed", label: "Check" },
    verdict: sameCity ? "match" : "check",
  });
  checks.push({
    key: "dates",
    label: "Dates",
    answer: `${dayLabel(checkIn)} to ${dayLabel(checkOut)}, ${q.nights} ${q.nights === 1 ? "night" : "nights"}, the same dates as your search.`,
    source: "Source: your search",
    pill: { type: "confirmed", label: "Matches" },
    verdict: "match",
  });

  // What needs attention comes first (Figma 104:1648 moves the cancellation row down once it matches).
  const order = { differs: 0, check: 1, match: 2 } as const;
  return checks
    .map((c, i) => ({ c, i }))
    .sort((a, b) => order[a.c.verdict] - order[b.c.verdict] || a.i - b.i)
    .map((x) => x.c);
}

export function checkSummary(checks: Check[]) {
  const n = (v: Check["verdict"]) => checks.filter((c) => c.verdict === v).length;
  return [
    n("differs") && { type: "danger" as const, label: `${n("differs")} differs from your request` },
    n("check") && { type: "unconfirmed" as const, label: `${n("check")} to check with the hotel` },
    n("match") && { type: "confirmed" as const, label: `${n("match")} match` },
  ].filter((x): x is { type: "danger" | "unconfirmed" | "confirmed"; label: string } => !!x);
}

const money = (n: number) => `$${n.toLocaleString("en-US")}`;

/* ── Ask about this booking ─────────────────────────────────────── */

export const BOOKING_SUGGESTIONS = ["What does non-refundable mean here?", "What is the late-arrival hold?", "When is my card charged?"];

export type BookingAnswer = { text: string; source?: string; person?: boolean };

export function bookingReply(text: string, h: Hotel, q: Quote, flexibleQuote?: Quote): BookingAnswer {
  const t = text.toLowerCase();
  const flexible = h.flexibleRate && q.rate === "lowest" ? (flexibleQuote ?? quote(h, "flexible", q.nights)) : undefined;
  const until = (iso?: string) => (iso ? ` until ${dayLabel(iso)}` : "");

  // Rule 5: Copilot never books or pays.
  if (/\b(book|reserve|pay)\b.*\b(for me|it)\b|\bcan you (book|reserve|pay)/.test(t)) {
    return {
      text: `I can’t make or pay for the reservation. When you’re ready, select Reserve on this page. Your card is charged ${money2(q.total)} then.`,
    };
  }
  if (/refund|cancel/.test(t)) {
    if (q.refundable) {
      return {
        text: `On this rate you can cancel for free${until(q.freeUntil)}.${q.afterDeadline ? ` After that, ${q.afterDeadline}.` : ""} You can also change your mind before you select Reserve: nothing is charged until then.`,
        source: "hotel rate rules",
      };
    }
    return {
      text: `If you cancel or don’t arrive, you get nothing back of the ${money2(q.total)}, and the dates and room can’t be changed.${
        flexible
          ? ` The same room on the flexible rate is ${money2(flexible.total)} and can be cancelled for free${until(flexible.freeUntil)}.`
          : ""
      }`,
      source: "hotel rate rules",
    };
  }
  if (/hold|late|arriv|midnight/.test(t)) {
    return {
      text: `Some hotels release a room if the guest has not arrived by a set time. ${h.name}’s policy page does not say how long it holds a room, so I can’t confirm it. Your arrival time is sent with the reservation. To be sure, call the hotel on ${h.phone}.`,
      source: h.late.source,
      person: true,
    };
  }
  if (/charg|when.*pay|card/.test(t)) {
    return {
      text: `Your card is charged ${money2(q.total)}, taxes and fees included, when you select Reserve. Nothing is charged before that.${
        q.refundable && q.freeUntil ? ` If you cancel${until(q.freeUntil)}, it is refunded in full.` : ""
      }`,
      source: "hotel rate rules",
    };
  }
  if (/tax|fee|price|total|cost/.test(t)) {
    return {
      text: `${q.nights} ${q.nights === 1 ? "night" : "nights"} at ${money2(q.perNight)} is ${money2(q.subtotal)}. Taxes and fees add ${money2(q.taxes)}, so the total is ${money2(q.total)}.`,
      source: "hotel rate",
    };
  }
  if (/other (hotel|stay)|cheaper|instead|upgrade|breakfast|extra/.test(t)) {
    return {
      text: "On this page I only answer questions about this booking. To look at other stays, go back to your results. Nothing here is booked until you select Reserve.",
    };
  }
  return {
    text: "I can explain anything on this page: the rate, the price, the checks above, or when you’re charged. For anything else, a person can help.",
    person: true,
  };
}

/* ── Form ───────────────────────────────────────────────────────── */

export type GuestForm = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  arrival: string;
  cardName: string;
  cardNumber: string;
  expiry: string;
  cvc: string;
  zip: string;
};

export const FIELD_LABEL: Record<keyof GuestForm, string> = {
  firstName: "First name",
  lastName: "Last name",
  email: "Email",
  phone: "Phone",
  arrival: "Estimated arrival time",
  cardName: "Name on card",
  cardNumber: "Card number",
  expiry: "Expiry",
  cvc: "Security code",
  zip: "Billing ZIP code",
};

/** Field errors, in page order. The summary line uses `short`, the field uses `message`. */
export function validate(f: GuestForm, today = new Date()): { field: keyof GuestForm; short: string; message: string }[] {
  const out: { field: keyof GuestForm; short: string; message: string }[] = [];
  const missing = (field: keyof GuestForm, message: string) => out.push({ field, short: `${FIELD_LABEL[field]} is missing`, message });
  if (!f.firstName.trim()) missing("firstName", "Add your first name as it appears on your ID.");
  if (!f.lastName.trim()) missing("lastName", "Add your last name as it appears on your ID.");
  if (!f.email.trim()) missing("email", "Add an email so we can send your confirmation.");
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(f.email.trim()))
    out.push({ field: "email", short: "Email is incomplete", message: "Enter the full address, like name@example.com." });
  const phoneDigits = f.phone.replace(/\D/g, "");
  if (!phoneDigits) missing("phone", "Add a phone number so the hotel can reach you.");
  else if (phoneDigits.length < 7)
    out.push({ field: "phone", short: "Phone is too short", message: "Check the number, including the area code." });
  if (!f.cardName.trim()) missing("cardName", "Add the name as it appears on the card.");
  const card = f.cardNumber.replace(/\D/g, "");
  if (!card) missing("cardNumber", "Add the card number.");
  else if (card.length < 15)
    out.push({
      field: "cardNumber",
      short: "Card number is too short",
      message: `This card number is too short. Check all ${card.startsWith("3") ? 15 : 16} digits.`,
    });
  const m = f.expiry.match(/^\s*(\d{1,2})\s*\/\s*(\d{2})\s*$/);
  if (!f.expiry.trim()) missing("expiry", "Add the expiry date, MM / YY.");
  else if (!m || +m[1] < 1 || +m[1] > 12)
    out.push({ field: "expiry", short: "Expiry is not a date", message: "Use MM / YY, like 08 / 28." });
  else {
    const end = new Date(2000 + +m[2], +m[1], 1);
    if (end <= today) out.push({ field: "expiry", short: "Card has expired", message: "This card has expired. Use another card." });
  }
  const cvc = f.cvc.replace(/\D/g, "");
  if (!cvc) missing("cvc", "Add the 3 or 4 digits on the card.");
  else if (cvc.length < 3) out.push({ field: "cvc", short: "Security code is too short", message: "Use the 3 or 4 digits on the card." });
  if (!f.zip.trim()) missing("zip", "Add the ZIP or postal code for the card.");
  return out;
}

/** Group card digits in fours as the traveler types. Nothing about the card is stored or sent. */
export const formatCard = (v: string) =>
  v
    .replace(/\D/g, "")
    .slice(0, 19)
    .replace(/(\d{4})(?=\d)/g, "$1 ");

/** Sample-data card that always declines, so the "card declined" state can be shown. */
export const DECLINE_TEST_CARD = "4000000000000002";
