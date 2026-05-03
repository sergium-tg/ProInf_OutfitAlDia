import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import OutfitsManager from './OutfitsManager';
import { AuthContext } from '../context/AuthContext';

// Mock de axios para evitar peticiones reales a la API
vi.mock('axios');

// Mock de navegación
vi.mock('react-router-dom', () => ({
  useHistory: () => ({ push: vi.fn() }),
  Link: ({ children }: any) => <a>{children}</a>
}));

// Mock de Ionic: Ajustado para evitar el error de inicialización
vi.mock('@ionic/react', async () => {
  const actual = await vi.importActual<any>('@ionic/react');
  return {
    ...actual,
    // Usamos vi.fn() simple para que no ejecute el callback inmediatamente
    useIonViewWillEnter: vi.fn(), 
    useIonToast: () => [vi.fn()]
  };
});

describe('OutfitsManager Component', () => {
  test('Debe renderizar la vista de crear outfit', () => {
    render(
      <AuthContext.Provider value={{ 
        setSession: vi.fn(), 
        clearSession: vi.fn(), 
        token: '123', 
        user: { id: 1, nombre_usuario: 'David' } as any, 
        isAuthenticated: true 
      }}>
        <OutfitsManager />
      </AuthContext.Provider>
    );

    // Verificaciones de elementos clave en la pantalla
    expect(screen.getByText('Previsualización')).toBeDefined();
    expect(screen.getByText('Selecciona tus prendas')).toBeDefined();
    expect(screen.getByText('Guardar Outfit')).toBeDefined();
  });
});