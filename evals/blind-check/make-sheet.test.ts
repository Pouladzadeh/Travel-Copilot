/**
 *   BLIND_SHEET=1 RESULTS=evals/results/<run>.json \
 *     npx vitest run -c vitest.evals.config.mts --silent=false evals/blind-check/make-sheet.test.ts
 *
 * Writes evals/blind-check/sheet.md (to grade) and picks.json (label → case,
 * run, score; no verdicts). Calls no model and reads no grades.
 */
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { describe, it } from "vitest";
import type { Row } from "../score";
import casesFile from "../cases.json";
import type { EvalCase } from "../types";
import { pick, renderSheet, SEED } from "./sheet";

describe.runIf(process.env.BLIND_SHEET === "1")("blind check: make the sheet", () => {
  it("writes sheet.md and picks.json", () => {
    const src = path.resolve(process.env.RESULTS ?? "");
    const { rows } = JSON.parse(readFileSync(src, "utf8")) as { rows: Row[] };
    // Only the replies are used; any grades in the file are dropped here.
    const replies = rows.map(({ id, rule, heldout, run, error, reply }) => ({ id, rule, heldout, run, error, reply }));
    const picks = pick(replies);
    writeFileSync(path.resolve(__dirname, "sheet.md"), renderSheet(picks, replies, casesFile.cases as EvalCase[]));
    writeFileSync(path.resolve(__dirname, "picks.json"), JSON.stringify({ source: path.basename(src), seed: SEED, picks }, null, 2) + "\n");
    console.log(`wrote sheet.md and picks.json (${picks.length} items)`);
  });
});
