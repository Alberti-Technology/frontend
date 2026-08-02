import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useFileManagerLogic } from '../useFileManagerLogic';
import * as api from '../../services/api';
import { useAppStore } from '../../store/useAppStore';
import { useDataStore } from '../../store/useDataStore';
import * as helpers from '../../utils/helpers';

// Mock de la API
vi.mock('../../services/api', () => ({
  getMuestras: vi.fn().mockResolvedValue([]),
  getMateriales: vi.fn().mockResolvedValue([]),
  getRegiones: vi.fn().mockResolvedValue([]),
  getMicrografias: vi.fn().mockResolvedValue([]),
  getCompanyStatus: vi.fn().mockResolvedValue({ enabled: true }),
  createMuestra: vi.fn().mockResolvedValue({ id: 1 }),
  deleteMuestra: vi.fn().mockResolvedValue(undefined),
  updateMuestra: vi.fn().mockResolvedValue({ id: 1, name: 'Renamed' }),
  
  createMaterial: vi.fn().mockResolvedValue({ id: 1 }),
  
  createRegion: vi.fn().mockResolvedValue({ id: 1 }),
  deleteRegion: vi.fn().mockResolvedValue(undefined),
  updateRegion: vi.fn().mockResolvedValue({ id: 1 }),
  
  createMicrografia: vi.fn().mockResolvedValue({ id: 1, imagen: 'img.jpg' }),
  deleteMicrografia: vi.fn().mockResolvedValue(undefined),
  updateMicrografia: vi.fn().mockResolvedValue({ id: 1 }),
}));

vi.mock('../../utils/helpers', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../utils/helpers')>();
  return {
    ...actual,
    isMicrografiaDuplicateError: vi.fn().mockReturnValue(false),
    addMicrografiaToAutoCalibrationQueue: vi.fn(),
  };
});

describe('useFileManagerLogic', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    localStorage.setItem('access_token', 'token');
    
    // Resetear stores
    useAppStore.setState(useAppStore.getInitialState ? useAppStore.getInitialState() : {});
    useDataStore.setState(useDataStore.getInitialState ? useDataStore.getInitialState() : {});
  });

  describe('fetchAll', () => {
    it('debe hacer fetchAll y popular el store', async () => {
      const { result } = renderHook(() => useFileManagerLogic());

      await act(async () => {
        await result.current.fetchAll();
      });

      expect(api.getMuestras).toHaveBeenCalled();
      expect(api.getMateriales).toHaveBeenCalled();
      expect(useAppStore.getState().companyEnabled).toBe(true);
    });

    it('debe manejar error en fetchAll silenciosamente', async () => {
      const { result } = renderHook(() => useFileManagerLogic());
      vi.mocked(api.getMuestras).mockRejectedValueOnce(new Error('Fetch failed'));

      await act(async () => {
        await result.current.fetchAll();
      });

      // Debe limpiar el loading state
      expect(useDataStore.getState().isLoading).toBe(false);
    });
  });

  describe('handleDelete', () => {
    it('debe manejar la eliminación de un elemento y refrescar', async () => {
      const { result } = renderHook(() => useFileManagerLogic());

      await act(async () => {
        await result.current.handleDelete('mue_1', 'muestra');
        await result.current.handleDelete('reg_1', 'region');
        await result.current.handleDelete('mic_1', 'micrografia');
      });

      expect(api.deleteMuestra).toHaveBeenCalledWith('1');
      expect(api.deleteRegion).toHaveBeenCalledWith('1');
      expect(api.deleteMicrografia).toHaveBeenCalledWith('1');
    });

    it('debe mostrar error si falla la eliminación', async () => {
      const { result } = renderHook(() => useFileManagerLogic());
      vi.mocked(api.deleteMuestra).mockRejectedValueOnce(new Error('Error'));

      await act(async () => {
        await result.current.handleDelete('mue_1', 'muestra');
      });

      expect(result.current.toastNotifications).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ tone: 'error', message: 'No se pudo eliminar el elemento.' })
        ])
      );
    });
  });

  describe('handleRename', () => {
    it('debe manejar el renombrado de un elemento', async () => {
      const { result } = renderHook(() => useFileManagerLogic());

      await act(async () => {
        await result.current.handleRename('mue_1', 'muestra', 'Nuevo Nombre');
        await result.current.handleRename('reg_1', 'region', 'Nuevo Nombre');
        await result.current.handleRename('mic_1', 'micrografia', 'Nuevo Nombre');
      });

      expect(api.updateMuestra).toHaveBeenCalled();
      expect(api.updateRegion).toHaveBeenCalled();
      expect(api.updateMicrografia).toHaveBeenCalled();
      expect(useAppStore.getState().renameModalError).toBeNull();
    });

    it('debe validar que el nombre no esté vacío al renombrar', async () => {
      const { result } = renderHook(() => useFileManagerLogic());

      await act(async () => {
        await result.current.handleRename('mue_1', 'muestra', '   ');
      });

      expect(api.updateMuestra).not.toHaveBeenCalled();
      expect(useAppStore.getState().renameModalError).toBe('El nombre es requerido.');
    });

    it('debe mostrar error si falla el renombrado', async () => {
      const { result } = renderHook(() => useFileManagerLogic());
      vi.mocked(api.updateMuestra).mockRejectedValueOnce(new Error('Error'));

      await act(async () => {
        await result.current.handleRename('mue_1', 'muestra', 'Nuevo Nombre');
      });

      expect(result.current.toastNotifications).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ tone: 'error', message: 'No se pudo renombrar el elemento.' })
        ])
      );
    });
  });

  describe('handleCreate', () => {
    it('debe manejar creaciones simples (muestra, region, material, micrografia simple)', async () => {
      const { result } = renderHook(() => useFileManagerLogic());
      
      const fd = new FormData();
      fd.append('nombre', 'Test');

      // Test Muestra
      act(() => { useAppStore.setState({ createModal: { type: 'muestra', initialParentId: '0' } }); });
      await act(async () => { await result.current.handleCreate([fd]); });
      expect(api.createMuestra).toHaveBeenCalled();

      // Test Region
      act(() => { useAppStore.setState({ createModal: { type: 'region', initialParentId: '0' } }); });
      await act(async () => { await result.current.handleCreate([fd]); });
      expect(api.createRegion).toHaveBeenCalled();

      // Test Material
      act(() => { useAppStore.setState({ createModal: { type: 'material', initialParentId: '0' } }); });
      await act(async () => { await result.current.handleCreate([fd]); });
      expect(api.createMaterial).toHaveBeenCalled();
    });

    it('debe manejar creación de multiples micrografías', async () => {
      const { result } = renderHook(() => useFileManagerLogic());
      
      const fd1 = new FormData(); fd1.append('region', '1'); fd1.append('imagen', new Blob(['']));
      const fd2 = new FormData(); fd2.append('region', '1'); fd2.append('imagen', new Blob(['']));

      act(() => { useAppStore.setState({ createModal: { type: 'micrografia', initialParentId: '1' } }); });
      
      await act(async () => {
        await result.current.handleCreate([fd1, fd2]);
      });

      expect(api.createMicrografia).toHaveBeenCalledTimes(2);
      expect(helpers.addMicrografiaToAutoCalibrationQueue).toHaveBeenCalledTimes(2);
    });

    it('debe manejar errores en la creación simple', async () => {
      const { result } = renderHook(() => useFileManagerLogic());
      act(() => { useAppStore.setState({ createModal: { type: 'muestra', initialParentId: '0' } }); });
      vi.mocked(api.createMuestra).mockRejectedValueOnce(new Error('Error'));

      const fd = new FormData();
      await act(async () => {
        await result.current.handleCreate([fd]);
      });

      expect(result.current.toastNotifications).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ tone: 'error', message: 'Error inesperado en la creación. Revisa los datos.' })
        ])
      );
    });
    
    it('debe manejar errores y duplicados en creación multiple de micrografias', async () => {
      const { result } = renderHook(() => useFileManagerLogic());
      act(() => { useAppStore.setState({ createModal: { type: 'micrografia', initialParentId: '1' } }); });
      
      vi.mocked(api.createMicrografia).mockRejectedValueOnce(new Error('Duplicate'));
      vi.mocked(helpers.isMicrografiaDuplicateError).mockReturnValueOnce(true);
      
      const fd1 = new FormData(); fd1.append('region', '1');
      const fd2 = new FormData(); fd1.append('region', '1'); // second fails

      await act(async () => {
        await result.current.handleCreate([fd1, fd2]);
      });

      expect(result.current.toastNotifications).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ tone: 'error', message: 'No se pudo crear: ya existe en la región seleccionada.' })
        ])
      );
    });
  });

  describe('pushToast and removeToast', () => {
    it('debe agregar y quitar un toast', async () => {
      vi.useFakeTimers();
      const { result } = renderHook(() => useFileManagerLogic());

      let id = 0;
      act(() => {
        id = result.current.pushToast('Test msg', 'success', 1000);
      });

      expect(result.current.toastNotifications).toHaveLength(1);
      expect(result.current.toastNotifications[0].message).toBe('Test msg');
      expect(result.current.toastNotifications[0].id).toBe(id);

      act(() => {
        result.current.removeToast(id);
      });

      expect(result.current.toastNotifications[0].leaving).toBe(true);

      act(() => {
        vi.advanceTimersByTime(300); // 260ms remove delay
      });

      expect(result.current.toastNotifications).toHaveLength(0);

      vi.useRealTimers();
    });
  });
});
