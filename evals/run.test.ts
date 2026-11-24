/**
 * The eval runner. It calls the real /api/copilot handler, so it tests the
 * same code the app uses. It only runs with RUN_EVALS=1 (it costs money).
 *
 *   RUN_EVALS=1 npm run eval                 working cases, 3 runs each
 *   RUN_EVALS=1 FINAL=1 npm run eval         adds the 10 held-out cases (final run only)
 *   RUN_EVALS=1 EVAL_ONLY=oq-01,sm-01 ...    a few cases, for debugging
 */
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import Anthropic from "@anthropic-ai/sdk";
import { describe, it } from "vitest";
import type { ReplyContext } from "@/lib/copilot/types";
import { decodeRequirements } from "@/lib/requirements";
import { runCodeChecks, type CheckResult } from "./checks";
import { grade, GRADER_MODEL, type Grade } from "./grader";
import casesFile from "./cases.json";
import type { EvalCase, Turn } from "./types";

const POLICY_VERSION = "draft-1";
const RUNS = 3;
/** Scores 8 and 9 are measured on every answer, whatever the case tests. */
const ALWAYS_GRADED = ["not_toxic", "polite"];
const SCORES = [
  "one_question",
  "say_what_changed",
  "never_guess",
  "evidence",
  "stop_at_money",
  "way_to_person",
  "helps_decide",
  "not_toxic",
  "polite",
];

type Row = {
  id: string;
  rule: string;
  heldout: boolean;
  run: number;
  error?: string;
  reply?: unknown;
  checks?: CheckResult[];
  grades?: Grade[];
  /** Pass per score for this run, after code checks and grader. */
  scores?: Record<string, boolean>;
};

const passed = (g: Grade) => g.verdict === "pass" || g.verdict === "na";

describe.runIf(process.env.RUN_EVALS === "1")("Copilot eval", () => {
  it(
    "runs the cases and writes a results file",
    async () => {
      process.env.COPILOT_MODEL = process.env.COPILOT_MODEL || "claude-opus-5-5";
      const { POST } = await import("@/app/api/copilot/route");
      const client = new Anthropic();
      const final = process.env.FINAL === "1";
      const only = process.env.EVAL_ONLY?.split(",").map((s) => s.trim());
      const cases = (casesFile.cases as EvalCase[]).filter((c) => (final || !c.heldout) && (!only || only.includes(c.id)));

      const rows: Row[] = [];
      for (const c of cases) {
        for (let run = 1; run <= RUNS; run++) {
          rows.push(await runOnce(POST, client, c, run));
          process.stdout.write(`.`);
        }
      }
      process.stdout.write("\n");

      const summary = summarise(rows);
      const stamp = new Date().toISOString().replace(/[:.]/g, "-");
      const file = path.resolve(__dirname, "results", `${stamp}-${process.env.COPILOT_MODEL}${final ? "-final" : ""}.json`);
      mkdirSync(path.dirname(file), { recursive: true });
      writeFileSync(
        file,
        JSON.stringify(
          {
            policy_version: POLICY_VERSION,
            model_under_test: process.env.COPILOT_MODEL,
            grader_model: GRADER_MODEL,
            final,
            run_at: new Date().toISOString(),
            summary,
            rows,
          },
          null,
          2,
        ),
      );
      console.log(JSON.stringify(summary, null, 2));
      console.log(`results: ${file}`);
    },
    2 * 60 * 60 * 1000,
  );
});

async function runOnce(POST: (req: Request) => Promise<Response>, client: Anthropic, c: EvalCase, run: number): Promise<Row> {
  const base = { id: c.id, rule: c.rule, heldout: c.heldout, run };
  const last = c.turns[c.turns.length - 1];
  if (last.from !== "traveler") return { ...base, error: "case must end with a traveler turn" };
  const history: Turn[] = c.turns.slice(0, -1);

  const res = await POST(
    new Request("http://localhost/api/copilot", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        text: last.text,
        context: { requirements: c.requirements.join(","), screen: c.screen, hotelId: c.hotelId, hotelIds: c.hotelIds },
        history,
      }),
    }),
  );
  if (res.status !== 200) return { ...base, error: `HTTP ${res.status}` };
  const reply = ((await res.json()) as { reply: import("@/lib/copilot/prompt").ModelReply }).reply;

  const ctx: ReplyContext = {
    requirements: decodeRequirements(c.requirements.join(",")),
    screen: c.screen,
    hotelId: c.hotelId,
    hotelIds: c.hotelIds,
  };
  const checks = runCodeChecks(c, reply);
  const grades: Grade[] = [];
  for (const score of [...new Set([c.rule, ...ALWAYS_GRADED])]) {
    grades.push(await grade(client, score, c, ctx, c.turns, reply));
  }
  const gradeFor = (score: string) => grades.find((g) => g.score === score);

  const scores: Record<string, boolean> = {};
  for (const score of ALWAYS_GRADED) scores[score] = passed(gradeFor(score)!);
  scores[c.rule] = checks.every((k) => k.pass) && passed(gradeFor(c.rule)!);

  return { ...base, reply, checks, grades, scores };
}

/**
 * Per score: how many answers it was measured on, how many passed, and how
 * many cases passed all of their runs. Scores 1–7 are measured on their own
 * cases; 8 and 9 on every answer. "unsure" counts as a fail (already in grades).
 */
function summarise(rows: Row[]) {
  const ok = rows.filter((r) => !r.error);
  const out: Record<string, unknown> = { errors: rows.length - ok.length, runs: ok.length };
  for (const score of SCORES) {
    const measured = ok.filter((r) => ALWAYS_GRADED.includes(score) || r.rule === score);
    const pass = measured.filter((r) => r.scores?.[score]).length;
    const byCase = new Map<string, boolean>();
    for (const r of measured) byCase.set(r.id, (byCase.get(r.id) ?? true) && !!r.scores?.[score]);
    const allThree = [...byCase.values()].filter(Boolean).length;
    out[score] = {
      measured: measured.length,
      passed: pass,
      percent: measured.length ? Math.round((100 * pass) / measured.length) : null,
      cases_passing_all_runs: `${allThree} of ${byCase.size}`,
      flagged_for_review: measured.flatMap((r) =>
        (r.grades ?? []).filter((g) => g.flagged && g.score === score).map(() => `${r.id}#${r.run}`),
      ),
    };
  }
  return out;
}
