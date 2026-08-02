import React from "react";

interface LightboxModalsProps {
  showConfirmModal: boolean;
  pixelLength: number;
  handleConfirmCancel: () => void;
  handleConfirmRedo: () => void;
  handleConfirmOk: () => void;
  showInputModal: boolean;
  micrometersInput: string;
  setMicrometersInput: (val: string) => void;
  handleInputSave: () => void;
  handleInputCancel: () => void;
  showAutoDetectModal: boolean;
  detectedPixelLength: number;
  handleAutoDetectCancel: () => void;
  handleAutoDetectSave: () => void;
  resetCalibrationState: (goToOverview: boolean) => void;
  setShowAutoDetectModal: (val: boolean) => void;
  showShortcutsModal: boolean;
  setShowShortcutsModal: (val: boolean) => void;
  modalBackdropStyle: React.CSSProperties;
  modalCardStyle: React.CSSProperties;
  modalHeaderStyle: React.CSSProperties;
  modalTitleStyle: React.CSSProperties;
  btnSecondary: React.CSSProperties;
  btnPrimary: React.CSSProperties;
}

export const LightboxModals: React.FC<LightboxModalsProps> = ({
  showConfirmModal, pixelLength, handleConfirmCancel, handleConfirmRedo, handleConfirmOk,
  showInputModal, micrometersInput, setMicrometersInput, handleInputSave, handleInputCancel,
  showAutoDetectModal, detectedPixelLength, handleAutoDetectCancel, handleAutoDetectSave, resetCalibrationState, setShowAutoDetectModal,
  showShortcutsModal, setShowShortcutsModal,
  modalBackdropStyle, modalCardStyle, modalHeaderStyle, modalTitleStyle, btnSecondary, btnPrimary
}) => {
  return (
    <>
      {showConfirmModal && (
        <div style={modalBackdropStyle} onClick={(e) => e.stopPropagation()}>
          <div style={modalCardStyle} onClick={(e) => e.stopPropagation()}>
            <div style={modalHeaderStyle}>
              <h3 style={modalTitleStyle}>Confirmar medida</h3>
            </div>
            <div style={{ padding: "20px 28px" }}>
              <p
                style={{
                  color: "#4d6684",
                  fontSize: "0.875rem",
                  margin: 0,
                  lineHeight: 1.6,
                }}
              >
                Línea detectada:{" "}
                <strong style={{ color: "#339eea" }}>
                  {pixelLength} píxeles
                </strong>
                . ¿Continuar?
              </p>
            </div>
            <div
              style={{
                display: "flex",
                gap: 10,
                justifyContent: "flex-end",
                padding: "0 28px 20px",
              }}
            >
              <button style={btnSecondary} onClick={handleConfirmCancel}>
                Cancelar
              </button>
              <button
                style={{
                  ...btnSecondary,
                  color: "#e8a317",
                  borderColor: "rgba(232,163,23,0.3)",
                }}
                onClick={handleConfirmRedo}
              >
                Rehacer
              </button>
              <button style={btnPrimary} onClick={handleConfirmOk}>
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {showInputModal && (
        <div style={modalBackdropStyle} onClick={(e) => e.stopPropagation()}>
          <div style={modalCardStyle} onClick={(e) => e.stopPropagation()}>
            <div style={modalHeaderStyle}>
              <h3 style={modalTitleStyle}>Ingresar medida</h3>
            </div>
            <div style={{ padding: "20px 28px" }}>
              <p
                style={{
                  color: "#4d6684",
                  fontSize: "0.875rem",
                  margin: "0 0 16px",
                  lineHeight: 1.6,
                }}
              >
                Ingresá el valor de la escala ({pixelLength} px).
              </p>
              <div style={{ display: "flex", alignItems: "stretch", gap: 0 }}>
                <input
                  type="number"
                  min="1"
                  step="any"
                  value={micrometersInput}
                  onChange={(e) => setMicrometersInput(e.target.value)}
                  autoFocus
                  style={{
                    flex: 1,
                    padding: "10px 14px",
                    borderRadius: "12px 0 0 12px",
                    border: "1px solid rgba(16,36,63,0.14)",
                    borderRight: "none",
                    fontSize: "0.9rem",
                    color: "#10243f",
                    outline: "none",
                    transition: "border-color 0.15s",
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "#339eea")}
                  onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(16,36,63,0.14)")}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleInputSave();
                  }}
                  placeholder="100"
                />
                <div
                  style={{
                    padding: "10px 16px",
                    background: "#f0f4f8",
                    borderRadius: "0 12px 12px 0",
                    border: "1px solid rgba(16,36,63,0.14)",
                    borderLeft: "none",
                    fontSize: "0.9rem",
                    fontWeight: 600,
                    color: "#4d6684",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  µm
                </div>
              </div>
            </div>
            <div
              style={{
                display: "flex",
                gap: 10,
                justifyContent: "flex-end",
                padding: "0 28px 20px",
              }}
            >
              <button style={btnSecondary} onClick={handleInputCancel}>
                Cancelar
              </button>
              <button style={btnPrimary} onClick={handleInputSave}>
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {showAutoDetectModal && (
        <div style={modalBackdropStyle} onClick={(e) => e.stopPropagation()}>
          <div style={modalCardStyle} onClick={(e) => e.stopPropagation()}>
            <div style={modalHeaderStyle}>
              <h3 style={modalTitleStyle}>Autodetección de escala</h3>
            </div>
            <div style={{ padding: "20px 28px" }}>
              <p
                style={{
                  color: "#4d6684",
                  fontSize: "0.875rem",
                  margin: "0 0 16px",
                  lineHeight: 1.6,
                }}
              >
                Se detectó una escala de{" "}
                <strong style={{ color: "#339eea" }}>
                  {detectedPixelLength} px
                </strong>
                . Ingresá µm para confirmar o calibrá manualmente.
              </p>
              <div style={{ display: "flex", alignItems: "stretch", gap: 0 }}>
                <input
                  type="number"
                  min="1"
                  step="any"
                  value={micrometersInput}
                  onChange={(e) => setMicrometersInput(e.target.value)}
                  autoFocus
                  style={{
                    flex: 1,
                    padding: "10px 14px",
                    borderRadius: "12px 0 0 12px",
                    border: "1px solid rgba(16,36,63,0.14)",
                    borderRight: "none",
                    fontSize: "0.9rem",
                    color: "#10243f",
                    outline: "none",
                    transition: "border-color 0.15s",
                  }}
                  onFocus={(e) =>
                    (e.currentTarget.style.borderColor = "#339eea")
                  }
                  onBlur={(e) =>
                    (e.currentTarget.style.borderColor = "rgba(16,36,63,0.14)")
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleAutoDetectSave();
                  }}
                  placeholder="100"
                />
                <div
                  style={{
                    padding: "10px 16px",
                    background: "#f0f4f8",
                    borderRadius: "0 12px 12px 0",
                    border: "1px solid rgba(16,36,63,0.14)",
                    borderLeft: "none",
                    fontSize: "0.9rem",
                    fontWeight: 600,
                    color: "#4d6684",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  µm
                </div>
              </div>
            </div>
            <div
              style={{
                display: "flex",
                gap: 10,
                justifyContent: "flex-end",
                padding: "0 28px 20px",
              }}
            >
              <button
                style={{
                  ...btnSecondary,
                  background: "transparent",
                  border: "none",
                  padding: "8px",
                }}
                onClick={() => {
                  setShowAutoDetectModal(false);
                  resetCalibrationState(true);
                }}
              >
                Cancelar
              </button>
              <button
                style={{
                  ...btnSecondary,
                  color: "#4d6684",
                  borderColor: "rgba(16,36,63,0.14)",
                }}
                onClick={handleAutoDetectCancel}
              >
                Calibrar manualmente
              </button>
              <button style={btnPrimary} onClick={handleAutoDetectSave}>
                Confirmar calibración
              </button>
            </div>
          </div>
        </div>
      )}

      {showShortcutsModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center">
          <div className="absolute inset-0 bg-[#10243f66] backdrop-blur-sm" onClick={() => setShowShortcutsModal(false)} />
          <div className="relative bg-white rounded-[28px] shadow-xl border border-[#10243f14] max-w-md w-[90%] overflow-hidden p-8 text-left">
            <h2 className="m-0 mb-6 text-[#10243f] text-2xl font-bold flex items-center gap-3">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-[#339eea]"><rect x="2" y="4" width="20" height="16" rx="2" ry="2"></rect><line x1="6" y1="8" x2="6" y2="8"></line><line x1="10" y1="8" x2="10" y2="8"></line><line x1="14" y1="8" x2="14" y2="8"></line><line x1="18" y1="8" x2="18" y2="8"></line><line x1="8" y1="12" x2="8" y2="12"></line><line x1="12" y1="12" x2="12" y2="12"></line><line x1="16" y1="12" x2="16" y2="12"></line><line x1="7" y1="16" x2="17" y2="16"></line></svg>
              Atajos de teclado
            </h2>
            <ul className="list-none p-0 m-0 space-y-4 text-[#4d6684]">
              <li className="flex justify-between items-center border-b border-[#10243f14] pb-3">
                <span>Siguiente imagen</span>
                <span className="bg-[#f0f4f8] text-[#10243f] px-2 py-1 rounded-md font-mono font-bold text-sm">Flecha Derecha</span>
              </li>
              <li className="flex justify-between items-center border-b border-[#10243f14] pb-3">
                <span>Imagen anterior</span>
                <span className="bg-[#f0f4f8] text-[#10243f] px-2 py-1 rounded-md font-mono font-bold text-sm">Flecha Izquierda</span>
              </li>
              <li className="flex justify-between items-center border-b border-[#10243f14] pb-3">
                <span>Acercar / Alejar</span>
                <span className="bg-[#f0f4f8] text-[#10243f] px-2 py-1 rounded-md font-mono font-bold text-sm">Rueda del Ratón</span>
              </li>
              <li className="flex justify-between items-center border-b border-[#10243f14] pb-3">
                <span>Restablecer zoom y posición</span>
                <span className="bg-[#f0f4f8] text-[#10243f] px-2 py-1 rounded-md font-mono font-bold text-sm">Doble Clic</span>
              </li>
              <li className="flex justify-between items-center">
                <span>Salir del editor</span>
                <span className="bg-[#f0f4f8] text-[#10243f] px-2 py-1 rounded-md font-mono font-bold text-sm">Esc</span>
              </li>
            </ul>
          </div>
        </div>
      )}
    </>
  );
};
