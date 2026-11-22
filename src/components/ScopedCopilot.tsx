"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Button, ButtonLink } from "./Button";
import { CopilotComposer } from "./CopilotComposer";
import { CopilotMessage } from "./CopilotMessage";
import { ReportDialog } from "./feedback/ReportAnswer";
import { Icon } from "./Icon";
import { RequirementChip } from "./RequirementChip";

/** One answer from a scoped Copilot: facts with a source, and at most one way onward. */
export type ScopedAnswer = {
  text: string;
  source?: string;
  person?: boolean;
  link?: { label: string; href: string };
};

type Msg = { id: number; role: "traveler"; text: string } | ({ id: number; role: "copilot"; rating?: "up" | "down" } & ScopedAnswer);

/**
 * A Copilot panel scoped to one booking or trip (Booking moment 120:927,
 * Trip 121:1698). It never speaks first: it opens with a line about what it
 * can do and suggested questions. It cannot change, cancel or pay.
 */
export function ScopedCopilot({
  title,
  intro,
  placeholder,
  suggestions,
  reply,
  footer,
  focusOnOpen = false,
  onHide,
  onPerson,
}: {
  title: string;
  intro: string;
  placeholder: string;
  suggestions: string[];
  reply: (text: string) => ScopedAnswer;
  footer?: ReactNode;
  focusOnOpen?: boolean;
  onHide: () => void;
  onPerson: () => void;
}) {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [busy, setBusy] = useState(false);
  const [reporting, setReporting] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => () => clearTimeout(timer.current), []);
  useEffect(() => {
    if (focusOnOpen) heading.current?.focus();
  }, [focusOnOpen]);

  function ask(text: string) {
    if (busy) return;
    const id = Date.now();
    setMsgs((m) => [...m, { id, role: "traveler", text }]);
    setBusy(true);
    timer.current = setTimeout(() => {
      setMsgs((m) => [...m, { id: id + 1, role: "copilot", ...reply(text) }]);
      setBusy(false);
    }, 600);
  }

  const asked = new Set(msgs.filter((m) => m.role === "traveler").map((m) => m.text));
  const left = suggestions.filter((s) => !asked.has(s));

  return (
    <section aria-labelledby="scoped-copilot" className="border-line bg-surface flex flex-col gap-16 rounded-lg border p-24">
      <div className="flex items-center gap-8">
        <Icon name="sparkle" size={20} />
        <h2 id="scoped-copilot" ref={heading} tabIndex={-1} className="text-heading-s text-fg flex-1 outline-none">
          {title}
        </h2>
        <Button variant="ghost" onClick={onHide} className="!min-h-0 !px-0 !py-0">
          Hide
        </Button>
      </div>
      <p className="text-body-m text-fg-secondary">{intro}</p>

      <div className="flex flex-col gap-16" aria-live="polite">
        {msgs.map((m) =>
          m.role === "traveler" ? (
            <CopilotMessage key={m.id} role="traveler">
              {m.text}
            </CopilotMessage>
          ) : (
            <div key={m.id} className="flex flex-col gap-12">
              <CopilotMessage
                role="copilot"
                showFeedback
                feedback={m.rating ?? null}
                onFeedback={(r) =>
                  setMsgs((all) =>
                    all.map((x) => (x.id === m.id && x.role === "copilot" ? { ...x, rating: x.rating === r ? undefined : r } : x)),
                  )
                }
                onReport={() => setReporting(m.text)}
              >
                {m.text}
              </CopilotMessage>
              {m.source && <p className="text-label-m text-fg-link">Source: {m.source}</p>}
              {(m.link || m.person) && (
                <div className="flex flex-wrap gap-8">
                  {m.link && (
                    <ButtonLink href={m.link.href} variant="secondary">
                      {m.link.label}
                    </ButtonLink>
                  )}
                  {m.person && (
                    <Button variant="secondary" onClick={onPerson}>
                      Talk to a person
                    </Button>
                  )}
                </div>
              )}
            </div>
          ),
        )}
        {busy && <p className="text-body-s text-fg-secondary">Copilot is answering…</p>}
      </div>

      {left.length > 0 && !busy && (
        <div className="flex flex-wrap gap-8">
          {left.slice(0, 3).map((s) => (
            <RequirementChip key={s} state="suggested" label={s} onClick={() => ask(s)} />
          ))}
        </div>
      )}
      <CopilotComposer placeholder={placeholder} disabled={busy} disabledText="Copilot is answering…" onSend={ask} />
      {footer}
      {reporting && <ReportDialog answer={reporting} onClose={() => setReporting(null)} />}
    </section>
  );
}
