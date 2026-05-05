import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { vi, describe, test, expect, beforeEach } from 'vitest';
import PrendasManager from '../pages/PrendasManager';
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
    IonFab: ({ children }: any) => <div>{children}</div>,
    IonFabButton: ({ children, onClick }: any) => <button onClick={onClick}>{children}</button>,
    IonIcon: () => <span />,
    IonGrid: ({ children }: any) => <div>{children}</div>,
    IonRow: ({ children }: any) => <div>{children}</div>,
    IonCol: ({ children }: any) => <div>{children}</div>,
    IonCard: ({ children, onClick }: any) => <div onClick={onClick}>{children}</div>,
    IonImg: ({ src }: any) => <img src={src} alt="prenda" />,
    IonButton: ({ children, onClick }: any) => <button onClick={onClick}>{children}</button>,
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
    IonSelect: ({ children, onIonChange }: any) => (
      <select onChange={e => onIonChange?.({ detail: { value: e.target.value } })}>{children}</select>
    ),
    IonSelectOption: ({ children, value }: any) => <option value={value}>{children}</option>,
    IonInput: ({ value, onIonChange }: any) => (
      <input value={value} onChange={e => onIonChange?.({ detail: { value: e.target.value } })} />
    ),
    IonItem: ({ children }: any) => <div>{children}</div>,
    IonLabel: ({ children }: any) => <label>{children}</label>,
    IonButtons: ({ children }: any) => <div>{children}</div>,
  };
});

const mockAuthValue = {
  token: 'test-token',
  user: { id: 1, email: 'test@test.com' },
  setSession: vi.fn(),
  clearSession: vi.fn(),
  isAuthenticated: true,
};

const renderWithAuth = (ui: React.ReactElement) =>
  render(<AuthContext.Provider value={mockAuthValue}>{ui}</AuthContext.Provider>);

describe('PrendasManager', () => {
  beforeEach(() => {vi.clearAllMocks()});

  test('muestra mensaje cuando no hay prendas', async () => {
    vi.mocked(axios.get).mockResolvedValue({ data: [] });
    renderWithAuth(<PrendasManager />);
    await waitFor(() =>
      expect(screen.getByText(/no se encontraron prendas/i)).toBeInTheDocument()
    );
  });

  test('renderiza prendas obtenidas del servidor', async () => {
    vi.mocked(axios.get).mockResolvedValue({
      data: [
        { id: 1, foto_url: 'http://img.com/1.jpg', historial: [] },
        { id: 2, foto_url: 'http://img.com/2.jpg', historial: [] },
      ],
    });
    renderWithAuth(<PrendasManager />);
    await waitFor(() => expect(screen.getAllByAltText('prenda')).toHaveLength(2));
  });

  test('no hace fetch si no hay token', async () => {
    vi.mocked(axios.get).mockResolvedValue({ data: [] });
    render(
      <AuthContext.Provider value={{ ...mockAuthValue, token: null }}>
        <PrendasManager />
      </AuthContext.Provider>
    );
    await waitFor(() => expect(axios.get).not.toHaveBeenCalled());
  });

  test('abre action sheet al hacer clic en una prenda', async () => {
    vi.mocked(axios.get).mockResolvedValue({
      data: [{ id: 1, foto_url: 'http://img.com/1.jpg', historial: [] }],
    });
    renderWithAuth(<PrendasManager />);
    await waitFor(() => screen.getByAltText('prenda'));
    fireEvent.click(screen.getByAltText('prenda'));
    expect(screen.getByTestId('action-sheet')).toBeInTheDocument();
  });

  test('marcar prenda como usada llama al endpoint correcto', async () => {
    vi.mocked(axios.get).mockResolvedValue({
      data: [{ id: 5, foto_url: 'http://img.com/5.jpg', historial: [] }],
    });
    vi.mocked(axios.post).mockResolvedValue({});
    window.alert = vi.fn();
    renderWithAuth(<PrendasManager />);
    await waitFor(() => screen.getByAltText('prenda'));
    fireEvent.click(screen.getByAltText('prenda'));
    fireEvent.click(screen.getByText(/voy a usar/i));
    await waitFor(() =>
      expect(axios.post).toHaveBeenCalledWith(
        'http://localhost:3000/prendas/5/usar',
        { confirmar: false },
        expect.any(Object)
      )
    );
  });

  test('muestra alerta de repetición cuando el server responde 409', async () => {
    vi.mocked(axios.get).mockResolvedValue({
      data: [{ id: 5, foto_url: 'http://img.com/5.jpg', historial: [] }],
    });
    vi.mocked(axios.post).mockRejectedValue({
      response: { status: 409, data: { alerta: true, mensaje: 'Ya la usaste recientemente' } },
    });
    renderWithAuth(<PrendasManager />);
    await waitFor(() => screen.getByAltText('prenda'));
    fireEvent.click(screen.getByAltText('prenda'));
    fireEvent.click(screen.getByText(/voy a usar/i));
    await waitFor(() => expect(screen.getByTestId('alert')).toBeInTheDocument(), { timeout: 1000 });
  });

  test('seUsoHoy retorna false si historial vacío (no muestra botón deshacer)', async () => {
    vi.mocked(axios.get).mockResolvedValue({
      data: [{ id: 1, foto_url: 'http://img.com/1.jpg', historial: [] }],
    });
    renderWithAuth(<PrendasManager />);
    await waitFor(() => screen.getByAltText('prenda'));
    fireEvent.click(screen.getByAltText('prenda'));
    expect(screen.queryByText(/deshacer uso/i)).not.toBeInTheDocument();
  });

  test('muestra botón deshacer si la prenda se usó hoy', async () => {
    const hoy = new Date().toISOString();
    vi.mocked(axios.get).mockResolvedValue({
      data: [{ id: 1, foto_url: 'http://img.com/1.jpg', historial: [{ fecha_uso: hoy }] }],
    });
    renderWithAuth(<PrendasManager />);
    await waitFor(() => screen.getByAltText('prenda'));
    fireEvent.click(screen.getByAltText('prenda'));
    expect(screen.getByText(/deshacer uso/i)).toBeInTheDocument();
  });
});
