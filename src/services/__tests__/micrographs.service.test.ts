import { describe, it, expect, beforeEach, vi } from 'vitest';
import { 
  getMicrografias, createMicrografia, updateMicrografia, deleteMicrografia
} from '../micrographs.service';
import { server } from '../../tests/mocks/server';
import { http, HttpResponse } from 'msw';
import { BASE_URL } from '../apiClient';

describe('micrographs.service', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem("access_token", "test-token");
    vi.clearAllMocks();
  });

  it('CRUD básico de micrografías', async () => {
    server.use(
      http.get(`${BASE_URL}metalografia/micrografias/`, () => HttpResponse.json([{ id: 1 }])),
      http.post(`${BASE_URL}metalografia/micrografias/`, () => HttpResponse.json({ id: 2 })),
      http.patch(`${BASE_URL}metalografia/micrografias/2/`, () => HttpResponse.json({ id: 2, n: 'U' })),
      http.delete(`${BASE_URL}metalografia/micrografias/2/`, () => new HttpResponse(null, { status: 204 }))
    );

    await expect(getMicrografias()).resolves.toEqual([{ id: 1 }]);
    await expect(createMicrografia(new FormData())).resolves.toEqual({ id: 2 });
    await expect(updateMicrografia(2, new FormData())).resolves.toEqual({ id: 2, n: 'U' });
    await expect(deleteMicrografia(2)).resolves.toBeUndefined();
  });

  it('debe lanzar error estructurado en fallos', async () => {
    server.use(
      http.post(`${BASE_URL}metalografia/micrografias/`, () => HttpResponse.json({ error: 'Malo' }, { status: 400 }))
    );
    await expect(createMicrografia(new FormData())).rejects.toThrow('Malo');
  });
});
