import * as api from "../services/api";


export const ENABLE_AUTOCALIBRATION = false;

export const autoCalibrateQueue: Array<{ fd: FormData; imageUrl: string; sourceWidth: number; sourceHeight: number }> = [];

export let isProcessingCalibrationQueue = false;

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

export async function processAutoCalibrateQueue() {
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

