"use client";

import Image from "next/image";

interface NavProps {
  onLogoClick: () => void;
  right?: React.ReactNode;
}

export default function Nav({ onLogoClick, right }: NavProps) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 24px", height: 48, flexShrink: 0 }}>
      <span onClick={onLogoClick} style={{ cursor: "pointer", display: "flex", alignItems: "center" }}>
        <Image src="/yw-logo.svg" alt="YARD WORK" width={120} height={40} style={{ height: 40, width: "auto" }} priority />
      </span>
      {right}
    </div>
  );
}
