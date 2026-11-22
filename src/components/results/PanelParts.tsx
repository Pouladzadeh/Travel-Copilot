"use client";

import Link from "next/link";
import { useState } from "react";
import type { PanelAction, PanelItem } from "@/lib/copilot/types";
import { Button, ButtonLink } from "../Button";
import { CopilotMessage } from "../CopilotMessage";
import { Icon } from "../Icon";
import { RequirementChip } from "../RequirementChip";

/** Small pieces of the Copilot panel, each matching a designed moment. */

/** "Budget changed / Requirement removed … Undo" (Change of mind, Remove a requirement). */
export function ChangeNotice({ item, onUndo }: { item: Extract<PanelItem, { type: "change" }>; onUndo: () => void }) {
  return (
    <div className="bg-brand-subtle flex items-start gap-12 rounded-md px-12 py-[10px]">
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <p className="text-label-s text-fg-secondary">{item.undone ? `${item.title} · undone` : item.title}</p>
        <p className="text-body-m text-fg flex flex-wrap items-center gap-4">
          {item.from && <span className="text-fg-secondary line-through">{item.from}</span>}
          {item.from && item.to && <span aria-hidden="true">→</span>}
          {item.to && <span className="font-medium">{item.to}</span>}
        </p>
      </div>
      {!item.undone && (
        <button type="button" onClick={onUndo} className="text-label-s text-fg-link hover:underline">
          Undo
        </button>
      )}
    </div>
  );
}

/** "Copilot is checking 3 stays" with step progress and Stop. */
export function Checking({ item, onStop }: { item: Extract<PanelItem, { type: "checking" }>; onStop: () => void }) {
  return (
    <div className="border-line-copilot bg-copilot flex flex-col gap-8 rounded-lg border p-16" aria-live="polite">
      <div className="flex items-center gap-4">
        <Icon name="msg-sparkle" size={16} />
        <p className="text-label-s text-fg-copilot flex-1">Copilot is checking</p>
        <button type="button" onClick={onStop} className="text-label-s text-fg-link hover:underline">
          Stop
        </button>
      </div>
      <ul className="flex flex-col gap-4">
        {item.steps.map((s, i) => (
          <li key={s} className={`text-body-m flex items-center gap-8 ${i <= item.done ? "text-fg" : "text-fg-tertiary"}`}>
            <span
              aria-hidden="true"
              className={`rounded-pill size-[10px] border-2 ${
                i < item.done ? "border-icon-copilot bg-icon-copilot" : i === item.done ? "border-icon-copilot" : "border-line-strong"
              }`}
            />
            {s}
          </li>
        ))}
      </ul>
    </div>
  );
}

/** "This answer stopped before it was finished" (Reply stopped partway). */
export function Stopped({
  item,
  onRetry,
  onPerson,
}: {
  item: Extract<PanelItem, { type: "stopped" }>;
  onRetry: () => void;
  onPerson: () => void;
}) {
  return (
    <div className="flex flex-col gap-12">
      <div className="border-line-copilot bg-copilot flex flex-col gap-8 rounded-lg border p-16 opacity-60">
        <p className="text-label-s text-fg-copilot flex items-center gap-4">
          <Icon name="msg-sparkle" size={16} />
          Copilot
        </p>
        <p className="text-body-m text-fg">{item.partial}</p>
      </div>
      <div className="bg-unconfirmed flex flex-col gap-8 rounded-md p-16">
        <p className="text-label-m text-fg">This answer stopped before it was finished</p>
        <p className="text-body-m text-fg-secondary">What you see above is incomplete, so please don’t rely on it.</p>
        <div className="flex items-center gap-8">
          <Button variant="secondary" onClick={onRetry}>
            Try again
          </Button>
          <Button variant="ghost" onClick={onPerson}>
            Talk to a person
          </Button>
        </div>
      </div>
    </div>
  );
}

const WRONG = ["Not accurate", "Didn’t answer my question", "Too long", "Something else"];

/** "What was wrong with this answer?" (Thumbs down). */
export function ThumbsDownCard({ messageId }: { messageId: string }) {
  const [picked, setPicked] = useState<string[]>([]);
  return (
    <div className="border-line bg-surface flex flex-col gap-12 rounded-lg border p-16">
      <p className="text-label-m text-fg">What was wrong with this answer?</p>
      <div className="flex flex-wrap gap-8">
        {WRONG.map((w) =>
          picked.includes(w) ? (
            <RequirementChip key={w} label={w} onClick={() => setPicked(picked.filter((p) => p !== w))} />
          ) : (
            <RequirementChip key={w} state="suggested" label={w} onClick={() => setPicked([...picked, w])} />
          ),
        )}
      </div>
      <div className="flex items-start gap-12">
        <p className="text-body-s text-fg-secondary flex-1">Optional. To have a person review it, report the answer.</p>
        <Link
          href={`/report?answer=${encodeURIComponent(messageId)}`}
          className="text-label-s text-fg-link whitespace-nowrap hover:underline"
        >
          Report this answer
        </Link>
      </div>
    </div>
  );
}

export function Actions({ actions, onPerson, onAsk }: { actions: PanelAction[]; onPerson: () => void; onAsk: (t: string) => void }) {
  return (
    <div className="flex flex-wrap items-center gap-8">
      {actions.map((a) =>
        a.kind === "link" ? (
          <ButtonLink key={a.label} href={a.href} variant={a.style}>
            {a.label}
          </ButtonLink>
        ) : a.kind === "person" ? (
          <Button key={a.label} variant="ghost" onClick={onPerson}>
            {a.label}
          </Button>
        ) : (
          <Button key={a.label} variant={a.style} onClick={() => onAsk(a.text)}>
            {a.label}
          </Button>
        ),
      )}
    </div>
  );
}

export function ConversationItem({
  item,
  onUndo,
  onRate,
  onPerson,
  onAsk,
  onStop,
  onRetry,
}: {
  item: PanelItem;
  onUndo: (id: string) => void;
  onRate: (id: string, r: "up" | "down") => void;
  onPerson: () => void;
  onAsk: (t: string) => void;
  onStop: () => void;
  onRetry: () => void;
}) {
  switch (item.type) {
    case "traveler":
      return <CopilotMessage role="traveler">{item.text}</CopilotMessage>;
    case "change":
      return <ChangeNotice item={item} onUndo={() => onUndo(item.id)} />;
    case "checking":
      return <Checking item={item} onStop={onStop} />;
    case "stopped":
      return <Stopped item={item} onRetry={onRetry} onPerson={onPerson} />;
    case "copilot":
      return (
        <div className="flex flex-col gap-12">
          <CopilotMessage
            role="copilot"
            showFeedback={item.feedback}
            feedback={item.rating ?? null}
            onFeedback={(r) => onRate(item.id, r)}
            onReport={() => (window.location.href = `/report?answer=${encodeURIComponent(item.id)}`)}
          >
            <p>{item.text}</p>
            {item.facts && item.facts.length > 0 && (
              <ul className="bg-surface mt-12 flex flex-col gap-12 rounded-md p-12">
                {item.facts.map((f) => (
                  <li key={f.text} className="flex flex-col gap-2">
                    <span className="text-body-m text-fg">{f.text}</span>
                    <span className="text-body-s text-fg-secondary">Source: {f.source}</span>
                  </li>
                ))}
              </ul>
            )}
          </CopilotMessage>
          {item.actions && <Actions actions={item.actions} onPerson={onPerson} onAsk={onAsk} />}
          {item.rating === "down" && <ThumbsDownCard messageId={item.id} />}
        </div>
      );
  }
}
