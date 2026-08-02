import React from "react";
import { useAppStore } from "../../store/useAppStore";
import { FolderIcon, ImageFileIcon, MaterialIcon, MuestraIcon, RegionIcon, TrashIcon, EditIcon, PlusIcon, CheckIcon, AlertIcon, ChartIcon, ChevronDown, ChevronRight } from "./Icons";
import { normalizeId, ENABLE_AUTOCALIBRATION } from "../../utils/helpers";

interface ItemRowProps {
  id: string;
  name: string;
  type: string;
  isOpen?: boolean;
  isCalibrated?: boolean;
  isCalibrating?: boolean;
  isFailed?: boolean;
  isAi?: boolean;
  hasModel?: boolean;
  isChartProcessed?: boolean;
  isChartProcessing?: boolean;
  isChartFailed?: boolean;
  isSelected?: boolean;
  isFolder?: boolean;
  onClick: () => void;
  onGeneratePdf?: () => void;
}

export const ItemRow = ({
  id,
  name,
  type,
  isOpen,
  isCalibrated = false,
  isCalibrating = false,
  isFailed = false,
  isAi = false,
  hasModel = true,
  isChartProcessed = false,
  isChartProcessing = false,
  isChartFailed = false,
  isSelected = false,
  isFolder,
  onClick,
  onGeneratePdf,
}: ItemRowProps) => {
  const { setCreateModal, setRenameModal, setRenameModalError, setDeleteModal, companyEnabled } = useAppStore();
  const apiId = (id: string) => (normalizeId(id) || "").replace(/^(mat|mue|reg|mic)_/, "");
  const _isFolder = isFolder !== undefined ? isFolder : type !== "micrografia";

  const addLabel =
    type === "material"
      ? "Añadir muestra"
      : type === "muestra"
        ? "Añadir región"
        : type === "region"
          ? "Añadir micrografía"
          : "Añadir";
  const addType =
    type === "material"
      ? "muestra"
      : type === "muestra"
        ? "region"
        : "micrografia";
  
  const showRenameButton = type !== "material";
  const showDeleteButton = type !== "material";

  return (
    <div
      className={`flex items-center justify-between px-3 py-2 cursor-pointer select-none transition-all text-sm ${isSelected ? "bg-[#dff1ff]" : "hover:bg-[#f0f7ff]"}`}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      style={{
        paddingLeft: 10,
        paddingRight: 12,
      }}
    >
      <div className="flex items-center gap-1.5 overflow-hidden flex-1 min-w-0">
        {_isFolder && (
          <span className="flex-shrink-0 w-3.5 h-3.5 flex items-center justify-center text-[#4d6684]">
            {isOpen ? <ChevronDown /> : <ChevronRight />}
          </span>
        )}
        <span className="flex-shrink-0">
          {type === "material" ? <MaterialIcon /> : type === "muestra" ? <MuestraIcon /> : type === "region" ? <RegionIcon /> : <ImageFileIcon />}
        </span>
        <span
          className="truncate font-semibold"
          style={{ color: isSelected ? "#339eea" : "#10243f" }}
          title={name}
        >
          {name}
        </span>
      </div>
      <div className="flex-shrink-0 ml-2 flex items-center gap-1.5">
        {type === "micrografia" && companyEnabled !== false && (!ENABLE_AUTOCALIBRATION ? isCalibrated : (hasModel || isCalibrated)) && (
          <span
            title={
              isCalibrated
                ? "Calibrada"
                : isCalibrating
                  ? "Autocalibrando..."
                  : isFailed
                    ? "Fallo IA"
                    : "Sin calibrar"
            }
            style={{
              display: "inline-flex",
              alignItems: "center",
              flexShrink: 0,
            }}
          >
            {isCalibrated ? (
              (isAi && ENABLE_AUTOCALIBRATION) ? (
                <span style={{ fontSize: "0.6rem", fontWeight: 800, padding: "0 4px", height: "18px", boxSizing: "border-box", lineHeight: 1, borderRadius: 4, background: "rgba(22,163,74,0.15)", border: "1px solid #16a34a", color: "#16a34a", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>IA</span>
              ) : (
                <span style={{ color: "#16a34a", display: "inline-flex", alignItems: "center", height: "18px", boxSizing: "border-box" }}><CheckIcon /></span>
              )
            ) : ENABLE_AUTOCALIBRATION && (isCalibrating ? (
              <span style={{ fontSize: "0.6rem", fontWeight: 800, padding: "0 4px", height: "18px", boxSizing: "border-box", lineHeight: 1, borderRadius: 4, background: "rgba(232,163,23,0.15)", border: "1px solid #e8a317", color: "#e8a317", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>IA</span>
            ) : isFailed ? (
              <span style={{ fontSize: "0.6rem", fontWeight: 800, padding: "0 4px", height: "18px", boxSizing: "border-box", lineHeight: 1, borderRadius: 4, background: "rgba(248,113,113,0.15)", border: "1px solid #f87171", color: "#f87171", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>IA</span>
            ) : (
              <span style={{ fontSize: "0.6rem", fontWeight: 800, padding: "0 4px", height: "18px", boxSizing: "border-box", lineHeight: 1, borderRadius: 4, background: "rgba(232,163,23,0.15)", border: "1px solid #e8a317", color: "#e8a317", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>IA</span>
            ))}
          </span>
        )}
        {type === "micrografia" && companyEnabled !== false && hasModel && (
          <span
            title={
              isChartProcessed
                ? "Gráfico de medición disponible"
                : isChartProcessing
                  ? "Procesando gráfico..."
                  : isChartFailed
                    ? "Fallo al generar gráfico"
                    : "Procesando gráfico..."
            }
            style={{
              display: "inline-flex",
              alignItems: "center",
              flexShrink: 0,
            }}
          >
            {isChartProcessed ? (
                <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", padding: "0 4px", height: "18px", boxSizing: "border-box", borderRadius: 4, background: "rgba(22,163,74,0.15)", border: "1px solid #16a34a", color: "#16a34a" }}><ChartIcon size={12}/></span>
            ) : isChartFailed ? (
                <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", padding: "0 4px", height: "18px", boxSizing: "border-box", borderRadius: 4, background: "rgba(248,113,113,0.15)", border: "1px solid #f87171", color: "#f87171" }}><ChartIcon size={12}/></span>
            ) : (
                <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", padding: "0 4px", height: "18px", boxSizing: "border-box", borderRadius: 4, background: "rgba(232,163,23,0.15)", border: "1px solid #e8a317", color: "#e8a317" }}><ChartIcon size={12}/></span>
            )}
          </span>
        )}
        {type !== "micrografia" && (
          <button
            title={addLabel}
            className="h-6 w-6 rounded-md border border-[#16a34a33] bg-[#ecfdf3] text-[#16a34a] hover:bg-[#dcfce8] transition flex items-center justify-center"
            onClick={(e) => {
              e.stopPropagation();
              setCreateModal({
                parentId: apiId(id),
                type: addType,
              });
            }}
          >
            <PlusIcon />
          </button>
        )}
        {showRenameButton && (
          <button
            title="Renombrar"
            className="h-6 w-6 rounded-md border border-[#0d5a9133] bg-[#eef8ff] text-[#0d5a91] hover:bg-[#dff1ff] transition flex items-center justify-center"
            onClick={(e) => {
              e.stopPropagation();
              setRenameModal({ id, name, type });
              setRenameModalError(null);
            }}
          >
            <EditIcon />
          </button>
        )}
        {showDeleteButton && (
          <button
            title="Eliminar"
            className="h-6 w-6 rounded-md border border-[#e53e3e33] bg-[#fff5f5] text-[#e53e3e] hover:bg-[#fee2e2] transition flex items-center justify-center"
            onClick={(e) => {
              e.stopPropagation();
              setDeleteModal({ id, name, type });
            }}
          >
            <TrashIcon />
          </button>
        )}
        {type === "muestra" && onGeneratePdf && (
          <button
            title="Generar informe"
            className="h-6 w-6 rounded-md border border-[#8b5cf633] bg-[#f5f3ff] text-[#8b5cf6] hover:bg-[#ede9fe] transition flex items-center justify-center"
            onClick={(e) => {
              e.stopPropagation();
              onGeneratePdf();
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
          </button>
        )}
      </div>
    </div>
  );
};
