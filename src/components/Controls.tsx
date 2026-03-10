"use client";

import { useOrder } from "@/context/OrderContext";
import { COLORS, QTYS, SIZES } from "@/lib/constants";

const mono: React.CSSProperties = { fontFamily: "var(--font-mono), monospace" };
const label: React.CSSProperties = { fontFamily: "var(--font-body), sans-serif", fontSize: 10, letterSpacing: ".15em", textTransform: "lowercase", color: "#666", width: 40, flexShrink: 0 };
const pill = (active: boolean): React.CSSProperties => ({
  ...mono, fontSize: 11, padding: "3px 10px",
  border: `1px solid ${active ? "#FFF" : "#1A1A1A"}`,
  background: "transparent", color: active ? "#FFF" : "#666", cursor: "pointer",
});

export default function Controls() {
  const { state, dispatch, doSize, doSlider, doColor, pricing, dimIn, minScale } = useOrder();
  const { model, sizePreset, scale, color, qty } = state;

  return (
    <div className="controls-row" style={{
      padding: "12px var(--pad-x)", display: "flex", flexDirection: "column", gap: 10,
      borderTop: "1px solid #1A1A1A", flexShrink: 0,
      opacity: model ? 1 : 0.25, pointerEvents: model ? "auto" : "none",
    }}>
      {/* Size */}
      <div className="size-row" style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <span style={label}>size</span>
        <div style={{ display: "flex", gap: 6 }}>
          {Object.keys(SIZES).map((p) => (
            <button key={p} className="pill-btn" onClick={() => doSize(p)} style={pill(sizePreset === p)}>{p.toLowerCase()}</button>
          ))}
        </div>
        <input className="size-slider" type="range" min={minScale.toFixed(3)} max="1" step=".005" value={scale}
          onChange={(e) => doSlider(e.target.value)}
          style={{ flex: 1, maxWidth: 180, height: 1, background: "#333", WebkitAppearance: "none", outline: "none", cursor: "pointer" }} />
        <span className="size-dim" style={{ ...mono, fontSize: 11, minWidth: 40 }}>{dimIn}&quot;</span>
      </div>

      {/* Color */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <span style={label}>color</span>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {COLORS.map((c) => (
            <button key={c.id} onClick={() => doColor(c)} title={c.name}
              style={{
                width: 22, height: 22, borderRadius: "50%", cursor: "pointer",
                backgroundColor: c.hex, outline: "none",
                border: c.id === "white" || c.id === "black" ? "1px solid #333" : "2px solid transparent",
                boxShadow: color?.id === c.id ? `0 0 0 2px #000, 0 0 0 3.5px #FFF` : "none",
              }} />
          ))}
        </div>
      </div>

      {/* Qty */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <span style={label}>qty</span>
        <div style={{ display: "flex", gap: 6 }}>
          {QTYS.map((q) => (
            <button key={q} className="pill-btn" onClick={() => dispatch({ type: "SET_QTY", qty: q })} style={pill(qty === q)}>{q}</button>
          ))}
        </div>
        {pricing && pricing.disc > 0 && (
          <span style={{ ...mono, fontSize: 9, color: "#666" }}>-{(pricing.disc * 100).toFixed(0)}%</span>
        )}
      </div>
    </div>
  );
}
