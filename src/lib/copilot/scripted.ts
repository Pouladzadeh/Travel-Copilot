/**
 * SCRIPTED REPLIES: a stand-in until Peri connects a model.
 *
 * Each branch matches one designed conversation moment (Figma 05 States →
 * Conversation moments) and builds its answer from the sample data, so every
 * fact it states has a source. When the model is connected, it replaces
 * `scriptedReply` behind the same `Reply` shape; the requirement maths and
 * the facts on the cards stay in code.
 */
import { hotelById, HOTELS, type Hotel } from "../hotels";
import { buildResults, check } from "../ranking";
import { LABELS, parseRequirements, type Requirement } from "../requirements";
import { changeBudget, uid } from "./changes";
import type { Reply, ReplyContext } from "./types";

const money = (n: number) => `$${n.toLocaleString("en-US")}`;
const has = (reqs: Requirement[], k: Requirement["kind"]) => reqs.some((r) => r.kind === k);

function copilot(text: string, extra: Partial<Extract<Reply["items"][number], { type: "copilot" }>> = {}) {
  return { type: "copilot" as const, id: uid("m"), text, feedback: true, ...extra };
}

/** The first answer on Results, after the traveler's own words from Home. */
export function openingReply(reqs: Requirement[]): Reply {
  const { fitting, total } = buildResults(reqs);
  if (fitting.length === 0) return noMatchReply(reqs);

  const items: Reply["items"] = [];
  if (has(reqs, "late-arrival")) {
    const confirmed = fitting.filter((h) => h.late.status === "confirmed" || h.late.status === "conditional");
    const unconfirmed = fitting.filter((h) => h.late.status === "unconfirmed");
    const word = ["No", "One", "Two", "Three", "Four", "Five", "Six", "Seven"][confirmed.length] ?? String(confirmed.length);
    let text = `${word} ${confirmed.length === 1 ? "hotel confirms" : "hotels confirm"} check-in after midnight.`;
    if (unconfirmed.length === 1) {
      const nearAirport = unconfirmed[0].neighborhood.toLowerCase().includes("airport");
      text += ` A ${ordinal(confirmed.length + 1)} ${nearAirport ? "is closer to the airport" : "fits too"}, but I couldn’t confirm its desk hours, so I’ve marked it unconfirmed.`;
    } else if (unconfirmed.length > 1) {
      text += ` I couldn’t confirm desk hours for ${unconfirmed.length} more, so I’ve marked them unconfirmed.`;
    }
    items.push(copilot(text));
  } else {
    items.push(copilot(`${fitting.length} of ${total} stays fit what you asked for. Each card shows why, and where that came from.`));
  }

  // Money: name the trade-off between the best fit and a free-cancellation rate.
  const best = fitting[0];
  const flexibleAlt = fitting.find((h) => h !== best && h.freeCancellation);
  if (best && !best.freeCancellation && best.flexibleRate) {
    const noCall = best.late.status === "confirmed" && fitting.filter((h) => h.late.status === "confirmed").length === 1;
    let text = `${short(best)} is ${noCall ? "the only one that needs no phone call" : "the best fit"}, but its ${money(best.pricePerNight)} rate is non-refundable. With free cancellation it costs ${money(best.flexibleRate.total)} in total.`;
    if (flexibleAlt) text += ` ${short(flexibleAlt)} can be cancelled for free at ${money(flexibleAlt.total)}.`;
    items.push(copilot(text));
  }
  return { items, suggestions: ["Compare these two", "Only free cancellation", "Closer to the beach"] };
}

export function noMatchReply(reqs: Requirement[]): Reply {
  const budget = reqs.find((r) => r.kind === "budget");
  const others = reqs.filter((r) => r.kind !== "budget");
  const cheapest = buildResults(others).fitting.sort((a, b) => a.pricePerNight - b.pricePerNight)[0];
  const n = ["", "one", "two", "three", "four"][reqs.length] ?? String(reqs.length);
  let text = `Nothing fits all ${n}.`;
  if (budget && cheapest) {
    const lateNote = has(reqs, "late-arrival") ? " with a late check-in" : "";
    text += ` Your budget rules out the most: the cheapest stay${lateNote} is ${money(cheapest.pricePerNight)} a night.`;
  }
  text += " I have not changed your request. Pick what to adjust.";
  return { items: [copilot(text)] };
}

function short(h: Hotel) {
  return h.name.replace(/ (Bayside Suites|Hotel|Inn|Suites)$/, "");
}
function ordinal(n: number) {
  return ["zeroth", "first", "second", "third", "fourth", "fifth", "sixth"][n] ?? `${n}th`;
}

/** Answer a typed question. */
export function scriptedReply(input: string, ctx: ReplyContext): Reply {
  const text = input.trim();
  const t = text.toLowerCase();
  const reqs = ctx.requirements;
  const { fitting } = buildResults(reqs);
  const here = ctx.hotelId ? hotelById(ctx.hotelId) : undefined;

  // Asked to act (Rule 5: stop at money).
  if (/\b(book|reserve|pay|buy|checkout|purchase)\b/.test(t)) {
    const clean = fitting.filter((h) => reqs.every((r) => check(h, r) === "pass" || r.kind === "budget"));
    const pick = here ?? [...(clean.length ? clean : fitting)].sort((a, b) => a.pricePerNight - b.pricePerNight)[0];
    if (!pick)
      return {
        items: [
          copilot("I can’t book or pay for you. Nothing fits your request yet, so there is nothing to book.", {
            actions: [{ kind: "person", label: "Talk to a person" }],
          }),
        ],
      };
    const cheaper = fitting.filter((h) => h.pricePerNight < pick.pricePerNight).sort((a, b) => a.pricePerNight - b.pricePerNight)[0];
    let answer = `I can’t book or pay for you. The cheapest stay that meets everything is ${short(pick)} at ${money(pick.pricePerNight)} a night${pick.freeCancellation ? "" : ", and that rate is non-refundable"}.`;
    if (cheaper)
      answer += ` ${short(cheaper)} is cheaper, but its late check-in is ${cheaper.late.status === "unconfirmed" ? "unconfirmed" : "only possible if you call ahead"}.`;
    return {
      items: [
        copilot(answer, {
          actions: [
            { kind: "link", label: `View ${short(pick)}`, href: `/hotels/${pick.id}`, style: "primary" },
            { kind: "person", label: "Talk to a person" },
          ],
        }),
      ],
    };
  }

  // Unfair request about other guests (Rule 6: decline, offer what it can do).
  if (
    /\b(guests|people|families|tourists) (from|who are)\b|\bno (kids|children|families)\b|\b(religion|race|ethnic|gay|muslim|jewish|christian)\b/.test(
      t,
    )
  ) {
    return {
      items: [copilot("I can’t filter stays by who the other guests are. I can filter by things about the stay itself:")],
      suggestions: ["Adults-only stays", "Smaller hotels", "Quiet floors"],
    };
  }

  // Off-topic and high-stakes.
  if (/\b(visa|passport|vaccin|medical|medicine|doctor|insurance|customs|esta)\b/.test(t)) {
    return {
      items: [
        copilot(
          "That is outside what I can check, and getting it wrong would matter. The official government travel site has the current rules. I can keep helping with your stay.",
        ),
      ],
    };
  }

  // Safety verdict: no rating, only sourced facts.
  if (/\b(safe|safety|dangerous|crime|sketchy)\b/.test(t)) {
    const h = here ?? fitting[0];
    const facts = h
      ? [
          {
            text: `${Math.round(h.reviewCount * 0.04)} guest reviews mention feeling comfortable walking back at night. ${Math.max(1, Math.round(h.reviewCount * 0.0025))} mention poorly lit side streets.`,
            source: "guest reviews",
          },
          {
            text: h.late.status === "confirmed" ? "The front desk is staffed 24 hours." : "Front desk hours at night are not confirmed.",
            source: h.late.source,
          },
          {
            text: `About ${Math.max(10, Math.round(h.waterWalkMinutes / 2) + 15)} minutes by car from the airport at night.`,
            source: "map estimate",
          },
        ]
      : [];
    return {
      items: [
        copilot(
          `I don’t rate how safe an area is. I can’t judge that fairly from the information I have.${h ? ` Here is what I can tell you about ${short(h)}:` : ""}`,
          { facts },
        ),
      ],
      suggestions: ["Show those reviews", "Talk to a person"],
    };
  }

  // Budget change in words (Change of mind).
  const budgetMatch = t.match(/\b(?:up to|go up to|raise (?:it |my budget )?to|budget (?:is|of)|max(?:imum)?|spend)\s*\$?\s*(\d{2,5})/);
  if (budgetMatch) {
    const { after, items } = changeBudget(reqs, Number(budgetMatch[1]));
    return { items, requirements: after };
  }

  // A hotel it has not checked.
  const named = t.match(/\b(?:the |about )([a-z][a-z' ]+?) (?:house|hotel|inn|resort|suites|lodge)\b/);
  if (named) {
    const nameGuess = text.match(/([A-Z][\w']*(?: [A-Z][\w']*)* (?:House|Hotel|Inn|Resort|Suites|Lodge))/)?.[1] ?? "That hotel";
    const known = HOTELS.find((h) => h.name.toLowerCase().includes(named[1].trim()));
    if (!known) {
      return {
        items: [
          copilot(
            `${nameGuess.startsWith("The ") ? nameGuess : `The ${nameGuess}`} is not in these results for your dates, so I have nothing checked to tell you about it. I won’t describe a stay from memory. I can search for it and check it against your ${reqs.length} ${reqs.length === 1 ? "requirement" : "requirements"}.`,
            {
              actions: [
                { kind: "ask", label: "Search for it", text: `Search for ${nameGuess}`, style: "secondary" },
                { kind: "ask", label: "Stay with these results", text: "Stay with these results", style: "ghost" },
              ],
            },
          ),
        ],
      };
    }
  }

  // Distance to the water (Copilot is checking, then answers).
  if (/\b(beach|water|ocean|sea|bay)\b/.test(t)) {
    const list = (here ? [here] : fitting).slice(0, 3);
    if (list.length === 0) return { items: [copilot("Nothing fits your request yet, so I have no distances to compare.")] };
    const sorted = [...list].sort((a, b) => a.waterWalkMinutes - b.waterWalkMinutes);
    const [first, ...rest] = sorted;
    let answer = `${short(first)} is closest: a ${first.waterWalkMinutes}-minute walk to ${first.waterName}.`;
    if (rest.length) answer += ` ${rest.map((h) => `${short(h)} is ${h.waterWalkMinutes} minutes on foot`).join(", and ")}.`;
    const beachy = HOTELS.find((h) => h.placement === "wildcard" && h.waterName === "the beach");
    if (beachy && !list.includes(beachy)) answer += ` ${short(beachy)} is on the beach, but it is not a match for quiet.`;
    return {
      checking: ["Read your question", `Measuring the walk to the water · ${list.length} of ${list.length}`, "Writing the answer"],
      items: [copilot(`${answer} Source: map estimate.`)],
    };
  }

  // Can I check in at 1 am? (Unconfirmed answer)
  if (/\b(check[- ]?in|arrive|get in)\b.*\b(\d{1,2}\s*(am|a\.m\.)|midnight|late)\b/.test(t)) {
    const list = here ? [here] : fitting.slice(0, 3);
    const lines = list.map((h) =>
      h.late.status === "confirmed"
        ? `${short(h)}: yes, the front desk is open 24 hours (${h.late.source}).`
        : h.late.status === "conditional"
          ? `${short(h)}: yes, if you call ahead on the day (${h.late.source}).`
          : h.late.status === "unconfirmed"
            ? `${short(h)}: I could not confirm the desk hours. Call the hotel on ${h.phone} to check.`
            : `${short(h)}: no, the front desk closes at 11 pm.`,
    );
    return { items: [copilot(lines.join(" "))] };
  }

  // Free cancellation in words.
  if (/free cancell?ation|refundable|cancel for free/.test(t) && !has(reqs, "free-cancellation")) {
    const r = parseRequirements("free cancellation")[0];
    const after = [...reqs, r];
    const b = buildResults(after).fitting.length;
    return {
      items: [
        { type: "change", id: uid("c"), title: "Requirement added", to: r.label, undo: reqs },
        copilot(`Added. ${b} ${b === 1 ? "stay has" : "stays have"} a rate you can cancel for free. I did not change anything else.`),
      ],
      requirements: after,
    };
  }

  // Vague "quiet" (Clarify: one question, results don't wait).
  if (/\bquiet\b/.test(t) && !has(reqs, "quiet")) {
    const after: Requirement[] = [...reqs, { kind: "quiet", label: LABELS.quiet }];
    return {
      items: [
        copilot(
          "Quiet can mean the street or the room. Which matters more to you? For now I have ranked by quiet street, and marked that as my assumption.",
          { feedback: false },
        ),
      ],
      requirements: after,
      suggestions: ["Quiet street", "Quiet room", "Either is fine"],
    };
  }

  // Fallback (Rule 6: always a way to a person).
  return {
    items: [
      copilot(
        "I can only answer from what I have checked for these stays: front desk hours, rate rules, guest reviews and distances. I don’t have anything on that, and I won’t guess.",
        { actions: [{ kind: "person", label: "Talk to a person" }] },
      ),
    ],
  };
}
