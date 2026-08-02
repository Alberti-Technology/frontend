import { getHeaders, apiFetchWithAuth } from "./auth.service";
import { HF_BASE_URL, HF_MASK_ENDPOINT, readErrorPayload, buildApiError } from "./apiClient";
import { HfMaskLabels, HfMaskResult } from "../types";

export const ACERO_LABELS: HfMaskLabels = {
  "0": { name: "Cementita", color: [255, 0, 0] },
  "1": { name: "Borde de grano", color: [0, 255, 0] },
  "2": { name: "Ferrita", color: [0, 0, 255] },
  "3": { name: "Raya", color: [255, 255, 255] }
};

const INCLUSION_PALETTE: [number, number, number][] = [
  [255, 0, 255],   // Magenta
  [0, 255, 255],   // Cyan
  [255, 165, 0],   // Naranja
  [0, 255, 128],   // Verde esmeralda
  [255, 80, 80],   // Rojo coral
  [128, 0, 255],   // Violeta
  [255, 255, 0],   // Amarillo
  [64, 224, 208],  // Turquesa
];

export function getInclusionClassColor(classId: number): [number, number, number] {
  return INCLUSION_PALETTE[classId % INCLUSION_PALETTE.length];
}

export async function getMask(micrografiaId: string | number): Promise<{ mask_type: string; mask_url: string; labels?: HfMaskLabels } | null> {
  const res = await apiFetchWithAuth(`metalografia/mask/${micrografiaId}/`, {
    headers: getHeaders(),
  });

  if (res.status === 404) return null;

  if (!res.ok) {
    const payload = await readErrorPayload(res);
    throw buildApiError(res, payload, "Error obteniendo máscara");
  }

  const data = await res.json();
  return data?.mask_url ? data : null;
}

export async function saveMask(micrografiaId: string | number, maskDataUrl: string, labels?: HfMaskLabels) {
  const blobResponse = await fetch(maskDataUrl);
  const blob = await blobResponse.blob();

  const formData = new FormData();
  formData.append("image", blob, "mask.png");
  if (labels) {
    formData.append("labels", JSON.stringify(labels));
  }

  const res = await apiFetchWithAuth(`metalografia/predict/${micrografiaId}/`, {
    method: "POST",
    headers: getHeaders(true),
    body: formData,
  });

  if (!res.ok) {
    const payload = await readErrorPayload(res);
    throw buildApiError(res, payload, "Error guardando máscara");
  }

  const data = await res.json();
  return data?.image_url || null;
}

function normalizeRgbTuple(value: unknown): [number, number, number] | null {
  if (!Array.isArray(value) || value.length < 3) return null;
  const rgb = value.slice(0, 3).map((channel) => Number(channel));
  if (!rgb.every((channel) => Number.isFinite(channel))) return null;
  return [
    Math.max(0, Math.min(255, Math.round(rgb[0]))),
    Math.max(0, Math.min(255, Math.round(rgb[1]))),
    Math.max(0, Math.min(255, Math.round(rgb[2]))),
  ];
}

function parseHfMaskLabels(payload: any): HfMaskLabels | undefined {
  const labels = payload?.labels;
  if (!labels || typeof labels !== "object") return undefined;

  const parsed: HfMaskLabels = {};
  Object.entries(labels).forEach(([key, value]) => {
    if (!value || typeof value !== "object") return;
    const maybeName = (value as any).name;
    const name =
      typeof maybeName === "string" && maybeName.trim()
        ? maybeName.trim()
        : `Clase ${key}`;
    const color = normalizeRgbTuple((value as any).color) || [127, 127, 127];
    parsed[key] = { name, color };
  });

  return Object.keys(parsed).length > 0 ? parsed : undefined;
}

interface LetterboxResult {
  blob: Blob;
  contentRect: { x: number; y: number; w: number; h: number };
}

async function letterboxImageBlob(
  blob: Blob,
  targetSize: number,
): Promise<LetterboxResult> {
  const bitmap = await createImageBitmap(blob);
  const srcW = bitmap.width;
  const srcH = bitmap.height;

  const canvas = document.createElement("canvas");
  canvas.width = targetSize;
  canvas.height = targetSize;
  const ctx = canvas.getContext("2d")!;

  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, targetSize, targetSize);

  const scale = Math.min(targetSize / srcW, targetSize / srcH);
  const drawW = Math.round(srcW * scale);
  const drawH = Math.round(srcH * scale);
  const offsetX = Math.round((targetSize - drawW) / 2);
  const offsetY = Math.round((targetSize - drawH) / 2);

  ctx.drawImage(bitmap, offsetX, offsetY, drawW, drawH);
  bitmap.close();

  const paddedBlob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) =>
        b ? resolve(b) : reject(new Error("Failed to letterbox image")),
      "image/png",
    );
  });

  return {
    blob: paddedBlob,
    contentRect: { x: offsetX, y: offsetY, w: drawW, h: drawH },
  };
}

export async function cropMaskToContentRegion(
  maskDataUrl: string,
  contentRect: { x: number; y: number; w: number; h: number },
  maskSquareSize: number,
): Promise<string> {
  return new Promise<string>((resolve) => {
    const img = new Image();
    img.onload = () => {
      const maskW = img.naturalWidth || maskSquareSize;
      const maskH = img.naturalHeight || maskSquareSize;
      const scaleX = maskW / maskSquareSize;
      const scaleY = maskH / maskSquareSize;

      const cropX = Math.round(contentRect.x * scaleX);
      const cropY = Math.round(contentRect.y * scaleY);
      const cropW = Math.round(contentRect.w * scaleX);
      const cropH = Math.round(contentRect.h * scaleY);

      if (cropW <= 0 || cropH <= 0) {
        resolve(maskDataUrl);
        return;
      }

      const canvas = document.createElement("canvas");
      canvas.width = cropW;
      canvas.height = cropH;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(maskDataUrl);
        return;
      }

      ctx.drawImage(img, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);
      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = () => resolve(maskDataUrl);
    img.src = maskDataUrl;
  });
}

export async function generateMaskWithHf(
  imageUrl: string,
  customEndpoint?: string,
  modelInputSize?: number
): Promise<HfMaskResult> {
  const imageResponse = await fetch(imageUrl);
  if (!imageResponse.ok) {
    throw new Error(
      "No se pudo leer la imagen original para generar la máscara",
    );
  }

  let imageBlob = await imageResponse.blob();
  const type = imageBlob.type || "image/jpeg";
  const extension = type.includes("png") ? "png" : "jpg";

  let contentRect: { x: number; y: number; w: number; h: number } | null = null;
  if (modelInputSize) {
    const result = await letterboxImageBlob(imageBlob, modelInputSize);
    imageBlob = result.blob;
    contentRect = result.contentRect;
  }

  const file = new File([imageBlob], `micrografia.${extension}`, { type });

  const formData = new FormData();
  formData.append("file", file);

  const endpoint = customEndpoint || HF_MASK_ENDPOINT;

  const response = await fetch(endpoint, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error("Error generando máscara en el modelo");
  }

  const contentType = response.headers.get("content-type") || "";
  if (contentType.startsWith("image/")) {
    const maskBlob = await response.blob();
    let dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === "string") resolve(reader.result);
        else reject(new Error("No se pudo convertir la máscara a data URL"));
      };
      reader.onerror = () => reject(new Error("Error leyendo máscara"));
      reader.readAsDataURL(maskBlob);
    });

    if (contentRect && modelInputSize) {
      dataUrl = await cropMaskToContentRegion(
        dataUrl,
        contentRect,
        modelInputSize,
      );
    }

    return { url: dataUrl };
  }

  let payload: any = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  const maskValue =
    payload?.mask_url || payload?.url || payload?.image || payload?.output;
  if (typeof maskValue === "string" && maskValue) {
    const labels = parseHfMaskLabels(payload);

    let resolvedUrl: string;
    try {
      resolvedUrl = new URL(maskValue, endpoint).toString();
    } catch {
      resolvedUrl = maskValue;
    }

    if (contentRect && modelInputSize) {
      try {
        const maskFetch = await fetch(resolvedUrl);
        if (maskFetch.ok) {
          const maskBlob = await maskFetch.blob();
          const maskDataUrl = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
              if (typeof reader.result === "string") resolve(reader.result);
              else reject(new Error("mask blob read failed"));
            };
            reader.onerror = () => reject(new Error("mask blob read error"));
            reader.readAsDataURL(maskBlob);
          });
          resolvedUrl = await cropMaskToContentRegion(
            maskDataUrl,
            contentRect,
            modelInputSize,
          );
        }
      } catch {
      }
    }

    return { url: resolvedUrl, labels };
  }

  throw new Error("La respuesta del modelo no contiene una máscara utilizable");
}

export interface InclusionPolygon {
  points: { x: number; y: number }[];
  confidence: number;
  class_id: number;
  class_name: string;
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function detectInclusiones(imageUrl: string): Promise<InclusionPolygon[]> {
  const imageResponse = await fetch(imageUrl);
  if (!imageResponse.ok) {
    throw new Error("No se pudo leer la imagen original para detección");
  }

  const imageBlob = await imageResponse.blob();
  const type = imageBlob.type || "image/jpeg";
  const extension = type.includes("png") ? "png" : "jpg";
  const file = new File([imageBlob], `micrografia.${extension}`, { type });

  const endpoint = `${HF_BASE_URL}/detecciones/`;
  const MAX_RETRIES = 3;
  const RETRY_DELAYS = [3000, 6000, 12000];

  let lastError: Error | null = null;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(endpoint, {
        method: "POST",
        body: formData,
      });

      if (response.status === 502 || response.status === 503 || response.status === 504) {
        lastError = new Error(`Servidor no disponible (${response.status})`);
        if (attempt < MAX_RETRIES - 1) {
          await wait(RETRY_DELAYS[attempt]);
          continue;
        }
        throw lastError;
      }

      if (!response.ok) {
        throw new Error("Error obteniendo detecciones del modelo");
      }

      const data = await response.json();
      if (Array.isArray(data)) {
        return data;
      }
      return data.polygons || data.boxes || [];
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      if (attempt < MAX_RETRIES - 1) {
        await wait(RETRY_DELAYS[attempt]);
        continue;
      }
    }
  }

  throw lastError || new Error("Error obteniendo detecciones del modelo");
}
