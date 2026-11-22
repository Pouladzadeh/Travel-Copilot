import { describe, expect, it } from "vitest";
import { requirementSource } from "../requirements";

describe("My data: what you wrote", () => {
  const typed = "My flight lands at 11:30 pm. Somewhere quiet, under $300.";
  it("finds the traveler's own words for each requirement (Figma 56:620)", () => {
    expect(requirementSource(typed, "late-arrival")).toBe("My flight lands at 11:30 pm.");
    expect(requirementSource(typed, "quiet")).toBe("Somewhere quiet.");
    expect(requirementSource(typed, "budget")).toBe("Under $300.");
  });
  it("says nothing when the requirement did not come from typed text", () => {
    expect(requirementSource(typed, "free-cancellation")).toBeUndefined();
    expect(requirementSource(undefined, "quiet")).toBeUndefined();
  });
});
