import React, { createContext, useState, useEffect } from 'react';

export const AuthContext = createContext<any>(null);

export const AuthProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
    const [token, setToken] = useState<string | null>(localStorage.getItem('token'));

    useEffect(() => {
        if (token) localStorage.setItem('token', token);
        else localStorage.removeItem('token');
    }, [token]);

        // HU-08: Finalización de sesión [cite: 50]
        const logout = () => setToken(null);

        return (
            <AuthContext.Provider value={{ token, setToken, logout }}>
            {children}
            </AuthContext.Provider>
        );
};
