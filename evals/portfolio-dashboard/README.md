# Portfolio dashboard data

`build_dash.py` builds the data files behind the interactive portfolio dashboard
("Travel Copilot evals", a Claude artifact) from the committed results in `evals/results/`.

```sh
python3 evals/portfolio-dashboard/build_dash.py   # writes evals/portfolio-dashboard/out/*.json
```

- Inputs: the three results files (run 2 before fixes, re-graded by Claude Haiku 5.5 under
  policy draft-3; run 3 after the prompt v2 fixes; the held-out final run) and `evals/cases.json`.
- Scores are taken as recorded in the results files; nothing is re-graded or recomputed.
- Grader agreement by rule comes from the `compare.test.ts` output (Haiku vs Opus, draft-1,
  299 of 330 grades agreed) and is typed into the script as recorded.
- `out/` is not committed; upload its files to the dashboard when the results change.
