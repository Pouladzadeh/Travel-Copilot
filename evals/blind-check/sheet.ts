/**
 * Blind check, part 1: picks runs nobody has discussed and renders them as a
 * grading sheet. No grader verdicts are read or written here, so the sheet can
 * be graded before any draft-3 grade exists.
 */
import type { ModelReply } from "@/lib/copilot/prompt";
import { grounding } from "@/lib/copilot/grounding";
import type { ReplyContext } from "@/lib/copilot/types";
import { hotelById } from "@/lib/hotels";
import { decodeRequirements, LABELS } from "@/lib/requirements";
import { RUBRIC } from "../grader";
import { SCORES, type Row } from "../score";
import type { EvalCase } from "../types";

export const SEED = 20261124;
export const SIZE = 15;

/**
 * Runs already seen in review (results discussed, the first blind sheet, or the
 * Haiku/Opus disagreement list). "id" alone excludes every run of that case.
 */
export const EXCLUDED = [
  "sc-01",
  "sc-02",
  "sc-03",
  "sc-04",
  "ev-01",
  "ev-02",
  "ev-03",
  "hd-04",
  "po-03",
  "po-06",
  "oq-01",
  "sm-01",
  "hd-05#2",
  "sm-02#2",
  "sm-04#3",
  "ng-03#1",
  "po-01#1",
  "nt-02#1",
  "nt-04#3",
];

export type Pick = { label: string; id: string; run: number; score: string };

function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const excluded = (r: Row) => EXCLUDED.includes(r.id) || EXCLUDED.includes(`${r.id}#${r.run}`);

/**
 * One run per score first (so every score is represented), then the rest at
 * random, at most one run per case. Each item is graded on its case's own rule.
 */
export function pick(rows: Row[], seed = SEED, size = SIZE): Pick[] {
  const r = rng(seed);
  const pool = rows.filter((x) => !x.error && x.reply && !x.heldout && !excluded(x));
  const shuffled = pool
    .map((x) => ({ x, k: r() }))
    .sort((a, b) => a.k - b.k)
    .map((p) => p.x);
  const chosen: Row[] = [];
  const usedCase = new Set<string>();
  for (const score of SCORES) {
    const hit = shuffled.find((x) => x.rule === score && !usedCase.has(x.id));
    if (hit) {
      chosen.push(hit);
      usedCase.add(hit.id);
    }
  }
  for (const x of shuffled) {
    if (chosen.length >= size) break;
    if (!usedCase.has(x.id)) {
      chosen.push(x);
      usedCase.add(x.id);
    }
  }
  const order = chosen
    .map((x) => ({ x, k: r() }))
    .sort((a, b) => a.k - b.k)
    .map((p) => p.x);
  return order.map((x, i) => ({ label: `B${String(i + 1).padStart(2, "0")}`, id: x.id, run: x.run, score: x.rule }));
}

const KIND_LABEL: Record<string, string> = {
  "late-arrival": LABELS.lateArrival,
  quiet: LABELS.quiet,
  "free-cancellation": LABELS.freeCancellation,
};

function changeInWords(ch: NonNullable<ModelReply["requirement_change"]>): string {
  if (ch.op === "budget")
    return ch.max_per_night == null ? "Budget removed, with Undo" : `Budget changed to $${ch.max_per_night} a night, with Undo`;
  const label = KIND_LABEL[ch.kind ?? ""] ?? ch.kind ?? "(unknown)";
  return ch.op === "add" ? `Requirement added: ${label}, with Undo` : `Requirement removed: ${label}, with Undo`;
}

const quote = (s: string) =>
  s
    .split("\n")
    .map((l) => `> ${l}`)
    .join("\n");

function item(p: Pick, c: EvalCase, reply: ModelReply): string {
  const ctx: ReplyContext = {
    requirements: decodeRequirements(c.requirements.join(",")),
    screen: c.screen,
    hotelId: c.hotelId,
    hotelIds: c.hotelIds,
  };
  const facts = reply.facts ?? [];
  const links = (reply.hotel_links ?? []).map((id) => hotelById(id)?.name ?? id);
  const sugg = reply.suggestions ?? [];
  return [
    `## ${p.label}`,
    "",
    "### Question to judge",
    "",
    quote(RUBRIC[p.score]),
    "",
    "### What the case expects",
    "",
    "**Must:**",
    "",
    ...(c.must.length ? c.must.map((m) => `- ${m}`) : ["- (nothing listed)"]),
    "",
    "**Must not:**",
    "",
    ...(c.mustNot.length ? c.mustNot.map((m) => `- ${m}`) : ["- (nothing listed)"]),
    "",
    "### Conversation",
    "",
    ...c.turns.flatMap((t) => [`**${t.from === "traveler" ? "Traveler" : "Copilot"}:** ${t.text}`, ""]),
    "### Copilot's reply, as the traveler sees it",
    "",
    "**Answer:**",
    "",
    reply.answer.trim() ? quote(reply.answer.trim()) : "(no text)",
    "",
    "**Facts shown:**",
    "",
    ...(facts.length ? facts.map((f) => `- ${f.text} _(source: ${f.source})_`) : ["- (none)"]),
    "",
    `**Links to stays:** ${links.length ? links.join(", ") : "(none)"}`,
    "",
    `**Shows a Talk to a person button:** ${reply.offer_person ? "yes" : "no"}`,
    "",
    `**Requirement change:** ${reply.requirement_change ? changeInWords(reply.requirement_change) : "(none)"}`,
    "",
    `**Suggestion chips:** ${sugg.length ? sugg.map((s) => `"${s}"`).join(", ") : "(none)"}`,
    "",
    "<details>",
    "<summary>Facts Copilot was given</summary>",
    "",
    "```json",
    JSON.stringify(grounding(ctx), null, 2),
    "```",
    "",
    "</details>",
    "",
    "### Your grade",
    "",
    "Verdict (pass / fail / na):",
    "",
    "Reason (one line):",
    "",
    "---",
    "",
  ].join("\n");
}

export function renderSheet(picks: Pick[], rows: Row[], cases: EvalCase[]): string {
  const head = [
    "# Blind grading sheet: Copilot eval, run 2 (second check)",
    "",
    'Judge each item on its question only. Type `pass`, `fail` or `na` on the same line as "Verdict", and a one-line reason on the same line as "Reason".',
    "",
    "`na` means the question does not apply to this reply. It is its own verdict, not a pass.",
    "",
    'How the reply appears: an empty answer with a requirement change is shown as a change card with Undo; "Talk to a person button: yes" means the button is visible under the answer; suggestion chips are tappable, not questions.',
    "",
    "---",
    "",
  ];
  const body = picks.map((p) => {
    const row = rows.find((r) => r.id === p.id && r.run === p.run);
    const c = cases.find((k) => k.id === p.id);
    if (!row?.reply || !c) throw new Error(`no usable reply for ${p.id}#${p.run}`);
    return item(p, c, row.reply);
  });
  return [...head, ...body].join("\n");
}
