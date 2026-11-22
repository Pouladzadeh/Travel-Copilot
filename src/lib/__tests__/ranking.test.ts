import { describe, expect, it } from "vitest";
import { openingReply, scriptedReply } from "../copilot/scripted";
import { buildResults, hiddenNotice, relaxations } from "../ranking";
import { decodeRequirements, parseRequirements } from "../requirements";

const reqs = (s: string) => decodeRequirements(s);
const names = (q: string) => buildResults(reqs(q)).fitting.map((h) => h.name);

describe("designed counts on Results (Figma 12:62 and the conversation moments)", () => {
  it("default request: 3 of 15, in the designed order", () => {
    expect(names("late-arrival,quiet,budget:300")).toEqual(["Sunset Harbor Bayside Suites", "Palmetto Court Hotel", "Bayfront Garden Inn"]);
    expect(buildResults(reqs("late-arrival,quiet,budget:300")).total).toBe(15);
  });
  it("Change of mind: up to $350 gives 5", () => expect(names("late-arrival,quiet,budget:350")).toHaveLength(5));
  it("Remove a requirement: without quiet gives 7", () => expect(names("late-arrival,budget:300")).toHaveLength(7));
  it("No match: $180 fits nothing", () => expect(names("late-arrival,quiet,budget:180")).toHaveLength(0));
  it("No match suggestions match Figma", () => {
    const r = relaxations(reqs("late-arrival,quiet,budget:180"));
    expect(r.map((x) => [x.label, x.count])).toEqual([
      ["Raise your budget to $200 a night", 1],
      ["Raise your budget to $265 a night", 3],
      ["Search without “quiet”", 0],
    ]);
  });
  it("hidden notice counts every hidden stay", () => {
    const m = buildResults(reqs("late-arrival,quiet,budget:300"));
    expect(hiddenNotice(m)).toBe(
      "12 stays are hidden: 6 don’t allow check-in after midnight, 4 aren’t described as quiet and 2 are over $300 a night.",
    );
  });
});

describe("reading typed preferences on Home (126:1798)", () => {
  it("finds the three designed chips", () => {
    expect(parseRequirements("My flight lands at 11:30 pm. Somewhere quiet, under $300 a night.").map((r) => r.label)).toEqual([
      "Arriving after midnight",
      "Quiet",
      "Up to $300 a night",
    ]);
  });
  it("does not invent a late arrival from a daytime flight", () => {
    expect(parseRequirements("My flight lands at 2 pm").map((r) => r.kind)).not.toContain("late-arrival");
  });
  it("non-refundable is not free cancellation", () => {
    expect(parseRequirements("non-refundable is fine")).toEqual([]);
  });
});

describe("scripted Copilot replies keep the six rules", () => {
  const ctx = { requirements: reqs("late-arrival,quiet,budget:300"), screen: "results" as const };
  it("opening reply matches the Figma copy", () => {
    const text = openingReply(ctx.requirements).items.map((i) => (i.type === "copilot" ? i.text : ""));
    expect(text[0]).toBe(
      "Two hotels confirm check-in after midnight. A third is closer to the airport, but I couldn’t confirm its desk hours, so I’ve marked it unconfirmed.",
    );
    expect(text[1]).toBe(
      "Sunset Harbor is the only one that needs no phone call, but its $240 rate is non-refundable. With free cancellation it costs $906 in total. Palmetto Court can be cancelled for free at $884.",
    );
  });
  it("Rule 5: never books", () => {
    const r = scriptedReply("Just book the cheapest one for me.", ctx);
    expect(r.items[0].type === "copilot" && r.items[0].text).toMatch(/^I can’t book or pay for you\./);
    expect(r.requirements).toBeUndefined();
  });
  it("Rule 6: the fallback offers a person", () => {
    const r = scriptedReply("What is the meaning of life?", ctx);
    const item = r.items[0];
    expect(item.type === "copilot" && item.actions?.some((a) => a.kind === "person")).toBe(true);
  });
  it("Rule 2: a budget change says what changed", () => {
    const r = scriptedReply("Actually I can go up to $350.", ctx);
    expect(r.items[0]).toMatchObject({ type: "change", title: "Budget changed", from: "Up to $300 a night", to: "Up to $350 a night" });
    expect(r.items[1].type === "copilot" && r.items[1].text).toBe(
      "Done. 2 more stays fit, so you now have 5. I did not change anything else.",
    );
  });
  it("Rule 4: an unknown hotel is not described from memory", () => {
    const r = scriptedReply("What about the Marlin House? My friend stayed there.", ctx);
    expect(r.items[0].type === "copilot" && r.items[0].text).toMatch(/not in these results/);
  });
});
