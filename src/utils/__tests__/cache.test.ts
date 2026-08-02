import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { 
  readVerticesCacheStore, writeVerticesCacheStore,
  readMeasurementsCacheStore, writeMeasurementsCacheStore,
  readDrawCacheStore, writeDrawCacheStore,
  VERTICES_STORAGE_KEY, MEASUREMENTS_STORAGE_KEY, DRAWINGS_STORAGE_KEY
} from '../cache';

describe('cache utils', () => {
  let localStorageMock: Record<string, string>;

  beforeEach(() => {
    localStorageMock = {};
    vi.stubGlobal('localStorage', {
      getItem: vi.fn((key: string) => localStorageMock[key] || null),
      setItem: vi.fn((key: string, value: string) => {
        if (key === 'throw') throw new Error('Quota exceeded');
        localStorageMock[key] = value;
      })
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('VerticesCacheStore', () => {
    it('debe leer el caché correctamente', () => {
      localStorageMock[VERTICES_STORAGE_KEY] = JSON.stringify({ 'url1': { vertices: [], sourceWidth: 100, sourceHeight: 100 } });
      const data = readVerticesCacheStore();
      expect(data['url1']).toBeDefined();
      expect(data['url1'].sourceWidth).toBe(100);
    });

    it('debe retornar objeto vacío si hay error al parsear', () => {
      localStorageMock[VERTICES_STORAGE_KEY] = '{ bad json }';
      const data = readVerticesCacheStore();
      expect(data).toEqual({});
    });

    it('debe escribir en el caché', () => {
      const store = { 'url1': { vertices: [], sourceWidth: 100, sourceHeight: 100 } };
      const success = writeVerticesCacheStore(store);
      expect(success).toBe(true);
      expect(localStorage.setItem).toHaveBeenCalledWith(VERTICES_STORAGE_KEY, JSON.stringify(store));
    });

    it('debe manejar error al escribir (quota exceeded)', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      vi.mocked(localStorage.setItem).mockImplementationOnce(() => { throw new Error('Quota Exceeded'); });
      
      const success = writeVerticesCacheStore({});
      expect(success).toBe(false);
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('MeasurementsCacheStore', () => {
    it('debe leer el caché correctamente', () => {
      localStorageMock[MEASUREMENTS_STORAGE_KEY] = JSON.stringify({ 'url1': [{ id: 'm1', timestamp: 1 }] });
      const data = readMeasurementsCacheStore();
      expect(data['url1']).toHaveLength(1);
    });

    it('debe retornar objeto vacío si hay error al parsear', () => {
      localStorageMock[MEASUREMENTS_STORAGE_KEY] = 'invalid';
      const data = readMeasurementsCacheStore();
      expect(data).toEqual({});
    });

    it('debe escribir en el caché', () => {
      const store = { 'url1': [] };
      const success = writeMeasurementsCacheStore(store);
      expect(success).toBe(true);
      expect(localStorage.setItem).toHaveBeenCalledWith(MEASUREMENTS_STORAGE_KEY, JSON.stringify(store));
    });

    it('debe manejar error al escribir', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      vi.mocked(localStorage.setItem).mockImplementationOnce(() => { throw new Error(); });
      
      const success = writeMeasurementsCacheStore({});
      expect(success).toBe(false);
      consoleSpy.mockRestore();
    });
  });

  describe('DrawCacheStore', () => {
    it('debe leer el caché correctamente', () => {
      localStorageMock[DRAWINGS_STORAGE_KEY] = JSON.stringify({ 'url1': 'data:image/png' });
      const data = readDrawCacheStore();
      expect(data['url1']).toBe('data:image/png');
    });

    it('debe retornar objeto vacío si hay error al parsear', () => {
      localStorageMock[DRAWINGS_STORAGE_KEY] = 'invalid';
      const data = readDrawCacheStore();
      expect(data).toEqual({});
    });

    it('debe escribir en el caché', () => {
      const store = { 'url1': 'data:image/png' };
      const success = writeDrawCacheStore(store);
      expect(success).toBe(true);
      expect(localStorage.setItem).toHaveBeenCalledWith(DRAWINGS_STORAGE_KEY, JSON.stringify(store));
    });

    it('debe manejar error al escribir', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      vi.mocked(localStorage.setItem).mockImplementationOnce(() => { throw new Error(); });
      
      const success = writeDrawCacheStore({});
      expect(success).toBe(false);
      consoleSpy.mockRestore();
    });
  });
});
