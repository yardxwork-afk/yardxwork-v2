"use client";

import dynamic from "next/dynamic";
import Nav from "@/components/Nav";
import Controls from "@/components/Controls";
import PricingBar from "@/components/PricingBar";
import Checkout from "@/components/Checkout";
import Confirmation from "@/components/Confirmation";
import ErrorBoundary from "@/components/ErrorBoundary";
import { OrderProvider, useOrder } from "@/context/OrderContext";
import ViewerSkeleton from "@/components/viewer/ViewerSkeleton";

// Dynamic import for ViewerCanvas (uses Three.js — no SSR)
const Viewer = dynamic(() => import("@/components/viewer/ViewerCanvas"), {
  ssr: false,
  loading: () => <ViewerSkeleton />,
});

const mono: React.CSSProperties = { fontFamily: "var(--font-mono), monospace" };

function HomeContent() {
  const {
    state, dispatch,
    onFile, onClear, handleLogoClick,
    pricing, canOrder,
  } = useOrder();
  const { page, model, status, scale, color, qty, orderNum, sizePreset } = state;

  const shell: React.CSSProperties = { height: "100dvh", display: "flex", flexDirection: "column", background: "#000", color: "#FFF" };

  if (page === "confirmed" && model && color && pricing) {
    return (
      <div style={shell}>
        <Nav onLogoClick={handleLogoClick} />
        <Confirmation orderNum={orderNum} model={model} sizeP={sizePreset} color={color} qty={qty} pricing={pricing} onNew={handleLogoClick} />
      </div>
    );
  }

  if (page === "checkout" && model && color && pricing) {
    return (
      <div style={shell}>
        <Nav
          onLogoClick={handleLogoClick}
          right={
            <span onClick={() => dispatch({ type: "SET_PAGE", page: "configure" })} style={{ ...mono, fontSize: 11, color: "#666", cursor: "pointer", padding: "6px 14px", border: "1px solid #1A1A1A" }}>← back</span>
          }
        />
        <Checkout model={model} sizeP={sizePreset} scale={scale} color={color} qty={qty} pricing={pricing} />
      </div>
    );
  }

  return (
    <div style={{ ...shell, overflow: "hidden" }}>
      <Nav
        onLogoClick={handleLogoClick}
        right={
          canOrder && pricing ? (
            <span onClick={() => dispatch({ type: "SET_PAGE", page: "checkout" })} style={{ ...mono, fontSize: 11, color: "#666", cursor: "pointer", padding: "6px 14px", border: "1px solid #1A1A1A" }}>
              cart · ${pricing.total.toFixed(2)}
            </span>
          ) : null
        }
      />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
        <ErrorBoundary>
          <Viewer model={model} scale={scale} color={color} onFile={onFile} status={status} onClear={onClear} />
        </ErrorBoundary>
        <Controls />
        <PricingBar />
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <OrderProvider>
      <HomeContent />
    </OrderProvider>
  );
}
