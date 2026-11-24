/**
 *   BUILD_DASHBOARD=1 GRADED=evals/results/<graded file>.json \
 *     npx vitest run -c vitest.evals.config.mts --silent=false evals/dashboard.test.ts
 *
 * Writes src/data/evals-run2.json, which the /evals page reads. No model is called.
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { applyOverrides, buildDashboard, type Override } from "./dashboard-data";
import type { Row } from "./score";
import casesFile from "./cases.json";
import inputs from "./dashboard-inputs.json";
import overridesFile from "./overrides.json";
import type { EvalCase } from "./types";

describe.runIf(process.env.BUILD_DASHBOARD === "1")("dashboard data", () => {
  it("writes src/data/evals-run2.json", () => {
    const src = path.resolve(process.env.GRADED ?? "");
    const file = JSON.parse(readFileSync(src, "utf8"));
    const data = buildDashboard(file, casesFile.cases as EvalCase[], overridesFile.overrides as Override[], path.basename(src));
    const out = path.resolve(__dirname, "..", "src", "data", "evals-run2.json");
    mkdirSync(path.dirname(out), { recursive: true });
    writeFileSync(out, JSON.stringify({ ...data, ...inputs, note: undefined }, null, 2) + "\n");
    console.log(
      `wrote ${out}: ${data.scores.filter((s) => s.meetsTarget).length} of ${data.scores.length} scores meet target, ${data.failures.length} failing grades`,
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
