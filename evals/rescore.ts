/**
 * Re-scores saved results under the current cases and policy, without calling
 * any model: each row keeps its reply, checks and grades; checks the case no
 * longer has are dropped, and scores and the summary are recomputed.
 * Use it when a policy change touches only code checks or scoring, not the
 * grader's questions. Writes "<name>-rescored-<policy>.json" beside the input.
 *
 *   npx tsx evals/rescore.ts evals/results/<file>.json [more files]
 */
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { POLICY_VERSION, scoreRow, summarise, type Row } from "./score";

const here = path.dirname(fileURLToPath(import.meta.url));
const cases = JSON.parse(readFileSync(path.join(here, "cases.json"), "utf8")).cases as { id: string; code: string[] }[];
const codeFor = new Map(cases.map((c) => [c.id, c.code ?? []]));

const files = process.argv.slice(2);
if (!files.length) throw new Error("Give one or more results files");

for (const f of files) {
  const src = path.resolve(f);
  const file = JSON.parse(readFileSync(src, "utf8"));
  let changed = 0;
  const rows: Row[] = file.rows.map((r: Row) => {
    if (r.error || !r.grades) return r;
    const keep = codeFor.get(r.id);
    if (!keep) throw new Error(`Case ${r.id} is not in cases.json`);
    const checks = (r.checks ?? []).filter((k) => keep.includes(k.check));
    const scores = scoreRow(r.rule, checks, r.grades);
    if (JSON.stringify(scores) !== JSON.stringify(r.scores)) changed++;
    return { ...r, checks, scores };
  });
  const out = {
    ...file,
    policy_version: POLICY_VERSION,
    rescored_from: { file: path.basename(src), policy_version: file.policy_version },
    summary: summarise(rows),
    rows,
  };
  const dest = src.replace(/\.json$/, `-rescored-${POLICY_VERSION}.json`);
  writeFileSync(dest, JSON.stringify(out, null, 2) + "\n");
  console.log(`${path.basename(dest)}: ${changed} answer${changed === 1 ? "" : "s"} changed score`);
}
