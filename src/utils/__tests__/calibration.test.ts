import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { 
  addMicrografiaToAutoCalibrationQueue, 
  processAutoCalibrateQueue,
  autoCalibrateQueue,
  isProcessingCalibrationQueue,
  ENABLE_AUTOCALIBRATION, setEnableAutoCalibration
} from '../calibration';
import * as api from '../../services/api';

// Mocks
vi.mock('../../services/api', () => ({
  HF_BASE_URL: 'http://test-hf'
}));

const originalEnableAuto = ENABLE_AUTOCALIBRATION;

describe('calibration util', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset state
    autoCalibrateQueue.length = 0;
    // mock window y localStorage
    vi.stubGlobal('localStorage', {
      getItem: vi.fn((key) => key === 'company_enabled' ? 'true' : null)
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('addMicrografiaToAutoCalibrationQueue', () => {
    let originalEnable: boolean;

    beforeEach(() => {
      originalEnable = ENABLE_AUTOCALIBRATION, setEnableAutoCalibration;
      setEnableAutoCalibration(true);
      vi.stubGlobal('fetch', vi.fn());
      
      vi.stubGlobal('Image', class {
        onload: () => void;
        onerror: () => void;
        src: string;
        naturalWidth = 100;
        naturalHeight = 100;
        constructor() {
          this.onload = () => {};
          this.onerror = () => {};
          this.src = '';
          setTimeout(() => {
            if (this.src === 'error') this.onerror();
            else this.onload();
          }, 0);
        }
      });
      
      vi.stubGlobal('URL', {
        createObjectURL: (obj: any) => obj.size === 5 ? 'error' : 'blob-url',
        revokeObjectURL: vi.fn(),
      });
    });

    afterEach(() => {
      setEnableAutoCalibration(originalEnable);
      vi.unstubAllGlobals();
    });

    it('no debe hacer nada si ENABLE_AUTOCALIBRATION es false', () => {
      setEnableAutoCalibration(false);
      addMicrografiaToAutoCalibrationQueue(new Blob(), 'http://test.com/img.jpg');
      expect(autoCalibrateQueue.length).toBe(0);
    });

    it('debe procesar imagen y añadir a la cola exitosamente', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        text: async () => JSON.stringify({
          um_per_pixel: 2,
          scale_detection: { vertices: [[0,0], [10,10]] },
          ocr: { numero_detectado: "20" }
        })
      } as any);

      const dispatchSpy = vi.spyOn(window, 'dispatchEvent');
      
      addMicrografiaToAutoCalibrationQueue(new Blob(['123']), 'img1.jpg'); // size 3
      
      await new Promise((r) => setTimeout(r, 50));
      
      expect(dispatchSpy).toHaveBeenCalledTimes(2);
      expect(dispatchSpy.mock.calls[0][0].type).toBe('calibration_started');
      expect(dispatchSpy.mock.calls[1][0].type).toBe('calibration_updated');
    });

    it('debe manejar error de carga de imagen (onerror)', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({ ok: false } as any);

      const dispatchSpy = vi.spyOn(window, 'dispatchEvent');
      
      addMicrografiaToAutoCalibrationQueue(new Blob(['error']), 'img2.jpg'); // size 5
      
      await new Promise((r) => setTimeout(r, 50));
      
      expect(dispatchSpy).toHaveBeenCalledTimes(2);
      expect(dispatchSpy.mock.calls[0][0].type).toBe('calibration_started');
      expect(dispatchSpy.mock.calls[1][0].type).toBe('calibration_failed');
    });
  });

  describe('processAutoCalibrateQueue', () => {
    beforeEach(() => {
      // reseteamos flag
      // processAutoCalibrateQueue muta un let interno
    });

    it('no debe hacer nada si la cola está vacía', async () => {
      autoCalibrateQueue.length = 0;
      global.fetch = vi.fn();
      await processAutoCalibrateQueue();
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('debe procesar un elemento de la cola correctamente', async () => {
      autoCalibrateQueue.push({
        fd: new FormData(),
        imageUrl: 'http://img1.jpg',
        sourceWidth: 100,
        sourceHeight: 100
      });

      const mockResponse = {
        um_per_pixel: 2,
        scale_detection: { vertices: [{x:0, y:0}, {x:10, y:0}] },
        ocr: { numero_detectado: "20" }
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        text: vi.fn().mockResolvedValue(JSON.stringify(mockResponse))
      } as any);

      const dispatchEventSpy = vi.spyOn(window, 'dispatchEvent');

      await processAutoCalibrateQueue();

      expect(global.fetch).toHaveBeenCalledTimes(1);
      
      expect(dispatchEventSpy).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'calibration_updated' })
      );
    });

    it('debe disparar calibration_failed si la respuesta no es ok', async () => {
      autoCalibrateQueue.push({
        fd: new FormData(),
        imageUrl: 'http://img2.jpg',
        sourceWidth: 100,
        sourceHeight: 100
      });

      global.fetch = vi.fn().mockResolvedValue({
        ok: false
      } as any);

      const dispatchEventSpy = vi.spyOn(window, 'dispatchEvent');

      await processAutoCalibrateQueue();

      expect(dispatchEventSpy).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'calibration_failed' })
      );
    });
    
    it('debe manejar errores en la peticion', async () => {
      autoCalibrateQueue.push({
        fd: new FormData(),
        imageUrl: 'http://img3.jpg',
        sourceWidth: 100,
        sourceHeight: 100
      });

      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const dispatchEventSpy = vi.spyOn(window, 'dispatchEvent');

      await processAutoCalibrateQueue();

      expect(dispatchEventSpy).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'calibration_failed' })
      );
      expect(consoleSpy).toHaveBeenCalled();
    });
  });
});
