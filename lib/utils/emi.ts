export function calcEmi(principal: number, annualRatePct: number, months: number): number {
  if (principal <= 0 || months <= 0) return 0;
  if (annualRatePct === 0) return Math.round(principal / months);
  const r = annualRatePct / 12 / 100;
  return Math.round((principal * r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1));
}
