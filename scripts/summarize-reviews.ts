/**
 * Summarise each stay's sample reviews with the live model, once, and save the
 * result to src/lib/reviewSummaries.json (committed, so the app never calls the
 * model for this at runtime). Run: npx tsx --env-file=.env.local scripts/summarize-reviews.ts
 *
 * Each point cites the reviews it comes from by number; code checks the numbers
 * and counts them, so "3 of 8 reviews" is never written by the model.
 */
import Anthropic from "@anthropic-ai/sdk";
import { writeFileSync } from "node:fs";
import { HOTELS } from "../src/lib/hotels";
import { REVIEWS } from "../src/lib/reviews";

const MODEL = process.env.COPILOT_MODEL || "claude-sonnet-5-5";

const SYSTEM = `You summarise guest reviews for a hotel page on a booking site. You read only the numbered reviews given.
Rules:
- 2 to 4 short points, each one plain sentence of at most 18 words, in neutral, calm English.
- Every point must be supported by the reviews you cite in review_ids. Cite every review that supports it, and no others.
- Include the main downside if reviewers mention one. If reviewers disagree, say so.
- Do not rate how safe an area is. Do not describe the guests. Do not add anything the reviews do not say.
- No markdown, no emoji, no exclamation marks.`;

const SCHEMA = {
  type: "object",
  properties: {
    points: {
      type: "array",
      items: {
        type: "object",
        properties: { text: { type: "string" }, review_ids: { type: "array", items: { type: "integer" } } },
        required: ["text", "review_ids"],
        additionalProperties: false,
      },
    },
  },
  required: ["points"],
  additionalProperties: false,
};

type Out = { points: { text: string; review_ids: number[] }[] };

async function main() {
  const client = new Anthropic();
  const result: Record<string, { points: { text: string; reviews: number[] }[] }> = {};
  for (const h of HOTELS) {
    const reviews = REVIEWS[h.id];
    if (!reviews?.length) continue;
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
    const points = out.points
      .map((p) => ({
        text: p.text.trim(),
        reviews: [...new Set(p.review_ids)].filter((n) => n >= 1 && n <= reviews.length).sort((a, b) => a - b),
      }))
      .filter((p) => p.text && p.reviews.length > 0)
      .slice(0, 4);
    if (points.length < 2) throw new Error(`${h.id}: fewer than 2 supported points`);
    result[h.id] = { points };
    console.log(`${h.id}: ${points.length} points`);
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
