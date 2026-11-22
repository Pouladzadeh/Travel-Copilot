"use client";

import { useState } from "react";
import { Button } from "../Button";
import { Dialog } from "../Dialog";
import { Icon } from "../Icon";

const REASONS = [
  "The information is wrong",
  "The source does not say this",
  "Something important is missing",
  "It felt unsafe or inappropriate",
  "Something else",
] as const;

/**
 * Report an answer (Figma 95:1499). Quotes the answer, asks one question,
 * optional details. SAMPLE: the report stays in this browser; no person
 * receives it until a backend exists.
 */
export function ReportForm({ answer, onDone }: { answer?: string; onDone: () => void }) {
  const [reason, setReason] = useState<(typeof REASONS)[number]>(REASONS[0]);
  const [details, setDetails] = useState("");
  const [sent, setSent] = useState(false);

  if (sent) {
    return (
      <div className="flex flex-col gap-16" role="status">
        <p className="text-body-m text-fg flex items-start gap-8">
          <Icon name="pill-check" size={16} />
          Thanks. A person reviews every report, and Copilot’s answer stays marked until then.
        </p>
        <p className="text-body-s text-fg-tertiary">Sample data: this report was not sent anywhere.</p>
        <div className="flex justify-end">
          <Button onClick={onDone}>Done</Button>
        </div>
      </div>
    );
  }

  return (
    <form
      className="flex flex-col gap-20"
      onSubmit={(e) => {
        e.preventDefault();
        setSent(true);
      }}
    >
      <p className="text-body-m text-fg-secondary">Tell us what was wrong. A person reviews every report.</p>
      {answer && (
        <figure className="border-line-copilot bg-copilot flex flex-col gap-4 rounded-md border p-12">
          <figcaption className="text-label-s text-fg-copilot">Copilot said</figcaption>
          <blockquote className="text-body-m text-fg">{answer}</blockquote>
        </figure>
      )}
      <fieldset className="flex flex-col gap-12">
        <legend className="text-label-m text-fg mb-12">What was wrong?</legend>
        {REASONS.map((r) => (
          <label key={r} className="text-body-m text-fg flex cursor-pointer items-center gap-12">
            <input type="radio" name="reason" value={r} checked={reason === r} onChange={() => setReason(r)} className="peer sr-only" />
            <span className="rounded-pill peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[var(--color-border-focus)]">
              <Icon name={reason === r ? "radio-on" : "radio-off"} size={20} />
            </span>
            {r}
          </label>
        ))}
      </fieldset>
      <div className="flex flex-col gap-8">
        <label htmlFor="details" className="text-label-m text-fg">
          Add details (optional)
        </label>
        <textarea
          id="details"
          rows={3}
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          placeholder="For example: the hotel told me the desk closes at 11 pm."
          className="bg-surface border-line-input text-body-l text-fg placeholder:text-fg-tertiary w-full resize-y rounded-md border p-12 outline-none focus:border-2 focus:border-[var(--color-border-focus)] focus:p-[11px]"
        />
      </div>
      <p className="text-body-s text-fg-tertiary">
        Your report includes this answer and your search. It does not include payment details, and it does not change your booking.
      </p>
      <div className="flex items-center justify-end gap-12">
        <Button variant="ghost" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit">Send report</Button>
      </div>
    </form>
  );
}

export function ReportDialog({ answer, onClose }: { answer?: string; onClose: () => void }) {
  return (
    <Dialog title="Report this answer" onClose={onClose}>
      <ReportForm answer={answer} onDone={onClose} />
    </Dialog>
  );
}
