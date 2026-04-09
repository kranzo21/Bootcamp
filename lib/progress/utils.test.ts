import { calculateScore, isPassing, isCooledDown } from "./utils";

describe("calculateScore", () => {
  it("returns 1.0 for all correct answers", () => {
    expect(calculateScore([0, 1, 2], [0, 1, 2])).toBe(1);
  });

  it("returns 0 for all wrong answers", () => {
    expect(calculateScore([0, 1, 2], [1, 0, 3])).toBe(0);
  });

  it("returns 0.5 for half correct", () => {
    expect(calculateScore([0, 1], [0, 0])).toBe(0.5);
  });
});

describe("isPassing", () => {
  it("returns true for score >= 0.8", () => {
    expect(isPassing(0.8)).toBe(true);
    expect(isPassing(1.0)).toBe(true);
  });

  it("returns false for score < 0.8", () => {
    expect(isPassing(0.79)).toBe(false);
    expect(isPassing(0)).toBe(false);
  });
});

describe("isCooledDown", () => {
  it("returns true when last attempt was more than 24h ago", () => {
    const yesterday = new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString();
    expect(isCooledDown(yesterday)).toBe(true);
  });

  it("returns false when last attempt was less than 24h ago", () => {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    expect(isCooledDown(oneHourAgo)).toBe(false);
  });

  it("returns true when no previous attempt exists", () => {
    expect(isCooledDown(null)).toBe(true);
  });
});
