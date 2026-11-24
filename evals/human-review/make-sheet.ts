/**
 * Builds a blind human-grading sheet from one eval results file, so the AI
 * grader can be checked against a person's judgment. No model is called.
 *
 *   npx tsx evals/human-review/make-sheet.ts
 *
 * Writes:
 *   sheet-run2.md  items A01–A15 in shuffled order, with no case ids, grader
 *                  verdicts, code checks or scores
 *   key-run2.json  A-label → case id, run, score and the grader's verdict
 */
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { grounding } from "@/lib/copilot/grounding";
import type { ModelReply } from "@/lib/copilot/prompt";
import type { ReplyContext } from "@/lib/copilot/types";
import { hotelById } from "@/lib/hotels";
import { decodeRequirements, LABELS } from "@/lib/requirements";
import { RUBRIC, type Grade } from "../grader";
import type { EvalCase } from "../types";

const here = path.dirname(fileURLToPath(import.meta.url));
const RESULTS = path.resolve(here, "../results/2026-11-24T17-55-36-018Z-claude-opus-5-5.json");
const CASES = path.resolve(here, "../cases.json");
const SHEET = path.resolve(here, "sheet-run2.md");
const KEY = path.resolve(here, "key-run2.json");
const SEED = 20261124;

/** The 15 runs to grade, each on one score. */
const PICKS: { id: string; run: number; score: string }[] = [
  { id: "sc-03", run: 3, score: "say_what_changed" },
  { id: "sc-03", run: 1, score: "say_what_changed" },
  { id: "sc-04", run: 1, score: "say_what_changed" },
  { id: "ev-02", run: 1, score: "evidence" },
  { id: "ev-02", run: 2, score: "evidence" },
  { id: "ev-02", run: 3, score: "evidence" },
  { id: "sm-01", run: 1, score: "stop_at_money" },
  { id: "sm-01", run: 3, score: "stop_at_money" },
  { id: "hd-04", run: 1, score: "helps_decide" },
  { id: "hd-04", run: 3, score: "helps_decide" },
  { id: "nt-02", run: 1, score: "not_toxic" },
  { id: "nt-04", run: 3, score: "not_toxic" },
  { id: "po-01", run: 1, score: "polite" },
  { id: "po-03", run: 1, score: "polite" },
  { id: "po-06", run: 1, score: "polite" },
];

type Row = { id: string; run: number; error?: string; reply?: ModelReply; grades?: Grade[] };

/** Small seeded PRNG (mulberry32), so the order is the same on every run. */
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

function shuffle<T>(xs: T[], seed: number): T[] {
  const out = [...xs];
  const r = rng(seed);
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

const KIND_LABEL: Record<string, string> = {
  "late-arrival": LABELS.lateArrival,
  quiet: LABELS.quiet,
  "free-cancellation": LABELS.freeCancellation,
};

function changeInWords(ch: NonNullable<ModelReply["requirement_change"]>): string {
  if (ch.op === "budget") {
    return ch.max_per_night == null ? "Budget removed, with Undo" : `Budget changed to $${ch.max_per_night} a night, with Undo`;
  }
  const label = KIND_LABEL[ch.kind ?? ""] ?? ch.kind ?? "(unknown)";
  return ch.op === "add" ? `Requirement added: ${label}, with Undo` : `Requirement removed: ${label}, with Undo`;
}

const quoteBlock = (s: string) => s.split("\n").map((l) => `> ${l}`).join("\n");

function item(label: string, score: string, c: EvalCase, reply: ModelReply): string {
  const ctx: ReplyContext = {
    requirements: decodeRequirements(c.requirements.join(",")),
    screen: c.screen,
    hotelId: c.hotelId,
    hotelIds: c.hotelIds,
  };
  const facts = reply.facts ?? [];
  const links = (reply.hotel_links ?? []).map((id) => hotelById(id)?.name ?? id);
  const out: string[] = [];
  out.push(`## ${label}`, "");
  out.push(`### Question to judge (${score})`, "", quoteBlock(RUBRIC[score]), "");
  out.push("### What the case expects", "", "**Must:**", "");
  out.push(...(c.must.length ? c.must.map((m) => `- ${m}`) : ["- (nothing listed)"]), "");
  out.push("**Must not:**", "");
  out.push(...(c.mustNot.length ? c.mustNot.map((m) => `- ${m}`) : ["- (nothing listed)"]), "");
  out.push("### Conversation", "");
  for (const t of c.turns) out.push(`**${t.from === "traveler" ? "Traveler" : "Copilot"}:** ${t.text}`, "");
  out.push("### Copilot's reply, as the traveler sees it", "");
  out.push("**Answer:**", "", reply.answer.trim() ? quoteBlock(reply.answer.trim()) : "(no text)", "");
  out.push("**Facts shown:**", "");
  out.push(...(facts.length ? facts.map((f) => `- ${f.text} _(source: ${f.source})_`) : ["- (none)"]), "");
  out.push(`**Links to stays:** ${links.length ? links.join(", ") : "(none)"}`, "");
  out.push(`**Shows a Talk to a person button:** ${reply.offer_person ? "yes" : "no"}`, "");
  out.push(`**Requirement change:** ${reply.requirement_change ? changeInWords(reply.requirement_change) : "(none)"}`, "");
  const sugg = reply.suggestions ?? [];
  out.push(`**Suggestion chips:** ${sugg.length ? sugg.map((s) => `"${s}"`).join(", ") : "(none)"}`, "");
  out.push("<details>", "<summary>Facts Copilot was given</summary>", "");
  out.push("```json", JSON.stringify(grounding(ctx), null, 2), "```", "", "</details>", "");
  out.push("### Your grade", "", "Verdict (pass / fail / na):", "", "Reason (one line):", "", "---", "");
  return out.join("\n");
}

function main() {
  const results = JSON.parse(readFileSync(RESULTS, "utf8")) as { rows: Row[] };
  const cases = (JSON.parse(readFileSync(CASES, "utf8")) as { cases: EvalCase[] }).cases;

  const order = shuffle(PICKS, SEED);
  const sheet: string[] = [
    "# Blind grading sheet: Copilot eval, run 2",
    "",
    "Judge each item on its question only. For each one, fill in a verdict (`pass`, `fail` or `na`) and a one-line reason on the lines at the end, after the colon. Then run `npm run eval:agreement`.",
    "",
    "`na` means the question does not apply to this reply. It is its own verdict, not a pass.",
    "",
    "---",
    "",
  ];
  const key: Record<string, { case: string; run: number; score: string; verdict: string; quote: string; reason: string }> = {};

  order.forEach((p, i) => {
    const label = `A${String(i + 1).padStart(2, "0")}`;
    const row = results.rows.find((r) => r.id === p.id && r.run === p.run);
    if (!row || row.error || !row.reply) throw new Error(`no usable result for ${p.id}#${p.run}`);
    const c = cases.find((k) => k.id === p.id);
    if (!c) throw new Error(`case ${p.id} not in cases.json`);
    const g = row.grades?.find((x) => x.score === p.score);
    if (!g) throw new Error(`no ${p.score} grade for ${p.id}#${p.run}`);
    sheet.push(item(label, p.score, c, row.reply));
    key[label] = { case: p.id, run: p.run, score: p.score, verdict: g.verdict, quote: g.quote, reason: g.reason };
  });

  writeFileSync(SHEET, sheet.join("\n"));
  writeFileSync(KEY, JSON.stringify({ source: path.basename(RESULTS), seed: SEED, items: key }, null, 2) + "\n");
  console.log(`wrote ${path.relative(process.cwd(), SHEET)} (${order.length} items)`);
  console.log(`wrote ${path.relative(process.cwd(), KEY)}`);
}

main();
