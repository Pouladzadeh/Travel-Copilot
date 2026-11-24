/**
 * Compares a filled-in human grading sheet with the AI grader's verdicts.
 *
 *   npm run eval:agreement                       uses sheet-run2.md and key-run2.json
 *   npm run eval:agreement -- <sheet.md> [key.json]
 *
 * "na" is its own verdict: na vs pass is a disagreement. A grader "unsure"
 * never matches a human verdict.
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const sheetPath = path.resolve(process.argv[2] ?? path.join(here, "sheet-run2.md"));
const keyPath = path.resolve(process.argv[3] ?? path.join(here, "key-run2.json"));

type KeyItem = { case: string; run: number; score: string; verdict: string; quote: string; reason: string };
const VALID = ["pass", "fail", "na"];

/** Value after the colon on a "Label:" line, ignoring markdown bold/underscores. */
function field(section: string, label: RegExp): string | undefined {
  const lines = section.split("\n").filter((l) => label.test(l.replace(/[*_]/g, "")));
  const last = lines[lines.length - 1];
  if (last === undefined) return undefined;
  const clean = last.replace(/[*_]/g, "");
  return clean.slice(clean.indexOf(":") + 1).trim();
}

function main() {
  const sheet = readFileSync(sheetPath, "utf8");
  const key = (JSON.parse(readFileSync(keyPath, "utf8")) as { items: Record<string, KeyItem> }).items;

  const human: Record<string, { verdict: string; reason: string }> = {};
  const parts = sheet.split(/^## (A\d{2})\s*$/m);
  for (let i = 1; i < parts.length; i += 2) {
    const label = parts[i];
    const body = parts[i + 1];
    human[label] = {
      verdict: (field(body, /^\s*Verdict \(pass \/ fail \/ na\):/) ?? "").toLowerCase(),
      reason: field(body, /^\s*Reason \(one line\):/) ?? "",
    };
  }

  const labels = Object.keys(key).sort();
  const missing = labels.filter((l) => !(l in human));
  if (missing.length) stop(`These items are in the key but not in the sheet: ${missing.join(", ")}`);
  const blank = labels.filter((l) => !human[l].verdict);
  if (blank.length) stop(`Fill in a verdict for every item first. Still blank: ${blank.join(", ")}`);
  const bad = labels.filter((l) => !VALID.includes(human[l].verdict));
  if (bad.length) stop(`Verdicts must be pass, fail or na. Check: ${bad.map((l) => `${l} ("${human[l].verdict}")`).join(", ")}`);

  const rows = labels.map((l) => ({ label: l, ...key[l], human: human[l], agree: human[l].verdict === key[l].verdict }));
  const pct = (a: number, n: number) => (n ? `${Math.round((100 * a) / n)}%` : "n/a");

  const agreed = rows.filter((r) => r.agree).length;
  console.log(`Sheet: ${path.relative(process.cwd(), sheetPath)}`);
  console.log(`\nOverall agreement: ${agreed} of ${rows.length} (${pct(agreed, rows.length)})\n`);

  console.log("Per score:");
  const scores = [...new Set(rows.map((r) => r.score))];
  for (const s of scores) {
    const rs = rows.filter((r) => r.score === s);
    const a = rs.filter((r) => r.agree).length;
    console.log(`  ${s.padEnd(18)} ${a} of ${rs.length} (${pct(a, rs.length)})`);
  }

  const dis = rows.filter((r) => !r.agree);
  console.log(`\nDisagreements: ${dis.length}`);
  for (const r of dis) {
    console.log(`\n${r.label}  ${r.case}#${r.run}  ${r.score}`);
    console.log(`  You:    ${r.human.verdict} | ${r.human.reason || "(no reason given)"}`);
    console.log(`  Grader: ${r.verdict} | ${r.reason}`);
  }
}

function stop(msg: string): never {
  console.error(msg);
  process.exit(1);
}

main();
