import { describe, it, expect, beforeEach, vi } from 'vitest';
import { 
  getMateriales, createMaterial, 
  getMuestras, createMuestra, updateMuestra, deleteMuestra,
  getRegiones, createRegion, updateRegion, deleteRegion
} from '../materials.service';
import { server } from '../../tests/mocks/server';
import { http, HttpResponse } from 'msw';
import { BASE_URL } from '../apiClient';

describe('materials.service', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem("access_token", "test-token");
    vi.clearAllMocks();
  });

  describe('Materiales', () => {
    it('debe obtener la lista de materiales', async () => {
      const mockMats = [{ id: 1, name: 'Acero' }];
      server.use(
        http.get(`${BASE_URL}metalografia/material/`, () => {
          return HttpResponse.json(mockMats);
        })
      );
      const res = await getMateriales();
      expect(res).toEqual(mockMats);
    });

    it('debe crear un material', async () => {
      server.use(
        http.post(`${BASE_URL}metalografia/material/`, async ({ request }) => {
          return HttpResponse.json({ id: 2, name: 'Nuevo' });
        })
      );
      const formData = new FormData();
      formData.append('name', 'Nuevo');
      const res = await createMaterial(formData);
      expect(res).toEqual({ id: 2, name: 'Nuevo' });
    });
  });

  describe('Muestras', () => {
    it('debe obtener muestras', async () => {
      server.use(
        http.get(`${BASE_URL}metalografia/muestras/`, () => HttpResponse.json([{ id: 10 }]))
      );
      const res = await getMuestras();
      expect(res).toEqual([{ id: 10 }]);
    });

    it('debe lanzar error al fallar', async () => {
      server.use(
        http.get(`${BASE_URL}metalografia/muestras/`, () => new HttpResponse(JSON.stringify({ error: "Fallo" }), { 
          status: 500, 
          headers: { 'content-type': 'application/json' } 
        }))
      );
      await expect(getMuestras()).rejects.toThrow('Error fetching muestras');
    });

    it('debe crear, actualizar y eliminar', async () => {
      server.use(
        http.post(`${BASE_URL}metalografia/muestras/`, () => HttpResponse.json({ id: 1 })),
        http.patch(`${BASE_URL}metalografia/muestras/1/`, () => HttpResponse.json({ id: 1, name: 'updated' })),
        http.delete(`${BASE_URL}metalografia/muestras/1/`, () => new HttpResponse(null, { status: 204 }))
      );

      await expect(createMuestra(new FormData())).resolves.toEqual({ id: 1 });
      await expect(updateMuestra(1, new FormData())).resolves.toEqual({ id: 1, name: 'updated' });
      await expect(deleteMuestra(1)).resolves.toBeUndefined();
    });
  });

  describe('Regiones', () => {
    it('CRUD básico', async () => {
      server.use(
        http.get(`${BASE_URL}metalografia/regiones/`, () => HttpResponse.json([{ id: 1 }])),
        http.post(`${BASE_URL}metalografia/regiones/`, () => HttpResponse.json({ id: 2 })),
        http.patch(`${BASE_URL}metalografia/regiones/2/`, () => HttpResponse.json({ id: 2, n: 'U' })),
        http.delete(`${BASE_URL}metalografia/regiones/2/`, () => new HttpResponse(null, { status: 204 }))
      );

      await expect(getRegiones()).resolves.toEqual([{ id: 1 }]);
      await expect(createRegion(new FormData())).resolves.toEqual({ id: 2 });
      await expect(updateRegion(2, new FormData())).resolves.toEqual({ id: 2, n: 'U' });
      await expect(deleteRegion(2)).resolves.toBeUndefined();
    });
  });
});
