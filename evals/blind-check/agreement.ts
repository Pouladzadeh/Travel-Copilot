/** Blind check, part 2: reads the filled-in sheet and compares it with graded results files. */
import type { Verdict } from "../grader";
import type { Row } from "../score";
import type { Pick } from "./sheet";

export type HumanVerdict = { verdict: string; reason: string };

function field(section: string, label: RegExp): string | undefined {
  const lines = section.split("\n").filter((l) => label.test(l.replace(/[*_]/g, "")));
  const last = lines[lines.length - 1];
  if (last === undefined) return undefined;
  const clean = last.replace(/[*_]/g, "");
  return clean.slice(clean.indexOf(":") + 1).trim();
}

export function readSheet(sheet: string): Record<string, HumanVerdict> {
  const out: Record<string, HumanVerdict> = {};
  const parts = sheet.split(/^## (B\d{2})\s*$/m);
  for (let i = 1; i < parts.length; i += 2) {
    out[parts[i]] = {
      verdict: (field(parts[i + 1], /^\s*Verdict \(pass \/ fail \/ na\):/) ?? "").toLowerCase(),
      reason: field(parts[i + 1], /^\s*Reason \(one line\):/) ?? "",
    };
  }
  return out;
}

/** Returns an error message if the sheet is not ready to compare. */
export function checkSheet(picks: Pick[], human: Record<string, HumanVerdict>): string | undefined {
  const missing = picks.filter((p) => !(p.label in human)).map((p) => p.label);
  if (missing.length) return `Items missing from the sheet: ${missing.join(", ")}`;
  const blank = picks.filter((p) => !human[p.label].verdict).map((p) => p.label);
  if (blank.length) return `Fill in a verdict for every item first. Still blank: ${blank.join(", ")}`;
  const bad = picks.filter((p) => !["pass", "fail", "na"].includes(human[p.label].verdict));
  if (bad.length)
    return `Verdicts must be pass, fail or na. Check: ${bad.map((p) => `${p.label} ("${human[p.label].verdict}")`).join(", ")}`;
}

export type Comparison = {
  agreed: number;
  total: number;
  diffs: { pick: Pick; you: HumanVerdict; grader: { verdict: Verdict | "missing"; reason: string } }[];
};

export function compareWithGrader(picks: Pick[], human: Record<string, HumanVerdict>, rows: Row[]): Comparison {
  const diffs: Comparison["diffs"] = [];
  for (const p of picks) {
    const g = rows.find((r) => r.id === p.id && r.run === p.run)?.grades?.find((x) => x.score === p.score);
    const you = human[p.label];
    if (!g || g.verdict !== you.verdict)
      diffs.push({ pick: p, you, grader: g ? { verdict: g.verdict, reason: g.reason } : { verdict: "missing", reason: "" } });
  }
  return { agreed: picks.length - diffs.length, total: picks.length, diffs };
}
