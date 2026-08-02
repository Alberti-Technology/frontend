import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { 
  getMask, 
  saveMask, 
  getInclusionClassColor, 
  generateMaskWithHf,
  detectInclusiones 
} from '../calibration.service';
import { server } from '../../tests/mocks/server';
import { http, HttpResponse, delay } from 'msw';
import { BASE_URL, HF_BASE_URL, HF_MASK_ENDPOINT } from '../apiClient';

describe('calibration.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  
  afterEach(() => {
    server.resetHandlers();
  });

  describe('getInclusionClassColor', () => {
    it('debe devolver un color según la paleta', () => {
      const c1 = getInclusionClassColor(0);
      expect(c1).toEqual([255, 0, 255]);
      
      const c8 = getInclusionClassColor(8); // Vuelve al inicio (módulo)
      expect(c8).toEqual([255, 0, 255]);
    });
  });

  describe('getMask', () => {
    it('debe devolver null si da 404', async () => {
      server.use(
        http.get(`${BASE_URL}metalografia/mask/1/`, () => {
          return new HttpResponse(null, { status: 404 });
        })
      );
      const res = await getMask(1);
      expect(res).toBeNull();
    });

    it('debe devolver los datos si existe', async () => {
      server.use(
        http.get(`${BASE_URL}metalografia/mask/1/`, () => {
          return HttpResponse.json({ mask_url: 'http://img.jpg', mask_type: 'hf' });
        })
      );
      const res = await getMask(1);
      expect(res).toEqual({ mask_url: 'http://img.jpg', mask_type: 'hf' });
    });

    it('debe lanzar error si falla (ej 500)', async () => {
      server.use(
        http.get(`${BASE_URL}metalografia/mask/1/`, () => {
          return HttpResponse.json({ error: 'Fallo' }, { status: 500 });
        })
      );
      await expect(getMask(1)).rejects.toThrow('Fallo');
    });
  });

  describe('saveMask', () => {
    it('debe enviar máscara y devolver url resultante', async () => {
      const originalFetch = global.fetch;
      const mockFetch = vi.fn().mockImplementation((url, init) => {
        if (typeof url === 'string' && url.startsWith('data:')) {
          return Promise.resolve({
            blob: () => Promise.resolve(new Blob(['img data'], { type: 'image/png' })),
            headers: new Headers({ 'content-type': 'image/png' })
          });
        }
        return originalFetch(url, init);
      });
      vi.stubGlobal('fetch', mockFetch);

      server.use(
        http.post(`${BASE_URL}metalografia/predict/1/`, () => {
          return HttpResponse.json({ image_url: 'http://new.jpg' });
        })
      );

      const res = await saveMask(1, 'data:image/png;base64,123', { '0': { name: 'A', color: [1,2,3] } });
      expect(res).toBe('http://new.jpg');

      vi.unstubAllGlobals();
    });

    it('debe lanzar error si el guardado falla', async () => {
      const originalFetch = global.fetch;
      const mockFetch = vi.fn().mockImplementation((url, init) => {
        if (typeof url === 'string' && url.startsWith('data:')) {
          return Promise.resolve({
            blob: () => Promise.resolve(new Blob(['img'], { type: 'image/png' })),
            headers: new Headers({ 'content-type': 'image/png' })
          });
        }
        return originalFetch(url, init);
      });
      vi.stubGlobal('fetch', mockFetch);

      server.use(
        http.post(`${BASE_URL}metalografia/predict/1/`, () => {
          return HttpResponse.json({ detail: 'No save' }, { status: 400 });
        })
      );

      await expect(saveMask(1, 'data:img')).rejects.toThrow('No save');
      vi.unstubAllGlobals();
    });
  });

  describe('generateMaskWithHf', () => {
    it('debe lanzar error si no se puede descargar imagen', async () => {
      const originalFetch = global.fetch;
      const mockFetch = vi.fn().mockImplementation((url, init) => {
        if (url === 'http://img.jpg') {
          return Promise.resolve({ ok: false });
        }
        return originalFetch(url, init);
      });
      vi.stubGlobal('fetch', mockFetch);

      await expect(generateMaskWithHf('http://img.jpg')).rejects.toThrow('No se pudo leer la imagen original');
      vi.unstubAllGlobals();
    });

    it('debe llamar al modelo HF y devolver dataUrl para JSON fallback', async () => {
      const originalFetch = global.fetch;
      const mockFetch = vi.fn().mockImplementation((url: string, init) => {
        if (url === 'http://img.jpg') {
          return Promise.resolve({
            ok: true,
            blob: () => Promise.resolve(new Blob(['img'], { type: 'image/jpeg' }))
          });
        }
        if (url === HF_MASK_ENDPOINT) {
          return Promise.resolve({
            ok: true,
            headers: new Headers({ 'content-type': 'application/json' }),
            json: () => Promise.resolve({ mask_url: 'http://mask.png', labels: { '0': { name: 'F', color: [0,0,0] } } })
          });
        }
        return originalFetch(url, init);
      });
      vi.stubGlobal('fetch', mockFetch);

      const res = await generateMaskWithHf('http://img.jpg');
      // En apiClient, new URL() puede agregar slash, así que probamos que contiene la url original
      expect(res.url).toContain('http://mask.png');
      expect(res.labels).toBeDefined();

      vi.unstubAllGlobals();
    });
  });

  describe('detectInclusiones', () => {
    it('debe devolver poligonos si el modelo responde', async () => {
      const mockFetch = vi.fn().mockImplementation((url: string) => {
        if (url === 'http://img.jpg') {
          return Promise.resolve({
            ok: true,
            blob: () => Promise.resolve(new Blob(['img'], { type: 'image/jpeg' }))
          });
        }
        if (url.includes('detecciones')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve([{ class_id: 1, points: [] }])
          });
        }
        return Promise.resolve({ ok: false });
      });
      vi.stubGlobal('fetch', mockFetch);

      const res = await detectInclusiones('http://img.jpg');
      expect(res).toHaveLength(1);

      vi.unstubAllGlobals();
    });
    it('debe manejar reintentos si el servidor da 502/503/504', async () => {
      vi.useFakeTimers();
      let attempts = 0;
      const mockFetch = vi.fn().mockImplementation(async (url: any, options: any) => {
        if (url === 'img.jpg' || url === 'http://img.jpg') {
          return { ok: true, blob: async () => new Blob(['123'], { type: 'image/jpeg' }) } as any;
        }
        if (url.toString().includes('HF')) return {} as any;
        attempts++;
        if (attempts < 3) {
          return { status: 503, ok: false } as any;
        }
        return { ok: true, json: async () => [{ points: [] }] } as any;
      });
      vi.stubGlobal('fetch', mockFetch);

      const promise = detectInclusiones('img.jpg');
      
      // Advance timers to trigger retries
      await vi.advanceTimersByTimeAsync(3000);
      await vi.advanceTimersByTimeAsync(6000);
      
      const result = await promise;
      expect(attempts).toBe(3);
      expect(result).toHaveLength(1);
      vi.unstubAllGlobals();
      vi.useRealTimers();
    });

    it('debe fallar si excede MAX_RETRIES en errores 503', async () => {
      vi.useFakeTimers();
      const mockFetch = vi.fn().mockImplementation(async (url: any) => {
        if (url === 'img.jpg') return { ok: true, blob: async () => new Blob(['123'], { type: 'image/jpeg' }) } as any;
        return { status: 503, ok: false } as any;
      });
      vi.stubGlobal('fetch', mockFetch);

      const promise = detectInclusiones('img.jpg');
      promise.catch(() => {}); // ignore unhandled rejection warning
      await vi.advanceTimersByTimeAsync(3000);
      await vi.advanceTimersByTimeAsync(6000);
      await vi.advanceTimersByTimeAsync(12000);

      await expect(promise).rejects.toThrow('Servidor no disponible (503)');
      vi.unstubAllGlobals();
      vi.useRealTimers();
    });

    it('debe devolver polygons si la respuesta es un objeto con esa key', async () => {
      const mockFetch = vi.fn().mockImplementation(async (url: any) => {
        if (url === 'img.jpg') return { ok: true, blob: async () => new Blob(['123'], { type: 'image/jpeg' }) } as any;
        return { ok: true, json: async () => ({ polygons: [{ points: [] }] }) } as any;
      });
      vi.stubGlobal('fetch', mockFetch);

      const result = await detectInclusiones('img.jpg');
      expect(result).toHaveLength(1);
      vi.unstubAllGlobals();
    });

    it('debe fallar si hay un error distinto y se agotan reintentos', async () => {
      vi.useFakeTimers();
      const mockFetch = vi.fn().mockImplementation(async (url: any) => {
        if (url === 'img.jpg') return { ok: true, blob: async () => new Blob(['123'], { type: 'image/jpeg' }) } as any;
        throw new Error('Network crash');
      });
      vi.stubGlobal('fetch', mockFetch);

      const promise = detectInclusiones('img.jpg');
      promise.catch(() => {}); // ignore unhandled rejection warning
      await vi.advanceTimersByTimeAsync(3000);
      await vi.advanceTimersByTimeAsync(6000);
      await vi.advanceTimersByTimeAsync(12000);

      await expect(promise).rejects.toThrow('Network crash');
      vi.unstubAllGlobals();
      vi.useRealTimers();
    });
  });

  describe('detectInclusiones edge cases', () => {
    it('debe lanzar error si no se puede descargar la imagen original', async () => {
      const originalFetch = global.fetch;
      const mockFetch = vi.fn().mockImplementation((url, init) => {
        if (url === 'http://img.jpg') {
          return Promise.resolve({ ok: false });
        }
        return originalFetch(url, init);
      });
      vi.stubGlobal('fetch', mockFetch);

      await expect(detectInclusiones('http://img.jpg')).rejects.toThrow('No se pudo leer la imagen original para detección');
      vi.unstubAllGlobals();
    });
  });

  describe('generateMaskWithHf edge cases', () => {
    it('debe usar modelInputSize y ejecutar cropMaskToContentRegion sin error', async () => {
      const originalFetch = global.fetch;
      const mockFetch = vi.fn().mockImplementation(async (url: any) => {
        if (url === 'http://img.jpg') {
          return { ok: true, blob: async () => new Blob(['123'], { type: 'image/jpeg' }) } as any;
        }
        if (url.includes('mask.png')) {
          return { ok: true, blob: async () => new Blob(['mask'], { type: 'image/png' }) } as any;
        }
        if (url.includes(HF_MASK_ENDPOINT)) {
          return { 
            ok: true, 
            headers: { get: () => 'application/json' },
            json: async () => ({ mask_url: 'mask.png' }) 
          } as any;
        }
        return { ok: false };
      });
      vi.stubGlobal('fetch', mockFetch);
      vi.stubGlobal('createImageBitmap', vi.fn().mockResolvedValue({
        width: 100, height: 100, close: vi.fn()
      }));

      const originalImage = global.Image;
      global.Image = class {
        onload: any;
        onerror: any;
        naturalWidth = 100;
        naturalHeight = 100;
        set src(val: string) {
          setTimeout(() => this.onload && this.onload(), 0);
        }
      } as any;

      const originalGetContext = HTMLCanvasElement.prototype.getContext;
      const originalToBlob = HTMLCanvasElement.prototype.toBlob;
      const originalToDataUrl = HTMLCanvasElement.prototype.toDataURL;

      HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue({
        fillStyle: '',
        fillRect: vi.fn(),
        drawImage: vi.fn(),
      }) as any;
      HTMLCanvasElement.prototype.toBlob = function(callback: any) {
        callback(new Blob(['mock'], { type: 'image/png' }));
      } as any;
      HTMLCanvasElement.prototype.toDataURL = vi.fn().mockReturnValue('data:image/png;base64,mocked');

      const result = await generateMaskWithHf('http://img.jpg', undefined, 20);
      expect(result.url).toContain('data:image/png;base64');
      
      vi.unstubAllGlobals();
      global.Image = originalImage;
      HTMLCanvasElement.prototype.getContext = originalGetContext;
      HTMLCanvasElement.prototype.toBlob = originalToBlob;
      HTMLCanvasElement.prototype.toDataURL = originalToDataUrl;
    });

    it('debe procesar respuesta JSON con labels', async () => {
      const mockFetch = vi.fn().mockImplementation(async (url: any) => {
        if (url === 'img.jpg') return { ok: true, blob: async () => new Blob(['123'], { type: 'image/jpeg' }) } as any;
        return { 
          ok: true, 
          headers: { get: () => 'application/json' },
          json: async () => ({ 
            mask_url: 'mask.png',
            labels: { '0': { name: '  Test  ', color: [255, 0, 0] }, '1': { name: null, color: 'bad' } }
          }) 
        } as any;
      });
      vi.stubGlobal('fetch', mockFetch);

      const result = await generateMaskWithHf('img.jpg');
      // result.url resolves from new URL('mask.png', HF_MASK_ENDPOINT).toString()
      expect(result.url).toContain('mask.png');
      expect(result.labels).toBeDefined();
      expect(result.labels?.['0'].name).toBe('Test');
      expect(result.labels?.['0'].color).toEqual([255, 0, 0]);
      expect(result.labels?.['1'].name).toBe('Clase 1');
      expect(result.labels?.['1'].color).toEqual([127, 127, 127]);
      vi.unstubAllGlobals();
    });

    it('debe fallar si el json no tiene mask', async () => {
      const mockFetch = vi.fn().mockImplementation(async (url: any) => {
        if (url === 'img.jpg') return { ok: true, blob: async () => new Blob(['123'], { type: 'image/jpeg' }) } as any;
        return { 
          ok: true, 
          headers: { get: () => 'application/json' },
          json: async () => ({ random: 123 }) 
        } as any;
      });
      vi.stubGlobal('fetch', mockFetch);

      await expect(generateMaskWithHf('img.jpg')).rejects.toThrow('La respuesta del modelo no contiene una máscara utilizable');
      vi.unstubAllGlobals();
    });
  });
});
