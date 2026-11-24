/**
 * Scoring shared by the runner and the re-grader: which scores each answer is
 * graded on, how one run's checks and grades become pass/fail per score, and
 * the summary written to every results file.
 */
import type { ModelReply } from "@/lib/copilot/prompt";
import type { CheckResult } from "./checks";
import type { Grade } from "./grader";

/** Version of policy.md (definitions, targets, grader questions) the grades follow. */
export const POLICY_VERSION = "draft-3";

/** Scores 8 and 9 are measured on every answer, whatever the case tests. */
export const ALWAYS_GRADED = ["not_toxic", "polite"];
export const SCORES = [
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

export type Row = {
  id: string;
  rule: string;
  heldout: boolean;
  run: number;
  error?: string;
  reply?: ModelReply;
  checks?: CheckResult[];
  grades?: Grade[];
  /** Pass per score for this run, after code checks and grader. */
  scores?: Record<string, boolean>;
};

/** The scores a case's answers are graded on: its own rule plus the always-graded ones. */
export const scoresFor = (rule: string) => [...new Set([rule, ...ALWAYS_GRADED])];

const passed = (g: Grade | undefined) => !!g && (g.verdict === "pass" || g.verdict === "na");

/** Code checks count toward the case's own rule only. */
export function scoreRow(rule: string, checks: CheckResult[], grades: Grade[]): Record<string, boolean> {
  const gradeFor = (score: string) => grades.find((g) => g.score === score);
  const scores: Record<string, boolean> = {};
  for (const score of ALWAYS_GRADED) scores[score] = passed(gradeFor(score));
  scores[rule] = checks.every((k) => k.pass) && passed(gradeFor(rule));
  return scores;
}

/**
 * Per score: how many answers it was measured on, how many passed, and how
 * many cases passed all of their runs. Scores 1–7 are measured on their own
 * cases; 8 and 9 on every answer. "unsure" counts as a fail (already in grades).
 */
export function summarise(rows: Row[]) {
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

export type GradeDiff = { id: string; run: number; score: string; a: Grade; b: Grade };

/**
 * Grader vs grader on the same saved replies: verdicts match when they are
 * identical ("na" vs "pass" is a disagreement; "unsure" never matches).
 */
export function compareGrades(a: Row[], b: Row[]) {
  const key = (r: Row, s: string) => `${r.id}#${r.run}#${s}`;
  const bIndex = new Map<string, Grade>();
  for (const r of b) for (const g of r.grades ?? []) bIndex.set(key(r, g.score), g);

  const diffs: GradeDiff[] = [];
  const perScore: Record<string, { compared: number; agreed: number }> = {};
  let compared = 0;
  let missing = 0;
  for (const r of a) {
    for (const ga of r.grades ?? []) {
      const gb = bIndex.get(key(r, ga.score));
      if (!gb) {
        missing++;
        continue;
      }
      compared++;
      const s = (perScore[ga.score] ??= { compared: 0, agreed: 0 });
      s.compared++;
      const agree = ga.verdict === gb.verdict && ga.verdict !== "unsure";
      if (agree) s.agreed++;
      else diffs.push({ id: r.id, run: r.run, score: ga.score, a: ga, b: gb });
    }
  }
  const agreed = compared - diffs.length;
  return { compared, agreed, missing, perScore, diffs };
}
