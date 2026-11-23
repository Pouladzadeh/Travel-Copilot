/**
 * Summarise each stay's sample reviews with the live model, once, and save the
 * result to src/lib/reviewSummaries.json (committed, so the app never calls the
 * model for this at runtime). Run: npx tsx --env-file=.env.local scripts/summarize-reviews.ts
 *
 * Each point cites the reviews it comes from by number; code checks the numbers
 * and counts them, so "3 of 8 reviews" is never written by the model.
 */
import Anthropic from "@anthropic-ai/sdk";
import { readFileSync, writeFileSync } from "node:fs";
import { HOTELS } from "../src/lib/hotels";
import { REVIEWS } from "../src/lib/reviews";

const MODEL = process.env.COPILOT_MODEL || "claude-sonnet-5-5";

const SYSTEM = `You summarise guest reviews for a hotel booking site. You read only the numbered reviews given.
Write:
- summary: one complete, grammatical sentence of at most 16 words that sums up all the reviews, including the main downside if there is one.
- liked: 2 or 3 things guests liked. Each label is 1 to 3 words in sentence case, like "Bay views" or "Easy late arrival".
- watch_for: 1 or 2 things guests complained about or warned about, same label style. Use an empty list only if no review raises a downside.
- For every label, review_ids lists every review that supports it, and no others.
Rules: do not rate how safe an area is, do not describe the guests, do not add anything the reviews do not say. No markdown, no emoji, no exclamation marks.`;

const ITEM = {
  type: "object",
  properties: { label: { type: "string" }, review_ids: { type: "array", items: { type: "integer" } } },
  required: ["label", "review_ids"],
  additionalProperties: false,
};
const SCHEMA = {
  type: "object",
  properties: { summary: { type: "string" }, liked: { type: "array", items: ITEM }, watch_for: { type: "array", items: ITEM } },
  required: ["summary", "liked", "watch_for"],
  additionalProperties: false,
};

type Item = { label: string; review_ids: number[] };
type Out = { summary: string; liked: Item[]; watch_for: Item[] };
export type Point = { label: string; reviews: number[] };

async function main() {
  const client = new Anthropic();
  // Optional hotel ids as arguments: regenerate only those and keep the rest.
  const only = process.argv.slice(2);
  const result: Record<string, { summary: string; liked: Point[]; watchFor: Point[] }> = only.length
    ? JSON.parse(readFileSync("src/lib/reviewSummaries.json", "utf8")).summaries
    : {};
  for (const h of HOTELS) {
    const reviews = REVIEWS[h.id];
    if (!reviews?.length || (only.length && !only.includes(h.id))) continue;
    const list = reviews.map((r, i) => `${i + 1}. ${r.text}`).join("\n");
    const msg = await client.messages.create({
      model: MODEL,
      max_tokens: 2000,
      system: SYSTEM,
      output_config: { format: { type: "json_schema", schema: SCHEMA } },
      messages: [{ role: "user", content: `Hotel: ${h.name}\nReviews:\n${list}` }],
    } as unknown as Anthropic.MessageCreateParamsNonStreaming);
    const block = msg.content.find((b) => b.type === "text");
    if (!block || block.type !== "text" || msg.stop_reason !== "end_turn")
      throw new Error(`${h.id}: no complete answer (${msg.stop_reason})`);
    const out = JSON.parse(block.text) as Out;
    const clean = (items: Item[], max: number) =>
      items
        .map((p) => ({
          label: p.label.trim(),
          reviews: [...new Set(p.review_ids)].filter((n) => n >= 1 && n <= reviews.length).sort((x, y) => x - y),
        }))
        .filter((p) => p.label && p.label.split(/\s+/).length <= 4 && p.reviews.length > 0)
        .slice(0, max);
    const liked = clean(out.liked, 3);
    const watchFor = clean(out.watch_for, 2);
    if (!out.summary?.trim() || liked.length < 1) throw new Error(`${h.id}: incomplete summary`);
    result[h.id] = { summary: out.summary.trim(), liked, watchFor };
    console.log(`${h.id}: ${liked.length} liked, ${watchFor.length} watch for`);
  }
  const file = {
    note: "Summaries written by the live model from the sample reviews in reviews.ts. Review numbers are 1-based.",
    model: MODEL,
    generatedAt: new Date().toISOString(),
    summaries: result,
  };
  writeFileSync("src/lib/reviewSummaries.json", JSON.stringify(file, null, 2) + "\n");
  console.log(`Saved ${Object.keys(result).length} summaries.`);
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
