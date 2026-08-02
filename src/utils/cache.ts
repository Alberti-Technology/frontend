import { StoredMeasurement } from '../types';

export const MASK_STORAGE_KEY = "mask_cache_v2_by_micro_id";

export const MASK_LABELS_STORAGE_KEY = "mask_labels_by_micro_id";

export const DRAWINGS_STORAGE_KEY = "draw_cache_v1_by_image_url";

export const VERTICES_STORAGE_KEY = "vertices_cache_v1_by_url";

export const MEASUREMENTS_STORAGE_KEY = "measurement_cache_v1_by_image_url";

export function readVerticesCacheStore(): Record<string, { vertices: number[][]; sourceWidth: number; sourceHeight: number }> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(VERTICES_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function writeVerticesCacheStore(store: Record<string, { vertices: number[][]; sourceWidth: number; sourceHeight: number }>): boolean {
  if (typeof window === "undefined") return false;
  try {
    localStorage.setItem(VERTICES_STORAGE_KEY, JSON.stringify(store));
    return true;
  } catch (e) {
    console.warn("[vertices cache] localStorage quota exceeded, skipping cache write.", e);
    return false;
  }
}

export function readMeasurementsCacheStore(): Record<string, StoredMeasurement[]> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(MEASUREMENTS_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, StoredMeasurement[]>) : {};
  } catch {
    return {};
  }
}

export function writeMeasurementsCacheStore(store: Record<string, StoredMeasurement[]>): boolean {
  if (typeof window === "undefined") return false;
  try {
    localStorage.setItem(MEASUREMENTS_STORAGE_KEY, JSON.stringify(store));
    return true;
  } catch (e) {
    console.warn("[measurements cache] localStorage quota exceeded, skipping cache write.", e);
    return false;
  }
}

export function readDrawCacheStore(): Record<string, string> {
  try {
    const raw = localStorage.getItem(DRAWINGS_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, string>) : {};
  } catch {
    return {};
  }
}

export function writeDrawCacheStore(store: Record<string, string>): boolean {
  if (typeof window === "undefined") return false;
  try {
    localStorage.setItem(DRAWINGS_STORAGE_KEY, JSON.stringify(store));
    return true;
  } catch (e) {
    console.warn("[draw cache] localStorage quota exceeded, skipping cache write.", e);
    return false;
  }
}


