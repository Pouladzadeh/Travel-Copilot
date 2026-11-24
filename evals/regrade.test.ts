/**
 * Re-grades the saved replies in a results file. Copilot is not called again,
 * so any change in the scores comes from the grader alone. Code checks are
 * re-run with the current checks.ts. Writes a new results file next to the
 * original; the original is never changed.
 *
 *   RUN_REGRADE=1 RESULTS=evals/results/<file>.json \
 *     npx vitest run -c vitest.evals.config.mts evals/regrade.test.ts
 *
 * GRADER_MODEL picks the grader (default: the one in grader.ts), for example
 * GRADER_MODEL=claude-opus-5-5 for a second grader.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import Anthropic from "@anthropic-ai/sdk";
import { describe, it } from "vitest";
import { GRADER_MODEL } from "./grader";
import { regradeRows } from "./regrade-core";
import { POLICY_VERSION, summarise, type Row } from "./score";
import casesFile from "./cases.json";
import type { EvalCase } from "./types";

type ResultsFile = {
  policy_version: string;
  model_under_test: string;
  grader_model: string;
  final: boolean;
  run_at: string;
  rows: Row[];
};

describe.runIf(process.env.RUN_REGRADE === "1")("Copilot eval: re-grade saved replies", () => {
  it(
    "re-grades a results file and writes a new one",
    async () => {
      try {
        process.loadEnvFile(path.resolve(__dirname, "..", ".env.local"));
      } catch {
        // no .env.local: rely on the shell environment
      }
      if (!process.env.ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY is not set (.env.local or shell)");
      const src = process.env.RESULTS && path.resolve(process.env.RESULTS);
      if (!src || !existsSync(src)) throw new Error("Set RESULTS to an existing results file");
      const model = process.env.GRADER_MODEL || GRADER_MODEL;

      const input = JSON.parse(readFileSync(src, "utf8")) as ResultsFile;
      const client = new Anthropic();
      const rows = await regradeRows(input.rows, casesFile.cases as EvalCase[], client, model, () => process.stdout.write("."));
      process.stdout.write("\n");

      const summary = summarise(rows);
      const out = src.replace(/\.json$/, `-regraded-${model}.json`);
      writeFileSync(
        out,
        JSON.stringify(
          {
            policy_version: input.policy_version,
            model_under_test: input.model_under_test,
            grader_model: model,
            final: input.final,
            run_at: input.run_at,
            regraded_from: path.basename(src),
            regraded_at: new Date().toISOString(),
            grading_policy_version: POLICY_VERSION,
            summary,
            rows,
          },
          null,
          2,
        ),
      );
      console.log(JSON.stringify(summary, null, 2));
      console.log(`results: ${out}`);
    },
    2 * 60 * 60 * 1000,
  );
});
