import { describe, it, expect, beforeEach } from 'vitest';
import { useDataStore } from '../useDataStore';
import { ApiMuestra } from '../../types';

const initialState = useDataStore.getState();

describe('useDataStore', () => {
  beforeEach(() => {
    // Restaurar el estado inicial antes de cada prueba
    useDataStore.setState(initialState, true);
  });

  it('debe inicializar con listas vacías y sin selección', () => {
    const state = useDataStore.getState();
    expect(state.apiMuestras).toEqual([]);
    expect(state.apiMateriales).toEqual([]);
    expect(state.selectedId).toBeNull();
    expect(state.isLoading).toBe(false);
    expect(state.expandedIds.size).toBe(0);
  });

  it('debe permitir actualizar apiMuestras y setSelectedId', () => {
    const mockMuestras: ApiMuestra[] = [
      { id: 1, name: 'Muestra 1', material_id: 1, created_at: '', updated_at: '' }
    ];

    useDataStore.getState().setApiMuestras(mockMuestras);
    expect(useDataStore.getState().apiMuestras).toHaveLength(1);
    expect(useDataStore.getState().apiMuestras[0].name).toBe('Muestra 1');

    useDataStore.getState().setSelectedId('muestra-1');
    expect(useDataStore.getState().selectedId).toBe('muestra-1');
  });

  it('debe manejar setExpandedIds con funciones actualizadoras', () => {
    const initialSet = new Set(['mat-1']);
    useDataStore.getState().setExpandedIds(initialSet);
    
    expect(useDataStore.getState().expandedIds.has('mat-1')).toBe(true);

    // Agregar uno nuevo usando callback
    useDataStore.getState().setExpandedIds((prev) => {
      const next = new Set(prev);
      next.add('mat-2');
      return next;
    });

    expect(useDataStore.getState().expandedIds.has('mat-1')).toBe(true);
    expect(useDataStore.getState().expandedIds.has('mat-2')).toBe(true);
  });
});
