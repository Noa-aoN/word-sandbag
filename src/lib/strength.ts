// パンチ強度 (strength) は kind や着弾位置を変えず、
// 凹みサイズ・効果音・揺れ幅だけを底上げする倍率の集合体。
//   弱め (~0.7)  → power 据え置き、揺れ 0.7x、凹み 0.7x
//   ふつう (~1.0) → 既定 (倍率 1.0)
//   強め (~1.4)  → power +1段、揺れ 1.3x、凹み 1.3x
//   全力 (~1.8)  → power +2段、揺れ 1.6x、凹み 1.6x

export function strengthBumps(s: number): number {
  if (s >= 1.65) return 2;
  if (s >= 1.25) return 1;
  return 0;
}

export function strengthIntensityMul(s: number): number {
  if (s >= 1.65) return 1.6;
  if (s >= 1.25) return 1.3;
  if (s >= 0.85) return 1.0;
  return 0.7;
}

export function strengthDentMul(s: number): number {
  if (s >= 1.65) return 1.6;
  if (s >= 1.25) return 1.3;
  if (s >= 0.85) return 1.0;
  return 0.7;
}
