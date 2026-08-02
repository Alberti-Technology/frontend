import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getCompanyStatus } from '../misc.service';
import * as authService from '../auth.service';

describe('misc.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(authService, 'getHeaders').mockReturnValue({
      'Authorization': 'Token 123'
    } as any);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getCompanyStatus', () => {
    it('debe devolver el is_enabled recibido de la API', async () => {
      const fetchSpy = vi.spyOn(authService, 'apiFetchWithAuth').mockResolvedValueOnce({
        ok: true,
        json: async () => ({ is_enabled: false })
      } as any);

      const result = await getCompanyStatus();
      expect(fetchSpy).toHaveBeenCalledWith('member/company/status/', {
        headers: { 'Authorization': 'Token 123' }
      });
      expect(result).toBe(false);
    });

    it('debe devolver true si la API falla o responde sin ok', async () => {
      vi.spyOn(authService, 'apiFetchWithAuth').mockResolvedValueOnce({
        ok: false
      } as any);

      const result = await getCompanyStatus();
      expect(result).toBe(true); // Default behavior in catch/not ok
    });

    it('debe devolver true y loguear error si apiFetchWithAuth arroja error', async () => {
      vi.spyOn(authService, 'apiFetchWithAuth').mockRejectedValueOnce(new Error('Network error'));
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = await getCompanyStatus();
      expect(consoleSpy).toHaveBeenCalledWith(expect.any(Error));
      expect(result).toBe(true); // Default
    });
  });
});
