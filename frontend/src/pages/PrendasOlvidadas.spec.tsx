import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { vi, describe, test, expect, beforeEach } from 'vitest';
import PrendasOlvidadas from '../pages/PrendasOlvidadas';
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
    useIonViewWillEnter: (fn: () => void) => fn(),
    IonPage: ({ children }: any) => <div>{children}</div>,
    IonHeader: ({ children }: any) => <div>{children}</div>,
    IonToolbar: ({ children }: any) => <div>{children}</div>,
    IonTitle: ({ children }: any) => <h1>{children}</h1>,
    IonContent: ({ children }: any) => <div>{children}</div>,
    IonGrid: ({ children }: any) => <div>{children}</div>,
    IonRow: ({ children }: any) => <div>{children}</div>,
    IonCol: ({ children }: any) => <div>{children}</div>,
    IonCard: ({ children, onClick }: any) => <div onClick={onClick}>{children}</div>,
    IonImg: ({ src }: any) => <img src={src} alt="prenda" />,
    IonButtons: ({ children }: any) => <div>{children}</div>,
    IonBackButton: () => <button>back</button>,
    IonAlert: ({ isOpen, buttons, header }: any) =>
      isOpen ? (
        <div data-testid="alert">
          <span>{header}</span>
          {buttons?.map((b: any, i: number) => (
            <button key={i} onClick={b.handler}>{b.text}</button>
          ))}
        </div>
      ) : null,
    IonActionSheet: ({ isOpen, buttons, onDidDismiss }: any) =>
      isOpen ? (
        <div data-testid="action-sheet">
          {buttons?.map((b: any, i: number) => (
            <button key={i} onClick={() => { b.handler?.(); onDidDismiss?.(); }}>{b.text}</button>
          ))}
        </div>
      ) : null,
  };
});

const mockAuthValue = {
  token: 'test-token',
  user: { id: 1, email: 'test@test.com', dias_olvido: 30 },
  setSession: vi.fn(),
  clearSession: vi.fn(),
  isAuthenticated: true,
};

const renderWithAuth = (ui: React.ReactElement) =>
  render(<AuthContext.Provider value={mockAuthValue}>{ui}</AuthContext.Provider>);

describe('PrendasOlvidadas', () => {
  beforeEach(() => {vi.clearAllMocks()});

  test('muestra mensaje de armario al día cuando no hay prendas olvidadas', async () => {
    vi.mocked(axios.get).mockResolvedValue({ data: [] });
    renderWithAuth(<PrendasOlvidadas />);
    await waitFor(() =>
      expect(screen.getByText(/armario totalmente al día/i)).toBeInTheDocument()
    );
  });

  test('renderiza prendas olvidadas', async () => {
    vi.mocked(axios.get).mockResolvedValue({
      data: [
        { id: 10, foto_url: 'http://img.com/10.jpg' },
        { id: 11, foto_url: 'http://img.com/11.jpg' },
      ],
    });
    renderWithAuth(<PrendasOlvidadas />);
    await waitFor(() => expect(screen.getAllByAltText('prenda')).toHaveLength(2));
  });

  test('no hace fetch si token es null', async () => {
    render(
      <AuthContext.Provider value={{ ...mockAuthValue, token: null }}>
        <PrendasOlvidadas />
      </AuthContext.Provider>
    );
    await waitFor(() => expect(axios.get).not.toHaveBeenCalled());
  });

  test('muestra días de olvido del usuario en el texto descriptivo', async () => {
    vi.mocked(axios.get).mockResolvedValue({ data: [] });
    renderWithAuth(<PrendasOlvidadas />);
    await waitFor(() =>
      expect(screen.getByText(/30 días/i)).toBeInTheDocument()
    );
  });

  test('abre action sheet al hacer clic en una prenda olvidada', async () => {
    vi.mocked(axios.get).mockResolvedValue({
      data: [{ id: 10, foto_url: 'http://img.com/10.jpg' }],
    });
    renderWithAuth(<PrendasOlvidadas />);
    await waitFor(() => screen.getByAltText('prenda'));
    fireEvent.click(screen.getByAltText('prenda'));
    expect(screen.getByTestId('action-sheet')).toBeInTheDocument();
  });

  test('usar prenda olvidada llama al endpoint correcto', async () => {
    vi.mocked(axios.get).mockResolvedValue({
      data: [{ id: 10, foto_url: 'http://img.com/10.jpg' }],
    });
    vi.mocked(axios.post).mockResolvedValue({});
    window.alert = vi.fn();
    renderWithAuth(<PrendasOlvidadas />);
    await waitFor(() => screen.getByAltText('prenda'));
    fireEvent.click(screen.getByAltText('prenda'));
    fireEvent.click(screen.getByText(/voy a usar/i));
    await waitFor(() =>
      expect(axios.post).toHaveBeenCalledWith(
        'http://localhost:3000/prendas/10/usar',
        { confirmar: false },
        expect.any(Object)
      )
    );
  });

  test('muestra alerta de repetición con error 409', async () => {
    vi.mocked(axios.get).mockResolvedValue({
      data: [{ id: 10, foto_url: 'http://img.com/10.jpg' }],
    });
    vi.mocked(axios.post).mockRejectedValue({
      response: { status: 409, data: { alerta: true, mensaje: 'Repetición detectada' } },
    });
    renderWithAuth(<PrendasOlvidadas />);
    await waitFor(() => screen.getByAltText('prenda'));
    fireEvent.click(screen.getByAltText('prenda'));
    fireEvent.click(screen.getByText(/voy a usar/i));
    await waitFor(() => expect(screen.getByTestId('alert')).toBeInTheDocument(), { timeout: 1000 });
  });
});
