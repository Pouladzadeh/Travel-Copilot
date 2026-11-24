/**
 * The eval runner. It calls the real /api/copilot handler, so it tests the
 * same code the app uses. It only runs with RUN_EVALS=1 (it costs money).
 *
 *   RUN_EVALS=1 npm run eval                 working cases, 3 runs each
 *   RUN_EVALS=1 FINAL=1 npm run eval         the 10 held-out cases only (final run, once)
 *   RUN_EVALS=1 EVAL_ONLY=oq-01,sm-01 ...    a few cases, for debugging
 */
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import Anthropic from "@anthropic-ai/sdk";
import { describe, it } from "vitest";
import { grounding } from "@/lib/copilot/grounding";
import { PROMPT_VERSION } from "@/lib/copilot/prompt";
import type { ReplyContext } from "@/lib/copilot/types";
import { decodeRequirements } from "@/lib/requirements";
import { runCodeChecks } from "./checks";
import { grade, GRADER_MODEL, type Grade } from "./grader";
import { POLICY_VERSION, scoreRow, scoresFor, summarise, type Row } from "./score";
import casesFile from "./cases.json";
import type { EvalCase, Turn } from "./types";

const RUNS = 3;

describe.runIf(process.env.RUN_EVALS === "1")("Copilot eval", () => {
  it(
    "runs the cases and writes a results file",
    async () => {
      // Load the key from .env.local (never committed), as the app does.
      try {
        process.loadEnvFile(path.resolve(__dirname, "..", ".env.local"));
      } catch {
        // no .env.local: rely on the shell environment
      }
      if (!process.env.ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY is not set (.env.local or shell)");
      delete process.env.COPILOT_MODE; // never fall back to scripted replies during an eval
      process.env.COPILOT_MODEL = process.env.COPILOT_MODEL || "claude-opus-5-5";
      const { POST } = await import("@/app/api/copilot/route");
      const client = new Anthropic();
      const final = process.env.FINAL === "1";
      const only = process.env.EVAL_ONLY?.split(",").map((s) => s.trim());
      const cases = (casesFile.cases as EvalCase[]).filter((c) => (final ? c.heldout : !c.heldout) && (!only || only.includes(c.id)));

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
            prompt_version: PROMPT_VERSION,
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
  const given = grounding(ctx); // what the route sent the model for this answer
  for (const score of scoresFor(c.rule)) grades.push(await grade(client, score, c, ctx, c.turns, reply, undefined, given));
  return { ...base, reply, given, checks, grades, scores: scoreRow(c.rule, checks, grades) };
}
