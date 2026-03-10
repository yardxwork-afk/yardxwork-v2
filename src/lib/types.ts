import * as THREE from "three";
import type { ColorOption } from "./constants";
import type { PricingResult } from "./pricing";

export interface ModelData {
  fileName: string;
  geometry: THREE.BufferGeometry;
  volCm3: number;
  scaleFactor: number;
  maxDimMm: number;
  orientDebug: string;
}

export interface ShippingInfo {
  name: string;
  email: string;
  address: string;
  city: string;
  state: string;
  zip: string;
}

export type PageState = "configure" | "checkout" | "confirmed";
