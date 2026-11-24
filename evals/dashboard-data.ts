/**
 * Builds the data the /evals page shows, from one graded results file plus the
 * author's overrides. Everything here is derived from real runs; nothing is
 * typed in by hand except the grader-check numbers in dashboard-inputs.json,
 * which record a comparison that was run and its source.
 */
import type { Grade } from "./grader";
import { scoreRow, summarise, TARGETS, type Row } from "./score";
import type { EvalCase } from "./types";

export type Override = {
  id: string;
  run: number;
  score: string;
  verdict: string;
  reason: string;
  by: string;
  date: string;
  problem: string;
};

export type DashboardData = {
  run: {
    label: string;
    date: string;
    modelUnderTest: string;
    promptVersion: string;
    grader: string;
    policy: string;
    cases: number;
    runsPerCase: number;
    replies: number;
    heldOutIncluded: boolean;
    source: string;
  };
  scores: {
    key: string;
    label: string;
    target: number;
    targetSignedOff: boolean;
    passed: number;
    measured: number;
    /** null when no answer in this run was measured on the score. */
    percent: number | null;
    casesAllRuns: string;
    meetsTarget: boolean;
  }[];
  failures: { id: string; run: number; score: string; traveler: string; answer: string; why: string; overridden?: boolean }[];
  overrides: {
    id: string;
    run: number;
    score: string;
    problem: string;
    status: "applied" | "pending";
    verdict?: string;
    reason?: string;
  }[];
};

/** Applies overrides that have a verdict; returns the rows with grades replaced and scores recomputed. */
export function applyOverrides(rows: Row[], overrides: Override[]): Row[] {
  const ready = overrides.filter((o) => ["pass", "fail", "na"].includes(o.verdict));
  return rows.map((r) => {
    const mine = ready.filter((o) => o.id === r.id && o.run === r.run);
    if (!mine.length || !r.grades) return r;
    const grades: Grade[] = r.grades.map((g) => {
      const o = mine.find((x) => x.score === g.score);
      return o ? { ...g, verdict: o.verdict as Grade["verdict"], reason: `Author override: ${o.reason}`, quote: "", flagged: false } : g;
    });
    return { ...r, grades, scores: scoreRow(r.rule, r.checks ?? [], grades) };
  });
}

export function buildDashboard(
  file: {
    model_under_test: string;
    prompt_version?: string;
    grader_model: string;
    policy_version?: string;
    grading_policy_version?: string;
    run_at: string;
    final: boolean;
    rows: Row[];
  },
  cases: EvalCase[],
  overrides: Override[],
  source: string,
  label: string,
): DashboardData {
  const rows = applyOverrides(file.rows, overrides);
  const summary = summarise(rows) as Record<
    string,
    { measured: number; passed: number; percent: number | null; cases_passing_all_runs: string }
  >;
  const byId = new Map(cases.map((c) => [c.id, c]));
  const overridden = new Set(overrides.filter((o) => ["pass", "fail", "na"].includes(o.verdict)).map((o) => `${o.id}#${o.run}#${o.score}`));

  const failures: DashboardData["failures"] = [];
  for (const r of rows) {
    if (r.error || !r.scores) continue;
    for (const [score, ok] of Object.entries(r.scores)) {
      if (ok) continue;
      const g = r.grades?.find((x) => x.score === score);
      const checks = score === r.rule ? (r.checks ?? []).filter((k) => !k.pass) : [];
      const why = [
        ...checks.map((k) => `Code check ${k.check} failed (${k.detail}).`),
        ...(g && g.verdict !== "pass" && g.verdict !== "na" ? [`Grader: ${g.reason}`] : []),
      ].join(" ");
      const c = byId.get(r.id);
      failures.push({
        id: r.id,
        run: r.run,
        score,
        traveler: c?.turns[c.turns.length - 1].text ?? "",
        answer: r.reply?.answer ?? "",
        why,
        ...(overridden.has(`${r.id}#${r.run}#${score}`) ? { overridden: true } : {}),
      });
    }
  }

  const ids = new Set(rows.map((r) => r.id));
  return {
    run: {
      label,
      date: file.run_at.slice(0, 10),
      modelUnderTest: file.model_under_test,
      promptVersion: file.prompt_version ?? "v1",
      grader: file.grader_model,
      policy: file.grading_policy_version ?? file.policy_version ?? "unknown",
      cases: ids.size,
      runsPerCase: ids.size ? Math.round(rows.length / ids.size) : 0,
      replies: rows.filter((r) => !r.error).length,
      heldOutIncluded: file.final,
      source,
    },
    scores: Object.entries(TARGETS).map(([key, t]) => {
      const s = summary[key];
      return {
        key,
        label: t.label,
        target: t.target,
        targetSignedOff: t.signedOff,
        passed: s.passed,
        measured: s.measured,
        percent: s.percent,
        casesAllRuns: s.cases_passing_all_runs,
        meetsTarget: s.measured > 0 && s.percent !== null && s.percent >= t.target,
      };
    }),
    failures,
    overrides: overrides.map((o) =>
      ["pass", "fail", "na"].includes(o.verdict)
        ? { id: o.id, run: o.run, score: o.score, problem: o.problem, status: "applied" as const, verdict: o.verdict, reason: o.reason }
        : { id: o.id, run: o.run, score: o.score, problem: o.problem, status: "pending" as const },
    ),
  };
}
