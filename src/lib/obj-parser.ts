import * as THREE from "three";
import type { ParseResult } from "./stl-parser";

/**
 * Parse an OBJ file from an ArrayBuffer.
 * Supports `v` (vertex) and `f` (face) lines.
 * Computes volume using the signed tetrahedron method (same as STL parser).
 */
export function parseOBJ(buf: ArrayBuffer): ParseResult {
  const text = new TextDecoder().decode(buf);
  const lines = text.split("\n");

  const vertices: number[][] = []; // 1-indexed in OBJ; stored 0-indexed here
  const positions: number[] = [];
  let vol = 0;

  for (const raw of lines) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;

    const parts = line.split(/\s+/);
    const cmd = parts[0];

    if (cmd === "v" && parts.length >= 4) {
      vertices.push([parseFloat(parts[1]), parseFloat(parts[2]), parseFloat(parts[3])]);
    } else if (cmd === "f" && parts.length >= 4) {
      // Faces can be: "f 1 2 3", "f 1/2/3 4/5/6 7/8/9", "f 1//3 4//6 7//9"
      const indices = parts.slice(1).map((tok) => {
        const idx = parseInt(tok.split("/")[0], 10);
        // OBJ indices are 1-based; negative indices reference from end
        return idx > 0 ? idx - 1 : vertices.length + idx;
      });

      // Triangulate fan: for faces with > 3 vertices
      for (let i = 1; i < indices.length - 1; i++) {
        const a = vertices[indices[0]];
        const b = vertices[indices[i]];
        const c = vertices[indices[i + 1]];
        if (!a || !b || !c) continue;

        positions.push(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2]);

        // Signed tetrahedron volume
        vol +=
          (a[0] * (b[1] * c[2] - c[1] * b[2]) -
            b[0] * (a[1] * c[2] - c[1] * a[2]) +
            c[0] * (a[1] * b[2] - b[1] * a[2])) /
          6;
      }
    }
  }

  if (positions.length === 0) throw new Error("No geometry found in OBJ file");

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(positions), 3));
  geo.computeVertexNormals();
  geo.computeBoundingBox();

  return { geometry: geo, volumeMm3: Math.abs(vol) };
}
