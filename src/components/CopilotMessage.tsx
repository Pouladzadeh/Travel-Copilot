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
        <div className="bg-subtle text-body-m text-fg max-w-[296px] rounded-lg px-16 py-12">{children}</div>
      </div>
    );
  }

  return (
    <div className={`border-line-copilot bg-copilot flex flex-col items-start gap-8 rounded-lg border p-16 ${className}`}>
      <div className="flex items-center gap-4">
        <Icon name="msg-sparkle" size={16} />
        <span className="text-label-s text-fg-copilot">Copilot</span>
      </div>
      <div className="text-body-m text-fg w-full">{children}</div>
      {showFeedback && (
        <div className="flex items-center gap-4 pt-4">
          <button
            type="button"
            aria-label="Helpful"
            aria-pressed={feedback === "up"}
            onClick={() => onFeedback?.("up")}
            className={`hover:bg-subtle flex size-28 items-center justify-center rounded-[6px] ${feedback === "up" ? "bg-subtle" : ""}`}
          >
            <Icon name="thumb-up" size={16} />
          </button>
          <button
            type="button"
            aria-label="Not helpful"
            aria-pressed={feedback === "down"}
            onClick={() => onFeedback?.("down")}
            className={`hover:bg-subtle flex size-28 items-center justify-center rounded-[6px] ${feedback === "down" ? "bg-subtle" : ""}`}
          >
            <ThumbDownIcon />
          </button>
          <span className="bg-line h-[14px] w-px" aria-hidden="true" />
          <button
            type="button"
            onClick={onReport}
            className="text-label-s text-fg-secondary hover:bg-subtle flex items-center gap-4 rounded-[6px] px-8 py-[6px]"
          >
            <Icon name="flag" size={16} />
            Report
          </button>
        </div>
      )}
    </div>
  );
}
