# Copilot evals

Measures how reliably Travel Copilot follows its rules. The plan and the nine scores are in `policy.md`; the 50 cases are in `cases.json`.

## Files
- `cases.json`: 50 cases (10 held out). Each has turns, requirements, what the answer must and must not do, and the code checks to run.
- `checks.ts`: code checks. No model. Unknown check names throw.
- `grader.ts`: AI grader. One score per call, pass or fail, with a quote and a reason. `unsure` counts as a fail and is flagged.
- `run.test.ts`: runner. Calls the real `/api/copilot` handler, three runs per case, writes `results/<time>-<model>.json`.
- `checks.test.ts`: tests for the checks and the case file. Runs with `npm run test:evals`.

## Running
```bash
npm run test:evals                         # checks and case file only; free
RUN_EVALS=1 npm run eval                   # working cases, 3 runs each; calls the models
RUN_EVALS=1 FINAL=1 npm run eval           # adds the 10 held-out cases (final run only)
RUN_EVALS=1 EVAL_ONLY=oq-01,sm-01 npm run eval   # a few cases, for debugging
```
Set `ANTHROPIC_API_KEY` in `.env.local`. The model under test defaults to `claude-opus-5-5` (`COPILOT_MODEL`); the grader is `claude-haiku-5-5` (`GRADER_MODEL`).

## Limits
- `hotel_ids_known` only checks the route's filtered output. Invented hotel names are caught by the grader, not by code.
- Score 7 (helps decide) is measured on its own cases only, not on every answer that could have named a fitting stay.
- Results are real runs only. Nothing is written here by hand.
