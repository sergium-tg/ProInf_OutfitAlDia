import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import Home from './Home';
import { AuthContext } from '../context/AuthContext';

vi.mock('react-router-dom', () => ({
  useHistory: () => ({ push: vi.fn() })
}));

describe('Home Component', () => {
  test('Debe renderizar el menu principal con el nombre del usuario', () => {
    const mockUser = { id: 1, nombre_usuario: 'David', email: 'test@test.com', activo: true };
    render(
      <AuthContext.Provider value={{ 
        setSession: vi.fn(), 
        clearSession: vi.fn(), 
        token: '123', 
        user: mockUser, 
        isAuthenticated: true 
      }}>
        <Home />
      </AuthContext.Provider>
    );
    expect(screen.getByText('Bienvenido, David')).toBeDefined();
    expect(screen.getByText('Gestión de Prendas')).toBeDefined();
    expect(screen.getByText('Gestión de Outfit')).toBeDefined();
    expect(screen.getByText('Ajustes de Usuario')).toBeDefined();
  });
});