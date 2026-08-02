import { getHeaders, apiFetchWithAuth } from "./auth.service";
import { ApiMaterial } from "../types";

export async function getMateriales(): Promise<ApiMaterial[]> {
  const res = await apiFetchWithAuth("metalografia/material/", {
    headers: getHeaders(),
  });

  if (!res.ok) throw new Error("Error fetching materiales");

  const data = await res.json();
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.materials)) return data.materials;
  return [];
}

export async function createMaterial(formData: FormData) {
  const res = await apiFetchWithAuth("metalografia/material/", {
    method: "POST",
    headers: getHeaders(true),
    body: formData,
  });
  if (!res.ok) throw new Error("Error creando material");
  return res.json();
}

export async function getMuestras() {
  const res = await apiFetchWithAuth("metalografia/muestras/", {
    headers: getHeaders(),
  });
  if (!res.ok) throw new Error("Error fetching muestras");
  return res.json();
}

export async function createMuestra(formData: FormData) {
  const res = await apiFetchWithAuth("metalografia/muestras/", {
    method: "POST",
    headers: getHeaders(true),
    body: formData,
  });
  if (!res.ok) throw new Error("Error creando muestra");
  return res.json();
}

export async function updateMuestra(id: string | number, formData: FormData) {
  const res = await apiFetchWithAuth(`metalografia/muestras/${id}/`, {
    method: "PATCH",
    headers: getHeaders(true),
    body: formData,
  });
  if (!res.ok) throw new Error("Error actualizando muestra");
  return res.json();
}

export async function deleteMuestra(id: string | number) {
  const res = await apiFetchWithAuth(`metalografia/muestras/${id}/`, {
    method: "DELETE",
    headers: getHeaders(),
  });
  if (!res.ok) throw new Error("Error eliminando muestra");
}

export async function getRegiones() {
  const res = await apiFetchWithAuth("metalografia/regiones/", {
    headers: getHeaders(),
  });
  if (!res.ok) throw new Error("Error fetching regiones");
  return res.json();
}

export async function createRegion(formData: FormData) {
  const res = await apiFetchWithAuth("metalografia/regiones/", {
    method: "POST",
    headers: getHeaders(true),
    body: formData,
  });
  if (!res.ok) throw new Error("Error creando región");
  return res.json();
}

export async function updateRegion(id: string | number, formData: FormData) {
  const res = await apiFetchWithAuth(`metalografia/regiones/${id}/`, {
    method: "PATCH",
    headers: getHeaders(true),
    body: formData,
  });
  if (!res.ok) throw new Error("Error actualizando región");
  return res.json();
}

export async function deleteRegion(id: string | number) {
  const res = await apiFetchWithAuth(`metalografia/regiones/${id}/`, {
    method: "DELETE",
    headers: getHeaders(),
  });
  if (!res.ok) throw new Error("Error eliminando región");
}
