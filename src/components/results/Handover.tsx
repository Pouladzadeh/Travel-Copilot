"use client";

import { useState } from "react";
import type { Requirement } from "@/lib/requirements";
import { Button } from "../Button";
import { RequirementChip } from "../RequirementChip";

/**
 * "Hand over to a person" (Figma moment 99:638) and the live chat placeholder
 * (123:795). Live chat itself is out of scope: only the handover is designed.
 */
export function Handover({
  requirements,
  staysViewed,
  openQuestion,
  onBack,
}: {
  requirements: Requirement[];
  staysViewed: string[];
  openQuestion?: string;
  onBack: () => void;
}) {
  const [chat, setChat] = useState(false);

  if (chat) {
    return (
      <div className="border-line-strong flex flex-col gap-16 rounded-lg border-2 border-dashed p-16">
        <div className="flex items-center justify-between">
          <p className="text-heading-s text-fg-secondary">Chat with support</p>
          <span className="rounded-pill bg-subtle text-label-s text-fg-secondary px-8 py-4">Placeholder</span>
        </div>
        <div className="bg-subtle flex flex-col gap-4 rounded-md p-12">
          <p className="text-label-s text-fg-secondary">Shared from Copilot</p>
          <p className="text-body-m text-fg-secondary">
            Your request, the stays you looked at and your open question appear here for the agent.
          </p>
        </div>
        {[180, 120, 180].map((w, i) => (
          <div key={i} className={`bg-subtle h-[36px] rounded-md ${i === 1 ? "self-end" : ""}`} style={{ width: w }} aria-hidden="true" />
        ))}
        <div className="border-line-strong h-[44px] rounded-md border-2 border-dashed" aria-hidden="true" />
        <p className="text-body-s text-fg-secondary">
          Live chat with a person is outside this project. Only the handover into it is designed.
        </p>
        <Button variant="ghost" onClick={onBack}>
          Back to Copilot
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-16">
      <div className="flex items-center justify-between">
        <p className="text-heading-s text-fg">Talk to a person</p>
        <Button variant="ghost" onClick={onBack} className="!px-8">
          Back
        </Button>
      </div>
      <p className="text-body-m text-fg-secondary">Here is what will be shared, so you don’t have to repeat it.</p>
      <div className="bg-subtle flex flex-col gap-12 rounded-md p-16">
        <div className="flex flex-col gap-8">
          <p className="text-label-s text-fg-secondary">Your request</p>
          <div className="flex flex-wrap gap-8">
            {requirements.length ? (
              requirements.map((r) => <RequirementChip key={r.kind} label={r.label} />)
            ) : (
              <span className="text-body-m text-fg">No requirements yet</span>
            )}
          </div>
        </div>
        {staysViewed.length > 0 && (
          <div className="flex flex-col gap-2">
            <p className="text-label-s text-fg-secondary">Stays you looked at</p>
            <p className="text-body-m text-fg">{staysViewed.join(" · ")}</p>
          </div>
        )}
        {openQuestion && (
          <div className="flex flex-col gap-2">
            <p className="text-label-s text-fg-secondary">Your open question</p>
            <p className="text-body-m text-fg">{openQuestion}</p>
          </div>
        )}
        <div className="flex flex-col gap-2">
          <p className="text-label-s text-fg-secondary">Not shared</p>
          <p className="text-body-m text-fg">Payment details and anything you removed in My data.</p>
        </div>
      </div>
      <a href="/my-data" className="text-label-m text-fg-link hover:underline">
        Edit what is shared
      </a>
      <div className="flex flex-col gap-2">
        <p className="text-label-m text-fg">Usually answered in under 3 minutes</p>
        <p className="text-body-s text-fg-secondary">Available 24 hours, by chat or phone.</p>
      </div>
      <div className="flex gap-8">
        <Button className="flex-1" onClick={() => setChat(true)}>
          Start chat
        </Button>
        <Button variant="secondary" className="flex-1" onClick={() => setChat(true)}>
          Call me
        </Button>
      </div>
    </div>
  );
}
