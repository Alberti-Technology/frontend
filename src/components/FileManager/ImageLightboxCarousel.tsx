import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import * as api from '../../services/api';
import { CLOUDINARY_BASE_URL } from '../../config/apiConfig';
import { MaskLegend } from '../MaskLegend';
import { useDataStore } from '../../store/useDataStore';
import { useCanvasStore } from '../../store/useCanvasStore';
import { useMeasurementStore } from '../../store/useMeasurementStore';
import { readDrawCacheStore, writeDrawCacheStore, writeMeasurementsCacheStore } from '../../utils/cache';
import { getColorNameFromRgb } from '../../utils/helpers';
import { ENABLE_AUTOCALIBRATION } from '../../utils/calibration';
import { StoredMeasurement, Micrografia } from '../../types';
import { CalibrationInfo } from './SubComponents';
import { ZoomControls } from './ZoomControls';
import { NavControls } from './NavControls';
import { EditorHeader } from './EditorHeader';
import { SidebarToolDetails } from './SidebarToolDetails';
import { LightboxModals } from './LightboxModals';
import { CaliperIcon, RefreshIcon, RulerIcon, MaskIcon, InclusionsIcon, ChartIcon, PencilIcon, EraserIcon, TrashIcon } from './Icons';

export function ImageLightboxCarousel({
  images,
  initialIndex,
  calibrableByUrl,
  calibrationData,
  maskByImageUrl = {},
  maskLabelsByImageUrl,
  maskVisibleByImageUrl,
  maskLoadingByImageUrl,
  lastMicrometers,
  onSaveCalibration,
  onGenerateMask,
  onUpdateMaskData,
  onClose,
  contextInfo,
  calibratingByUrl,
  failedCalibrationByUrl,
  microMaterialHasModelByUrl = {},
  measurementOverlayById,
  measurementOverlayVisibleByUrl,
  onToggleMeasurementOverlay,
  onRetryAutoCalibration,
  onCheckMicrographLimit = (action) => action(),
  pushToast,
  inclusionsByImageUrl = {},
  inclusionsVisibleByImageUrl = {},
  inclusionsLoadingByImageUrl = {},
  onDetectInclusiones,
}: {
  images: { name: string; url: string; id?: string }[];
  initialIndex: number;
  calibrableByUrl: Record<string, boolean>;
  calibrationData: Record<string, CalibrationInfo>;
  maskByImageUrl: Record<string, string>;
  maskLabelsByImageUrl: Record<string, api.HfMaskLabels>;
  maskVisibleByImageUrl: Record<string, boolean>;
  maskLoadingByImageUrl: Record<string, boolean>;
  lastMicrometers: number;
  contextInfo: {
    materialName?: string;
    muestraName?: string;
    regionName?: string;
  };
  onSaveCalibration: (imageUrl: string, data: CalibrationInfo) => void;
  onGenerateMask: (imageUrl: string) => Promise<void>;
  onUpdateMaskData: (imageUrl: string, newDataUrl: string) => void;
  onClose: () => void;
  onRetryAutoCalibration?: (imageUrl: string) => void;
  calibratingByUrl?: Record<string, boolean>;
  failedCalibrationByUrl?: Record<string, boolean>;
  microMaterialHasModelByUrl?: Record<string, boolean>;
  onCheckMicrographLimit?: (action: () => void) => void;
  measurementOverlayById?: Record<string, string>;
  measurementOverlayVisibleByUrl?: Record<string, boolean>;
  onToggleMeasurementOverlay?: (imageUrl: string) => void;
  pushToast: (message: string, type?: "success" | "error" | "info" | "warning", duration?: number) => void;
  inclusionsByImageUrl?: Record<string, api.InclusionPolygon[]>;
  inclusionsVisibleByImageUrl?: Record<string, boolean>;
  inclusionsLoadingByImageUrl?: Record<string, boolean>;
  onDetectInclusiones?: (imageUrl: string) => Promise<void>;
}) {
  const [showReportLegendModal, setShowReportLegendModal] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [inclusionsThreshold, setInclusionsThreshold] = useState<number>(0.1);
  const [calibrationMode, setCalibrationMode] = useState(false);
  const [lineStart, setLineStart] = useState<{ x: number; y: number } | null>(
    null,
  );
  const [lineEnd, setLineEnd] = useState<{ x: number; y: number } | null>(null);
  const {
    measurementStart, setMeasurementStart,
    measurementEnd, setMeasurementEnd,
    measurementPx, setMeasurementPx,
    measurementLabelPos, setMeasurementLabelPos,
    isMeasuring, setIsMeasuring,
    measurementsByImageUrl, setMeasurementsByImageUrl,
    selectedMeasurementId, setSelectedMeasurementId,
    hoveredMeasurementId, setHoveredMeasurementId
  } = useMeasurementStore();
  const [lineFinished, setLineFinished] = useState(false);
  const [canvasLayoutCounter, setCanvasLayoutCounter] = useState(0);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showInputModal, setShowInputModal] = useState(false);
  const [showAutoDetectModal, setShowAutoDetectModal] = useState(false);
  const [micrometersInput, setMicrometersInput] = useState(
    String(lastMicrometers || ""),
  );
  const [activeSidebarTool, setActiveSidebarTool] = useState<
    "overview" | "calibration" | "measurement" | "mask"
  >("overview");
  const [pixelLength, setPixelLength] = useState(0);
  const [detectedPixelLength, setDetectedPixelLength] = useState(0);
  const [hoveredInclusion, setHoveredInclusion] = useState<{
    poly: api.InclusionPolygon;
    x: number;
    y: number;
  } | null>(null);
  const [editorLayout, setEditorLayout] = useState({
    imageWidth: 640,
    imageHeight: 360,
    imageLeft: 0,
    imageRight: 1280,
    viewportWidth: 1280,
    viewportHeight: 720,
  });

  const { pencilColor, setPencilColor, zoomScale, setZoomScale, panOffset, setPanOffset, isPanning, setIsPanning, maskEditTool, setMaskEditTool, isMaskDrawing, setIsMaskDrawing } = useCanvasStore();
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [isPencilMenuOpen, setIsPencilMenuOpen] = useState(false);
  const [showInclusionsSlider, setShowInclusionsSlider] = useState(false);
  const lastPanPos = useRef({ x: 0, y: 0 });

  const isMeasuringRef = useRef(isMeasuring);
  const measurementStartRef = useRef(measurementStart);
  const measurementTooltipRef = useRef<HTMLDivElement>(null);
  const isMaskDrawingRef = useRef(isMaskDrawing);
  const isPanningRef = useRef(isPanning);
  const lineStartRef = useRef<{ x: number; y: number } | null>(null);
  
  // Sync state to refs (in case state changes from outside)
  useEffect(() => { isMeasuringRef.current = isMeasuring; }, [isMeasuring]);
  useEffect(() => { measurementStartRef.current = measurementStart; }, [measurementStart]);
  useEffect(() => { isMaskDrawingRef.current = isMaskDrawing; }, [isMaskDrawing]);
  useEffect(() => { isPanningRef.current = isPanning; }, [isPanning]);


  const zoomIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const startContinuousZoom = useCallback((direction: "in" | "out") => {
    setZoomScale(prev => direction === "in" ? Math.min(prev + 0.2, 10) : Math.max(prev - 0.2, 1));
    if (zoomIntervalRef.current) clearInterval(zoomIntervalRef.current);
    zoomIntervalRef.current = setInterval(() => {
      setZoomScale(prev => direction === "in" ? Math.min(prev + 0.2, 10) : Math.max(prev - 0.2, 1));
    }, 150);
  }, []);

  const stopContinuousZoom = useCallback(() => {
    if (zoomIntervalRef.current) {
      clearInterval(zoomIntervalRef.current);
      zoomIntervalRef.current = null;
    }
  }, []);

  const resetZoom = useCallback(() => {
    setZoomScale(1);
    setPanOffset({ x: 0, y: 0 });
  }, []);

  // Persistent measurements
  const MEASUREMENT_COLORS = ["#ff3333", "#33cc33", "#3399ff", "#ff9900", "#cc33ff", "#00cccc", "#ff6699", "#99cc00"];
  
  // measurementsByImageUrl, selectedMeasurementId, hoveredMeasurementId managed by useMeasurementStore
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const inclusionsCanvasRef = useRef<HTMLCanvasElement>(null);
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  const currentImage = images[currentIndex];
  const measurements = measurementsByImageUrl[currentImage?.url] || [];
  
  const setMeasurements = useCallback((updater: React.SetStateAction<StoredMeasurement[]>) => {
    setMeasurementsByImageUrl(prev => {
      const url = currentImage?.url;
      if (!url) return prev;
      const currentList = prev[url] || [];
      const newList = typeof updater === "function" ? updater(currentList) : updater;
      const newMap = { ...prev, [url]: newList };
      writeMeasurementsCacheStore(newMap);
      return newMap;
    });
  }, [currentImage?.url]);

  useEffect(() => {
    const canvas = inclusionsCanvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return;
    
    // Sync size
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    canvas.style.width = img.clientWidth + "px";
    canvas.style.height = img.clientHeight + "px";

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const isVisible = inclusionsVisibleByImageUrl?.[currentImage?.url];
    const polygons = inclusionsByImageUrl?.[currentImage?.url];
    
    if (isVisible && polygons) {
      ctx.strokeStyle = "#ff00ff";
      ctx.fillStyle = "rgba(255, 0, 255, 0.2)";
      ctx.lineWidth = Math.max(1, Math.round(canvas.width / 500));
      for (const poly of polygons) {
        if (poly.confidence >= inclusionsThreshold && poly.points && poly.points.length > 0) {
          ctx.beginPath();
          ctx.moveTo(poly.points[0].x, poly.points[0].y);
          for (let i = 1; i < poly.points.length; i++) {
            ctx.lineTo(poly.points[i].x, poly.points[i].y);
          }
          ctx.closePath();
          ctx.stroke();
          ctx.fill();
        }
      }
    }
  }, [
    currentImage?.url, 
    inclusionsByImageUrl, 
    inclusionsVisibleByImageUrl, 
    inclusionsThreshold, 
    currentIndex
  ]);


  // ---- Mask editing state ----
  // maskEditTool and isMaskDrawing handled by useCanvasStore
  const [isAstmMenuOpen, setIsAstmMenuOpen] = useState(false);
  const [isZoomMenuOpen, setIsZoomMenuOpen] = useState(false);
  const [isNavMenuOpen, setIsNavMenuOpen] = useState(false);
  const [showMeasurements, setShowMeasurements] = useState(false);
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);
  const maskCanvasRef = useRef<HTMLCanvasElement>(null);
  const lastMaskPosRef = useRef<{ x: number; y: number } | null>(null);
  const [drawByImageUrl, setDrawByImageUrl] = useState<Record<string, string>>(
    {},
  );

  useEffect(() => {
    setDrawByImageUrl(readDrawCacheStore());
  }, []);

  const hasSiblingImages = images.length > 1;
  const currentImageIsCalibrable = !!calibrableByUrl[currentImage.url];
  const hasCalibration = !!calibrationData[currentImage.url];
  const currentCalibration = calibrationData[currentImage.url];
  const currentMaskUrl = maskByImageUrl[currentImage.url] || "";
  const currentDrawUrl = drawByImageUrl[currentImage.url] || "";
  const currentMaskLabels = maskLabelsByImageUrl[currentImage.url];
  const currentMeasurementOverlayUrl =
    (currentImage.id && measurementOverlayById?.[currentImage.id]) || "";
  const isMeasurementOverlayVisible =
    !!measurementOverlayVisibleByUrl?.[currentImage.url];
  const displayedImageUrl = currentImage.url;
  const isMaskVisible =
    !!currentMaskUrl && maskVisibleByImageUrl[currentImage.url] !== false;
  const isMaskLoading = !!maskLoadingByImageUrl[currentImage.url];
  const isDrawingToolActive = !!maskEditTool;
  const drawingToolLabel =
    maskEditTool === "pencil"
      ? "Lápiz"
      : maskEditTool === "eraser"
        ? "Goma"
        : "";
  const maskLegendEntries = useMemo(() => {
    if (!currentMaskLabels) return [];
    return Object.entries(currentMaskLabels)
      .sort(([a], [b]) => Number(a) - Number(b))
      .map(([id, info]) => ({
        id,
        name: info.name,
        color: info.color,
        colorLabel: getColorNameFromRgb(info.color),
      }));
  }, [currentMaskLabels]);
  const calibrationRatio =
    hasCalibration && currentCalibration
      ? currentCalibration.umByPx ||
        currentCalibration.micrometers /
          Math.max(currentCalibration.pixelLength, 1)
      : null;
  const measurementEnabled = !!calibrationRatio;
  const measurementMode =
    activeSidebarTool === "measurement" && measurementEnabled;
  const measurementDistanceUm =
    measurementPx > 0 && calibrationRatio
      ? measurementPx * calibrationRatio
      : null;
  // Derive AI UI state early so we can account for border padding in layout
  const isExternallyCalibrating = calibratingByUrl?.[currentImage.url];
  const currentMaterialHasModel = microMaterialHasModelByUrl[currentImage.url] ?? true;
  const isExternallyFailed = failedCalibrationByUrl?.[currentImage.url];
  const aiSuccess = hasCalibration && calibrationData[currentImage.url]?.isAi === true && currentMaterialHasModel;
  const aiError = isExternallyFailed && currentMaterialHasModel;
  const aiProcessing = isExternallyCalibrating && currentMaterialHasModel;
  const showAiFx = (aiSuccess || aiError || aiProcessing) && !calibrationMode && !measurementMode && !isDrawingToolActive;
  let aiFxColor = "#4ade80"; // green
  if (aiError) aiFxColor = "#f87171"; // red
  else if (aiProcessing) aiFxColor = "#e8a317"; // yellow

  const LIGHTBOX_SIDE_MIN = 40;
  const MIN_CONTEXT_WIDTH = 480;
  const borderPad = showAiFx ? 8 : 0; // reserve space for the animated border
  const imageMaxWidth = Math.max(
    260,
    editorLayout.viewportWidth - LIGHTBOX_SIDE_MIN - MIN_CONTEXT_WIDTH - borderPad,
  );
  const imageMaxHeight = Math.max(220, editorLayout.viewportHeight - 100 - borderPad);
  // Sidebar positions: center each panel in the gap between viewport edge and image edge
  // Clamp sidebar so the 62px pill doesn't clip off-screen (center >= 38px)
  const sidebarCenterX = Math.max(38, editorLayout.imageLeft / 2);
  const contextCenterX =
    (editorLayout.imageRight + editorLayout.viewportWidth) / 2;
  const contextGapWidth = Math.max(
    0,
    editorLayout.viewportWidth - editorLayout.imageRight,
  );
  const toolTitle = isDrawingToolActive
    ? "Dibujo"
    : activeSidebarTool === "calibration"
      ? "Calibración"
      : activeSidebarTool === "measurement"
        ? "Medición"
        : activeSidebarTool === "mask"
          ? "Máscaras IA"
          : "Información";
  const toolDescription = isDrawingToolActive
    ? "Dibujá sobre la micrografia con lapiz o goma. Los trazos se guardan localmente en este navegador."
    : activeSidebarTool === "calibration"
      ? "Traza una linea sobre la escala visible y guarda la medida en micrometros para obtener um/px con precision."
      : activeSidebarTool === "measurement"
        ? "Arrastra una linea sobre la micrografia para medir distancias en micrometros. La medida es temporal y no se guarda."
        : activeSidebarTool === "mask"
          ? "Genera y superpone la mascara de segmentacion. La opacidad es fija al 65% para mantener consistencia visual."
          : "Usa las herramientas del lateral izquierdo para calibrar o segmentar la micrografia actual.";
  const calibrationStateLabel = calibrationMode
    ? lineStart
      ? "trazando escala"
      : "lista para trazar"
    : hasCalibration
      ? "calibrada"
      : "sin calibrar";

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (showConfirmModal || showInputModal || showAutoDetectModal) return;
      if (e.key === "Escape") onClose();
      if (images.length > 1) {
        if (e.key === "ArrowLeft")
          setCurrentIndex((p) => (p > 0 ? p - 1 : images.length - 1));
        if (e.key === "ArrowRight")
          setCurrentIndex((p) => (p < images.length - 1 ? p + 1 : 0));
      }
    };
    window.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
    };
  }, [
    onClose,
    currentIndex,
    images.length,
    showConfirmModal,
    showInputModal,
    showAutoDetectModal,
  ]);

  // When navigating images, reset calibration/measurement mode but
  // preserve drawing tool and mask sidebar so the user can keep
  // working across images without losing context.
  useEffect(() => {
    // Save current drawing tool and sidebar before resetting
    const wasDrawing = maskEditTool;
    const wasMaskSidebar = activeSidebarTool === "mask";

    // Reset calibration/measurement state (image-specific)
    setCalibrationMode(false);
    setLineStart(null);
    setLineEnd(null);
    setLineFinished(false);
    setMeasurementStart(null);
    setMeasurementEnd(null);
    setMeasurementPx(0);
    setMeasurementLabelPos(null);
    setIsMeasuring(false);
    isMeasuringRef.current = false;
    setShowConfirmModal(false);
    setShowInputModal(false);
    setShowAutoDetectModal(false);
    
    isMaskDrawingRef.current = false;
    setShowAutoDetectModal(false);
    
    isMaskDrawingRef.current = false;
    clearCanvas();

    // If the user was using a drawing tool or viewing the mask panel,
    // keep those active; otherwise fall back to overview.
    if (wasDrawing) {
      // maskEditTool stays as-is; sidebar stays on "mask"
      setActiveSidebarTool("mask");
    } else if (wasMaskSidebar) {
      setActiveSidebarTool("mask");
    } else {
      setActiveSidebarTool("overview");
    }
    resetZoom();
  }, [currentIndex, resetZoom]);

  useEffect(() => {
    if (!currentImageIsCalibrable && activeSidebarTool !== "overview") {
      setActiveSidebarTool("overview");
    }
  }, [activeSidebarTool, currentImageIsCalibrable]);

  const onSaveCalibrationRef = useRef(onSaveCalibration);
  useEffect(() => {
    onSaveCalibrationRef.current = onSaveCalibration;
  }, [onSaveCalibration]);

  // AI state variables are now derived earlier (before imageMaxWidth/imageMaxHeight)

  const resetCalibrationState = (goToOverview = false) => {
    setCalibrationMode(false);
    setLineStart(null);
    setLineEnd(null);
    setLineFinished(false);
    setMeasurementStart(null);
    setMeasurementEnd(null);
    setMeasurementPx(0);
    setMeasurementLabelPos(null);
    setIsMeasuring(false);
    isMeasuringRef.current = false;
    setShowConfirmModal(false);
    setShowInputModal(false);
    setShowAutoDetectModal(false);
    if (goToOverview) {
      setActiveSidebarTool("overview");
    }
    clearCanvas();
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const resetMeasurementState = () => {
    setMeasurementStart(null);
    setMeasurementEnd(null);
    setMeasurementPx(0);
    setMeasurementLabelPos(null);
    setIsMeasuring(false);
    isMeasuringRef.current = false;
    clearCanvas();
  };

  const syncEditorLayout = useCallback(() => {
    if (typeof window === "undefined") return;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const imgRect = imgRef.current?.getBoundingClientRect();
    const fallbackRect = imageContainerRef.current?.getBoundingClientRect();
    const rect =
      imgRect && imgRect.width > 0 && imgRect.height > 0
        ? imgRect
        : fallbackRect;

    setEditorLayout({
      imageWidth: rect?.width || 640,
      imageHeight: rect?.height || 360,
      imageLeft: rect?.left || 0,
      imageRight: rect?.right || viewportWidth,
      viewportWidth,
      viewportHeight,
    });
  }, []);

  // Sync canvas size with image container
  const syncCanvasSize = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return;
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    canvas.style.width = img.clientWidth + "px";
    canvas.style.height = img.clientHeight + "px";
    syncEditorLayout();
    setCanvasLayoutCounter(c => c + 1);
  }, [syncEditorLayout]);

  useEffect(() => {
    syncEditorLayout();

    const onResize = () => syncEditorLayout();
    window.addEventListener("resize", onResize);

    let observer: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined") {
      observer = new ResizeObserver(() => syncEditorLayout());
      if (imageContainerRef.current)
        observer.observe(imageContainerRef.current);
      if (imgRef.current) observer.observe(imgRef.current);
    }

    return () => {
      window.removeEventListener("resize", onResize);
      if (observer) observer.disconnect();
    };
  }, [currentIndex, syncEditorLayout]);

  // Draw measurements and active line on canvas
  const drawMeasurementsAndLine = useCallback(
    (start?: { x: number; y: number } | null, end?: { x: number; y: number } | null, activeColor?: string) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const rect = canvas.getBoundingClientRect();
      const scaleX = rect.width > 0 ? canvas.width / rect.width : 1;
      const scaleY = rect.height > 0 ? canvas.height / rect.height : 1;
      const scale = (scaleX + scaleY) / 2;
      const displayLineWidthPx = 4;
      const displayPointRadiusPx = 6;

      if (!showMeasurements && activeSidebarTool !== "measurement" && !calibrationMode) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        return;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw stored measurements first
      measurements.forEach((m, i) => {
        const isActive = m.id === selectedMeasurementId || m.id === hoveredMeasurementId;
        ctx.beginPath();
        ctx.moveTo(m.start.x, m.start.y);
        ctx.lineTo(m.end.x, m.end.y);
        ctx.strokeStyle = m.color;
        ctx.lineWidth = (isActive ? 4 : 3) * scale;
        ctx.lineCap = "round";
        ctx.globalAlpha = isActive ? 1 : 0.7;
        ctx.stroke();
        ctx.globalAlpha = 1;
        // Endpoints
        for (const pt of [m.start, m.end]) {
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, displayPointRadiusPx * scale, 0, Math.PI * 2);
          ctx.fillStyle = m.color;
          ctx.fill();
        }
        
        // Hover label
        if (m.id === hoveredMeasurementId) {
          const mx = (m.start.x + m.end.x) / 2;
          const my = (m.start.y + m.end.y) / 2;
          const label = `#${i + 1}`;
          
          ctx.font = `bold ${14 * scale}px Inter, sans-serif`;
          const textMetrics = ctx.measureText(label);
          const bgWidth = textMetrics.width + 12 * scale;
          const bgHeight = 22 * scale;
          
          ctx.fillStyle = "rgba(0, 0, 0, 0.75)";
          ctx.beginPath();
          ctx.roundRect(mx - bgWidth / 2, my - bgHeight / 2 - 15 * scale, bgWidth, bgHeight, 6 * scale);
          ctx.fill();
          
          ctx.fillStyle = "white";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(label, mx, my - 15 * scale);
        }
      });

      // Draw the active line
      const s = start || lineStart;
      const e = end || lineEnd;
      if (s && e) {
        ctx.beginPath();
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(e.x, e.y);
        ctx.strokeStyle = activeColor || "#ff3333";
        ctx.lineWidth = displayLineWidthPx * scale;
        ctx.lineCap = "round";
        ctx.stroke();
      }
    },
    [measurements, selectedMeasurementId, hoveredMeasurementId, showMeasurements, activeSidebarTool, calibrationMode, lineStart, lineEnd],
  );

  // Draw AI calibration box — scale vertices from source image space to canvas space
  const drawVertices = useCallback((vertices: number[][], sourceWidth?: number, sourceHeight?: number) => {
    const canvas = canvasRef.current;
    if (!canvas || canvas.width === 0 || canvas.height === 0) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = rect.width > 0 ? canvas.width / rect.width : 1;
    const scaleY = rect.height > 0 ? canvas.height / rect.height : 1;
    const scale = (scaleX + scaleY) / 2;
    const displayLineWidthPx = 3;

    // Scale factor from source (original file sent to API) to canvas (naturalWidth of displayed image)
    const sX = (sourceWidth && sourceWidth > 0) ? canvas.width / sourceWidth : 1;
    const sY = (sourceHeight && sourceHeight > 0) ? canvas.height / sourceHeight : 1;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.beginPath();
    vertices.forEach((v, i) => {
      const x = v[0] * sX;
      const y = v[1] * sY;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.closePath();
    ctx.strokeStyle = "#339eea";
    ctx.lineWidth = displayLineWidthPx * scale;
    ctx.stroke();
  }, []);

  useEffect(() => {
    const currentImage = images[currentIndex];
    if (!currentImage) return;
    const data = calibrationData[currentImage.url];
    // Only draw it if we're not currently doing manual calibration/measure and if it's AI
    if ((showMeasurements || activeSidebarTool === "measurement" || calibrationMode) && !isMeasuring) {
      drawMeasurementsAndLine();
    } else if (data?.vertices && data.isAi && showAiFx) {
      drawVertices(data.vertices, data.sourceWidth, data.sourceHeight);
    } else {
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext("2d");
        if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
  }, [currentIndex, calibrationData, drawVertices, images, showAiFx, canvasLayoutCounter, activeSidebarTool, showMeasurements, measurements, hoveredMeasurementId, selectedMeasurementId, drawMeasurementsAndLine, isMeasuring]);

  // Get position relative to the canvas (which matches natural image coords)
  const getCanvasPos = (
    e: React.MouseEvent,
  ): { x: number; y: number } | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    // Scale from displayed size to canvas (natural) size
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (!calibrationMode || lineFinished) return;
    const pos = getCanvasPos(e);
    if (!pos) return;
    setLineStart(pos);
    lineStartRef.current = pos;
    setIsMeasuring(true);
    isMeasuringRef.current = true;
    // Don't call setLineEnd to prevent React lag
  };

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    if (!calibrationMode || !lineStartRef.current || lineFinished) return;
    const pos = getCanvasPos(e);
    if (!pos) return;
    drawMeasurementsAndLine(lineStartRef.current, pos);
  };

  const handleCanvasMouseUp = (e: React.MouseEvent) => {
    if (!calibrationMode || !lineStartRef.current || lineFinished) return;
    const pos = getCanvasPos(e);
    if (!pos) return;
    setLineEnd(pos);
    const dx = pos.x - lineStartRef.current.x;
    const dy = pos.y - lineStartRef.current.y;
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len < 3) {
      // Too short, ignore
      clearCanvas();
      setLineStart(null);
      setLineEnd(null);
      setIsMeasuring(false);
      isMeasuringRef.current = false;
      return;
    }
    setPixelLength(Math.round(len));
    setLineFinished(true);
    setIsMeasuring(false);
    isMeasuringRef.current = false;
    setShowConfirmModal(true);
    // Update micrometersInput with lastMicrometers preset
    setMicrometersInput(String(lastMicrometers || ""));
  };

  const handleMeasurementMouseDown = (e: React.MouseEvent) => {
    if (!measurementMode) return;
    const pos = getCanvasPos(e);
    if (!pos) return;
    setIsMeasuring(true);
    isMeasuringRef.current = true;
    setMeasurementStart(pos);
    measurementStartRef.current = pos;
    setMeasurementEnd(pos);
    setMeasurementPx(0);
    setMeasurementLabelPos({ x: e.clientX, y: e.clientY });
  };

  const handleMeasurementMouseMove = (e: React.MouseEvent) => {
    if (!measurementMode) return;
    const pos = getCanvasPos(e);
    if (!pos) return;
    
    if (isMeasuringRef.current && measurementStartRef.current) {
      const mStart = measurementStartRef.current;
      const dx = pos.x - mStart.x;
      const dy = pos.y - mStart.y;
      const len = Math.sqrt(dx * dx + dy * dy);
      drawMeasurementsAndLine(mStart, pos);
      if (measurementTooltipRef.current && currentCalibration) {
        measurementTooltipRef.current.style.display = 'flex';
        measurementTooltipRef.current.style.left = `${e.clientX + 12}px`;
        measurementTooltipRef.current.style.top = `${e.clientY - 28}px`;
        const um = (len * currentCalibration.micrometers) / currentCalibration.pixelLength;
        
        // Update the inner text of the span inside the tooltip
        const span = measurementTooltipRef.current.querySelector('span');
        if (span) span.innerText = `${um.toFixed(2)} µm`;
      }
    } else {
      let foundHover: string | null = null;
      for (const m of measurements) {
        const l2 = (m.end.x - m.start.x) ** 2 + (m.end.y - m.start.y) ** 2;
        if (l2 === 0) continue;
        const t = Math.max(0, Math.min(1, ((pos.x - m.start.x) * (m.end.x - m.start.x) + (pos.y - m.start.y) * (m.end.y - m.start.y)) / l2));
        const proj = { x: m.start.x + t * (m.end.x - m.start.x), y: m.start.y + t * (m.end.y - m.start.y) };
        const dist = Math.sqrt((pos.x - proj.x) ** 2 + (pos.y - proj.y) ** 2);
        
        const rect = canvasRef.current?.getBoundingClientRect();
        const scaleX = rect && rect.width > 0 ? canvasRef.current!.width / rect.width : 1;
        
        if (dist < 8 * scaleX) {
          foundHover = m.id;
          break;
        }
      }
      if (foundHover !== hoveredMeasurementId) {
        setHoveredMeasurementId(foundHover);
      }
    }
  };

  const handleMeasurementMouseUp = (e: React.MouseEvent) => {
    if (!measurementMode || !isMeasuringRef.current) return;
    setIsMeasuring(false);
    isMeasuringRef.current = false;
    setMeasurementLabelPos(null);
    if (measurementTooltipRef.current) measurementTooltipRef.current.style.display = 'none';

    const pos = getCanvasPos(e as any);
    const mStart = measurementStartRef.current;

    if (!mStart || !pos) {
      clearCanvas();
      setMeasurementStart(null);
      setMeasurementEnd(null);
      setMeasurementPx(0);
      return;
    }

    const dx = pos.x - mStart.x;
    const dy = pos.y - mStart.y;
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len < 3) {
      clearCanvas();
      setMeasurementStart(null);
      setMeasurementEnd(null);
      setMeasurementPx(0);
      return;
    }

    setMeasurementPx(len);

    // Store the measurement persistently
    const distUm = calibrationRatio ? len * calibrationRatio : null;
    const color = MEASUREMENT_COLORS[measurements.length % MEASUREMENT_COLORS.length];
    const newMeasurement: StoredMeasurement = {
      id: `m-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      start: { ...mStart },
      end: { ...pos },
      distancePx: len,
      distanceUm: distUm,
      color,
    };
    setMeasurements(prev => [...prev, newMeasurement]);
    setSelectedMeasurementId(newMeasurement.id);
  };

  const handleMeasurementMouseLeave = () => {
    if (!isMeasuring) return;
    setIsMeasuring(false);
    isMeasuringRef.current = false;
    setMeasurementLabelPos(null);
  };

  const handleActivateCalibration = () => {
    if (!currentImageIsCalibrable) return;
    if (activeSidebarTool === "calibration") {
      setActiveSidebarTool("overview");
      resetCalibrationState(false);
      return;
    }
    resetCalibrationState(false);
    setActiveSidebarTool("calibration");

    // 1. Check if another image has same dimensions and has calibration
    const img = imgRef.current;
    if (img && Object.keys(calibrationData).length > 0) {
      const currentW = img.naturalWidth;
      const currentH = img.naturalHeight;

      // Find a previously calibrated image with the exact same dimensions
      let matchedCal: CalibrationInfo | null = null;
      for (const url of Object.keys(calibrationData)) {
        const cal = calibrationData[url];
        if (
          cal.width === currentW &&
          cal.height === currentH &&
          cal.pixelLength > 0
        ) {
          matchedCal = cal;
          break;
        }
      }

      if (matchedCal) {
        setDetectedPixelLength(matchedCal.pixelLength);
        setMicrometersInput(String(lastMicrometers || ""));
        setShowAutoDetectModal(true);
        return;
      }
    }

    // No auto-detect
    setCalibrationMode(true);
    setLineStart(null);
    setLineEnd(null);
    setLineFinished(false);
    clearCanvas();
    setTimeout(syncCanvasSize, 50);
  };

  const handleActivateMeasurement = () => {
    if (!currentImageIsCalibrable || !measurementEnabled) return;
    if (showMeasurements) {
      setShowMeasurements(false);
      if (activeSidebarTool === "measurement") {
        resetMeasurementState();
        setActiveSidebarTool("overview");
      }
    } else {
      resetCalibrationState(false);
      setShowMeasurements(true);
      setActiveSidebarTool("measurement");
      setTimeout(syncCanvasSize, 50);
    }
  };

  const handleAutoDetectCancel = () => {
    setShowAutoDetectModal(false);
    // User wants to do it manual
    setCalibrationMode(true);
    setLineStart(null);
    setLineEnd(null);
    setLineFinished(false);
    clearCanvas();
    setTimeout(syncCanvasSize, 50);
  };

  const handleAutoDetectSave = () => {
    const um = parseFloat(micrometersInput);
    if (isNaN(um) || um <= 0) return;
    const img = imgRef.current;
    onSaveCalibration(currentImage.url, {
      pixelLength: detectedPixelLength,
      micrometers: um,
      width: img?.naturalWidth,
      height: img?.naturalHeight,
      umByPx: um / detectedPixelLength,
    });
    setShowAutoDetectModal(false);
    resetCalibrationState(true);
  };

  // Modal actions
  const handleConfirmCancel = () => {
    setShowConfirmModal(false);
    resetCalibrationState(true);
  };

  const handleConfirmRedo = () => {
    setShowConfirmModal(false);
    setLineStart(null);
    setLineEnd(null);
    setLineFinished(false);
    clearCanvas();
  };

  const handleConfirmOk = () => {
    setShowConfirmModal(false);
    setShowInputModal(true);
  };

  const handleInputCancel = () => {
    setShowInputModal(false);
    setShowConfirmModal(true);
  };

  const handleInputSave = () => {
    const um = parseFloat(micrometersInput);
    if (isNaN(um) || um <= 0) return;
    const img = imgRef.current;
    onSaveCalibration(currentImage.url, {
      pixelLength,
      micrometers: um,
      width: img?.naturalWidth,
      height: img?.naturalHeight,
      umByPx: um / pixelLength,
    });
    setShowInputModal(false);
    resetCalibrationState(true);
  };

  // ---- Mask drawing helpers ----
  const DRAW_PENCIL_RADIUS_PX = 3;
  const DRAW_ERASER_RADIUS_PX = 4.5;

  const initMaskCanvas = useCallback(() => {
    const maskCanvas = maskCanvasRef.current;
    const img = imgRef.current;
    if (!maskCanvas || !img) return;

    const naturalWidth = img.naturalWidth || img.width;
    const naturalHeight = img.naturalHeight || img.height;
    if (!naturalWidth || !naturalHeight) return;

    maskCanvas.width = naturalWidth;
    maskCanvas.height = naturalHeight;
    maskCanvas.style.width = img.clientWidth + "px";
    maskCanvas.style.height = img.clientHeight + "px";

    const ctx = maskCanvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, maskCanvas.width, maskCanvas.height);

    if (!currentDrawUrl) return;

    const tempImg = new Image();
    tempImg.crossOrigin = "anonymous";
    tempImg.onload = () => {
      ctx.clearRect(0, 0, maskCanvas.width, maskCanvas.height);
      ctx.drawImage(tempImg, 0, 0);
    };
    tempImg.src = currentDrawUrl;
  }, [currentDrawUrl]);

  // Initialize mask canvas when a mask edit tool is selected, when
  // the stored drawing changes, or when navigating to a new image.
  useEffect(() => {
    if (maskEditTool) {
      // Small delay to ensure the canvas element and new image are in the DOM
      const t = setTimeout(() => initMaskCanvas(), 60);
      return () => clearTimeout(t);
    }
  }, [maskEditTool, initMaskCanvas, currentDrawUrl, currentIndex]);

  // Re-sync mask canvas display size when image resizes
  useEffect(() => {
    if (!maskEditTool) return;
    const maskCanvas = maskCanvasRef.current;
    const img = imgRef.current;
    if (maskCanvas && img) {
      maskCanvas.style.width = img.clientWidth + "px";
      maskCanvas.style.height = img.clientHeight + "px";
    }
  }, [editorLayout, maskEditTool]);

  const getMaskCanvasPos = (
    e: React.MouseEvent,
  ): { x: number; y: number } | null => {
    const canvas = maskCanvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const paintOnMaskCanvas = (pos: { x: number; y: number }) => {
    const canvas = maskCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = rect.width > 0 ? canvas.width / rect.width : 1;
    const scaleY = rect.height > 0 ? canvas.height / rect.height : 1;
    const scale = (scaleX + scaleY) / 2;
    const baseRadius =
      maskEditTool === "eraser" ? DRAW_ERASER_RADIUS_PX : DRAW_PENCIL_RADIUS_PX;
    const brushRadius = baseRadius * scale;

    const lastPos = lastMaskPosRef.current;

    if (maskEditTool === "pencil") {
      ctx.globalCompositeOperation = "source-over";
      ctx.strokeStyle = pencilColor;
      ctx.fillStyle = pencilColor;
      ctx.lineWidth = brushRadius * 2;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      if (lastPos) {
        ctx.beginPath();
        ctx.moveTo(lastPos.x, lastPos.y);
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, brushRadius, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (maskEditTool === "eraser") {
      ctx.globalCompositeOperation = "destination-out";
      ctx.strokeStyle = "rgba(0,0,0,1)";
      ctx.fillStyle = "rgba(0,0,0,1)";
      ctx.lineWidth = brushRadius * 2;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      if (lastPos) {
        ctx.beginPath();
        ctx.moveTo(lastPos.x, lastPos.y);
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, brushRadius, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalCompositeOperation = "source-over";
    }

    lastMaskPosRef.current = pos;
  };

  const persistMaskEdit = useCallback(() => {
    const canvas = maskCanvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL("image/png");
    setDrawByImageUrl((prev) => {
      const next = { ...prev, [currentImage.url]: dataUrl };
      writeDrawCacheStore(next);
      return next;
    });
  }, [currentImage.url]);

  const clearCurrentDrawing = useCallback(() => {
    const canvas = maskCanvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    setDrawByImageUrl((prev) => {
      const next = { ...prev };
      delete next[currentImage.url];
      writeDrawCacheStore(next);
      return next;
    });
  }, [currentImage.url]);

  const handleMaskCanvasMouseDown = (e: React.MouseEvent) => {
    if (!maskEditTool) return;
    
    isMaskDrawingRef.current = true;
    lastMaskPosRef.current = null;
    const pos = getMaskCanvasPos(e);
    if (pos) paintOnMaskCanvas(pos);
  };

  const handleMaskCanvasMouseMove = (e: React.MouseEvent) => {
    if (!maskEditTool || !isMaskDrawingRef.current) return;
    const pos = getMaskCanvasPos(e);
    if (pos) paintOnMaskCanvas(pos);
  };

  const handleMaskCanvasMouseUp = () => {
    if (!maskEditTool || !isMaskDrawingRef.current) return;
    
    isMaskDrawingRef.current = false;
    lastMaskPosRef.current = null;
    persistMaskEdit();
  };

  const handleMaskCanvasMouseLeave = () => {
    if (isMaskDrawingRef.current) {
      
    isMaskDrawingRef.current = false;
      lastMaskPosRef.current = null;
      persistMaskEdit();
    }
  };

  // Modal "backdrop" style reusable
  const modalBackdropStyle: React.CSSProperties = {
    position: "fixed",
    inset: 0,
    zIndex: 10010,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "rgba(16,36,63,0.5)",
    backdropFilter: "blur(4px)",
  };
  const modalCardStyle: React.CSSProperties = {
    background: "white",
    borderRadius: 28,
    boxShadow: "0 8px 32px rgba(16,36,63,0.18)",
    border: "1px solid rgba(16,36,63,0.08)",
    maxWidth: 420,
    width: "90%",
    overflow: "hidden",
  };
  const modalHeaderStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "20px 28px 12px",
    borderBottom: "1px solid rgba(16,36,63,0.08)",
  };
  const modalTitleStyle: React.CSSProperties = {
    fontSize: "1.1rem",
    fontWeight: 700,
    margin: 0,
    color: "#339eea",
  };
  const btnSecondary: React.CSSProperties = {
    padding: "8px 16px",
    borderRadius: 12,
    fontWeight: 600,
    fontSize: "0.75rem",
    border: "1px solid rgba(16,36,63,0.08)",
    color: "#4d6684",
    background: "#f8fbff",
    cursor: "pointer",
    transition: "background 0.15s",
  };
  const btnPrimary: React.CSSProperties = {
    padding: "8px 16px",
    borderRadius: 12,
    fontWeight: 600,
    fontSize: "0.75rem",
    border: "none",
    color: "white",
    cursor: "pointer",
    transition: "opacity 0.15s",
    background: "linear-gradient(135deg, #339eea, #0d5a91)",
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "rgba(0,0,0,0.92)",
        backdropFilter: "blur(8px)",
        display: "grid",
        gridTemplateColumns: "100px 1fr 480px",
        gridTemplateRows: "100%",
        alignItems: "center",
        justifyItems: "center",
        userSelect: "none",
        overflow: "hidden",
      }}
    >
      {/* Top toolbar */}
      <div
        style={{
          position: "absolute",
          top: 16,
          right: 16,
          zIndex: 10,
          display: "flex",
          gap: 10,
          alignItems: "center",
        }}
      >
        {/* Close button moved to navigation section */}
      </div>

      {/* ===== Image centered in grid column 2 ===== */}
      <div
        style={{
          gridColumn: "2",
          gridRow: "1",
          width: "100%",
          height: "100%",
          paddingTop: 50,
          paddingBottom: 50,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1,
        }}
      >
        <div
          ref={imageContainerRef}
          onDoubleClick={(e) => { e.stopPropagation(); resetZoom(); }}
          onWheel={(e) => {
            if (e.ctrlKey || e.metaKey) return; // allow native browser zoom
            // e.preventDefault() cannot be called reliably on React passive wheel events, but we can manage state
            const zoomDelta = e.deltaY > 0 ? -0.15 : 0.15;
            setZoomScale(prev => Math.min(Math.max(1, prev + prev * zoomDelta), 10));
          }}
          onMouseDown={(e) => {
            if (e.button === 1 || (e.button === 0 && (activeSidebarTool === "overview" || (activeSidebarTool === "mask" && !maskEditTool)))) {
              e.preventDefault();
              setIsPanning(true);
              isPanningRef.current = true;
              lastPanPos.current = { x: e.clientX, y: e.clientY };
            }
          }}
          onMouseUp={(e) => {
            if (isPanningRef.current) { setIsPanning(false); isPanningRef.current = false; }
            isPanningRef.current = false;
          }}
          onMouseMove={(e) => {
            if (isPanningRef.current) {
              const dx = e.clientX - lastPanPos.current.x;
              const dy = e.clientY - lastPanPos.current.y;
              setPanOffset(prev => ({ x: prev.x + dx / zoomScale, y: prev.y + dy / zoomScale }));
              lastPanPos.current = { x: e.clientX, y: e.clientY };
              return;
            }

            if (maskEditTool || measurementMode) {
              return;
            }

            const polygons = inclusionsByImageUrl?.[currentImage?.url];
            const isVisible = inclusionsVisibleByImageUrl?.[currentImage?.url];
            if (!isVisible || !polygons || polygons.length === 0) {
              setHoveredInclusion(null);
              return;
            }
            
            const img = imgRef.current;
            const container = imageContainerRef.current;
            if (!img || !container) return;
            
            const rect = img.getBoundingClientRect();
            const scaleX = img.naturalWidth / rect.width;
            const scaleY = img.naturalHeight / rect.height;
            
            const clientX = e.clientX - rect.left;
            const clientY = e.clientY - rect.top;
            
            const x = clientX * scaleX;
            const y = clientY * scaleY;
            
            let found = null;
            for (const poly of polygons) {
              if (poly.confidence < inclusionsThreshold) continue;
              
              let inside = false;
              for (let i = 0, j = poly.points.length - 1; i < poly.points.length; j = i++) {
                const xi = poly.points[i].x, yi = poly.points[i].y;
                const xj = poly.points[j].x, yj = poly.points[j].y;
                const intersect = ((yi > y) !== (yj > y))
                    && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
                if (intersect) inside = !inside;
              }
              if (inside) {
                found = poly;
                break;
              }
            }
            
            if (found) {
              const containerRect = container.getBoundingClientRect();
              setHoveredInclusion(prev => {
                const newX = e.clientX - containerRect.left;
                const newY = e.clientY - containerRect.top;
                if (prev && prev.poly === found && prev.x === newX && prev.y === newY) return prev;
                return { poly: found, x: newX, y: newY };
              });
            } else {
              setHoveredInclusion(prev => prev === null ? null : null);
            }
          }}
          onMouseLeave={() => {
            if (isPanningRef.current) { setIsPanning(false); isPanningRef.current = false; }
            isPanningRef.current = false;
            setHoveredInclusion(null);
          }}
          style={{
            maxWidth: imageMaxWidth + borderPad,
            maxHeight: imageMaxHeight + borderPad,
            overflow: "visible",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
            transform: `scale(${zoomScale}) translate(${panOffset.x}px, ${panOffset.y}px)`,
            transformOrigin: "center center",
            transition: isPanning ? "none" : "transform 0.1s ease-out",
            cursor: isPanning ? "grabbing" : (activeSidebarTool === "overview" ? "grab" : "default"),
          }}
        >
          <div
            className={(aiProcessing && !calibrationMode) ? "ai-snake-border" : undefined}
            style={{
              position: "relative",
              display: "inline-block",
              lineHeight: 0,
              padding: showAiFx ? 4 : 0,
              borderRadius: showAiFx ? 12 : 8,
              overflow: "hidden",
              background: showAiFx
                ? (aiProcessing && !calibrationMode)
                  ? `conic-gradient(from var(--border-angle), transparent 60%, ${aiFxColor} 100%)`
                  : aiFxColor
                : "transparent",
            }}
          >
            {showAiFx && (
              <div
                style={{
                  position: "absolute",
                  inset: 4,
                  background: "rgba(0,0,0,0.92)",
                  borderRadius: 8,
                  zIndex: 0,
                }}
              />
            )}
            <img
              ref={imgRef}
              src={displayedImageUrl}
              alt={currentImage.name}
              draggable={false}
              onLoad={syncCanvasSize}
              style={{
                display: "block",
                borderRadius: 8,
                maxWidth: imageMaxWidth,
                maxHeight: imageMaxHeight,
                position: showAiFx ? "relative" : "static",
                zIndex: showAiFx ? 1 : "auto",
              }}
            />
            {currentMeasurementOverlayUrl ? (
              <img
                src={currentMeasurementOverlayUrl}
                alt={`Medicion de ${currentImage.name}`}
                draggable={false}
                style={{
                  position: "absolute",
                  top: showAiFx ? 4 : 0,
                  left: showAiFx ? 4 : 0,
                  width: showAiFx ? "calc(100% - 8px)" : "100%",
                  height: showAiFx ? "calc(100% - 8px)" : "100%",
                  objectFit: "contain",
                  borderRadius: 8,
                  opacity: isMeasurementOverlayVisible ? 1 : 0,
                  transition: "opacity 600ms cubic-bezier(0.22, 1, 0.36, 1)",
                  pointerEvents: "none",
                  zIndex: showAiFx ? 2 : "auto",
                }}
              />
            ) : null}
            {currentMaskUrl && !isMeasurementOverlayVisible ? (
              <img
                src={currentMaskUrl}
                alt={`Mascara de ${currentImage.name}`}
                draggable={false}
                style={{
                  position: "absolute",
                  top: showAiFx ? 4 : 0,
                  left: showAiFx ? 4 : 0,
                  width: showAiFx ? "calc(100% - 8px)" : "100%",
                  height: showAiFx ? "calc(100% - 8px)" : "100%",
                  objectFit: "contain",
                  borderRadius: 8,
                  opacity: isMaskVisible ? 1 : 0,
                  transition: "opacity 1960ms cubic-bezier(0.22, 1, 0.36, 1)",
                  pointerEvents: "none",
                  zIndex: showAiFx ? 2 : "auto",
                }}
              />
            ) : null}
            {maskEditTool && !isMeasurementOverlayVisible && (
              <canvas
                ref={maskCanvasRef}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  borderRadius: 8,
                  opacity: 1,
                  cursor: maskEditTool === "pencil" ? "crosshair" : "cell",
                  zIndex: 2,
                }}
                onMouseDown={handleMaskCanvasMouseDown}
                onMouseMove={handleMaskCanvasMouseMove}
                onMouseUp={handleMaskCanvasMouseUp}
                onMouseLeave={handleMaskCanvasMouseLeave}
              />
            )}
            <canvas
              ref={inclusionsCanvasRef}
              style={{
                position: "absolute",
                top: showAiFx ? 4 : 0,
                left: showAiFx ? 4 : 0,
                display: "block",
                pointerEvents: "none",
                zIndex: 3,
                borderRadius: 8,
              }}
            />
            <canvas
              ref={canvasRef}
              style={{
                position: "absolute",
                top: showAiFx ? 4 : 0,
                left: showAiFx ? 4 : 0,
                display: isMeasurementOverlayVisible ? "none" : "block",
                cursor: calibrationMode
                  ? lineFinished
                    ? "default"
                    : "crosshair"
                  : measurementMode ? "crosshair" : "default",
                zIndex: 2,
                pointerEvents: (!isMeasurementOverlayVisible && (calibrationMode || measurementMode)) ? "auto" : "none",
              }}
                onMouseDown={(e) => {
                  if (measurementMode) {
                    handleMeasurementMouseDown(e);
                  } else {
                    handleCanvasMouseDown(e);
                  }
                }}
                onMouseMove={(e) => {
                  if (measurementMode) {
                    handleMeasurementMouseMove(e);
                  } else {
                    handleCanvasMouseMove(e);
                  }
                }}
                onMouseUp={(e) => {
                  if (measurementMode) {
                    handleMeasurementMouseUp(e);
                  } else {
                    handleCanvasMouseUp(e);
                  }
                }}
                onMouseLeave={() => {
                  if (measurementMode) {
                    handleMeasurementMouseLeave();
                  }
                }}
              />
            {hoveredInclusion && (
              <div
                style={{
                  position: "absolute",
                  left: Math.min(hoveredInclusion.x + 10, editorLayout.imageWidth - 140),
                  top: Math.max(hoveredInclusion.y - 20, 10),
                  padding: "6px 12px",
                  background: "rgba(0,0,0,0.65)",
                  color: "white",
                  fontSize: "0.85rem",
                  fontFamily: "monospace, Courier New, Courier, serif",
                  borderRadius: 8,
                  pointerEvents: "none",
                  zIndex: 20,
                  whiteSpace: "nowrap",
                  border: "1px solid rgba(255,255,255,0.15)",
                  backdropFilter: "blur(8px)",
                  boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
                  display: "flex",
                  gap: "8px",
                  alignItems: "center"
                }}
              >
                <span style={{ fontWeight: 600, color: "#ff00ff" }}>Confianza:</span>
                <span style={{ opacity: 0.85 }}>{(hoveredInclusion.poly.confidence * 100).toFixed(1)}%</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {measurementMode &&
        measurementLabelPos &&
        measurementDistanceUm !== null && (
          <div
            style={{
              position: "fixed",
              left: measurementLabelPos.x + 12,
              top: measurementLabelPos.y - 28,
              padding: "4px 8px",
              borderRadius: 8,
              background: "rgba(0,0,0,0.72)",
              color: "white",
              fontSize: "0.78rem",
              fontWeight: 700,
              border: "1px solid rgba(255,255,255,0.2)",
              boxShadow: "0 6px 14px rgba(0,0,0,0.25)",
              pointerEvents: "none",
              zIndex: 9999,
              whiteSpace: "nowrap",
            }}
          >
            {measurementDistanceUm.toFixed(2)} µm
          </div>
        )}

      {/* ===== Left Action Toolbar (conditionally renders tools/calibration) ===== */}
      <div
        style={{
          gridColumn: "1",
          gridRow: "1",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          zIndex: 6,
        }}
      >
        <aside
          style={{
            width: 62,
            height: "fit-content",
            maxHeight: `calc(100vh - 40px)`, // Ensure it fits viewport
            borderRadius: 999,
            padding: "9px 0",
            background: "rgba(0,0,0,0.52)",
            border: "1px solid rgba(255,255,255,0.14)",
            backdropFilter: "blur(4px)",
            overflow: "visible",
            display: "flex",
            flexDirection: "column",
            justifyContent: currentImageIsCalibrable
              ? "space-between"
              : "center",
            alignItems: "center",
            gap: currentImageIsCalibrable ? 12 : 8,
            boxShadow: "0 10px 30px rgba(0,0,0,0.26)",
          }}
        >
          {currentImageIsCalibrable && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 10,
                width: "100%",
              }}
            >
              <button
                title="Calibrar"
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: "50%",
                  border: "none",
                  background:
                    activeSidebarTool === "calibration" || calibrationMode
                      ? "rgba(51,158,234,0.88)"
                      : "rgba(0,0,0,0.56)",
                  color: "white",
                  cursor: isMeasurementOverlayVisible ? "default" : "pointer",
                  lineHeight: 0,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "background 0.15s, transform 0.15s",
                  opacity: isMeasurementOverlayVisible ? 0.4 : 1,
                }}
                disabled={isMeasurementOverlayVisible}
                onClick={() => onCheckMicrographLimit(handleActivateCalibration)}
                onMouseOver={(e) => {
                  if (isMeasurementOverlayVisible) return;
                  if (!calibrationMode)
                    e.currentTarget.style.background = "rgba(51,158,234,0.78)";
                }}
                onMouseOut={(e) => {
                  if (!calibrationMode && activeSidebarTool !== "calibration") {
                    e.currentTarget.style.background = "rgba(0,0,0,0.56)";
                  }
                }}
              >
                <CaliperIcon />
              </button>
              {ENABLE_AUTOCALIBRATION && (
                <button
                  title="Reintentar autocalibración"
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: "50%",
                    border: "none",
                    background: !!calibratingByUrl?.[currentImage.url]
                        ? "rgba(51,158,234,0.88)"
                        : "rgba(0,0,0,0.56)",
                    color: "white",
                    cursor: !!calibratingByUrl?.[currentImage.url] ? "wait" : "pointer",
                    lineHeight: 0,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "background 0.15s, transform 0.15s",
                    opacity: !!calibratingByUrl?.[currentImage.url] ? 0.65 : 1,
                  }}
                  disabled={!!calibratingByUrl?.[currentImage.url] || !onRetryAutoCalibration}
                  onClick={() => onCheckMicrographLimit(() => {
                    if (!currentImage?.url || !!calibratingByUrl?.[currentImage.url] || !onRetryAutoCalibration) return;
                    if (!(microMaterialHasModelByUrl[currentImage.url] ?? true)) {
                      pushToast("Material no soportado.", "error", 5000);
                      return;
                    }
                    onRetryAutoCalibration(currentImage.url);
                  })}
                  onMouseOver={(e) => {
                    if (!!calibratingByUrl?.[currentImage.url]) return;
                    e.currentTarget.style.background = "rgba(51,158,234,0.78)";
                  }}
                  onMouseOut={(e) => {
                    if (!!calibratingByUrl?.[currentImage.url]) return;
                    e.currentTarget.style.background = "rgba(0,0,0,0.56)";
                  }}
                >
                  <RefreshIcon />
                </button>
              )}
              <button
                title={
                  !measurementEnabled
                    ? "Calibrá la micrografía para habilitar la medición"
                    : activeSidebarTool === "measurement"
                      ? "Salir de medición"
                      : "Medir"
                }
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: "50%",
                  border: "none",
                  background:
                    showMeasurements || activeSidebarTool === "measurement"
                      ? "rgba(51,158,234,0.88)"
                      : "rgba(0,0,0,0.56)",
                  color: "white",
                  cursor: measurementEnabled && !isMeasurementOverlayVisible ? "pointer" : "default",
                  lineHeight: 0,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "background 0.15s",
                  opacity: isMeasurementOverlayVisible ? 0.4 : (measurementEnabled ? 1 : 0.55),
                }}
                disabled={isMeasurementOverlayVisible}
                onClick={() => onCheckMicrographLimit(() => {
                  if (!measurementEnabled) return;
                  handleActivateMeasurement();
                })}
                onMouseOver={(e) => {
                  if (
                    !measurementEnabled ||
                    activeSidebarTool === "measurement" ||
                    isMeasurementOverlayVisible
                  )
                    return;
                  e.currentTarget.style.background = "rgba(51,158,234,0.78)";
                }}
                onMouseOut={(e) => {
                  if (
                    !measurementEnabled ||
                    activeSidebarTool === "measurement"
                  )
                    return;
                  e.currentTarget.style.background = "rgba(0,0,0,0.56)";
                }}
              >
                <RulerIcon />
              </button>
              <button
                title={
                  isMaskLoading
                    ? "Generando mascara..."
                    : currentMaskUrl
                      ? isMaskVisible
                        ? "Desenmascarar"
                        : "Enmascarar"
                      : "Enmascarar"
                }
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: "50%",
                  border: "none",
                  background: isMaskVisible
                    ? "rgba(51,158,234,0.88)"
                    : "rgba(0,0,0,0.56)",
                  color: "white",
                  cursor: isMeasurementOverlayVisible ? "default" : (isMaskLoading ? "wait" : "pointer"),
                  lineHeight: 0,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "background 0.15s",
                  opacity: isMeasurementOverlayVisible ? 0.4 : (isMaskLoading ? 0.65 : 1),
                }}
                disabled={isMaskLoading || isMeasurementOverlayVisible}
                onClick={() => onCheckMicrographLimit(() => {
                  if (isMaskVisible) {
                    setActiveSidebarTool("overview");
                  } else {
                    setActiveSidebarTool("mask");
                  }
                  void onGenerateMask(currentImage.url);
                })}
                onMouseOver={(e) => {
                  if (isMaskLoading || isMaskVisible || isMeasurementOverlayVisible) return;
                  e.currentTarget.style.background = "rgba(51,158,234,0.78)";
                }}
                onMouseOut={(e) => {
                  if (isMaskLoading || isMaskVisible) return;
                  e.currentTarget.style.background = "rgba(0,0,0,0.56)";
                }}
              >
                <MaskIcon />
              </button>
              {/* ---- Inclusions tool ---- */}
              <div style={{ position: "relative", display: "flex", justifyContent: "center", width: "100%" }}>
                <button
                  title={
                    inclusionsLoadingByImageUrl?.[currentImage.url]
                      ? "Detectando inclusiones..."
                      : inclusionsVisibleByImageUrl?.[currentImage.url]
                        ? "Ocultar Inclusiones"
                        : "Detectar Inclusiones"
                  }
                  style={{
                    width: 44,
                    height: 44,
                    flexShrink: 0,
                    borderRadius: "50%",
                    border: "none",
                    background: inclusionsVisibleByImageUrl?.[currentImage.url]
                      ? "rgba(51,158,234,0.88)"
                      : "rgba(0,0,0,0.56)",
                    color: "white",
                    cursor: isMeasurementOverlayVisible ? "default" : (inclusionsLoadingByImageUrl?.[currentImage.url] ? "wait" : "pointer"),
                    lineHeight: 0,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "background 0.15s",
                    opacity: isMeasurementOverlayVisible ? 0.4 : (inclusionsLoadingByImageUrl?.[currentImage.url] ? 0.65 : 1),
                  }}
                  disabled={inclusionsLoadingByImageUrl?.[currentImage.url] || isMeasurementOverlayVisible}
                  onClick={() => onCheckMicrographLimit(() => {
                    setActiveSidebarTool((prev) => (prev === "overview" ? "mask" : prev));
                    if (onDetectInclusiones) {
                      if (!inclusionsVisibleByImageUrl?.[currentImage.url]) {
                        setShowInclusionsSlider(true);
                      } else {
                        setShowInclusionsSlider(false);
                      }
                      void onDetectInclusiones(currentImage.url);
                    }
                  })}
                  onMouseOver={(e) => {
                    if (inclusionsLoadingByImageUrl?.[currentImage.url] || inclusionsVisibleByImageUrl?.[currentImage.url] || isMeasurementOverlayVisible) return;
                    e.currentTarget.style.background = "rgba(51,158,234,0.78)";
                  }}
                  onMouseOut={(e) => {
                    if (inclusionsLoadingByImageUrl?.[currentImage.url] || inclusionsVisibleByImageUrl?.[currentImage.url]) return;
                    e.currentTarget.style.background = "rgba(0,0,0,0.56)";
                  }}
                >
                  <InclusionsIcon />
                </button>
                
                {/* Popover */}
                {showInclusionsSlider && inclusionsVisibleByImageUrl?.[currentImage.url] && (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      position: "absolute",
                      top: "50%",
                      left: "calc(100% + 16px)",
                      transform: "translateY(-50%)",
                      zIndex: 60,
                      background: "rgba(15, 17, 21, 0.95)",
                      backdropFilter: "blur(16px)",
                      borderRadius: 16,
                      padding: "16px 8px",
                      boxShadow: "0 20px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.1)",
                      animation: "dropdownFadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 12,
                      width: 56,
                    }}
                  >
                    <span style={{ 
                      fontSize: 13, 
                      fontWeight: "bold", 
                      color: "white", 
                      userSelect: "none",
                      background: "rgba(0,0,0,0.56)",
                      padding: "4px 0",
                      borderRadius: 12,
                      border: "1px solid rgba(255,255,255,0.1)",
                      boxShadow: "inset 0 1px 3px rgba(0,0,0,0.2)",
                      width: "100%",
                      textAlign: "center",
                      display: "inline-block",
                    }}>
                      {(inclusionsThreshold * 100).toFixed(0)}%
                    </span>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={inclusionsThreshold}
                      onChange={(e) => setInclusionsThreshold(parseFloat(e.target.value))}
                      title={`Threshold de confianza: ${(inclusionsThreshold * 100).toFixed(0)}%`}
                      style={{
                        height: 120,
                        width: 40,
                        writingMode: "vertical-lr",
                        direction: "rtl",
                        accentColor: "#339eea",
                        cursor: "pointer",
                        margin: 0
                      }}
                    />
                  </div>
                )}
              </div>
              {/* ---- Pencil tool (Drawer Trigger) ---- */}
              <div style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center", width: "100%" }}>
                <button
                  title="Herramientas de Dibujo"
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: "50%",
                    border: "none",
                    background:
                      isPencilMenuOpen
                        ? "rgba(51,158,234,0.88)"
                        : "rgba(0,0,0,0.56)",
                    color: "white",
                    cursor: isMeasurementOverlayVisible ? "default" : "pointer",
                    lineHeight: 0,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "background 0.15s",
                    opacity: isMeasurementOverlayVisible ? 0.4 : 1,
                    zIndex: 10
                  }}
                  disabled={isMeasurementOverlayVisible}
                  onClick={() => onCheckMicrographLimit(() => {
                    setIsPencilMenuOpen(prev => {
                      const next = !prev;
                      if (next) {
                        setIsZoomMenuOpen(false);
                        setIsNavMenuOpen(false);
                        setActiveSidebarTool("mask");
                        setMaskEditTool("pencil");
                      } else {
                        setMaskEditTool(null);
                        if (activeSidebarTool === "mask") {
                          setActiveSidebarTool("overview");
                        }
                      }
                      return next;
                    });
                  })}
                  onMouseOver={(e) => {
                    if (isPencilMenuOpen || isMeasurementOverlayVisible) return;
                    e.currentTarget.style.background = "rgba(51,158,234,0.78)";
                  }}
                  onMouseOut={(e) => {
                    if (isPencilMenuOpen) return;
                    e.currentTarget.style.background = "rgba(0,0,0,0.56)";
                  }}
                >
                  <PencilIcon />
                </button>
                
                <div style={{ 
                    display: "flex", flexDirection: "column", alignItems: "center", gap: 10,
                    overflow: "hidden",
                    maxHeight: isPencilMenuOpen ? 300 : 0,
                    opacity: isPencilMenuOpen ? 1 : 0,
                    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                    width: "100%",
                  }}>
                    <div style={{ width: 44, height: 1, background: "rgba(255,255,255,0.1)", marginTop: 2, flexShrink: 0 }} />
                    {/* Color picker dot triggering the modalcito */}
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowColorPicker((prev) => !prev);
                      }}
                      title="Elegir Color"
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: "50%",
                        background: "conic-gradient(red, yellow, lime, aqua, blue, magenta, red)",
                        cursor: "pointer",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        flexShrink: 0,
                        boxShadow: "0 2px 5px rgba(0,0,0,0.5)",
                        marginTop: 4
                      }}
                    >
                      <div style={{ width: 18, height: 18, borderRadius: "50%", background: pencilColor, border: "2px solid rgba(255,255,255,0.9)", pointerEvents: "none" }} />
                    </div>

                    <div style={{ width: "60%", height: 1, background: "rgba(255,255,255,0.1)" }} />

                    {/* ---- Eraser tool ---- */}
                    <button
                      title="Goma (borrar máscara)"
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: "50%",
                        border: "none",
                        background:
                          maskEditTool === "eraser"
                            ? "rgba(51,158,234,0.88)"
                            : "rgba(0,0,0,0.4)",
                        color: "white",
                        cursor: "pointer",
                        lineHeight: 0,
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        transition: "background 0.15s",
                      }}
                      onClick={() => {
                        setMaskEditTool((prev) =>
                          prev === "eraser" ? "pencil" : "eraser",
                        );
                      }}
                      onMouseOver={(e) => {
                        if (maskEditTool === "eraser") return;
                        e.currentTarget.style.background = "rgba(51,158,234,0.78)";
                      }}
                      onMouseOut={(e) => {
                        if (maskEditTool === "eraser") return;
                        e.currentTarget.style.background = "rgba(0,0,0,0.4)";
                      }}
                    >
                      <EraserIcon />
                    </button>
                    <button
                      title="Limpiar dibujo"
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: "50%",
                        border: "none",
                        background: "rgba(0,0,0,0.4)",
                        color: "white",
                        cursor: isDrawingToolActive ? "pointer" : "default",
                        lineHeight: 0,
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        transition: "background 0.15s",
                        opacity: isDrawingToolActive ? 1 : 0.45,
                      }}
                      disabled={!isDrawingToolActive}
                      onClick={() => {
                        if (!isDrawingToolActive) return;
                        clearCurrentDrawing();
                      }}
                      onMouseOver={(e) => {
                        if (!isDrawingToolActive) return;
                        e.currentTarget.style.background = "rgba(51,158,234,0.78)";
                      }}
                      onMouseOut={(e) => {
                        if (!isDrawingToolActive) return;
                        e.currentTarget.style.background = "rgba(0,0,0,0.4)";
                      }}
                    >
                      <TrashIcon />
                    </button>
                </div>

                {/* Glassmorphism Color picker popover */}
                {showColorPicker && isPencilMenuOpen && (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      position: "absolute",
                      top: 70,
                      left: "calc(100% + 16px)",
                      zIndex: 60,
                      background: "rgba(15, 17, 21, 0.95)",
                      backdropFilter: "blur(16px)",
                      borderRadius: 16,
                      padding: 16,
                      boxShadow: "0 20px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.1)",
                      animation: "dropdownFadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
                      width: 200,
                      display: "flex",
                      flexDirection: "column",
                      gap: 12,
                    }}
                  >
                    {/* Swatches Grid */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 8 }}>
                      {["#ffffff", "#ff3b30", "#ff9500", "#ffcc00", "#4cd964", "#5ac8fa", "#007aff", "#5856d6", "#ff2d55", "#000000"].map((c) => (
                        <div
                          key={c}
                          onClick={() => setPencilColor(c)}
                          style={{
                            aspectRatio: "1",
                            borderRadius: "50%",
                            background: c,
                            cursor: "pointer",
                            border: pencilColor.toLowerCase() === c ? "2px solid #339eea" : "2px solid rgba(255,255,255,0.15)",
                            boxShadow: "inset 0 1px 3px rgba(0,0,0,0.2)",
                            transform: pencilColor.toLowerCase() === c ? "scale(1.15)" : "scale(1)",
                            transition: "all 0.2s",
                          }}
                        />
                      ))}
                    </div>

                    <hr style={{ border: "none", borderTop: "1px solid rgba(255,255,255,0.1)", margin: "2px 0" }} />

                    {/* Custom Color (Native Fallback beautifully wrapped) */}
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <label
                        title="Abrir paleta avanzada..."
                        style={{
                          position: "relative",
                          width: 32,
                          height: 32,
                          borderRadius: "50%",
                          background: "conic-gradient(red, yellow, lime, aqua, blue, magenta, red)",
                          cursor: "pointer",
                          overflow: "hidden",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          flexShrink: 0,
                          boxShadow: "0 2px 5px rgba(0,0,0,0.5)"
                        }}
                      >
                        <div style={{ width: 22, height: 22, borderRadius: "50%", background: pencilColor, border: "2px solid rgba(255,255,255,0.9)", pointerEvents: "none" }} />
                        <input
                          type="color"
                          value={pencilColor}
                          onChange={(e) => setPencilColor(e.target.value)}
                          style={{ opacity: 0, position: "absolute", width: "200%", height: "200%", top: "-50%", left: "-50%", cursor: "pointer" }}
                        />
                      </label>
                      <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
                        <span style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.5)", fontWeight: 600 }}>CÓDIGO HEX</span>
                        <input 
                          type="text" 
                          value={pencilColor.toUpperCase()}
                          onChange={(e) => {
                            const val = e.target.value;
                            setPencilColor(val);
                          }}
                          style={{
                            background: "transparent",
                            border: "none",
                            color: "white",
                            fontSize: "0.85rem",
                            fontWeight: 600,
                            fontFamily: "monospace",
                            outline: "none",
                            width: "100%",
                            padding: 0,
                            margin: 0,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

        </aside>
        
        {/* ===== ASTM Menu ===== */}
        <div 
          style={{
            width: 62,
            background: "rgba(0,0,0,0.52)",
            border: "1px solid rgba(255,255,255,0.14)",
            backdropFilter: "blur(4px)",
            boxShadow: "0 10px 30px rgba(0,0,0,0.26)",
            borderRadius: 999,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            padding: "9px 0",
            gap: 8,
            overflow: "hidden",
            height: isAstmMenuOpen ? 114 : 62,
            transition: "height 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        >
          {/* ASTM Head */}
          <button
            title="Normas ASTM"
            onClick={() => setIsAstmMenuOpen(!isAstmMenuOpen)}
            style={{
              width: 44,
              height: 44,
              flexShrink: 0,
              borderRadius: "50%",
              border: "none",
              background: isAstmMenuOpen ? "rgba(51,158,234,0.88)" : "transparent",
              color: "white",
              fontWeight: 700,
              fontSize: 10,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "background 0.15s, color 0.15s",
            }}
            onMouseOver={(e) => {
              if (!isAstmMenuOpen) e.currentTarget.style.background = "rgba(51,158,234,0.78)";
            }}
            onMouseOut={(e) => {
              if (!isAstmMenuOpen) e.currentTarget.style.background = "transparent";
            }}
          >
            ASTM
          </button>

          {/* E112 Button */}
          <button
            title={
              !currentMeasurementOverlayUrl
                ? "Gráfico de medición no disponible"
                : isMeasurementOverlayVisible
                  ? "Ocultar norma E112"
                  : "Ver norma E112"
            }
            style={{
              width: 44,
              height: 44,
              flexShrink: 0,
              borderRadius: "50%",
              border: "none",
              background: isMeasurementOverlayVisible
                ? "rgba(51,158,234,0.88)"
                : "rgba(0,0,0,0.56)",
              color: "white",
              cursor: ((activeSidebarTool === "measurement" || activeSidebarTool === "calibration" || (activeSidebarTool === "mask" && maskEditTool !== null)) && !isMeasurementOverlayVisible) ? "default" : "pointer",
              lineHeight: 0,
              display: "inline-flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 2,
              transition: "background 0.15s, opacity 0.3s",
              opacity: isAstmMenuOpen ? (currentMeasurementOverlayUrl ? (((activeSidebarTool === "measurement" || activeSidebarTool === "calibration" || (activeSidebarTool === "mask" && maskEditTool !== null)) && !isMeasurementOverlayVisible) ? 0.4 : 1) : 0.55) : 0,
              pointerEvents: isAstmMenuOpen ? "auto" : "none",
            }}
            disabled={!currentMeasurementOverlayUrl || ((activeSidebarTool === "measurement" || activeSidebarTool === "calibration" || (activeSidebarTool === "mask" && maskEditTool !== null)) && !isMeasurementOverlayVisible) || !isAstmMenuOpen}
            onClick={(e) => {
              e.stopPropagation();
              onCheckMicrographLimit(() => {
                if (!(microMaterialHasModelByUrl[currentImage.url] ?? true)) {
                  pushToast("Material no soportado.", "error", 5000);
                  return;
                }
                if (currentMeasurementOverlayUrl) {
                  onToggleMeasurementOverlay?.(currentImage.url);
                }
              });
            }}
            onMouseOver={(e) => {
              const isDisabled = !currentMeasurementOverlayUrl || ((activeSidebarTool === "measurement" || activeSidebarTool === "calibration" || (activeSidebarTool === "mask" && maskEditTool !== null)) && !isMeasurementOverlayVisible) || !isAstmMenuOpen;
              if (isDisabled || isMeasurementOverlayVisible) return;
              e.currentTarget.style.background = "rgba(51,158,234,0.78)";
            }}
            onMouseOut={(e) => {
              const isDisabled = !currentMeasurementOverlayUrl || ((activeSidebarTool === "measurement" || activeSidebarTool === "calibration" || (activeSidebarTool === "mask" && maskEditTool !== null)) && !isMeasurementOverlayVisible) || !isAstmMenuOpen;
              if (isDisabled || isMeasurementOverlayVisible) return;
              e.currentTarget.style.background = "rgba(0,0,0,0.56)";
            }}
          >
            <ChartIcon size={14} />
            <span style={{ fontSize: 9, fontWeight: 700, lineHeight: 1 }}>E112</span>
          </button>
        </div>

        {/* ===== Zoom Menu ===== */}
        <ZoomControls
          isZoomMenuOpen={isZoomMenuOpen}
          setIsZoomMenuOpen={setIsZoomMenuOpen}
          setIsPencilMenuOpen={setIsPencilMenuOpen}
          activeSidebarTool={activeSidebarTool}
          setActiveSidebarTool={setActiveSidebarTool}
          startContinuousZoom={startContinuousZoom}
          stopContinuousZoom={stopContinuousZoom}
          resetZoom={resetZoom}
        />

        {/* ===== Nav Menu ===== */}
        <NavControls
          isNavMenuOpen={isNavMenuOpen}
          setIsNavMenuOpen={setIsNavMenuOpen}
          setIsPencilMenuOpen={setIsPencilMenuOpen}
          activeSidebarTool={activeSidebarTool}
          setActiveSidebarTool={setActiveSidebarTool}
          hasSiblingImages={hasSiblingImages}
          images={images}
          setCurrentIndex={setCurrentIndex}
          onClose={onClose}
        />

        {/* ===== Info Button ===== */}
        <div
          style={{
            width: 62,
            background: "rgba(0,0,0,0.52)",
            border: "1px solid rgba(255,255,255,0.14)",
            backdropFilter: "blur(4px)",
            boxShadow: "0 10px 30px rgba(0,0,0,0.26)",
            borderRadius: 999,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            padding: "9px 0",
          }}
        >
          <button
            title="Atajos de teclado"
            onClick={() => setShowShortcutsModal(true)}
            style={{
              width: 44,
              height: 44,
              flexShrink: 0,
              borderRadius: "50%",
              border: "none",
              background: "transparent",
              color: "white",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "background 0.15s",
            }}
            onMouseOver={(e) => e.currentTarget.style.background = "rgba(51,158,234,0.78)"}
            onMouseOut={(e) => e.currentTarget.style.background = "transparent"}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
          </button>
        </div>
      </div>

      {/* ===== Right context panel — header/main/footer, 80% height ===== */}
      <div
        style={{
          gridColumn: "3",
          gridRow: "1",
          zIndex: 3,
          width: "100%",
          maxWidth: 480,
          height: "80%",
          pointerEvents: "auto",
          display: "flex",
          flexDirection: "column",
          justifySelf: "start",
        }}
      >
        {/* ---- HEADER (25%) ---- */}
        <EditorHeader
          aiSuccess={aiSuccess ?? false}
          aiProcessing={aiProcessing ?? false}
          aiError={aiError ?? false}
          calibrationMode={calibrationMode}
          hasCalibration={hasCalibration}
          toolTitle={toolTitle}
          currentImage={currentImage}
          contextInfo={contextInfo}
        />

        {/* ---- MAIN (50%) ---- */}
        <SidebarToolDetails
          activeSidebarTool={activeSidebarTool}
          toolDescription={toolDescription}
          isDrawingToolActive={isDrawingToolActive}
          drawingToolLabel={drawingToolLabel}
          measurementEnabled={measurementEnabled}
          calibrationRatio={calibrationRatio}
          currentCalibration={currentCalibration}
          measurementDistanceUm={measurementDistanceUm}
          measurementPx={measurementPx}
          measurements={measurements}
          setMeasurements={setMeasurements}
          selectedMeasurementId={selectedMeasurementId}
          setSelectedMeasurementId={setSelectedMeasurementId}
          calibrationStateLabel={calibrationStateLabel}
          currentImage={currentImage}
          isMaskVisible={isMaskVisible}
          isMaskLoading={isMaskLoading}
          inclusionsVisibleByImageUrl={inclusionsVisibleByImageUrl}
          inclusionsLoadingByImageUrl={inclusionsLoadingByImageUrl}
          inclusionsByImageUrl={inclusionsByImageUrl}
          inclusionsThreshold={inclusionsThreshold}
          maskLegendEntries={maskLegendEntries}
          currentMaskUrl={currentMaskUrl}
        />

        {/* ---- FOOTER (25%) ---- */}
        <div
          style={{
            flex: "0 0 25%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-end",
            gap: 4,
            padding: "8px 10px",
            color: "white",
            textAlign: "left",
            fontSize: "0.78rem",
            fontWeight: 600,
            lineHeight: 1.35,
          }}
        >
          <div>
            Imagen {currentIndex + 1} de {images.length}
          </div>
          <div
            style={{
              marginTop: 6,
              padding: "10px 12px",
              borderRadius: "10px",
              background: "rgba(51, 158, 234, 0.15)",
              border: "1px solid #339eea",
              boxShadow: "0 0 12px rgba(51, 158, 234, 0.3)",
              display: "flex",
              flexDirection: "column",
              gap: 4,
            }}
          >
            <div style={{ fontSize: "0.72rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", color: "#339eea", textAlign: "center", marginBottom: 4 }}>
              Información de calibración
            </div>
            
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.82rem" }}>
              <span style={{ color: "rgba(255,255,255,0.7)" }}>Micrómetros:</span>
              <span style={{ fontWeight: 600 }}>{hasCalibration && currentCalibration?.micrometers ? currentCalibration.micrometers : "-"}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.82rem" }}>
              <span style={{ color: "rgba(255,255,255,0.7)" }}>Píxeles:</span>
              <span style={{ fontWeight: 600 }}>{hasCalibration && currentCalibration?.pixelLength ? currentCalibration.pixelLength.toFixed(1) : "-"}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.82rem" }}>
              <span style={{ color: "rgba(255,255,255,0.7)" }}>Ratio:</span>
              <span style={{ fontWeight: 600 }}>{calibrationRatio ? `${calibrationRatio.toFixed(4)} µm/px` : "-"}</span>
              <span style={{ fontSize: "0.55rem", fontWeight: 800, marginTop: 4, letterSpacing: 0.5, opacity: 0.9 }}>ASTM</span>
            </div>
          </div>
        </div>
      </div>
      
      <LightboxModals
        showConfirmModal={showConfirmModal}
        pixelLength={pixelLength}
        handleConfirmCancel={handleConfirmCancel}
        handleConfirmRedo={handleConfirmRedo}
        handleConfirmOk={handleConfirmOk}
        showInputModal={showInputModal}
        micrometersInput={micrometersInput}
        setMicrometersInput={setMicrometersInput}
        handleInputSave={handleInputSave}
        handleInputCancel={handleInputCancel}
        showAutoDetectModal={showAutoDetectModal}
        detectedPixelLength={detectedPixelLength}
        handleAutoDetectCancel={handleAutoDetectCancel}
        handleAutoDetectSave={handleAutoDetectSave}
        resetCalibrationState={resetCalibrationState}
        setShowAutoDetectModal={setShowAutoDetectModal}
        showShortcutsModal={showShortcutsModal}
        setShowShortcutsModal={setShowShortcutsModal}
        modalBackdropStyle={modalBackdropStyle}
        modalCardStyle={modalCardStyle}
        modalHeaderStyle={modalHeaderStyle}
        modalTitleStyle={modalTitleStyle}
        btnSecondary={btnSecondary}
        btnPrimary={btnPrimary}
      />
    </div>
  );
}

import { Group, Panel, Separator } from "react-resizable-panels";

