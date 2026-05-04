export type PunchPower = "light" | "normal" | "heavy";

export type FlyingWord = {
  id: string;
  text: string;
  power: PunchPower;
  emphasized: boolean;
  createdAt: number;
};
