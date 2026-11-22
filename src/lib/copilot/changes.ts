/**
 * Copilot's notes when the traveler changes a requirement with a chip.
 * Worked out in code from the real counts (Rule 2: say what changed).
 */
import { buildResults } from "../ranking";
import { LABELS, type Requirement } from "../requirements";
import type { PanelItem } from "./types";

let n = 0;
export const uid = (p = "i") => `${p}-${Date.now().toString(36)}-${(n++).toString(36)}`;

function delta(before: Requirement[], after: Requirement[]) {
  const a = buildResults(before).fitting.length;
  const b = buildResults(after).fitting.length;
  return { a, b, diff: b - a };
}

function countSentence(a: number, b: number) {
  const d = b - a;
  if (d === 0) return `The same ${b} ${b === 1 ? "stay fits" : "stays fit"}.`;
  if (d > 0) return `${d} more ${d === 1 ? "stay fits" : "stays fit"} now, so you have ${b}.`;
  return `${-d} fewer ${-d === 1 ? "stay fits" : "stays fit"}, so you have ${b}.`;
}

function kept(after: Requirement[]) {
  const names = after.map((r) =>
    r.kind === "late-arrival" ? "arrival time" : r.kind === "budget" ? "budget" : r.kind === "quiet" ? "quiet" : "cancellation",
  );
  if (names.length === 0) return "";
  if (names.length === 1) return ` I kept your ${names[0]}.`;
  return ` I kept your ${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}.`;
}

export function removeRequirement(before: Requirement[], kind: Requirement["kind"]) {
  const removed = before.find((r) => r.kind === kind)!;
  const after = before.filter((r) => r.kind !== kind);
  const { a, b } = delta(before, after);
  const items: PanelItem[] = [
    { type: "change", id: uid("c"), title: "Requirement removed", from: removed.label, undo: before },
    { type: "copilot", id: uid("m"), text: `Removed. ${countSentence(a, b)}${kept(after)}`, feedback: true },
  ];
  return { after, items };
}

export function addRequirement(before: Requirement[], r: Requirement) {
  const after = [...before.filter((q) => q.kind !== r.kind), r];
  const { a, b } = delta(before, after);
  const items: PanelItem[] = [
    { type: "change", id: uid("c"), title: "Requirement added", to: r.label, undo: before },
    { type: "copilot", id: uid("m"), text: `Added. ${countSentence(a, b)} I did not change anything else.`, feedback: true },
  ];
  return { after, items };
}

export function changeBudget(before: Requirement[], max: number | null) {
  const old = before.find((r) => r.kind === "budget");
  const after: Requirement[] =
    max === null
      ? before.filter((r) => r.kind !== "budget")
      : old
        ? before.map((r) => (r.kind === "budget" ? { kind: "budget", label: LABELS.budget(max), maxPerNight: max } : r))
        : [...before, { kind: "budget", label: LABELS.budget(max), maxPerNight: max }];
  const { a, b } = delta(before, after);
  const d = b - a;
  const lead =
    d === 0
      ? `Done. The same ${b} ${b === 1 ? "stay fits" : "stays fit"}.`
      : d > 0
        ? `Done. ${d} more ${d === 1 ? "stay fits" : "stays fit"}, so you now have ${b}.`
        : `Done. ${-d} fewer ${-d === 1 ? "stay fits" : "stays fit"}, so you now have ${b}.`;
  const items: PanelItem[] = [
    {
      type: "change",
      id: uid("c"),
      title: "Budget changed",
      from: old?.label ?? "No budget",
      to: max === null ? "No limit" : LABELS.budget(max),
      undo: before,
    },
    { type: "copilot", id: uid("m"), text: `${lead} I did not change anything else.`, feedback: true },
  ];
  return { after, items };
}
