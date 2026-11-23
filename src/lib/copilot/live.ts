/**
 * Ask the live model, and turn its answer into the panel's Reply shape.
 * Requirement changes go through the same code as the chips, so the
 * "what changed" card and Undo are never written by the model.
 */
import { hotelById } from "../hotels";
import { encodeRequirements, LABELS, type Requirement } from "../requirements";
import { addRequirement, changeBudget, removeRequirement, uid } from "./changes";
import type { ModelReply } from "./prompt";
import type { PanelAction, PanelItem, Reply, ReplyContext } from "./types";

export type LiveResult = { ok: true; reply: Reply } | { ok: false; reason: "scripted" | "error" | "aborted" };

const ADD: Record<"late-arrival" | "quiet" | "free-cancellation", Requirement> = {
  "late-arrival": { kind: "late-arrival", label: LABELS.lateArrival },
  quiet: { kind: "quiet", label: LABELS.quiet },
  "free-cancellation": { kind: "free-cancellation", label: LABELS.freeCancellation },
};

export async function liveReply(
  text: string,
  ctx: ReplyContext,
  history: { from: "traveler" | "copilot"; text: string }[],
  signal?: AbortSignal,
): Promise<LiveResult> {
  try {
    const res = await fetch("/api/copilot", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ text, context: { ...ctx, requirements: encodeRequirements(ctx.requirements) }, history }),
      signal,
    });
    if (res.status === 503) return { ok: false, reason: "scripted" };
    if (!res.ok) return { ok: false, reason: "error" };
    const data = (await res.json()) as { reply: ModelReply };
    return { ok: true, reply: toReply(data.reply, ctx.requirements) };
  } catch (e) {
    return { ok: false, reason: e instanceof DOMException && e.name === "AbortError" ? "aborted" : "error" };
  }
}

export function toReply(r: ModelReply, reqs: Requirement[]): Reply {
  let items: PanelItem[] = [];
  let requirements: Requirement[] | undefined;
  const c = r.requirement_change;
  if (c) {
    const change =
      c.op === "budget"
        ? changeBudget(reqs, typeof c.max_per_night === "number" && c.max_per_night > 0 ? Math.round(c.max_per_night) : null)
        : c.op === "add" && c.kind && ADD[c.kind]
          ? addRequirement(reqs, ADD[c.kind])
          : c.op === "remove" && c.kind && reqs.some((q) => q.kind === c.kind)
            ? removeRequirement(reqs, c.kind)
            : null;
    if (change) {
      // The change card and its counts come from code, never from the model.
      items = change.items;
      requirements = change.after;
    }
  }
  const actions: PanelAction[] = (r.hotel_links ?? []).flatMap((id) => {
    const h = hotelById(id);
    return h
      ? [
          {
            kind: "link" as const,
            label: `View ${h.name.split(" ").slice(0, 2).join(" ")}`,
            href: `/hotels/${h.id}`,
            style: "secondary" as const,
          },
        ]
      : [];
  });
  if (r.offer_person) actions.push({ kind: "person", label: "Talk to a person" });
  if (!r.answer && items.length) return { items, requirements, suggestions: r.suggestions ?? [] };
  items.push({
    type: "copilot",
    id: uid("m"),
    text: r.answer || "I don’t have an answer to that from what I have checked, and I won’t guess.",
    feedback: true,
    ...(r.facts?.length ? { facts: r.facts } : {}),
    ...(actions.length ? { actions } : {}),
  });
  return { items, requirements, suggestions: r.suggestions ?? [] };
}
