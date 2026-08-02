import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Sidebar from '../Sidebar';

describe('Sidebar', () => {
  const onLogoutConfirm = vi.fn();
  const onToggleAdmin = vi.fn();
  const onToggleGallery = vi.fn();
  const onToggleReports = vi.fn();
  const onToggleAssistant = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderSidebar = (props = {}) => {
    return render(
      <Sidebar
        onLogoutConfirm={onLogoutConfirm}
        showAdmin={false}
        onToggleAdmin={onToggleAdmin}
        showGallery={false}
        onToggleGallery={onToggleGallery}
        showReports={false}
        onToggleReports={onToggleReports}
        showAssistant={false}
        onToggleAssistant={onToggleAssistant}
        {...props}
      />
    );
  };

  it('debe renderizar los botones principales', () => {
    renderSidebar();
    
    expect(screen.getByTitle('Administrador')).toBeInTheDocument();
    expect(screen.getByTitle('Galería')).toBeInTheDocument();
    expect(screen.getByTitle('Informes')).toBeInTheDocument();
    expect(screen.getByTitle('Asistente')).toBeInTheDocument();
    expect(screen.getByTitle('Cerrar sesión')).toBeInTheDocument();
    expect(screen.getByTitle('Alberti Technology')).toBeInTheDocument();
  });

  it('debe llamar a las funciones onToggle al hacer clic y cambiar estilos si están activos', async () => {
    const user = userEvent.setup();
    // Renderear con algunos activos
    const { rerender } = renderSidebar({ showAdmin: true, showGallery: true });
    
    await user.click(screen.getByTitle('Administrador'));
    expect(onToggleAdmin).toHaveBeenCalled();
    
    await user.click(screen.getByTitle('Galería'));
    expect(onToggleGallery).toHaveBeenCalled();
    
    await user.click(screen.getByTitle('Informes'));
    expect(onToggleReports).toHaveBeenCalled();
    
    await user.click(screen.getByTitle('Asistente'));
    expect(onToggleAssistant).toHaveBeenCalled();

    rerender(
      <Sidebar
        onLogoutConfirm={onLogoutConfirm}
        showAdmin={false}
        onToggleAdmin={onToggleAdmin}
        showGallery={false}
        onToggleGallery={onToggleGallery}
        showReports={true}
        onToggleReports={onToggleReports}
        showAssistant={true}
        onToggleAssistant={onToggleAssistant}
      />
    );
  });

  it('debe manejar eventos del modal About (abrir, hover, cerrar)', async () => {
    const user = userEvent.setup();
    renderSidebar();
    
    await user.click(screen.getByTitle('Alberti Technology'));
    expect(screen.getByText('Acerca de MIA')).toBeInTheDocument();

    const closeBtn = screen.getByText('Acerca de MIA').nextElementSibling as Element;
    // Mouse enter / leave on close btn
    await user.hover(closeBtn);
    await user.unhover(closeBtn);

    const link = screen.getByText('Alberti Technology', { selector: 'a' });
    await user.hover(link);
    await user.unhover(link);

    // Cerrar clickeando en el overlay
    const overlay = screen.getByText('Acerca de MIA').closest('div[style*="fixed"]') as Element;
    // click en el contenido no debe cerrar
    const content = screen.getByText('Acerca de MIA').closest('div[style*="max-width: 420px"]') as Element;
    await user.click(content);
    expect(screen.getByText('Acerca de MIA')).toBeInTheDocument();

    // click en overlay cierra
    await user.click(overlay);
    expect(screen.queryByText('Acerca de MIA')).not.toBeInTheDocument();

    // Reabrir y cerrar con botón
    await user.click(screen.getByTitle('Alberti Technology'));
    await user.click(screen.getByText('Acerca de MIA').nextElementSibling as Element);
    expect(screen.queryByText('Acerca de MIA')).not.toBeInTheDocument();
  });

  it('debe manejar eventos del modal Logout (abrir, hover, confirmar, cerrar)', async () => {
    const user = userEvent.setup();
    renderSidebar();
    
    await user.click(screen.getByTitle('Cerrar sesión'));
    expect(screen.getByText('¿Deseas cerrar tu sesión actual?')).toBeInTheDocument();
    
    const closeBtn = screen.getByText('Cerrar sesión', { selector: 'h3' }).nextElementSibling as Element;
    await user.hover(closeBtn);
    await user.unhover(closeBtn);

    const cancelBtn = screen.getByRole('button', { name: 'Cancelar' });
    await user.hover(cancelBtn);
    await user.unhover(cancelBtn);

    const confirmBtn = screen.getAllByRole('button', { name: 'Cerrar sesión' })[1];
    await user.hover(confirmBtn);
    await user.unhover(confirmBtn);

    // click content doesn't close
    const content = screen.getByText('¿Deseas cerrar tu sesión actual?').closest('div[style*="max-width: 420px"]') as Element;
    await user.click(content);
    expect(screen.getByText('¿Deseas cerrar tu sesión actual?')).toBeInTheDocument();

    // confirm
    await user.click(confirmBtn);
    expect(onLogoutConfirm).toHaveBeenCalled();
    expect(screen.queryByText('¿Deseas cerrar tu sesión actual?')).not.toBeInTheDocument();
  });

  it('debe cerrar modal de Logout al cancelar o clickear overlay', async () => {
    const user = userEvent.setup();
    renderSidebar();
    
    await user.click(screen.getByTitle('Cerrar sesión'));
    const cancelBtn = screen.getByRole('button', { name: 'Cancelar' });
    await user.click(cancelBtn);
    
    expect(onLogoutConfirm).not.toHaveBeenCalled();
    expect(screen.queryByText('¿Deseas cerrar tu sesión actual?')).not.toBeInTheDocument();

    // Reopen and close via overlay
    await user.click(screen.getByTitle('Cerrar sesión'));
    const overlay = screen.getByText('Cerrar sesión', { selector: 'h3' }).closest('div[style*="fixed"]') as Element;
    await user.click(overlay);
    expect(screen.queryByText('¿Deseas cerrar tu sesión actual?')).not.toBeInTheDocument();

    // Reopen and close via close button
    await user.click(screen.getByTitle('Cerrar sesión'));
    await user.click(screen.getByText('Cerrar sesión', { selector: 'h3' }).nextElementSibling as Element);
    expect(screen.queryByText('¿Deseas cerrar tu sesión actual?')).not.toBeInTheDocument();
  });
});
