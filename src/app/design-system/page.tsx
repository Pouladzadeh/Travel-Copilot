"use client";

import { useState, type ReactNode } from "react";
import { Button } from "@/components/Button";
import { CopilotComposer } from "@/components/CopilotComposer";
import { CopilotMessage } from "@/components/CopilotMessage";
import { Field } from "@/components/Field";
import { HotelCard } from "@/components/HotelCard";
import { Icon } from "@/components/Icon";
import { Logo } from "@/components/Logo";
import { RequirementChip } from "@/components/RequirementChip";
import { StatusPill } from "@/components/StatusPill";

/** Mirrors Figma page 03 Components (8:62). Interactive, for review. */

function Section({ title, note, children }: { title: string; note: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-16">
      <div className="flex flex-col gap-4">
        <h2 className="text-heading-l">{title}</h2>
        <p className="text-body-m text-fg-secondary">{note}</p>
      </div>
      <div className="w-fit max-w-full rounded-lg border border-line bg-surface p-24">{children}</div>
    </section>
  );
}

export default function DesignSystemPage() {
  const [chips, setChips] = useState(["Arriving after midnight", "Quiet", "Up to $300 a night"]);
  const [compare, setCompare] = useState(true);
  const [saved, setSaved] = useState(false);
  const [feedback, setFeedback] = useState<"up" | "down" | null>(null);
  const [sent, setSent] = useState<string[]>([]);

  return (
    <main className="mx-auto flex max-w-[var(--container)] flex-col gap-64 px-[var(--gutter)] py-64">
      <header className="flex flex-col gap-12">
        <h1 className="text-display-m">Components</h1>
        <p className="text-body-l text-fg-secondary">
          Built from the Figma file Travel Copilot 2026. Every colour, gap and radius comes from a token.
          Hotel content below is sample data.
        </p>
      </header>

      <Section title="Logo" note="The HelloWorld Booking wordmark. Used in every header and in the Home footer.">
        <Logo />
      </Section>

      <Section title="Icons" note="Line icons at 24px. Fields swap between them with the icon prop.">
        <div className="flex gap-24">
          {(["search", "pin", "calendar", "user", "sparkle"] as const).map((n) => (
            <Icon key={n} name={n} size={24} />
          ))}
        </div>
      </Section>

      <Section
        title="Button"
        note="Primary for the one main action on a screen, Secondary for alternatives, Ghost for low-emphasis actions. Hover to see the hover state."
      >
        <div className="grid grid-cols-[repeat(2,max-content)] gap-24">
          <Button>Button</Button>
          <Button disabled>Button</Button>
          <Button variant="secondary">Button</Button>
          <Button variant="secondary" disabled>
            Button
          </Button>
          <Button variant="ghost">Button</Button>
          <Button variant="ghost" disabled>
            Button
          </Button>
        </div>
      </Section>

      <Section title="Field" note="Search inputs for destination, dates and guests. Click one to see the focus state.">
        <div className="flex gap-24">
          <Field label="Destination" placeholder="Where to?" className="w-[280px]" />
          <Field label="Destination" defaultValue="Miami" icon="pin" className="w-[280px]" />
          <Field label="Guests" defaultValue="2 adults" icon="user" className="w-[280px]" />
        </div>
      </Section>

      <Section
        title="Requirement chip"
        note="What Copilot understood. Active chips can be removed, Suggested chips can be added, Unconfirmed chips flag something Copilot could not verify."
      >
        <div className="flex flex-col gap-16">
          <div className="flex flex-wrap gap-8">
            {chips.map((c) => (
              <RequirementChip key={c} label={c} onClick={() => setChips(chips.filter((x) => x !== c))} />
            ))}
            {chips.length < 3 && (
              <Button variant="ghost" onClick={() => setChips(["Arriving after midnight", "Quiet", "Up to $300 a night"])}>
                Reset
              </Button>
            )}
          </div>
          <div className="flex flex-wrap gap-8">
            <RequirementChip state="suggested" label="Free cancellation" onClick={() => {}} />
            <RequirementChip state="unconfirmed" label="Quiet · assumed: street" />
            <RequirementChip state="filter" label="Price" onClick={() => {}} />
          </div>
        </div>
      </Section>

      <Section
        title="Status pill"
        note="Small facts on a hotel card. Each type pairs a colour with an icon or explicit wording, so meaning never depends on colour alone."
      >
        <div className="flex flex-wrap gap-12">
          <StatusPill type="copilot" label="Copilot suggestion" />
          <StatusPill type="confirmed" label="Late check-in confirmed" />
          <StatusPill type="unconfirmed" label="Late check-in unconfirmed" />
          <StatusPill type="danger" label="Non-refundable" />
          <StatusPill type="wildcard" label="Wildcard" />
          <StatusPill type="sponsored" label="Sponsored" />
          <StatusPill type="conditional" label="Late check-in if you call ahead" />
          <StatusPill type="partial" label="Partly matches" />
        </div>
      </Section>

      <Section
        title="Copilot message"
        note="Messages in the side panel. Copilot messages carry the teal surface and label; traveler messages use the light grey bubble."
      >
        <div className="flex w-[350px] flex-col gap-16">
          <CopilotMessage role="traveler">
            I land at 11:30 pm and won&apos;t reach the hotel until after midnight. Somewhere quiet, under $300.
          </CopilotMessage>
          <CopilotMessage role="copilot" showFeedback feedback={feedback} onFeedback={setFeedback} onReport={() => {}}>
            Two hotels confirm check-in after midnight. A third is closer to the airport, but I couldn&apos;t confirm
            its desk hours, so I&apos;ve marked it unconfirmed.
          </CopilotMessage>
          <CopilotMessage role="copilot">Message without the feedback row.</CopilotMessage>
        </div>
      </Section>

      <Section
        title="Copilot composer"
        note="The ask box in the Copilot panel. Empty: send is inactive. Typing: send is active, Enter also sends. Disabled: while Copilot is answering or unavailable."
      >
        <div className="flex w-[350px] flex-col gap-24">
          <CopilotComposer onSend={(t) => setSent([...sent, t])} />
          {sent.length > 0 && <p className="text-body-s text-fg-secondary">Sent: {sent.join(" · ")}</p>}
          <CopilotComposer disabled disabledText="Copilot is answering…" onSend={() => {}} />
        </div>
      </Section>

      <Section
        title="Hotel card"
        note="One result. The teal block is the only Copilot-written part: a reason, and where the evidence came from."
      >
        <div className="flex w-[820px] flex-col gap-16">
          <HotelCard
            name="Sunset Harbor Bayside Suites"
            rating={4.5}
            reviewCount={1200}
            location="Coconut Grove, Miami"
            pricePerNight={240}
            totalWithFees={812}
            reason="Front desk is open 24 hours, so arriving after midnight works. Guests often describe the street as quiet."
            sources={'Sources: hotel policy page · 212 of 1,200 reviews mention "quiet"'}
            facts={[
              { type: "confirmed", label: "Late check-in confirmed" },
              { type: "danger", label: "Non-refundable" },
            ]}
            photo="/photos/sunset-harbor.png"
            href="#"
            compareChecked={compare}
            onCompareChange={setCompare}
            saved={saved}
            onSaveChange={setSaved}
          />
          <HotelCard
            name="Hotel name"
            rating={4.5}
            reviewCount={1200}
            location="Neighborhood, City"
            pricePerNight={240}
            totalWithFees={812}
            reason="Why this hotel fits the trip."
            sources="Sources: where the evidence came from"
            facts={[
              { type: "confirmed", label: "Late check-in confirmed" },
              { type: "unconfirmed", label: "Pet policy unconfirmed" },
            ]}
            href="#"
          />
        </div>
      </Section>

      <p className="text-body-s text-fg-tertiary">
        Sample data: every hotel, price, review count and photo on this site is invented for a portfolio project.
        Photos are AI-generated.
      </p>
    </main>
  );
}
