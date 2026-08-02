import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { generatePdf, getReportList, trackReportStatus, getReportInfo } from '../reports.service';
import * as authService from '../auth.service';
import * as apiClient from '../apiClient';

describe('reports.service', () => {
  const mockViteEnv = 'http://test-report-api';

  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
    vi.stubEnv('VITE_REPORT_API_URL', mockViteEnv);
    const getItem = vi.fn((key: string) => {
      if (key === 'user_fullname') return 'John Doe';
      if (key === 'username') return 'johndoe';
      return null;
    });
    vi.stubGlobal('localStorage', { getItem });
    
    vi.spyOn(authService, 'getHeaders').mockReturnValue({
      'Authorization': 'Token 123',
      'Content-Type': 'application/json'
    } as any);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
    vi.clearAllMocks();
  });

  describe('generatePdf', () => {
    const mockConfig = {
      include_masks: true,
      include_histograms: false,
      custom_text: 'Test',
      manual_conclusion: 'End',
      send_email: false
    };

    it('debe realizar un POST a /api/reports/generate exitosamente', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, url: 'http://test.com/report.pdf' })
      } as any);

      const result = await generatePdf(123, mockConfig);
      
      expect(fetch).toHaveBeenCalledWith(`${mockViteEnv}/api/reports/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          muestra_id: 123,
          config: mockConfig,
          operador_nombre: 'John Doe',
          operador_username: 'johndoe'
        })
      });
      expect(result).toEqual({ success: true, url: 'http://test.com/report.pdf' });
    });

    it('debe arrojar error al fallar la petición de generación', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'bad req' }),
        status: 400
      } as any);

      const readPayloadSpy = vi.spyOn(apiClient, 'readErrorPayload').mockResolvedValueOnce({ error: 'bad req' });
      const buildErrorSpy = vi.spyOn(apiClient, 'buildApiError').mockReturnValueOnce(new Error('Test API error'));

      await expect(generatePdf(123, mockConfig)).rejects.toThrow('Test API error');
      
      expect(readPayloadSpy).toHaveBeenCalled();
      expect(buildErrorSpy).toHaveBeenCalled();
    });
  });

  describe('getReportList', () => {
    it('debe hacer GET a /api/reports/list?username=', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ([{ id: 1 }, { id: 2 }])
      } as any);

      const result = await getReportList();
      expect(fetch).toHaveBeenCalledWith(`${mockViteEnv}/api/reports/list?username=johndoe`, {
        method: 'GET'
      });
      expect(result).toHaveLength(2);
    });

    it('debe arrojar error si falla la respuesta', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({ ok: false } as any);
      await expect(getReportList()).rejects.toThrow('Error fetching report list');
    });
  });

  describe('trackReportStatus', () => {
    it('debe hacer GET a /api/reports/track/:id', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: 'processing' })
      } as any);

      const result = await trackReportStatus('task-123');
      expect(fetch).toHaveBeenCalledWith(`${mockViteEnv}/api/reports/track/task-123`, {
        method: 'GET'
      });
      expect(result.status).toBe('processing');
    });

    it('debe arrojar error si falla el track', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({ ok: false } as any);
      await expect(trackReportStatus('task-123')).rejects.toThrow('Error fetching report tracking status');
    });
  });

  describe('getReportInfo', () => {
    it('debe invocar apiFetchWithAuth para la url reports/:id/', async () => {
      const fetchSpy = vi.spyOn(authService, 'apiFetchWithAuth').mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 456, name: 'Rep' })
      } as any);

      const result = await getReportInfo(456);
      expect(fetchSpy).toHaveBeenCalledWith('reports/456/', expect.any(Object));
      expect(result.id).toBe(456);
    });

    it('debe arrojar error si falla getReportInfo', async () => {
      vi.spyOn(authService, 'apiFetchWithAuth').mockResolvedValueOnce({ ok: false } as any);
      await expect(getReportInfo(456)).rejects.toThrow('Error fetching report');
    });
  });
});
