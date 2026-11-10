import { createContext, useState, useEffect } from 'react';
import api from '../api/axios';

export const AuthContext = createContext();

const isTokenExpired = (token) => {
    try {
        const parts = token.split('.');
        if (parts.length !== 3) return true;
        const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
        const payload = JSON.parse(atob(base64));
        if (!payload.exp) return true;
        return payload.exp * 1000 <= Date.now();
    } catch {
        return true;
    }
};

const clearStoredAuth = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('email');
    localStorage.removeItem('role');
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let active = true;

        const verifySession = async () => {
            const token = localStorage.getItem('token');
            if (!token || isTokenExpired(token)) {
                clearStoredAuth();
                if (active) setLoading(false);
                return;
            }

            try {
                // Verify token with backend and use server-returned role/email instead of trusting localStorage.role
                const response = await api.get('/auth/me');
                if (active && response.data?.email && response.data?.role) {
                    localStorage.setItem('email', response.data.email);
                    localStorage.setItem('role', response.data.role);
                    setUser({
                        email: response.data.email,
                        role: response.data.role,
                        userId: response.data.userId,
                        token
                    });
                }
            } catch {
                clearStoredAuth();
                if (active) setUser(null);
            } finally {
                if (active) setLoading(false);
            }
        };

        verifySession();

        const handleUnauthorized = () => {
            clearStoredAuth();
            if (active) setUser(null);
        };
        window.addEventListener('auth:unauthorized', handleUnauthorized);

        return () => {
            active = false;
            window.removeEventListener('auth:unauthorized', handleUnauthorized);
        };
    }, []);

    const login = (userData) => {
        localStorage.setItem('token', userData.token);
        localStorage.setItem('email', userData.email);
        localStorage.setItem('role', userData.role);
        setUser(userData);
    };

    const logout = () => {
        clearStoredAuth();
        setUser(null);
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Checking session...</div>;

    return (
        <AuthContext.Provider value={{ user, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};
