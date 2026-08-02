import React, { Dispatch, SetStateAction } from "react";
import { ResponsiveGallery } from "./SubComponents";
import { useDataStore } from "../../store/useDataStore";
import { ENABLE_AUTOCALIBRATION } from "../../utils/calibration";
import { ApiMicrografia } from "../../types";
import { MicrographyMeasureCompletedEvent } from "../../services/notifications";
import { CalibrationInfo } from "./SubComponents";

export interface GalleryPanelProps {
  galleryTitle: string;
  showGalleryLegend: boolean;
  setShowGalleryLegend: Dispatch<SetStateAction<boolean>>;
  setShowAdminLegend: Dispatch<SetStateAction<boolean>>;
  setShowReportLegendModal: Dispatch<SetStateAction<boolean>>;
  galleryImages: { name: string; url: string }[];
  companyEnabled: boolean;
  galleryCalibrableByUrl: Record<string, boolean>;
  galleryCalibratedByUrl: Record<string, boolean>;
  calibratingByUrl: Record<string, boolean>;
  failedCalibrationByUrl: Record<string, boolean>;
  calibrationData: Record<string, CalibrationInfo>;
  microMaterialHasModelByUrl: Record<string, boolean>;
  measureEventsById: Record<string, MicrographyMeasureCompletedEvent>;
  fixImageUrl: (url: string | null | undefined) => string;
  galleryView: { kind: string; images?: any[] };
  microSiblingsByUrl: Record<string, any[]>;
  setLightboxImages: (images: { name: string; url: string }[]) => void;
  setLightboxIndex: (index: number | null) => void;
  closeMenu: () => void;
}

export default function GalleryPanel({
  galleryTitle,
  showGalleryLegend,
  setShowGalleryLegend,
  setShowAdminLegend,
  setShowReportLegendModal,
  galleryImages,
  companyEnabled,
  galleryCalibrableByUrl,
  galleryCalibratedByUrl,
  calibratingByUrl,
  failedCalibrationByUrl,
  calibrationData,
  microMaterialHasModelByUrl,
  measureEventsById,
  fixImageUrl,
  galleryView,
  microSiblingsByUrl,
  setLightboxImages,
  setLightboxIndex,
  closeMenu
}: GalleryPanelProps) {
  const { apiMicrografias } = useDataStore();

  return (
    <div
      className="island"
      style={{
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        height: "100%",
        minWidth: 0,
      }}
      onClick={closeMenu}
    >
      <div
        className="px-4 py-2.5 border-b border-[#10243f1a] flex justify-between items-center"
        style={{ flexShrink: 0, position: "relative" }}
      >
        <div className="flex items-center gap-2">
          <h3 className="text-base font-bold text-[#10243f] m-0">
            {galleryTitle}
          </h3>
          <button
            data-legend-trigger
            onClick={(e) => {
              e.stopPropagation();
              setShowGalleryLegend((prev) => !prev);
              setShowAdminLegend(false);
              setShowReportLegendModal(false);
            }}
            className="flex items-center justify-center w-7 h-7 rounded-lg bg-transparent border-none text-[#339eea] cursor-pointer transition-all hover:bg-[#eef8ff] hover:-translate-y-0.5"
            title="Leyenda de íconos"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
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
          </button>
        </div>
        <span className="text-[10px] font-bold bg-[#dff1ff] text-[#339eea] py-1 px-2.5 rounded-full">
          {galleryImages.length} imágenes
        </span>
        {showGalleryLegend && (
          <div
            data-legend-dropdown
            style={{
              position: "absolute",
              top: "100%",
              left: 0,
              right: 0,
              zIndex: 50,
              marginTop: 4,
              background: "white",
              borderRadius: 12,
              boxShadow: "0 8px 32px rgba(16,36,63,0.18)",
              border: "1px solid rgba(16,36,63,0.1)",
              overflow: "hidden",
              animation: "dropdownFadeIn 0.18s ease-out",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-3 border-b border-gray-100 flex justify-between items-center bg-[#f8fbff]">
              <h3 className="m-0 text-[#10243f] text-sm font-bold">
                Leyenda Galería
              </h3>
              <button
                onClick={() => setShowGalleryLegend(false)}
                className="text-gray-400 hover:text-gray-600 bg-transparent border-none cursor-pointer"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            <div className="p-4 max-h-[50vh] overflow-y-auto">
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                }}
              >
                {ENABLE_AUTOCALIBRATION && (
                  <>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                      }}
                    >
                      <div
                        style={{
                          background: "rgba(22, 163, 74, 0.92)",
                          color: "white",
                          fontSize: "0.66rem",
                          fontWeight: 700,
                          padding: "3px 8px",
                          borderRadius: 999,
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="11"
                          height="11"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>{" "}
                        IA
                      </div>
                      <span style={{ fontSize: "0.9rem", color: "#4d6684" }}>
                        Autocalibración exitosa
                      </span>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                      }}
                    >
                      <div
                        style={{
                          background: "rgba(232, 163, 23, 0.92)",
                          color: "white",
                          fontSize: "0.66rem",
                          fontWeight: 700,
                          padding: "3px 8px",
                          borderRadius: 999,
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
                        <div
                          style={{
                            width: 6,
                            height: 6,
                            borderRadius: "50%",
                            background: "white",
                          }}
                        />{" "}
                        IA
                      </div>
                      <span style={{ fontSize: "0.9rem", color: "#4d6684" }}>
                        Autocalibrando (o en cola)
                      </span>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                      }}
                    >
                      <div
                        style={{
                          background: "rgba(220, 38, 38, 0.92)",
                          color: "white",
                          fontSize: "0.66rem",
                          fontWeight: 700,
                          padding: "3px 8px",
                          borderRadius: 999,
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="11"
                          height="11"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <circle cx="12" cy="12" r="10"></circle>
                          <line x1="12" y1="8" x2="12" y2="12"></line>
                          <line x1="12" y1="16" x2="12.01" y2="16"></line>
                        </svg>{" "}
                        IA
                      </div>
                      <span style={{ fontSize: "0.9rem", color: "#4d6684" }}>
                        Error en autocalibración
                      </span>
                    </div>
                  </>
                )}
                <div
                  style={{ display: "flex", alignItems: "center", gap: "12px" }}
                >
                  <div
                    style={{
                      background: "rgba(22, 163, 74, 0.92)",
                      color: "white",
                      fontSize: "0.66rem",
                      fontWeight: 700,
                      padding: "3px 8px",
                      borderRadius: 999,
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="11"
                      height="11"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>{" "}
                    CM
                  </div>
                  <span style={{ fontSize: "0.9rem", color: "#4d6684" }}>
                    Calibración Manual exitosa
                  </span>
                </div>
                <div
                  style={{ display: "flex", alignItems: "center", gap: "12px" }}
                >
                  <div
                    style={{
                      background: "rgba(22, 163, 74, 0.92)",
                      color: "white",
                      fontSize: "0.66rem",
                      fontWeight: 700,
                      padding: "3px 8px",
                      borderRadius: 999,
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="11"
                      height="11"
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
                  </div>
                  <span style={{ fontSize: "0.9rem", color: "#4d6684" }}>
                    Gráfico de medición disponible
                  </span>
                </div>
                <div
                  style={{ display: "flex", alignItems: "center", gap: "12px" }}
                >
                  <div
                    style={{
                      background: "rgba(232, 163, 23, 0.92)",
                      color: "white",
                      fontSize: "0.66rem",
                      fontWeight: 700,
                      padding: "3px 8px",
                      borderRadius: 999,
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="11"
                      height="11"
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
                  </div>
                  <span style={{ fontSize: "0.9rem", color: "#4d6684" }}>
                    Procesando gráfico...
                  </span>
                </div>
                <div
                  style={{ display: "flex", alignItems: "center", gap: "12px" }}
                >
                  <div
                    style={{
                      background: "rgba(220, 38, 38, 0.92)",
                      color: "white",
                      fontSize: "0.66rem",
                      fontWeight: 700,
                      padding: "3px 8px",
                      borderRadius: 999,
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="11"
                      height="11"
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
                  </div>
                  <span style={{ fontSize: "0.9rem", color: "#4d6684" }}>
                    Fallo al generar gráfico
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      <div style={{ flex: 1, minHeight: 0, position: "relative" }}>
        <div
          style={{
            position: "absolute",
            inset: 0,
            padding: 16,
            overflowY: "auto",
            overflowX: "hidden",
          }}
          className="custom-scrollbar"
        >
          <ResponsiveGallery
            companyEnabled={companyEnabled}
            images={galleryImages}
            calibrableByUrl={galleryCalibrableByUrl}
            calibratedByUrl={galleryCalibratedByUrl}
            calibratingByUrl={calibratingByUrl}
            failedCalibrationByUrl={failedCalibrationByUrl}
            calibrationData={calibrationData}
            microMaterialHasModelByUrl={microMaterialHasModelByUrl}
            highlightedByUrl={{} as Record<string, boolean>}
            apiMicrografias={apiMicrografias}
            measureEventsById={measureEventsById}
            fixImageUrl={fixImageUrl}
            onImageClick={(img: any) => {
              const isSingleMicroFromTree =
                galleryView.kind === "micrografias" &&
                (galleryView.images?.length || 0) === 1;
              const nextLightboxImages = isSingleMicroFromTree
                ? microSiblingsByUrl[img.url] || galleryImages
                : galleryImages;
              const idx = nextLightboxImages.findIndex(
                (g: any) => g.url === img.url
              );
              if (idx !== -1) {
                setLightboxImages(nextLightboxImages);
                setLightboxIndex(idx);
              }
            }}
          />
        </div>
      </div>
    </div>
  );
}
