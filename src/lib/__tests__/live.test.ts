import { describe, expect, it } from "vitest";
import { toReply } from "../copilot/live";
import { decodeRequirements } from "../requirements";

const reqs = decodeRequirements("late-arrival,quiet,budget:300");

describe("live model replies", () => {
  it("routes a budget change through code, with Undo and code-written counts", () => {
    const r = toReply({ answer: "", requirement_change: { op: "budget", max_per_night: 350 }, offer_person: false }, reqs);
    expect(r.requirements?.find((q) => q.kind === "budget")).toMatchObject({ maxPerNight: 350 });
    expect(r.items[0]).toMatchObject({ type: "change", title: "Budget changed", undo: reqs });
    expect(r.items[1]).toMatchObject({ type: "copilot" });
    expect(r.items).toHaveLength(2);
  });

  it("ignores removing a requirement the traveler does not have", () => {
    const r = toReply(
      { answer: "Nothing to remove.", requirement_change: { op: "remove", kind: "free-cancellation" }, offer_person: false },
      reqs,
    );
    expect(r.requirements).toBeUndefined();
    expect(r.items).toHaveLength(1);
  });

  it("adds a person button and links only known stays", () => {
    const r = toReply({ answer: "I can’t book for you.", hotel_links: ["sunset-harbor", "made-up-hotel"], offer_person: true }, reqs);
    const item = r.items[0];
    expect(item.type === "copilot" && item.actions?.map((a) => a.kind)).toEqual(["link", "person"]);
  });
});
