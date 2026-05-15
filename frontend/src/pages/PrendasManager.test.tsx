import { render, screen, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import '@testing-library/jest-dom';
import PrendasManager from './PrendasManager';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';

vi.mock('axios');
const mockPush = vi.fn();
vi.mock('react-router-dom', () => ({
  useHistory: () => ({ push: mockPush }),
}));

vi.mock('@ionic/react', async () => {
  const actual = await vi.importActual<any>('@ionic/react');
  return {
    ...actual,
    useIonViewWillEnter: (cb: Function) => setTimeout(() => cb(), 0),
  };
});

describe('PrendasManager Component', () => {
  const mockContextValue: any = {
    user: { id: 1, nombre_usuario: 'David Astudillo' },
    token: 'fake-token',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (axios.get as any).mockResolvedValue({
      data: [
        { id: 1, categoria: 'Camisa', foto_url: 'camisa.jpg' },
        { id: 2, categoria: 'Pantalon', foto_url: 'pantalon.jpg' }
      ]
    });
  });

  it('debe renderizar el título y cargar prendas simuladas', async () => {
    const { container } = render(
      <AuthContext.Provider value={mockContextValue}>
        <PrendasManager />
      </AuthContext.Provider>
    );

    await waitFor(() => {
      expect(screen.getByText('Mi Armario')).toBeInTheDocument();
      // Validamos que se cargaron las dos imágenes de prueba
      const images = container.querySelectorAll('ion-img');
      expect(images.length).toBe(2);
    });
  });
});