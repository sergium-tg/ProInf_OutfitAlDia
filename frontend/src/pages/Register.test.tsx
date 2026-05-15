import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import '@testing-library/jest-dom';
import Register from './Register';
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
    useIonToast: () => [vi.fn()],
  };
});

describe('Register Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('debe renderizar la vista de registro', () => {
    render(<Register />);
    expect(screen.getByText('Registro - Outfit Al Día')).toBeInTheDocument();
  });

  it('debe enviar el formulario de registro correctamente', async () => {
    (axios.post as any).mockResolvedValue({ data: { message: 'Registro exitoso' } });
    
    const { container } = render(<Register />);

    const form = container.querySelector('form');
    if (form) fireEvent.submit(form);

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalled();
    });
  });
});