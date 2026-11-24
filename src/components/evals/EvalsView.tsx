import data from "@/data/evals-run2.json";
import { SlimFooter } from "../results/ResultsParts";
import { SiteHeader } from "../SiteHeader";
import { StatusPill } from "../StatusPill";

type Score = (typeof data.scores)[number];
type Failure = (typeof data.failures)[number];

const SCORE_LABEL = Object.fromEntries(data.scores.map((s) => [s.key, s.label]));
const met = data.scores.filter((s) => s.meetsTarget).length;
const graderCheck = data.graderChecks[0];

/** One score: a bar for the pass rate with a tick at the target, plus the counts in text. */
function ScoreRow({ s }: { s: Score }) {
  return (
    <li className="border-line grid grid-cols-1 items-center gap-8 border-b py-16 last:border-b-0 md:grid-cols-[minmax(0,15rem)_minmax(0,1fr)_auto] md:gap-24">
      <div className="flex flex-col gap-4">
        <p className="text-label-m text-fg">{s.label}</p>
        <p className="text-body-s text-fg-secondary">
          Target {s.target}%{s.targetSignedOff ? "" : " (suggested, not yet signed off)"}
        </p>
      </div>
      <div
        className="bg-subtle relative h-[12px] rounded-sm"
        role="img"
        aria-label={`${s.label}: ${s.percent}% passed, target ${s.target}%`}
        title={`${s.passed} of ${s.measured} answers passed · ${s.casesAllRuns} cases passed all 3 runs`}
      >
        <div className="bg-copilot-strong absolute inset-y-0 left-0 rounded-sm" style={{ width: `${s.percent}%` }} />
        <div className="bg-fg absolute -inset-y-[4px] w-[2px]" style={{ left: `calc(${s.target}% - 1px)` }} aria-hidden />
      </div>
      <div className="flex flex-wrap items-center gap-12 md:justify-end">
        <p className="text-body-m text-fg tabular-nums">
          <span className="text-label-m">{s.percent}%</span>{" "}
          <span className="text-fg-secondary">
            ({s.passed} of {s.measured})
          </span>
        </p>
        <StatusPill type={s.meetsTarget ? "confirmed" : "danger"} label={s.meetsTarget ? "Meets target" : "Below target"} />
      </div>
    </li>
  );
}

function FailureItem({ f }: { f: Failure }) {
  return (
    <li>
      <details className="group border-line bg-surface rounded-md border">
        <summary className="text-body-m flex cursor-pointer list-none items-center justify-between gap-12 p-16">
          <span className="flex flex-col gap-2">
            <span className="text-label-m text-fg">“{f.traveler}”</span>
            <span className="text-body-s text-fg-secondary">
              {SCORE_LABEL[f.score]} · case {f.id}, run {f.run}
            </span>
          </span>
          <span className="text-label-s text-fg-link group-open:hidden">Show</span>
          <span className="text-label-s text-fg-link hidden group-open:inline">Hide</span>
        </summary>
        <div className="border-line text-body-m flex flex-col gap-12 border-t p-16">
          <div className="flex flex-col gap-4">
            <p className="text-label-s text-fg-secondary">Copilot answered</p>
            <p className="text-fg">{f.answer || "(no text)"}</p>
          </div>
          <div className="flex flex-col gap-4">
            <p className="text-label-s text-fg-secondary">Why it failed</p>
            <p className="text-fg">{f.why}</p>
          </div>
        </div>
      </details>
    </li>
  );
}

function Section({ title, intro, children }: { title: string; intro?: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-16">
      <div className="flex flex-col gap-4">
        <h2 className="text-heading-m text-fg">{title}</h2>
        {intro && <p className="text-body-m text-fg-secondary max-w-[48rem]">{intro}</p>}
      </div>
      {children}
    </section>
  );
}

/** Evals dashboard: real results only, read from src/data/evals-run2.json. */
export function EvalsView() {
  const byScore = data.scores.map((s) => ({ s, items: data.failures.filter((f) => f.score === s.key) })).filter((g) => g.items.length);
  const pending = data.overrides.filter((o) => o.status === "pending");

  return (
    <>
      <SiteHeader className="border-line bg-surface border-b" />
      <main className="bg-page flex justify-center">
        <div className="flex w-full max-w-[var(--container)] flex-col gap-40 px-20 pt-24 pb-40 md:gap-48 md:px-32 md:pt-40 md:pb-64">
          <header className="flex flex-col gap-12">
            <StatusPill type="copilot" label="Travel Copilot evals" className="self-start" />
            <h1 className="text-display-m text-fg max-w-[48rem]">How reliably does Copilot follow its rules?</h1>
            <p className="text-body-l text-fg-secondary max-w-[48rem]">
              Copilot answered {data.run.cases} test situations {data.run.runsPerCase} times each, {data.run.replies} answers in all. Each
              answer was checked by code where a rule is a yes or no, and by an AI grader where it takes judgment.
            </p>
            <p className="text-body-s text-fg-tertiary">
              {data.run.label} · {data.run.date} · Copilot on {data.run.modelUnderTest} · grader {data.run.grader} · rules {data.run.policy}{" "}
              · all hotels and prices are sample data
            </p>
          </header>

          <Section
            title={`${met} of ${data.scores.length} scores meet their target`}
            intro="The bar is the share of answers that passed. The black tick is the target. Hover a bar for how many cases passed in all three runs."
          >
            <ul className="border-line bg-surface rounded-lg border px-16 md:px-24">
              {data.scores.map((s) => (
                <ScoreRow key={s.key} s={s} />
              ))}
            </ul>
            {pending.length > 0 && (
              <p className="text-body-s text-fg-secondary">
                {pending.length} grader verdicts are known to be wrong and wait for the author’s decision:{" "}
                {pending.map((o) => `${o.id} run ${o.run} (${SCORE_LABEL[o.score]})`).join(", ")}. They are counted as graded until then.
              </p>
            )}
          </Section>

          <Section title="Every failed answer" intro="Open one to see what the traveler asked, what Copilot said, and which check failed.">
            <div className="flex flex-col gap-24">
              {byScore.map(({ s, items }) => (
                <div key={s.key} className="flex flex-col gap-8">
                  <h3 className="text-heading-s text-fg">
                    {s.label} <span className="text-body-m text-fg-secondary">· {items.length}</span>
                  </h3>
                  <ul className="flex flex-col gap-8">
                    {items.map((f) => (
                      <FailureItem key={`${f.id}-${f.run}-${f.score}`} f={f} />
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </Section>

          <Section
            title="Can the grader be trusted?"
            intro="An AI grader makes its own mistakes, so it was checked before its scores were used."
          >
            <div className="grid gap-16 md:grid-cols-2">
              <div className="border-line bg-surface flex flex-col gap-8 rounded-lg border p-24">
                <p className="text-label-m text-fg">Second AI grader</p>
                <p className="text-display-m text-fg tabular-nums">{Math.round((100 * graderCheck.agreed) / graderCheck.total)}%</p>
                <p className="text-body-s text-fg-secondary">
                  {graderCheck.agreed} of {graderCheck.total} verdicts matched · rules {graderCheck.policy}
                </p>
                <p className="text-body-m text-fg">{graderCheck.finding}</p>
              </div>
              <div className="border-line bg-surface flex flex-col gap-8 rounded-lg border p-24">
                <p className="text-label-m text-fg">Against a person</p>
                {data.humanCheck ? null : (
                  <>
                    <StatusPill type="unconfirmed" label="In progress" className="self-start" />
                    <p className="text-body-m text-fg">
                      The author is grading a blind sample of 15 answers without seeing the grader’s verdicts. Until that is done, the
                      scores above are provisional.
                    </p>
                  </>
                )}
              </div>
            </div>
          </Section>

          <Section title="Before and after">
            <ol className="grid gap-16 md:grid-cols-2">
              {data.history.map((h) => (
                <li key={h.label} className="border-line bg-surface flex flex-col gap-8 rounded-lg border p-24">
                  <div className="flex flex-wrap items-center gap-8">
                    <p className="text-label-m text-fg">{h.label}</p>
                    <StatusPill
                      type={h.status === "baseline" ? "confirmed" : h.status === "discarded" ? "sponsored" : "unconfirmed"}
                      label={h.status === "baseline" ? "Baseline" : h.status === "discarded" ? "Not used" : "Not run yet"}
                    />
                  </div>
                  <p className="text-body-m text-fg-secondary">{h.note}</p>
                </li>
              ))}
            </ol>
          </Section>

          <Section title="Limits">
            <ul className="text-body-m text-fg-secondary flex max-w-[48rem] list-disc flex-col gap-8 pl-20">
              {data.limits.map((l) => (
                <li key={l}>{l}</li>
              ))}
            </ul>
          </Section>
        </div>
      </main>
      <SlimFooter />
    </>
  );
}
