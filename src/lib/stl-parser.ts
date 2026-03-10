import * as THREE from "three";

export interface ParseResult {
  geometry: THREE.BufferGeometry;
  volumeMm3: number;
}

export function parseSTL(buf: ArrayBuffer): ParseResult {
  if (buf.byteLength < 84) throw new Error("File too small to be a valid STL");

  const dv = new DataView(buf);
  const nt = dv.getUint32(80, true);
  const expectedBinary = 84 + nt * 50;

  if (nt > 0 && nt < 10000000) {
    if (buf.byteLength >= expectedBinary && buf.byteLength <= expectedBinary + 512) {
      try {
        const result = parseSTLBinary(dv, nt);
        if (result.geometry.getAttribute("position").count > 0) return result;
      } catch (e) { /* fall through to ASCII */ }
    }
    if (buf.byteLength === expectedBinary) {
      return parseSTLBinary(dv, nt);
    }
  }

  const asciiResult = parseSTLAscii(buf);
  if (asciiResult) return asciiResult;

  if (nt > 0 && buf.byteLength >= expectedBinary) {
    return parseSTLBinary(dv, nt);
  }

  throw new Error("Could not parse STL — file may be corrupted");
}

function parseSTLBinary(dv: DataView, nt: number): ParseResult {
  const verts = new Float32Array(nt * 9);
  const norms = new Float32Array(nt * 9);
  let off = 84, vol = 0;
  for (let i = 0; i < nt; i++) {
    const nx = dv.getFloat32(off, true), ny = dv.getFloat32(off + 4, true), nz = dv.getFloat32(off + 8, true);
    off += 12;
    const v: { x: number; y: number; z: number }[] = [];
    for (let j = 0; j < 3; j++) {
      const x = dv.getFloat32(off, true), y = dv.getFloat32(off + 4, true), z = dv.getFloat32(off + 8, true);
      off += 12;
      verts[i * 9 + j * 3] = x; verts[i * 9 + j * 3 + 1] = y; verts[i * 9 + j * 3 + 2] = z;
      norms[i * 9 + j * 3] = nx; norms[i * 9 + j * 3 + 1] = ny; norms[i * 9 + j * 3 + 2] = nz;
      v.push({ x, y, z });
    }
    const a = v[0], b = v[1], c = v[2];
    vol += (a.x * (b.y * c.z - c.y * b.z) - b.x * (a.y * c.z - c.y * a.z) + c.x * (a.y * b.z - b.y * a.z)) / 6;
    off += 2;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(verts, 3));
  geo.setAttribute("normal", new THREE.BufferAttribute(norms, 3));
  geo.computeBoundingBox();
  return { geometry: geo, volumeMm3: Math.abs(vol) };
}

function parseSTLAscii(buf: ArrayBuffer): ParseResult | null {
  const text = new TextDecoder().decode(buf);
  if (!text.includes("facet") && !text.includes("vertex")) return null;

  const NUM = "([\\-+]?(?:\\d+\\.?\\d*|\\.\\d+)(?:[eE][\\-+]?\\d+)?)";
  const WS = "[\\s,]+";
  const pattern = new RegExp(
    "facet\\s+normal" + WS + NUM + WS + NUM + WS + NUM +
    "\\s+outer\\s+loop" +
    "\\s+vertex" + WS + NUM + WS + NUM + WS + NUM +
    "\\s+vertex" + WS + NUM + WS + NUM + WS + NUM +
    "\\s+vertex" + WS + NUM + WS + NUM + WS + NUM +
    "\\s+endloop\\s+endfacet",
    "gi"
  );

  const vs: number[] = [], ns: number[] = [];
  let m: RegExpExecArray | null, vol = 0;
  while ((m = pattern.exec(text)) !== null) {
    const v = m.slice(1).map(Number);
    vs.push(v[3], v[4], v[5], v[6], v[7], v[8], v[9], v[10], v[11]);
    ns.push(v[0], v[1], v[2], v[0], v[1], v[2], v[0], v[1], v[2]);
    vol += (v[3] * (v[7] * v[11] - v[10] * v[8]) - v[6] * (v[4] * v[11] - v[10] * v[5]) + v[9] * (v[4] * v[8] - v[7] * v[5])) / 6;
  }
  if (!vs.length) return null;
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(vs), 3));
  geo.setAttribute("normal", new THREE.BufferAttribute(new Float32Array(ns), 3));
  geo.computeBoundingBox();
  return { geometry: geo, volumeMm3: Math.abs(vol) };
}
