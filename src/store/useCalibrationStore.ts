import { create } from 'zustand';
import { CalibrationInfo } from '../components/FileManager/SubComponents';
import * as api from '../services/api';

type Updater<T> = T | ((prev: T) => T);

interface CalibrationState {
  calibratingByUrl: Record<string, boolean>;
  failedCalibrationByUrl: Record<string, boolean>;
  calibrationData: Record<string, CalibrationInfo>;
  lastMicrometers: number;
  
  maskByImageUrl: Record<string, string>;
  maskLabelsByImageUrl: Record<string, api.HfMaskLabels>;
  maskVisibleByImageUrl: Record<string, boolean>;
  maskLoadingByImageUrl: Record<string, boolean>;
  
  inclusionsByImageUrl: Record<string, api.InclusionPolygon[]>;
  inclusionsVisibleByImageUrl: Record<string, boolean>;
  inclusionsLoadingByImageUrl: Record<string, boolean>;

  setCalibratingByUrl: (updater: Updater<Record<string, boolean>>) => void;
  setFailedCalibrationByUrl: (updater: Updater<Record<string, boolean>>) => void;
  setCalibrationData: (updater: Updater<Record<string, CalibrationInfo>>) => void;
  setLastMicrometers: (updater: Updater<number>) => void;
  
  setMaskByImageUrl: (updater: Updater<Record<string, string>>) => void;
  setMaskLabelsByImageUrl: (updater: Updater<Record<string, api.HfMaskLabels>>) => void;
  setMaskVisibleByImageUrl: (updater: Updater<Record<string, boolean>>) => void;
  setMaskLoadingByImageUrl: (updater: Updater<Record<string, boolean>>) => void;
  
  setInclusionsByImageUrl: (updater: Updater<Record<string, api.InclusionPolygon[]>>) => void;
  setInclusionsVisibleByImageUrl: (updater: Updater<Record<string, boolean>>) => void;
  setInclusionsLoadingByImageUrl: (updater: Updater<Record<string, boolean>>) => void;
}

const resolveUpdater = <T>(updater: Updater<T>, current: T): T => {
  return typeof updater === 'function' ? (updater as (prev: T) => T)(current) : updater;
};

export const useCalibrationStore = create<CalibrationState>((set) => ({
  calibratingByUrl: {},
  failedCalibrationByUrl: {},
  calibrationData: {},
  lastMicrometers: 100,
  
  maskByImageUrl: {},
  maskLabelsByImageUrl: {},
  maskVisibleByImageUrl: {},
  maskLoadingByImageUrl: {},
  
  inclusionsByImageUrl: {},
  inclusionsVisibleByImageUrl: {},
  inclusionsLoadingByImageUrl: {},

  setCalibratingByUrl: (updater) => set((state) => ({ calibratingByUrl: resolveUpdater(updater, state.calibratingByUrl) })),
  setFailedCalibrationByUrl: (updater) => set((state) => ({ failedCalibrationByUrl: resolveUpdater(updater, state.failedCalibrationByUrl) })),
  setCalibrationData: (updater) => set((state) => ({ calibrationData: resolveUpdater(updater, state.calibrationData) })),
  setLastMicrometers: (updater) => set((state) => ({ lastMicrometers: resolveUpdater(updater, state.lastMicrometers) })),
  
  setMaskByImageUrl: (updater) => set((state) => ({ maskByImageUrl: resolveUpdater(updater, state.maskByImageUrl) })),
  setMaskLabelsByImageUrl: (updater) => set((state) => ({ maskLabelsByImageUrl: resolveUpdater(updater, state.maskLabelsByImageUrl) })),
  setMaskVisibleByImageUrl: (updater) => set((state) => ({ maskVisibleByImageUrl: resolveUpdater(updater, state.maskVisibleByImageUrl) })),
  setMaskLoadingByImageUrl: (updater) => set((state) => ({ maskLoadingByImageUrl: resolveUpdater(updater, state.maskLoadingByImageUrl) })),
  
  setInclusionsByImageUrl: (updater) => set((state) => ({ inclusionsByImageUrl: resolveUpdater(updater, state.inclusionsByImageUrl) })),
  setInclusionsVisibleByImageUrl: (updater) => set((state) => ({ inclusionsVisibleByImageUrl: resolveUpdater(updater, state.inclusionsVisibleByImageUrl) })),
  setInclusionsLoadingByImageUrl: (updater) => set((state) => ({ inclusionsLoadingByImageUrl: resolveUpdater(updater, state.inclusionsLoadingByImageUrl) })),
}));
