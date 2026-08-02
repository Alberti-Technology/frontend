import { create } from 'zustand';
import * as api from '../services/api';

type Updater<T> = T | ((prev: T) => T);

interface ReportState {
  queuedPdfMuestraIds: Set<string>;
  dirtyPdfMuestraIds: Set<string>;
  reportConfig: api.ReportConfig;
  pdfHistory: any[];
  pdfStatusMessage: string | null;
  selectedPdfMuestraId: string | null;

  setQueuedPdfMuestraIds: (updater: Updater<Set<string>>) => void;
  setDirtyPdfMuestraIds: (updater: Updater<Set<string>>) => void;
  setReportConfig: (updater: Updater<api.ReportConfig>) => void;
  setPdfHistory: (updater: Updater<any[]>) => void;
  setPdfStatusMessage: (updater: Updater<string | null>) => void;
  setSelectedPdfMuestraId: (updater: Updater<string | null>) => void;
}

const resolveUpdater = <T>(updater: Updater<T>, current: T): T => {
  return typeof updater === 'function' ? (updater as (prev: T) => T)(current) : updater;
};

export const useReportStore = create<ReportState>((set) => ({
  queuedPdfMuestraIds: new Set(),
  dirtyPdfMuestraIds: new Set(),
  reportConfig: {
    include_masks: true,
    include_histograms: true,
    custom_text: "",
    manual_conclusion: "",
    send_email: true,
  },
  pdfHistory: [],
  pdfStatusMessage: null,
  selectedPdfMuestraId: null,

  setQueuedPdfMuestraIds: (updater) => set((state) => ({ queuedPdfMuestraIds: resolveUpdater(updater, state.queuedPdfMuestraIds) })),
  setDirtyPdfMuestraIds: (updater) => set((state) => ({ dirtyPdfMuestraIds: resolveUpdater(updater, state.dirtyPdfMuestraIds) })),
  setReportConfig: (updater) => set((state) => ({ reportConfig: resolveUpdater(updater, state.reportConfig) })),
  setPdfHistory: (updater) => set((state) => ({ pdfHistory: resolveUpdater(updater, state.pdfHistory) })),
  setPdfStatusMessage: (updater) => set((state) => ({ pdfStatusMessage: resolveUpdater(updater, state.pdfStatusMessage) })),
  setSelectedPdfMuestraId: (updater) => set((state) => ({ selectedPdfMuestraId: resolveUpdater(updater, state.selectedPdfMuestraId) })),
}));
