import { describe, expect, it } from "vitest";
import type { Row } from "../score";
import { checkSheet, compareWithGrader, readSheet } from "./agreement";
import { EXCLUDED, pick, renderSheet } from "./sheet";
import casesFile from "../cases.json";
import type { EvalCase } from "../types";

const cases = casesFile.cases as EvalCase[];
const reply = { answer: "Fine.", facts: [], hotel_links: [], offer_person: false, suggestions: [] };
// Three runs of every working case, as in a real results file.
const rows: Row[] = cases
  .filter((c) => !c.heldout)
  .flatMap((c) => [1, 2, 3].map((run) => ({ id: c.id, rule: c.rule, heldout: false, run, reply }) as Row));

describe("blind check", () => {
  const picks = pick(rows);

  it("picks 15 runs, none excluded, one per case, every score covered", () => {
    expect(picks).toHaveLength(15);
    for (const p of picks) expect(EXCLUDED.includes(p.id) || EXCLUDED.includes(`${p.id}#${p.run}`)).toBe(false);
    expect(new Set(picks.map((p) => p.id)).size).toBe(15);
    expect(new Set(picks.map((p) => p.score)).size).toBe(9);
  });

  it("is the same on every run (fixed seed)", () => {
    expect(pick(rows)).toEqual(picks);
  });

  it("the sheet shows no case ids", () => {
    const sheet = renderSheet(picks, rows, cases);
    for (const c of cases) expect(sheet).not.toContain(c.id);
  });

  it("reads verdicts and compares with a grader", () => {
    const sheet = renderSheet(picks, rows, cases).replace(/Verdict \(pass \/ fail \/ na\):/g, "Verdict (pass / fail / na): pass");
    const human = readSheet(sheet);
    expect(checkSheet(picks, human)).toBeUndefined();
    const graded = rows.map((r) => ({
      ...r,
      grades: [{ score: r.rule, verdict: r.id === picks[0].id ? "fail" : "pass", quote: "", reason: "", flagged: false }],
    })) as Row[];
    const res = compareWithGrader(picks, human, graded);
    expect(res).toMatchObject({ agreed: 14, total: 15 });
    expect(res.diffs[0].pick.label).toBe(picks[0].label);
  });

  it("refuses a blank sheet", () => {
    expect(checkSheet(picks, readSheet(renderSheet(picks, rows, cases)))).toMatch(/Still blank/);
  });
});
