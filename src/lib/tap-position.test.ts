import { describe, expect, it } from "vitest";
import { tapPointToBagPercent } from "./tap-position";

const RECT = { left: 100, top: 200, width: 200, height: 600 };

describe("tapPointToBagPercent", () => {
  it("returns the bag center when point or rect is missing", () => {
    expect(tapPointToBagPercent(null, RECT)).toEqual({ xPct: 50, yPct: 56, side: 0 });
    expect(tapPointToBagPercent({ x: 1, y: 1 }, null)).toEqual({ xPct: 50, yPct: 56, side: 0 });
  });

  it("returns center for a click at the rect center", () => {
    const r = tapPointToBagPercent({ x: 200, y: 500 }, RECT);
    expect(r.xPct).toBeCloseTo(50);
    expect(r.yPct).toBeCloseTo(50);
    expect(r.side).toBe(0);
  });

  it("classifies side based on horizontal third", () => {
    expect(tapPointToBagPercent({ x: 130, y: 500 }, RECT).side).toBe(-1);
    expect(tapPointToBagPercent({ x: 270, y: 500 }, RECT).side).toBe(1);
    expect(tapPointToBagPercent({ x: 200, y: 500 }, RECT).side).toBe(0);
  });

  it("clamps clicks outside the rect to the [6, 94] safety band", () => {
    const left = tapPointToBagPercent({ x: 0, y: 0 }, RECT);
    expect(left.xPct).toBe(6);
    expect(left.yPct).toBe(6);
    const right = tapPointToBagPercent({ x: 9999, y: 9999 }, RECT);
    expect(right.xPct).toBe(94);
    expect(right.yPct).toBe(94);
  });

  it("guards against degenerate rects", () => {
    expect(tapPointToBagPercent({ x: 0, y: 0 }, { left: 0, top: 0, width: 0, height: 0 })).toEqual({
      xPct: 50,
      yPct: 56,
      side: 0,
    });
    expect(
      tapPointToBagPercent({ x: 0, y: 0 }, { left: 0, top: 0, width: 3, height: 600 }),
    ).toEqual({ xPct: 50, yPct: 56, side: 0 });
  });

  it("is invariant when the rect grows uniformly (e.g. bag size up-scaled)", () => {
    const small = tapPointToBagPercent(
      { x: 150, y: 350 },
      { left: 100, top: 200, width: 200, height: 600 },
    );
    // Same relative click on a 1.5x larger rect at the same anchor.
    const large = tapPointToBagPercent(
      { x: 175, y: 425 },
      { left: 100, top: 200, width: 300, height: 900 },
    );
    expect(small.xPct).toBeCloseTo(large.xPct);
    expect(small.yPct).toBeCloseTo(large.yPct);
    expect(small.side).toBe(large.side);
  });
});
