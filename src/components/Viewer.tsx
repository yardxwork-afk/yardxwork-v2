"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import * as THREE from "three";
import { BV_MM, MIN_IN } from "@/lib/constants";
import { parseSTL } from "@/lib/stl-parser";
import { autoOrient } from "@/lib/auto-orient";
import { createPrintBed } from "@/lib/print-bed";
import type { ModelData } from "@/lib/types";
import type { ColorOption } from "@/lib/constants";

interface ViewerProps {
  model: ModelData | null;
  scale: number;
  color: ColorOption | null;
  onFile: (data: ModelData | null, err: string | null) => void;
  status: string | null;
  onClear: () => void;
}

export default function Viewer({ model, scale, color, onFile, status, onClear }: ViewerProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const groupRef = useRef<THREE.Group | null>(null);
  const icoRef = useRef<THREE.LineSegments | null>(null);
  const wfRef = useRef<THREE.LineSegments | null>(null);
  const solidRef = useRef<THREE.Mesh | null>(null);
  const orbitRef = useRef({
    theta: Math.PI / 4,
    phi: Math.PI / 5,
    dist: 420,
    target: { x: 0, y: 60, z: 0 },
    dragging: false,
    prevX: 0,
    prevY: 0,
  });
  const [drag, setDrag] = useState(false);

  const updateCamera = useCallback(() => {
    const cam = cameraRef.current;
    if (!cam) return;
    const o = orbitRef.current;
    const t = o.target;
    cam.position.set(
      t.x + o.dist * Math.sin(o.theta) * Math.cos(o.phi),
      t.y + o.dist * Math.sin(o.phi),
      t.z + o.dist * Math.cos(o.theta) * Math.cos(o.phi)
    );
    cam.lookAt(t.x, t.y, t.z);
  }, []);

  // Init Three.js scene
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const w = el.clientWidth, h = el.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);
    sceneRef.current = scene;

    const cam = new THREE.PerspectiveCamera(40, w / h, 1, 2000);
    cameraRef.current = cam;

    const ren = new THREE.WebGLRenderer({ antialias: true });
    ren.setSize(w, h);
    ren.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    ren.shadowMap.enabled = true;
    ren.shadowMap.type = THREE.PCFSoftShadowMap;
    el.appendChild(ren.domElement);
    rendererRef.current = ren;

    updateCamera();

    // Lights
    scene.add(new THREE.AmbientLight(0xffffff, 0.3));
    const dl = new THREE.DirectionalLight(0xffffff, 0.75);
    dl.position.set(200, 400, 200);
    scene.add(dl);
    const dl2 = new THREE.DirectionalLight(0xffffff, 0.2);
    dl2.position.set(-150, 200, -100);
    scene.add(dl2);
    const dl3 = new THREE.DirectionalLight(0xffffff, 0.1);
    dl3.position.set(0, -50, -200);
    scene.add(dl3);

    createPrintBed(scene);

    // Idle icosahedron
    const icoG = new THREE.IcosahedronGeometry(50, 1);
    const icoE = new THREE.EdgesGeometry(icoG);
    const ico = new THREE.LineSegments(icoE, new THREE.LineBasicMaterial({ color: 0x1a1a1a }));
    ico.position.y = 70;
    scene.add(ico);
    icoRef.current = ico;

    // Orbit controls
    const canvas = ren.domElement;
    const o = orbitRef.current;

    const onDown = (e: MouseEvent) => { o.dragging = true; o.prevX = e.clientX; o.prevY = e.clientY; };
    const onMove = (e: MouseEvent) => {
      if (!o.dragging) return;
      const dx = e.clientX - o.prevX, dy = e.clientY - o.prevY;
      o.theta -= dx * 0.005;
      o.phi = Math.max(0.05, Math.min(Math.PI / 2.2, o.phi + dy * 0.005));
      o.prevX = e.clientX; o.prevY = e.clientY;
      updateCamera();
    };
    const onUp = () => { o.dragging = false; };
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      o.dist = Math.max(150, Math.min(900, o.dist + e.deltaY * 0.5));
      updateCamera();
    };
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) { o.dragging = true; o.prevX = e.touches[0].clientX; o.prevY = e.touches[0].clientY; }
    };
    const onTouchMove = (e: TouchEvent) => {
      if (!o.dragging || e.touches.length !== 1) return;
      const dx = e.touches[0].clientX - o.prevX, dy = e.touches[0].clientY - o.prevY;
      o.theta -= dx * 0.005;
      o.phi = Math.max(0.05, Math.min(Math.PI / 2.2, o.phi + dy * 0.005));
      o.prevX = e.touches[0].clientX; o.prevY = e.touches[0].clientY;
      updateCamera();
    };
    const onTouchEnd = () => { o.dragging = false; };

    canvas.addEventListener("mousedown", onDown);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    canvas.addEventListener("wheel", onWheel, { passive: false });
    canvas.addEventListener("touchstart", onTouchStart, { passive: true });
    canvas.addEventListener("touchmove", onTouchMove, { passive: true });
    canvas.addEventListener("touchend", onTouchEnd);

    let af: number;
    const animate = () => {
      af = requestAnimationFrame(animate);
      if (ico.visible) { ico.rotation.y += 0.002; ico.rotation.x += 0.0008; }
      ren.render(scene, cam);
    };
    animate();

    const onResize = () => {
      const nw = el.clientWidth, nh = el.clientHeight;
      cam.aspect = nw / nh;
      cam.updateProjectionMatrix();
      ren.setSize(nw, nh);
    };
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
      canvas.removeEventListener("mousedown", onDown);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      canvas.removeEventListener("wheel", onWheel);
      canvas.removeEventListener("touchstart", onTouchStart);
      canvas.removeEventListener("touchmove", onTouchMove);
      canvas.removeEventListener("touchend", onTouchEnd);
      cancelAnimationFrame(af);
      ren.dispose();
      if (el.contains(ren.domElement)) el.removeChild(ren.domElement);
    };
  }, [updateCamera]);

  // Model changes
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;
    if (groupRef.current) { scene.remove(groupRef.current); groupRef.current = null; }
    wfRef.current = null;
    solidRef.current = null;

    if (!model) { if (icoRef.current) icoRef.current.visible = true; return; }
    if (icoRef.current) icoRef.current.visible = false;

    const geo = model.geometry.clone();
    geo.computeBoundingBox();
    const bb = geo.boundingBox!;
    geo.translate(-(bb.min.x + bb.max.x) / 2, -bb.min.y, -(bb.min.z + bb.max.z) / 2);

    const edgesGeo = new THREE.EdgesGeometry(geo, 25);
    const wf = new THREE.LineSegments(edgesGeo, new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.85 }));
    const solid = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.65, metalness: 0.05 }));
    solid.visible = false;

    const grp = new THREE.Group();
    grp.add(wf);
    grp.add(solid);
    grp.position.y = 1;
    grp.scale.setScalar(model.scaleFactor * scale);
    scene.add(grp);
    groupRef.current = grp;
    wfRef.current = wf;
    solidRef.current = solid;

    const scaledH = (bb.max.y - bb.min.y) * model.scaleFactor * scale;
    orbitRef.current.target = { x: 0, y: Math.max(40, scaledH / 2), z: 0 };
    updateCamera();
  }, [model, updateCamera]);

  // Scale changes
  useEffect(() => {
    if (groupRef.current && model) groupRef.current.scale.setScalar(model.scaleFactor * scale);
  }, [scale, model]);

  // Color changes
  useEffect(() => {
    if (!wfRef.current || !solidRef.current) return;
    if (color) {
      wfRef.current.visible = false;
      solidRef.current.visible = true;
      (solidRef.current.material as THREE.MeshStandardMaterial).color.set(color.hex);
    } else {
      wfRef.current.visible = true;
      solidRef.current.visible = false;
    }
  }, [color]);

  // File handler
  const handleFile = useCallback((file: File) => {
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (ext === "obj" || ext === "3mf") { onFile(null, "." + ext + " support coming soon — upload .stl"); return; }
    if (ext !== "stl") { onFile(null, "unsupported format — upload .stl"); return; }
    if (file.size > 200 * 1024 * 1024) { onFile(null, "file exceeds 200mb — review file guidelines"); return; }
    if (file.size < 84) { onFile(null, "file too small — may be corrupted"); return; }
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const { geometry, volumeMm3 } = parseSTL(e.target!.result as ArrayBuffer);
        let orientDebug = "";
        try {
          orientDebug = autoOrient(geometry);
          console.log("[autoOrient] completed:", orientDebug);
        } catch (orientErr: any) {
          orientDebug = "ORIENT ERROR: " + orientErr.message;
          console.error("[autoOrient] FAILED:", orientErr);
        }
        geometry.computeBoundingBox();
        const bb = geometry.boundingBox!;
        const sx = bb.max.x - bb.min.x, sy = bb.max.y - bb.min.y, sz = bb.max.z - bb.min.z;
        const maxDim = Math.max(sx, sy, sz);
        if (maxDim === 0 || !isFinite(maxDim)) { onFile(null, "could not read geometry — file may be empty"); return; }
        if (maxDim / 25.4 < MIN_IN) { onFile(null, "model below minimum print size — review file guidelines"); return; }
        const sf = BV_MM / maxDim;
        onFile({ fileName: file.name, geometry, volCm3: volumeMm3 / 1000, scaleFactor: sf, maxDimMm: maxDim, orientDebug }, null);
      } catch (err: any) {
        console.error("STL parse error:", err);
        onFile(null, "could not read file — " + (err.message || "unknown error"));
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
    inp.type = "file"; inp.accept = ".stl";
    inp.onchange = (e: any) => { const f = e.target.files[0]; if (f) handleFile(f); };
    inp.click();
  }, [model, handleFile]);

  const statusClass = status
    ? status.includes("failed") || status.includes("exceeds") || status.includes("unsupported") || status.includes("below")
      ? "err" : status.includes("warning") ? "warn" : "ok"
    : "";

  return (
    <div
      ref={wrapRef}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      style={{
        flex: 1, position: "relative", minHeight: 200, overflow: "hidden",
        outline: drag ? "1px solid #333" : "none", outlineOffset: -1,
      }}
    >
      {!model && !status && (
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none", zIndex: 2 }}>
          <span onClick={onClick} style={{
            fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: "#333",
            letterSpacing: ".05em", cursor: "pointer", pointerEvents: "auto",
          }}>
            drop .stl
          </span>
        </div>
      )}
      {status && (
        <div style={{
          position: "absolute", top: 12, left: 16, zIndex: 2,
          fontFamily: "'JetBrains Mono', monospace", fontSize: 11, letterSpacing: ".04em",
          color: statusClass === "err" ? "#FF3030" : statusClass === "warn" ? "#FF9500" : "#666",
        }}>
          {status}
        </div>
      )}
      {model && (
        <button onClick={onClear} style={{
          position: "absolute", top: 12, right: 16, zIndex: 2,
          fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "#333",
          cursor: "pointer", padding: "4px 10px", border: "1px solid #1a1a1a",
          background: "transparent", letterSpacing: ".05em",
        }}>
          new file
        </button>
      )}
    </div>
  );
}
