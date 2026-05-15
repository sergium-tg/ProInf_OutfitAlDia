import { render, screen, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import '@testing-library/jest-dom';
import PrendasOlvidadas from './PrendasOlvidadas';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';

vi.mock('axios');
vi.mock('react-router-dom', () => ({
  useHistory: () => ({ push: vi.fn() }),
}));

vi.mock('@ionic/react', async () => {
  const actual = await vi.importActual<any>('@ionic/react');
  return {
    ...actual,
    useIonViewWillEnter: (cb: Function) => setTimeout(() => cb(), 0),
  };
});

describe('PrendasOlvidadas Component', () => {
  const mockContextValue: any = {
    user: { dias_olvido: 30 },
    token: 'fake-token',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (axios.get as any).mockResolvedValue({
      data: [
        { id: 1, foto_url: 'olvidada1.jpg' },
        { id: 2, foto_url: 'olvidada2.jpg' }
      ]
    });
  });

  it('debe renderizar el título y cargar prendas simuladas', async () => {
    const { container } = render(
      <AuthContext.Provider value={mockContextValue}>
        <PrendasOlvidadas />
      </AuthContext.Provider>
    );

    await waitFor(() => {
      expect(screen.getByText('Prendas Olvidadas')).toBeInTheDocument();
      const images = container.querySelectorAll('ion-img');
      expect(images.length).toBe(2);
    });
  });
});