"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { Icon } from "./Icon";

/**
 * Modal dialog (Figma "Dialog · Message the hotel" 79:1322, "Dialog · Report
 * an answer"): scrim, 600px card, close button. Escape and the scrim close it,
 * focus stays inside while open and returns to the opener afterwards.
 */
export function Dialog({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  const id = useId();
  const card = useRef<HTMLDivElement>(null);
  const close = useRef(onClose);
  useEffect(() => {
    close.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    const focusables = () =>
      Array.from(
        card.current?.querySelectorAll<HTMLElement>("button, [href], input, textarea, select, [tabindex]:not([tabindex='-1'])") ?? [],
      ).filter((el) => !el.hasAttribute("disabled"));
    // Focus the first field if there is one, otherwise the first control.
    const first = card.current?.querySelector<HTMLElement>("textarea, input") ?? focusables()[0];
    first?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        close.current();
      }
      if (e.key === "Tab") {
        const list = focusables();
        if (!list.length) return;
        const [a, z] = [list[0], list[list.length - 1]];
        if (e.shiftKey && document.activeElement === a) {
          e.preventDefault();
          z.focus();
        } else if (!e.shiftKey && document.activeElement === z) {
          e.preventDefault();
          a.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
      opener?.focus();
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto px-16 py-[120px]">
      <div className="absolute inset-0 bg-[rgba(13,20,48,0.5)]" onClick={onClose} aria-hidden="true" />
      <div
        ref={card}
        role="dialog"
        aria-modal="true"
        aria-labelledby={id}
        className="bg-surface relative flex w-full max-w-[600px] flex-col gap-20 rounded-[24px] p-32 shadow-[0px_24px_64px_0px_rgba(13,20,48,0.28)]"
      >
        <div className="flex items-center gap-16">
          <h2 id={id} className="text-heading-m text-fg flex-1">
            {title}
          </h2>
          <button type="button" onClick={onClose} aria-label="Close" className="hover:bg-subtle -m-8 rounded-md p-8">
            <Icon name="close-20" size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
