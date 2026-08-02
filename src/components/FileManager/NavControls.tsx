import React from "react";
import { useCanvasStore } from "../../store/useCanvasStore";
import { ArrowLeftIcon, ArrowRightIcon, CloseIcon } from "./Icons";

interface NavControlsProps {
  isNavMenuOpen: boolean;
  setIsNavMenuOpen: (val: boolean) => void;
  setIsPencilMenuOpen: (val: boolean) => void;
  activeSidebarTool: string | null;
  setActiveSidebarTool: (val: any) => void;
  hasSiblingImages: boolean;
  images: { name: string; url: string; id?: string }[];
  setCurrentIndex: React.Dispatch<React.SetStateAction<number>>;
  onClose: () => void;
}

export function NavControls({
  isNavMenuOpen,
  setIsNavMenuOpen,
  setIsPencilMenuOpen,
  activeSidebarTool,
  setActiveSidebarTool,
  hasSiblingImages,
  images,
  setCurrentIndex,
  onClose
}: NavControlsProps) {
  const { setMaskEditTool } = useCanvasStore();

  return (
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
        height: isNavMenuOpen ? 218 : 62,
        transition: "height 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
      }}
    >
      {/* Nav Head */}
      <button
        title="Navegación"
        onClick={() => {
          const next = !isNavMenuOpen;
          setIsNavMenuOpen(next);
          if (next) {
            setIsPencilMenuOpen(false);
            setMaskEditTool(null);
            if (activeSidebarTool === "mask") {
              setActiveSidebarTool("overview");
            }
          }
        }}
        style={{
          width: 44,
          height: 44,
          flexShrink: 0,
          borderRadius: "50%",
          border: "none",
          background: isNavMenuOpen ? "rgba(51,158,234,0.88)" : "transparent",
          color: "white",
          fontWeight: 700,
          fontSize: 14,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "background 0.15s, color 0.15s",
        }}
        onMouseOver={(e) => {
          if (!isNavMenuOpen) e.currentTarget.style.background = "rgba(51,158,234,0.78)";
        }}
        onMouseOut={(e) => {
          if (!isNavMenuOpen) e.currentTarget.style.background = "transparent";
        }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="34" height="26" viewBox="0 0 36 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="9 18 3 12 9 6" />
          <line x1="15" y1="9" x2="21" y2="15" />
          <line x1="21" y1="9" x2="15" y2="15" />
          <polyline points="27 6 33 12 27 18" />
        </svg>
      </button>

      {/* Nav Controls */}
      <div style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 8,
        opacity: isNavMenuOpen ? 1 : 0,
        pointerEvents: isNavMenuOpen ? "auto" : "none",
        transition: "opacity 0.3s",
      }}>
        <button
          type="button"
          title={hasSiblingImages ? "Imagen anterior" : "Sin micrografías hermanas"}
          style={{
            width: 44, height: 44, borderRadius: "50%", border: "none",
            background: "rgba(0,0,0,0.56)", color: "white", cursor: hasSiblingImages ? "pointer" : "default",
            lineHeight: 0, display: "inline-flex", alignItems: "center", justifyContent: "center",
            transition: "background 0.15s", opacity: hasSiblingImages ? 1 : 0.55,
          }}
          onMouseDown={(e) => { if (hasSiblingImages) e.currentTarget.style.background = "rgba(51,158,234,0.88)"; }}
          onMouseUp={(e) => { if (hasSiblingImages) e.currentTarget.style.background = "rgba(51,158,234,0.78)"; }}
          onClick={(e) => {
            e.stopPropagation();
            if (!hasSiblingImages) return;
            setCurrentIndex((p) => (p > 0 ? p - 1 : images.length - 1));
          }}
          onMouseOver={(e) => {
            if (!hasSiblingImages) return;
            e.currentTarget.style.background = "rgba(51,158,234,0.78)";
          }}
          onMouseOut={(e) => {
            if (!hasSiblingImages) return;
            e.currentTarget.style.background = "rgba(0,0,0,0.56)";
          }}
        >
          <ArrowLeftIcon />
        </button>

        <button
          type="button"
          title={hasSiblingImages ? "Imagen siguiente" : "Sin micrografías hermanas"}
          style={{
            width: 44, height: 44, borderRadius: "50%", border: "none",
            background: "rgba(0,0,0,0.56)", color: "white", cursor: hasSiblingImages ? "pointer" : "default",
            lineHeight: 0, display: "inline-flex", alignItems: "center", justifyContent: "center",
            transition: "background 0.15s", opacity: hasSiblingImages ? 1 : 0.55,
          }}
          onMouseDown={(e) => { if (hasSiblingImages) e.currentTarget.style.background = "rgba(51,158,234,0.88)"; }}
          onMouseUp={(e) => { if (hasSiblingImages) e.currentTarget.style.background = "rgba(51,158,234,0.78)"; }}
          onClick={(e) => {
            e.stopPropagation();
            if (!hasSiblingImages) return;
            setCurrentIndex((p) => (p < images.length - 1 ? p + 1 : 0));
          }}
          onMouseOver={(e) => {
            if (!hasSiblingImages) return;
            e.currentTarget.style.background = "rgba(51,158,234,0.78)";
          }}
          onMouseOut={(e) => {
            if (!hasSiblingImages) return;
            e.currentTarget.style.background = "rgba(0,0,0,0.56)";
          }}
        >
          <ArrowRightIcon />
        </button>
        <button
          title="Cerrar"
          style={{
            width: 44, height: 44, borderRadius: "50%", border: "none",
            background: "rgba(0,0,0,0.56)", color: "white", cursor: "pointer",
            lineHeight: 0, display: "inline-flex", alignItems: "center", justifyContent: "center",
            transition: "background 0.15s",
          }}
          onClick={onClose}
          onMouseOver={(e) => (e.currentTarget.style.background = "rgba(255,0,0,1)")}
          onMouseOut={(e) => (e.currentTarget.style.background = "rgba(0,0,0,0.56)")}
        >
          <CloseIcon />
        </button>
      </div>
    </div>
  );
}
