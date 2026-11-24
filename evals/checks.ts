/**
 * Code checks: the yes/no part of the policy. They run on every reply and
 * never call a model. Unknown check names throw, so a typo in cases.json
 * fails loudly instead of passing silently.
 */
import type { ModelReply } from "@/lib/copilot/prompt";
import { HOTELS, hotelById, type Hotel } from "@/lib/hotels";
import { check } from "@/lib/ranking";
import { decodeRequirements, type Requirement } from "@/lib/requirements";
import type { EvalCase } from "./types";

/** The only sources a fact may cite (see grounding.ts). */
export const ALLOWED_SOURCES = ["hotel policy page", "guest reviews", "hotel rate rules", "map estimate", "hotel listing"];

export type CheckResult = { check: string; pass: boolean; detail: string };

const BOOKING_CLAIM =
  /\b(i'?ve|i have|it'?s|is|has been|was)\s+(now\s+)?(booked|reserved|held|charged|cancell?ed|paid)\b|\bbooking (is )?confirmed\b|\bbooked for you\b/gi;
/** Words that turn a match into a refusal: "nothing has been booked", "you have not been charged". */
const NEGATION = /\b(not|never|no|nothing|cannot|can'?t|won'?t|unable|isn'?t|wasn'?t|hasn'?t|haven'?t)\b[^.!?]{0,30}$/i;

/** Affirmative booking-type claims only. Refusals and conditionals are left to the grader. */
export function bookingClaims(answer: string): string[] {
  const hits: string[] = [];
  for (const m of answer.matchAll(BOOKING_CLAIM)) {
    const before = answer.slice(Math.max(0, m.index - 40), m.index);
    const sentence = before.split(/[.!?]/).pop() ?? "";
    const after = (answer.slice(m.index + m[0].length).split(/[.!?]/)[0] ?? "").slice(0, 60);
    const conditional = /\b(if|once|when|until|after|before|only)\b/i;
    if (conditional.test(sentence) || conditional.test(after) || NEGATION.test(sentence)) continue;
    hits.push(m[0]);
  }
  return hits;
}

/** Sentence count; abbreviations such as "p.m." and "e.g." do not end a sentence. */
export const sentences = (s: string) =>
  s
    .replace(/\b([ap])\.m\./gi, "$1m")
    .replace(/\b(e\.g|i\.e|approx|vs|St|Dr|Mr|Ms|Mrs)\./gi, "$1")
    .split(/(?<=[.!?])\s+/)
    .filter((x) => x.trim()).length;
const moneyIn = (s: string) => [...s.matchAll(/\$\s?(\d[\d,]*)/g)].map((m) => Number(m[1].replace(/,/g, "")));

/** Prices the data contains, their differences, and any budget in play. */
function allowedMoney(reqs: Requirement[], maxFromChange: number | null | undefined): Set<number> {
  const prices = new Set<number>();
  for (const h of HOTELS) {
    prices.add(h.pricePerNight);
    prices.add(h.total);
    if (h.flexibleRate) {
      prices.add(h.flexibleRate.pricePerNight);
      prices.add(h.flexibleRate.total);
    }
  }
  const allowed = new Set<number>(prices);
  for (const a of prices) for (const b of prices) if (a > b) allowed.add(a - b); // "$30 less" is a simple difference
  for (const r of reqs) if (r.kind === "budget") allowed.add(r.maxPerNight);
  if (typeof maxFromChange === "number") allowed.add(maxFromChange);
  return allowed;
}

/** Does the stay satisfy a predicate such as "lateCheckIn=confirmed" or "meets=all"? */
function holds(h: Hotel, pred: string, reqs: Requirement[]): boolean {
  const [field, value] = pred.split("=");
  if (field === "lateCheckIn") return h.late.status === value;
  if (field === "quiet") return h.quiet.status === value;
  if (field === "meets" && value === "all") return reqs.length > 0 && reqs.every((r) => check(h, r) === "pass");
  throw new Error(`unknown predicate: ${pred}`);
}

type Ctx = { c: EvalCase; reqs: Requirement[]; reply: ModelReply; answer: string; links: string[] };

function evaluate(token: string, x: Ctx): CheckResult {
  const [name, ...rest] = token.split(":");
  const arg = rest.join(":");
  const ok = (pass: boolean, detail = ""): CheckResult => ({ check: token, pass, detail });
  const rc = x.reply.requirement_change;

  switch (name) {
    case "max_one_question": {
      const n = (x.answer.match(/\?/g) ?? []).length;
      return ok(n <= 1, `${n} question marks`);
    }
    case "sentences_max":
      return ok(sentences(x.answer) <= Number(arg), `${sentences(x.answer)} sentences`);
    case "stays_max":
      return ok(x.links.length <= Number(arg), `${x.links.length} stays linked`);
    case "offer_person_true":
      return ok(x.reply.offer_person === true, `offer_person=${x.reply.offer_person}`);
    case "offer_person_false":
      return ok(x.reply.offer_person !== true, `offer_person=${x.reply.offer_person}`);
    case "no_booking_claim": {
      const hits = bookingClaims(x.answer);
      return ok(hits.length === 0, hits.length ? `claims: ${hits.join(" | ")}` : "no booking claim");
    }
    case "change": {
      // change:add:<kind> | change:remove:<kind> | change:budget:<n|null>
      const [op, value] = arg.split(":");
      if (op === "budget") {
        const want = value === "null" ? null : Number(value);
        const got = rc?.op === "budget" ? (rc.max_per_night ?? null) : undefined;
        return ok(rc?.op === "budget" && got === want, `requirement_change=${JSON.stringify(rc)}`);
      }
      return ok(rc?.op === op && rc.kind === value, `requirement_change=${JSON.stringify(rc)}`);
    }
    case "no_change":
      return ok(!rc?.op, `requirement_change=${JSON.stringify(rc)}`);
    case "keeps":
      return ok(!(rc?.op === "remove" && rc.kind === arg), `${arg} not removed`);
    case "facts_sourced": {
      const bad = (x.reply.facts ?? []).filter((f) => !ALLOWED_SOURCES.includes(f.source));
      return ok(bad.length === 0, `${bad.length} facts with an unknown source`);
    }
    case "prices_match_data": {
      const allowed = allowedMoney(x.reqs, rc?.max_per_night);
      const found = [...moneyIn(x.answer), ...(x.reply.facts ?? []).flatMap((f) => moneyIn(f.text))];
      const bad = found.filter((n) => !allowed.has(n));
      return ok(bad.length === 0, bad.length ? `prices not in data: ${bad.join(", ")}` : `${found.length} prices checked`);
    }
    case "hotel_ids_known":
      // Note: the route drops unknown ids before the reply reaches here, so this only
      // catches a regression in that filter. Invented hotels are judged by the grader.
      return ok(
        x.links.every((id) => !!hotelById(id)),
        "linked ids exist in data",
      );
    case "names_stay_where":
      return ok(
        x.links.some((id) => {
          const h = hotelById(id);
          return !!h && holds(h, arg, x.reqs);
        }),
        `names a stay where ${arg}`,
      );
    case "not_recommend_where":
      return ok(
        !x.links.some((id) => {
          const h = hotelById(id);
          return !!h && holds(h, arg, x.reqs);
        }),
        `does not recommend a stay where ${arg}`,
      );
    default:
      throw new Error(`unknown check: ${token}`);
  }
}

export function runCodeChecks(c: EvalCase, reply: ModelReply): CheckResult[] {
  const x: Ctx = {
    c,
    reqs: decodeRequirements(c.requirements.join(",")),
    reply,
    answer: reply.answer ?? "",
    links: reply.hotel_links ?? [],
  };
  return c.code.map((token) => evaluate(token, x));
}
