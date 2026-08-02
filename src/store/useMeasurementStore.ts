import { create } from 'zustand';
import { StoredMeasurement } from '../types';
import { readMeasurementsCacheStore, writeMeasurementsCacheStore } from '../utils/cache';

type Updater<T> = T | ((prev: T) => T);

interface Point {
  x: number;
  y: number;
}

interface MeasurementState {
  measurementStart: Point | null;
  measurementEnd: Point | null;
  measurementPx: number;
  measurementLabelPos: Point | null;
  isMeasuring: boolean;
  measurementsByImageUrl: Record<string, StoredMeasurement[]>;
  selectedMeasurementId: string | null;
  hoveredMeasurementId: string | null;
  measurementOverlayVisibleByUrl: Record<string, boolean>;

  setMeasurementStart: (updater: Updater<Point | null>) => void;
  setMeasurementEnd: (updater: Updater<Point | null>) => void;
  setMeasurementPx: (updater: Updater<number>) => void;
  setMeasurementLabelPos: (updater: Updater<Point | null>) => void;
  setIsMeasuring: (updater: Updater<boolean>) => void;
  setMeasurementsByImageUrl: (updater: Updater<Record<string, StoredMeasurement[]>>) => void;
  setSelectedMeasurementId: (updater: Updater<string | null>) => void;
  setHoveredMeasurementId: (updater: Updater<string | null>) => void;
  setMeasurementOverlayVisibleByUrl: (updater: Updater<Record<string, boolean>>) => void;
}

export const useMeasurementStore = create<MeasurementState>((set) => ({
  measurementStart: null,
  measurementEnd: null,
  measurementPx: 0,
  measurementLabelPos: null,
  isMeasuring: false,
  measurementsByImageUrl: readMeasurementsCacheStore(),
  selectedMeasurementId: null,
  hoveredMeasurementId: null,
  measurementOverlayVisibleByUrl: {},

  setMeasurementStart: (updater) => set((state) => ({ measurementStart: typeof updater === 'function' ? updater(state.measurementStart) : updater })),
  setMeasurementEnd: (updater) => set((state) => ({ measurementEnd: typeof updater === 'function' ? updater(state.measurementEnd) : updater })),
  setMeasurementPx: (updater) => set((state) => ({ measurementPx: typeof updater === 'function' ? updater(state.measurementPx) : updater })),
  setMeasurementLabelPos: (updater) => set((state) => ({ measurementLabelPos: typeof updater === 'function' ? updater(state.measurementLabelPos) : updater })),
  setIsMeasuring: (updater) => set((state) => ({ isMeasuring: typeof updater === 'function' ? updater(state.isMeasuring) : updater })),
  setMeasurementsByImageUrl: (updater) => set((state) => {
    const next = typeof updater === 'function' ? updater(state.measurementsByImageUrl) : updater;
    writeMeasurementsCacheStore(next);
    return { measurementsByImageUrl: next };
  }),
  setSelectedMeasurementId: (updater) => set((state) => ({ selectedMeasurementId: typeof updater === 'function' ? updater(state.selectedMeasurementId) : updater })),
  setHoveredMeasurementId: (updater) => set((state) => ({ hoveredMeasurementId: typeof updater === 'function' ? updater(state.hoveredMeasurementId) : updater })),
  setMeasurementOverlayVisibleByUrl: (updater) => set((state) => ({ measurementOverlayVisibleByUrl: typeof updater === 'function' ? updater(state.measurementOverlayVisibleByUrl) : updater })),
}));
