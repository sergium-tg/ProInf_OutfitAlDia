import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import '@testing-library/jest-dom';
import Home from './Home';
import { AuthContext } from '../context/AuthContext';

const mockPush = vi.fn();
vi.mock('react-router-dom', () => ({
  useHistory: () => ({ push: mockPush }),
}));

describe('Home Component', () => {
  const mockContextValue: any = {
    user: { nombre_usuario: 'David Astudillo' },
    clearSession: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('debe renderizar el saludo con el nombre del usuario', () => {
    render(
      <AuthContext.Provider value={mockContextValue}>
        <Home />
      </AuthContext.Provider>
    );
    expect(screen.getByText('Bienvenido, David Astudillo')).toBeInTheDocument();
  });

  it('debe navegar a la ruta /prendas al hacer clic en Gestión de Prendas', () => {
    render(
      <AuthContext.Provider value={mockContextValue}>
        <Home />
      </AuthContext.Provider>
    );
    const prendasCard = screen.getByText('Gestión de Prendas');
    fireEvent.click(prendasCard);
    expect(mockPush).toHaveBeenCalledWith('/prendas');
  });

  it('debe navegar a la ruta /outfits al hacer clic en Gestión de Outfit', () => {
    render(
      <AuthContext.Provider value={mockContextValue}>
        <Home />
      </AuthContext.Provider>
    );
    const outfitsCard = screen.getByText('Gestión de Outfit');
    fireEvent.click(outfitsCard);
    expect(mockPush).toHaveBeenCalledWith('/outfits');
  });

  it('debe limpiar la sesión y redirigir al login al cerrar sesión', () => {
    const { container } = render(
      <AuthContext.Provider value={mockContextValue}>
        <Home />
      </AuthContext.Provider>
    );
    
    // Selección directa del DOM: Así evitamos que JSDOM falle buscando roles en Web Components
    const logoutBtn = container.querySelector('ion-button');
    if (logoutBtn) fireEvent.click(logoutBtn);
    
    expect(mockContextValue.clearSession).toHaveBeenCalled();
  });
});