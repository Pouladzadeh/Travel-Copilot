/**
 *   BLIND_COMPARE=1 GRADED=<graded results file>[,<another>] \
 *     npx vitest run -c vitest.evals.config.mts --silent=false evals/blind-check/compare.test.ts
 *
 * Compares your filled-in sheet.md with each grader's verdicts for the same
 * items. No model is called.
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, it } from "vitest";
import type { Row } from "../score";
import { checkSheet, compareWithGrader, readSheet } from "./agreement";
import type { Pick } from "./sheet";

describe.runIf(process.env.BLIND_COMPARE === "1")("blind check: you vs the graders", () => {
  it("prints agreement and the disagreements", () => {
    const { picks } = JSON.parse(readFileSync(path.resolve(__dirname, "picks.json"), "utf8")) as { picks: Pick[] };
    const human = readSheet(readFileSync(path.resolve(__dirname, "sheet.md"), "utf8"));
    const problem = checkSheet(picks, human);
    if (problem) throw new Error(problem);
    const files = (process.env.GRADED ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (!files.length) throw new Error("Set GRADED to one or more graded results files");
    const lines: string[] = [];
    for (const f of files) {
      const file = JSON.parse(readFileSync(path.resolve(f), "utf8")) as {
        grader_model: string;
        policy_version?: string;
        grading_policy_version?: string;
        rows: Row[];
      };
      const r = compareWithGrader(picks, human, file.rows);
      lines.push(
        `You vs ${file.grader_model} (policy ${file.grading_policy_version ?? file.policy_version}): ${r.agreed} of ${r.total} (${Math.round((100 * r.agreed) / r.total)}%)`,
        ...r.diffs.flatMap((d) => [
          `  ${d.pick.label}  ${d.pick.id}#${d.pick.run}  ${d.pick.score}`,
          `    You:    ${d.you.verdict} | ${d.you.reason || "(no reason)"}`,
          `    Grader: ${d.grader.verdict} | ${d.grader.reason}`,
        ]),
        "",
      );
    }
    console.log(lines.join("\n"));
  });
});
