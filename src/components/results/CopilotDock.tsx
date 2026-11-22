"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Icon } from "../Icon";

/**
 * Phones and tablets: Copilot lives in a bar at the bottom of the screen
 * and opens as a bottom sheet (Figma Mobile · Results 92:1234 and
 * Mobile · Results · Copilot open 93:1305). Desktop keeps the side panel.
 */
export function CopilotDock({
  open,
  onOpen,
  onClose,
  summary,
  unread = false,
  showBar = true,
  children,
}: {
  open: boolean;
  onOpen: () => void;
  onClose: () => void;
  summary: string;
  unread?: boolean;
  /** Booking keeps Copilot closed until asked for, so it has no bar. */
  showBar?: boolean;
  children: ReactNode;
}) {
  const sheet = useRef<HTMLDivElement>(null);
  const bar = useRef<HTMLButtonElement>(null);
  const close = useRef(onClose);
  useEffect(() => {
    close.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) return;
    const opener = bar.current;
    sheet.current?.querySelector<HTMLElement>("h2, button")?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close.current();
    };
    document.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
      opener?.focus();
    };
  }, [open]);

  return (
    <>
      {!open && showBar && (
        <div className="pointer-events-none fixed inset-x-0 bottom-0 z-30 px-12 pb-[max(12px,env(safe-area-inset-bottom))]">
          <button
            ref={bar}
            type="button"
            onClick={onOpen}
            aria-haspopup="dialog"
            className="border-line-copilot bg-surface pointer-events-auto mx-auto flex w-full max-w-[560px] items-center gap-12 rounded-lg border px-16 py-12 text-left shadow-[0px_-4px_24px_0px_rgba(13,20,48,0.16)]"
          >
            <span className="bg-copilot border-line-copilot flex size-36 shrink-0 items-center justify-center rounded-[18px] border">
              <Icon name="sparkle" size={20} />
            </span>
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="text-label-m text-fg flex items-center gap-8">
                Travel Copilot
                {unread && <span className="rounded-pill bg-icon-copilot size-8" aria-label="New answer" />}
              </span>
              <span className="text-body-s text-fg-secondary truncate">{summary}</span>
            </span>
            <Icon name="chevron-up" size={20} />
          </button>
        </div>
      )}
      {open && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <div className="absolute inset-0 bg-[rgba(13,20,48,0.5)]" onClick={onClose} aria-hidden="true" />
          <div
            ref={sheet}
            role="dialog"
            aria-modal="true"
            aria-label="Travel Copilot"
            className="bg-surface relative mx-auto flex h-[88vh] max-h-[88dvh] w-full max-w-[640px] flex-col overflow-hidden rounded-t-[24px] shadow-[0px_-12px_40px_0px_rgba(13,20,48,0.24)]"
          >
            <div className="flex shrink-0 justify-center pt-8" aria-hidden="true">
              <span className="rounded-pill bg-line-strong h-[5px] w-[44px]" />
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
          </div>
        </div>
      )}
    </>
  );
}

/** Open state for the sheet, plus a dot when Copilot answered while it was closed. */
export function useDock(answerCount: number) {
  const [open, setOpenState] = useState(false);
  // Answers already there when the page loads count as seen; only later ones get the dot.
  const [seen, setSeen] = useState<number | null>(answerCount > 0 ? answerCount : null);
  if (seen === null && answerCount > 0) setSeen(answerCount);
  const setOpen = (v: boolean) => {
    setOpenState(v);
    setSeen(answerCount);
  };
  return { open, setOpen, unread: !open && seen !== null && answerCount > seen };
}

export function dockSummary(requirements: number, answers: number) {
  const r = requirements === 0 ? "No requirements yet" : `${requirements} ${requirements === 1 ? "requirement" : "requirements"}`;
  return answers ? `${r} · ${answers} ${answers === 1 ? "answer" : "answers"} about these stays` : `${r} · ask about these stays`;
}
