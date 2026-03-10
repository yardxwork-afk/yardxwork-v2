"use client";

/** Loading placeholder shown while Three.js viewer initializes */
export default function ViewerSkeleton() {
  return (
    <div style={{
      flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
      background: "#000", minHeight: 200,
    }}>
      <div style={{
        fontFamily: "var(--font-mono), monospace", fontSize: 11,
        color: "#1A1A1A", letterSpacing: ".1em",
        animation: "pulse 1.5s ease-in-out infinite",
      }}>
        loading viewer
        <style>{`@keyframes pulse { 0%, 100% { opacity: 0.3; } 50% { opacity: 1; } }`}</style>
      </div>
    </div>
  );
}
