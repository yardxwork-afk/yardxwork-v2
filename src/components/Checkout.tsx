"use client";

import { useState } from "react";
import type { ModelData, ShippingInfo } from "@/lib/types";
import type { ColorOption } from "@/lib/constants";
import type { PricingResult } from "@/lib/pricing";

interface CheckoutProps {
  model: ModelData;
  sizeP: string | null;
  color: ColorOption;
  qty: number;
  pricing: PricingResult;
  onConfirm: (info: ShippingInfo) => void;
}

export default function Checkout({ model, sizeP, color, qty, pricing, onConfirm }: CheckoutProps) {
  const [s, setS] = useState<ShippingInfo>({ name: "", email: "", address: "", city: "", state: "", zip: "" });
  const [errs, setErrs] = useState<Record<string, number>>({});
  const upd = (k: keyof ShippingInfo, v: string) => setS((p) => ({ ...p, [k]: v }));

  const submit = () => {
    const e: Record<string, number> = {};
    if (!s.name.trim()) e.name = 1;
    if (!s.email.trim() || !s.email.includes("@")) e.email = 1;
    if (!s.address.trim()) e.address = 1;
    if (!s.city.trim()) e.city = 1;
    if (!s.state.trim()) e.state = 1;
    if (!s.zip.trim()) e.zip = 1;
    setErrs(e);
    if (!Object.keys(e).length) onConfirm(s);
  };

  const inp = (label: string, key: keyof ShippingInfo, extra: React.CSSProperties = {}) => (
    <div style={{ display: "flex", flexDirection: "column", gap: 3, flex: 1, ...extra }}>
      <label style={{ fontSize: 10, letterSpacing: ".08em", textTransform: "lowercase", color: "#666" }}>{label}</label>
      <input
        value={s[key]}
        onChange={(e) => upd(key, e.target.value)}
        style={{
          fontFamily: "'JetBrains Mono', monospace", fontSize: 12, padding: "8px 10px",
          background: "#0A0A0A", border: `1px solid ${errs[key] ? "#FF3030" : "#1A1A1A"}`,
          color: "#FFF", outline: "none",
        }}
        {...(key === "state" ? { maxLength: 2 } : {})}
        {...(key === "email" ? { type: "email" as const } : {})}
      />
    </div>
  );

  return (
    <div style={{ maxWidth: 520, margin: "0 auto", padding: "32px 24px", overflowY: "auto", height: "calc(100vh - 48px)" }}>
      <div style={{ fontSize: 10, letterSpacing: ".15em", textTransform: "uppercase", color: "#666", marginBottom: 14 }}>order summary</div>
      <div style={{ border: "1px solid #1A1A1A", padding: 16, marginBottom: 28 }}>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, marginBottom: 3 }}>{model.fileName}</div>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "#666", marginBottom: 10 }}>
          {sizeP || "custom"} · {color.name} · qty {qty}{pricing.disc > 0 && ` · -${(pricing.disc * 100).toFixed(0)}%`}
        </div>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 15, textAlign: "right" }}>${pricing.total.toFixed(2)}</div>
      </div>

      <div style={{ fontSize: 10, letterSpacing: ".15em", textTransform: "uppercase", color: "#666", marginBottom: 14 }}>shipping</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 28 }}>
        {inp("full name", "name")}
        {inp("email", "email")}
        {inp("street address", "address")}
        <div style={{ display: "flex", gap: 14 }}>
          {inp("city", "city")}
          {inp("state", "state", { maxWidth: 72 })}
          {inp("zip", "zip", { maxWidth: 110 })}
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 20, borderTop: "1px solid #1A1A1A" }}>
        <div>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 15, fontWeight: 500 }}>${pricing.total.toFixed(2)}</span>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "#666", marginLeft: 20 }}>ships 3-5d</span>
        </div>
        <button onClick={submit} style={{
          fontFamily: "'JetBrains Mono', monospace", fontSize: 11, letterSpacing: ".08em",
          padding: "10px 28px", border: "1px solid #FFF", background: "#FFF", color: "#000", cursor: "pointer",
        }}>
          pay with stripe →
        </button>
      </div>
    </div>
  );
}
