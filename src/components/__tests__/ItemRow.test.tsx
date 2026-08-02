import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ItemRow } from '../FileManager/ItemRow';
import { useAppStore } from '../../store/useAppStore';

describe('ItemRow', () => {
  const mockOnClick = vi.fn();
  const mockOnGeneratePdf = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    useAppStore.setState({
      setCreateModal: vi.fn(),
      setRenameModal: vi.fn(),
      setRenameModalError: vi.fn(),
      setDeleteModal: vi.fn(),
      companyEnabled: true,
    } as any, true);
  });

  const renderItem = (props = {}) => {
    return render(
      <ItemRow
        id="item_1"
        name="Test Item"
        type="material"
        onClick={mockOnClick}
        {...props}
      />
    );
  };

  it('debe renderizar correctamente el nombre', () => {
    renderItem();
    expect(screen.getByText('Test Item')).toBeInTheDocument();
  });

  it('debe llamar a onClick cuando se hace clic en la fila', async () => {
    const user = userEvent.setup();
    renderItem();
    await user.click(screen.getByText('Test Item'));
    expect(mockOnClick).toHaveBeenCalled();
  });

  describe('Botones de acción según el tipo', () => {
    it('Material: muestra añadir, NO muestra renombrar/eliminar', async () => {
      const user = userEvent.setup();
      renderItem({ type: 'material', id: 'mat_1' });
      
      const addBtn = screen.getByTitle('Añadir muestra');
      expect(addBtn).toBeInTheDocument();
      expect(screen.queryByTitle('Renombrar')).not.toBeInTheDocument();
      expect(screen.queryByTitle('Eliminar')).not.toBeInTheDocument();

      await user.click(addBtn);
      expect(useAppStore.getState().setCreateModal).toHaveBeenCalledWith({ parentId: '1', type: 'muestra' });
    });

    it('Muestra: muestra añadir, renombrar, eliminar y pdf', async () => {
      const user = userEvent.setup();
      renderItem({ type: 'muestra', id: 'mue_2', onGeneratePdf: mockOnGeneratePdf });
      
      const addBtn = screen.getByTitle('Añadir región');
      expect(addBtn).toBeInTheDocument();
      
      const renameBtn = screen.getByTitle('Renombrar');
      expect(renameBtn).toBeInTheDocument();
      await user.click(renameBtn);
      expect(useAppStore.getState().setRenameModal).toHaveBeenCalledWith({ id: 'mue_2', name: 'Test Item', type: 'muestra' });

      const delBtn = screen.getByTitle('Eliminar');
      expect(delBtn).toBeInTheDocument();
      await user.click(delBtn);
      expect(useAppStore.getState().setDeleteModal).toHaveBeenCalledWith({ id: 'mue_2', name: 'Test Item', type: 'muestra' });

      const pdfBtn = screen.getByTitle('Generar informe');
      expect(pdfBtn).toBeInTheDocument();
      await user.click(pdfBtn);
      expect(mockOnGeneratePdf).toHaveBeenCalled();
    });

    it('Región: muestra añadir micrografía, renombrar y eliminar', async () => {
      const user = userEvent.setup();
      renderItem({ type: 'region', id: 'reg_3' });
      
      const addBtn = screen.getByTitle('Añadir micrografía');
      expect(addBtn).toBeInTheDocument();
      await user.click(addBtn);
      expect(useAppStore.getState().setCreateModal).toHaveBeenCalledWith({ parentId: '3', type: 'micrografia' });
    });

    it('Micrografía: NO muestra añadir, pero sí renombrar y eliminar', () => {
      renderItem({ type: 'micrografia', id: 'mic_4' });
      
      expect(screen.queryByTitle('Añadir')).not.toBeInTheDocument();
      expect(screen.queryByTitle('Añadir muestra')).not.toBeInTheDocument();
      expect(screen.queryByTitle('Añadir región')).not.toBeInTheDocument();
      expect(screen.queryByTitle('Añadir micrografía')).not.toBeInTheDocument();

      expect(screen.getByTitle('Renombrar')).toBeInTheDocument();
      expect(screen.getByTitle('Eliminar')).toBeInTheDocument();
    });
  });

  describe('Estados de micrografía (Iconos IA / CM / Gráfico)', () => {
    it('debe mostrar estado calibrada', () => {
      renderItem({ type: 'micrografia', isCalibrated: true, hasModel: true });
      expect(screen.getByTitle('Calibrada')).toBeInTheDocument();
    });

    it('debe mostrar estado procesando gráfico', () => {
      renderItem({ type: 'micrografia', isChartProcessing: true, hasModel: true });
      expect(screen.getByTitle('Procesando gráfico...')).toBeInTheDocument();
    });

    it('debe mostrar estado gráfico procesado', () => {
      renderItem({ type: 'micrografia', isChartProcessed: true, hasModel: true });
      expect(screen.getByTitle('Gráfico de medición disponible')).toBeInTheDocument();
    });

    it('debe mostrar estado fallo gráfico', () => {
      renderItem({ type: 'micrografia', isChartFailed: true, hasModel: true });
      expect(screen.getByTitle('Fallo al generar gráfico')).toBeInTheDocument();
    });
  });
});

