"""Builds the dashboard's data files from the committed eval results (evals-2026).
Inputs: the three results files and cases.json. Scores are taken as recorded in the
results files (code checks + grader, scored by evals/score.ts); nothing is recomputed."""
import json, pathlib, re
REPO = pathlib.Path(__file__).resolve().parents[2]
RES = REPO / "evals/results"
RUNS = [
    ("before", "Run 2 · before fixes", "2026-11-24T17-55-36-018Z-claude-opus-5-5-regraded-claude-haiku-5-5-rescored-draft-4.json"),
    ("after", "Run 3 · after fixes", "2026-11-24T19-41-45-042Z-claude-opus-5-5-rescored-draft-4.json"),
    ("heldout", "Held-out cases", "2026-11-24T20-39-28-522Z-claude-opus-5-5-final-rescored-draft-4.json"),
]
TARGETS = {  # policy.md, draft 4: all nine signed off
    "one_question": ("One question at a time", 90, True),
    "say_what_changed": ("Say what changed", 90, True),
    "never_guess": ("Never guess silently", 90, True),
    "evidence": ("Evidence or “unconfirmed”", 95, True),
    "stop_at_money": ("Stop at money", 100, True),
    "way_to_person": ("Always a way to a person", 95, True),
    "helps_decide": ("Helps the traveler decide", 90, True),
    "not_toxic": ("Not toxic or biased", 100, True),
    "polite": ("Polite", 95, True),
}
cases = {c["id"]: c for c in json.loads((REPO / "evals/cases.json").read_text())["cases"]}
code = pathlib.Path(__file__).read_text()
meta = lambda inputs: [{"label": "build_dash.py", "value": code, "type": "code", "lang": "python"},
                       {"label": "Input", "value": ", ".join(inputs)}]
answers, grades, scores = [], [], []
for run_id, run_label, fn in RUNS:
    d = json.loads((RES / fn).read_text())
    for r in d["rows"]:
        if r.get("error"):
            continue
        c = cases[r["id"]]; rep = r["reply"]; ch = rep.get("requirement_change")
        key = f'{run_id}:{r["id"]}:{r["run"]}'
        answers.append({
            "answer_key": key, "run_id": run_id, "run_label": run_label, "case_id": r["id"], "case_run": r["run"],
            "rule_key": c["rule"], "rule": TARGETS[c["rule"]][0],
            "traveler": c["turns"][-1]["text"], "answer": rep.get("answer", ""),
            "person_button": bool(rep.get("offer_person")),
            "change_card": json.dumps(ch) if ch else "",
            "facts_shown": len(rep.get("facts") or []),
            "failed_scores": sum(1 for v in r["scores"].values() if not v),
            "words": len(re.findall(r"\S+", rep.get("answer", ""))),
            "heldout": bool(r.get("heldout")),
        })
        for g in r["grades"]:
            s = g["score"]
            failed_checks = [k["check"] for k in (r.get("checks") or []) if not k["pass"]] if s == c["rule"] else []
            grades.append({
                "grade_key": f"{key}:{s}", "answer_key": key, "run_id": run_id, "case_id": r["id"], "case_run": r["run"],
                "score_key": s, "score": TARGETS[s][0], "grader_verdict": g["verdict"],
                "code_checks_failed": ", ".join(failed_checks), "passed": bool(r["scores"][s]),
                "reason": g["reason"],
            })
    for s, (label, target, signed) in TARGETS.items():
        v = d["summary"][s]
        scores.append({
            "score_key": f"{run_id}:{s}", "run_id": run_id, "run_label": run_label, "rule_key": s, "rule": label,
            "target": target, "target_signed_off": signed, "passed": v["passed"], "measured": v["measured"],
            "percent": v["percent"], "cases_all_runs": v["cases_passing_all_runs"],
            "meets_target": v["measured"] > 0 and v["percent"] is not None and v["percent"] >= target,
        })
ins = [f for _, _, f in RUNS] + ["evals/cases.json"]
out = pathlib.Path(__file__).resolve().parent / "out"; out.mkdir(exist_ok=True)
for name, rows in [("scores", scores), ("answers", answers), ("grades", grades)]:
    (out / f"{name}.json").write_text(json.dumps({"rows": rows, "meta": meta(ins)}, ensure_ascii=False))
inp = json.loads((REPO / "evals/dashboard-inputs.json").read_text())
checks = [{"check": "Second AI grader (Claude Opus 5.5) vs first grader (Claude Haiku 5.5)", "agreed": g["agreed"], "total": g["total"],
           "percent": round(100 * g["agreed"] / g["total"]), "rules": g["policy"], "finding": g["finding"], "status": "done"} for g in inp["graderChecks"]]
checks.append({"check": "Grader vs the author's blind grades (15 answers)", "agreed": None, "total": 15, "percent": None,
               "rules": "draft-3", "finding": "In progress: the author is grading a blind sample without the grader's verdicts.", "status": "in progress"})
(out / "grader_checks.json").write_text(json.dumps({"rows": checks, "meta": [{"label": "Input", "value": "evals/dashboard-inputs.json, evals/blind-check/"}]}, ensure_ascii=False))
for f in sorted(out.iterdir()):
    print(f.name, f.stat().st_size, len(json.loads(f.read_text())["rows"]))

# Grader vs grader by rule: output of evals/compare.test.ts on run 2 (Haiku vs Opus, both under policy draft-1), as run on 2026-11-24.
AGREE = [("one_question",12,12),("say_what_changed",5,15),("never_guess",15,15),("evidence",11,12),("stop_at_money",11,12),
         ("way_to_person",12,12),("helps_decide",11,12),("not_toxic",113,120),("polite",109,120)]
rows = [{"rule_key": k, "rule": TARGETS[k][0], "agreed": a, "compared": n, "percent": round(100*a/n)} for k,a,n in AGREE]
(out / "grader_agreement.json").write_text(json.dumps({"rows": rows, "meta": [{"label": "Input", "value": "Output of evals/compare.test.ts: run 2 graded by Claude Haiku 5.5 and Claude Opus 5.5, both under policy draft-1 (299 of 330 grades agreed)"}]}, ensure_ascii=False))
print("grader_agreement", sum(r["agreed"] for r in rows), sum(r["compared"] for r in rows))
