import { render, screen, act } from '@testing-library/react';
import { useContext } from 'react';
import { AuthProvider, AuthContext } from '../context/AuthContext';
import { vi, describe, test, expect, beforeEach } from 'vitest';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

const TestConsumer = () => {
  const { token, user, isAuthenticated, setSession, clearSession } = useContext(AuthContext);
  return (
    <div>
      <span data-testid="token">{token ?? 'null'}</span>
      <span data-testid="user">{user ? user.email : 'null'}</span>
      <span data-testid="isAuthenticated">{String(isAuthenticated)}</span>
      <button onClick={() => setSession('tok123', { email: 'a@b.com' })}>login</button>
      <button onClick={() => clearSession()}>logout</button>
    </div>
  );
};

describe('AuthContext', () => {
  beforeEach(() => localStorageMock.clear());

  test('valores iniciales sin sesión guardada', () => {
    render(<AuthProvider><TestConsumer /></AuthProvider>);
    expect(screen.getByTestId('token').textContent).toBe('null');
    expect(screen.getByTestId('user').textContent).toBe('null');
    expect(screen.getByTestId('isAuthenticated').textContent).toBe('false');
  });

  test('setSession guarda token y usuario', () => {
    render(<AuthProvider><TestConsumer /></AuthProvider>);
    act(() => screen.getByText('login').click());
    expect(screen.getByTestId('token').textContent).toBe('tok123');
    expect(screen.getByTestId('user').textContent).toBe('a@b.com');
    expect(screen.getByTestId('isAuthenticated').textContent).toBe('true');
    expect(localStorageMock.getItem('token')).toBe('tok123');
  });

  test('clearSession limpia token y usuario', () => {
    render(<AuthProvider><TestConsumer /></AuthProvider>);
    act(() => screen.getByText('login').click());
    act(() => screen.getByText('logout').click());
    expect(screen.getByTestId('token').textContent).toBe('null');
    expect(screen.getByTestId('user').textContent).toBe('null');
    expect(screen.getByTestId('isAuthenticated').textContent).toBe('false');
    expect(localStorageMock.getItem('token')).toBeNull();
  });

  test('inicializa desde localStorage si hay sesión previa', () => {
    localStorageMock.setItem('token', 'prevTok');
    localStorageMock.setItem('user', JSON.stringify({ email: 'prev@test.com' }));
    render(<AuthProvider><TestConsumer /></AuthProvider>);
    expect(screen.getByTestId('token').textContent).toBe('prevTok');
    expect(screen.getByTestId('user').textContent).toBe('prev@test.com');
    expect(screen.getByTestId('isAuthenticated').textContent).toBe('true');
  });
});
