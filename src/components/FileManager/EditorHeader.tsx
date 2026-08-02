import React from "react";
import { ENABLE_AUTOCALIBRATION } from "../../utils/calibration";

interface EditorHeaderProps {
  aiSuccess: boolean;
  aiProcessing: boolean;
  aiError: boolean;
  calibrationMode: boolean;
  hasCalibration: boolean;
  toolTitle: string;
  currentImage: { name: string; url: string; id?: string };
  contextInfo: {
    materialName?: string;
    muestraName?: string;
    regionName?: string;
  };
}

export function EditorHeader({
  aiSuccess,
  aiProcessing,
  aiError,
  calibrationMode,
  hasCalibration,
  toolTitle,
  currentImage,
  contextInfo
}: EditorHeaderProps) {
  return (
    <div
      style={{
        flex: "0 0 25%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-start",
        gap: 6,
        padding: "8px 10px",
        color: "white",
        textAlign: "left",
      }}
    >
      {aiSuccess && !calibrationMode && ENABLE_AUTOCALIBRATION && (
        <div
          style={{
            marginBottom: 16,
            padding: "10px 12px",
            borderRadius: "10px",
            background: "rgba(74, 222, 128, 0.15)",
            border: "1px solid #4ade80",
            boxShadow: "0 0 12px rgba(74, 222, 128, 0.3)",
            display: "flex",
            flexDirection: "column",
            gap: 4,
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: "0.72rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", color: "#4ade80" }}>
            Autocalibración con Inteligencia Artificial
          </div>
          <div style={{ fontSize: "0.88rem", fontWeight: 600, color: "white" }}>
            Autocalibración exitosa
          </div>
        </div>
      )}
      {aiProcessing && !calibrationMode && ENABLE_AUTOCALIBRATION && (
        <div
          className="ai-shimmer-bg"
          style={{
            marginBottom: 16,
            padding: "10px 12px",
            borderRadius: "10px",
            background: "linear-gradient(90deg, rgba(232, 163, 23, 0.1) 0%, rgba(232, 163, 23, 0.4) 50%, rgba(232, 163, 23, 0.1) 100%)",
            border: "1px solid #e8a317",
            boxShadow: "0 0 12px rgba(232, 163, 23, 0.3)",
            display: "flex",
            flexDirection: "column",
            gap: 4,
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: "0.72rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", color: "#e8a317" }}>
            Autocalibración con Inteligencia Artificial
          </div>
          <div
            className="ai-shimmer-text"
            style={{ background: "linear-gradient(90deg, #e8a317 0%, #fff 50%, #e8a317 100%)", fontSize: "0.88rem", fontWeight: 600 } as React.CSSProperties}
          >
            Autocalibrando...
          </div>
        </div>
      )}
      {aiError && !hasCalibration && !calibrationMode && ENABLE_AUTOCALIBRATION && (
        <div
          style={{
            marginBottom: 16,
            padding: "10px 12px",
            borderRadius: "10px",
            background: "rgba(248, 113, 113, 0.15)",
            border: "1px solid #f87171",
            boxShadow: "0 0 12px rgba(248, 113, 113, 0.3)",
            display: "flex",
            flexDirection: "column",
            gap: 4,
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: "0.72rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", color: "#f87171" }}>
            Autocalibración con Inteligencia Artificial
          </div>
          <div style={{ fontSize: "0.88rem", fontWeight: 600, color: "white" }}>
            Error al autocalibrar. Calibrar manualmente
          </div>
        </div>
      )}
      <div
        style={{
          fontSize: "0.76rem",
          letterSpacing: "0.09em",
          textTransform: "uppercase",
          fontWeight: 700,
          color: "#99d1ff",
        }}
      >
        {toolTitle}
      </div>
      <div
        style={{
          fontSize: "0.92rem",
          fontWeight: 700,
          lineHeight: 1.3,
          textShadow: "0 2px 8px rgba(0,0,0,0.5)",
        }}
      >
        {currentImage.name}
      </div>
      {(contextInfo.regionName ||
        contextInfo.muestraName ||
        contextInfo.materialName) && (
        <div
          style={{
            fontSize: "0.78rem",
            fontWeight: 500,
            lineHeight: 1.4,
            opacity: 0.8,
            display: "flex",
            flexDirection: "column",
            gap: 1,
          }}
        >
          {contextInfo.regionName && <span>{contextInfo.regionName}</span>}
          {contextInfo.muestraName && (
            <span>{contextInfo.muestraName}</span>
          )}
          {contextInfo.materialName && (
            <span>{contextInfo.materialName}</span>
          )}
        </div>
      )}
    </div>
  );
}
