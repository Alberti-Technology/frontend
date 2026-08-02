import React from "react";
import { useCanvasStore } from "../../store/useCanvasStore";

interface ZoomControlsProps {
  isZoomMenuOpen: boolean;
  setIsZoomMenuOpen: (val: boolean) => void;
  setIsPencilMenuOpen: (val: boolean) => void;
  activeSidebarTool: string | null;
  setActiveSidebarTool: any;
  startContinuousZoom: (direction: "in" | "out") => void;
  stopContinuousZoom: () => void;
  resetZoom: () => void;
}

export function ZoomControls({
  isZoomMenuOpen,
  setIsZoomMenuOpen,
  setIsPencilMenuOpen,
  activeSidebarTool,
  setActiveSidebarTool,
  startContinuousZoom,
  stopContinuousZoom,
  resetZoom
}: ZoomControlsProps) {
  const { setMaskEditTool, zoomScale } = useCanvasStore();

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
        height: isZoomMenuOpen ? 200 : 62,
        transition: "height 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
      }}
    >
      {/* Zoom Head */}
      <button
        title="Zoom"
        onClick={() => {
          const next = !isZoomMenuOpen;
          setIsZoomMenuOpen(next);
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
          background: isZoomMenuOpen ? "rgba(51,158,234,0.88)" : "transparent",
          color: "white",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "background 0.15s, color 0.15s",
        }}
        onMouseOver={(e) => {
          if (!isZoomMenuOpen) e.currentTarget.style.background = "rgba(51,158,234,0.78)";
        }}
        onMouseOut={(e) => {
          if (!isZoomMenuOpen) e.currentTarget.style.background = "transparent";
        }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
      </button>

      {/* Zoom Controls */}
      <div style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 8,
        opacity: isZoomMenuOpen ? 1 : 0,
        pointerEvents: isZoomMenuOpen ? "auto" : "none",
        transition: "opacity 0.3s",
      }}>
        <button
          type="button"
          title="Acercar (Zoom In)"
          onMouseDown={(e) => { e.stopPropagation(); startContinuousZoom("in"); e.currentTarget.style.background = "rgba(51,158,234,0.88)"; }}
          onMouseUp={(e) => { e.stopPropagation(); stopContinuousZoom(); e.currentTarget.style.background = "rgba(51,158,234,0.78)"; }}
          onMouseLeave={(e) => { stopContinuousZoom(); e.currentTarget.style.background = "rgba(0,0,0,0.56)"; }}
          onTouchStart={(e) => { e.stopPropagation(); startContinuousZoom("in"); e.currentTarget.style.background = "rgba(51,158,234,0.88)"; }}
          onTouchEnd={(e) => { e.stopPropagation(); stopContinuousZoom(); e.currentTarget.style.background = "rgba(51,158,234,0.78)"; }}
          style={{
            width: 44, height: 44, borderRadius: "50%", border: "none",
            background: "rgba(0,0,0,0.56)", color: "white", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            transition: "background 0.15s",
          }}
          onMouseOver={(e) => { e.currentTarget.style.background = "rgba(51,158,234,0.78)"; }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
        </button>
        
        <div 
          title="Restablecer Zoom"
          onClick={(e) => { e.stopPropagation(); resetZoom(); }}
          style={{ 
            fontSize: "0.6rem", fontWeight: 700, color: "white", cursor: "pointer", 
            padding: "4px", background: "rgba(255,255,255,0.1)", borderRadius: 4 
          }}
        >
          {Math.round(zoomScale * 100)}%
        </div>

        <button
          type="button"
          title="Alejar (Zoom Out)"
          onMouseDown={(e) => { e.stopPropagation(); startContinuousZoom("out"); e.currentTarget.style.background = "rgba(51,158,234,0.88)"; }}
          onMouseUp={(e) => { e.stopPropagation(); stopContinuousZoom(); e.currentTarget.style.background = "rgba(51,158,234,0.78)"; }}
          onMouseLeave={(e) => { stopContinuousZoom(); e.currentTarget.style.background = "rgba(0,0,0,0.56)"; }}
          onTouchStart={(e) => { e.stopPropagation(); startContinuousZoom("out"); e.currentTarget.style.background = "rgba(51,158,234,0.88)"; }}
          onTouchEnd={(e) => { e.stopPropagation(); stopContinuousZoom(); e.currentTarget.style.background = "rgba(51,158,234,0.78)"; }}
          style={{
            width: 44, height: 44, borderRadius: "50%", border: "none",
            background: "rgba(0,0,0,0.56)", color: "white", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            transition: "background 0.15s",
          }}
          onMouseOver={(e) => { e.currentTarget.style.background = "rgba(51,158,234,0.78)"; }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line></svg>
        </button>
      </div>
    </div>
  );
}
