import { getHeaders, apiFetchWithAuth } from "./auth.service";
import { readErrorPayload, buildApiError } from "./apiClient";

export interface ReportConfig {
  include_masks: boolean;
  include_histograms: boolean;
  custom_text: string;
  manual_conclusion: string;
  send_email: boolean;
  download_pdf?: boolean;
}

export async function generatePdf(muestraId: number | string, config: ReportConfig) {
  const reportApiUrlRaw = import.meta.env.VITE_REPORT_API_URL || "http://localhost:8001";
  const reportApiUrl = reportApiUrlRaw.replace(/\/+$/, "");
  
  const res = await fetch(`${reportApiUrl}/api/reports/generate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ muestra_id: Number(muestraId), config, operador_nombre: localStorage.getItem("user_fullname") || localStorage.getItem("username") || "Operador", operador_username: localStorage.getItem("username") || "" }),
  });

  if (!res.ok) {
    const payload = await readErrorPayload(res);
    throw buildApiError(res, payload, "Error generando PDF desde Report API");
  }

  const data = await res.json();
  return data;
}

export async function getReportList(): Promise<any[]> {
  const username = localStorage.getItem("username") || "";
  const reportApiUrlRaw = import.meta.env.VITE_REPORT_API_URL || "http://localhost:8001";
  const reportApiUrl = reportApiUrlRaw.replace(/\/+$/, "");

  const res = await fetch(`${reportApiUrl}/api/reports/list?username=${username}`, {
    method: "GET"
  });
  if (!res.ok) throw new Error("Error fetching report list");
  return res.json();
}

export async function trackReportStatus(reportId: string | number): Promise<any> {
  const reportApiUrlRaw = import.meta.env.VITE_REPORT_API_URL || "http://localhost:8001";
  const reportApiUrl = reportApiUrlRaw.replace(/\/+$/, "");

  const res = await fetch(`${reportApiUrl}/api/reports/track/${reportId}`, {
    method: "GET"
  });
  if (!res.ok) throw new Error("Error fetching report tracking status");
  return res.json();
}

export async function getReportInfo(reportId: string | number) {
  const res = await apiFetchWithAuth(`reports/${reportId}/`, {
    headers: getHeaders(),
  });
  if (!res.ok) throw new Error("Error fetching report");
  return res.json();
}
