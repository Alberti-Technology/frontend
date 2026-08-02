import React from "react";
import { useAppStore } from "../../store/useAppStore";
import { useReportStore } from "../../store/useReportStore";

interface ReportsPanelProps {
  informesListIsEmpty: boolean;
}

const REPORT_HISTORY_ITEM_GAP = 7;

export const ReportsPanel = ({
  informesListIsEmpty,
}: ReportsPanelProps) => {
  const {
    showReportLegendModal, setShowReportLegendModal,
    setShowAdminLegend, setShowGalleryLegend,
  } = useAppStore();

  const {
    reportConfig, setReportConfig,
    pdfHistory
  } = useReportStore();

  return (
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
      <div
        className="px-4 py-2.5 border-b border-[#10243f1a] flex justify-between items-center"
        style={{ flexShrink: 0, position: "relative" }}
      >
        <div className="flex items-center gap-2">
          <h3 className="text-base font-bold text-[#10243f] m-0">Informes</h3>
          <button 
            data-legend-trigger
            onClick={(e) => { e.stopPropagation(); setShowReportLegendModal(!showReportLegendModal); setShowAdminLegend(false); setShowGalleryLegend(false); }}
            className="flex items-center justify-center w-7 h-7 rounded-lg bg-transparent border-none text-[#339eea] cursor-pointer transition-all hover:bg-[#eef8ff] hover:-translate-y-0.5"
            title="Leyenda de estados"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
          </button>
        </div>
        {showReportLegendModal && (
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
              <h3 className="m-0 text-[#10243f] text-sm font-bold">Leyenda Informes</h3>
              <button onClick={() => setShowReportLegendModal(false)} className="text-gray-400 hover:text-gray-600 bg-transparent border-none cursor-pointer">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>
            <div className="p-4 max-h-[50vh] overflow-y-auto">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ display: "flex", padding: "2px", borderRadius: 4, background: "rgba(59, 130, 246, 0.15)", border: "1px solid #3b82f6", color: "#3b82f6", lineHeight: 1 }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                  </span>
                  <span style={{ fontSize: '0.9rem', color: '#4d6684' }}>El informe está en proceso.</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ color: '#10b981', padding: '2px 4px', display: 'flex' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                      <polyline points="22 4 12 14.01 9 11.01"></polyline>
                    </svg>
                  </span>
                  <span style={{ fontSize: '0.9rem', color: '#4d6684' }}>Completado exitosamente.</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ color: '#ef4444', padding: '2px 4px', display: 'flex' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="15" y1="9" x2="9" y2="15"></line>
                      <line x1="9" y1="9" x2="15" y2="15"></line>
                    </svg>
                  </span>
                  <span style={{ fontSize: '0.9rem', color: '#4d6684' }}>Error al generar el informe.</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

  <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", padding: 14 }}>
        <div style={{ fontSize: "0.84rem", fontWeight: 700, color: "#4d6684", marginBottom: 10 }}>
          Configuración
        </div>
        
        <div
          className="custom-scrollbar"
          style={{
            border: "1px solid rgba(16,36,63,0.16)",
            borderRadius: 18,
            padding: "16px",
            background: "#f9fcff",
            flex: 6,
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: 16,
            fontSize: "0.85rem"
          }}
        >
          <label style={{ display: "flex", gap: "8px", alignItems: "center", cursor: "pointer", fontWeight: 500, color: "#2d3748" }}>
            <input
              type="checkbox"
              checked={reportConfig.include_masks}
              onChange={(e) => setReportConfig({ ...reportConfig, include_masks: e.target.checked })}
            />
            Incluir detección de bordes
          </label>
          
          <label style={{ display: "flex", gap: "8px", alignItems: "center", cursor: "pointer", fontWeight: 500, color: "#2d3748" }}>
            <input
              type="checkbox"
              checked={reportConfig.include_histograms}
              onChange={(e) => setReportConfig({ ...reportConfig, include_histograms: e.target.checked })}
            />
            Generar e incluir histogramas
          </label>


          
          <label style={{ display: "flex", gap: "8px", alignItems: "center", cursor: "pointer", fontWeight: 500, color: "#2d3748" }}>
            <input
              type="checkbox"
              checked={reportConfig.send_email}
              onChange={(e) => setReportConfig({ ...reportConfig, send_email: e.target.checked })}
            />
            Enviar por correo electrónico
          </label>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "6px", flex: 1 }}>
            <label style={{ fontWeight: 600, color: "#4d6684" }}>Observaciones</label>
            <div style={{ position: "relative", flex: 1, display: "flex" }}>
              <textarea
                value={reportConfig.custom_text}
                onChange={(e) => setReportConfig({ ...reportConfig, custom_text: e.target.value })}
                placeholder="Texto personalizado a incluir en el informe..."
                className="custom-scrollbar"
                style={{
                  width: "100%",
                  flex: 1,
                  minHeight: "80px",
                  resize: "none",
                  padding: "10px",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e0",
                  fontSize: "0.8rem",
                  fontFamily: "inherit",
                  boxShadow: "inset 0 1px 2px rgba(0,0,0,0.02)"
                }}
              />
              <button
                onClick={() => setReportConfig({ ...reportConfig, custom_text: "" })}
                title="Limpiar observaciones"
                style={{ position: "absolute", bottom: "4px", left: "4px", background: "#ffffff", border: "1px solid #e2e8f0", cursor: "pointer", color: "#94a3b8", display: "flex", alignItems: "center", justifyContent: "center", width: 22, height: 22, borderRadius: 4, zIndex: 10 }}
                onMouseEnter={(e) => Object.assign(e.currentTarget.style, { background: "#f1f5f9", color: "#64748b" })}
                onMouseLeave={(e) => Object.assign(e.currentTarget.style, { background: "transparent", color: "#94a3b8" })}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
              </button>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "6px", flex: 1 }}>
            <label style={{ fontWeight: 600, color: "#4d6684" }}>Conclusión</label>
            <div style={{ position: "relative", flex: 1, display: "flex" }}>
              <textarea
                value={reportConfig.manual_conclusion}
                onChange={(e) => setReportConfig({ ...reportConfig, manual_conclusion: e.target.value })}
                placeholder="Escriba la conclusión del análisis..."
                className="custom-scrollbar"
                style={{
                  width: "100%",
                  flex: 1,
                  minHeight: "80px",
                  resize: "none",
                  padding: "10px",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e0",
                  fontSize: "0.8rem",
                  fontFamily: "inherit",
                  boxShadow: "inset 0 1px 2px rgba(0,0,0,0.02)"
                }}
              />
              <button
                onClick={() => setReportConfig({ ...reportConfig, manual_conclusion: "" })}
                title="Limpiar conclusión"
                style={{ position: "absolute", bottom: "4px", left: "4px", background: "#ffffff", border: "1px solid #e2e8f0", cursor: "pointer", color: "#94a3b8", display: "flex", alignItems: "center", justifyContent: "center", width: 22, height: 22, borderRadius: 4, zIndex: 10 }}
                onMouseEnter={(e) => Object.assign(e.currentTarget.style, { background: "#f1f5f9", color: "#64748b" })}
                onMouseLeave={(e) => Object.assign(e.currentTarget.style, { background: "transparent", color: "#94a3b8" })}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2" style={{ marginBottom: 10, marginTop: 14 }}>
          <div style={{ fontSize: "0.84rem", fontWeight: 700, color: "#4d6684" }}>
            Historial
          </div>
        </div>

        <div
          style={{
            border: "1px solid rgba(16,36,63,0.16)",
            borderRadius: 18,
            padding: "10px 2px 10px 10px",
            background: "#f9fcff",
            minHeight: 120,
            minWidth: 0,
            display: "flex",
            flexDirection: "column",
            gap: 10,
            flex: 4,
            overflow: "hidden",
          }}
        >
          {informesListIsEmpty ? (
            <div className="flex flex-col items-center justify-center flex-1 text-center opacity-70 p-2">
              <div className="text-[#9ca3af] mb-3">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
              </div>
              <span className="text-[#6b7280] text-[0.9rem] italic m-0">Aún no hay informes que mostrar.</span>
            </div>
          ) : (
            <>
              {pdfHistory.length > 0 && (
                <div
                  className="custom-scrollbar"
                  style={{
                    width: "100%",
                    flex: 1,
                    overflowY: "auto",
                    minHeight: 0,
                  }}
                >
                  <ul
                    style={{
                      listStyle: "none",
                      padding: 0,
                      margin: 0,
                      display: "flex",
                      flexDirection: "column",
                      gap: REPORT_HISTORY_ITEM_GAP,
                    }}
                  >
                    {pdfHistory.map((pdf, idx) => {
                      const isFinished = pdf.status === "completed" || pdf.status === "failed" || (pdf.job && (pdf.job.status === "completed" || pdf.job.status === "failed"));
                      const isSuccess = pdf.status === "completed" || (pdf.job && pdf.job.status === "completed");
                      const isFailed = pdf.status === "failed" || (pdf.job && pdf.job.status === "failed");
                      
                      const innerContent = (
                        <li
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            width: "100%",
                            gap: 8,
                            fontSize: "0.82rem",
                            color: "#10243f",
                            background: "white",
                            padding: "10px 12px",
                            borderRadius: 8,
                            border: "1px solid rgba(16,36,63,0.09)",
                          }}
                        >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", gap: 10 }}>
                          <span
                            style={{
                              fontWeight: 600,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                              flex: 1,
                              textAlign: "left",
                            }}
                          >
                            {pdf.value || `Informe_ID_${pdf.id}`}.pdf
                          </span>
                          
                          <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                            <span style={{ fontSize: "0.7rem", color: "#64748b" }}>
                              {pdf.fecha ? `${new Date(pdf.fecha).toLocaleDateString("es-AR", { timeZone: "America/Argentina/Buenos_Aires" })} - ${new Date(pdf.fecha).toLocaleTimeString("es-AR", { timeZone: "America/Argentina/Buenos_Aires", hour: '2-digit', minute: '2-digit', hour12: false })}` : ""}
                            </span>
                            {isFinished && isSuccess && (
                              <span title="Completado" style={{ display: "flex" }}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                                </svg>
                              </span>
                            )}
                            {isFinished && isFailed && (
                              <span title="Fallido" style={{ display: "flex" }}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                  <circle cx="12" cy="12" r="10"></circle>
                                  <line x1="15" y1="9" x2="9" y2="15"></line>
                                  <line x1="9" y1="9" x2="15" y2="15"></line>
                                </svg>
                              </span>
                            )}
                          </div>
                        </div>
                        
                        {!isFinished && pdf.job && (
                          <div style={{ width: "100%", marginTop: "4px", display: "flex", flexDirection: "column", gap: "6px" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "#3b82f6", fontWeight: 600 }}>
                              <span>{pdf.job.stage || "Procesando..."}</span>
                              <span>{pdf.job.progress || 0}%</span>
                            </div>
                            <div style={{ width: "100%", height: "6px", background: "#e2e8f0", borderRadius: "3px", overflow: "hidden" }}>
                              <div style={{ width: `${pdf.job.progress || 0}%`, height: "100%", background: "linear-gradient(90deg, #3b82f6, #60a5fa)", borderRadius: "3px", transition: "width 0.3s ease" }}></div>
                            </div>
                          </div>
                        )}
                      </li>
                      );

                      return (
                        <React.Fragment key={pdf.id || idx}>
                          {innerContent}
                        </React.Fragment>
                      );
                    })}
                  </ul>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </section>
  );
};
