export type TapRect = {
  left: number;
  top: number;
  width: number;
  height: number;
};

export type TapPointPercent = {
  xPct: number;
  yPct: number;
  side: -1 | 0 | 1;
};

const CENTER: TapPointPercent = { xPct: 50, yPct: 56, side: 0 };

export function tapPointToBagPercent(
  point: { x: number; y: number } | null,
  rect: TapRect | null,
): TapPointPercent {
  if (!point || !rect) return CENTER;
  if (rect.width <= 4 || rect.height <= 4) return CENTER;

  const rawX = ((point.x - rect.left) / rect.width) * 100;
  const rawY = ((point.y - rect.top) / rect.height) * 100;

  const xPct = clamp(rawX, 6, 94);
  const yPct = clamp(rawY, 6, 94);
  const side = xPct < 36 ? -1 : xPct > 64 ? 1 : 0;
  return { xPct, yPct, side };
}

function clamp(v: number, lo: number, hi: number): number {
  if (!Number.isFinite(v)) return (lo + hi) / 2;
  if (v < lo) return lo;
  if (v > hi) return hi;
  return v;
}
