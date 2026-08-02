import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LoginScreen from '../LoginScreen';
import * as api from '../../services/api';

vi.mock('../../services/api', () => ({
  login: vi.fn(),
}));

describe('LoginScreen', () => {
  const onLoginMock = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('debe renderizar los campos de usuario y contraseña', () => {
    render(<LoginScreen onLogin={onLoginMock} />);
    
    expect(screen.getByPlaceholderText('ej: diego')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Ingresá tu contraseña')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /ingresar al panel/i })).toBeInTheDocument();
  });

  it('debe mostrar error si se intenta enviar vacío', async () => {
    const user = userEvent.setup();
    render(<LoginScreen onLogin={onLoginMock} />);
    
    await user.click(screen.getByRole('button', { name: /ingresar al panel/i }));
    
    expect(screen.getByText('Usuario y contraseña son requeridos.')).toBeInTheDocument();
    expect(api.login).not.toHaveBeenCalled();
  });

  it('debe llamar a api.login y onLogin si las credenciales son correctas', async () => {
    const user = userEvent.setup();
    (api.login as any).mockResolvedValue('token123');
    
    render(<LoginScreen onLogin={onLoginMock} />);
    
    await user.type(screen.getByPlaceholderText('ej: diego'), 'admin');
    await user.type(screen.getByPlaceholderText('Ingresá tu contraseña'), '1234');
    
    await user.click(screen.getByRole('button', { name: /ingresar al panel/i }));
    
    expect(api.login).toHaveBeenCalledWith('admin', '1234');
    
    await waitFor(() => {
      expect(onLoginMock).toHaveBeenCalled();
    });
  });

  it('debe mostrar mensaje de error si api.login falla', async () => {
    const user = userEvent.setup();
    (api.login as any).mockRejectedValue(new Error('Credenciales inválidas'));
    
    render(<LoginScreen onLogin={onLoginMock} />);
    
    await user.type(screen.getByPlaceholderText('ej: diego'), 'admin');
    await user.type(screen.getByPlaceholderText('Ingresá tu contraseña'), 'wrong');
    
    await user.click(screen.getByRole('button', { name: /ingresar al panel/i }));
    
    await waitFor(() => {
      expect(screen.getByText('Credenciales inválidas')).toBeInTheDocument();
    });
  });

  it('debe alternar la visibilidad de la contraseña', async () => {
    const user = userEvent.setup();
    render(<LoginScreen onLogin={onLoginMock} />);
    
    const passwordInput = screen.getByPlaceholderText('Ingresá tu contraseña');
    expect(passwordInput).toHaveAttribute('type', 'password');
    
    const toggleBtn = screen.getByTitle('Ver contraseña');
    await user.click(toggleBtn);
    
    expect(passwordInput).toHaveAttribute('type', 'text');
    
    const toggleBtnHide = screen.getByTitle('Ocultar contraseña');
    await user.click(toggleBtnHide);
    
    expect(passwordInput).toHaveAttribute('type', 'password');
  });
});

