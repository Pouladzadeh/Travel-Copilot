/**
 *   BUILD_DASHBOARD=1 BEFORE=<graded run 2> AFTER=<graded run 3> [FINAL=<graded held-out run>] \
 *     npx vitest run -c vitest.evals.config.mts --silent=false evals/dashboard.test.ts
 *
 * Writes src/data/evals.json, which the /evals page reads. Before and after
 * must be graded by the same grader under the same policy. No model is called.
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { applyOverrides, buildDashboard, type DashboardData, type Override } from "./dashboard-data";
import type { Row } from "./score";
import casesFile from "./cases.json";
import inputs from "./dashboard-inputs.json";
import overridesFile from "./overrides.json";
import type { EvalCase } from "./types";

function load(env: string | undefined, label: string): DashboardData | undefined {
  if (!env) return undefined;
  const src = path.resolve(env);
  const file = JSON.parse(readFileSync(src, "utf8"));
  return buildDashboard(file, casesFile.cases as EvalCase[], overridesFile.overrides as Override[], path.basename(src), label);
}

describe.runIf(process.env.BUILD_DASHBOARD === "1")("dashboard data", () => {
  it("writes src/data/evals.json", () => {
    const before = load(process.env.BEFORE, "Run 2 · before fixes (prompt v1)");
    if (!before) throw new Error("Set BEFORE to a graded results file");
    const after = load(process.env.AFTER, "Run 3 · after fixes (prompt v2)");
    const final = load(process.env.FINAL, "Final · held-out cases (prompt v2)");
    if (after && (after.run.grader !== before.run.grader || after.run.policy !== before.run.policy))
      throw new Error(
        `Before and after must use the same grader and policy (${before.run.grader}/${before.run.policy} vs ${after.run.grader}/${after.run.policy})`,
      );
    const out = path.resolve(__dirname, "..", "src", "data", "evals.json");
    mkdirSync(path.dirname(out), { recursive: true });
    const { note: _note, ...rest } = inputs as typeof inputs & { note?: string };
    void _note;
    writeFileSync(out, JSON.stringify({ before, after: after ?? null, final: final ?? null, ...rest }, null, 2) + "\n");
    const latest = final ?? after ?? before;
    console.log(
      `wrote ${out}: latest ${latest.run.label}: ${latest.scores.filter((s) => s.meetsTarget).length} of ${latest.scores.length} scores meet target`,
    );
  });
});

describe("overrides", () => {
  const row: Row = {
    id: "oq-01",
    rule: "one_question",
    heldout: false,
    run: 2,
    checks: [],
    grades: [
      { score: "one_question", verdict: "fail", quote: "", reason: "contradicts itself", flagged: false },
      { score: "not_toxic", verdict: "pass", quote: "", reason: "", flagged: false },
      { score: "polite", verdict: "pass", quote: "", reason: "", flagged: false },
    ],
    scores: { one_question: false, not_toxic: true, polite: true },
  };
  const o = (verdict: string): Override => ({
    id: "oq-01",
    run: 2,
    score: "one_question",
    verdict,
    reason: "One question, stated assumption.",
    by: "Peri",
    date: "2026-11-24",
    problem: "",
  });

  it("a blank override changes nothing", () => {
    expect(applyOverrides([row], [o("")])[0]).toBe(row);
  });

  it("a filled override replaces the verdict and rescores, keeping it visible", () => {
    const [r] = applyOverrides([row], [o("pass")]);
    expect(r.scores?.one_question).toBe(true);
    expect(r.grades?.[0].reason).toMatch(/^Author override/);
  });
});
