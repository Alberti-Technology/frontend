import { describe, it, expect, beforeEach } from 'vitest';
import { useAppStore } from '../useAppStore';

const initialState = useAppStore.getState();

describe('useAppStore', () => {
  beforeEach(() => {
    // Restaurar el estado inicial antes de cada prueba
    useAppStore.setState(initialState, true);
    localStorage.clear();
  });

  it('debe inicializar con los valores por defecto', () => {
    const state = useAppStore.getState();
    expect(state.showAdminLegend).toBe(false);
    expect(state.galleryView).toEqual({ kind: 'none' });
    expect(state.lightboxIndex).toBeNull();
  });

  it('debe actualizar booleanos simples (showAdminLegend)', () => {
    useAppStore.getState().setShowAdminLegend(true);
    expect(useAppStore.getState().showAdminLegend).toBe(true);

    // Con función updater
    useAppStore.getState().setShowAdminLegend((prev) => !prev);
    expect(useAppStore.getState().showAdminLegend).toBe(false);
  });

  it('debe actualizar setCompanyEnabled y sincronizar con localStorage', () => {
    useAppStore.getState().setCompanyEnabled(false);
    
    expect(useAppStore.getState().companyEnabled).toBe(false);
    expect(useAppStore.getState().showDisabledCompanyModal).toBe(true); // Se muestra si se deshabilita
    expect(localStorage.getItem('company_enabled')).toBe('false');
  });

  it('debe manejar setGalleryView', () => {
    useAppStore.getState().setGalleryView({ kind: 'micrografias', images: [] });
    expect(useAppStore.getState().galleryView).toEqual({ kind: 'micrografias', images: [] });
  });

  it('debe actualizar modales', () => {
    const modalMock = { id: '1', name: 'Test', type: 'material' };
    
    useAppStore.getState().setDeleteModal(modalMock);
    expect(useAppStore.getState().deleteModal).toEqual(modalMock);

    useAppStore.getState().setDeleteModal(null);
    expect(useAppStore.getState().deleteModal).toBeNull();
  });
});
