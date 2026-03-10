import * as THREE from "three";
import type { ColorOption } from "@/lib/constants";

export interface ModelMeshes {
  group: THREE.Group;
  wireframe: THREE.LineSegments;
  solid: THREE.Mesh;
}

/** Create wireframe + solid mesh group from geometry, centered on print bed */
export function createModelMeshes(
  geometry: THREE.BufferGeometry,
  scaleFactor: number,
  scale: number,
): ModelMeshes {
  const geo = geometry.clone();
  geo.computeBoundingBox();
  const bb = geo.boundingBox!;
  geo.translate(-(bb.min.x + bb.max.x) / 2, -bb.min.y, -(bb.min.z + bb.max.z) / 2);

  const edgesGeo = new THREE.EdgesGeometry(geo, 25);
  const wireframe = new THREE.LineSegments(
    edgesGeo,
    new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.85 }),
  );
  const solid = new THREE.Mesh(
    geo,
    new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.65, metalness: 0.05 }),
  );
  solid.visible = false;

  const group = new THREE.Group();
  group.add(wireframe);
  group.add(solid);
  group.position.y = 1;
  group.scale.setScalar(scaleFactor * scale);

  return { group, wireframe, solid };
}

/** Update model scale */
export function updateModelScale(group: THREE.Group, scaleFactor: number, scale: number) {
  group.scale.setScalar(scaleFactor * scale);
}

/** Toggle wireframe/solid based on color selection */
export function updateModelColor(
  wireframe: THREE.LineSegments,
  solid: THREE.Mesh,
  color: ColorOption | null,
) {
  if (color) {
    wireframe.visible = false;
    solid.visible = true;
    (solid.material as THREE.MeshStandardMaterial).color.set(color.hex);
  } else {
    wireframe.visible = true;
    solid.visible = false;
  }
}
