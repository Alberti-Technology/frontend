import { describe, it, expect, beforeEach } from 'vitest';
import { useCalibrationStore } from '../useCalibrationStore';

describe('useCalibrationStore', () => {
  beforeEach(() => {
    useCalibrationStore.setState({
      calibratingByUrl: {},
      failedCalibrationByUrl: {},
      calibrationData: {},
      lastMicrometers: 100,
      maskByImageUrl: {},
      maskLabelsByImageUrl: {},
      maskVisibleByImageUrl: {},
      maskLoadingByImageUrl: {},
      inclusionsByImageUrl: {},
      inclusionsVisibleByImageUrl: {},
      inclusionsLoadingByImageUrl: {},
    });
  });

  it('debe inicializar con los valores por defecto', () => {
    const state = useCalibrationStore.getState();
    expect(state.calibratingByUrl).toEqual({});
    expect(state.lastMicrometers).toBe(100);
  });

  it('debe actualizar el estado con un valor directo', () => {
    const store = useCalibrationStore.getState();
    store.setLastMicrometers(200);
    expect(useCalibrationStore.getState().lastMicrometers).toBe(200);
    
    store.setFailedCalibrationByUrl({ 'url1': true });
    expect(useCalibrationStore.getState().failedCalibrationByUrl).toEqual({ 'url1': true });
  });

  it('debe actualizar el estado con una función updater', () => {
    const store = useCalibrationStore.getState();
    
    // Testeamos varias funciones updater
    store.setCalibratingByUrl(prev => ({ ...prev, url1: true }));
    expect(useCalibrationStore.getState().calibratingByUrl).toEqual({ url1: true });

    store.setCalibrationData(prev => ({ ...prev, url2: { pixelLength: 10, micrometers: 5 } }));
    expect(useCalibrationStore.getState().calibrationData).toEqual({ url2: { pixelLength: 10, micrometers: 5 } });
    
    store.setMaskByImageUrl(prev => ({ ...prev, url1: 'mask1' }));
    expect(useCalibrationStore.getState().maskByImageUrl).toEqual({ url1: 'mask1' });

    store.setMaskLabelsByImageUrl(prev => ({ ...prev, url1: {} }));
    expect(useCalibrationStore.getState().maskLabelsByImageUrl).toEqual({ url1: {} });

    store.setMaskVisibleByImageUrl(prev => ({ ...prev, url1: true }));
    expect(useCalibrationStore.getState().maskVisibleByImageUrl).toEqual({ url1: true });

    store.setMaskLoadingByImageUrl(prev => ({ ...prev, url1: true }));
    expect(useCalibrationStore.getState().maskLoadingByImageUrl).toEqual({ url1: true });

    store.setInclusionsByImageUrl(prev => ({ ...prev, url1: [] }));
    expect(useCalibrationStore.getState().inclusionsByImageUrl).toEqual({ url1: [] });

    store.setInclusionsVisibleByImageUrl(prev => ({ ...prev, url1: true }));
    expect(useCalibrationStore.getState().inclusionsVisibleByImageUrl).toEqual({ url1: true });

    store.setInclusionsLoadingByImageUrl(prev => ({ ...prev, url1: true }));
    expect(useCalibrationStore.getState().inclusionsLoadingByImageUrl).toEqual({ url1: true });
  });
});
