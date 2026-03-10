import { DISCOUNTS } from "./constants";

const BASE_FEE = 20;
const CHARGE_G = 0.06;
const PLA_DENS = 1.24;
const MAT_MULT = 0.35;
const SUPPORT_MULT = 0.15;

export interface PricingResult {
  unit: number;
  total: number;
  grams: number;
  disc: number;
}

export function calcPrice(
  volCm3: number,
  scaleFactor: number,
  scale: number,
  qty: number
): PricingResult {
  const printScale = scaleFactor * scale;
  const sv = volCm3 * Math.pow(printScale, 3);
  const baseGrams = sv * PLA_DENS * MAT_MULT;
  const supportGrams = baseGrams * SUPPORT_MULT;
  const grams = baseGrams + supportGrams;
  const matCharge = grams * CHARGE_G;
  const unit = BASE_FEE + matCharge;
  const disc = DISCOUNTS[qty] || 0;
  const total = unit * qty * (1 - disc);
  return { unit, total: Math.max(total, BASE_FEE), grams, disc };
}
