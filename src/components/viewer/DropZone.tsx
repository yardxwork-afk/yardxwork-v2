"use client";

import { useState, useCallback } from "react";
import { BV_MM, MIN_IN } from "@/lib/constants";
import { parseSTL } from "@/lib/stl-parser";
import { parseOBJ } from "@/lib/obj-parser";
import { parse3MF } from "@/lib/3mf-parser";
import { autoOrient } from "@/lib/auto-orient";
import type { ParseResult } from "@/lib/stl-parser";
import type { ModelData } from "@/lib/types";

const SUPPORTED_EXTS = ["stl", "obj", "3mf"];

interface DropZoneProps {
  model: ModelData | null;
  status: string | null;
  onFile: (data: ModelData | null, err: string | null) => void;
  onClear: () => void;
  children: React.ReactNode;
}

export default function DropZone({ model, status, onFile, onClear, children }: DropZoneProps) {
  const [drag, setDrag] = useState(false);

  const handleFile = useCallback((file: File) => {
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!ext || !SUPPORTED_EXTS.includes(ext)) {
      onFile(null, "unsupported format — upload .stl, .obj, or .3mf");
      return;
    }
    if (file.size > 200 * 1024 * 1024) { onFile(null, "file exceeds 200mb — review file guidelines"); return; }
    if (ext === "stl" && file.size < 84) { onFile(null, "file too small — may be corrupted"); return; }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const buf = e.target!.result as ArrayBuffer;

        // Route to correct parser
        let result: ParseResult;
        if (ext === "obj") {
          result = parseOBJ(buf);
        } else if (ext === "3mf") {
          result = parse3MF(buf);
        } else {
          result = parseSTL(buf);
        }

        const { geometry, volumeMm3 } = result;

        let orientDebug = "";
        try {
          orientDebug = autoOrient(geometry);
          console.log("[autoOrient] completed:", orientDebug);
        } catch (orientErr: unknown) {
          const msg = orientErr instanceof Error ? orientErr.message : String(orientErr);
          orientDebug = "ORIENT ERROR: " + msg;
          console.error("[autoOrient] FAILED:", orientErr);
        }

        geometry.computeBoundingBox();
        const bb = geometry.boundingBox!;
        const sx = bb.max.x - bb.min.x, sy = bb.max.y - bb.min.y, sz = bb.max.z - bb.min.z;
        const maxDim = Math.max(sx, sy, sz);
        if (maxDim === 0 || !isFinite(maxDim)) { onFile(null, "could not read geometry — file may be empty"); return; }
        if (maxDim / 25.4 < MIN_IN) { onFile(null, "model below minimum print size — review file guidelines"); return; }
        const sf = BV_MM / maxDim;
        onFile({ fileName: file.name, geometry, fileBuffer: buf, volCm3: volumeMm3 / 1000, scaleFactor: sf, maxDimMm: maxDim, orientDebug }, null);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "unknown error";
        console.error("Parse error:", err);
        onFile(null, "could not read file — " + msg);
      }
    };
    reader.onerror = () => { onFile(null, "failed to read file"); };
    reader.readAsArrayBuffer(file);
  }, [onFile]);

  const onDragOver = useCallback((e: React.DragEvent) => { e.preventDefault(); setDrag(true); }, []);
  const onDragLeave = useCallback((e: React.DragEvent) => { e.preventDefault(); setDrag(false); }, []);
  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDrag(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }, [handleFile]);

  const onClick = useCallback(() => {
    if (model) return;
    const inp = document.createElement("input");
    inp.type = "file"; inp.accept = ".stl,.obj,.3mf";
    inp.onchange = (ev: Event) => { const f = (ev.target as HTMLInputElement).files?.[0]; if (f) handleFile(f); };
    inp.click();
  }, [model, handleFile]);

  const statusClass = status
    ? status.includes("failed") || status.includes("exceeds") || status.includes("unsupported") || status.includes("below")
      ? "err" : status.includes("warning") ? "warn" : "ok"
    : "";

  return (
    <div
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      style={{
        flex: 1, position: "relative", minHeight: 200, overflow: "hidden",
        outline: drag ? "1px solid #333" : "none", outlineOffset: -1,
      }}
    >
      {children}
      {!model && !status && (
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none", zIndex: 2 }}>
          <span onClick={onClick} style={{
            fontFamily: "var(--font-mono), monospace", fontSize: 13, color: "#333",
            letterSpacing: ".05em", cursor: "pointer", pointerEvents: "auto",
          }}>
            drop .stl .obj .3mf
          </span>
        </div>
      )}
      {status && (
        <div style={{
          position: "absolute", top: 12, left: 16, zIndex: 2,
          fontFamily: "var(--font-mono), monospace", fontSize: 11, letterSpacing: ".04em",
          color: statusClass === "err" ? "#FF3030" : statusClass === "warn" ? "#FF9500" : "#666",
        }}>
          {status}
        </div>
      )}
      {model && (
        <button onClick={onClear} style={{
          position: "absolute", top: 12, right: 16, zIndex: 2,
          fontFamily: "var(--font-mono), monospace", fontSize: 10, color: "#333",
          cursor: "pointer", padding: "4px 10px", border: "1px solid #1a1a1a",
          background: "transparent", letterSpacing: ".05em",
        }}>
          new file
        </button>
      )}
    </div>
  );
}
