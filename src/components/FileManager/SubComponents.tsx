import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Group, Panel, Separator } from "react-resizable-panels";
import * as api from '../../services/api';
import { ApiMuestra, ApiRegion, ApiMicrografia, ApiLikeError } from '../../types';

export interface CalibrationInfo {
  pixelLength: number;
  micrometers: number;
  width?: number;
  height?: number;
  umByPx?: number;
  isAi?: boolean;
  vertices?: number[][];
  sourceWidth?: number;
  sourceHeight?: number;
}

export function Collapsible({
  open,
  children,
}: {
  open: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateRows: open ? "1fr" : "0fr",
        transition: "grid-template-rows 250ms ease",
      }}
    >
      <div style={{ overflow: "hidden" }}>{children}</div>
    </div>
  );
}

export function ConfirmModal({
  title,
  message,
  confirmLabel,
  confirmColor = "#e53e3e",
  onConfirm,
  onCancel,
}: {
  title: string;
  message: string;
  confirmLabel: string;
  confirmColor?: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center"
      onClick={onCancel}
    >
      <div className="absolute inset-0 bg-[#10243f66] backdrop-blur-sm" />
      <div
        className="relative bg-white rounded-[28px] shadow-xl border border-[#10243f14] max-w-md w-[90%] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-7 pt-5 pb-3 border-b border-[#10243f14]">
          <h3 className="text-lg font-bold m-0" style={{ color: "#339eea" }}>
            {title}
          </h3>
          <button
            onClick={onCancel}
            className="text-[#4d6684] hover:text-[#10243f] transition p-1 rounded-full hover:bg-[#dff1ff]"
          >
            <CloseIcon />
          </button>
        </div>
        <div className="px-7 py-5">
          <p className="text-[#4d6684] text-sm m-0 leading-relaxed">
            {message}
          </p>
        </div>
        <div className="flex gap-3 justify-end px-7 pb-5">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-xl font-semibold text-xs border border-[#10243f14] text-[#4d6684] bg-[#f8fbff] hover:bg-[#eef8ff] transition"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded-xl font-semibold text-xs text-white transition hover:opacity-90"
            style={{ background: confirmColor }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export function RenameModal({
  currentName,
  onConfirm,
  errorMessage,
  onInputChange,
  onCancel,
}: {
  currentName: string;
  onConfirm: (n: string) => void | Promise<void>;
  errorMessage?: string | null;
  onInputChange?: () => void;
  onCancel: () => void;
}) {
  const [value, setValue] = useState(currentName);
  const [isSaving, setIsSaving] = useState(false);

  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center"
      onClick={onCancel}
    >
      <div className="absolute inset-0 bg-[#10243f66] backdrop-blur-sm" />
      <div
        className="relative bg-white rounded-[28px] shadow-xl border border-[#10243f14] max-w-md w-[90%] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-7 pt-5 pb-3 border-b border-[#10243f14]">
          <h3 className="text-lg font-bold m-0" style={{ color: "#339eea" }}>
            Renombrar
          </h3>
          <button
            onClick={onCancel}
            className="text-[#4d6684] hover:text-[#10243f] transition p-1 rounded-full hover:bg-[#dff1ff]"
          >
            <CloseIcon />
          </button>
        </div>
        <div className="px-7 py-5">
          <label className="block text-xs font-semibold text-[#10243f] mb-2">
            Nuevo nombre
          </label>
          <input
            type="text"
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              onInputChange?.();
            }}
            autoFocus
            className="w-full px-3 py-2.5 rounded-xl border border-[#10243f14] text-[#10243f] text-sm focus:outline-none focus:border-[#339eea] focus:ring-2 focus:ring-[#339eea33] transition"
          />
          {errorMessage && (
            <p className="mt-2 text-[12px] font-semibold text-[#b42318]">
              {errorMessage}
            </p>
          )}
        </div>
        <div className="flex gap-3 justify-end px-7 pb-5">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-xl font-semibold text-xs border border-[#10243f14] text-[#4d6684] bg-[#f8fbff] hover:bg-[#eef8ff] transition"
          >
            Cancelar
          </button>
          <button
            onClick={async () => {
              if (!value.trim() || isSaving) return;
              setIsSaving(true);
              try {
                await onConfirm(value.trim());
              } finally {
                setIsSaving(false);
              }
            }}
            disabled={isSaving || !value.trim()}
            className="px-4 py-2 rounded-xl font-semibold text-xs text-white transition hover:opacity-90"
            style={{ background: "linear-gradient(135deg, #339eea, #0d5a91)" }}
          >
            {isSaving ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function CreateModal({
  parentId,
  type,
  onConfirm,
  onCancel,
}: {
  parentId: string | number;
  type: "material" | "muestra" | "region" | "micrografia";
  onConfirm: (fds: FormData[]) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState("");
  const [info, setInfo] = useState(""); // solo para muestra
  const [file, setFile] = useState<File | null>(null);
  const [files, setFiles] = useState<File[]>([]); // for bulk micrografía
  const [loading, setLoading] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const isBulk = type === "micrografia";

  // Helper title
  const titles = {
    material: "Añadir nuevo Material",
    muestra: "Añadir nueva Muestra",
    region: "Añadir nueva Región",
    micrografia: "Añadir Micrografías",
  };

  const handleSubmit = async () => {
    if (isBulk) {
      if (files.length === 0) {
        setValidationError("Seleccioná al menos una imagen.");
        return;
      }
      setLoading(true);
      setValidationError(null);
      try {
        const fds = files.map((f) => {
          const fd = new FormData();
          fd.append("nombre", f.name.replace(/\.[^.]+$/, "")); // filename without extension
          fd.append("imagen", f);
          fd.append("region", String(parentId));
          fd.append("um_by_px", "1");
          return fd;
        });
        await onConfirm(fds);
      } finally {
        setLoading(false);
      }
    } else {
      if (!name.trim() || (type !== "material" && !file)) {
        setValidationError(type === "material" ? "Nombre es requerido." : "Nombre e imagen son requeridos.");
        return;
      }
      setLoading(true);
      setValidationError(null);
      try {
        const fd = new FormData();
        fd.append("nombre", name.trim());
        if (file) {
          fd.append("imagen", file);
        }
        if (type === "muestra") {
          fd.append("informacion", info.trim());
          fd.append("material", String(parentId));
        } else if (type === "region") {
          fd.append("muestra", String(parentId));
        }
        await onConfirm([fd]);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center"
      onClick={onCancel}
    >
      <div className="absolute inset-0 bg-[#10243f66] backdrop-blur-sm" />
      <div
        className="relative bg-white rounded-[28px] shadow-xl border border-[#10243f14] max-w-md w-[90%] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-7 pt-5 pb-3 border-b border-[#10243f14]">
          <h3 className="text-lg font-bold m-0" style={{ color: "#339eea" }}>
            {titles[type]}
          </h3>
          <button
            onClick={onCancel}
            className="text-[#4d6684] hover:text-[#10243f] transition p-1 rounded-full hover:bg-[#dff1ff]"
          >
            <CloseIcon />
          </button>
        </div>
        <div className="px-7 py-5 flex flex-col gap-4">
          {!isBulk && (
            <div>
              <label className="block text-xs font-semibold text-[#10243f] mb-2">
                Nombre
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (validationError) setValidationError(null);
                }}
                autoFocus
                className="w-full px-3 py-2.5 rounded-xl border border-[#10243f14] text-[#10243f] text-sm focus:outline-none focus:border-[#339eea] focus:ring-2 focus:ring-[#339eea33] transition"
              />
            </div>
          )}
          {type === "muestra" && (
            <div>
              <label className="block text-xs font-semibold text-[#10243f] mb-2">
                Información
              </label>
              <textarea
                value={info}
                onChange={(e) => {
                  setInfo(e.target.value);
                  if (validationError) setValidationError(null);
                }}
                rows={2}
                className="w-full px-3 py-2.5 rounded-xl border border-[#10243f14] text-[#10243f] text-sm focus:outline-none focus:border-[#339eea] focus:ring-2 focus:ring-[#339eea33] transition"
              />
            </div>
          )}
          {type !== "material" && (
            <div>
              <label className="block text-xs font-semibold text-[#10243f] mb-2">
                {isBulk ? `Imágenes (${files.length} seleccionadas)` : "Imagen"}
              </label>
              {isBulk ? (
                <input
                  type="file"
                  accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                  multiple
                  onChange={(e) => {
                    setFiles(Array.from(e.target.files || []));
                    if (validationError) setValidationError(null);
                  }}
                  className="w-full text-sm text-[#4d6684] file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-[#eef8ff] file:text-[#339eea] hover:file:bg-[#dff1ff] transition"
                />
              ) : (
                <input
                  type="file"
                  accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                  onChange={(e) => {
                    setFile(e.target.files?.[0] || null);
                    if (validationError) setValidationError(null);
                  }}
                  className="w-full text-sm text-[#4d6684] file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-[#eef8ff] file:text-[#339eea] hover:file:bg-[#dff1ff] transition"
                />
              )}
            </div>
          )}
          {validationError && (
            <p className="m-0 text-[12px] font-semibold text-[#b42318]">
              {validationError}
            </p>
          )}
        </div>
        <div className="flex gap-3 justify-end px-7 pb-5">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-xl font-semibold text-xs border border-[#10243f14] text-[#4d6684] bg-[#f8fbff] hover:bg-[#eef8ff] transition"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-4 py-2 rounded-xl font-semibold text-xs text-white transition hover:opacity-90 disabled:opacity-50"
            style={{ background: "linear-gradient(135deg, #339eea, #0d5a91)" }}
          >
            {loading
              ? "Guardando..."
              : isBulk
                ? `Subir ${files.length} imagen${files.length !== 1 ? "es" : ""}`
                : "Crear"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function ResponsiveGallery({
  images,
  calibrableByUrl,
  calibratedByUrl,
  calibratingByUrl,
  failedCalibrationByUrl,
  microMaterialHasModelByUrl = {},
  calibrationData,
  companyEnabled,
  highlightedByUrl,
  apiMicrografias,
  measureEventsById,
  fixImageUrl,
  onImageClick,
}: {
  images: { name: string; url: string }[];
  calibrableByUrl: Record<string, boolean>;
  calibratedByUrl: Record<string, boolean>;
  calibratingByUrl?: Record<string, boolean>;
  failedCalibrationByUrl?: Record<string, boolean>;
  microMaterialHasModelByUrl?: Record<string, boolean>;
  calibrationData?: Record<string, CalibrationInfo>;
  companyEnabled?: boolean;
  highlightedByUrl?: Record<string, boolean>;
  apiMicrografias: ApiMicrografia[];
  measureEventsById: Record<string, any>;
  fixImageUrl: (url: string | undefined | null) => string;
  onImageClick: (img: { name: string; url: string }) => void;
}) {
  const count = images.length;
  if (count === 0) {
    return (
      <div className="flex flex-col items-center justify-center absolute inset-0 opacity-70 p-4 text-center">
        <div className="text-[#9ca3af] mb-3">
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
        </div>
        <p className="text-[#6b7280] text-[0.9rem] italic m-0">
          Seleccione un elemento para ver las imágenes.
        </p>
      </div>
    );
  }

  const gridTemplateColumns =
    count === 1
      ? "1fr"
      : "repeat(auto-fit, minmax(260px, 1fr))";

  const cardAspectRatio =
    count === 1 ? "auto" : "4 / 3";

  const gridStyle: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns,
    gap: "12px",
    width: "100%",
    margin: "0 auto",
    alignItems: "stretch",
  };

  const handleImgError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const el = e.currentTarget;
    el.style.display = "none";
    // Show the fallback sibling
    const fallback = el.nextElementSibling as HTMLElement | null;
    if (fallback && fallback.dataset.fallback) {
      fallback.style.display = "flex";
    }
  };

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: count === 1 ? "center" : "flex-start",
        justifyContent: "center",
      }}
    >
      <div style={gridStyle}>
        {images.map((img, i) =>
          (() => {
            const isCalibrable = !!calibrableByUrl[img.url];
            const isCalibrated = isCalibrable && (!!calibratedByUrl[img.url] || (!!calibrationData?.[img.url]?.umByPx && Number(calibrationData?.[img.url]?.umByPx) > 0));
            const isCalibrating = !!calibratingByUrl?.[img.url];
            const isFailed = !!failedCalibrationByUrl?.[img.url];
            const hasModel = microMaterialHasModelByUrl?.[img.url] ?? true;
            const isHighlighted = !!highlightedByUrl?.[img.url];
            
            const mic = apiMicrografias.find((m) => fixImageUrl(m.imagen) === img.url);
            const measureEvt = mic ? measureEventsById[String(mic.id)] : undefined;
            const isChartProcessed = measureEvt ? measureEvt.status === "completed" && measureEvt.is_valid === true : mic?.measure_is_valid === true || !!mic?.measure_imagen;
            const isChartFailed = measureEvt ? measureEvt.status === "completed" && measureEvt.is_valid === false : mic?.measure_is_valid === false;
            const isChartProcessing = !isChartProcessed && !isChartFailed;

            return (
              <div
                key={`${img.url}-${i}`}
                className="rounded-xl overflow-hidden cursor-zoom-in group relative transition-all"
                style={{
                  width: "100%",
                  height: "auto",
                  minHeight: count === 1 ? 0 : count <= 2 ? 220 : 165,
                  maxHeight: count === 1 ? "100%" : undefined,
                  aspectRatio: cardAspectRatio,
                  overflow: "hidden",
                  background: "#f0f4f8",
                  border: "1px solid rgba(16,36,63,0.08)",
                  boxShadow: "0 1px 3px rgba(16,36,63,0.08)",
                }}
                onClick={() => onImageClick(img)}
              >
                {isCalibrable && companyEnabled !== false && (!ENABLE_AUTOCALIBRATION ? isCalibrated : (hasModel || isCalibrated)) && (
                  <div
                    style={{
                      position: "absolute",
                      top: 8,
                      left: 8,
                      zIndex: 2,
                      background: isCalibrated
                        ? "rgba(22, 163, 74, 0.92)"
                        : isFailed
                          ? "rgba(220, 38, 38, 0.92)"
                          : "rgba(232, 163, 23, 0.92)",
                      color: "white",
                      fontSize: "0.66rem",
                      fontWeight: 700,
                      height: "22px",
                      boxSizing: "border-box",
                      padding: "0 8px",
                      borderRadius: 999,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 4,
                      letterSpacing: "0.02em",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.18)",
                    }}
                    title={
                      isCalibrated
                        ? calibrationData?.[img.url]?.isAi
                          ? "Calibrada por IA"
                          : "Calibrada manualmente"
                        : isCalibrating
                          ? "Autocalibrando..."
                          : isFailed
                            ? "Fallo de autocalibración"
                            : "Micrografía sin calibrar"
                    }
                  >
                    <span style={{ lineHeight: 0, display: "inline-flex" }}>
                      {isCalibrated ? (
                        calibrationData?.[img.url]?.isAi && hasModel ? (
                          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <CheckIcon size={11} /> IA
                          </span>
                        ) : (
                          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <CheckIcon size={11} /> CM
                          </span>
                        )
                      ) : isCalibrating && hasModel ? (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <div style={{width:6,height:6,borderRadius:"50%",background:"white", animation:"pulse 1.5s infinite"}}/> IA
                        </span>
                      ) : isFailed && hasModel ? (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <AlertIcon size={11} /> IA
                        </span>
                      ) : (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <div style={{width:6,height:6,borderRadius:"50%",background:"white"}}/> Sin Calibrar
                        </span>
                      )}
                    </span>
                  </div>
                )}
                {isCalibrable && companyEnabled !== false && hasModel && (
                  <div
                    style={{
                      position: "absolute",
                      top: 8,
                      left: isCalibrated || isCalibrating || isFailed ? (isCalibrated ? 64 : 58) : 8,
                      zIndex: 2,
                      background: isChartProcessed
                        ? "rgba(22, 163, 74, 0.92)"
                        : isChartFailed
                          ? "rgba(220, 38, 38, 0.92)"
                          : "rgba(232, 163, 23, 0.92)",
                      color: "white",
                      fontSize: "0.66rem",
                      fontWeight: 700,
                      height: "22px",
                      boxSizing: "border-box",
                      padding: "0 8px",
                      borderRadius: 999,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 4,
                      letterSpacing: "0.02em",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.18)",
                    }}
                    title={
                      isChartProcessed
                        ? "Gráfico de medición disponible"
                        : isChartProcessing
                          ? "Procesando gráfico..."
                          : isChartFailed
                            ? "Fallo al generar gráfico"
                            : "Procesando gráfico..."
                    }
                  >
                    <span style={{ lineHeight: 0, display: "inline-flex" }}>
                        <ChartIcon size={12} />
                    </span>
                  </div>
                )}
                {img.url ? (
                  <img
                    src={img.url}
                    alt={img.name}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: count === 1 ? "contain" : "cover",
                      display: "block",
                    }}
                    className="transition-transform duration-300 group-hover:scale-105"
                    loading="lazy"
                    onError={handleImgError}
                  />
                ) : null}
                {/* Fallback placeholder when image fails to load */}
                <div
                  data-fallback="true"
                  style={{
                    display: "none",
                    position: "absolute",
                    inset: 0,
                    alignItems: "center",
                    justifyContent: "center",
                    flexDirection: "column",
                    gap: 8,
                    color: "#4d6684",
                    background: "#f0f4f8",
                  }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="32"
                    height="32"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ opacity: 0.4 }}
                  >
                    <rect
                      x="3"
                      y="3"
                      width="18"
                      height="18"
                      rx="2"
                      ry="2"
                    ></rect>
                    <circle cx="8.5" cy="8.5" r="1.5"></circle>
                    <polyline points="21 15 16 10 5 21"></polyline>
                  </svg>
                  <span
                    style={{
                      fontSize: "0.7rem",
                      fontWeight: 600,
                      opacity: 0.6,
                    }}
                  >
                    {img.name}
                  </span>
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2.5">
                  <span className="text-white font-medium text-xs truncate">
                    {img.name}
                  </span>
                </div>
              </div>
            );
          })(),
        )}
      </div>
    </div>
  );
}

export const CheckIcon = ({ size = 12 }: { size?: number }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="3"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="20 6 9 17 4 12"></polyline>
  </svg>
);

export const AlertIcon = ({ size = 12 }: { size?: number }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
    <line x1="12" y1="9" x2="12" y2="13"></line>
    <line x1="12" y1="17" x2="12.01" y2="17"></line>
  </svg>
);

export const InfoIcon = ({ size = 14 }: { size?: number }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10"></circle>
    <line x1="12" y1="16" x2="12" y2="12"></line>
    <line x1="12" y1="8" x2="12.01" y2="8"></line>
  </svg>
);

export const XCircleIcon = ({ size = 14 }: { size?: number }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10"></circle>
    <line x1="15" y1="9" x2="9" y2="15"></line>
    <line x1="9" y1="9" x2="15" y2="15"></line>
  </svg>
);

export const RefreshIcon = ({ size = 20 }: { size?: number }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
    <path d="M3 3v5h5" />
  </svg>
);

export const ChartIcon = ({ size = 18 }: { size?: number }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M3 3v18h18" />
    <path d="M7 16l4-4 3 3 6-7" />
  </svg>
);

export const CloseIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
);

export const ENABLE_AUTOCALIBRATION = false;

export function ResizeHandle({ id, isVisible = true }: { id?: string, isVisible?: boolean }) {
  return (
    <Separator
      id={id}
      className="flex items-center justify-center group z-10"
      style={{ 
        position: 'relative', 
        width: '12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'col-resize',
        transition: 'background-color 0.2s',
      }}
      onMouseEnter={(e) => { if (isVisible) e.currentTarget.style.backgroundColor = 'rgba(51, 158, 234, 0.07)'; }}
      onMouseLeave={(e) => { if (isVisible) e.currentTarget.style.backgroundColor = 'transparent'; }}
    >
      <div 
        style={{
          width: '4px',
          height: '32px',
          borderRadius: '9999px',
          backgroundColor: isVisible ? 'rgba(51, 158, 234, 0.3)' : 'transparent',
          transition: 'background-color 0.2s',
        }}
        onMouseEnter={(e) => { if (isVisible) e.currentTarget.style.backgroundColor = 'rgba(51, 158, 234, 1)'; }}
        onMouseLeave={(e) => { if (isVisible) e.currentTarget.style.backgroundColor = 'rgba(51, 158, 234, 0.3)'; }}
      />
    </Separator>
  );
}
