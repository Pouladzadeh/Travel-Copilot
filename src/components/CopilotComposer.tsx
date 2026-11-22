"use client";

import { useState, type FormEvent } from "react";
import { Icon } from "./Icon";

/**
 * Copilot composer (Figma 125:337): the ask box in the Copilot panel.
 *  - Empty:    send is inactive.
 *  - Typing:   focused, send is active; Enter also sends.
 *  - Disabled: while Copilot is answering or unavailable.
 */
type CopilotComposerProps = {
  placeholder?: string;
  disabled?: boolean;
  /** Shown instead of the placeholder while disabled, e.g. "Copilot is answering…". */
  disabledText?: string;
  onSend: (text: string) => void;
  className?: string;
};

export function CopilotComposer({
  placeholder = "Ask about these hotels",
  disabled = false,
  disabledText,
  onSend,
  className = "",
}: CopilotComposerProps) {
  const [text, setText] = useState("");
  const canSend = !disabled && text.trim().length > 0;

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!canSend) return;
    onSend(text.trim());
    setText("");
  }

  return (
    <form
      onSubmit={submit}
      className={`flex h-[48px] items-center gap-12 rounded-md border py-[6px] pl-12 pr-[6px] ${
        disabled
          ? "border-line bg-subtle"
          : "border-line-input bg-surface focus-within:border-line-focus focus-within:shadow-[inset_0_0_0_1px_var(--color-border-focus)]"
      } ${className}`}
    >
      <Icon name={disabled ? "sparkle-disabled" : "sparkle"} size={18} />
      <input
        type="text"
        value={disabled ? "" : text}
        onChange={(e) => setText(e.target.value)}
        disabled={disabled}
        placeholder={disabled && disabledText ? disabledText : placeholder}
        aria-label={placeholder}
        className="min-w-0 flex-1 bg-transparent text-body-l text-fg outline-none placeholder:text-fg-tertiary disabled:cursor-not-allowed"
      />
      <button
        type="submit"
        disabled={!canSend}
        aria-label="Send"
        className={`flex size-36 shrink-0 items-center justify-center rounded-[18px] ${
          canSend ? "bg-icon-copilot" : disabled ? "bg-surface" : "bg-subtle"
        }`}
      >
        <Icon name={canSend ? "send-active" : "send"} size={16} />
      </button>
    </form>
  );
}
