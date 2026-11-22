"use client";

import type { ReactNode } from "react";
import { Icon, ThumbDownIcon } from "./Icon";

/**
 * Copilot message (Figma 8:174). Copilot messages always carry the teal
 * surface and label. Traveler messages use the light grey bubble in the
 * product (the dark bubble is only for the Home phone mockup).
 */
type Feedback = "up" | "down" | null;

type CopilotMessageProps = {
  role: "copilot" | "traveler";
  children: ReactNode;
  /** Shows the thumbs up / down / Report row under a Copilot answer. */
  showFeedback?: boolean;
  feedback?: Feedback;
  onFeedback?: (value: Exclude<Feedback, null>) => void;
  onReport?: () => void;
  className?: string;
};

export function CopilotMessage({
  role,
  children,
  showFeedback = false,
  feedback = null,
  onFeedback,
  onReport,
  className = "",
}: CopilotMessageProps) {
  if (role === "traveler") {
    return (
      <div className={`flex flex-col items-end ${className}`}>
        <div className="max-w-[296px] rounded-lg bg-subtle px-16 py-12 text-body-m text-fg">{children}</div>
      </div>
    );
  }

  return (
    <div
      className={`flex flex-col items-start gap-8 rounded-lg border border-line-copilot bg-copilot p-16 ${className}`}
    >
      <div className="flex items-center gap-4">
        <Icon name="msg-sparkle" size={16} />
        <span className="text-label-s text-fg-copilot">Copilot</span>
      </div>
      <div className="w-full text-body-m text-fg">{children}</div>
      {showFeedback && (
        <div className="flex items-center gap-4 pt-4">
          <button
            type="button"
            aria-label="Helpful"
            aria-pressed={feedback === "up"}
            onClick={() => onFeedback?.("up")}
            className={`flex size-28 items-center justify-center rounded-[6px] hover:bg-subtle ${feedback === "up" ? "bg-subtle" : ""}`}
          >
            <Icon name="thumb-up" size={16} />
          </button>
          <button
            type="button"
            aria-label="Not helpful"
            aria-pressed={feedback === "down"}
            onClick={() => onFeedback?.("down")}
            className={`flex size-28 items-center justify-center rounded-[6px] hover:bg-subtle ${feedback === "down" ? "bg-subtle" : ""}`}
          >
            <ThumbDownIcon />
          </button>
          <span className="h-[14px] w-px bg-line" aria-hidden="true" />
          <button
            type="button"
            onClick={onReport}
            className="flex items-center gap-4 rounded-[6px] px-8 py-[6px] text-label-s text-fg-secondary hover:bg-subtle"
          >
            <Icon name="flag" size={16} />
            Report
          </button>
        </div>
      )}
    </div>
  );
}
