import { useRef, useCallback, useEffect } from "react";
import type * as THREE from "three";

export interface OrbitState {
  theta: number;
  phi: number;
  dist: number;
  target: { x: number; y: number; z: number };
  dragging: boolean;
  prevX: number;
  prevY: number;
  pinchDist: number; // distance between two fingers at pinch start (0 = not pinching)
}

const INITIAL_ORBIT: OrbitState = {
  theta: Math.PI / 4,
  phi: Math.PI / 5,
  dist: 420,
  target: { x: 0, y: 60, z: 0 },
  dragging: false,
  prevX: 0,
  prevY: 0,
  pinchDist: 0,
};

const PHI_MIN = 0.05;
const PHI_MAX = Math.PI / 2.2;
const DIST_MIN = 150;
const DIST_MAX = 900;
const DRAG_SENSITIVITY = 0.005;
const PINCH_SENSITIVITY = 1.5; // multiplier: how quickly pinch affects zoom

/** Euclidean distance between two touch points */
function touchDist(a: Touch, b: Touch): number {
  const dx = a.clientX - b.clientX;
  const dy = a.clientY - b.clientY;
  return Math.sqrt(dx * dx + dy * dy);
}

export function useOrbitControls(
  canvas: HTMLCanvasElement | null,
  cameraRef: React.RefObject<THREE.PerspectiveCamera | null>,
) {
  const orbitRef = useRef<OrbitState>({ ...INITIAL_ORBIT });

  const updateCamera = useCallback(() => {
    const cam = cameraRef.current;
    if (!cam) return;
    const o = orbitRef.current;
    const t = o.target;
    cam.position.set(
      t.x + o.dist * Math.sin(o.theta) * Math.cos(o.phi),
      t.y + o.dist * Math.sin(o.phi),
      t.z + o.dist * Math.cos(o.theta) * Math.cos(o.phi),
    );
    cam.lookAt(t.x, t.y, t.z);
  }, [cameraRef]);

  useEffect(() => {
    if (!canvas) return;
    const o = orbitRef.current;

    const onDown = (e: MouseEvent) => { o.dragging = true; o.prevX = e.clientX; o.prevY = e.clientY; };
    const onMove = (e: MouseEvent) => {
      if (!o.dragging) return;
      const dx = e.clientX - o.prevX, dy = e.clientY - o.prevY;
      o.theta -= dx * DRAG_SENSITIVITY;
      o.phi = Math.max(PHI_MIN, Math.min(PHI_MAX, o.phi + dy * DRAG_SENSITIVITY));
      o.prevX = e.clientX; o.prevY = e.clientY;
      updateCamera();
    };
    const onUp = () => { o.dragging = false; };
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      o.dist = Math.max(DIST_MIN, Math.min(DIST_MAX, o.dist + e.deltaY * 0.5));
      updateCamera();
    };

    // Touch: single-finger orbit + two-finger pinch-to-zoom
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        // Start pinch — record initial finger distance, stop orbiting
        o.dragging = false;
        o.pinchDist = touchDist(e.touches[0], e.touches[1]);
      } else if (e.touches.length === 1) {
        o.dragging = true;
        o.pinchDist = 0;
        o.prevX = e.touches[0].clientX;
        o.prevY = e.touches[0].clientY;
      }
    };
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2 && o.pinchDist > 0) {
        // Pinch-to-zoom: prevent page zoom, map delta to camera distance
        e.preventDefault();
        const newDist = touchDist(e.touches[0], e.touches[1]);
        const delta = (o.pinchDist - newDist) * PINCH_SENSITIVITY;
        o.dist = Math.max(DIST_MIN, Math.min(DIST_MAX, o.dist + delta));
        o.pinchDist = newDist;
        updateCamera();
        return;
      }
      if (!o.dragging || e.touches.length !== 1) return;
      const dx = e.touches[0].clientX - o.prevX, dy = e.touches[0].clientY - o.prevY;
      o.theta -= dx * DRAG_SENSITIVITY;
      o.phi = Math.max(PHI_MIN, Math.min(PHI_MAX, o.phi + dy * DRAG_SENSITIVITY));
      o.prevX = e.touches[0].clientX; o.prevY = e.touches[0].clientY;
      updateCamera();
    };
    const onTouchEnd = (e: TouchEvent) => {
      if (e.touches.length < 2) o.pinchDist = 0;
      if (e.touches.length === 0) o.dragging = false;
      // If one finger remains after pinch, reset orbit tracking
      if (e.touches.length === 1) {
        o.dragging = true;
        o.prevX = e.touches[0].clientX;
        o.prevY = e.touches[0].clientY;
      }
    };

    canvas.addEventListener("mousedown", onDown);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    canvas.addEventListener("wheel", onWheel, { passive: false });
    canvas.addEventListener("touchstart", onTouchStart, { passive: true });
    canvas.addEventListener("touchmove", onTouchMove, { passive: false }); // non-passive to allow preventDefault on pinch
    canvas.addEventListener("touchend", onTouchEnd);

    return () => {
      canvas.removeEventListener("mousedown", onDown);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      canvas.removeEventListener("wheel", onWheel);
      canvas.removeEventListener("touchstart", onTouchStart);
      canvas.removeEventListener("touchmove", onTouchMove);
      canvas.removeEventListener("touchend", onTouchEnd);
    };
  }, [canvas, updateCamera]);

  return { orbitRef, updateCamera };
}
