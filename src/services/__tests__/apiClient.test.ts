import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { server } from '../../tests/mocks/server';
import { http, HttpResponse, delay } from 'msw';

vi.mock('../config/apiConfig', () => ({
  API_BASE_URL: 'http://localhost:8000/',
  API_WAKEUP_RETRY_MS: 1
}));

import { 
  apiFetch, 
  buildApiError, 
  readErrorPayload, 
  subscribeApiRecovery,
  currentRecoveryState,
  BASE_URL
} from '../apiClient';

describe('apiClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    server.resetHandlers();
  });

  describe('readErrorPayload & buildApiError', () => {
    it('debe leer payload JSON', async () => {
      const res = new Response(JSON.stringify({ error: 'Test error' }), {
        headers: { 'content-type': 'application/json' }
      });
      const payload = await readErrorPayload(res);
      expect(payload).toEqual({ error: 'Test error' });
    });

    it('debe leer payload texto plano', async () => {
      const res = new Response('Plain text error', {
        headers: { 'content-type': 'text/plain' }
      });
      const payload = await readErrorPayload(res);
      expect(payload).toEqual({ detail: 'Plain text error' });
    });

    it('debe construir un ApiRequestError correctamente', () => {
      const res = new Response(null, { status: 400 });
      const payload = { detalle: 'Mi detalle de error' };
      
      const err = buildApiError(res, payload, 'Fallback');
      expect(err.message).toBe('Mi detalle de error');
      expect(err.status).toBe(400);
      expect(err.data).toEqual(payload);
    });
  });

  describe('apiFetch & recoveryLoop', () => {
    it('debe hacer fetch de manera exitosa', async () => {
      server.use(
        http.get(`${BASE_URL}test-success/`, () => {
          return HttpResponse.json({ ok: true });
        })
      );

      const res = await apiFetch('test-success/');
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data).toEqual({ ok: true });
    });

    it('debe encolar y reintentar si el servidor devuelve 502 sin JSON (sleep)', async () => {
      let attempts = 0;
      server.use(
        http.get(`${BASE_URL}test-recovery/`, () => {
          attempts++;
          if (attempts === 1) {
            return new HttpResponse(null, { status: 502 });
          }
          return HttpResponse.json({ ok: true });
        })
      );

      const res = await apiFetch('test-recovery/');
      expect(res.status).toBe(200);
      expect(attempts).toBe(2);
    });
    
    it('debe encolar request si ocurre un error de red y luego resolverse', async () => {
      let attempts = 0;
      server.use(
        http.get(`${BASE_URL}test-network-error/`, () => {
          attempts++;
          if (attempts === 1) {
            return HttpResponse.error();
          }
          return HttpResponse.json({ ok: true });
        })
      );

      const res = await apiFetch('test-network-error/');
      expect(res.status).toBe(200);
      expect(attempts).toBe(2);
    });
  });

  describe('UI Global Loader & Subscriptions', () => {
    it('debe mostrar y ocultar el loader manual y notificar listeners', async () => {
      const listener = vi.fn();
      const unsubscribe = subscribeApiRecovery(listener);
      
      const { showGlobalLoader, hideGlobalLoader } = await import('../apiClient');
      
      const id = showGlobalLoader('Cargando...');
      expect(id).toBeDefined();
      expect(document.getElementById('api-wakeup-overlay')).toBeInTheDocument();
      expect(document.getElementById('api-wakeup-overlay')?.innerHTML).toContain('Cargando...');

      hideGlobalLoader(id);
      expect(document.getElementById('api-wakeup-overlay')?.innerHTML).toBe('');

      unsubscribe();
    });
  });

  describe('pingSpaces', () => {
    it('debe disparar requests de ping a los endpoints', async () => {
      server.use(
        http.get('https://albertitechnology-agent-api.hf.space/', () => HttpResponse.json({})),
        http.get('https://dlalberti.duckdns.org:7860/', () => HttpResponse.json({})),
        http.get('https://albertitechnology-report-api.hf.space/', () => HttpResponse.json({}))
      );
      const { pingSpaces } = await import('../apiClient');
      expect(() => pingSpaces()).not.toThrow();
    });
  });
});
