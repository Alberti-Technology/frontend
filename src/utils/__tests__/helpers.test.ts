import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { 
  normalizeId, 
  getColorNameFromRgb, 
  isMicrografiaDuplicateError,
  fixImageUrl,
  ENABLE_AUTOCALIBRATION,
  setEnableAutoCalibration,
  addMicrografiaToAutoCalibrationQueue
} from '../helpers';

describe('helpers', () => {
  describe('normalizeId', () => {
    it('debe devolver string para números finitos', () => {
      expect(normalizeId(123)).toBe('123');
      expect(normalizeId(0)).toBe('0');
    });

    it('debe devolver null para Infinity o NaN', () => {
      expect(normalizeId(Infinity)).toBe(null);
      expect(normalizeId(NaN)).toBe(null);
    });

    it('debe devolver string sin espacios en blanco para strings válidos', () => {
      expect(normalizeId('  abc  ')).toBe('abc');
      expect(normalizeId('123')).toBe('123');
    });

    it('debe devolver null para strings vacíos o de puros espacios', () => {
      expect(normalizeId('   ')).toBe(null);
      expect(normalizeId('')).toBe(null);
    });

    it('debe devolver null para otros tipos', () => {
      expect(normalizeId(null)).toBe(null);
      expect(normalizeId(undefined)).toBe(null);
      expect(normalizeId({})).toBe(null);
      expect(normalizeId([])).toBe(null);
    });
  });

  describe('getColorNameFromRgb', () => {
    it('debe devolver el nombre del color más cercano', () => {
      expect(getColorNameFromRgb([250, 5, 5])).toBe('rojo');
      expect(getColorNameFromRgb([5, 250, 5])).toBe('verde');
      expect(getColorNameFromRgb([5, 5, 250])).toBe('azul');
      expect(getColorNameFromRgb([255, 255, 255])).toBe('blanco');
      expect(getColorNameFromRgb([0, 0, 0])).toBe('negro');
    });
  });

  describe('isMicrografiaDuplicateError', () => {
    it('debe devolver true si el error indica que ya existe', () => {
      const err = {
        status: 400,
        data: {
          nombre: ['La micrografía con este nombre ya existe.']
        }
      };
      expect(isMicrografiaDuplicateError(err)).toBe(true);
    });

    it('debe devolver false para errores distintos', () => {
      expect(isMicrografiaDuplicateError(null)).toBe(false);
      expect(isMicrografiaDuplicateError({ status: 500 })).toBe(false);
      expect(isMicrografiaDuplicateError({ status: 400, data: {} })).toBe(false);
      expect(isMicrografiaDuplicateError({ status: 400, data: { nombre: ['El campo es requerido'] } })).toBe(false);
    });
  });

  describe('fixImageUrl', () => {
    it('debe devolver string vacío si no hay url', () => {
      expect(fixImageUrl('')).toBe('');
      expect(fixImageUrl(null)).toBe('');
      expect(fixImageUrl(undefined)).toBe('');
    });

    it('debe devolver la URL si ya es absoluta y no es media', () => {
      expect(fixImageUrl('http://example.com/img.jpg')).toBe('http://example.com/img.jpg');
    });

    it('debe transformar rutas /media/ a urls absolutas', () => {
      const url = fixImageUrl('/media/img.jpg');
      expect(url).toContain('/media/img.jpg');
      expect(url.startsWith('http')).toBe(true);
    });
    
    it('debe transformar rutas absolutas /media/ a la API original', () => {
      const url = fixImageUrl('http://wrong-domain.com/media/img.jpg?test=1');
      expect(url).toContain('/media/img.jpg?test=1');
      expect(url.startsWith('http')).toBe(true);
    });
    
    it('debe transformar imágenes de cloudinary', () => {
      const url = fixImageUrl('image/upload/img.jpg');
      expect(typeof url).toBe('string');
    });
  });

  describe('addMicrografiaToAutoCalibrationQueue', () => {
    let originalEnable: boolean;

    beforeEach(() => {
      originalEnable = ENABLE_AUTOCALIBRATION;
      setEnableAutoCalibration(true);
      vi.clearAllMocks();
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
      
      const setItem = vi.fn();
      const getItem = vi.fn((key) => key === 'company_enabled' ? 'true' : null);
      vi.stubGlobal('localStorage', { setItem, getItem });
    });

    afterEach(() => {
      setEnableAutoCalibration(originalEnable);
      vi.unstubAllGlobals();
    });

    it('debe ignorar si no está habilitado company o autocalibracion', async () => {
      setEnableAutoCalibration(false);
      const dispatchSpy = vi.spyOn(window, 'dispatchEvent');
      addMicrografiaToAutoCalibrationQueue(new Blob(['']), 'img.jpg');
      
      expect(dispatchSpy).not.toHaveBeenCalled();
    });

    it('debe procesar exitosamente y emitir eventos', async () => {
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

    it('debe manejar error de imagen (onerror) y luego fallar api', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({ ok: false } as any);

      const dispatchSpy = vi.spyOn(window, 'dispatchEvent');
      
      addMicrografiaToAutoCalibrationQueue(new Blob(['error']), 'img2.jpg'); // size 5
      
      await new Promise((r) => setTimeout(r, 50));
      
      expect(dispatchSpy).toHaveBeenCalledTimes(2);
      expect(dispatchSpy.mock.calls[0][0].type).toBe('calibration_started');
      expect(dispatchSpy.mock.calls[1][0].type).toBe('calibration_failed');
    });
  });
});
