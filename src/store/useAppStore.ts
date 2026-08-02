import { create } from 'zustand';
import { GalleryView } from '../types';

type Updater<T> = T | ((prev: T) => T);

interface AppState {
  showAdminLegend: boolean;
  showGalleryLegend: boolean;
  showReportLegendModal: boolean;
  
  companyEnabled: boolean;
  showDisabledCompanyModal: boolean;
  
  galleryView: GalleryView;
  
  lightboxIndex: number | null;
  lightboxImages: { name: string; url: string }[];
  
  deleteModal: { id: string; name: string; type: string } | null;
  renameModal: { id: string; name: string; type: string } | null;
  renameModalError: string | null;
  createModal: { parentId: string; type: 'material' | 'muestra' | 'region' | 'micrografia' } | null;
  
  uploadProgress: { [key: string]: number };

  setShowAdminLegend: (updater: Updater<boolean>) => void;
  setShowGalleryLegend: (updater: Updater<boolean>) => void;
  setShowReportLegendModal: (updater: Updater<boolean>) => void;
  
  setCompanyEnabled: (enabled: boolean) => void;
  setShowDisabledCompanyModal: (show: boolean) => void;
  
  setGalleryView: (updater: Updater<GalleryView>) => void;
  
  setLightboxIndex: (index: number | null) => void;
  setLightboxImages: (images: { name: string; url: string }[]) => void;
  
  setDeleteModal: (modal: { id: string; name: string; type: string } | null) => void;
  setRenameModal: (modal: { id: string; name: string; type: string } | null) => void;
  setRenameModalError: (error: string | null) => void;
  setCreateModal: (modal: { parentId: string; type: 'material' | 'muestra' | 'region' | 'micrografia' } | null) => void;
  
  setUploadProgress: (updater: Updater<{ [key: string]: number }>) => void;
}

const resolveUpdater = <T>(updater: Updater<T>, current: T): T => {
  return typeof updater === 'function' ? (updater as (prev: T) => T)(current) : updater;
};

export const useAppStore = create<AppState>((set) => ({
  showAdminLegend: false,
  showGalleryLegend: false,
  showReportLegendModal: false,
  
  companyEnabled: typeof window !== "undefined" ? localStorage.getItem("company_enabled") === "true" : true,
  showDisabledCompanyModal: false,
  
  galleryView: { kind: "none" },
  
  lightboxIndex: null,
  lightboxImages: [],
  
  deleteModal: null,
  renameModal: null,
  renameModalError: null,
  createModal: null,
  
  uploadProgress: {},

  setShowAdminLegend: (updater) => set((state) => ({ showAdminLegend: resolveUpdater(updater, state.showAdminLegend) })),
  setShowGalleryLegend: (updater) => set((state) => ({ showGalleryLegend: resolveUpdater(updater, state.showGalleryLegend) })),
  setShowReportLegendModal: (updater) => set((state) => ({ showReportLegendModal: resolveUpdater(updater, state.showReportLegendModal) })),
  
  setCompanyEnabled: (enabled) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("company_enabled", String(enabled));
    }
    set({ companyEnabled: enabled, showDisabledCompanyModal: !enabled });
  },
  setShowDisabledCompanyModal: (show) => set({ showDisabledCompanyModal: show }),
  
  setGalleryView: (updater) => set((state) => ({ galleryView: resolveUpdater(updater, state.galleryView) })),
  
  setLightboxIndex: (index) => set({ lightboxIndex: index }),
  setLightboxImages: (images) => set({ lightboxImages: images }),
  
  setDeleteModal: (modal) => set({ deleteModal: modal }),
  setRenameModal: (modal) => set({ renameModal: modal }),
  setRenameModalError: (error) => set({ renameModalError: error }),
  setCreateModal: (modal) => set({ createModal: modal }),
  
  setUploadProgress: (updater) => set((state) => ({ uploadProgress: resolveUpdater(updater, state.uploadProgress) })),
}));
