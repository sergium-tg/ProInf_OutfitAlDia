import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import '@testing-library/jest-dom';
import Profile from './Profile';
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
    useIonToast: () => [vi.fn()],
  };
});

describe('Profile Component', () => {
  const mockContextValue: any = {
    user: { email: 'david@test.com', nombre_usuario: 'David Astudillo', dias_no_rep: 7, dias_olvido: 30 },
    token: 'fake-token',
    setSession: vi.fn(),
    clearSession: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('debe renderizar los datos del usuario precargados', () => {
    const { container } = render(
      <AuthContext.Provider value={mockContextValue}>
        <Profile />
      </AuthContext.Provider>
    );
    
    // En lugar de getByDisplayValue, buscamos los elementos de Ionic 
    // que tengan exactamente esos valores asignados en sus propiedades.
    expect(container.querySelector('[value="david@test.com"]')).toBeInTheDocument();
    expect(container.querySelector('[value="David Astudillo"]')).toBeInTheDocument();
  });

  it('debe ejecutar axios.put al guardar cambios en el perfil', async () => {
    (axios.put as any).mockResolvedValue({ data: { message: 'Perfil actualizado', user: {} } });
    
    const { container } = render(
      <AuthContext.Provider value={mockContextValue}>
        <Profile />
      </AuthContext.Provider>
    );

    const form = container.querySelector('form');
    if (form) fireEvent.submit(form);

    await waitFor(() => {
      expect(axios.put).toHaveBeenCalled();
    });
  });
});