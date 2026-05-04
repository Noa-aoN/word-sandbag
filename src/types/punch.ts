export type PunchPower = "light" | "normal" | "heavy";

export type PunchKind = "punch" | "cat" | "crunch";

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
