import React, { createContext, useState, useEffect, ReactNode } from 'react';

// 1. Definimos la estructura de los datos que compartiremos
interface AuthContextType {
  token: string | null;
  user: any | null;
  setSession: (token: string, user: any) => void;
  clearSession: () => void;
  isAuthenticated: boolean;
}

// 2. CREACIÓN DEL CONTEXTO (Importante: El 'export' aquí soluciona tu error)
export const AuthContext = createContext<AuthContextType>({
  token: null,
  user: null,
  setSession: () => {},
  clearSession: () => {},
  isAuthenticated: false,
});

// 3. PROVEEDOR DEL CONTEXTO
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Inicializamos el estado intentando leer lo que haya en el almacenamiento local
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [user, setUser] = useState<any | null>(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  // Función para guardar la sesión tras un login exitoso
  const setSession = (newToken: string, newUser: any) => {
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  };

  // Función para cerrar la sesión (HU-08)
  const clearSession = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  // Valor derivado para saber si hay alguien conectado
  const isAuthenticated = !!token;

  return (
    <AuthContext.Provider value={{ token, user, setSession, clearSession, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
};