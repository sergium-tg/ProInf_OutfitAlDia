import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import PrendaForm from './PrendaForm';
import { AuthContext } from '../context/AuthContext';

vi.mock('axios');
vi.mock('react-router-dom', () => ({
  useHistory: () => ({ push: vi.fn(), goBack: vi.fn() }),
  useParams: () => ({ id: undefined })
}));
vi.mock('@capacitor/camera', () => ({
  Camera: { getPhoto: vi.fn() },
  CameraResultType: { Uri: 'uri' },
  CameraSource: { Camera: 'camera', Photos: 'photos' }
}));

describe('PrendaForm Component', () => {
  test('Debe renderizar el formulario para crear una Nueva Prenda', () => {
    render(
      <AuthContext.Provider value={{ 
        setSession: vi.fn(), 
        clearSession: vi.fn(), 
        token: '123', 
        user: { id: 1 } as any, 
        isAuthenticated: true 
      }}>
        <PrendaForm />
      </AuthContext.Provider>
    );
    expect(screen.getByText('Nueva Prenda')).toBeDefined();
    expect(screen.getByText('Guardar Prenda')).toBeDefined();
  });
});