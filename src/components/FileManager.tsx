import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import { createPortal } from "react-dom";
import * as api from "../services/api";
import { CLOUDINARY_BASE_URL } from "../config/apiConfig";
import { MaskLegend } from "./MaskLegend";
import { type MicrographyMeasureCompletedEvent } from "../services/notifications";
import { useWebSocketSync } from "../hooks/useWebSocketSync";
import ChatPanel from "./ChatPanel";
import { Panel, Group } from "react-resizable-panels";
import { useAppStore } from '../store/useAppStore';
import { useCalibrationStore } from '../store/useCalibrationStore';
import { useReportStore } from '../store/useReportStore';
import { useDataStore } from '../store/useDataStore';
import { useCanvasStore } from '../store/useCanvasStore';
import { useMeasurementStore } from '../store/useMeasurementStore';
import { readVerticesCacheStore, writeVerticesCacheStore, DRAWINGS_STORAGE_KEY } from '../utils/cache';
import { ApiLikeError, fixImageUrl, normalizeId, getColorNameFromRgb, isMicrografiaDuplicateError, ENABLE_AUTOCALIBRATION, addMicrografiaToAutoCalibrationQueue } from '../utils/helpers';
import { FolderIcon, ImageFileIcon, TrashIcon, EditIcon, PlusIcon, CloseIcon, CheckIcon, AlertIcon, InfoIcon, XCircleIcon, CaliperIcon, RefreshIcon, RulerIcon, MaskIcon, InclusionsIcon, ChartIcon, ArrowLeftIcon, ArrowRightIcon, PencilIcon, EraserIcon, ChevronDown, ChevronRight } from './FileManager/Icons';
import { Collapsible, ResponsiveGallery, CalibrationInfo, ResizeHandle } from './FileManager/SubComponents';
import { FileManagerModals } from './FileManagerModals';
import { ToastOverlay } from './ToastOverlay';
import { useFileManagerApi } from "../hooks/useFileManagerApi";
import { useFileManagerLogic } from "../hooks/useFileManagerLogic";
import { ApiMuestra, ApiRegion, ApiMicrografia, GalleryView, Muestra, Material, Region, Micrografia, ToastNotification, FileManagerProps } from '../types';
import { ReportsPanel } from "./FileManager/ReportsPanel";
import { AdminPanel } from "./FileManager/AdminPanel";
import { ItemRow } from "./FileManager/ItemRow";
import { ImageLightboxCarousel } from './FileManager/ImageLightboxCarousel';
import GalleryPanel from './FileManager/GalleryPanel';
export default function FileManager({ 
  onLogout, 
  showAdmin = true,
  showGallery = true,
  showReports = true,
  showAssistant = true
}: FileManagerProps) {


      
  // Close legend dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-legend-dropdown]') && !target.closest('[data-legend-trigger]')) {
        setShowAdminLegend(false);
        setShowGalleryLegend(false);
        setShowReportLegendModal(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  
  




  const MAX_VISIBLE_TOASTS = 10;
  const toastIdRef = useRef(0);
  const toastTimeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const {
    showAdminLegend, setShowAdminLegend,
    showGalleryLegend, setShowGalleryLegend,
    showReportLegendModal, setShowReportLegendModal,
    companyEnabled, setCompanyEnabled,
    showDisabledCompanyModal, setShowDisabledCompanyModal,
    galleryView, setGalleryView,
    lightboxIndex, setLightboxIndex,
    lightboxImages, setLightboxImages,
    deleteModal, setDeleteModal,
    renameModal, setRenameModal,
    renameModalError, setRenameModalError,
    createModal, setCreateModal,
    uploadProgress, setUploadProgress
  } = useAppStore();

  const {
    calibratingByUrl, setCalibratingByUrl,
    failedCalibrationByUrl, setFailedCalibrationByUrl,
    calibrationData, setCalibrationData,
    lastMicrometers, setLastMicrometers,
    maskByImageUrl, setMaskByImageUrl,
    maskLabelsByImageUrl, setMaskLabelsByImageUrl,
    maskVisibleByImageUrl, setMaskVisibleByImageUrl,
    maskLoadingByImageUrl, setMaskLoadingByImageUrl,
    inclusionsByImageUrl, setInclusionsByImageUrl,
    inclusionsVisibleByImageUrl, setInclusionsVisibleByImageUrl,
    inclusionsLoadingByImageUrl, setInclusionsLoadingByImageUrl
  } = useCalibrationStore();

  const {
    queuedPdfMuestraIds, setQueuedPdfMuestraIds,
    dirtyPdfMuestraIds, setDirtyPdfMuestraIds,
    reportConfig, setReportConfig,
    pdfHistory, setPdfHistory,
    pdfStatusMessage, setPdfStatusMessage,
    selectedPdfMuestraId, setSelectedPdfMuestraId
  } = useReportStore();
  
  const { apiMuestras, setApiMuestras, apiMateriales, setApiMateriales, apiRegiones, setApiRegiones, apiMicrografias, setApiMicrografias, expandedIds, setExpandedIds, selectedId, setSelectedId, isLoading, setIsLoading } = useDataStore();
  
  const {
    token,
    toastNotifications,
    pushToast,
    removeToast,
    fetchAll,
    handleCreate,
    handleDelete,
    handleRename
  } = useFileManagerLogic();

  const apiOrigin = useMemo(() => {
    try {
      return new URL(api.BASE_URL).origin;
    } catch {
      return "";
    }
  }, []);

  
  
  
  
  
                        

  // Derived state for the UI


  const microInfoByUrl = useMemo(() => {
    const map: Record<string, { rawId: string; umByPx: number | null }> = {};
    apiMicrografias.forEach((mic) => {
      const url = fixImageUrl(mic.imagen);
      if (!url) return;
      map[url] = {
        rawId: String(mic.id),
        umByPx:
          mic.um_by_px !== undefined && mic.um_by_px !== null
            ? Number(mic.um_by_px)
            : null,
      };
    });
    return map;
  }, [apiMicrografias, fixImageUrl]);

  const calibratedByUrl = useMemo(() => {
    const map: Record<string, boolean> = {};
    Object.entries(microInfoByUrl).forEach(([url, info]) => {
      map[url] = typeof info.umByPx === "number" && info.umByPx > 0;
    });
    return map;
  }, [microInfoByUrl]);

  const materials: Material[] = useMemo(
    () =>
      apiMateriales.map((material) => {
        const muestrasDelMaterial = apiMuestras.filter(
          (mue) => String(mue.material) === String(material.id),
        );

        const muestraImage = muestrasDelMaterial[0]?.imagen
          ? fixImageUrl(muestrasDelMaterial[0].imagen)
          : "";

        return {
          id: `mat_${material.id}`,
          name: material.nombre,
          image: muestraImage,
          muestras: muestrasDelMaterial.map((mue) => ({
            id: `mue_${mue.id}`,
            name: mue.nombre,
            image: fixImageUrl(mue.imagen),
            regiones: apiRegiones
              .filter((r) => String(r.muestra) === String(mue.id))
              .map((reg) => ({
                id: `reg_${reg.id}`,
                name: reg.nombre,
                image: fixImageUrl(reg.imagen),
                micrografias: apiMicrografias
                  .filter((mic) => String(mic.region) === String(reg.id))
                  .map((mic) => ({
                    id: `mic_${mic.id}`,
                    rawId: String(mic.id),
                    name: mic.nombre,
                    url: fixImageUrl(mic.imagen),
                    umByPx:
                      mic.um_by_px !== undefined && mic.um_by_px !== null
                        ? Number(mic.um_by_px)
                        : null,
                  })),
              })),
          })),
        };
      }),
    [apiMateriales, apiMuestras, apiRegiones, apiMicrografias, fixImageUrl],
  );

  // Extract raw API id from namespaced id (e.g. "mue_42" → "42")
  const apiId = (namespacedId: string) =>
    namespacedId.replace(/^(mat|mue|reg|mic)_/, "");



  useEffect(() => {
    if (typeof window !== "undefined" && !token) {
      if (onLogout) onLogout();
      return;
    }
    fetchAll();
  }, [fetchAll, token]);

  // WebSockets handled below

  const hasInitializedLastMicrometers = useRef(false);

  useEffect(() => {
    const nextCalibrationData: Record<string, CalibrationInfo> = {};
    const nextFailed: Record<string, boolean> = {};
    let rememberedMicrometers = 0;
    const verticesCache = readVerticesCacheStore();

    apiMicrografias.forEach((mic) => {
      const imageUrl = fixImageUrl(mic.imagen);
      if (!imageUrl) return;

      if ((mic as any).calibration_failed) {
        nextFailed[imageUrl] = true;
      }

      if (mic.um_by_px && mic.um_by_px > 0) {
          const calInfo: CalibrationInfo = {
            umByPx: Number(mic.um_by_px),
            isAi: !!mic.is_ai,
            pixelLength: mic.pixel_length ? Number(mic.pixel_length) : 0,
            micrometers: mic.micrometers ? Number(mic.micrometers) : 0,
          };
          // Merge cached vertices if available for this URL
          const cached = verticesCache[imageUrl];
          if (cached && cached.vertices && mic.is_ai) {
            calInfo.vertices = cached.vertices;
            calInfo.sourceWidth = cached.sourceWidth;
            calInfo.sourceHeight = cached.sourceHeight;
          }
          nextCalibrationData[imageUrl] = calInfo;
          if (mic.micrometers && mic.micrometers > 0) {
            rememberedMicrometers = Number(mic.micrometers);
          }
      }
    });

    setCalibrationData((prev) => {
      const merged = { ...nextCalibrationData };
      for (const key in merged) {
        if (prev[key]) {
          if (prev[key].width) merged[key].width = prev[key].width;
          if (prev[key].height) merged[key].height = prev[key].height;
        }
      }
      return merged;
    });
    setFailedCalibrationByUrl(prev => ({ ...prev, ...nextFailed }));
    
    if (rememberedMicrometers > 0 && !hasInitializedLastMicrometers.current) {
      setLastMicrometers(rememberedMicrometers);
      hasInitializedLastMicrometers.current = true;
    }
  }, [apiMicrografias, fixImageUrl]);

  const microInfoByUrlRef = useRef(microInfoByUrl);
  useEffect(() => { microInfoByUrlRef.current = microInfoByUrl; }, [microInfoByUrl]);

  useEffect(() => {
    const handleCalibrationStarted = (e: any) => {
      const { url } = e.detail;
      setCalibratingByUrl((prev) => ({ ...prev, [url]: true }));
      setFailedCalibrationByUrl((prev) => ({ ...prev, [url]: false }));
    };
    const handleCalibrationUpdated = (e: any) => {
      const { url, data } = e.detail;
      const info = microInfoByUrlRef.current[url];
      
      const existing = useCalibrationStore.getState().calibrationData[url];
      if (existing && existing.isAi === false) {
         setCalibratingByUrl((prev) => ({ ...prev, [url]: false }));
         window.dispatchEvent(new CustomEvent("show_toast", { detail: { message: "Autocalibración por IA lista, no se aplica el resultado por micrografía ya calibrada manualmente", type: "warning" } }));
         return;
      }
      
      setCalibrationData((prev) => ({ ...prev, [url]: data }));
      setCalibratingByUrl((prev) => ({ ...prev, [url]: false }));
      setFailedCalibrationByUrl((prev) => ({ ...prev, [url]: false }));
      // Persist vertices to localStorage
      if (data.vertices && data.vertices.length > 0) {
        const freshVerticesCache = readVerticesCacheStore();
        freshVerticesCache[url] = {
          vertices: data.vertices,
          sourceWidth: data.sourceWidth || 0,
          sourceHeight: data.sourceHeight || 0,
        };
        writeVerticesCacheStore(freshVerticesCache);
      }
      // Persist to backend and update local state
      if (info?.rawId && data?.umByPx) {
        const fd = new FormData();
        fd.append("um_by_px", String(data.umByPx));
        fd.append("is_ai", "true");
        if (data.pixelLength) fd.append("pixel_length", String(data.pixelLength));
        if (data.micrometers) fd.append("micrometers", String(data.micrometers));

        api.updateMicrografia(info.rawId, fd).then(() => {
          setApiMicrografias((prev) =>
            prev.map((m) =>
              String(m.id) === info.rawId
                ? { ...m, um_by_px: data.umByPx, is_ai: true, pixel_length: data.pixelLength, micrometers: data.micrometers }
                : m,
            ),
          );
        }).catch((err) => console.error("Error persisting auto-calibration", err));
      }
    };
    const handleCalibrationFailed = (e: any) => {
      const { url } = e.detail;
      
      const existing = useCalibrationStore.getState().calibrationData[url];
      if (existing && existing.isAi === false) {
         setCalibratingByUrl((prev) => ({ ...prev, [url]: false }));
         window.dispatchEvent(new CustomEvent("show_toast", { detail: { message: "Autocalibración por IA fallida, micrografía ya calibrada manualmente", type: "warning" } }));
         return;
      }

      setCalibratingByUrl((prev) => ({ ...prev, [url]: false }));
      setFailedCalibrationByUrl((prev) => ({ ...prev, [url]: true }));

      const info = microInfoByUrlRef.current[url];
      if (info?.rawId) {
        const fd = new FormData();
        fd.append("calibration_failed", "true");
        api.updateMicrografia(info.rawId, fd).then(() => {
          setApiMicrografias((prev) =>
            prev.map((m) =>
              String(m.id) === info.rawId
                ? { ...m, calibration_failed: true } as any
                : m,
            ),
          );
        }).catch((err) => console.error("Error persisting auto-calibration failure", err));
      }
    };
    window.addEventListener("calibration_started", handleCalibrationStarted);
    window.addEventListener("calibration_updated", handleCalibrationUpdated);
    window.addEventListener("calibration_failed", handleCalibrationFailed);
    return () => {
      window.removeEventListener("calibration_started", handleCalibrationStarted);
      window.removeEventListener("calibration_updated", handleCalibrationUpdated);
      window.removeEventListener("calibration_failed", handleCalibrationFailed);
    };
  }, []);

  useEffect(() => {
    return () => {
      toastTimeoutsRef.current.forEach((timeout) => clearTimeout(timeout));
      toastTimeoutsRef.current = [];
    };
  }, []);



  // Expanded folder ids
  
  

  // Gallery view
    const [galleryTitle, setGalleryTitle] = useState("Seleccione un elemento");
  const [measureEventsById, setMeasureEventsById] =
    useState<Record<string, MicrographyMeasureCompletedEvent>>({});
  const [measurementOverlayVisibleByUrl, setMeasurementOverlayVisibleByUrl] =
    useState<Record<string, boolean>>({});
  const missingActiveMicrografiaRefreshRef = useRef<string | null>(null);

  // Derive context info for the lightbox from the selected node in the tree
  const lightboxContextInfo = useMemo(() => {
    const info: {
      materialName?: string;
      muestraName?: string;
      regionName?: string;
    } = {};
    if (!selectedId) return info;
    for (const mat of materials) {
      if (mat.id === selectedId) {
        info.materialName = mat.name;
        return info;
      }
      for (const mue of mat.muestras) {
        if (mue.id === selectedId) {
          info.materialName = mat.name;
          info.muestraName = mue.name;
          return info;
        }
        for (const reg of mue.regiones) {
          if (reg.id === selectedId) {
            info.materialName = mat.name;
            info.muestraName = mue.name;
            info.regionName = reg.name;
            return info;
          }
          for (const mic of reg.micrografias) {
            if (mic.id === selectedId) {
              info.materialName = mat.name;
              info.muestraName = mue.name;
              info.regionName = reg.name;
              return info;
            }
          }
        }
      }
    }
    return info;
  }, [selectedId, materials]);

  // Keep galleryView in sync with materials (e.g. on deletions)
  useEffect(() => {
    setGalleryView((prev) => {
      switch (prev.kind) {
        case "single-material": {
          const updated = materials.find((m) => m.id === prev.material.id);
          return updated ? { ...prev, material: updated } : { kind: "none" };
        }
        case "single-muestra": {
          for (const mat of materials) {
            const updated = mat.muestras.find((m) => m.id === prev.muestra.id);
            if (updated) return { ...prev, muestra: updated };
          }
          return { kind: "none" };
        }
        case "single-region": {
          for (const mat of materials) {
            for (const mue of mat.muestras) {
              const updated = mue.regiones.find((r) => r.id === prev.region.id);
              if (updated) return { ...prev, region: updated };
            }
          }
          return { kind: "none" };
        }
        case "micrografias": {
          const allMicros = materials.flatMap(m => m.muestras).flatMap(m => m.regiones).flatMap(r => r.micrografias);
          const map = new Map(allMicros.map(m => [m.id, m]));
          const updatedImages = prev.images.map(img => map.get(img.id)).filter((img): img is NonNullable<typeof img> => img !== undefined);
          
          if (updatedImages.length !== prev.images.length || updatedImages.some((img, i) => img !== prev.images[i])) {
            return { ...prev, images: updatedImages };
          }
          return prev;
        }
        case "all-materials": {
          const updatedImages = materials.map(m => ({ name: m.name, url: m.image }));
          if (updatedImages.length !== prev.images.length || updatedImages.some((img, i) => img.url !== prev.images[i].url)) {
            return { ...prev, images: updatedImages };
          }
          return prev;
        }
        case "all-muestras": {
          const allMuestras = materials.flatMap(m => m.muestras);
          const updatedImages = allMuestras.map(m => ({ name: m.name, url: m.image }));
          if (updatedImages.length !== prev.images.length || updatedImages.some((img, i) => img.url !== prev.images[i].url)) {
            return { ...prev, images: updatedImages };
          }
          return prev;
        }
        case "all-regiones": {
          const allRegiones = materials.flatMap(m => m.muestras).flatMap(m => m.regiones);
          const updatedImages = allRegiones.map(r => ({ name: r.name, url: r.image }));
          if (updatedImages.length !== prev.images.length || updatedImages.some((img, i) => img.url !== prev.images[i].url)) {
            return { ...prev, images: updatedImages };
          }
          return prev;
        }
      }
      return prev;
    });
  }, [materials, setGalleryView]);

  // UI


  const checkMicrographLimit = useCallback((action: () => void) => {
    if (!companyEnabled) {
      pushToast(`Tu compañía no está habilitada aún.`, "error", 5000);
    } else {
      action();
    }
  }, [companyEnabled, pushToast]);

  useEffect(() => {
    const handleShowToast = (e: any) => {
      pushToast(e.detail.message, e.detail.type || "warning", e.detail.duration || 6000);
    };
    window.addEventListener("show_toast", handleShowToast);
    return () => window.removeEventListener("show_toast", handleShowToast);
  }, [pushToast]);



  const closeMenu = () => undefined;

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // ---- Gallery image list derived from view ----
  const getGalleryImages = (): { name: string; url: string; id?: string }[] => {
    const v = galleryView;
    switch (v.kind) {
      case "none":
        return [];
      case "all-materials":
        return v.images;
      case "single-material":
        return [{ name: v.material.name, url: v.material.image }];
      case "all-muestras":
        return v.images;
      case "single-muestra":
        return [{ name: v.muestra.name, url: v.muestra.image }];
      case "all-regiones":
        return v.images;
      case "single-region":
        return [{ name: v.region.name, url: v.region.image }];
      case "micrografias":
        return v.images.map((m) => ({ name: m.name, url: m.url, id: m.rawId }));
      default:
        return [];
    }
  };
  const galleryImages = getGalleryImages();
  const galleryCalibrableByUrl = useMemo(() => {
    if (galleryView.kind !== "micrografias")
      return {} as Record<string, boolean>;
    const map: Record<string, boolean> = {};
    galleryImages.forEach((img) => {
      map[img.url] = true;
    });
    return map;
  }, [galleryImages, galleryView.kind]);

  const galleryCalibratedByUrl = useMemo(() => {
    const map: Record<string, boolean> = {};
    galleryImages.forEach((img) => {
      map[img.url] =
        !!galleryCalibrableByUrl[img.url] && !!calibratedByUrl[img.url];
    });
    return map;
  }, [galleryImages, galleryCalibrableByUrl, calibratedByUrl]);

  const measurementOverlayById = useMemo(() => {
    const overlays: Record<string, string> = {};
    
    apiMicrografias.forEach((mic) => {
      if (mic.measure_imagen) {
        overlays[String(mic.id)] = fixImageUrl(mic.measure_imagen);
      }
    });

    // Merge in real-time WebSocket events (may arrive before fetchAll updates apiMicrografias)
    for (const [microId, evt] of Object.entries(measureEventsById)) {
      if (evt.imagen) {
        overlays[microId] = fixImageUrl(evt.imagen);
      }
    }
    
    return overlays;
  }, [measureEventsById, apiMicrografias, fixImageUrl]);

  const toggleMeasurementOverlay = useCallback((imageUrl: string) => {
    setMeasurementOverlayVisibleByUrl((prev) => ({
      ...prev,
      [imageUrl]: !prev[imageUrl],
    }));
  }, []);

  const microSiblingsByUrl = useMemo(() => {
    const map: Record<string, { name: string; url: string }[]> = {};
    materials.forEach((mat) => {
      mat.muestras.forEach((mue) => {
        mue.regiones.forEach((reg) => {
          const regionImages = reg.micrografias.map((m) => ({
            name: m.name,
            url: m.url,
            id: m.rawId,
          }));
          reg.micrografias.forEach((mic) => {
            map[mic.url] = regionImages;
          });
        });
      });
    });
    return map;
  }, [materials]);

  const lightboxCalibrableByUrl = useMemo(() => {
    const map: Record<string, boolean> = {};
    lightboxImages.forEach((img) => {
      map[img.url] = !!microInfoByUrl[img.url];
    });
    return map;
  }, [lightboxImages, microInfoByUrl]);

  const microMaterialCodeByUrl = useMemo(() => {
    const map: Record<string, string> = {};
    apiMateriales.forEach((apiMat) => {
      const code = apiMat.code || "";
      const muestrasOfMat = apiMuestras.filter(
        (mue) => String(mue.material) === String(apiMat.id),
      );
      muestrasOfMat.forEach((mue) => {
        const regionsOfMue = apiRegiones.filter(
          (r) => String(r.muestra) === String(mue.id),
        );
        regionsOfMue.forEach((reg) => {
          const microsOfReg = apiMicrografias.filter(
            (mic) => String(mic.region) === String(reg.id),
          );
          microsOfReg.forEach((mic) => {
            const url = fixImageUrl(mic.imagen);
            map[url] = code;
          });
        });
      });
    });
    return map;
  }, [apiMateriales, apiMuestras, apiRegiones, apiMicrografias, fixImageUrl]);

  const microMaterialHasModelByUrl = useMemo(() => {
    const map: Record<string, boolean> = {};
    apiMateriales.forEach((apiMat) => {
      const hasModel = !!apiMat.has_model;
      const muestrasOfMat = apiMuestras.filter(
        (mue) => String(mue.material) === String(apiMat.id),
      );
      muestrasOfMat.forEach((mue) => {
        const regionsOfMue = apiRegiones.filter(
          (r) => String(r.muestra) === String(mue.id),
        );
        regionsOfMue.forEach((reg) => {
          const microsOfReg = apiMicrografias.filter(
            (mic) => String(mic.region) === String(reg.id),
          );
          microsOfReg.forEach((mic) => {
            const url = fixImageUrl(mic.imagen);
            map[url] = hasModel;
          });
        });
      });
    });
    return map;
  }, [apiMateriales, apiMuestras, apiRegiones, apiMicrografias, fixImageUrl]);

  const getMaterialHasModelByRegionId = useCallback((regionId: string) => {
    const reg = apiRegiones.find(r => String(r.id) === regionId);
    if (!reg) return false;
    const mue = apiMuestras.find(m => String(m.id) === String(reg.muestra));
    if (!mue) return false;
    const mat = apiMateriales.find(m => String(m.id) === String(mue.material));
    return !!mat?.has_model;
  }, [apiRegiones, apiMuestras, apiMateriales]);

  // ---- Helper: recursively collect children IDs for removal ----
  const getChildIds = (
    mat: Material,
    mueId?: string,
    regId?: string,
  ): string[] => {
    const ids: string[] = [];
    if (regId) return ids; // regions have no expandable children
    if (mueId) {
      const mue = mat.muestras.find((m) => m.id === mueId);
      mue?.regiones.forEach((r) => ids.push(r.id));
      return ids;
    }
    // material level: collect all muestras + regiones
    mat.muestras.forEach((m) => {
      ids.push(m.id);
      m.regiones.forEach((r) => ids.push(r.id));
    });
    return ids;
  };

  // ---- Header click handlers (just show group gallery) ----
  const handleHeaderMateriales = () => {
    setSelectedId(null);
    setGalleryTitle("Todos los Materiales");
    setGalleryView({
      kind: "all-materials",
      images: materials.map((m) => ({ name: m.name, url: m.image })),
    });
  };

  const handleHeaderMuestras = (mat: Material) => {
    setSelectedId(null);
    setGalleryTitle(`Muestras de ${mat.name}`);
    setGalleryView({
      kind: "all-muestras",
      images: mat.muestras.map((m) => ({ name: m.name, url: m.image })),
    });
  };

  const handleHeaderRegiones = (mue: Muestra) => {
    setSelectedId(null);
    setGalleryTitle(`Regiones de ${mue.name}`);
    setGalleryView({
      kind: "all-regiones",
      images: mue.regiones.map((r) => ({ name: r.name, url: r.image })),
    });
  };

  const handleHeaderMicrografias = (reg: Region) => {
    setSelectedId(null);
    setGalleryTitle(`Micrografías de ${reg.name}`);
    setGalleryView({ kind: "micrografias", images: reg.micrografias });
  };

  // ---- Item click handlers (independent toggle) ----
  // Each folder toggles independently. Collapsing also collapses children.
  const handleClickMaterial = (mat: Material) => {
    setSelectedId(mat.id);
    setGalleryTitle(mat.name);
    setGalleryView({ kind: "single-material", material: mat });
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(mat.id)) {
        next.delete(mat.id);
        // Also collapse all children
        mat.muestras.forEach((mue) => {
          next.delete(mue.id);
          mue.regiones.forEach((r) => next.delete(r.id));
        });
      } else {
        next.add(mat.id);
      }
      return next;
    });
  };

  const handleClickMuestra = (mue: Muestra, parentMat: Material) => {
    setSelectedId(mue.id);
    setGalleryTitle(mue.name);
    setGalleryView({ kind: "single-muestra", muestra: mue });
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(mue.id)) {
        next.delete(mue.id);
        mue.regiones.forEach((r) => next.delete(r.id));
      } else {
        next.add(mue.id);
      }
      return next;
    });
  };

  const handleClickRegion = (
    reg: Region,
    parentMue: Muestra,
    parentMat: Material,
  ) => {
    setSelectedId(reg.id);
    setGalleryTitle(reg.name);
    setGalleryView({ kind: "single-region", region: reg });
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(reg.id)) {
        next.delete(reg.id);
      } else {
        next.add(reg.id);
      }
      return next;
    });
  };

  const handleClickMicrografia = (mic: Micrografia, parentReg: Region) => {
    setSelectedId(mic.id);
    setGalleryTitle(mic.name);
    setGalleryView({ kind: "micrografias", images: [mic] });
  };

  const getMuestraIdFromRegionId = useCallback(
    (regionId: string) => {
      const region = apiRegiones.find((r) => String(r.id) === String(regionId));
      return region ? String(region.muestra) : null;
    },
    [apiRegiones],
  );

  const getMuestraIdFromMicroId = useCallback(
    (microId: string) => {
      const micro = apiMicrografias.find(
        (m) => String(m.id) === String(microId),
      );
      if (!micro) return null;
      return getMuestraIdFromRegionId(String(micro.region));
    },
    [apiMicrografias, getMuestraIdFromRegionId],
  );

  const markMuestraAsDirtyForPdf = useCallback((muestraId: string | null) => {
    if (!muestraId) return;
    setDirtyPdfMuestraIds((prev) => new Set(prev).add(String(muestraId)));
    setQueuedPdfMuestraIds((prev) => {
      const next = new Set(prev);
      next.delete(String(muestraId));
      return next;
    });
  }, []);

  // ---- API Mutations ----

  // ---- PDF Tracking State ----
    const [pdfLoading, setPdfLoading] = useState(false);
    const [showInformeDispatchMessage, setShowInformeDispatchMessage] =
    useState(false);
    const PDF_SELECTOR_ITEM_HEIGHT = 38;
  const PDF_SELECTOR_ITEM_GAP = 6;

  const REPORT_HISTORY_ITEM_HEIGHT = 36;
  const REPORT_HISTORY_ITEM_GAP = 7;

  const materialNameById = useMemo(() => {
    const map: Record<string, string> = {};
    apiMateriales.forEach((material) => {
      map[String(material.id)] = material.nombre;
    });
    return map;
  }, [apiMateriales]);

  const getMuestraDisplayName = useCallback(
    (mue: ApiMuestra) => {
      const materialName = materialNameById[String(mue.material)] || "";
      return materialName ? `${mue.nombre} (${materialName})` : mue.nombre;
    },
    [materialNameById],
  );

  const refreshReportHistory = useCallback(async () => {
    if (!token) return;
    try {
      const response = await api.getReportList();
      const normalized = Array.isArray(response)
        ? response
        : Array.isArray((response as any)?.results)
          ? (response as any).results
          : [];
      const sorted = [...normalized].sort((a: any, b: any) => {
        const timeA = Date.parse(a?.fecha || "");
        const timeB = Date.parse(b?.fecha || "");
        if (
          Number.isFinite(timeA) &&
          Number.isFinite(timeB) &&
          timeA !== timeB
        ) {
          return timeB - timeA;
        }

        const idA = Number(a?.id);
        const idB = Number(b?.id);
        if (Number.isFinite(idA) && Number.isFinite(idB) && idA !== idB) {
          return idB - idA;
        }

        return String(b?.id ?? "").localeCompare(String(a?.id ?? ""));
      });
      setPdfHistory(sorted);
    } catch (err) {
      console.warn("No se pudo obtener la lista de informes", err);
      setPdfHistory([]);
    }
  }, [token]);

  useWebSocketSync({
    token,
    companyEnabled,
    fetchAll,
    refreshReportHistory,
    setMeasureEventsById,
    missingActiveMicrografiaRefreshRef
  });

  useEffect(() => {
    refreshReportHistory();
  }, [refreshReportHistory]);

  // Poll for report status if any report is in progress
  useEffect(() => {
    if (!token || !pdfHistory.length) return;

    const inProgressReports = pdfHistory.filter(
      (pdf: any) => pdf.status === "processing" || (pdf.job && (pdf.job.status === "queued" || pdf.job.status === "running"))
    );

    if (inProgressReports.length === 0) return;

    let isPolling = false;
    const intervalId = setInterval(async () => {
      if (isPolling) return;
      isPolling = true;
      let updated = false;
      const newHistory = [...pdfHistory];
      
      for (const report of inProgressReports) {
        try {
          const res = await api.trackReportStatus(report.id);
          const idx = newHistory.findIndex((r: any) => r.id === report.id);
          if (idx !== -1) {
            // Check if status changed
            if (JSON.stringify(newHistory[idx].job) !== JSON.stringify(res.job) || newHistory[idx].status !== res.status) {
              newHistory[idx] = res;
              updated = true;
              
              if (res.status === "completed" || (res.job && res.job.status === "completed")) {
                pushToast("Informe generado correctamente.", "success", 3000);
              } else if (res.status === "failed" || (res.job && res.job.status === "failed")) {
                pushToast(`Error al generar informe: ${res.job?.last_error || 'Error desconocido'}`, "error", 8000);
              }
            }
          }
        } catch (e) {
          console.error("Error polling report status", e);
        }
      }
      
      if (updated) {
        setPdfHistory((prev) => {
          const next = [...prev];
          for (const report of inProgressReports) {
            const freshIdx = next.findIndex((r: any) => r.id === report.id);
            if (freshIdx !== -1) {
              const matchingNew = newHistory.find((r: any) => r.id === report.id);
              if (matchingNew) {
                next[freshIdx] = matchingNew;
              }
            }
          }
          return next;
        });
      }
      isPolling = false;
    }, 500);

    return () => clearInterval(intervalId);
  }, [token, pdfHistory, pushToast]);



  const isMuestraLockedForPdfSelection = useCallback(
    (muestraId: string) =>
      queuedPdfMuestraIds.has(String(muestraId)) &&
      !dirtyPdfMuestraIds.has(String(muestraId)),
    [queuedPdfMuestraIds, dirtyPdfMuestraIds],
  );

  const selectedPdfMuestraLocked =
    !!selectedPdfMuestraId &&
    isMuestraLockedForPdfSelection(String(selectedPdfMuestraId));

  const queueMissingCalibrationToasts = useCallback(
    (
      missing: Array<{
        micrografia_id?: number;
        micrografia_nombre?: string;
        region_nombre?: string;
      }>,
    ) => {
      const seen = new Set<string>();
      missing.forEach((item, index) => {
        const key = String(
          item.micrografia_id ?? `${item.micrografia_nombre}-${index}`,
        );
        if (seen.has(key)) return;
        seen.add(key);

        const message = item.micrografia_nombre
          ? `Falta calibrar ${item.micrografia_nombre}${item.region_nombre ? ` (${item.region_nombre})` : ""}`
          : "Hay micrografías sin calibrar";

        const timeout = setTimeout(() => {
          pushToast(message, "error", 7200 + index * 1100);
        }, index * 200);
        toastTimeoutsRef.current.push(timeout);
      });
    },
    [pushToast],
  );

  const handleGeneratePdf = async (targetMuestraId: string) => {
    if (!targetMuestraId) {
      pushToast(
        "Seleccioná una muestra para generar el informe.",
        "info",
        5600,
      );
      return;
    }

    const selectedMuestra = apiMuestras.find(
      (mue) => String(mue.id) === String(targetMuestraId),
    );
    if (!selectedMuestra) {
      pushToast("No se encontró la muestra seleccionada.", "error", 7200);
      return;
    }

    const relatedRegiones = apiRegiones.filter(
      (region) => String(region.muestra) === String(selectedMuestra.id),
    );
    if (relatedRegiones.length === 0) {
      pushToast(
        "La muestra debe tener al menos una región para generar el informe.",
        "error",
        8200,
      );
      return;
    }

    const relatedMicrografias = apiMicrografias.filter((micro) =>
      relatedRegiones.some(
        (region) => String(region.id) === String(micro.region),
      ),
    );
    const uncalibratedMicrografias = relatedMicrografias.filter((micro) => {
      const ratio =
        micro.um_by_px !== undefined && micro.um_by_px !== null
          ? Number(micro.um_by_px)
          : null;
      return !ratio || !Number.isFinite(ratio) || ratio <= 0 || ratio === 1;
    });

    if (relatedMicrografias.length === 0) {
      pushToast(
        "La muestra debe tener al menos una micrografía para generar el informe.",
        "error",
        8600,
      );
      return;
    }

    if (uncalibratedMicrografias.length > 0) {
      pushToast(
        "Todas las micrografías de la muestra deben estar calibradas para generar el informe.",
        "error",
        8600,
      );
      return;
    }

    const unsupportedMicrografias = relatedMicrografias.filter((micro) => {
      return microMaterialHasModelByUrl[fixImageUrl(micro.imagen)] === false;
    });

    if (unsupportedMicrografias.length > 0) {
      pushToast("Material no soportado.", "error", 5000);
      return;
    }

    try {
      setPdfLoading(true);
      pushToast("Generación iniciada...", "info", 3000);
      const data = await api.generatePdf(targetMuestraId, reportConfig);
      await refreshReportHistory();
    } catch (err: any) {
      console.error(err);
      pushToast(`Error: ${err.message}`, "error", 5000);
    } finally {
      setPdfLoading(false);
    }
  };

  const bakeMaskAlpha = async (
    maskSrc: string,
    originalSrc: string,
  ): Promise<string> => {
    return new Promise((resolve) => {
      const maskImg = new Image();
      maskImg.crossOrigin = "anonymous";

      const origImg = new Image();
      origImg.crossOrigin = "anonymous";

      let maskLoaded = false;
      let origLoaded = false;
      let origFailed = false;

      const tryResolve = () => {
        if (!maskLoaded || !origLoaded) return;

        // Use original image dimensions as the target size.
        // If the original failed to load, fall back to mask's own dimensions
        // to avoid creating a 0×0 canvas.
        const targetW = origFailed
          ? (maskImg.naturalWidth || maskImg.width)
          : (origImg.naturalWidth || origImg.width);
        const targetH = origFailed
          ? (maskImg.naturalHeight || maskImg.height)
          : (origImg.naturalHeight || origImg.height);

        if (!targetW || !targetH) {
          // Both images have no dimensions; return raw mask
          resolve(maskSrc);
          return;
        }

        const canvas = document.createElement("canvas");
        canvas.width = targetW;
        canvas.height = targetH;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.globalAlpha = 0.65;
          
          const mWidth = maskImg.naturalWidth || maskImg.width;
          const mHeight = maskImg.naturalHeight || maskImg.height;

          // Si la máscara es cuadrada (ej. 512x512 o 1024x1024) y la imagen original no lo es, 
          // significa que la máscara fue rellenada (letterbox) y debemos recortar el exceso.
          if (mWidth === mHeight && targetW !== targetH && mWidth > 0) {
             const scale = Math.min(mWidth / targetW, mHeight / targetH);
             const newW = Math.round(targetW * scale);
             const newH = Math.round(targetH * scale);
             const xOffset = Math.floor((mWidth - newW) / 2);
             const yOffset = Math.floor((mHeight - newH) / 2);
             
             ctx.drawImage(maskImg, xOffset, yOffset, newW, newH, 0, 0, targetW, targetH);
          } else {
             // Ya está en la proporción correcta o la original también es cuadrada
             ctx.drawImage(maskImg, 0, 0, targetW, targetH);
          }
          
          resolve(canvas.toDataURL("image/png"));
        } else {
          resolve(maskSrc);
        }
      };

      maskImg.onload = () => {
        maskLoaded = true;
        tryResolve();
      };
      maskImg.onerror = () => resolve(maskSrc);
      origImg.onload = () => {
        origLoaded = true;
        tryResolve();
      };
      origImg.onerror = () => {
        origFailed = true;
        origLoaded = true;
        tryResolve();
      };

      maskImg.src = maskSrc;
      origImg.src = originalSrc;
    });
  };

  const handleGenerateMask = useCallback(
    async (imageUrl: string) => {
      const microInfo = microInfoByUrl[imageUrl];
      if (!microInfo?.rawId) {
        pushToast("Esta imagen no admite generación de máscara.", "info", 5200);
        return;
      }

      const hasModel = microMaterialHasModelByUrl[imageUrl] ?? true;
      if (!hasModel) {
        pushToast("Material no soportado.", "error", 5000);
        return;
      }

      const hasMaskLoaded = !!maskByImageUrl[imageUrl];
      if (hasMaskLoaded) {
        setMaskVisibleByImageUrl((prev) => ({
          ...prev,
          [imageUrl]: !prev[imageUrl],
        }));
        return;
      }

      if (maskLoadingByImageUrl[imageUrl]) return;

      setMaskLoadingByImageUrl((prev) => ({ ...prev, [imageUrl]: true }));
      // The toast is deferred until we know if it's from backend or not

      try {
        let finalMaskUrl = "";
        let finalMaskLabels: api.HfMaskLabels | undefined;

        const materialCode = microMaterialCodeByUrl[imageUrl] || "";
        // Acero (45951) usa /rgb/, magnesia (45956) y otros usan /
        const suffix = materialCode === "45951" ? "/rgb/" : "/";
        const endpoint = materialCode
          ? `${api.HF_BASE_URL}/segment/${materialCode}${suffix}`
          : undefined;
        // Acero (/rgb/) handles resizing server-side; other models output
        // a fixed 512x512 mask, so we letterbox the image to match.
        const modelInputSize = materialCode !== "45951" ? 512 : undefined;

        let fromBackend = false;
        try {
          const maskData = await api.getMask(microInfo.rawId);
          if (maskData) {
            finalMaskUrl = fixImageUrl(maskData.mask_url);
            if (maskData.labels) {
              finalMaskLabels = maskData.labels;
            }
            fromBackend = true;
          }
        } catch (e) {
          console.warn("Mask not found in backend, generating locally...", e);
        }

        if (!finalMaskLabels && materialCode === "45951") {
          finalMaskLabels = api.ACERO_LABELS;
        }



        if (!fromBackend) {
          pushToast("Generando máscara de la micrografía...", "info", 5000);
          try {
            const hfResult = await api.generateMaskWithHf(
              imageUrl,
              endpoint,
              modelInputSize,
            );
            finalMaskUrl = hfResult.url;
            finalMaskLabels = hfResult.labels;
            
            // Guardar la máscara en el backend si no provino de ahí
            if (microInfo?.rawId && finalMaskUrl) {
              api.saveMask(microInfo.rawId, finalMaskUrl, finalMaskLabels).catch((e) => {
                console.warn("Error guardando la máscara en el backend", e);
              });
            }
          } catch {
            throw new Error("No se pudo generar la máscara. El servidor de IA no está disponible.");
          }
        }

        if (!finalMaskUrl) {
          throw new Error("No se obtuvo la máscara de la micrografía");
        }

        const bakedUrl = await bakeMaskAlpha(finalMaskUrl, imageUrl);
        if (bakedUrl) {
          finalMaskUrl = bakedUrl;
        }

        setMaskByImageUrl((prev) => {
          const next = { ...prev };
          next[imageUrl] = finalMaskUrl;
          return next;
        });
        setMaskVisibleByImageUrl((prev) => ({ ...prev, [imageUrl]: true }));

        // Re-read the cache right before writing to avoid overwriting
        // masks generated concurrently for other micrographs.
        if (finalMaskLabels && Object.keys(finalMaskLabels).length > 0) {
          setMaskLabelsByImageUrl((prev) => ({
            ...prev,
            [imageUrl]: finalMaskLabels as api.HfMaskLabels,
          }));
        }

        pushToast(
          "Máscara aplicada satisfactoriamente.",
          "info",
          5600,
        );
      } catch (err) {
        const maybeApiError = err as ApiLikeError;
        const msg =
          maybeApiError?.data?.error ||
          maybeApiError?.data?.detail ||
          maybeApiError?.message ||
          "No se pudo generar la máscara.";
        pushToast(msg, "error", 8600);
      } finally {
        setMaskLoadingByImageUrl((prev) => ({ ...prev, [imageUrl]: false }));
      }
    },
    [
      fixImageUrl,
      maskByImageUrl,
      maskLabelsByImageUrl,
      maskLoadingByImageUrl,
      maskVisibleByImageUrl,
      microInfoByUrl,
      microMaterialCodeByUrl,
      pushToast,
    ],
  );

  const handleDetectInclusiones = useCallback(
    async (imageUrl: string) => {
      const hasInclusionsLoaded = !!inclusionsByImageUrl[imageUrl];
      if (hasInclusionsLoaded) {
        setInclusionsVisibleByImageUrl((prev) => ({
          ...prev,
          [imageUrl]: !prev[imageUrl],
        }));
        return;
      }

      if (inclusionsLoadingByImageUrl[imageUrl]) return;

      setInclusionsLoadingByImageUrl((prev) => ({ ...prev, [imageUrl]: true }));
      pushToast("Detectando inclusiones...", "info", 4000);

      try {
        const boxes = await api.detectInclusiones(imageUrl);
        setInclusionsByImageUrl((prev) => ({ ...prev, [imageUrl]: boxes }));
        setInclusionsVisibleByImageUrl((prev) => ({ ...prev, [imageUrl]: true }));
        pushToast("Inclusiones detectadas.", "success", 4000);
      } catch (err) {
        const maybeApiError = err as ApiLikeError;
        const msg = maybeApiError?.message || "No se pudo detectar inclusiones.";
        pushToast(msg, "error", 6000);
      } finally {
        setInclusionsLoadingByImageUrl((prev) => ({ ...prev, [imageUrl]: false }));
      }
    },
    [inclusionsByImageUrl, inclusionsLoadingByImageUrl, pushToast]
  );

  // ---- Action Row ----

  // ---- Section Header ----
  const SectionHeader = ({
    label,
    onClick,
  }: {
    label: string;
    onClick: () => void;
  }) => (
    <div
      className="px-3 py-2 text-sm font-bold text-[#4d6684] uppercase tracking-widest cursor-pointer hover:text-[#339eea] hover:bg-[#eef8ff] transition-colors select-none border-b border-[#10243f08]"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      title={`Ver todas las imágenes de ${label}`}
      style={{ flexShrink: 0 }}
    >
      {label}
    </div>
  );


  const informesListIsEmpty = pdfHistory.length === 0 && !pdfStatusMessage;
  const muestrasListIsEmpty = apiMuestras.length === 0;

  if (!showAdmin && !showGallery && !showReports && !showAssistant) {
    return (
      <div className="flex items-center justify-center h-full w-full bg-white rounded-2xl border border-[#10243f14] shadow-sm">
        <div className="text-center opacity-70 flex flex-col items-center">
          <div className="text-[#9ca3af] mb-3">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 22h14a2 2 0 0 0 2-2V7.5L14.5 2H6a2 2 0 0 0-2 2v4"></path><polyline points="14 2 14 8 20 8"></polyline><path d="M2 15h10"></path><path d="M9 18l3-3-3-3"></path></svg>
          </div>
          <p className="text-[#6b7280] text-[0.9rem] italic m-0">
            Elija la sección que quiera ver desde la barra lateral izquierda
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "contents" }}>
      <Group 
        id="file-manager-group"
        orientation="horizontal" 
        style={{ height: "100%", width: "100%", display: "flex", flexDirection: "row" }}
      >
      {showAdmin && (
        <Panel 
          /* @ts-ignore - react-resizable-panels Panel accepts order internally for sorting conditional rendering */
          id="panel-admin" order={1} minSize={15} collapsible={false} defaultSize={25}
        >
          {/* ======== ISLAND 1: DIRECTORY ======== */}
          <AdminPanel
            closeMenu={closeMenu}
            handleHeaderMateriales={handleHeaderMateriales}
            handleHeaderMuestras={handleHeaderMuestras}
            handleHeaderRegiones={handleHeaderRegiones}
            handleHeaderMicrografias={handleHeaderMicrografias}
            handleClickMaterial={handleClickMaterial}
            handleClickMuestra={handleClickMuestra}
            handleClickRegion={handleClickRegion}
            handleClickMicrografia={handleClickMicrografia}
            checkMicrographLimit={checkMicrographLimit}
            handleGeneratePdf={handleGeneratePdf}
            materials={materials}
            measureEventsById={measureEventsById}
            microMaterialHasModelByUrl={microMaterialHasModelByUrl}
            fixImageUrl={fixImageUrl}
          />
        </Panel>
      )}
      {showAdmin && (showGallery || showReports || showAssistant) && <ResizeHandle id="handle-admin" isVisible={showGallery} />}
      
      {showGallery && (
        <Panel 
          /* @ts-ignore - react-resizable-panels Panel accepts order internally for sorting conditional rendering */
          id="panel-gallery" order={2} minSize={15} collapsible={false} defaultSize={44}
        >
          {/* ======== ISLAND 2: GALLERY ======== */}
          <GalleryPanel
            galleryTitle={galleryTitle}
            showGalleryLegend={showGalleryLegend}
            setShowGalleryLegend={setShowGalleryLegend}
            setShowAdminLegend={setShowAdminLegend}
            setShowReportLegendModal={setShowReportLegendModal}
            galleryImages={galleryImages}
            companyEnabled={companyEnabled}
            galleryCalibrableByUrl={galleryCalibrableByUrl}
            galleryCalibratedByUrl={galleryCalibratedByUrl}
            calibratingByUrl={calibratingByUrl}
            failedCalibrationByUrl={failedCalibrationByUrl}
            calibrationData={calibrationData}
            microMaterialHasModelByUrl={microMaterialHasModelByUrl}
            measureEventsById={measureEventsById}
            fixImageUrl={fixImageUrl}
            galleryView={galleryView}
            microSiblingsByUrl={microSiblingsByUrl}
            setLightboxImages={setLightboxImages}
            setLightboxIndex={setLightboxIndex}
            closeMenu={closeMenu}
          />
        </Panel>
      )}
      {showGallery && (showReports || showAssistant) && <ResizeHandle id="handle-gallery" />}
      
      {/* ======== ISLAND 3: INFORMES ======== */}
      {showReports && (
        <Panel 
          /* @ts-ignore - react-resizable-panels Panel accepts order internally for sorting conditional rendering */
          id="panel-reports" order={4} minSize={15} collapsible={false} defaultSize={21}
        >
          <ReportsPanel informesListIsEmpty={informesListIsEmpty} />
        </Panel>
      )}
      {showReports && showAssistant && <ResizeHandle id="handle-reports" />}

      {/* ======== ISLAND 4: ASSISTANT ======== */}
      {showAssistant && (
        <Panel 
          /* @ts-ignore - react-resizable-panels Panel accepts order internally for sorting conditional rendering */
          id="panel-assistant" order={3} minSize={15} collapsible={false} defaultSize={30}
        >
          <section
            className="island"
            style={{
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              minWidth: 0,
              height: "100%",
            }}
          >
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
              <div
                className="px-4 py-2.5 border-b border-[#10243f1a] flex justify-between items-center"
                style={{ flexShrink: 0, position: "relative" }}
              >
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-[#10243f] m-0">Asistente</h3>
                  <div className="w-7 h-7" style={{ visibility: "hidden" }} />
                </div>
              </div>
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <ChatPanel />
              </div>
            </div>
          </section>
        </Panel>
      )}

      {/* Lightbox via Portal */}
      {lightboxIndex !== null &&
        lightboxImages.length > 0 &&
        typeof document !== "undefined" &&
        createPortal(
          <ImageLightboxCarousel
            onCheckMicrographLimit={checkMicrographLimit}
            images={lightboxImages}
            initialIndex={lightboxIndex}
            calibrableByUrl={lightboxCalibrableByUrl}
            calibrationData={calibrationData}
            calibratingByUrl={calibratingByUrl}
            failedCalibrationByUrl={failedCalibrationByUrl}
            microMaterialHasModelByUrl={microMaterialHasModelByUrl}
            maskByImageUrl={maskByImageUrl}
            maskLabelsByImageUrl={maskLabelsByImageUrl}
            maskVisibleByImageUrl={maskVisibleByImageUrl}
            maskLoadingByImageUrl={maskLoadingByImageUrl}
            inclusionsByImageUrl={inclusionsByImageUrl}
            inclusionsVisibleByImageUrl={inclusionsVisibleByImageUrl}
            inclusionsLoadingByImageUrl={inclusionsLoadingByImageUrl}
            onDetectInclusiones={handleDetectInclusiones}
            lastMicrometers={lastMicrometers}
            contextInfo={lightboxContextInfo}
            measurementOverlayById={measurementOverlayById}
            measurementOverlayVisibleByUrl={measurementOverlayVisibleByUrl}
            onToggleMeasurementOverlay={toggleMeasurementOverlay}
            pushToast={pushToast}
            onRetryAutoCalibration={async (url) => {
              try {
                setCalibratingByUrl((prev) => ({ ...prev, [url]: true }));
                setFailedCalibrationByUrl((prev) => ({ ...prev, [url]: false }));
                const response = await fetch(url);
                const blob = await response.blob();
                addMicrografiaToAutoCalibrationQueue(blob, url);
              } catch (e) {
                console.error("Failed to retry auto calibration", e);
                setCalibratingByUrl((prev) => ({ ...prev, [url]: false }));
                setFailedCalibrationByUrl((prev) => ({ ...prev, [url]: true }));
              }
            }}
            onSaveCalibration={async (url, data) => {
              const ratio =
                data.umByPx || data.micrometers / Math.max(data.pixelLength, 1);
              const microInfo = microInfoByUrl[url];

              setCalibratingByUrl((prev) => ({ ...prev, [url]: false }));
              setFailedCalibrationByUrl((prev) => ({ ...prev, [url]: false }));

              if (microInfo?.rawId) {
                try {
                  const fd = new FormData();
                  fd.append("um_by_px", String(ratio));
                  fd.append("is_ai", "false");
                  if (data.pixelLength) fd.append("pixel_length", String(data.pixelLength));
                  if (data.micrometers) fd.append("micrometers", String(data.micrometers));

                  await api.updateMicrografia(microInfo.rawId, fd);
                  setApiMicrografias((prev) =>
                    prev.map((m) =>
                      String(m.id) === microInfo.rawId
                        ? { ...m, um_by_px: ratio, is_ai: false, pixel_length: data.pixelLength, micrometers: data.micrometers }
                        : m,
                    ),
                  );
                } catch (err) {
                  console.error("Error patching um_by_px", err);
                  const apiErr = err as ApiLikeError;
                  const detail =
                    apiErr?.data?.error ||
                    apiErr?.data?.detail ||
                    apiErr?.message ||
                    "No se pudo guardar la calibración.";
                  pushToast(detail, "error", 9200);
                  return;
                }

                markMuestraAsDirtyForPdf(
                  getMuestraIdFromMicroId(microInfo.rawId),
                );
              }

              setCalibrationData((prev) => ({
                ...prev,
                [url]: { ...data, umByPx: ratio },
              }));
              setLastMicrometers(data.micrometers);
            }}
            onGenerateMask={handleGenerateMask}
            onUpdateMaskData={(imageUrl, newDataUrl) => {
              setMaskByImageUrl((prev) => ({
                ...prev,
                [imageUrl]: newDataUrl,
              }));
              const microInfo = microInfoByUrl[imageUrl];
              if (microInfo?.rawId) {
                // Mask edit logic should ideally update the backend here if desired,
                // but for now we only update local state.
              }
            }}
            onClose={() => {
              setLightboxIndex(null);
              setLightboxImages([]);
            }}
          />,
          document.body,
        )}

      <FileManagerModals
        deleteModal={deleteModal}
        setDeleteModal={setDeleteModal}
        handleDelete={handleDelete}
        renameModal={renameModal}
        setRenameModal={setRenameModal}
        handleRename={handleRename}
        renameModalError={renameModalError}
        setRenameModalError={setRenameModalError}
        createModal={createModal}
        setCreateModal={setCreateModal}
        handleCreate={handleCreate}
        showDisabledCompanyModal={showDisabledCompanyModal}
        setShowDisabledCompanyModal={setShowDisabledCompanyModal}
      />
      <ToastOverlay
        toastNotifications={toastNotifications}
        removeToast={removeToast}
      />



      <style
        dangerouslySetInnerHTML={{
          __html: `
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(16,36,63,0.12); border-radius: 3px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(16,36,63,0.22); }
        .island {
          background: white;
          border: 1px solid rgba(16, 36, 63, 0.14);
          border-radius: 16px;
          box-shadow: 0 4px 16px rgba(16, 36, 63, 0.08);
          border-bottom: 5px solid #339eea;
          overflow: hidden;
          transition: box-shadow 0.2s;
        }
        .island:hover {
          box-shadow: 0 12px 32px rgba(16, 36, 63, 0.14);
        }
        .pane {
          display: flex;
          flex-direction: column;
          text-align: center;
          padding: 24px;
          min-height: 0;
          overflow-y: auto;
        }
        .pane-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          width: 100%;
          min-height: 0;
          margin: auto 0;
        }
        .pdf-btn-primary {
          padding: 16px 32px; 
          border-radius: 12px; 
          background: linear-gradient(135deg, #339eea, #0d5a91); 
          border: none; 
          color: white; 
          font-weight: 800; 
          font-size: 1.1rem; 
          cursor: pointer; 
          display: flex; 
          align-items: center; 
          gap: 12px; 
          box-shadow: 0 4px 12px rgba(51, 158, 234, 0.3); 
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .pdf-btn-primary:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(51, 158, 234, 0.4);
        }
        @keyframes toastProgress {
          from { transform: scaleX(1); }
          to { transform: scaleX(0); }
        }
        @keyframes dropdownFadeIn {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `,
        }}
      />

      </Group>
    </div>
  );
}
