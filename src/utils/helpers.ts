export type ApiLikeError = {
  status?: number;
  message?: string;
  data?: any;
};

export function normalizeId(value: unknown): string | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed ? trimmed : null;
  }
  return null;
}

export function getColorNameFromRgb(rgb: [number, number, number]): string {
  const [r, g, b] = rgb;
  const colors = [
    { name: "rojo", rgb: [255, 0, 0] },
    { name: "verde", rgb: [0, 255, 0] },
    { name: "azul", rgb: [0, 0, 255] },
    { name: "amarillo", rgb: [255, 255, 0] },
    { name: "cyan", rgb: [0, 255, 255] },
    { name: "magenta", rgb: [255, 0, 255] },
    { name: "blanco", rgb: [255, 255, 255] },
    { name: "negro", rgb: [0, 0, 0] },
    { name: "gris", rgb: [128, 128, 128] },
    { name: "naranja", rgb: [255, 165, 0] },
    { name: "rosa", rgb: [255, 192, 203] },
    { name: "morado", rgb: [128, 0, 128] },
    { name: "marrón", rgb: [165, 42, 42] },
  ];
  let minDistance = Infinity;
  let bestColor = "desconocido";
  for (const c of colors) {
    const d = Math.sqrt(
      Math.pow(c.rgb[0] - r, 2) + Math.pow(c.rgb[1] - g, 2) + Math.pow(c.rgb[2] - b, 2)
    );
    if (d < minDistance) {
      minDistance = d;
      bestColor = c.name;
    }
  }
  return bestColor;
}

export function isMicrografiaDuplicateError(error: ApiLikeError | null | undefined) {
  if (!error) return false;
  if (error.status === 400 && error.data && typeof error.data === "object") {
    const keys = Object.keys(error.data);
    if (keys.length === 1) {
      const val = error.data[keys[0]];
      if (Array.isArray(val) && val.length > 0 && typeof val[0] === "string") {
        return val[0].toLowerCase().includes("ya existe");
      }
    }
  }
  return false;
}

import * as api from "../services/api";
export let ENABLE_AUTOCALIBRATION = false;
export const setEnableAutoCalibration = (v: boolean) => { ENABLE_AUTOCALIBRATION = v; };

const autoCalibrateQueue: Array<{ fd: FormData; imageUrl: string; sourceWidth: number; sourceHeight: number }> = [];
let isProcessingCalibrationQueue = false;

export const addMicrografiaToAutoCalibrationQueue = (file: Blob, normalizedImageUrl: string) => {
  if (!ENABLE_AUTOCALIBRATION) return;
  if (!file || !normalizedImageUrl) return;
  if (typeof window !== "undefined" && localStorage.getItem("company_enabled") !== "true") return;
  const autoCalFd = new FormData();
  autoCalFd.append("file", file, "image.jpg");
  // Read original image dimensions before sending to API
  const objectUrl = URL.createObjectURL(file);
  const tempImg = new Image();
  tempImg.onload = () => {
    const w = tempImg.naturalWidth || tempImg.width;
    const h = tempImg.naturalHeight || tempImg.height;
    URL.revokeObjectURL(objectUrl);
    autoCalibrateQueue.push({
      fd: autoCalFd,
      imageUrl: normalizedImageUrl,
      sourceWidth: w,
      sourceHeight: h,
    });
    window.dispatchEvent(new CustomEvent("calibration_started", { detail: { url: normalizedImageUrl } }));
    processAutoCalibrateQueue();
  };
  tempImg.onerror = () => {
    URL.revokeObjectURL(objectUrl);
    autoCalibrateQueue.push({
      fd: autoCalFd,
      imageUrl: normalizedImageUrl,
      sourceWidth: 0,
      sourceHeight: 0,
    });
    window.dispatchEvent(new CustomEvent("calibration_started", { detail: { url: normalizedImageUrl } }));
    processAutoCalibrateQueue();
  };
  tempImg.src = objectUrl;
};

async function processAutoCalibrateQueue() {
  if (isProcessingCalibrationQueue) return;
  isProcessingCalibrationQueue = true;

  while (autoCalibrateQueue.length > 0) {
    const item = autoCalibrateQueue.shift();
    if (!item) continue;
    try {
      const res = await fetch(`${api.HF_BASE_URL}/escala/`, {
        method: "POST",
        body: item.fd,
      });

      if (res.ok) {
        const text = await res.text();
        const data = text ? JSON.parse(text) : null;
        if (data && data.um_per_pixel && data.scale_detection?.vertices?.length >= 2) {
          const micrometers = parseFloat(data.ocr?.numero_detectado || "0");
          const pxLen = micrometers > 0 ? micrometers / data.um_per_pixel : 1;
          const calData = {
            pixelLength: pxLen,
            micrometers: micrometers || 1,
            umByPx: data.um_per_pixel,
            isAi: true,
            vertices: data.scale_detection.vertices,
            sourceWidth: item.sourceWidth,
            sourceHeight: item.sourceHeight,
          };
          window.dispatchEvent(new CustomEvent("calibration_updated", { detail: { url: item.imageUrl, data: calData } }));
        } else {
          window.dispatchEvent(new CustomEvent("calibration_failed", { detail: { url: item.imageUrl } }));
        }
      } else {
         window.dispatchEvent(new CustomEvent("calibration_failed", { detail: { url: item.imageUrl } }));
      }
    } catch (err) {
      window.dispatchEvent(new CustomEvent("calibration_failed", { detail: { url: item.imageUrl } }));
      console.error("Auto calibration error for", item.imageUrl, err);
    }
  }
  isProcessingCalibrationQueue = false;
}


import { BASE_URL } from "../services/api";
import { CLOUDINARY_BASE_URL } from "../config/apiConfig";

export const fixImageUrl = (url: string | undefined | null) => {
  if (!url) return "";
  let apiOrigin = "";
  try {
    apiOrigin = new URL(BASE_URL).origin;
  } catch {}

  const buildApiUrl = (pathWithQuery: string) =>
    apiOrigin ? `${apiOrigin}${pathWithQuery}` : pathWithQuery;
  const buildCloudinaryUrl = (fragment: string) =>
    CLOUDINARY_BASE_URL
      ? `${CLOUDINARY_BASE_URL}${fragment.replace(/^\/+/, "")}`
      : fragment;

  if (url.startsWith("http://") || url.startsWith("https://")) {
    try {
      const u = new URL(url);
      if (u.pathname.startsWith("/media/")) {
        return buildApiUrl(`${u.pathname}${u.search}`);
      }
    } catch {
      return url;
    }
    return url;
  }

  if (url.startsWith("/media/")) {
    return buildApiUrl(url);
  }

  if (
    CLOUDINARY_BASE_URL &&
    (url.startsWith("image/upload/") || url.startsWith("/image/upload/"))
  ) {
    return buildCloudinaryUrl(url);
  }

  return url;
};
