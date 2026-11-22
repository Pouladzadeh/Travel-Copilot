/**
 * Compare (Figma 16:387, 80:1133, 77:162). Every cell, tally, the trade-off
 * line and Copilot's summary are built from the hotel data, so they always
 * agree with Results and Hotel detail.
 */
import type { PillType } from "@/components/StatusPill";
import { dayLabel } from "./dates";
import { quietLevel } from "./fit";
import type { Hotel } from "./hotels";
import type { Requirement } from "./requirements";

const money = (n: number) => `$${n.toLocaleString("en-US")}`;
const count = (n: number) => n.toLocaleString("en-US");

/** "Sunset Harbor", "Palmetto Court", as the designed copy shortens them. */
export const shortName = (h: Hotel) => h.name.replace(/ (Bayside Suites|Hotel|Inn|Suites)$/, "");

export function totalFor(h: Hotel, nights: number) {
  return nights === 3 ? h.total : Math.round(h.pricePerNight * nights * 1.128);
}
function flexTotal(h: Hotel, nights: number) {
  if (!h.flexibleRate) return undefined;
  return nights === 3 ? h.flexibleRate.total : Math.round(h.flexibleRate.pricePerNight * nights * 1.128);
}

export type Tone = "met" | "partly" | "call" | "unconfirmed" | "not";
export type Cell = {
  pill?: { type: PillType; label: string };
  /** For the tally; only requirement rows have one. */
  tone?: Tone;
  text: string;
  source?: string;
  /** Short value for the "differences only" table and for spotting equal rows. */
  short: string;
};
export type CompareRow = { key: string; label: string; section: "requirements" | "other"; cells: Cell[] };

/** Cancellation terms always show before booking, asked for or not (as on Hotel detail). */
export function withCancellation(reqs: Requirement[]): Requirement[] {
  return reqs.some((r) => r.kind === "free-cancellation") ? reqs : [...reqs, { kind: "free-cancellation", label: "Free cancellation" }];
}

export function cellFor(h: Hotel, r: Requirement, nights: number): Cell {
  if (r.kind === "late-arrival") {
    const late: Record<Hotel["late"]["status"], { pill: NonNullable<Cell["pill"]>; tone: Tone; text: string }> = {
      confirmed: { pill: { type: "confirmed", label: "Confirmed" }, tone: "met", text: "Front desk is open 24 hours." },
      conditional: {
        pill: { type: "conditional", label: "If you call ahead" },
        tone: "call",
        text: "The night porter lets guests in after midnight if you call on the day you arrive.",
      },
      unconfirmed: {
        pill: { type: "unconfirmed", label: "Unconfirmed" },
        tone: "unconfirmed",
        text: "The listing does not publish front desk hours after 11 pm.",
      },
      no: { pill: { type: "danger", label: "Does not meet" }, tone: "not", text: "The front desk closes at 11:00 pm." },
    };
    const c = late[h.late.status];
    return { ...c, source: `Source: ${h.late.source}`, short: c.pill.label };
  }
  if (r.kind === "quiet") {
    const level = quietLevel(h);
    const { quietMentions: q, noiseMentions: n } = h.quiet;
    const pct = Math.round((q / h.reviewCount) * 100);
    const lead = `${pct}% of reviews mention “quiet” (${count(q)} of ${count(h.reviewCount)}).`;
    const map = {
      quiet: {
        pill: { type: "confirmed", label: "Quiet" },
        tone: "met",
        text: `${lead} ${n === 0 ? "None mention" : `${n} mention`} night noise.`,
      },
      mostly: {
        pill: { type: "partial", label: "Mostly quiet" },
        tone: "partly",
        text: `${lead} ${n} mention street noise on weekend nights.`,
      },
      unconfirmed: {
        pill: { type: "unconfirmed", label: "Unconfirmed" },
        tone: "unconfirmed",
        text: `${count(q)} reviews mention quiet and ${count(n)} mention noise. No clear pattern.`,
      },
      no: {
        pill: { type: "danger", label: "Not quiet" },
        tone: "not",
        text: `${count(n)} of ${count(h.reviewCount)} reviews mention noise.`,
      },
    } as const;
    const c = map[level];
    return { pill: { ...c.pill }, tone: c.tone, text: c.text, source: "Source: guest reviews", short: c.pill.label };
  }
  if (r.kind === "budget") {
    const within = h.pricePerNight <= r.maxPerNight;
    return {
      pill: within ? { type: "confirmed", label: "Within budget" } : { type: "danger", label: "Over budget" },
      tone: within ? "met" : "not",
      text: `${money(h.pricePerNight)} a night.`,
      source: "Source: hotel rate",
      short: within ? "Within budget" : "Over budget",
    };
  }
  // Free cancellation
  if (h.freeCancellation) {
    const until = h.freeUntil ? `Free until ${dayLabel(h.freeUntil)}. ` : "Free cancellation. ";
    return {
      pill: { type: "confirmed", label: "Free cancellation" },
      tone: "met",
      text: `${until}${money(totalFor(h, nights))} in total.`,
      source: "Source: hotel rate rules",
      short: "Free cancellation",
    };
  }
  return {
    pill: { type: "danger", label: "Non-refundable" },
    tone: "not",
    text: h.flexibleRate
      ? `Not at ${money(h.pricePerNight)}. The flexible rate is ${money(h.flexibleRate.pricePerNight)} a night, ${money(flexTotal(h, nights)!)} in total.`
      : `Not at ${money(h.pricePerNight)}. No flexible rate is offered.`,
    source: "Source: hotel rate rules",
    short: "Non-refundable",
  };
}

export function compareRows(hotels: Hotel[], reqs: Requirement[], nights: number): CompareRow[] {
  const requirementRows: CompareRow[] = withCancellation(reqs).map((r) => ({
    key: r.kind,
    label: r.kind === "free-cancellation" ? "Free cancellation" : r.label,
    section: "requirements",
    cells: hotels.map((h) => cellFor(h, r, nights)),
  }));
  const other: CompareRow[] = [
    {
      key: "lowest-total",
      label: `Lowest total for ${nights} ${nights === 1 ? "night" : "nights"}`,
      section: "other",
      cells: hotels.map((h) => ({
        text: `${money(totalFor(h, nights))} with taxes and fees · ${h.freeCancellation ? "free cancellation" : "non-refundable"}`,
        short: money(totalFor(h, nights)),
      })),
    },
    {
      key: "free-total",
      label: "Total with free cancellation",
      section: "other",
      cells: hotels.map((h) => {
        if (h.freeCancellation) return { text: `${money(totalFor(h, nights))} with taxes and fees`, short: money(totalFor(h, nights)) };
        const f = flexTotal(h, nights);
        return f
          ? { text: `${money(f)} with taxes and fees · flexible rate`, short: money(f) }
          : { text: "Not offered", short: "Not offered" };
      }),
    },
    {
      key: "rating",
      label: "Guest rating",
      section: "other",
      cells: hotels.map((h) => ({
        text: `${h.rating.toFixed(1)} out of 5 · ${count(h.reviewCount)} reviews`,
        source: "Source: guest reviews",
        short: h.rating.toFixed(1),
      })),
    },
    {
      key: "airport",
      label: "From the airport at night",
      section: "other",
      cells: hotels.map((h) => ({
        text: `About ${h.airportMinutes} minutes by car`,
        source: "Source: map estimate",
        short: `${h.airportMinutes} min`,
      })),
    },
  ];
  return [...requirementRows, ...other];
}

/** A row is the same for every stay when the short values match. */
export const isSame = (row: CompareRow) => row.cells.every((c) => c.short === row.cells[0].short);

const TONE_ORDER: Tone[] = ["met", "partly", "call", "unconfirmed", "not"];
const TONE_LABEL: Record<Tone, string> = {
  met: "met",
  partly: "partly",
  call: "needs a call",
  unconfirmed: "unconfirmed",
  not: "not met",
};

/** "2 met · 1 partly · 1 not met" */
export function tally(rows: CompareRow[], index: number) {
  const tones = rows.filter((r) => r.section === "requirements").map((r) => r.cells[index].tone!);
  return {
    total: tones.length,
    text: TONE_ORDER.filter((t) => tones.includes(t))
      .map((t) => `${tones.filter((x) => x === t).length} ${TONE_LABEL[t]}`)
      .join(" · "),
  };
}

/** The first real doubt about a stay, in the words the designed copy uses. */
function weakness(h: Hotel, reqs: Requirement[]): string | undefined {
  for (const r of reqs) {
    if (r.kind === "late-arrival") {
      if (h.late.status === "conditional") return "you have to call ahead on the day you arrive";
      if (h.late.status === "unconfirmed") return "its late check-in is unconfirmed";
      if (h.late.status === "no") return "it does not allow check-in after midnight";
    }
    if (r.kind === "quiet") {
      if (quietLevel(h) === "no") return "reviews do not describe it as quiet";
      if (quietLevel(h) === "unconfirmed") return "I could not confirm it is quiet";
    }
    if (r.kind === "budget" && h.pricePerNight > r.maxPerNight) return "it is over your budget";
  }
  return undefined;
}
const but = (w?: string) => (w ? `, but ${w}` : "");

/** "The trade-off" box. */
export function tradeOff(hotels: Hotel[], reqs: Requirement[], nights: number): string {
  const [a, b, ...rest] = hotels;
  const out: string[] = [];
  const [cheap, dear] = totalFor(a, nights) <= totalFor(b, nights) ? [a, b] : [b, a];
  const diff = totalFor(dear, nights) - totalFor(cheap, nights);
  if (!cheap.freeCancellation && dear.freeCancellation) {
    out.push(`At the lowest price, ${shortName(cheap)} costs ${money(diff)} less, but that rate cannot be cancelled.`);
    const f = flexTotal(cheap, nights);
    if (f !== undefined && f > totalFor(dear, nights)) {
      out.push(`With free cancellation, ${shortName(dear)} is ${money(f - totalFor(dear, nights))} cheaper${but(weakness(dear, reqs))}.`);
    } else if (f !== undefined) {
      out.push(`Even with free cancellation, ${shortName(cheap)} is ${money(totalFor(dear, nights) - f)} cheaper.`);
    } else {
      out.push(`${shortName(dear)} can be cancelled for free${but(weakness(dear, reqs))}.`);
    }
  } else if (diff === 0) {
    out.push(`${shortName(a)} and ${shortName(b)} cost the same, ${money(totalFor(a, nights))} in total.`);
  } else {
    out.push(`${shortName(cheap)} costs ${money(diff)} less in total${but(weakness(cheap, reqs))}.`);
    const w = weakness(dear, reqs);
    if (w) out.push(`At ${shortName(dear)}, ${w}.`);
  }
  const cheapest = [...hotels].sort((x, y) => totalFor(x, nights) - totalFor(y, nights))[0];
  for (const h of rest) {
    const cancel = h.freeCancellation ? "can be cancelled" : "cannot be cancelled";
    out.push(
      h === cheapest
        ? `${h.name} is the cheapest at ${money(totalFor(h, nights))} and ${cancel}${but(weakness(h, reqs))}.`
        : `${h.name} costs ${money(totalFor(h, nights))} in total and ${cancel}${but(weakness(h, reqs))}.`,
    );
  }
  return out.join(" ");
}

/* ── Copilot on Compare ─────────────────────────────────────────── */

const WORKS_FOR: Partial<Record<Requirement["kind"], string>> = {
  "late-arrival": "a midnight arrival",
  quiet: "a quiet stay",
  budget: "your budget",
};

function fullyWorks(h: Hotel, r: Requirement) {
  if (r.kind === "late-arrival") return h.late.status === "confirmed" || h.late.status === "conditional";
  if (r.kind === "quiet") return quietLevel(h) === "quiet";
  if (r.kind === "budget") return h.pricePerNight <= r.maxPerNight;
  return h.freeCancellation;
}

export type Choice = "no-call" | "cancel";
export const CHOICE_LABEL: Record<Choice, string> = { "no-call": "Not having to call ahead", cancel: "Being able to cancel" };
const CHOICE_PHRASE: Record<Choice, string> = { "no-call": "not having to call ahead", cancel: "being able to cancel" };

/** The two things that decide between stays that both work (Rule 1: one question). */
export function choices(hotels: Hotel[], reqs: Requirement[]): Choice[] {
  const out: Choice[] = [];
  const late = reqs.some((r) => r.kind === "late-arrival");
  if (late && hotels.some((h) => h.late.status === "confirmed") && hotels.some((h) => h.late.status === "conditional")) out.push("no-call");
  if (hotels.some((h) => h.freeCancellation) && hotels.some((h) => !h.freeCancellation)) out.push("cancel");
  return out;
}

/** Copilot's answer to "Compare these two" (Figma 16:525). */
export function compareSummary(hotels: Hotel[], reqs: Requirement[]): string {
  const both = hotels.length === 2 ? "Both" : `All ${hotels.length === 3 ? "three" : hotels.length}`;
  const shared = reqs.filter((r) => WORKS_FOR[r.kind] && hotels.every((h) => fullyWorks(h, r))).map((r) => WORKS_FOR[r.kind]!);
  const first = shared.length
    ? `${both} work for ${shared.length === 1 ? shared[0] : `${shared.slice(0, -1).join(", ")} and ${shared.at(-1)}`}.`
    : `None of them meets everything you asked for equally.`;
  const c = choices(hotels, reqs);
  if (c.length === 2) {
    const n = hotels.length === 2 ? "They differ on two things" : "They differ most on two things";
    return `${first} ${n}, so the choice is yours: which matters more, ${CHOICE_PHRASE[c[0]]}, or ${CHOICE_PHRASE[c[1]]}?`;
  }
  if (c.length === 1) return `${first} The main difference is ${CHOICE_PHRASE[c[0]]}. The table shows where each answer comes from.`;
  return `${first} The main difference is the price. The table shows where each answer comes from.`;
}

/** The answer after the traveler picks what matters more. Facts only; the choice stays theirs. */
export function choiceReply(choice: Choice, hotels: Hotel[], reqs: Requirement[], nights: number) {
  if (choice === "no-call") {
    const fits = hotels.filter((h) => h.late.status === "confirmed");
    const h = fits.sort((x, y) => totalFor(x, nights) - totalFor(y, nights))[0];
    const f = flexTotal(h, nights);
    const cancel = h.freeCancellation
      ? "It can also be cancelled for free."
      : f
        ? `Its lowest rate cannot be cancelled. The flexible rate is ${money(h.flexibleRate!.pricePerNight)} a night, ${money(f)} in total, and you choose the rate when you book.`
        : "Its rate cannot be cancelled.";
    return {
      hotel: h,
      text: `Then ${shortName(h)} fits better: the front desk is open 24 hours, so there is nothing to arrange. ${cancel}`,
    };
  }
  const fits = hotels.filter((h) => h.freeCancellation);
  const h = fits.sort((x, y) => totalFor(x, nights) - totalFor(y, nights))[0];
  const until = h.freeUntil ? ` until ${dayLabel(h.freeUntil)}` : "";
  const w = weakness(h, reqs);
  const flexOther = hotels.find((x) => x !== h && x.flexibleRate);
  const fo = flexOther && flexTotal(flexOther, nights)! - totalFor(h, nights);
  const other =
    flexOther && fo !== undefined && fo > 0 ? ` ${shortName(flexOther)}'s flexible rate can also be cancelled, for ${money(fo)} more.` : "";
  const remember = w ? ` Keep in mind that ${w}.` : "";
  return {
    hotel: h,
    text: `Then ${shortName(h)} fits better: free cancellation${until}, ${money(totalFor(h, nights))} in total.${remember}${other}`,
  };
}
