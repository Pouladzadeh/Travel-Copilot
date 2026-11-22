/**
 * Traveler requirements: the chips under "What I understood".
 *
 * On Home, Copilot never speaks. The "understood so far" chips come from a
 * deterministic reading of what the traveler typed, done here in code, so the
 * same text always gives the same chips. The model is not involved.
 */

export type Requirement =
  | { kind: "late-arrival"; label: string }
  | { kind: "quiet"; label: string }
  | { kind: "budget"; label: string; maxPerNight: number }
  | { kind: "free-cancellation"; label: string };

export type RequirementKind = Requirement["kind"];

export const LABELS = {
  lateArrival: "Arriving after midnight",
  quiet: "Quiet",
  budget: (n: number) => `Up to $${n} a night`,
  freeCancellation: "Free cancellation",
};

/** Suggested chips on the Home search card (Figma 21:452). */
export const HOME_SUGGESTIONS: { label: string; requirement: Requirement }[] = [
  { label: "Late check-in", requirement: { kind: "late-arrival", label: "Late check-in" } },
  { label: "Quiet area", requirement: { kind: "quiet", label: "Quiet area" } },
  { label: "Free cancellation", requirement: { kind: "free-cancellation", label: LABELS.freeCancellation } },
];

/** Hour (0–23) from "11:30 pm", "11pm", "23:30", or "midnight". */
function arrivalHour(text: string): number | null {
  if (/\bmidnight\b/.test(text)) return 24;
  const m = text.match(/\b(\d{1,2})(?::(\d{2}))?\s*(a\.?m\.?|p\.?m\.?)?/);
  if (!m) return null;
  let h = Number(m[1]);
  const ampm = m[3]?.replace(/\./g, "");
  if (ampm === "pm" && h < 12) h += 12;
  if (ampm === "am" && h === 12) h = 0;
  return h;
}

/**
 * Read requirements from free text. Returns them in a stable order:
 * arrival, quiet, budget, cancellation.
 */
export function parseRequirements(input: string): Requirement[] {
  const text = input.toLowerCase();
  const found: Requirement[] = [];

  // Late arrival: "lands at 11:30 pm", "arrive after midnight", "late check-in".
  const arrivalClause = text.match(
    /\b(land|lands|landing|arrive|arrives|arriving|arrival|get in|gets in|reach|check in|check-in)\b[^.,;]*/,
  );
  const lateWords = /\b(late check-?in|after midnight|late arrival|arriving late|red-?eye)\b/.test(text);
  if (lateWords) {
    found.push({ kind: "late-arrival", label: LABELS.lateArrival });
  } else if (arrivalClause) {
    const h = arrivalHour(arrivalClause[0]);
    // Figma: "My flight lands at 11:30 pm" → "Arriving after midnight".
    if (h !== null && (h >= 22 || h <= 4)) {
      found.push({ kind: "late-arrival", label: LABELS.lateArrival });
    }
  }

  if (/\b(quiet|peaceful|calm|no noise|not noisy|silent)\b/.test(text)) {
    found.push({ kind: "quiet", label: LABELS.quiet });
  }

  const budget = text.match(
    /\b(?:under|below|less than|up to|max(?:imum)?|no more than|at most|budget(?: of)?)\s*\$?\s*(\d{2,5})/,
  );
  if (budget) {
    const n = Number(budget[1]);
    found.push({ kind: "budget", label: LABELS.budget(n), maxPerNight: n });
  }

  if (/\b(free cancell?ation|cancel for free|free to cancel|refundable|flexible rate)\b/.test(text) && !/non-?refundable/.test(text)) {
    found.push({ kind: "free-cancellation", label: LABELS.freeCancellation });
  }

  return found;
}

/** Merge typed and chosen requirements. One per kind; the later one wins. */
export function mergeRequirements(...lists: Requirement[][]): Requirement[] {
  const byKind = new Map<RequirementKind, Requirement>();
  for (const list of lists) for (const r of list) byKind.set(r.kind, r);
  const order: RequirementKind[] = ["late-arrival", "quiet", "budget", "free-cancellation"];
  return order.flatMap((k) => (byKind.has(k) ? [byKind.get(k)!] : []));
}

/** Compact form for the URL: "late-arrival,quiet,budget:300". */
export function encodeRequirements(reqs: Requirement[]): string {
  return reqs.map((r) => (r.kind === "budget" ? `budget:${r.maxPerNight}` : r.kind)).join(",");
}

export function decodeRequirements(value: string | null | undefined): Requirement[] {
  if (!value) return [];
  return value.split(",").flatMap((token): Requirement[] => {
    if (token === "late-arrival") return [{ kind: "late-arrival", label: LABELS.lateArrival }];
    if (token === "quiet") return [{ kind: "quiet", label: LABELS.quiet }];
    if (token === "free-cancellation") return [{ kind: "free-cancellation", label: LABELS.freeCancellation }];
    const b = token.match(/^budget:(\d+)$/);
    if (b) return [{ kind: "budget", label: LABELS.budget(Number(b[1])), maxPerNight: Number(b[1]) }];
    return [];
  });
}

/** Footer line on the Home search card. */
export function searchFooterText(count: number): string {
  if (count === 0) return "Copilot ranks and explains matches. You always make the booking.";
  if (count === 1) return "Copilot will check this requirement against every stay. You always make the booking.";
  return `Copilot will check these ${count} requirements against every stay. You always make the booking.`;
}
