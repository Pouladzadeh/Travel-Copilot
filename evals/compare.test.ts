/**
 * Grader vs grader: compares the verdicts in two results files for the same
 * saved replies (usually a file and its re-graded copy). No model is called.
 *
 *   COMPARE_A=evals/results/<a>.json COMPARE_B=evals/results/<b>.json \
 *     npx vitest run -c vitest.evals.config.mts evals/compare.test.ts
 *
 * The disagreements it lists are the items a person should review first.
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, it } from "vitest";
import { compareGrades, type Row } from "./score";

type File = { grader_model: string; rows: Row[] };
const load = (p: string) => JSON.parse(readFileSync(path.resolve(p), "utf8")) as File;

describe.runIf(!!process.env.COMPARE_A && !!process.env.COMPARE_B)("Copilot eval: grader vs grader", () => {
  it("prints agreement and the disagreements", () => {
    const a = load(process.env.COMPARE_A!);
    const b = load(process.env.COMPARE_B!);
    const r = compareGrades(a.rows, b.rows);
    const pct = (x: number, n: number) => (n ? `${Math.round((100 * x) / n)}%` : "n/a");
    const lines = [
      `Grader A: ${a.grader_model}   Grader B: ${b.grader_model}`,
      `Overall agreement: ${r.agreed} of ${r.compared} (${pct(r.agreed, r.compared)})${r.missing ? `, ${r.missing} grades missing in B` : ""}`,
      "",
      "Per score:",
      ...Object.entries(r.perScore).map(([s, v]) => `  ${s.padEnd(18)} ${v.agreed} of ${v.compared} (${pct(v.agreed, v.compared)})`),
      "",
      `Disagreements to review: ${r.diffs.length}`,
      ...r.diffs.flatMap((d) => [
        "",
        `${d.id}#${d.run}  ${d.score}`,
        `  A: ${d.a.verdict} | ${d.a.reason}`,
        `  B: ${d.b.verdict} | ${d.b.reason}`,
      ]),
    ];
    console.log(lines.join("\n"));
  });
});
