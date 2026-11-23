import { describe, expect, it } from "vitest";
import { HOTELS } from "../hotels";
import summaries from "../reviewSummaries.json";
import { REVIEWS } from "../reviews";

const S = (summaries as { summaries: Record<string, { points: { text: string; reviews: number[] }[] }> }).summaries;

describe("sample reviews and Copilot summaries", () => {
  it("every stay has eight sample reviews and a summary", () => {
    for (const h of HOTELS) {
      expect(REVIEWS[h.id], h.id).toHaveLength(8);
      expect(S[h.id]?.points.length ?? 0, h.id).toBeGreaterThanOrEqual(2);
    }
  });

  it("every summary point cites real reviews", () => {
    for (const [id, s] of Object.entries(S)) {
      for (const p of s.points) {
        expect(p.reviews.length, `${id}: ${p.text}`).toBeGreaterThan(0);
        for (const n of p.reviews) expect(REVIEWS[id][n - 1], `${id} #${n}`).toBeDefined();
      }
    }
  });

  it("reviews never confirm late check-in at a stay where the desk closes at 11 pm", () => {
    for (const h of HOTELS.filter((x) => x.late.status === "no")) {
      for (const r of REVIEWS[h.id]) expect(r.text, h.id).not.toMatch(/desk was (open|there)|checked in at (1|2|12)/i);
    }
  });
});
