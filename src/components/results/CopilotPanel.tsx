"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import type { PanelItem } from "@/lib/copilot/types";
import type { Requirement } from "@/lib/requirements";
import { Button } from "../Button";
import { CopilotComposer } from "../CopilotComposer";
import { CopilotMessage } from "../CopilotMessage";
import { Icon } from "../Icon";
import { RequirementChip } from "../RequirementChip";
import { BudgetEditor } from "./BudgetEditor";
import { ConversationItem } from "./PanelParts";

/**
 * Travel Copilot side panel (Figma Results 12:284 and the Conversation
 * moments on 05 States). Copilot never speaks first: the panel only answers
 * what the traveler typed or tapped.
 */

export type PanelProps = {
  requirements: Requirement[];
  items: PanelItem[];
  suggestions: string[];
  busy: boolean;
  unavailable: boolean;
  /** Replaces the conversation, e.g. the evidence view or the handover. */
  overlay?: ReactNode;
  onRemove: (kind: Requirement["kind"]) => void;
  onAddSuggested: (r: Requirement) => void;
  onBudget: (max: number | null) => void;
  onAsk: (text: string) => void;
  onSuggestion: (s: string) => void;
  onUndo: (id: string) => void;
  onRate: (id: string, r: "up" | "down") => void;
  onPerson: () => void;
  onStop: () => void;
  onRetry: () => void;
  onHide: () => void;
  composerPlaceholder?: string;
  title?: string;
  /** Hotel detail and Compare: fold the earlier thread under "Earlier in this search". */
  collapseEarlier?: boolean;
  onNewConversation?: () => void;
  /** "sheet": inside the phone and tablet bottom sheet (Mobile · Results · Copilot open 93:1305). */
  variant?: "panel" | "sheet";
};

const SUGGESTED_REQS: Requirement[] = [{ kind: "free-cancellation", label: "Free cancellation" }];

export function CopilotPanel(p: PanelProps) {
  const [editingBudget, setEditingBudget] = useState(false);
  const [showEarlier, setShowEarlier] = useState(false);
  const lastViewing = p.collapseEarlier ? p.items.map((i) => i.type).lastIndexOf("viewing") : -1;
  const earlier = lastViewing > 0 ? p.items.slice(0, lastViewing) : [];
  const current = lastViewing > 0 ? p.items.slice(lastViewing) : p.items;
  const earlierCount = earlier.filter((i) => i.type === "traveler" || i.type === "copilot").length;
  const scroller = useRef<HTMLDivElement>(null);
  const budget = p.requirements.find((r) => r.kind === "budget");

  // Keep the newest answer in view.
  useEffect(() => {
    const el = scroller.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [p.items.length, p.busy]);

  const firstUse = p.requirements.length === 0 && p.items.length === 0;
  const sheet = p.variant === "sheet";

  return (
    <aside
      aria-label="Travel Copilot"
      className={
        sheet
          ? "bg-surface flex h-full min-h-0 w-full flex-col overflow-hidden px-20 pt-8 pb-20"
          : "border-line bg-surface flex max-h-[calc(100vh-32px)] w-[360px] flex-col overflow-hidden rounded-lg border p-24 xl:w-[400px]"
      }
    >
      {p.overlay ? (
        <div className={sheet ? "-mx-20 -mb-20 overflow-y-auto px-20 pb-20" : "-mx-24 -my-24 overflow-y-auto p-24"}>
          {sheet && (
            <div className="flex justify-end">
              <button type="button" onClick={p.onHide} aria-label="Close Copilot" className="hover:bg-subtle -mr-8 rounded-md p-8">
                <Icon name="close-20" size={20} />
              </button>
            </div>
          )}
          {p.overlay}
        </div>
      ) : (
        <>
          <div className="flex shrink-0 flex-col gap-16 pb-16">
            <div className="flex items-center justify-between">
              <h2 className="text-heading-s text-fg flex items-center gap-8">
                <Icon name="sparkle" size={20} />
                {p.title ?? "Travel Copilot"}
              </h2>
              {sheet ? (
                <button type="button" onClick={p.onHide} aria-label="Close Copilot" className="hover:bg-subtle -mr-8 rounded-md p-8">
                  <Icon name="close-20" size={20} />
                </button>
              ) : (
                <Button variant="ghost" onClick={p.onHide} className="!px-12">
                  Hide
                </Button>
              )}
            </div>

            <section className="flex flex-col gap-8" aria-label="What I understood">
              <p className="text-label-s text-fg-secondary">What I understood</p>
              {p.requirements.length === 0 ? (
                <p className="text-body-m text-fg-secondary">Nothing yet. You searched without preferences.</p>
              ) : (
                <div className="flex flex-wrap gap-8">
                  {p.requirements.map((r) =>
                    r.label.includes("assumed") ? (
                      <RequirementChip key={r.kind} state="unconfirmed" label={r.label} />
                    ) : (
                      <RequirementChip
                        key={r.kind}
                        label={r.label}
                        onClick={() => p.onRemove(r.kind)}
                        onEdit={r.kind === "budget" && !p.unavailable ? () => setEditingBudget(true) : undefined}
                      />
                    ),
                  )}
                  {!p.unavailable &&
                    SUGGESTED_REQS.filter((s) => !p.requirements.some((r) => r.kind === s.kind)).map((s) => (
                      <RequirementChip key={s.kind} state="suggested" label={s.label} onClick={() => p.onAddSuggested(s)} />
                    ))}
                </div>
              )}
            </section>
          </div>
          <div ref={scroller} className="-mx-4 flex min-h-0 flex-1 flex-col gap-16 overflow-y-auto px-4">
            {editingBudget && (
              <BudgetEditor
                current={budget?.maxPerNight ?? null}
                onCancel={() => setEditingBudget(false)}
                onUpdate={(max) => {
                  setEditingBudget(false);
                  p.onBudget(max);
                }}
              />
            )}

            {p.unavailable ? (
              <div className="bg-unconfirmed flex flex-col gap-8 rounded-md p-16" role="status">
                <p className="text-label-m text-fg flex items-center gap-8">
                  <Icon name="pill-alert" size={16} />
                  Copilot can’t answer right now
                </p>
                <p className="text-body-m text-fg">
                  Search, filters and booking still work. Your requirements are saved. Results are sorted by price until Copilot is back.
                </p>
                <div className="flex items-center gap-8">
                  <Button variant="secondary" onClick={p.onRetry}>
                    Try again
                  </Button>
                  <Button variant="ghost" onClick={p.onPerson}>
                    Talk to a person
                  </Button>
                </div>
              </div>
            ) : (
              <>
                {firstUse && (
                  <>
                    <CopilotMessage role="copilot">
                      I can check stays against what matters to you, like a late arrival or a quiet room, and show where each answer comes
                      from. I can’t book or pay for you.
                    </CopilotMessage>
                    <p className="text-label-s text-fg-secondary">Try one of these</p>
                  </>
                )}
                {earlierCount > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowEarlier(!showEarlier)}
                    aria-expanded={showEarlier}
                    className="border-line text-label-m text-fg hover:bg-subtle flex items-center justify-between rounded-md border px-12 py-8"
                  >
                    Earlier in this search · {earlierCount} {earlierCount === 1 ? "message" : "messages"}
                    <Icon name="select-chevron" size={20} className={showEarlier ? "rotate-180" : ""} />
                  </button>
                )}
                {showEarlier &&
                  earlier.map((item) => (
                    <ConversationItem
                      key={item.id}
                      item={item}
                      onUndo={p.onUndo}
                      onRate={p.onRate}
                      onPerson={p.onPerson}
                      onAsk={p.onAsk}
                      onStop={p.onStop}
                      onRetry={p.onRetry}
                    />
                  ))}
                {current.map((item) => (
                  <ConversationItem
                    key={item.id}
                    item={item}
                    onUndo={p.onUndo}
                    onRate={p.onRate}
                    onPerson={p.onPerson}
                    onAsk={p.onAsk}
                    onStop={p.onStop}
                    onRetry={p.onRetry}
                  />
                ))}
                {p.suggestions.length > 0 && !p.busy && (
                  <div className="flex flex-wrap gap-8" aria-label="Suggested next steps">
                    {p.suggestions.map((s) => (
                      <RequirementChip key={s} state="suggested" label={s} onClick={() => p.onSuggestion(s)} />
                    ))}
                  </div>
                )}
                {p.onNewConversation && earlierCount > 0 && !p.busy && (
                  <button type="button" onClick={p.onNewConversation} className="text-label-m text-fg-link self-start hover:underline">
                    Start a new conversation
                  </button>
                )}
              </>
            )}
          </div>

          <div className="flex flex-col gap-8 pt-24">
            <CopilotComposer
              placeholder={firstUse ? "Tell Copilot what matters" : (p.composerPlaceholder ?? "Ask about these hotels")}
              disabled={p.busy || p.unavailable}
              disabledText={p.unavailable ? "Copilot is paused" : "Copilot is answering…"}
              onSend={p.onAsk}
            />
            <p className="text-body-s text-fg-tertiary">Copilot can be wrong. It shows its sources and never books for you.</p>
            <div className="text-label-s text-fg-link flex gap-16">
              <Link href="/my-data" className="hover:underline">
                My data
              </Link>
              <button type="button" onClick={p.onPerson} className="hover:underline">
                Talk to a person
              </button>
            </div>
          </div>
        </>
      )}
    </aside>
  );
}

/** "Panel hidden" (Figma moment 120:982): a pill at the top right of the content. */
/**
 * The Copilot panel when hidden: a narrow rail in the panel's own place, so it
 * reopens where it went. Replaces the Figma pill by the title, which read as
 * a label next to "Show map" (Peri, 22 Nov 2026).
 */
export function PanelRail({ count, unread, onShow }: { count: number; unread: boolean; onShow: () => void }) {
  return (
    <button
      type="button"
      onClick={onShow}
      aria-label={`Show Travel Copilot, ${count} ${count === 1 ? "requirement" : "requirements"}${unread ? ", new answer" : ""}`}
      className="bg-copilot-strong text-fg-on-brand flex w-48 flex-col items-center gap-12 rounded-lg py-16 shadow-[0px_4px_16px_0px_rgba(13,20,48,0.16)] outline-none hover:brightness-110 focus-visible:shadow-[0_0_0_3px_var(--color-border-focus)]"
    >
      <span className="relative">
        <Icon name="sparkle" size={20} className="brightness-0 invert" />
        {unread && <span className="rounded-pill absolute -top-4 -right-4 size-8 bg-white" />}
      </span>
      <span className="text-label-m [writing-mode:vertical-rl]">Show Copilot</span>
      <span
        className="rounded-pill bg-surface text-label-s text-fg-copilot flex size-24 items-center justify-center"
        aria-hidden="true"
        title={`${count} requirements`}
      >
        {count}
      </span>
    </button>
  );
}
