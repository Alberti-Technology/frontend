export interface StoredMeasurement {
  id: string;
  start: { x: number; y: number };
  end: { x: number; y: number };
  distancePx: number;
  distanceUm: number | null;
  color: string;
}

export interface Micrografia {
  id: string;
  rawId: string;
  name: string;
  url: string;
  umByPx: number | null;
}

export interface Region {
  id: string;
  name: string;
  image: string; // representative image of this region
  micrografias: Micrografia[];
}

export interface Muestra {
  id: string;
  name: string;
  image: string; // representative image of this muestra
  regiones: Region[];
}

export interface Material {
  id: string;
  name: string;
  image: string; // representative image of this material
  muestras: Muestra[];
}

export interface ApiMuestra {
  id: number | string;
  nombre: string;
  imagen: string;
  informacion?: string;
  material: number | string;
}

export interface ApiRegion {
  id: number | string;
  nombre: string;
  imagen: string;
  muestra: number;
}

export interface ApiMicrografia {
  id: number | string;
  nombre: string;
  imagen: string;
  region: number;
  um_by_px?: number;
  is_ai?: boolean;
  pixel_length?: number;
  micrometers?: number;
  measure_imagen?: string;
  measure_is_valid?: boolean | null;
}

export interface CalibrationInfo {
  pixelLength: number;
  micrometers: number;
  width?: number;
  height?: number;
  umByPx?: number;
  isAi?: boolean;
  vertices?: number[][];
  sourceWidth?: number;
  sourceHeight?: number;
}

export interface ToastNotification {
  id: number;
  title: string;
  message: string;
  tone: "error" | "info" | "success" | "warning";
  durationMs: number;
  leaving: boolean;
}

export interface FileManagerProps {
  onLogout?: () => void;
  showAdmin?: boolean;
  showGallery?: boolean;
  showReports?: boolean;
  showAssistant?: boolean;
}

export type ApiLikeError = {
  status?: number;
  message?: string;
  data?: any;
};

export type GalleryView =
  | { kind: "none" }
  | { kind: "all-materials"; images: { name: string; url: string }[] }
  | { kind: "single-material"; material: Material }
  | { kind: "all-muestras"; images: { name: string; url: string }[] }
  | { kind: "single-muestra"; muestra: Muestra }
  | { kind: "all-regiones"; images: { name: string; url: string }[] }
  | { kind: "single-region"; region: Region }
  | { kind: "micrografias"; images: Micrografia[] };


export interface ApiMaterial {
  id: number | string;
  nombre: string;
  code?: string;
  has_model?: boolean;
}

export interface HfMaskLabelInfo {
  name: string;
  color: [number, number, number];
}

export type HfMaskLabels = Record<string, HfMaskLabelInfo>;

export interface HfMaskResult {
  url: string;
  labels?: HfMaskLabels;
}
