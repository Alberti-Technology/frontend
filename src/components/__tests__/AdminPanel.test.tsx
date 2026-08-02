import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AdminPanel } from '../FileManager/AdminPanel';
import { useAppStore } from '../../store/useAppStore';
import { useCalibrationStore } from '../../store/useCalibrationStore';
import { useDataStore } from '../../store/useDataStore';

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
    checkMicrographLimit: vi.fn(),
    handleGeneratePdf: vi.fn(),
    materials: [
      {
        id: 'mat_1',
        name: 'Acero',
        muestras: [
          {
            id: 'mue_1',
            name: 'Muestra A',
            regiones: []
          }
        ]
      }
    ] as any[],
    measureEventsById: {},
    microMaterialHasModelByUrl: {},
    fixImageUrl: (url: any) => url
  };

  beforeEach(() => {
    vi.clearAllMocks();
    useAppStore.setState(useAppStore.getState(), true);
    useDataStore.setState({ ...useDataStore.getState(), expandedIds: new Set(['mat_1']) }, true);
    useCalibrationStore.setState(useCalibrationStore.getState(), true);
  });

  it('debe renderizar el título y el header de materiales', () => {
    render(<AdminPanel {...mockProps} />);
    
    expect(screen.getByText('Administrador')).toBeInTheDocument();
    expect(screen.getByText('Materiales')).toBeInTheDocument();
  });

  it('debe renderizar los materiales pasados en la propiedad materials', () => {
    render(<AdminPanel {...mockProps} />);
    
    expect(screen.getByText('Acero')).toBeInTheDocument();
  });

  it('debe mostrar muestras anidadas si el material está expandido', () => {
    render(<AdminPanel {...mockProps} />);
    
    expect(screen.getByText('Muestra A')).toBeInTheDocument();
  });

  it('debe llamar a handleClickMaterial al hacer clic en un material', async () => {
    const user = userEvent.setup();
    render(<AdminPanel {...mockProps} />);
    
    // Suponiendo que ItemRow renderiza el nombre en un elemento clickeable
    const matEl = screen.getByText('Acero');
    await user.click(matEl);
    
    expect(mockProps.handleClickMaterial).toHaveBeenCalledWith(mockProps.materials[0]);
  });

  it('debe llamar a handleHeaderMateriales al hacer clic en el encabezado Materiales', async () => {
    const user = userEvent.setup();
    render(<AdminPanel {...mockProps} />);
    
    const matHeader = screen.getByText('Materiales');
    await user.click(matHeader);
    
    expect(mockProps.handleHeaderMateriales).toHaveBeenCalled();
  });

  it('debe abrir modal de crear material al hacer clic en el botón de agregar', async () => {
    const user = userEvent.setup();
    render(<AdminPanel {...mockProps} />);
    
    const btn = screen.getByTitle('Crear Material');
    await user.click(btn);
    
    expect(useAppStore.getState().createModal).toEqual({ parentId: 'root', type: 'material' });
  });

  it('debe mostrar y ocultar la leyenda del administrador', async () => {
    const user = userEvent.setup();
    const { container } = render(<AdminPanel {...mockProps} />);
    
    const legendBtn = screen.getByTitle('Leyenda de íconos');
    await user.click(legendBtn);
    
    expect(useAppStore.getState().showAdminLegend).toBe(true);
    
    // Y probamos clickear para cerrar la leyenda
    // Como el componente AdminPanel escucha el store y renderiza condicionalmente 
    // necesitamos renderizar de nuevo o usar un hook, pero podemos invocar al click
    // El click en el overlay (div.island) cierra todo.
    const island = container.querySelector('.island');
    if (island) await user.click(island);
    expect(mockProps.closeMenu).toHaveBeenCalled();
  });

  it('debe renderizar y llamar headers de muestra, región y micrografía', async () => {
    const user = userEvent.setup();
    // Configurar el store para que todo esté expandido
    useDataStore.setState({ 
      ...useDataStore.getState(), 
      expandedIds: new Set(['mat_1', 'mue_1', 'reg_1']) 
    }, true);

    const fullMaterials = [
      {
        id: 'mat_1',
        name: 'Mat',
        muestras: [
          {
            id: 'mue_1',
            name: 'Mue',
            regiones: [
              {
                id: 'reg_1',
                name: 'Reg',
                micrografias: [
                  { id: 'mic_1', name: 'Mic', url: 'http://img.jpg', rawId: '1' }
                ]
              }
            ]
          }
        ]
      }
    ] as any[];

    const props = { ...mockProps, materials: fullMaterials };
    render(<AdminPanel {...props} />);

    // Muestras header
    const mueHeader = screen.getByText('Muestras');
    await user.click(mueHeader);
    expect(props.handleHeaderMuestras).toHaveBeenCalledWith(fullMaterials[0]);

    // Regiones header
    const regHeader = screen.getByText('Regiones');
    await user.click(regHeader);
    expect(props.handleHeaderRegiones).toHaveBeenCalledWith(fullMaterials[0].muestras[0]);

    // Micrografías header
    const micHeader = screen.getByText('Micrografías');
    await user.click(micHeader);
    expect(props.handleHeaderMicrografias).toHaveBeenCalledWith(fullMaterials[0].muestras[0].regiones[0]);

    // Click en la micrografía
    const micItem = screen.getByText('Mic');
    await user.click(micItem);
    expect(props.handleClickMicrografia).toHaveBeenCalledWith(
      fullMaterials[0].muestras[0].regiones[0].micrografias[0],
      fullMaterials[0].muestras[0].regiones[0]
    );
  });
});

