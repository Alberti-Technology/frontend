import { useEffect, useRef } from "react";
import {
  connectNotificationsWebSocket,
  disconnectNotificationsWebSocket,
  MICROGRAPHY_MEASURE_COMPLETED_EVENT,
  type MicrographyMeasureCompletedEvent,
  REPORT_GENERATION_STATUS_EVENT,
  type ReportGenerationStatusEvent,
} from "../services/notifications";
import { normalizeId } from "../utils/helpers";

interface UseWebSocketSyncProps {
  token: string | null;
  companyEnabled: boolean;
  fetchAll: () => Promise<any>;
  refreshReportHistory: () => Promise<void>;
  setMeasureEventsById: React.Dispatch<React.SetStateAction<Record<string, MicrographyMeasureCompletedEvent>>>;
  missingActiveMicrografiaRefreshRef: React.MutableRefObject<string | null>;
}

export function useWebSocketSync({
  token,
  companyEnabled,
  fetchAll,
  refreshReportHistory,
  setMeasureEventsById,
  missingActiveMicrografiaRefreshRef,
}: UseWebSocketSyncProps) {
  useEffect(() => {
    if (companyEnabled) {
      connectNotificationsWebSocket(token);
    } else {
      disconnectNotificationsWebSocket();
    }
    return () => disconnectNotificationsWebSocket();
  }, [companyEnabled, token]);

  useEffect(() => {
    const handleMeasureCompleted = (event: Event) => {
      const payload = (event as CustomEvent<MicrographyMeasureCompletedEvent>).detail;
      const microId = normalizeId(payload?.micrografia_id);
      if (!microId) return;

      setMeasureEventsById((prev) => ({
        ...prev,
        [microId]: payload,
      }));
      
      if (payload?.status === "completed") {
        if (payload?.is_valid) {
          window.dispatchEvent(new CustomEvent("show_toast", { detail: { message: "Gráfico procesado correctamente", type: "success" } }));
        } else if (payload?.is_valid === false) {
          window.dispatchEvent(new CustomEvent("show_toast", { detail: { message: "Error al procesar el gráfico", type: "error" } }));
        }
      }
      
      missingActiveMicrografiaRefreshRef.current = null;
      void fetchAll();
    };

    window.addEventListener(MICROGRAPHY_MEASURE_COMPLETED_EVENT, handleMeasureCompleted);
    return () => window.removeEventListener(MICROGRAPHY_MEASURE_COMPLETED_EVENT, handleMeasureCompleted);
  }, [fetchAll, setMeasureEventsById, missingActiveMicrografiaRefreshRef]);

  useEffect(() => {
    const handleReportStatus = (e: Event) => {
      const customEvent = e as CustomEvent<ReportGenerationStatusEvent>;
      const payload = customEvent.detail;
      if (payload.status === "completed") {
        const rName = payload.report_name || `Informe ${payload.report_id}`;
        window.dispatchEvent(
          new CustomEvent("show_toast", {
            detail: { message: `Informe ${rName} generado y enviado por correo exitosamente`, type: "success" },
          }),
        );
      } else if (payload.status === "error") {
        window.dispatchEvent(
          new CustomEvent("show_toast", {
            detail: { message: `Error generando informe: ${payload.error_message || "Desconocido"}`, type: "error" },
          }),
        );
      }
      void refreshReportHistory();
    };

    window.addEventListener(REPORT_GENERATION_STATUS_EVENT, handleReportStatus);
    return () => window.removeEventListener(REPORT_GENERATION_STATUS_EVENT, handleReportStatus);
  }, [refreshReportHistory]);
}
