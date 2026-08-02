import { describe, it, expect, beforeEach, vi } from 'vitest';
import { login, logout, getHeaders, apiFetchWithAuth } from '../auth.service';
import { server } from '../../tests/mocks/server';
import { http, HttpResponse } from 'msw';
import { BASE_URL } from '../apiClient';

describe('auth.service', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('getHeaders', () => {
    it('debe incluir Authorization si hay token', () => {
      localStorage.setItem('access_token', 'my-token');
      const headers = getHeaders();
      expect(headers).toHaveProperty('Authorization', 'Bearer my-token');
      expect(headers).toHaveProperty('Content-Type', 'application/json');
    });

    it('no debe incluir Content-Type si isFormData es true', () => {
      const headers = getHeaders(true);
      expect(headers).not.toHaveProperty('Content-Type');
    });
  });

  describe('login', () => {
    it('debe loguearse exitosamente y guardar datos en localStorage', async () => {
      server.use(
        http.post(`${BASE_URL}member/login/`, () => {
          return HttpResponse.json({
            access: 'fake-access-token',
            refresh: 'fake-refresh-token',
            user_id: 1,
            username: 'testuser',
            company_enabled: true
          });
        })
      );

      const token = await login('testuser', 'pass123');
      expect(token).toBe('fake-access-token');
      expect(localStorage.getItem('access_token')).toBe('fake-access-token');
      expect(localStorage.getItem('company_enabled')).toBe('true');
    });

    it('debe lanzar error con credenciales inválidas', async () => {
      server.use(
        http.post(`${BASE_URL}member/login/`, () => {
          return new HttpResponse(null, { status: 401 });
        })
      );

      await expect(login('bad', 'pass')).rejects.toThrow('Credenciales inválidas');
    });

    it('debe reemplazar el body completo en caso de cuenta bloqueada (423)', async () => {
      server.use(
        http.post(`${BASE_URL}member/login/`, () => {
          return new HttpResponse(null, { status: 423 });
        })
      );

      const token = await login('locked', 'pass');
      expect(token).toBe('');
      expect(document.body.innerHTML).toContain('ACCESO BLOQUEADO');
    });

    it('debe lanzar error de cuenta desactivada (403)', async () => {
      server.use(
        http.post(`${BASE_URL}member/login/`, () => {
          return HttpResponse.json({ error: 'Cuenta suspendida' }, { status: 403 });
        })
      );

      await expect(login('disabled', 'pass')).rejects.toThrow('Cuenta suspendida');
    });
  });

  describe('logout', () => {
    it('debe limpiar el localStorage y emitir evento auth_logout', () => {
      localStorage.setItem('access_token', 'token123');
      localStorage.setItem('refresh_token', 'refresh123');

      const dispatchSpy = vi.spyOn(window, 'dispatchEvent');

      logout();

      expect(localStorage.getItem('access_token')).toBeNull();
      expect(localStorage.getItem('refresh_token')).toBeNull();
      
      const lastEvent = dispatchSpy.mock.calls[0][0] as Event;
      expect(lastEvent.type).toBe('auth_logout');
    });
  });

  describe('apiFetchWithAuth', () => {
    it('debe desloguear si recibe un 401', async () => {
      localStorage.setItem('access_token', 'expired-token');
      
      server.use(
        http.get(`${BASE_URL}some/protected/`, () => {
          return new HttpResponse(null, { status: 401 });
        })
      );

      const res = await apiFetchWithAuth('some/protected/');
      expect(res.status).toBe(401);
      expect(localStorage.getItem('access_token')).toBeNull(); // Se llamó a logout
    });
  });
});
