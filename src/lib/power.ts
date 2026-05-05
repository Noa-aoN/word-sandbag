import type { PunchPower } from "../types/punch";

export function classifyPower(text: string): PunchPower {
  const len = text.length;
  if (len <= 10) return "light";
  if (len <= 40) return "normal";
  return "heavy";
}

export function bumpPower(power: PunchPower): PunchPower {
  if (power === "light") return "normal";
  if (power === "normal") return "heavy";
  return "heavy";
}

const EMPHASIS_REGEX = /[!?！？]/gu;

export function isEmphasized(text: string): boolean {
  const matches = text.match(EMPHASIS_REGEX);
  return (matches?.length ?? 0) >= 3;
}
