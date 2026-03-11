"use client";

import { useState } from "react";
import type { ModelData, ShippingInfo } from "@/lib/types";
import type { ColorOption } from "@/lib/constants";
import type { PricingResult } from "@/lib/pricing";

interface CheckoutProps {
  model: ModelData;
  sizeP: string | null;
  scale: number;
  color: ColorOption;
  qty: number;
  pricing: PricingResult;
}

export default function Checkout({ model, sizeP, scale, color, qty, pricing }: CheckoutProps) {
  const [s, setS] = useState<ShippingInfo>({ name: "", email: "", address: "", city: "", state: "", zip: "" });
  const [errs, setErrs] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const upd = (k: keyof ShippingInfo, v: string) => setS((p) => ({ ...p, [k]: v }));

  const submit = async () => {
    const e: Record<string, number> = {};
    if (!s.name.trim()) e.name = 1;
    if (!s.email.trim() || !s.email.includes("@")) e.email = 1;
    if (!s.address.trim()) e.address = 1;
    if (!s.city.trim()) e.city = 1;
    if (!s.state.trim()) e.state = 1;
    if (!s.zip.trim()) e.zip = 1;
    setErrs(e);
    if (Object.keys(e).length) return;

    setLoading(true);
    setApiError(null);
    try {
      // 1. Upload file to R2
      const form = new FormData();
      form.append("file", new Blob([model.fileBuffer]), model.fileName);
      const upRes = await fetch("/api/upload", { method: "POST", body: form });
      const upData = await upRes.json();
      if (!upRes.ok || !upData.key) {
        setApiError(upData.error || "file upload failed");
        setLoading(false);
        return;
      }

      // 2. Create Stripe checkout session
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: model.fileName,
          fileKey: upData.key,
          volCm3: model.volCm3,
          scaleFactor: model.scaleFactor,
          maxDimMm: model.maxDimMm,
          sizePreset: sizeP || "custom",
          scale,
          colorId: color.id,
          colorName: color.name,
          qty,
          shipping: s,
        }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setApiError(data.error || "something went wrong");
        setLoading(false);
      }
    } catch {
      setApiError("network error — please try again");
      setLoading(false);
    }
  };

  const inp = (label: string, key: keyof ShippingInfo, extra: React.CSSProperties = {}) => (
    <div style={{ display: "flex", flexDirection: "column", gap: 3, flex: 1, ...extra }}>
      <label style={{ fontSize: 10, letterSpacing: ".08em", textTransform: "lowercase", color: "#666" }}>{label}</label>
      <input
        value={s[key]}
        onChange={(e) => upd(key, e.target.value)}
        style={{
          fontFamily: "var(--font-mono), monospace", fontSize: 12, padding: "8px 10px",
          background: "#0A0A0A", border: `1px solid ${errs[key] ? "#FF3030" : "#1A1A1A"}`,
          color: "#FFF", outline: "none",
        }}
        {...(key === "state" ? { maxLength: 2 } : {})}
        {...(key === "email" ? { type: "email" as const } : {})}
      />
    </div>
  );

  return (
    <div style={{ maxWidth: 520, margin: "0 auto", padding: "32px var(--pad-x)", overflowY: "auto", height: "calc(100dvh - 48px)" }}>
      <div style={{ fontSize: 10, letterSpacing: ".15em", textTransform: "uppercase", color: "#666", marginBottom: 14 }}>order summary</div>
      <div style={{ border: "1px solid #1A1A1A", padding: 16, marginBottom: 28 }}>
        <div style={{ fontFamily: "var(--font-mono), monospace", fontSize: 12, marginBottom: 3 }}>{model.fileName}</div>
        <div style={{ fontFamily: "var(--font-mono), monospace", fontSize: 10, color: "#666", marginBottom: 10 }}>
          {sizeP || "custom"} · {color.name} · qty {qty}{pricing.disc > 0 && ` · -${(pricing.disc * 100).toFixed(0)}%`}
        </div>
        <div style={{ fontFamily: "var(--font-mono), monospace", fontSize: 15, textAlign: "right" }}>${pricing.total.toFixed(2)}</div>
      </div>

      <div style={{ fontSize: 10, letterSpacing: ".15em", textTransform: "uppercase", color: "#666", marginBottom: 14 }}>shipping</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 28 }}>
        {inp("full name", "name")}
        {inp("email", "email")}
        {inp("street address", "address")}
        <div className="checkout-addr-row" style={{ display: "flex", gap: 14 }}>
          {inp("city", "city")}
          {inp("state", "state", { maxWidth: 72 })}
          {inp("zip", "zip", { maxWidth: 110 })}
        </div>
      </div>

      {apiError && (
        <div style={{ fontFamily: "var(--font-mono), monospace", fontSize: 11, color: "#FF3030", marginBottom: 12 }}>
          {apiError}
        </div>
      )}

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, paddingTop: 20, borderTop: "1px solid #1A1A1A", flexWrap: "wrap" }}>
        <div>
          <span style={{ fontFamily: "var(--font-mono), monospace", fontSize: 15, fontWeight: 500 }}>${pricing.total.toFixed(2)}</span>
          <span style={{ fontFamily: "var(--font-mono), monospace", fontSize: 11, color: "#666", marginLeft: 20 }}>ships 3-5d</span>
        </div>
        <button onClick={submit} disabled={loading} style={{
          fontFamily: "var(--font-mono), monospace", fontSize: 11, letterSpacing: ".08em",
          padding: "10px 28px", border: "1px solid #FFF",
          background: loading ? "#333" : "#FFF", color: loading ? "#999" : "#000",
          cursor: loading ? "wait" : "pointer", opacity: loading ? 0.7 : 1,
        }}>
          {loading ? "uploading\u2026" : "pay with stripe \u2192"}
        </button>
      </div>
    </div>
  );
}
