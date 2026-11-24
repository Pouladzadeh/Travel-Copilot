/**
 * What the model is allowed to know. Built in code from the sample data, so
 * every fact it can state has a source, and the ranking stays deterministic.
 */
import { hotelById, parkingAnswer, type Hotel } from "../hotels";
import summaries from "../reviewSummaries.json";
import { buildResults, check } from "../ranking";
import type { Requirement } from "../requirements";
import type { ReplyContext } from "./types";

const STATUS: Record<ReturnType<typeof check>, string> = {
  pass: "meets it",
  conditional: "meets it only with a condition",
  unconfirmed: "unconfirmed",
  fail: "does not meet it",
};

function hotelFacts(h: Hotel, reqs: Requirement[], full: boolean, v1 = false) {
  const base = {
    id: h.id,
    name: h.name,
    neighborhood: h.neighborhood,
    placement: h.placement,
    rating: v1 ? `${h.rating} from ${h.reviewCount} reviews` : `${h.rating} from ${h.reviewCount} reviews (source: hotel listing)`,
    lowestRate: `$${h.pricePerNight} a night, $${h.total} total for 3 nights with taxes and fees, ${h.freeCancellation ? `free cancellation${h.freeUntil ? ` until ${h.freeUntil}` : ""}` : "non-refundable"} (source: hotel rate rules)`,
    flexibleRate: h.flexibleRate
      ? `$${h.flexibleRate.pricePerNight} a night, $${h.flexibleRate.total} total, free cancellation until ${h.flexibleRate.freeUntil}; after that ${h.flexibleRate.afterDeadline} (source: hotel rate rules)`
      : undefined,
    lateCheckIn: `${h.late.status}: ${h.late.evidence} (source: ${h.late.source})`,
    quiet: `${h.quiet.status}: ${h.quiet.quietMentions} of ${h.reviewCount} reviews mention quiet, ${h.quiet.noiseMentions} mention noise (source: guest reviews)`,
    walkToWater: `${h.waterWalkMinutes} minutes on foot to ${h.waterName} (source: map estimate)`,
    airport: `${h.airportMinutes} minutes by car from Miami International Airport at night (source: map estimate)`,
    requirementChecks: reqs.map((r) => `${r.label}: ${STATUS[check(h, r)]}`),
  };
  if (!full) return base;
  const parking = parkingAnswer(h);
  return {
    ...base,
    room: `${h.room.name}, ${h.room.facts}`,
    checkIn: h.checkInFrom,
    checkOut: h.checkOutUntil,
    phone: h.phone,
    parking: parking ? `${parking.text} (source: ${parking.source ?? "hotel listing"})` : "not checked",
    reviewSummary: (() => {
      const r = (
        summaries as unknown as {
          summaries: Record<
            string,
            { summary: string; liked: { label: string; reviews: number[] }[]; watchFor: { label: string; reviews: number[] }[] }
          >;
        }
      ).summaries[h.id];
      if (!r) return "not summarised";
      const list = (xs: { label: string; reviews: number[] }[]) => xs.map((x) => `${x.label} (${x.reviews.length} of 8)`).join(", ");
      return `${r.summary} Guests liked: ${list(r.liked)}. Watch for: ${list(r.watchFor) || "nothing raised"}. (source: guest reviews, 8 sample reviews)`;
    })(),
    area: h.area
      ? {
          gettingThere: `${h.area.gettingThere} (source: map estimate)`,
          around: h.area.around,
          nightWalk: `${h.area.nightWalk.comfortable} reviews mention feeling comfortable walking back at night, ${h.area.nightWalk.poorlyLit} mention poorly lit side streets (source: guest reviews)`,
        }
      : "not checked",
  };
}

/**
 * promptVersion lets the evals rebuild exactly what an older prompt version saw
 * (v1 had no source on ratings). The app always uses the current version.
 */
export function grounding(ctx: ReplyContext, promptVersion?: string) {
  const v1 = promptVersion === "v1";
  const reqs = ctx.requirements;
  const m = buildResults(reqs);
  const focus = (ctx.hotelIds ?? (ctx.hotelId ? [ctx.hotelId] : [])).map((id) => hotelById(id)).filter((h): h is Hotel => !!h);
  return {
    trip: { destination: "Miami", checkIn: ctx.checkIn ?? "2027-03-20", nights: 3, guests: 2 },
    screen: ctx.screen,
    requirements: reqs.map((r) => r.label),
    results: {
      fittingInOrder: m.fitting.map((h) => hotelFacts(h, reqs, false, v1)),
      hiddenCount: m.hidden.length,
      hiddenBecause: m.hiddenReasons.map((r) => `${r.count} fail "${r.requirement.label}"`),
      outsideRequest: m.outside.map((h) => ({ id: h.id, name: h.name, placement: h.placement })),
    },
    onScreen: focus.map((h) => hotelFacts(h, reqs, true, v1)),
  };
}
