import * as THREE from "three";
import { BV_MM } from "./constants";

/** Build a realistic print bed with PEI texture, rim, clips, and volume wireframe */
export function createPrintBed(scene: THREE.Scene): THREE.Group {
  const bedGroup = new THREE.Group();
  const half = BV_MM / 2;

  // Base platform
  const platformH = 6;
  const platformGeo = new THREE.BoxGeometry(BV_MM + 20, platformH, BV_MM + 20);
  const platformMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.8, metalness: 0.3 });
  const platform = new THREE.Mesh(platformGeo, platformMat);
  platform.position.y = -platformH / 2;
  bedGroup.add(platform);

  // Build plate surface with canvas texture
  const texSize = 512;
  const canvas = document.createElement("canvas");
  canvas.width = texSize;
  canvas.height = texSize;
  const ctx = canvas.getContext("2d")!;

  ctx.fillStyle = "#0d0d0d";
  ctx.fillRect(0, 0, texSize, texSize);

  // Grid lines
  ctx.strokeStyle = "rgba(255,255,255,0.025)";
  ctx.lineWidth = 0.5;
  const gridStep = texSize / 16;
  for (let i = 0; i <= 16; i++) {
    const pos = i * gridStep;
    ctx.beginPath(); ctx.moveTo(pos, 0); ctx.lineTo(pos, texSize); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, pos); ctx.lineTo(texSize, pos); ctx.stroke();
  }

  // Cross-hatch
  ctx.strokeStyle = "rgba(255,255,255,0.012)";
  ctx.lineWidth = 0.3;
  for (let i = 0; i < texSize; i += 8) {
    ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i + texSize / 4, texSize); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(i, texSize); ctx.lineTo(i + texSize / 4, 0); ctx.stroke();
  }

  // Center crosshairs
  ctx.strokeStyle = "rgba(255,255,255,0.06)";
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(texSize / 2, 0); ctx.lineTo(texSize / 2, texSize); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(0, texSize / 2); ctx.lineTo(texSize, texSize / 2); ctx.stroke();

  // Corner alignment marks
  ctx.strokeStyle = "rgba(255,255,255,0.05)";
  ctx.lineWidth = 1.5;
  const cm = 30, cp = 20;
  [[cp, cp], [texSize - cp, cp], [cp, texSize - cp], [texSize - cp, texSize - cp]].forEach(([x, y]) => {
    const sx = x === cp ? 1 : -1;
    const sy = y === cp ? 1 : -1;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + sx * cm, y); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + sy * cm); ctx.stroke();
  });

  const bedTex = new THREE.CanvasTexture(canvas);
  bedTex.wrapS = THREE.RepeatWrapping;
  bedTex.wrapT = THREE.RepeatWrapping;

  const surfaceGeo = new THREE.PlaneGeometry(BV_MM, BV_MM);
  const surfaceMat = new THREE.MeshStandardMaterial({ map: bedTex, color: 0x1a1a1a, roughness: 0.6, metalness: 0.15 });
  const surface = new THREE.Mesh(surfaceGeo, surfaceMat);
  surface.rotation.x = -Math.PI / 2;
  surface.position.y = 0.5;
  bedGroup.add(surface);

  // Edge rim
  const rimH = 3, rimW = 3;
  const rimMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.5, metalness: 0.4 });
  const rimFGeo = new THREE.BoxGeometry(BV_MM + rimW * 2, rimH, rimW);
  const rimF = new THREE.Mesh(rimFGeo, rimMat);
  rimF.position.set(0, rimH / 2, half + rimW / 2);
  bedGroup.add(rimF);
  const rimB = rimF.clone();
  rimB.position.set(0, rimH / 2, -(half + rimW / 2));
  bedGroup.add(rimB);
  const rimLGeo = new THREE.BoxGeometry(rimW, rimH, BV_MM);
  const rimL = new THREE.Mesh(rimLGeo, rimMat);
  rimL.position.set(-(half + rimW / 2), rimH / 2, 0);
  bedGroup.add(rimL);
  const rimR = rimL.clone();
  rimR.position.set(half + rimW / 2, rimH / 2, 0);
  bedGroup.add(rimR);

  // Corner clips
  const clipMat = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.3, metalness: 0.6 });
  const clipGeo = new THREE.BoxGeometry(12, 4, 12);
  [[-half + 6, 2, -half + 6], [half - 6, 2, -half + 6], [-half + 6, 2, half - 6], [half - 6, 2, half - 6]]
    .forEach(([x, y, z]) => {
      const clip = new THREE.Mesh(clipGeo, clipMat);
      clip.position.set(x, y, z);
      bedGroup.add(clip);
    });

  // Under-glow
  const glowGeo = new THREE.PlaneGeometry(BV_MM * 1.2, BV_MM * 1.2);
  const glowMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.015 });
  const glow = new THREE.Mesh(glowGeo, glowMat);
  glow.rotation.x = -Math.PI / 2;
  glow.position.y = -3.5;
  bedGroup.add(glow);

  // Build volume wireframe
  const volEdges = new THREE.EdgesGeometry(new THREE.BoxGeometry(BV_MM, BV_MM, BV_MM));
  const volWire = new THREE.LineSegments(volEdges, new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.04 }));
  volWire.position.y = BV_MM / 2;
  bedGroup.add(volWire);

  scene.add(bedGroup);
  return bedGroup;
}
