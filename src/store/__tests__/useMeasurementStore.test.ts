import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useMeasurementStore } from '../useMeasurementStore';
import * as cache from '../../utils/cache';

describe('useMeasurementStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(cache, 'writeMeasurementsCacheStore').mockImplementation(() => true);
    vi.spyOn(cache, 'readMeasurementsCacheStore').mockImplementation(() => ({}));
    
    useMeasurementStore.setState({
      measurementStart: null,
      measurementEnd: null,
      measurementPx: 0,
      measurementLabelPos: null,
      isMeasuring: false,
      measurementsByImageUrl: {},
      selectedMeasurementId: null,
      hoveredMeasurementId: null,
      measurementOverlayVisibleByUrl: {},
    });
  });

  it('debe actualizar estado e interactuar con el caché', () => {
    const store = useMeasurementStore.getState();

    store.setMeasurementsByImageUrl({ url1: [] });
    expect(cache.writeMeasurementsCacheStore).toHaveBeenCalledWith({ url1: [] });
    expect(useMeasurementStore.getState().measurementsByImageUrl).toEqual({ url1: [] });
  });

  it('debe actualizar otras propiedades', () => {
    const store = useMeasurementStore.getState();

    store.setMeasurementStart({ x: 10, y: 10 });
    expect(useMeasurementStore.getState().measurementStart).toEqual({ x: 10, y: 10 });

    store.setMeasurementEnd({ x: 20, y: 20 });
    expect(useMeasurementStore.getState().measurementEnd).toEqual({ x: 20, y: 20 });

    store.setMeasurementPx(15);
    expect(useMeasurementStore.getState().measurementPx).toBe(15);

    store.setMeasurementLabelPos({ x: 15, y: 15 });
    expect(useMeasurementStore.getState().measurementLabelPos).toEqual({ x: 15, y: 15 });

    store.setIsMeasuring(true);
    expect(useMeasurementStore.getState().isMeasuring).toBe(true);

    store.setSelectedMeasurementId('id1');
    expect(useMeasurementStore.getState().selectedMeasurementId).toBe('id1');

    store.setHoveredMeasurementId('id1');
    expect(useMeasurementStore.getState().hoveredMeasurementId).toBe('id1');

    store.setMeasurementOverlayVisibleByUrl({ url1: true });
    expect(useMeasurementStore.getState().measurementOverlayVisibleByUrl).toEqual({ url1: true });
  });

  it('debe actualizar propiedades con funciones updater', () => {
    const store = useMeasurementStore.getState();

    store.setMeasurementPx(prev => prev + 5);
    expect(useMeasurementStore.getState().measurementPx).toBe(5);

    store.setIsMeasuring(prev => !prev);
    expect(useMeasurementStore.getState().isMeasuring).toBe(true);

    store.setMeasurementsByImageUrl(prev => ({ ...prev, url2: [] }));
    expect(useMeasurementStore.getState().measurementsByImageUrl).toEqual({ url2: [] });
    expect(cache.writeMeasurementsCacheStore).toHaveBeenCalledWith({ url2: [] });
  });
});
