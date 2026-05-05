import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { vi, describe, test, expect, beforeEach } from 'vitest';
import Profile from '../pages/Profile';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';

vi.mock('axios');

const mockPush = vi.fn();
vi.mock('react-router-dom', () => ({
  useHistory: () => ({ push: mockPush }),
}));

const mockPresent = vi.fn();
vi.mock('@ionic/react', async () => {
  const actual = await vi.importActual<any>('@ionic/react');
  return {
    ...actual,
    useIonToast: () => [mockPresent],
    IonPage: ({ children }: any) => <div>{children}</div>,
    IonHeader: ({ children }: any) => <div>{children}</div>,
    IonToolbar: ({ children }: any) => <div>{children}</div>,
    IonTitle: ({ children }: any) => <h1>{children}</h1>,
    IonContent: ({ children }: any) => <div>{children}</div>,
    IonItem: ({ children }: any) => <div>{children}</div>,
    IonLabel: ({ children }: any) => <label>{children}</label>,
    IonInput: ({ value, onIonInput, type, disabled, readonly }: any) => (
      <input
        value={value ?? ''}
        type={type ?? 'text'}
        disabled={disabled || readonly}
        onChange={e => onIonInput?.({ detail: { value: e.target.value } })}
        data-testid={type === 'password' ? 'password-input' : undefined}
      />
    ),
    IonButton: ({ children, onClick, type }: any) => (
      <button onClick={onClick} type={type ?? 'button'}>{children}</button>
    ),
    IonText: ({ children }: any) => <span>{children}</span>,
    IonLoading: () => null,
    IonAlert: ({ isOpen, buttons, header }: any) =>
      isOpen ? (
        <div data-testid="alert">
          <span>{header}</span>
          {buttons?.map((b: any, i: number) => (
            <button key={i} onClick={b.handler}>{b.text}</button>
          ))}
        </div>
      ) : null,
    IonButtons: ({ children }: any) => <div>{children}</div>,
    IonIcon: () => <span />,
  };
});

const mockUser = {
  id: 1,
  email: 'test@test.com',
  nombre_usuario: 'TestUser',
  dias_no_rep: 7,
  dias_olvido: 30,
};

const mockAuthValue = {
  token: 'test-token',
  user: mockUser,
  setSession: vi.fn(),
  clearSession: vi.fn(),
  isAuthenticated: true,
};

const renderWithAuth = (authOverrides = {}) =>
  render(
    <AuthContext.Provider value={{ ...mockAuthValue, ...authOverrides }}>
      <Profile />
    </AuthContext.Provider>
  );

describe('Profile', () => {
  beforeEach(() => {vi.clearAllMocks()});

  test('renderiza los datos del usuario correctamente', () => {
    renderWithAuth();
    expect(screen.getByDisplayValue('test@test.com')).toBeInTheDocument();
    expect(screen.getByDisplayValue('TestUser')).toBeInTheDocument();
  });

  test('redirige a /login si no hay usuario', () => {
    renderWithAuth({ user: null });
    expect(mockPush).toHaveBeenCalledWith('/login');
  });

  test('muestra error si las contraseñas no coinciden', async () => {
    renderWithAuth();
    const inputs = screen.getAllByTestId('password-input');
    fireEvent.change(inputs[0], { target: { value: 'Password@1' } });
    fireEvent.change(inputs[1], { target: { value: 'Password@2' } });
    fireEvent.submit(document.querySelector('form')!);
    
    await waitFor(() =>
      expect(screen.getByText(/contraseñas no coinciden/i)).toBeInTheDocument()
    );
  });

  test('guarda perfil correctamente y redirige a /home', async () => {
    vi.mocked(axios.patch).mockResolvedValue({
      data: { user: { ...mockUser, nombre_usuario: 'NuevoNombre' } },
    });
    renderWithAuth();
    const form = document.querySelector('form')!;
    fireEvent.submit(form);
    await waitFor(() => expect(axios.patch).toHaveBeenCalled());
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/home'));
  });

  test('muestra error cuando falla el patch', async () => {
    vi.mocked(axios.patch).mockRejectedValue({
      response: { data: { error: 'Error del servidor' } },
    });
    renderWithAuth();
    fireEvent.submit(document.querySelector('form')!);
    await waitFor(() =>
      expect(screen.getByText(/error del servidor/i)).toBeInTheDocument()
    );
  });

  test('handleLogout llama clearSession y redirige a /login', () => {
    renderWithAuth();
    fireEvent.click(screen.getByText(/cerrar sesión/i));
    expect(mockAuthValue.clearSession).toHaveBeenCalled();
    expect(mockPush).toHaveBeenCalledWith('/login');
  });

  test('botón eliminar cuenta muestra alerta de confirmación', () => {
    renderWithAuth();
    fireEvent.click(screen.getByText(/eliminar mi cuenta/i));
    expect(screen.getByTestId('alert')).toBeInTheDocument();
  });

  test('confirmar eliminación llama al endpoint y redirige', async () => {
    vi.mocked(axios.delete).mockResolvedValue({});
    renderWithAuth();
    fireEvent.click(screen.getByText(/eliminar mi cuenta/i));
    fireEvent.click(screen.getByText('Eliminar'));
    await waitFor(() => expect(axios.delete).toHaveBeenCalledWith(
      'http://localhost:3000/user/account',
      expect.any(Object)
    ));
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/register'));
  });

  test('muestra error si falla la eliminación de cuenta', async () => {
    vi.mocked(axios.delete).mockRejectedValue(new Error('fail'));
    renderWithAuth();
    fireEvent.click(screen.getByText(/eliminar mi cuenta/i));
    fireEvent.click(screen.getByText('Eliminar'));
    await waitFor(() =>
      expect(screen.getByText(/no se pudo eliminar/i)).toBeInTheDocument()
    );
  });
});
