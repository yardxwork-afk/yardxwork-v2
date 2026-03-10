import * as THREE from "three";

/**
 * Auto-orient: rotate geometry so the flattest surface faces the build plate.
 * Uses Fibonacci sphere sampling with face-area-in-slab scoring.
 * Three.js r128: BufferGeometry has no applyQuaternion — must use Matrix4.
 */
export function autoOrient(geometry: THREE.BufferGeometry): string {
  const pos = geometry.getAttribute("position") as THREE.BufferAttribute;
  const vertCount = pos.count;
  const triCount = vertCount / 3;
  if (triCount < 4) return "skip: too few tris";

  geometry.computeBoundingBox();
  const bb = geometry.boundingBox!;
  const modelSize = Math.max(
    bb.max.x - bb.min.x,
    bb.max.y - bb.min.y,
    bb.max.z - bb.min.z
  );
  if (modelSize < 1e-6) return "skip: zero size";

  // Pre-compute per-face data
  const va = new THREE.Vector3(), vb = new THREE.Vector3(), vc = new THREE.Vector3();
  const e1 = new THREE.Vector3(), e2 = new THREE.Vector3(), fn = new THREE.Vector3();

  interface Face {
    nx: number; ny: number; nz: number; area: number;
    cx: number; cy: number; cz: number;
  }
  const faces: Face[] = [];

  for (let i = 0; i < triCount; i++) {
    va.fromBufferAttribute(pos, i * 3);
    vb.fromBufferAttribute(pos, i * 3 + 1);
    vc.fromBufferAttribute(pos, i * 3 + 2);
    e1.subVectors(vb, va);
    e2.subVectors(vc, va);
    fn.crossVectors(e1, e2);
    const area = fn.length() * 0.5;
    if (area < 1e-8) continue;
    fn.normalize();
    faces.push({
      nx: fn.x, ny: fn.y, nz: fn.z, area,
      cx: (va.x + vb.x + vc.x) / 3,
      cy: (va.y + vb.y + vc.y) / 3,
      cz: (va.z + vb.z + vc.z) / 3,
    });
  }
  if (!faces.length) return "skip: no faces";

  // 200 candidate directions via Fibonacci sphere
  const numSamples = 200;
  const candidates: { dx: number; dy: number; dz: number }[] = [];
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < numSamples; i++) {
    const y = 1 - (2 * i) / (numSamples - 1);
    const r = Math.sqrt(1 - y * y);
    const theta = golden * i;
    candidates.push({ dx: r * Math.cos(theta), dy: y, dz: r * Math.sin(theta) });
  }

  const SLAB_MM = 2.0;
  const normalCos = Math.cos(25 * Math.PI / 180);

  let bestDir: { dx: number; dy: number; dz: number } | null = null;
  let bestScore = -1;

  for (const cand of candidates) {
    const { dx, dy, dz } = cand;
    let maxProj = -Infinity;
    for (const f of faces) {
      const p = f.cx * dx + f.cy * dy + f.cz * dz;
      if (p > maxProj) maxProj = p;
    }

    let score = 0;
    const slabMin = maxProj - SLAB_MM;
    for (const f of faces) {
      const ndot = f.nx * dx + f.ny * dy + f.nz * dz;
      if (ndot < normalCos) continue;
      const cp = f.cx * dx + f.cy * dy + f.cz * dz;
      if (cp >= slabMin) {
        score += f.area;
      }
    }

    if (score > bestScore) {
      bestScore = score;
      bestDir = cand;
    }
  }

  if (!bestDir || bestScore <= 0) return "no valid direction found";

  // Refine: area-weighted average of face normals in the winning slab
  let rnx = 0, rny = 0, rnz = 0;
  let maxP2 = -Infinity;
  for (const f of faces) {
    const p = f.cx * bestDir.dx + f.cy * bestDir.dy + f.cz * bestDir.dz;
    if (p > maxP2) maxP2 = p;
  }
  const slabMin2 = maxP2 - SLAB_MM;
  for (const f of faces) {
    const ndot = f.nx * bestDir.dx + f.ny * bestDir.dy + f.nz * bestDir.dz;
    if (ndot < normalCos) continue;
    const cp = f.cx * bestDir.dx + f.cy * bestDir.dy + f.cz * bestDir.dz;
    if (cp >= slabMin2) {
      rnx += f.nx * f.area;
      rny += f.ny * f.area;
      rnz += f.nz * f.area;
    }
  }
  const rlen = Math.sqrt(rnx * rnx + rny * rny + rnz * rnz);
  let finalDx: number, finalDy: number, finalDz: number;
  if (rlen > 1e-8) {
    finalDx = rnx / rlen; finalDy = rny / rlen; finalDz = rnz / rlen;
  } else {
    finalDx = bestDir.dx; finalDy = bestDir.dy; finalDz = bestDir.dz;
  }

  // Rotate so refined normal points DOWN (-Y)
  const src = new THREE.Vector3(finalDx, finalDy, finalDz);
  const dst = new THREE.Vector3(0, -1, 0);
  const quat = new THREE.Quaternion();
  const dot = src.dot(dst);

  if (dot > 0.9999) {
    return `already ok | n=(${finalDx.toFixed(2)},${finalDy.toFixed(2)},${finalDz.toFixed(2)}) area=${bestScore.toFixed(1)}`;
  }
  if (dot < -0.9999) {
    const perp = Math.abs(src.x) < 0.9
      ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 1, 0);
    const axis = new THREE.Vector3().crossVectors(src, perp).normalize();
    quat.setFromAxisAngle(axis, Math.PI);
  } else {
    const axis = new THREE.Vector3().crossVectors(src, dst);
    const angle = Math.acos(Math.max(-1, Math.min(1, dot)));
    if (axis.length() > 1e-6) {
      axis.normalize();
      quat.setFromAxisAngle(axis, angle);
    }
  }

  // Three.js r128: BufferGeometry has no applyQuaternion — use Matrix4
  const rotMatrix = new THREE.Matrix4().makeRotationFromQuaternion(quat);
  geometry.applyMatrix4(rotMatrix);
  geometry.computeBoundingBox();
  geometry.computeVertexNormals();

  return `oriented | n=(${finalDx.toFixed(2)},${finalDy.toFixed(2)},${finalDz.toFixed(2)}) area=${bestScore.toFixed(1)} faces=${faces.length}`;
}
