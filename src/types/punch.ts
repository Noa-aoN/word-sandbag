export type PunchPower = "light" | "normal" | "heavy";

export type PunchKind = "punch" | "cat" | "crunch" | "hook" | "upper" | "kick";

export type ImpactKind = PunchKind | "tap";

export type BagState = "active" | "departing" | "missing";

export type FlyingWord = {
  id: string;
  text: string;
  power: PunchPower;
  kind: PunchKind;
  emphasized: boolean;
  speed: number;
  side?: -1 | 1;
  createdAt: number;
};
