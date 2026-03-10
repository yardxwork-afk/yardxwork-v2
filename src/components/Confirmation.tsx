"use client";

import type { ModelData } from "@/lib/types";
import type { ColorOption } from "@/lib/constants";
import type { PricingResult } from "@/lib/pricing";

interface ConfirmationProps {
  orderNum: string;
  model: ModelData;
  sizeP: string | null;
  color: ColorOption;
  qty: number;
  pricing: PricingResult;
  onNew: () => void;
}

export default function Confirmation({ orderNum, model, sizeP, color, qty, pricing, onNew }: ConfirmationProps) {
  const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono', monospace" };
  return (
    <div style={{ maxWidth: 520, margin: "0 auto", padding: "80px 24px", textAlign: "center" }}>
      <div style={{ ...mono, fontSize: 12, color: "#666", letterSpacing: ".1em", marginBottom: 24 }}>order confirmed</div>
      <div style={{ ...mono, fontSize: 18, marginBottom: 8, letterSpacing: ".05em" }}>{orderNum}</div>
      <div style={{ ...mono, fontSize: 11, color: "#666", marginBottom: 4 }}>{model.fileName}</div>
      <div style={{ ...mono, fontSize: 11, color: "#666", marginBottom: 4 }}>{sizeP || "custom"} · {color.name} · qty {qty}</div>
      <div style={{ ...mono, fontSize: 14, marginTop: 8 }}>${pricing.total.toFixed(2)}</div>
      <div style={{ ...mono, fontSize: 11, color: "#333", marginTop: 24, marginBottom: 32 }}>your order is being printed at Yard Work</div>
      <button onClick={onNew} style={{
        ...mono, fontSize: 11, letterSpacing: ".08em", padding: "10px 24px",
        border: "1px solid #1A1A1A", background: "transparent", color: "#666", cursor: "pointer",
      }}>
        start new order →
      </button>
    </div>
  );
}
