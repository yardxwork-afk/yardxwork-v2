import * as THREE from "three";
import { unzipSync } from "fflate";
import type { ParseResult } from "./stl-parser";

/**
 * Parse a 3MF file from an ArrayBuffer.
 * 3MF is a ZIP archive containing XML model data at 3D/3dmodel.model.
 * Parses <vertices> and <triangles> elements, computes volume.
 */
export function parse3MF(buf: ArrayBuffer): ParseResult {
  // 3MF is a ZIP archive
  const zip = unzipSync(new Uint8Array(buf));

  // Find the model file — typically 3D/3dmodel.model
  let modelXml: string | null = null;
  for (const path of Object.keys(zip)) {
    if (path.toLowerCase().endsWith(".model")) {
      modelXml = new TextDecoder().decode(zip[path]);
      break;
    }
  }
  if (!modelXml) throw new Error("No .model file found in 3MF archive");

  // Parse vertices: <vertex x="..." y="..." z="..." />
  const vertexPattern = /<vertex\s+x="([^"]+)"\s+y="([^"]+)"\s+z="([^"]+)"\s*\/>/gi;
  const vertices: number[][] = [];
  let vm: RegExpExecArray | null;
  while ((vm = vertexPattern.exec(modelXml)) !== null) {
    vertices.push([parseFloat(vm[1]), parseFloat(vm[2]), parseFloat(vm[3])]);
  }
  if (vertices.length === 0) throw new Error("No vertices found in 3MF model");

  // Parse triangles: <triangle v1="..." v2="..." v3="..." />
  const triPattern = /<triangle\s+v1="([^"]+)"\s+v2="([^"]+)"\s+v3="([^"]+)"[^/]*\/>/gi;
  const positions: number[] = [];
  let vol = 0;
  let tm: RegExpExecArray | null;
  while ((tm = triPattern.exec(modelXml)) !== null) {
    const i0 = parseInt(tm[1], 10);
    const i1 = parseInt(tm[2], 10);
    const i2 = parseInt(tm[3], 10);
    const a = vertices[i0];
    const b = vertices[i1];
    const c = vertices[i2];
    if (!a || !b || !c) continue;

    positions.push(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2]);

    // Signed tetrahedron volume
    vol +=
      (a[0] * (b[1] * c[2] - c[1] * b[2]) -
        b[0] * (a[1] * c[2] - c[1] * a[2]) +
        c[0] * (a[1] * b[2] - b[1] * a[2])) /
      6;
  }

  if (positions.length === 0) throw new Error("No triangles found in 3MF model");

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(positions), 3));
  geo.computeVertexNormals();
  geo.computeBoundingBox();

  return { geometry: geo, volumeMm3: Math.abs(vol) };
}
