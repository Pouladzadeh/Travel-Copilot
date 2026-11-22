/**
 * Checking and ranking stays against the traveler's requirements.
 *
 * This is plain code on purpose: every claim on a card comes from the data
 * here, never from the model. A requirement Copilot cannot verify is marked
 * "unconfirmed" and the stay stays in the list (Rule 4).
 */

import type { HotelCardFact } from "@/components/HotelCard";
import { HOTELS, type Hotel } from "./hotels";
import type { Requirement } from "./requirements";

export type Check = "pass" | "conditional" | "unconfirmed" | "fail";

export function check(h: Hotel, r: Requirement): Check {
  switch (r.kind) {
    case "late-arrival":
      return { confirmed: "pass", conditional: "conditional", unconfirmed: "unconfirmed", no: "fail" }[h.late.status] as Check;
    case "quiet":
      return { confirmed: "pass", unconfirmed: "unconfirmed", no: "fail" }[h.quiet.status] as Check;
    case "budget":
      return h.pricePerNight <= r.maxPerNight ? "pass" : "fail";
    case "free-cancellation":
      return h.freeCancellation ? "pass" : h.flexibleRate ? "conditional" : "fail";
  }
}

const SCORE: Record<Check, number> = { pass: 0, conditional: 1, unconfirmed: 2, fail: 99 };

export function fits(h: Hotel, reqs: Requirement[]) {
  return reqs.every((r) => check(h, r) !== "fail");
}

/** Best fit: fewest doubts first, then price. */
export function rank(hotels: Hotel[], reqs: Requirement[]) {
  const score = (h: Hotel) => reqs.reduce((s, r) => s + SCORE[check(h, r)], 0);
  return [...hotels].sort((a, b) => score(a) - score(b) || a.pricePerNight - b.pricePerNight);
}

export const RANKED_POOL = HOTELS.filter((h) => h.placement === "ranked");
export const OUTSIDE = HOTELS.filter((h) => h.placement !== "ranked");

export type ResultsModel = {
  fitting: Hotel[];
  hidden: Hotel[];
  outside: Hotel[];
  total: number;
  /** Why stays are hidden, one line per requirement that rules some out. */
  hiddenReasons: { requirement: Requirement; count: number }[];
};

export function buildResults(reqs: Requirement[]): ResultsModel {
  const fitting = rank(
    RANKED_POOL.filter((h) => fits(h, reqs)),
    reqs,
  );
  const hidden = RANKED_POOL.filter((h) => !fits(h, reqs));
  // Attribute each hidden stay to the first requirement it fails, in chip order.
  const counts = new Map<string, { requirement: Requirement; count: number }>();
  for (const h of hidden) {
    const r = reqs.find((q) => check(h, q) === "fail");
    if (!r) continue;
    const entry = counts.get(r.kind) ?? { requirement: r, count: 0 };
    entry.count += 1;
    counts.set(r.kind, entry);
  }
  const hiddenReasons = reqs.flatMap((r) => (counts.has(r.kind) ? [counts.get(r.kind)!] : []));
  return { fitting, hidden, outside: OUTSIDE, total: RANKED_POOL.length, hiddenReasons };
}

const FAIL_PHRASE: Record<Requirement["kind"], (r: Requirement, n: number) => string> = {
  "late-arrival": (_, n) => `${n === 1 ? "doesn’t" : "don’t"} allow check-in after midnight`,
  quiet: (_, n) => `${n === 1 ? "isn’t" : "aren’t"} described as quiet`,
  budget: (r, n) => `${n === 1 ? "is" : "are"} over $${(r as Extract<Requirement, { kind: "budget" }>).maxPerNight} a night`,
  "free-cancellation": (_, n) => `${n === 1 ? "has" : "have"} no free-cancellation rate`,
};

/**
 * "12 stays are hidden because they don’t allow check-in after midnight."
 * Figma's copy names one reason; with this data several requirements rule
 * stays out, so the sentence lists each one with its count.
 */
export function hiddenNotice(m: ResultsModel): string {
  const n = m.hidden.length;
  const parts = m.hiddenReasons.map(({ requirement, count }) => ({ requirement, count }));
  if (parts.length === 1) {
    return `${n} ${n === 1 ? "stay is" : "stays are"} hidden because ${n === 1 ? "it" : "they"} ${FAIL_PHRASE[parts[0].requirement.kind](parts[0].requirement, n)}.`;
  }
  const list = parts.map((p) => `${p.count} ${FAIL_PHRASE[p.requirement.kind](p.requirement, p.count)}`);
  const joined = list.length > 1 ? `${list.slice(0, -1).join(", ")} and ${list[list.length - 1]}` : list[0];
  return `${n} stays are hidden: ${joined}.`;
}

// ── Card content ─────────────────────────────────────────────────────

const has = (reqs: Requirement[], kind: Requirement["kind"]) => reqs.some((r) => r.kind === kind);

export function pillsFor(h: Hotel, reqs: Requirement[]): HotelCardFact[] {
  const out: HotelCardFact[] = [];
  if (has(reqs, "late-arrival")) {
    out.push(
      {
        confirmed: { type: "confirmed", label: "Late check-in confirmed" },
        conditional: { type: "conditional", label: "Late check-in if you call ahead" },
        unconfirmed: { type: "unconfirmed", label: "Late check-in unconfirmed" },
        no: { type: "danger", label: "Does not meet: late check-in" },
      }[h.late.status] as HotelCardFact,
    );
  }
  if (has(reqs, "quiet") && h.quiet.status !== "confirmed") {
    out.push(
      h.quiet.status === "no" ? { type: "danger", label: "Does not meet: quiet" } : { type: "unconfirmed", label: "Quiet unconfirmed" },
    );
  }
  const budget = reqs.find((r) => r.kind === "budget");
  if (budget && check(h, budget) === "fail") out.push({ type: "danger", label: `Over $${budget.maxPerNight} a night` });
  if (out.length < 2 || has(reqs, "free-cancellation")) {
    out.push(h.freeCancellation ? { type: "confirmed", label: "Free cancellation" } : { type: "danger", label: "Non-refundable" });
  }
  return out;
}

/** True when the requirements are the designed default, so Figma copy applies. */
function isDesignedRequest(reqs: Requirement[]) {
  const kinds = reqs
    .map((r) => r.kind)
    .sort()
    .join(",");
  return kinds === "budget,late-arrival,quiet";
}

export function reasonFor(h: Hotel, reqs: Requirement[]): { label: string; reason: string; sources: string } {
  const label =
    h.placement === "wildcard" ? "Why it is here" : h.placement === "sponsored" ? "How it matches your request" : "Why this fits";
  if (h.designed && (isDesignedRequest(reqs) || h.placement !== "ranked")) {
    return { label, reason: h.designed.reason, sources: h.designed.sources };
  }
  const bits: string[] = [];
  const sources: string[] = [];
  if (has(reqs, "late-arrival")) {
    bits.push(
      {
        confirmed: "Front desk is open 24 hours, so arriving after midnight works.",
        conditional: "Arriving after midnight works if you call ahead on the day.",
        unconfirmed: "I could not confirm front desk hours after 11 pm, so check with the hotel before booking.",
        no: "The front desk closes at 11 pm, so arriving after midnight does not work.",
      }[h.late.status],
    );
    sources.push(h.late.source);
  }
  if (has(reqs, "quiet")) {
    bits.push(
      {
        confirmed: "Guests often describe it as quiet.",
        unconfirmed: "Reviews are split on noise, so I could not confirm it is quiet.",
        no: "Not a match for quiet: many reviews mention noise.",
      }[h.quiet.status],
    );
    sources.push(
      h.quiet.status === "no"
        ? `${h.quiet.noiseMentions} of ${h.reviewCount.toLocaleString("en-US")} reviews mention “noise”`
        : `${h.quiet.quietMentions} of ${h.reviewCount.toLocaleString("en-US")} reviews mention “quiet”`,
    );
  }
  if (has(reqs, "free-cancellation")) {
    bits.push(h.freeCancellation ? "This rate can be cancelled for free." : "The cheapest rate is non-refundable.");
    sources.push("rate rules");
  }
  if (bits.length === 0) {
    bits.push(`${h.rating.toFixed(1)} from ${h.reviewCount.toLocaleString("en-US")} reviews.`);
    sources.push("guest reviews");
  }
  return { label, reason: bits.join(" "), sources: `Sources: ${[...new Set(sources)].join(" · ")}` };
}

// ── No match ─────────────────────────────────────────────────────────

export type Relaxation = { label: string; detail: string; count: number; apply: Requirement[] };

/** "Change one thing to see stays" (Figma state Results · no match). */
export function relaxations(reqs: Requirement[]): Relaxation[] {
  const out: Relaxation[] = [];
  const budget = reqs.find((r) => r.kind === "budget");
  if (budget) {
    const others = reqs.filter((r) => r.kind !== "budget");
    const candidates = rank(
      RANKED_POOL.filter((h) => fits(h, others)),
      others,
    ).sort((a, b) => a.pricePerNight - b.pricePerNight);
    const steps = [...new Set(candidates.map((h) => Math.ceil(h.pricePerNight / 5) * 5))].filter((p) => p > budget.maxPerNight);
    for (const step of [steps[0], steps[2] ?? steps[steps.length - 1]].filter((s, i, a) => s && a.indexOf(s) === i)) {
      const next = reqs.map((r) => (r.kind === "budget" ? { ...r, maxPerNight: step, label: `Up to $${step} a night` } : r));
      const fitting = candidates.filter((h) => h.pricePerNight <= step);
      const cheapest = fitting[0];
      const detail =
        fitting.length === 1
          ? `1 stay fits: ${cheapest.name} at $${cheapest.pricePerNight}.${cheapest.late.status === "unconfirmed" ? " Late check-in is unconfirmed." : ""}`
          : `${fitting.length} stays fit, from $${cheapest.pricePerNight} a night.`;
      out.push({ label: `Raise your budget to $${step} a night`, detail, count: fitting.length, apply: next });
    }
  }
  // Arrival time is a fact about the trip, not a preference, so it is never offered.
  for (const r of reqs.filter((q) => q.kind !== "budget" && q.kind !== "late-arrival")) {
    const next = reqs.filter((q) => q !== r);
    const count = RANKED_POOL.filter((h) => fits(h, next)).length;
    out.push({
      label: `Search without “${r.label.toLowerCase()}”`,
      detail:
        count === 0
          ? `No extra stays. ${budget ? "Budget is what rules them out." : ""}`.trim()
          : `${count} ${count === 1 ? "stay fits" : "stays fit"}.`,
      count,
      apply: next,
    });
  }
  return out;
}
