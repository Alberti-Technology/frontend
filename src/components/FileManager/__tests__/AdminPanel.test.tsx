import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AdminPanel } from '../AdminPanel';
import { useAppStore } from '../../../store/useAppStore';
import { useCalibrationStore } from '../../../store/useCalibrationStore';
import { useDataStore } from '../../../store/useDataStore';
import * as helpers from '../../../utils/helpers';

describe('AdminPanel', () => {
  const mockProps = {
    closeMenu: vi.fn(),
    handleHeaderMateriales: vi.fn(),
    handleHeaderMuestras: vi.fn(),
    handleHeaderRegiones: vi.fn(),
    handleHeaderMicrografias: vi.fn(),
    handleClickMaterial: vi.fn(),
    handleClickMuestra: vi.fn(),
    handleClickRegion: vi.fn(),
    handleClickMicrografia: vi.fn(),
    checkMicrographLimit: vi.fn((cb) => cb()),
    handleGeneratePdf: vi.fn(),
    materials: [
      {
        id: 'mat_1',
        name: 'Mat 1',
        muestras: [
          {
            id: 'mue_1',
            name: 'Mue 1',
            regiones: [
              {
                id: 'reg_1',
                name: 'Reg 1',
                micrografias: [
                  { id: 'mic_1', name: 'Mic 1', url: 'img1.jpg', rawId: '1', width: 100, height: 100 }
                ]
              }
            ]
          }
        ]
      }
    ],
    measureEventsById: {
      '1': { status: 'completed', is_valid: true }
    },
    microMaterialHasModelByUrl: {
      'img1.jpg': true
    },
    fixImageUrl: (url: any) => url
  };

  beforeEach(() => {
    vi.clearAllMocks();
    useAppStore.setState({ showAdminLegend: false });
    useCalibrationStore.setState({
      calibratingByUrl: {},
      failedCalibrationByUrl: {},
      calibrationData: {
        'img1.jpg': { umByPx: 2, isAi: true }
      }
    } as any);
    useDataStore.setState({
      apiMicrografias: [{ id: '1', imagen: 'img1.jpg' }],
      expandedIds: new Set(['mat_1', 'mue_1', 'reg_1'])
    } as any);
  });

  it('debe renderizar el panel y sus elementos', () => {
    render(<AdminPanel {...mockProps} />);
    expect(screen.getByText('Administrador')).toBeInTheDocument();
    expect(screen.getByText('Mat 1')).toBeInTheDocument();
    expect(screen.getByText('Mue 1')).toBeInTheDocument();
    expect(screen.getByText('Reg 1')).toBeInTheDocument();
    expect(screen.getByText('Mic 1')).toBeInTheDocument();
  });

  it('debe abrir y cerrar la leyenda al hacer click', async () => {
    const user = userEvent.setup();
    useAppStore.setState({ showAdminLegend: true });
    
    // Espiar el método real del store
    const spy = vi.spyOn(useAppStore.getState(), 'setShowAdminLegend');
    
    render(<AdminPanel {...mockProps} />);
    expect(screen.getByText('Leyenda Administrador')).toBeInTheDocument();
    
    // Test close button
    const closeBtn = screen.getByRole('button', { name: /Leyenda de íconos/i });
    await user.click(closeBtn);
    expect(spy).toHaveBeenCalled();
  });

  it('debe llamar a setCreateModal al clickear en crear material', async () => {
    const user = userEvent.setup();
    const spy = vi.spyOn(useAppStore.getState(), 'setCreateModal');
    
    render(<AdminPanel {...mockProps} />);
    const btn = screen.getByTitle('Crear Material');
    await user.click(btn);
    expect(spy).toHaveBeenCalledWith({ parentId: 'root', type: 'material' });
  });

  it('debe llamar a los handlers de headers', async () => {
    const user = userEvent.setup();
    render(<AdminPanel {...mockProps} />);
    await user.click(screen.getByTitle('Ver todas las imágenes de Materiales'));
    expect(mockProps.handleHeaderMateriales).toHaveBeenCalled();

    await user.click(screen.getByTitle('Ver todas las muestras de Mat 1'));
    expect(mockProps.handleHeaderMuestras).toHaveBeenCalledWith(mockProps.materials[0]);

    await user.click(screen.getByTitle('Ver todas las regiones de Mue 1'));
    expect(mockProps.handleHeaderRegiones).toHaveBeenCalledWith(mockProps.materials[0].muestras[0]);

    await user.click(screen.getByTitle('Ver todas las micrografías de Reg 1'));
    expect(mockProps.handleHeaderMicrografias).toHaveBeenCalledWith(mockProps.materials[0].muestras[0].regiones[0]);
  });

  it('debe llamar a los handlers de click en items', async () => {
    const user = userEvent.setup();
    render(<AdminPanel {...mockProps} />);
    
    await user.click(screen.getByText('Mat 1'));
    expect(mockProps.handleClickMaterial).toHaveBeenCalled();

    await user.click(screen.getByText('Mue 1'));
    expect(mockProps.handleClickMuestra).toHaveBeenCalled();

    await user.click(screen.getByText('Reg 1'));
    expect(mockProps.handleClickRegion).toHaveBeenCalled();

    await user.click(screen.getByText('Mic 1'));
    expect(mockProps.handleClickMicrografia).toHaveBeenCalled();
  });
});

