"use client";

interface SuccessContentProps {
  fileName: string;
  sizePreset: string;
  colorName: string;
  qty: number;
  totalPrice: string;
  discount: number;
  customerEmail: string;
  sessionId: string;
}

export default function SuccessContent({
  fileName, sizePreset, colorName, qty, totalPrice, discount, customerEmail, sessionId,
}: SuccessContentProps) {
  const mono: React.CSSProperties = { fontFamily: "var(--font-mono), monospace" };
  const orderRef = "YW-" + sessionId.slice(-6).toUpperCase();

  return (
    <div style={{ minHeight: "100dvh", background: "#000", color: "#FFF" }}>
      {/* Nav */}
      <nav style={{
        display: "flex", alignItems: "center", height: 48,
        padding: "0 var(--pad-x, 16px)", borderBottom: "1px solid #0A0A0A",
      }}>
        <a href="/" style={{ display: "flex", alignItems: "center", cursor: "pointer" }}>
          <img src="/yw-logo.svg" alt="YARD WORK" style={{ height: 40, width: "auto" }} />
        </a>
      </nav>

      {/* Content */}
      <div style={{ maxWidth: 520, margin: "0 auto", padding: "80px var(--pad-x, 16px)", textAlign: "center" }}>
        <div style={{ ...mono, fontSize: 12, color: "#666", letterSpacing: ".1em", marginBottom: 24 }}>
          order confirmed
        </div>
        <div style={{ ...mono, fontSize: 18, marginBottom: 8, letterSpacing: ".05em" }}>
          {orderRef}
        </div>
        <div style={{ ...mono, fontSize: 11, color: "#666", marginBottom: 4 }}>
          {fileName}
        </div>
        <div style={{ ...mono, fontSize: 11, color: "#666", marginBottom: 4 }}>
          {sizePreset} · {colorName} · qty {qty}
          {discount > 0 && ` · -${(discount * 100).toFixed(0)}%`}
        </div>
        <div style={{ ...mono, fontSize: 14, marginTop: 8 }}>
          ${totalPrice}
        </div>
        {customerEmail && (
          <div style={{ ...mono, fontSize: 11, color: "#666", marginTop: 8 }}>
            receipt sent to {customerEmail} by stripe
          </div>
        )}
        <div style={{ ...mono, fontSize: 11, color: "#333", marginTop: 24, marginBottom: 32 }}>
          your order is being printed at Yard Work
        </div>
        <a href="/" style={{
          ...mono, fontSize: 11, letterSpacing: ".08em", padding: "10px 24px",
          border: "1px solid #1A1A1A", background: "transparent", color: "#666",
          cursor: "pointer", textDecoration: "none", display: "inline-block",
        }}>
          start new order →
        </a>
      </div>
    </div>
  );
}
