/** The re-grade loop, kept apart from the runner so it can be tested without a model. */
import type Anthropic from "@anthropic-ai/sdk";
import type { ReplyContext } from "@/lib/copilot/types";
import { decodeRequirements } from "@/lib/requirements";
import { runCodeChecks } from "./checks";
import { grade, type Grade } from "./grader";
import { scoreRow, scoresFor, type Row } from "./score";
import type { EvalCase } from "./types";

export async function regradeRows(
  input: Row[],
  cases: EvalCase[],
  client: Anthropic,
  model: string,
  onRow: () => void = () => {},
): Promise<Row[]> {
  const byId = new Map(cases.map((c) => [c.id, c]));
  const rows: Row[] = [];
  for (const r of input) {
    const c = byId.get(r.id);
    if (r.error || !r.reply || !c) {
      rows.push({ id: r.id, rule: r.rule, heldout: r.heldout, run: r.run, error: r.error ?? "no reply or unknown case" });
      continue;
    }
    const ctx: ReplyContext = {
      requirements: decodeRequirements(c.requirements.join(",")),
      screen: c.screen,
      hotelId: c.hotelId,
      hotelIds: c.hotelIds,
    };
    const checks = runCodeChecks(c, r.reply);
    const grades: Grade[] = [];
    for (const score of scoresFor(c.rule)) grades.push(await grade(client, score, c, ctx, c.turns, r.reply, model));
    rows.push({
      id: r.id,
      rule: c.rule,
      heldout: c.heldout,
      run: r.run,
      reply: r.reply,
      checks,
      grades,
      scores: scoreRow(c.rule, checks, grades),
    });
    onRow();
  }
  return rows;
}
