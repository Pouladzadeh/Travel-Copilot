import type Anthropic from "@anthropic-ai/sdk";
import { describe, expect, it } from "vitest";
import type { ModelReply } from "@/lib/copilot/prompt";
import type { Grade } from "./grader";
import { regradeRows } from "./regrade-core";
import { compareGrades, scoreRow, summarise, type Row } from "./score";
import casesFile from "./cases.json";
import type { EvalCase } from "./types";

const g = (score: string, verdict: Grade["verdict"]): Grade => ({
  score,
  verdict,
  quote: "",
  reason: verdict,
  flagged: verdict === "unsure",
});
const row = (id: string, run: number, grades: Grade[]): Row => ({ id, rule: "polite", heldout: false, run, grades });

/** A stand-in for the Anthropic client: returns a fixed verdict and records the models it was asked for. */
function stubClient(verdict: string) {
  const models: string[] = [];
  const client = {
    messages: {
      create: async (p: { model: string }) => {
        models.push(p.model);
        return { stop_reason: "end_turn", content: [{ type: "text", text: JSON.stringify({ verdict, quote: "", reason: "stub" }) }] };
      },
    },
  } as unknown as Anthropic;
  return { client, models };
}

describe("scoring", () => {
  it("code checks count only toward the case's own rule; na counts as pass", () => {
    const s = scoreRow(
      "evidence",
      [{ check: "facts_sourced", pass: false, detail: "" }],
      [g("evidence", "pass"), g("not_toxic", "na"), g("polite", "pass")],
    );
    expect(s).toEqual({ evidence: false, not_toxic: true, polite: true });
  });

  it("unsure is a fail", () => {
    expect(scoreRow("polite", [], [g("not_toxic", "pass"), g("polite", "unsure")]).polite).toBe(false);
  });
});

describe("grader vs grader", () => {
  it("counts identical verdicts as agreement; na vs pass and unsure are disagreements", () => {
    const a = [row("x", 1, [g("polite", "pass"), g("not_toxic", "na")]), row("y", 1, [g("polite", "unsure")])];
    const b = [row("x", 1, [g("polite", "pass"), g("not_toxic", "pass")]), row("y", 1, [g("polite", "unsure")])];
    const r = compareGrades(a, b);
    expect(r).toMatchObject({ compared: 3, agreed: 1, missing: 0 });
    expect(r.diffs.map((d) => `${d.id}:${d.score}`)).toEqual(["x:not_toxic", "y:polite"]);
  });

  it("reports grades missing from the second file", () => {
    expect(compareGrades([row("x", 1, [g("polite", "pass")])], []).missing).toBe(1);
  });
});

describe("re-grade", () => {
  const cases = casesFile.cases as EvalCase[];
  const reply = {
    answer: "I can't book stays. A person can help.",
    facts: [],
    hotel_links: [],
    offer_person: true,
    suggestions: [],
  } as ModelReply;
  const saved: Row[] = [
    { id: "sm-01", rule: "stop_at_money", heldout: false, run: 1, reply },
    { id: "sm-01", rule: "stop_at_money", heldout: false, run: 2, error: "HTTP 502" },
  ];

  it("re-grades saved replies with the chosen model, without calling Copilot", async () => {
    const { client, models } = stubClient("pass");
    const rows = await regradeRows(saved, cases, client, "claude-opus-5-5");
    expect(new Set(models)).toEqual(new Set(["claude-opus-5-5"]));
    expect(models).toHaveLength(3); // stop_at_money, not_toxic, polite
    expect(rows[0].scores).toEqual({ stop_at_money: true, not_toxic: true, polite: true });
    expect(rows[1].error).toBe("HTTP 502");
    expect(summarise(rows)).toMatchObject({ errors: 1, runs: 1 });
  });

  it("resumes: rows already re-graded are kept and not graded again", async () => {
    const { client, models } = stubClient("pass");
    const first = await regradeRows(saved.slice(0, 1), cases, client, "m");
    models.length = 0;
    const rows = await regradeRows(saved, cases, client, "m", () => {}, first);
    expect(models).toHaveLength(0);
    expect(rows[0]).toBe(first[0]);
  });

  it("saves progress after every graded reply", async () => {
    const { client } = stubClient("pass");
    const seen: number[] = [];
    await regradeRows(saved, cases, client, "m", (sofar) => seen.push(sofar.length));
    expect(seen).toEqual([1]);
  });

  it("keeps the code checks: a failing check still fails the score", async () => {
    const { client } = stubClient("pass");
    const rows = await regradeRows([{ ...saved[0], reply: { ...reply, offer_person: false } }], cases, client, "m");
    expect(rows[0].scores?.stop_at_money).toBe(false);
  });
});

describe("facts given to the grader", () => {
  it("v1 replies are graded against v1 facts (no source on ratings); current facts have one", async () => {
    const { grounding } = await import("@/lib/copilot/grounding");
    const ctx = { requirements: [], screen: "results" as const };
    const v1 = JSON.stringify(grounding(ctx, "v1"));
    const now = JSON.stringify(grounding(ctx));
    expect(v1).not.toContain("reviews (source: hotel listing)");
    expect(now).toContain("reviews (source: hotel listing)");
  });
});
