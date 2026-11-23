"use client";

/**
 * The Copilot thread's actions, shared by every screen with the panel
 * (Results, Hotel detail, Compare). Replies come from the live model when the
 * server has a key, otherwise from the scripted stand-in; requirement maths
 * stays in code either way.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { addRequirement, changeBudget, removeRequirement, uid } from "@/lib/copilot/changes";
import { liveReply } from "@/lib/copilot/live";
import { scriptedReply } from "@/lib/copilot/scripted";
import type { Conversation } from "@/lib/copilot/store";
import type { PanelItem, Reply, ReplyContext } from "@/lib/copilot/types";
import { buildResults } from "@/lib/ranking";
import type { Requirement } from "@/lib/requirements";

export function useThread({
  conversation,
  update,
  context,
}: {
  conversation: Conversation | null;
  update: (fn: (c: Conversation) => Conversation) => void;
  context: Omit<ReplyContext, "requirements">;
}) {
  const [busy, setBusy] = useState(false);
  const [unread, setUnread] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const inflight = useRef<AbortController | null>(null);
  /** Once the server says it has no key, stay scripted for this page. */
  const scripted = useRef(false);
  useEffect(
    () => () => {
      timers.current.forEach(clearTimeout);
      inflight.current?.abort();
    },
    [],
  );
  const requirements = useMemo(() => conversation?.requirements ?? [], [conversation?.requirements]);

  const append = useCallback(
    (items: PanelItem[], after?: Requirement[], suggestions?: string[]) => {
      update((c) => {
        const before = buildResults(c.requirements).fitting.map((h) => h.id);
        const reqs = after ?? c.requirements;
        const now = buildResults(reqs).fitting.map((h) => h.id);
        return {
          ...c,
          requirements: reqs,
          items: [...c.items.filter((i) => i.type !== "checking"), ...items],
          suggestions: suggestions ?? (after ? [] : c.suggestions),
          newIds: after ? now.filter((id) => !before.includes(id)) : c.newIds,
        };
      });
      if (conversation?.hidden) setUnread(true);
    },
    [update, conversation?.hidden],
  );

  const applyReply = useCallback((reply: Reply) => append(reply.items, reply.requirements, reply.suggestions ?? []), [append]);

  /** Post the traveler's message, then the given reply after a short "thinking" pause. */
  const respond = useCallback(
    (text: string, reply: Reply) => {
      if (busy) return;
      update((c) => ({ ...c, items: [...c.items, { type: "traveler", id: uid("t"), text }], suggestions: [] }));
      setBusy(true);
      const finish = (delay: number) =>
        timers.current.push(
          setTimeout(() => {
            applyReply(reply);
            setBusy(false);
          }, delay),
        );
      if (reply.checking) {
        const id = uid("k");
        update((c) => ({ ...c, items: [...c.items, { type: "checking", id, steps: reply.checking!, done: 0 }] }));
        reply.checking.forEach((_, i) =>
          timers.current.push(
            setTimeout(
              () =>
                update((c) => ({
                  ...c,
                  items: c.items.map((it) => (it.id === id && it.type === "checking" ? { ...it, done: i + 1 } : it)),
                })),
              700 * (i + 1),
            ),
          ),
        );
        finish(700 * (reply.checking.length + 1));
      } else {
        finish(600);
      }
    },
    [busy, update, applyReply],
  );

  const ask = useCallback(
    async (text: string) => {
      if (busy) return;
      const ctx = { ...context, requirements };
      if (scripted.current) return respond(text, scriptedReply(text, ctx));
      const history = (conversation?.items ?? []).flatMap((i): { from: "traveler" | "copilot"; text: string }[] =>
        i.type === "traveler"
          ? [{ from: "traveler" as const, text: i.text }]
          : i.type === "copilot"
            ? [{ from: "copilot" as const, text: i.text }]
            : [],
      );
      update((c) => ({ ...c, items: [...c.items, { type: "traveler", id: uid("t"), text }], suggestions: [] }));
      setBusy(true);
      const id = uid("k");
      const steps = [
        "Read your question",
        `Checking against your ${requirements.length} ${requirements.length === 1 ? "requirement" : "requirements"}`,
        "Writing the answer",
      ];
      update((c) => ({ ...c, items: [...c.items, { type: "checking", id, steps, done: 1 }] }));
      timers.current.push(
        setTimeout(
          () => update((c) => ({ ...c, items: c.items.map((it) => (it.id === id && it.type === "checking" ? { ...it, done: 2 } : it)) })),
          1200,
        ),
      );
      const ctrl = new AbortController();
      inflight.current = ctrl;
      const result = await liveReply(text, ctx, history, ctrl.signal);
      inflight.current = null;
      if (!result.ok && result.reason === "aborted") return;
      if (!result.ok && result.reason === "scripted") scripted.current = true;
      if (!result.ok) console.info(`[copilot] using scripted reply (${result.reason})`);
      applyReply(result.ok ? result.reply : scriptedReply(text, ctx));
      setBusy(false);
    },
    [busy, context, requirements, conversation?.items, update, respond, applyReply],
  );

  const stop = useCallback(() => {
    inflight.current?.abort();
    inflight.current = null;
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setBusy(false);
    append([
      { type: "copilot", id: uid("m"), text: "Stopped. Nothing on the page changed. Ask again whenever you like.", feedback: false },
    ]);
  }, [append]);

  const undo = useCallback(
    (id: string) => {
      const item = conversation?.items.find((i) => i.id === id);
      if (!item || item.type !== "change") return;
      const count = buildResults(item.undo).fitting.length;
      update((c) => ({ ...c, items: c.items.map((i) => (i.id === id && i.type === "change" ? { ...i, undone: true } : i)) }));
      append(
        [
          {
            type: "copilot",
            id: uid("m"),
            text: `Undone. Your request is back as it was, and ${count} ${count === 1 ? "stay fits" : "stays fit"}.`,
            feedback: false,
          },
        ],
        item.undo,
      );
    },
    [conversation?.items, update, append],
  );

  const rate = useCallback(
    (id: string, rating: "up" | "down") =>
      update((c) => ({
        ...c,
        items: c.items.map((i) => (i.id === id && i.type === "copilot" ? { ...i, rating: i.rating === rating ? undefined : rating } : i)),
      })),
    [update],
  );

  return {
    busy,
    unread,
    setUnread,
    append,
    ask,
    respond,
    stop,
    undo,
    rate,
    remove: (kind: Requirement["kind"]) => {
      const r = removeRequirement(requirements, kind);
      append(r.items, r.after);
    },
    add: (req: Requirement) => {
      const r = addRequirement(requirements, req);
      append(r.items, r.after);
    },
    budget: (max: number | null) => {
      const r = changeBudget(requirements, max);
      append(r.items, r.after);
    },
    hide: () => update((c) => ({ ...c, hidden: true })),
    show: () => {
      setUnread(false);
      update((c) => ({ ...c, hidden: false }));
    },
  };
}
