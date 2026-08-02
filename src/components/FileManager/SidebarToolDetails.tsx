import React from "react";
import { MaskLegend } from "../MaskLegend";
import { StoredMeasurement } from "../../types";
import * as api from "../../services/api";

interface SidebarToolDetailsProps {
  activeSidebarTool: string | null;
  toolDescription: string;
  isDrawingToolActive: boolean;
  drawingToolLabel: string;
  measurementEnabled: boolean;
  calibrationRatio: number | null;
  currentCalibration: any;
  measurementDistanceUm: number | null;
  measurementPx: number;
  measurements: StoredMeasurement[];
  setMeasurements: React.Dispatch<React.SetStateAction<StoredMeasurement[]>>;
  selectedMeasurementId: string | null;
  setSelectedMeasurementId: (id: string | null) => void;
  calibrationStateLabel: string;
  currentImage: { url: string; [key: string]: any };
  isMaskVisible: boolean;
  isMaskLoading: boolean;
  inclusionsVisibleByImageUrl?: Record<string, boolean>;
  inclusionsLoadingByImageUrl?: Record<string, boolean>;
  inclusionsByImageUrl?: Record<string, api.InclusionPolygon[]>;
  inclusionsThreshold: number;
  maskLegendEntries: any[];
  currentMaskUrl: string | null;
}

export function SidebarToolDetails({
  activeSidebarTool,
  toolDescription,
  isDrawingToolActive,
  drawingToolLabel,
  measurementEnabled,
  calibrationRatio,
  currentCalibration,
  measurementDistanceUm,
  measurementPx,
  measurements,
  setMeasurements,
  selectedMeasurementId,
  setSelectedMeasurementId,
  calibrationStateLabel,
  currentImage,
  isMaskVisible,
  isMaskLoading,
  inclusionsVisibleByImageUrl,
  inclusionsLoadingByImageUrl,
  inclusionsByImageUrl,
  inclusionsThreshold,
  maskLegendEntries,
  currentMaskUrl
}: SidebarToolDetailsProps) {
  return (
    <div
      style={{
        flex: "1 1 auto",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        gap: 12,
        padding: "8px 10px",
        color: "white",
        textAlign: "left",
        overflow: "auto",
      }}
    >
      {activeSidebarTool === "overview" ? (
        <div
          style={{
            fontSize: "0.84rem",
            lineHeight: 1.5,
            fontWeight: 500,
            opacity: 0.7,
          }}
        >
          Selecciona una de las herramientas de la barra lateral izquierda
          para ver más información aquí.
        </div>
      ) : (
        <>
          <div
            style={{
              fontSize: "0.84rem",
              lineHeight: 1.45,
              fontWeight: 500,
            }}
          >
            {toolDescription}
          </div>

          {isDrawingToolActive && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 6,
                fontSize: "0.82rem",
                lineHeight: 1.35,
                fontWeight: 600,
              }}
            >
              <span>Herramienta: {drawingToolLabel}</span>
              <span>
                Dibujos: visibles mientras la herramienta esta activa
              </span>
            </div>
          )}

          {activeSidebarTool === "measurement" && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 6,
                fontSize: "0.82rem",
                lineHeight: 1.35,
                fontWeight: 600,
                alignItems: "center",
                textAlign: "center",
              }}
            >
              {measurementEnabled ? (
                <>
                  <span>
                    Calibración: {calibrationRatio?.toFixed(4)} µm/px
                  </span>
                  {currentCalibration?.pixelLength > 0 && currentCalibration?.micrometers > 0 && (
                    <span>
                      Medida base: {currentCalibration.micrometers} µm en {currentCalibration.pixelLength.toFixed(1)} px
                    </span>
                  )}
                  {measurementDistanceUm ? (
                    <span>
                      Medición actual: {measurementDistanceUm.toFixed(2)} µm
                      ({measurementPx.toFixed(1)} px)
                    </span>
                  ) : (
                    <span>Arrastra sobre la imagen para medir.</span>
                  )}
                  {/* Stored measurements list */}
                  {measurements.length > 0 && (
                    <div style={{ width: "50%", marginTop: 8, borderTop: "1px solid rgba(255,255,255,0.15)", paddingTop: 8 }}>
                      <div style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.5)", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                        Mediciones ({measurements.length})
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 3, maxHeight: 180, overflowY: "auto" }}>
                        {measurements.map((m, i) => (
                          <div
                            key={m.id}
                            onClick={() => setSelectedMeasurementId(m.id === selectedMeasurementId ? null : m.id)}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 6,
                              padding: "4px 6px",
                              borderRadius: 6,
                              background: m.id === selectedMeasurementId ? "rgba(51,158,234,0.3)" : "rgba(255,255,255,0.06)",
                              cursor: "pointer",
                              transition: "background 0.15s",
                              fontSize: "0.75rem",
                              textAlign: "left",
                            }}
                          >
                            <div style={{ width: 10, height: 10, borderRadius: "50%", background: m.color, flexShrink: 0 }} />
                            <span style={{ flex: 1, color: "white" }}>
                              #{i + 1}: {m.distanceUm != null ? `${m.distanceUm.toFixed(2)} µm` : `${m.distancePx.toFixed(1)} px`}
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setMeasurements(prev => prev.filter(x => x.id !== m.id));
                                if (selectedMeasurementId === m.id) setSelectedMeasurementId(null);
                              }}
                              style={{
                                background: "none",
                                border: "none",
                                color: "rgba(255,255,255,0.4)",
                                cursor: "pointer",
                                padding: 2,
                                lineHeight: 0,
                                transition: "color 0.15s",
                              }}
                              onMouseOver={(e) => { e.currentTarget.style.color = "#ff6666"; }}
                              onMouseOut={(e) => { e.currentTarget.style.color = "rgba(255,255,255,0.4)"; }}
                              title="Eliminar medición"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                            </button>
                          </div>
                        ))}
                      </div>
                      {measurements.length > 1 && (
                        <button
                          onClick={() => { setMeasurements([]); setSelectedMeasurementId(null); }}
                          style={{
                            marginTop: 6,
                            background: "rgba(255,100,100,0.15)",
                            border: "1px solid rgba(255,100,100,0.3)",
                            color: "#ff9999",
                            borderRadius: 6,
                            padding: "4px 8px",
                            fontSize: "0.72rem",
                            fontWeight: 600,
                            cursor: "pointer",
                            width: "100%",
                            transition: "background 0.15s",
                          }}
                          onMouseOver={(e) => { e.currentTarget.style.background = "rgba(255,100,100,0.25)"; }}
                          onMouseOut={(e) => { e.currentTarget.style.background = "rgba(255,100,100,0.15)"; }}
                        >
                          Borrar todas
                        </button>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <span>
                  Primero calibrá la micrografía para habilitar la medición.
                </span>
              )}
            </div>
          )}

          {activeSidebarTool === "calibration" && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 6,
                fontSize: "0.82rem",
                lineHeight: 1.35,
                fontWeight: 600,
              }}
            >
              <span>Estado: {calibrationStateLabel}</span>
              {calibrationRatio && (
                <>
                  <span>
                    Calibración: {calibrationRatio.toFixed(4)} µm/px
                  </span>
                  {currentCalibration.pixelLength > 0 &&
                    currentCalibration.micrometers > 0 && (
                      <span>
                        {currentCalibration.pixelLength} px ={" "}
                        {currentCalibration.micrometers} µm
                      </span>
                    )}
                </>
              )}
            </div>
          )}

          {(activeSidebarTool === "mask" && !isDrawingToolActive && (isMaskVisible || isMaskLoading || inclusionsVisibleByImageUrl?.[currentImage?.url] || inclusionsLoadingByImageUrl?.[currentImage?.url])) && (() => {
              const currentInclusions = inclusionsByImageUrl?.[currentImage?.url] || [];
              const hasVisibleInclusions = currentInclusions.some(poly => poly.confidence >= inclusionsThreshold);
              const showInclusions = inclusionsVisibleByImageUrl?.[currentImage?.url];
              const loadInclusions = inclusionsLoadingByImageUrl?.[currentImage?.url];

              return (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                    width: "100%",
                  }}
                >
                  {(isMaskVisible || isMaskLoading) && (
                    <MaskLegend 
                      maskLegendEntries={maskLegendEntries} 
                      isMaskLoading={isMaskLoading} 
                      currentMaskUrl={currentMaskUrl ?? ""} 
                      isMaskVisible={isMaskVisible} 
                    />
                  )}
                  
                  {(showInclusions || loadInclusions) && (
                    <>
                      <div style={{ height: 1, background: "rgba(255,255,255,0.1)", margin: "4px 0" }} />
                      <span style={{ fontSize: "0.82rem", fontWeight: 600 }}>
                        {loadInclusions
                          ? "Inclusiones: buscando..."
                          : showInclusions
                            ? "Inclusiones: visibles"
                            : "Inclusiones: ocultas"}
                      </span>
                      {hasVisibleInclusions && showInclusions && (
                        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.82rem", fontWeight: 600, lineHeight: 1.25 }}>
                          <span style={{ width: 12, height: 12, borderRadius: 999, border: "1px solid rgba(255,255,255,0.48)", background: "rgb(255, 0, 255)", flexShrink: 0 }} />
                          <span>Inclusiones</span>
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            })()}
        </>
      )}
    </div>
  );
}
