import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import Register from './Register';

vi.mock('axios');
vi.mock('react-router-dom', () => ({
  useHistory: () => ({ push: vi.fn() })
}));

describe('Register Component', () => {
  test('Debe renderizar el formulario de registro', () => {
    render(<Register />);
    expect(screen.getByText('Registro - Outfit Al Día')).toBeDefined();
    expect(screen.getByText('Crear Cuenta')).toBeDefined();
  });
});