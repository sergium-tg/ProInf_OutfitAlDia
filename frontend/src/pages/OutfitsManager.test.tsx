import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import '@testing-library/jest-dom';
import OutfitsManager from './OutfitsManager';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';

vi.mock('axios');
vi.mock('@ionic/react', async () => {
  const actual = await vi.importActual<any>('@ionic/react');
  return {
    ...actual,
    useIonToast: () => [vi.fn()],
    // Retrasamos la ejecución milisegundos para que React Testing Library capture los cambios de estado
    useIonViewWillEnter: (cb: Function) => setTimeout(() => cb(), 0),
  };
});

describe('OutfitsManager Component', () => {
  const mockContextValue: any = {
    token: 'fake-token',
  };

  const mockPrendas = [
    { id: 1, categoria: 'Camisa', foto_url: 'camisa.jpg' },
    { id: 2, categoria: 'Pantalon', foto_url: 'pantalon.jpg' }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    (axios.get as any).mockImplementation((url: string) => {
      if (url.includes('/prendas')) return Promise.resolve({ data: mockPrendas });
      if (url.includes('/outfits')) return Promise.resolve({ data: [] });
      return Promise.reject(new Error('not found'));
    });
  });

  it('debe renderizar la previsualización por defecto', async () => {
    render(
      <AuthContext.Provider value={mockContextValue}>
        <OutfitsManager />
      </AuthContext.Provider>
    );
    
    // El waitFor soluciona el warning de "act(...)" esperando a que el DOM se asiente
    await waitFor(() => {
      expect(screen.getByText('Previsualización')).toBeInTheDocument();
    });
  });

  it('debe mostrar error visual si se intenta guardar con menos de 2 prendas', async () => {
    render(
      <AuthContext.Provider value={mockContextValue}>
        <OutfitsManager />
      </AuthContext.Provider>
    );

    await waitFor(() => {
      expect(screen.getByText('Guardar Outfit')).toBeInTheDocument();
    });

    const guardarBtn = screen.getByText('Guardar Outfit');
    fireEvent.click(guardarBtn);

    expect(axios.post).not.toHaveBeenCalled();
  });

  it('debe cargar y mostrar las prendas simuladas desde la API', async () => {
    const { container } = render(
      <AuthContext.Provider value={mockContextValue}>
        <OutfitsManager />
      </AuthContext.Provider>
    );

    await waitFor(() => {
      // Validamos que se hayan renderizado etiquetas de imagen provenientes de nuestro mock
      const images = container.querySelectorAll('ion-img');
      expect(images.length).toBeGreaterThan(0);
    });
  });
});