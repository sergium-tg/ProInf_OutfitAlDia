import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import Login from './Login';
import { AuthContext } from '../context/AuthContext';

vi.mock('axios');
vi.mock('react-router-dom', () => ({
  useHistory: () => ({ push: vi.fn() }),
  Link: ({ children }: any) => <a>{children}</a>
}));

describe('Login Component', () => {
  test('Debe renderizar la vista de Iniciar Sesion correctamente', () => {
    render(
      <AuthContext.Provider value={{ 
        setSession: vi.fn(), 
        clearSession: vi.fn(), 
        token: null, 
        user: null, 
        isAuthenticated: false 
      }}>
        <Login />
      </AuthContext.Provider>
    );
    expect(screen.getByText('Iniciar Sesión')).toBeDefined();
    expect(screen.getByText('¡Bienvenida!')).toBeDefined();
    expect(screen.getByText('Entrar')).toBeDefined();
  });
});