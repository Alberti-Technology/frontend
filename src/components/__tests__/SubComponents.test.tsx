import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Collapsible, ConfirmModal, RenameModal, CreateModal, ResponsiveGallery } from '../FileManager/SubComponents';

describe('SubComponents', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Collapsible', () => {
    it('debe renderizar los hijos y cambiar el estilo según open', () => {
      const { rerender, container } = render(<Collapsible open={false}><div>Test</div></Collapsible>);
      expect(screen.getByText('Test')).toBeInTheDocument();
      // First child is the outer wrapper with grid-template-rows
      expect(container.firstChild).toHaveStyle({ gridTemplateRows: '0fr' });

      rerender(<Collapsible open={true}><div>Test</div></Collapsible>);
      expect(container.firstChild).toHaveStyle({ gridTemplateRows: '1fr' });
    });
  });

  describe('ConfirmModal', () => {
    it('debe renderizar título y mensaje y llamar a callbacks', async () => {
      const user = userEvent.setup();
      const onConfirm = vi.fn();
      const onCancel = vi.fn();
      
      render(
        <ConfirmModal 
          title="Eliminar" 
          message="¿Seguro?" 
          confirmLabel="Sí, borrar" 
          onConfirm={onConfirm} 
          onCancel={onCancel} 
        />
      );

      expect(screen.getByText('Eliminar')).toBeInTheDocument();
      expect(screen.getByText('¿Seguro?')).toBeInTheDocument();
      
      await user.click(screen.getByRole('button', { name: 'Cancelar' }));
      expect(onCancel).toHaveBeenCalled();
      
      await user.click(screen.getByRole('button', { name: 'Sí, borrar' }));
      expect(onConfirm).toHaveBeenCalled();
    });
  });

  describe('RenameModal', () => {
    it('debe permitir renombrar y llamar a onConfirm', async () => {
      const user = userEvent.setup();
      const onConfirm = vi.fn().mockResolvedValue(undefined);
      const onCancel = vi.fn();
      
      render(
        <RenameModal 
          currentName="Viejo" 
          onConfirm={onConfirm} 
          onCancel={onCancel} 
        />
      );

      const input = screen.getByDisplayValue('Viejo');
      await user.clear(input);
      await user.type(input, 'Nuevo');
      
      const saveBtn = screen.getByRole('button', { name: 'Guardar' });
      await user.click(saveBtn);
      
      await waitFor(() => {
        expect(onConfirm).toHaveBeenCalledWith('Nuevo');
      });
    });

    it('debe llamar a onCancel al clickear Cancelar', async () => {
      const user = userEvent.setup();
      const onCancel = vi.fn();
      render(<RenameModal currentName="Viejo" onConfirm={vi.fn()} onCancel={onCancel} />);
      const cancelBtn = screen.getByRole('button', { name: 'Cancelar' });
      await user.click(cancelBtn);
      expect(onCancel).toHaveBeenCalled();
    });

    it('debe mostrar errorMessage si se pasa', () => {
      render(
        <RenameModal 
          currentName="Viejo" 
          onConfirm={vi.fn()} 
          onCancel={vi.fn()} 
          errorMessage="Nombre inválido"
        />
      );
      expect(screen.getByText('Nombre inválido')).toBeInTheDocument();
    });
  });

  describe('CreateModal', () => {
    it('debe renderizar crear material y enviar', async () => {
      const user = userEvent.setup();
      const onConfirm = vi.fn();
      render(
        <CreateModal parentId="root" type="material" onConfirm={onConfirm} onCancel={vi.fn()} />
      );

      expect(screen.getByText('Añadir nuevo Material')).toBeInTheDocument();
      
      const input = screen.getByRole('textbox'); // Nombre
      await user.type(input, 'Mat1');
      
      const submitBtn = screen.getByRole('button', { name: 'Crear' });
      await user.click(submitBtn);
      
      await waitFor(() => {
        expect(onConfirm).toHaveBeenCalled();
      });
    });

    it('debe validar nombre vacío en crear material', async () => {
      const user = userEvent.setup();
      const onConfirm = vi.fn();
      render(<CreateModal parentId="root" type="material" onConfirm={onConfirm} onCancel={vi.fn()} />);
      
      const submitBtn = screen.getByRole('button', { name: 'Crear' });
      await user.click(submitBtn);
      
      expect(screen.getByText('Nombre es requerido.')).toBeInTheDocument();
      expect(onConfirm).not.toHaveBeenCalled();
    });

    it('debe renderizar crear muestra y validar imagen requerida', async () => {
      const user = userEvent.setup();
      render(
        <CreateModal parentId="mat_1" type="muestra" onConfirm={vi.fn()} onCancel={vi.fn()} />
      );

      const input = screen.getAllByRole('textbox')[0]; // Nombre
      await user.type(input, 'Mue1');
      
      const submitBtn = screen.getByRole('button', { name: 'Crear' });
      await user.click(submitBtn); // no hay imagen
      
      expect(screen.getByText('Nombre e imagen son requeridos.')).toBeInTheDocument();
    });

    it('debe renderizar carga múltiple de micrografías y fallar si no hay imágenes', async () => {
      const user = userEvent.setup();
      render(
        <CreateModal parentId="reg_1" type="micrografia" onConfirm={vi.fn()} onCancel={vi.fn()} />
      );

      expect(screen.getByText('Añadir Micrografías')).toBeInTheDocument();
      const submitBtn = screen.getByRole('button', { name: /Subir 0/ });
      await user.click(submitBtn);
      
      expect(screen.getByText('Seleccioná al menos una imagen.')).toBeInTheDocument();
    });

    it('debe llamar a onCancel', async () => {
      const user = userEvent.setup();
      const onCancel = vi.fn();
      render(<CreateModal parentId="root" type="material" onConfirm={vi.fn()} onCancel={onCancel} />);
      const cancelBtn = screen.getByRole('button', { name: 'Cancelar' });
      await user.click(cancelBtn);
      expect(onCancel).toHaveBeenCalled();
    });
  });

  describe('ResponsiveGallery', () => {
    it('debe mostrar placeholder si no hay imágenes', () => {
      render(
        <ResponsiveGallery 
          images={[]} 
          calibrableByUrl={{}} 
          calibratedByUrl={{}} 
          apiMicrografias={[]} 
          measureEventsById={{}} 
          fixImageUrl={(url: any) => url} 
          onImageClick={vi.fn()} 
        />
      );

      expect(screen.getByText('Seleccione un elemento para ver las imágenes.')).toBeInTheDocument();
    });

    it('debe renderizar imágenes correctamente y llamar onImageClick', async () => {
      const user = userEvent.setup();
      const onImageClick = vi.fn();
      render(
        <ResponsiveGallery 
          images={[{ name: 'Img 1', url: 'http://test/1.png' }]} 
          calibrableByUrl={{}} 
          calibratedByUrl={{}} 
          apiMicrografias={[]} 
          measureEventsById={{}} 
          fixImageUrl={(url: any) => url} 
          onImageClick={onImageClick} 
        />
      );

      const img = screen.getByAltText('Img 1');
      expect(img).toBeInTheDocument();
      expect(img).toHaveAttribute('src', 'http://test/1.png');

      await user.click(img);
      expect(onImageClick).toHaveBeenCalledWith({ name: 'Img 1', url: 'http://test/1.png' });
    });
  });
});

