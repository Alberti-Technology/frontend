import { getHeaders, apiFetchWithAuth } from "./auth.service";
import { readErrorPayload, buildApiError } from "./apiClient";

export async function getMicrografias() {
  const res = await apiFetchWithAuth("metalografia/micrografias/", {
    headers: getHeaders(),
  });
  if (res.ok) {
    return res.json();
  }
  return [];
}

export async function createMicrografia(formData: FormData) {
  const res = await apiFetchWithAuth("metalografia/micrografias/", {
    method: "POST",
    headers: getHeaders(true),
    body: formData,
  });
  if (!res.ok) {
    const payload = await readErrorPayload(res);
    throw buildApiError(res, payload, "Error creando micrografía");
  }
  return res.json();
}

export async function updateMicrografia(
  id: string | number,
  formData: FormData,
) {
  const res = await apiFetchWithAuth(`metalografia/micrografias/${id}/`, {
    method: "PATCH",
    headers: getHeaders(true),
    body: formData,
  });
  if (!res.ok) {
    const payload = await readErrorPayload(res);
    throw buildApiError(res, payload, "Error actualizando micrografía");
  }
  return res.json();
}

export async function deleteMicrografia(id: string | number) {
  const res = await apiFetchWithAuth(`metalografia/micrografias/${id}/`, {
    method: "DELETE",
    headers: getHeaders(),
  });
  if (!res.ok) throw new Error("Error eliminando micrografía");
}
