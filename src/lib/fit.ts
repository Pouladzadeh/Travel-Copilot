/**
 * "How this fits your trip" on Hotel detail (Figma 14:311): one row per
 * requirement, each with an answer, its source and a status pill. Built from
 * the hotel data only.
 */
import type { PillType } from "@/components/StatusPill";
import { dayLabel } from "./dates";
import type { Hotel } from "./hotels";
import type { Requirement } from "./requirements";

export type FitRow = { label: string; answer: string; source: string; pill: { type: PillType; label: string } };

const money = (n: number) => `$${n.toLocaleString("en-US")}`;

/** Quiet but with a real share of noise complaints reads as "Mostly quiet". */
export function quietLevel(h: Hotel): "quiet" | "mostly" | "unconfirmed" | "no" {
  if (h.quiet.status === "no") return "no";
  if (h.quiet.status === "unconfirmed") return "unconfirmed";
  return h.quiet.noiseMentions / Math.max(1, h.quiet.quietMentions) >= 0.1 ? "mostly" : "quiet";
}

export function fitRows(h: Hotel, reqs: Requirement[], nights: number | null): FitRow[] {
  if (reqs.length === 0) return [];
  // Cancellation terms always show before booking (Figma 14:346), asked for or not.
  const withCancellation: Requirement[] = reqs.some((r) => r.kind === "free-cancellation")
    ? reqs
    : [...reqs, { kind: "free-cancellation", label: "Free cancellation" }];
  return withCancellation.map((r): FitRow => {
    switch (r.kind) {
      case "late-arrival":
        return {
          label: r.label,
          answer: {
            confirmed: "The front desk is open 24 hours, so you can check in whenever you arrive.",
            conditional: "The night porter lets you in after midnight if you call ahead on the day you arrive.",
            unconfirmed: "I could not confirm front desk hours after 11 pm. Check with the hotel before you book.",
            no: "The front desk closes at 11:00 pm, so arriving after midnight does not work here.",
          }[h.late.status],
          source: `Source: ${h.late.source}`,
          pill: {
            confirmed: { type: "confirmed" as const, label: "Confirmed" },
            conditional: { type: "conditional" as const, label: "If you call ahead" },
            unconfirmed: { type: "unconfirmed" as const, label: "Unconfirmed" },
            no: { type: "danger" as const, label: "Does not meet" },
          }[h.late.status],
        };
      case "quiet": {
        const level = quietLevel(h);
        const reviews = h.reviewCount.toLocaleString("en-US");
        const faces = h.room.faces === "the bay" ? " Bay-facing rooms are described as the quietest." : "";
        return {
          label: r.label,
          answer:
            level === "no"
              ? `${h.quiet.noiseMentions} of ${reviews} reviews mention noise. Not a match for quiet.`
              : level === "unconfirmed"
                ? `${h.quiet.quietMentions} reviews mention quiet and ${h.quiet.noiseMentions} mention noise. No clear pattern, so I could not confirm it.`
                : level === "mostly"
                  ? `${h.quiet.quietMentions} of ${reviews} reviews mention “quiet”. ${h.quiet.noiseMentions} mention street noise on weekend nights.${faces}`
                  : `${h.quiet.quietMentions} of ${reviews} reviews mention “quiet”. ${h.quiet.noiseMentions} mention noise.`,
          source: "Source: guest reviews",
          pill:
            level === "no"
              ? { type: "danger", label: "Does not meet" }
              : level === "unconfirmed"
                ? { type: "unconfirmed", label: "Unconfirmed" }
                : level === "mostly"
                  ? { type: "partial", label: "Mostly quiet" }
                  : { type: "confirmed", label: "Confirmed" },
        };
      }
      case "budget": {
        const within = h.pricePerNight <= r.maxPerNight;
        const total =
          nights === null
            ? ""
            : ` ${money(nights === 3 ? h.total : Math.round(h.pricePerNight * nights * 1.128))} total for ${nights} ${nights === 1 ? "night" : "nights"}, including taxes and fees.`;
        return {
          label: r.label,
          answer: `${money(h.pricePerNight)} a night.${total}`,
          source: "Source: hotel rate",
          pill: within ? { type: "confirmed", label: "Within budget" } : { type: "danger", label: "Over budget" },
        };
      }
      case "free-cancellation":
        return {
          label: r.label,
          answer: h.freeCancellation
            ? `The ${money(h.pricePerNight)} rate can be cancelled for free.`
            : h.flexibleRate
              ? `The ${money(h.pricePerNight)} rate is non-refundable. A flexible rate is available at ${money(h.flexibleRate.pricePerNight)} a night.`
              : `The ${money(h.pricePerNight)} rate is non-refundable.`,
          source: "Source: hotel rate rules",
          pill: h.freeCancellation ? { type: "confirmed", label: "Confirmed" } : { type: "danger", label: "Not on this rate" },
        };
    }
  });
}

export type RoomOffer = {
  key: "flexible" | "lowest";
  name: string;
  facts: string;
  pricePerNight: number;
  total: number;
  freeCancellation: boolean;
  freeUntil?: string;
};

export function roomOffers(h: Hotel): RoomOffer[] {
  const lowest: RoomOffer = {
    key: "lowest",
    name: `${h.room.name}${h.flexibleRate ? " · lowest price" : ""}`,
    facts: h.room.facts,
    pricePerNight: h.pricePerNight,
    total: h.total,
    freeCancellation: h.freeCancellation,
  };
  if (!h.flexibleRate) return [lowest];
  return [
    {
      key: "flexible",
      name: `${h.room.name} · flexible rate`,
      facts: h.room.facts,
      pricePerNight: h.flexibleRate.pricePerNight,
      total: h.flexibleRate.total,
      freeCancellation: true,
      freeUntil: h.flexibleRate.freeUntil,
    },
    lowest,
  ];
}

/** "Free cancellation until Mar 18" */
export function freeUntilLabel(iso: string) {
  return `Free cancellation until ${dayLabel(iso).split(", ")[1]}`;
}
