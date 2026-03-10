"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";
import { createPrintBed } from "@/lib/print-bed";
import { useOrbitControls } from "./useOrbitControls";
import { createModelMeshes, updateModelScale, updateModelColor } from "./ModelRenderer";
import DropZone from "./DropZone";
import type { ModelData } from "@/lib/types";
import type { ColorOption } from "@/lib/constants";
import type { ModelMeshes } from "./ModelRenderer";

interface ViewerCanvasProps {
  model: ModelData | null;
  scale: number;
  color: ColorOption | null;
  onFile: (data: ModelData | null, err: string | null) => void;
  status: string | null;
  onClear: () => void;
}

export default function ViewerCanvas({ model, scale, color, onFile, status, onClear }: ViewerCanvasProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [canvasEl, setCanvasEl] = useState<HTMLCanvasElement | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const icoRef = useRef<THREE.LineSegments | null>(null);
  const meshesRef = useRef<ModelMeshes | null>(null);

  const { orbitRef, updateCamera } = useOrbitControls(canvasEl, cameraRef);

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
    setCanvasEl(ren.domElement);

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

    // Animation loop
    let af: number;
    const animate = () => {
      af = requestAnimationFrame(animate);
      if (ico.visible) { ico.rotation.y += 0.002; ico.rotation.x += 0.0008; }
      ren.render(scene, cam);
    };
    animate();

    // Resize handler
    const onResize = () => {
      const nw = el.clientWidth, nh = el.clientHeight;
      cam.aspect = nw / nh;
      cam.updateProjectionMatrix();
      ren.setSize(nw, nh);
    };
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
      cancelAnimationFrame(af);
      ren.dispose();
      if (el.contains(ren.domElement)) el.removeChild(ren.domElement);
    };
  }, [updateCamera]);

  // Model changes
  const updateModel = useCallback(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    // Remove previous model
    if (meshesRef.current) {
      scene.remove(meshesRef.current.group);
      meshesRef.current = null;
    }

    if (!model) {
      if (icoRef.current) icoRef.current.visible = true;
      return;
    }
    if (icoRef.current) icoRef.current.visible = false;

    const meshes = createModelMeshes(model.geometry, model.scaleFactor, scale);
    scene.add(meshes.group);
    meshesRef.current = meshes;

    // Compute bounding box for camera target
    const geo = model.geometry.clone();
    geo.computeBoundingBox();
    const bb = geo.boundingBox!;
    const scaledH = (bb.max.y - bb.min.y) * model.scaleFactor * scale;
    orbitRef.current.target = { x: 0, y: Math.max(40, scaledH / 2), z: 0 };
    updateCamera();
  }, [model, scale, updateCamera, orbitRef]);

  useEffect(() => { updateModel(); }, [model, updateCamera]); // eslint-disable-line react-hooks/exhaustive-deps

  // Scale changes
  useEffect(() => {
    if (meshesRef.current && model) {
      updateModelScale(meshesRef.current.group, model.scaleFactor, scale);
    }
  }, [scale, model]);

  // Color changes
  useEffect(() => {
    if (meshesRef.current) {
      updateModelColor(meshesRef.current.wireframe, meshesRef.current.solid, color);
    }
  }, [color]);

  return (
    <DropZone model={model} status={status} onFile={onFile} onClear={onClear}>
      <div ref={wrapRef} style={{ width: "100%", height: "100%" }} />
    </DropZone>
  );
}
