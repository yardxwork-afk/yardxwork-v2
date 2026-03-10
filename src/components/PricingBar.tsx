"use client";

import { useOrder } from "@/context/OrderContext";

const mono: React.CSSProperties = { fontFamily: "var(--font-mono), monospace" };

export default function PricingBar() {
  const { dispatch, pricing, canOrder } = useOrder();

  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "12px var(--pad-x)", borderTop: "1px solid #1A1A1A", flexShrink: 0, gap: 16,
    }}>
      <span style={{ ...mono, fontSize: 15, fontWeight: 500 }}>
        {pricing ? `$${pricing.total.toFixed(2)}` : "—"}
      </span>
      <span style={{ ...mono, fontSize: 11, color: "#666" }}>ships 3-5d</span>
      <button disabled={!canOrder} onClick={() => dispatch({ type: "SET_PAGE", page: "checkout" })}
        style={{
          ...mono, fontSize: 11, letterSpacing: ".08em", padding: "8px 20px",
          border: `1px solid ${canOrder ? "#FFF" : "#333"}`,
          background: "transparent", color: canOrder ? "#FFF" : "#333",
          cursor: canOrder ? "pointer" : "not-allowed", whiteSpace: "nowrap",
        }}>
        order →
      </button>
    </div>
  );
}
