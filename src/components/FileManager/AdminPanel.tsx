import React from "react";
import { ItemRow } from "./ItemRow";
import { Collapsible } from "./SubComponents";
import { useAppStore } from "../../store/useAppStore";
import { useCalibrationStore } from "../../store/useCalibrationStore";
import { useDataStore } from "../../store/useDataStore";
import { ENABLE_AUTOCALIBRATION, normalizeId } from "../../utils/helpers";
import { Material, Muestra, Region, Micrografia } from "../../types";

interface AdminPanelProps {
  closeMenu: () => void;
  handleHeaderMateriales: () => void;
  handleHeaderMuestras: (mat: Material) => void;
  handleHeaderRegiones: (mue: Muestra) => void;
  handleHeaderMicrografias: (reg: Region) => void;
  handleClickMaterial: (mat: Material) => void;
  handleClickMuestra: (mue: Muestra, mat: Material) => void;
  handleClickRegion: (reg: Region, mue: Muestra, mat: Material) => void;
  handleClickMicrografia: (mic: Micrografia, reg: Region) => void;
  checkMicrographLimit: (callback: () => void) => void;
  handleGeneratePdf: (id: string) => void;
  materials: Material[];
  measureEventsById: Record<string, any>;
  microMaterialHasModelByUrl: Record<string, boolean>;
  fixImageUrl: (url: string | null | undefined) => string;
}

export const AdminPanel = ({
  closeMenu,
  handleHeaderMateriales,
  handleHeaderMuestras,
  handleHeaderRegiones,
  handleHeaderMicrografias,
  handleClickMaterial,
  handleClickMuestra,
  handleClickRegion,
  handleClickMicrografia,
  checkMicrographLimit,
  handleGeneratePdf,
  materials,
  measureEventsById,
  microMaterialHasModelByUrl,
  fixImageUrl
}: AdminPanelProps) => {
  const {
    showAdminLegend, setShowAdminLegend,
    setShowGalleryLegend, setShowReportLegendModal,
    setCreateModal
  } = useAppStore();
  const { calibratingByUrl, failedCalibrationByUrl, calibrationData } = useCalibrationStore();
  const { apiMicrografias, expandedIds } = useDataStore();
  const apiId = (id: string) => (normalizeId(id) || "").replace(/^(mat|mue|reg|mic)_/, "");

  return (
    <div
      className="island"
      style={{
        position: "relative",
        background: "#ffffff",
        display: "grid",
        gridTemplateRows: "auto minmax(0, 1fr)",
        height: "100%",
        minHeight: 0,
        minWidth: 0,
        overflow: "hidden",
      }}
      onClick={(e) => {
        e.stopPropagation();
        closeMenu();
      }}
    >
      <div
        className="px-4 py-2.5 border-b border-[#10243f1a] flex justify-between items-center"
        style={{ flexShrink: 0, position: "relative" }}
      >
        <div className="flex items-center gap-2">
          <h3 className="text-base font-bold text-[#10243f] m-0">Administrador</h3>
          <button 
            data-legend-trigger
            onClick={(e) => { e.stopPropagation(); setShowAdminLegend(prev => !prev); setShowGalleryLegend(false); setShowReportLegendModal(false); }}
            className="flex items-center justify-center w-7 h-7 rounded-lg bg-transparent border-none text-[#339eea] cursor-pointer transition-all hover:bg-[#eef8ff] hover:-translate-y-0.5"
            title="Leyenda de íconos"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
          </button>
        </div>
        {showAdminLegend && (
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
              <h3 className="m-0 text-[#10243f] text-sm font-bold">Leyenda Administrador</h3>
              <button onClick={() => setShowAdminLegend(false)} className="text-gray-400 hover:text-gray-600 bg-transparent border-none cursor-pointer">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>
            <div className="p-4 max-h-[50vh] overflow-y-auto">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {ENABLE_AUTOCALIBRATION && (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ fontSize: '0.65rem', fontWeight: 800, padding: '3px 5px', borderRadius: 4, background: 'rgba(22,163,74,0.15)', border: '1px solid #16a34a', color: '#16a34a', lineHeight: 1 }}>IA</span>
                      <span style={{ fontSize: '0.9rem', color: '#4d6684' }}>Autocalibración exitosa</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ fontSize: '0.65rem', fontWeight: 800, padding: '3px 5px', borderRadius: 4, background: 'rgba(232,163,23,0.15)', border: '1px solid #e8a317', color: '#e8a317', lineHeight: 1 }}>IA</span>
                      <span style={{ fontSize: '0.9rem', color: '#4d6684' }}>Autocalibrando (o en cola)</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ fontSize: '0.65rem', fontWeight: 800, padding: '3px 5px', borderRadius: 4, background: 'rgba(248,113,113,0.15)', border: '1px solid #f87171', color: '#f87171', lineHeight: 1 }}>IA</span>
                      <span style={{ fontSize: '0.9rem', color: '#4d6684' }}>Error en autocalibración</span>
                    </div>
                  </>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ color: '#16a34a', padding: '2px 4px', display: 'flex' }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  </span>
                  <span style={{ fontSize: '0.9rem', color: '#4d6684' }}>Calibración Manual exitosa</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ display: "flex", padding: "2px", borderRadius: 4, background: "rgba(22,163,74,0.15)", border: "1px solid #16a34a", color: "#16a34a", lineHeight: 1 }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18" /><path d="M7 16l4-4 3 3 6-7" /></svg>
                  </span>
                  <span style={{ fontSize: '0.9rem', color: '#4d6684' }}>Gráfico de medición disponible</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ display: "flex", padding: "2px", borderRadius: 4, background: "rgba(232,163,23,0.15)", border: "1px solid #e8a317", color: "#e8a317", lineHeight: 1 }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18" /><path d="M7 16l4-4 3 3 6-7" /></svg>
                  </span>
                  <span style={{ fontSize: '0.9rem', color: '#4d6684' }}>Procesando gráfico...</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ display: "flex", padding: "2px", borderRadius: 4, background: "rgba(248,113,113,0.15)", border: "1px solid #f87171", color: "#f87171", lineHeight: 1 }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18" /><path d="M7 16l4-4 3 3 6-7" /></svg>
                  </span>
                  <span style={{ fontSize: '0.9rem', color: '#4d6684' }}>Fallo al generar gráfico</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Scrollable tree */}
      <div
        style={{
          minHeight: 0,
          overflowY: "auto",
          overflowX: "hidden",
          paddingBottom: 14,
        }}
        className="custom-scrollbar"
        onScroll={closeMenu}
      >
        {/* MATERIALES header */}
        <div className="flex items-center gap-2">
          <div
            className="mx-2 my-2 inline-flex items-center px-3 py-1.5 text-[11px] font-bold text-[#3f6b8f] uppercase tracking-[0.12em] cursor-pointer select-none rounded-lg border border-[#b7dbf7] bg-white shadow-[0_1px_2px_rgba(16,36,63,0.06)] transition-shadow hover:shadow-[0_8px_16px_rgba(16,36,63,0.16)]"
            onClick={(e) => {
              e.stopPropagation();
              handleHeaderMateriales();
            }}
            title="Ver todas las imágenes de Materiales"
          >
            Materiales
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setCreateModal({ parentId: "root", type: "material" });
            }}
            title="Crear Material"
            className="w-6 h-6 flex items-center justify-center rounded border border-[#b7dbf7] text-[#3f6b8f] hover:bg-[#eef8ff] transition shadow-[0_1px_2px_rgba(16,36,63,0.06)] bg-white cursor-pointer"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
          </button>
        </div>


        {/* Material items */}
        {materials.map((mat) => (
          <React.Fragment key={mat.id}>
            <ItemRow
              id={mat.id}
              name={mat.name}
              type="material"
              isOpen={expandedIds.has(mat.id)}
              onClick={() => handleClickMaterial(mat)}
            />

            {/* Muestras of this material (animated) */}
            <Collapsible open={expandedIds.has(mat.id)}>
              <div
                className="mx-2 my-1 inline-flex items-center px-3 py-1.5 text-[11px] font-bold text-[#3f6b8f] uppercase tracking-[0.12em] cursor-pointer select-none rounded-lg border border-[#b7dbf7] bg-white shadow-[0_1px_2px_rgba(16,36,63,0.06)] transition-shadow hover:shadow-[0_8px_16px_rgba(16,36,63,0.16)]"
                style={{ marginLeft: 12, marginRight: 8 }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleHeaderMuestras(mat);
                }}
                title={`Ver todas las muestras de ${mat.name}`}
              >
                Muestras
              </div>

              {mat.muestras.map((mue) => (
                <React.Fragment key={mue.id}>
                  <div style={{ marginLeft: 10 }}>
                    <ItemRow
                      id={mue.id}
                      name={mue.name}
                      type="muestra"
                      isOpen={expandedIds.has(mue.id)}
                      onClick={() => handleClickMuestra(mue, mat)}
                      onGeneratePdf={() => checkMicrographLimit(() => handleGeneratePdf(apiId(mue.id)))}
                    />
                  </div>

                  {/* Regiones of this muestra (animated) */}
                  <Collapsible open={expandedIds.has(mue.id)}>
                    <div
                      className="mx-2 my-1 inline-flex items-center px-3 py-1.5 text-[11px] font-bold text-[#3f6b8f] uppercase tracking-[0.12em] cursor-pointer select-none rounded-lg border border-[#b7dbf7] bg-white shadow-[0_1px_2px_rgba(16,36,63,0.06)] transition-shadow hover:shadow-[0_8px_16px_rgba(16,36,63,0.16)]"
                      style={{ marginLeft: 24, marginRight: 8 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleHeaderRegiones(mue);
                      }}
                      title={`Ver todas las regiones de ${mue.name}`}
                    >
                      Regiones
                    </div>

                    {mue.regiones.map((reg) => (
                      <React.Fragment key={reg.id}>
                        <div style={{ marginLeft: 22 }}>
                          <ItemRow
                            id={reg.id}
                            name={reg.name}
                            type="region"
                            isOpen={expandedIds.has(reg.id)}
                            onClick={() => handleClickRegion(reg, mue, mat)}
                          />
                        </div>

                        {/* Micrografías of this region (animated) */}
                        <Collapsible open={expandedIds.has(reg.id)}>
                          <div
                            className="mx-2 my-1 inline-flex items-center px-3 py-1.5 text-[11px] font-bold text-[#3f6b8f] uppercase tracking-[0.12em] cursor-pointer select-none rounded-lg border border-[#b7dbf7] bg-white shadow-[0_1px_2px_rgba(16,36,63,0.06)] transition-shadow hover:shadow-[0_8px_16px_rgba(16,36,63,0.16)]"
                            style={{ marginLeft: 36, marginRight: 8 }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleHeaderMicrografias(reg);
                            }}
                            title={`Ver todas las micrografías de ${reg.name}`}
                          >
                            Micrografías
                          </div>

                          {reg.micrografias.map((mic) => (
                            <div key={mic.id} style={{ marginLeft: 34 }}>
                              <ItemRow
                                id={mic.id}
                                name={mic.name}
                                type="micrografia"
                                isCalibrated={
                                  (!!mic.umByPx && Number(mic.umByPx) > 0) ||
                                  (!!calibrationData[mic.url]?.umByPx && Number(calibrationData[mic.url]?.umByPx) > 0)
                                }
                                isCalibrating={!!calibratingByUrl[mic.url] && (microMaterialHasModelByUrl[mic.url] ?? true)}
                                isFailed={!!failedCalibrationByUrl[mic.url] && (microMaterialHasModelByUrl[mic.url] ?? true)}
                                isAi={!!calibrationData[mic.url]?.isAi && (microMaterialHasModelByUrl[mic.url] ?? true)}
                                hasModel={microMaterialHasModelByUrl[mic.url] ?? true}
                                isChartProcessed={(() => {
                                  const mApi = apiMicrografias.find((m: any) => String(m.id) === String(mic.rawId) || fixImageUrl(m.imagen) === mic.url);
                                  const mEvt = mApi ? measureEventsById[String(mApi.id)] : undefined;
                                  return mEvt ? mEvt.status === "completed" && mEvt.is_valid === true : mApi?.measure_is_valid === true || !!mApi?.measure_imagen;
                                })()}
                                isChartFailed={(() => {
                                  const mApi = apiMicrografias.find((m: any) => String(m.id) === String(mic.rawId) || fixImageUrl(m.imagen) === mic.url);
                                  const mEvt = mApi ? measureEventsById[String(mApi.id)] : undefined;
                                  return mEvt ? mEvt.status === "completed" && mEvt.is_valid === false : mApi?.measure_is_valid === false;
                                })()}
                                isChartProcessing={(() => {
                                  const mApi = apiMicrografias.find((m: any) => String(m.id) === String(mic.rawId) || fixImageUrl(m.imagen) === mic.url);
                                  const mEvt = mApi ? measureEventsById[String(mApi.id)] : undefined;
                                  const processed = mEvt ? mEvt.status === "completed" && mEvt.is_valid === true : mApi?.measure_is_valid === true || !!mApi?.measure_imagen;
                                  const failed = mEvt ? mEvt.status === "completed" && mEvt.is_valid === false : mApi?.measure_is_valid === false;
                                  return !processed && !failed;
                                })()}
                                onClick={() =>
                                  handleClickMicrografia(mic, reg)
                                }
                              />
                            </div>
                          ))}
                        </Collapsible>
                      </React.Fragment>
                    ))}
                  </Collapsible>
                </React.Fragment>
              ))}
            </Collapsible>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};
