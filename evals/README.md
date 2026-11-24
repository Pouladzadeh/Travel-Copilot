# Copilot evals

Measures how reliably Travel Copilot follows its rules. The plan and the nine scores are in `policy.md`; the 50 cases are in `cases.json`.

## Files

- `cases.json`: 50 cases (10 held out). Each has turns, requirements, what the answer must and must not do, and the code checks to run.
- `checks.ts`: code checks. No model. Unknown check names throw.
- `grader.ts`: AI grader. One score per call, pass or fail, with a quote and a reason. `unsure` counts as a fail and is flagged.
- `run.test.ts`: runner. Calls the real `/api/copilot` handler, three runs per case, writes `results/<time>-<model>.json`.
- `checks.test.ts`: tests for the checks and the case file. Runs with `npm run test:evals`.

## Re-grading and a second grader

Re-grade saved replies without calling Copilot again (code checks re-run too). The original file is never changed; a `-regraded-<model>.json` copy is written next to it.

```bash
RUN_REGRADE=1 RESULTS=evals/results/<file>.json GRADER_MODEL=claude-opus-5-5 \
  npx vitest run -c vitest.evals.config.mts --reporter=verbose --silent=false evals/regrade.test.ts
```

Compare two graders on the same replies. The disagreements it lists are what a person reviews first.

```bash
COMPARE_A=evals/results/<file>.json COMPARE_B=evals/results/<file>-regraded-claude-opus-5-5.json \
  npx vitest run -c vitest.evals.config.mts --reporter=verbose --silent=false evals/compare.test.ts
```

## Running

```bash
npm run test:evals                         # checks and case file only; free
RUN_EVALS=1 npm run eval -- --silent=false # working cases, 3 runs each; calls the models
RUN_EVALS=1 FINAL=1 npm run eval           # adds the 10 held-out cases (final run only)
RUN_EVALS=1 EVAL_ONLY=oq-01,sm-01 npm run eval   # a few cases, for debugging
```

Set `ANTHROPIC_API_KEY` in `.env.local`. The model under test defaults to `claude-opus-5-5` (`COPILOT_MODEL`); the grader is `claude-haiku-5-5` (`GRADER_MODEL`).

## Limits

- The second grader (Claude Opus 5.5) is the same model as Copilot, so it may favour Copilot's answers. Grader-vs-grader agreement is a consistency check; agreement with a person is the number that counts.

- `hotel_ids_known` only checks the route's filtered output. Invented hotel names are caught by the grader, not by code.
- Score 7 (helps decide) is measured on its own cases only, not on every answer that could have named a fitting stay.
- Results are real runs only. Nothing is written here by hand.

When output goes to a file, add `--silent=false` so the summary and the `results:` line are printed.

Re-grading saves progress after every reply in a `.partial.json` file next to the output. If a run stops (for example the API account runs out of credit), run the same command again and it resumes; the partial file is deleted when the run finishes. Files record the `policy_version` that graded them, and the comparison warns if two files were graded under different versions.

## Dashboard

`/evals` in the app reads `src/data/evals-run2.json`. Rebuild it from a graded results file (it applies `overrides.json` and adds `dashboard-inputs.json`):

```bash
BUILD_DASHBOARD=1 GRADED=evals/results/<graded file>.json npx vitest run -c vitest.evals.config.mts --silent=false evals/dashboard.test.ts
```
