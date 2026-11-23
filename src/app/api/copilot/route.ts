/**
 * POST /api/copilot — the live model behind the Copilot panel.
 * Reads ANTHROPIC_API_KEY from the server environment; the key never reaches
 * the browser. Without a key it answers 503 and the panel uses the scripted
 * replies instead.
 */
import Anthropic from "@anthropic-ai/sdk";
import { grounding } from "@/lib/copilot/grounding";
import { REPLY_SCHEMA, SYSTEM_PROMPT, type ModelReply } from "@/lib/copilot/prompt";
import type { ReplyContext } from "@/lib/copilot/types";
import { hotelById } from "@/lib/hotels";
import { decodeRequirements } from "@/lib/requirements";

export const runtime = "nodejs";

const MODEL = process.env.COPILOT_MODEL || "claude-sonnet-5-5";

type Body = {
  text: string;
  context: Omit<ReplyContext, "requirements"> & { requirements: string };
  history?: { from: "traveler" | "copilot"; text: string }[];
};

export async function POST(req: Request) {
  if (!process.env.ANTHROPIC_API_KEY || process.env.COPILOT_MODE === "scripted") {
    return Response.json({ mode: "scripted" }, { status: 503 });
  }
  let body: Body;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "bad request" }, { status: 400 });
  }
  const text = String(body.text ?? "").slice(0, 2000);
  if (!text.trim()) return Response.json({ error: "empty" }, { status: 400 });
  const ctx: ReplyContext = { ...body.context, requirements: decodeRequirements(body.context?.requirements) };
  const history = (body.history ?? []).slice(-8).map((m) => `${m.from}: ${String(m.text).slice(0, 1000)}`);

  const client = new Anthropic();
  try {
    // Forced tool use is not supported on the newest models; structured outputs give schema-valid JSON instead.
    const params = {
      model: MODEL,
      // Thinking tokens count toward this cap, so leave room for both.
      max_tokens: 2000,
      system: SYSTEM_PROMPT,
      output_config: { format: { type: "json_schema", schema: REPLY_SCHEMA.schema } },
      messages: [
        {
          role: "user",
          content: `<facts>\n${JSON.stringify(grounding(ctx), null, 1)}\n</facts>\n\n<conversation>\n${history.join("\n") || "(none)"}\n</conversation>\n\nTraveler's message: ${text}`,
        },
      ],
    };
    const msg = await client.messages.create(params as unknown as Anthropic.MessageCreateParamsNonStreaming);
    const block = msg.content.find((b) => b.type === "text");
    if (!block || block.type !== "text") throw new Error(`no text in reply (stop: ${msg.stop_reason})`);
    if (msg.stop_reason !== "end_turn")
      throw new Error(
        `reply cut off (stop: ${msg.stop_reason}, usage: ${JSON.stringify(msg.usage)}, blocks: ${msg.content.map((b) => b.type).join(",")})`,
      );
    return Response.json({ mode: "live", model: MODEL, reply: clean(JSON.parse(block.text) as ModelReply) });
  } catch (e) {
    console.error("[copilot] model call failed:", e instanceof Error ? e.message : e);
    return Response.json({ error: "model unavailable" }, { status: 502 });
  }
}

/** Keep only what the panel can show safely. */
function clean(r: ModelReply): ModelReply {
  return {
    answer: String(r.answer ?? "").trim(),
    facts: (r.facts ?? []).slice(0, 4).filter((f) => f?.text && f?.source),
    requirement_change: r.requirement_change,
    hotel_links: (r.hotel_links ?? []).filter((id) => !!hotelById(id)).slice(0, 2),
    offer_person: !!r.offer_person,
    suggestions: (r.suggestions ?? []).filter((s) => typeof s === "string" && s.length <= 60).slice(0, 3),
  };
}
