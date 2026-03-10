export const COLORS = [
  { id: "green", name: "Green", hex: "#22C55E" },
  { id: "dark-blue", name: "Dark Blue", hex: "#1E3A8A" },
  { id: "light-blue", name: "Light Blue", hex: "#38BDF8" },
  { id: "yellow", name: "Yellow", hex: "#EAB308" },
  { id: "red", name: "Red", hex: "#EF4444" },
  { id: "pink", name: "Pink", hex: "#EC4899" },
  { id: "white", name: "White", hex: "#F5F5F5" },
  { id: "black", name: "Black", hex: "#1A1A1A" },
] as const;

export type ColorOption = (typeof COLORS)[number];

export const QTYS = [1, 5, 10, 25, 50] as const;
export const DISCOUNTS: Record<number, number> = { 1: 0, 5: 0.1, 10: 0.15, 25: 0.25, 50: 0.35 };
export const SIZES: Record<string, number> = { S: 0.5, M: 0.75, L: 1 };
export const BV_MM = 256;
export const MIN_IN = 0.5;
