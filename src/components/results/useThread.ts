"use client";

/**
 * The Copilot thread's actions, shared by every screen with the panel
 * (Results, Hotel detail, Compare). Replies come from the scripted stand-in
 * until a model is connected; requirement maths stays in code.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { addRequirement, changeBudget, removeRequirement, uid } from "@/lib/copilot/changes";
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
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
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
    (text: string) => respond(text, scriptedReply(text, { ...context, requirements })),
    [respond, context, requirements],
  );

  const stop = useCallback(() => {
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
