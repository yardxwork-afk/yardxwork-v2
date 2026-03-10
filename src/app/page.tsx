"use client";

import { useState, useCallback } from "react";
import dynamic from "next/dynamic";
import Nav from "@/components/Nav";
import Checkout from "@/components/Checkout";
import Confirmation from "@/components/Confirmation";
import { COLORS, QTYS, DISCOUNTS, SIZES, MIN_IN } from "@/lib/constants";
import { calcPrice } from "@/lib/pricing";
import type { ModelData, PageState, ShippingInfo } from "@/lib/types";
import type { ColorOption } from "@/lib/constants";

// Dynamic import for Viewer (uses Three.js — no SSR)
const Viewer = dynamic(() => import("@/components/Viewer"), { ssr: false });

export default function Home() {
  const [page, setPage] = useState<PageState>("configure");
  const [model, setModel] = useState<ModelData | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [sizeP, setSizeP] = useState<string | null>("L");
  const [scale, setScale] = useState(1);
  const [color, setColor] = useState<ColorOption | null>(null);
  const [qty, setQty] = useState(1);
  const [orderNum, setOrderNum] = useState("");

  const onFile = useCallback((data: ModelData | null, err: string | null) => {
    if (err) { setStatus(err); setModel(null); return; }
    setModel(data); setStatus("ready"); setSizeP("L"); setScale(1); setColor(null); setQty(1);
  }, []);

  const onClear = useCallback(() => {
    setModel(null); setStatus(null); setSizeP("L"); setScale(1); setColor(null); setQty(1);
  }, []);

  const minScale = model ? (MIN_IN * 25.4) / model.maxDimMm : 0.05;

  const doSize = (p: string) => { setSizeP(p); setScale(Math.max(SIZES[p], minScale)); };
  const doSlider = (v: string) => {
    const s = Math.max(parseFloat(v), minScale);
    setScale(s);
    if (Math.abs(s - 0.5) < 0.015) setSizeP("S");
    else if (Math.abs(s - 0.75) < 0.015) setSizeP("M");
    else if (Math.abs(s - 1) < 0.015) setSizeP("L");
    else setSizeP(null);
  };
  const doColor = (c: ColorOption) => setColor((prev) => (prev?.id === c.id ? null : c));

  const pricing = model ? calcPrice(model.volCm3, model.scaleFactor, scale, qty) : null;
  const dimIn = model ? (model.maxDimMm * model.scaleFactor * scale / 25.4).toFixed(1) : "0";
  const canOrder = model && status === "ready" && color;

  const genOrder = () => "YW-" + Math.random().toString(16).slice(2, 7).toUpperCase();

  const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono', monospace" };
  const label: React.CSSProperties = { fontFamily: "'Space Grotesk', sans-serif", fontSize: 10, letterSpacing: ".15em", textTransform: "lowercase", color: "#666", width: 40, flexShrink: 0 };
  const pill = (active: boolean): React.CSSProperties => ({
    ...mono, fontSize: 11, padding: "3px 10px",
    border: `1px solid ${active ? "#FFF" : "#1A1A1A"}`,
    background: "transparent", color: active ? "#FFF" : "#666", cursor: "pointer",
  });

  const handleLogoClick = () => { onClear(); setPage("configure"); };

  if (page === "confirmed" && model && color && pricing) {
    return (
      <div style={{ height: "100vh", display: "flex", flexDirection: "column", background: "#000", color: "#FFF", fontFamily: "'Space Grotesk', sans-serif" }}>
        <Nav onLogoClick={handleLogoClick} />
        <Confirmation orderNum={orderNum} model={model} sizeP={sizeP} color={color} qty={qty} pricing={pricing} onNew={handleLogoClick} />
      </div>
    );
  }

  if (page === "checkout" && model && color && pricing) {
    return (
      <div style={{ height: "100vh", display: "flex", flexDirection: "column", background: "#000", color: "#FFF", fontFamily: "'Space Grotesk', sans-serif" }}>
        <Nav
          onLogoClick={handleLogoClick}
          right={
            <span onClick={() => setPage("configure")} style={{ ...mono, fontSize: 11, color: "#666", cursor: "pointer", padding: "6px 14px", border: "1px solid #1A1A1A" }}>← back</span>
          }
        />
        <Checkout model={model} sizeP={sizeP} color={color} qty={qty} pricing={pricing}
          onConfirm={() => { setOrderNum(genOrder()); setPage("confirmed"); }} />
      </div>
    );
  }

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", background: "#000", color: "#FFF", fontFamily: "'Space Grotesk', sans-serif", overflow: "hidden" }}>
      <Nav
        onLogoClick={handleLogoClick}
        right={
          canOrder && pricing ? (
            <span onClick={() => setPage("checkout")} style={{ ...mono, fontSize: 11, color: "#666", cursor: "pointer", padding: "6px 14px", border: "1px solid #1A1A1A" }}>
              cart · ${pricing.total.toFixed(2)}
            </span>
          ) : null
        }
      />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
        <Viewer model={model} scale={scale} color={color} onFile={onFile} status={status} onClear={onClear} />

        {/* Controls */}
        <div style={{
          padding: "12px 24px", display: "flex", flexDirection: "column", gap: 10,
          borderTop: "1px solid #1A1A1A", flexShrink: 0,
          opacity: model ? 1 : 0.25, pointerEvents: model ? "auto" : "none",
        }}>
          {/* Size */}
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={label}>size</span>
            <div style={{ display: "flex", gap: 6 }}>
              {Object.keys(SIZES).map((p) => (
                <button key={p} onClick={() => doSize(p)} style={pill(sizeP === p)}>{p.toLowerCase()}</button>
              ))}
            </div>
            <input type="range" min={minScale.toFixed(3)} max="1" step=".005" value={scale}
              onChange={(e) => doSlider(e.target.value)}
              style={{ flex: 1, maxWidth: 180, height: 1, background: "#333", WebkitAppearance: "none", outline: "none", cursor: "pointer" }} />
            <span style={{ ...mono, fontSize: 11, minWidth: 40 }}>{dimIn}&quot;</span>
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
                <button key={q} onClick={() => setQty(q)} style={pill(qty === q)}>{q}</button>
              ))}
            </div>
            {pricing && pricing.disc > 0 && (
              <span style={{ ...mono, fontSize: 9, color: "#666" }}>-{(pricing.disc * 100).toFixed(0)}%</span>
            )}
          </div>
        </div>

        {/* Pricing bar */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "12px 24px", borderTop: "1px solid #1A1A1A", flexShrink: 0, gap: 16,
        }}>
          <span style={{ ...mono, fontSize: 15, fontWeight: 500 }}>
            {pricing ? `$${pricing.total.toFixed(2)}` : "—"}
          </span>
          <span style={{ ...mono, fontSize: 11, color: "#666" }}>ships 3-5d</span>
          <button disabled={!canOrder} onClick={() => setPage("checkout")}
            style={{
              ...mono, fontSize: 11, letterSpacing: ".08em", padding: "8px 20px",
              border: `1px solid ${canOrder ? "#FFF" : "#333"}`,
              background: "transparent", color: canOrder ? "#FFF" : "#333",
              cursor: canOrder ? "pointer" : "not-allowed", whiteSpace: "nowrap",
            }}>
            order →
          </button>
        </div>
      </div>
    </div>
  );
}
