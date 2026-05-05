export type PunchPower = "light" | "normal" | "heavy";

export type PunchKind = "punch" | "cat" | "crunch" | "hook" | "upper";

export type ImpactKind = PunchKind | "tap";

export type FlyingWord = {
  id: string;
  text: string;
  power: PunchPower;
  kind: PunchKind;
  emphasized: boolean;
  speed: number;
  createdAt: number;
};
