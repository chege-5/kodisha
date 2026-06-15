import { createContext, createElement, useContext, useState, useEffect, useCallback } from 'react';
import api, { clearSessionAccessToken, setSessionAccessToken } from '../utils/apiClient';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('user');
      const storedRole = localStorage.getItem('role');
      if (stored && storedRole) {
        setUser(JSON.parse(stored));
        setRole(storedRole);
      }
    } catch (e) {
      localStorage.removeItem('user');
      localStorage.removeItem('role');
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (identifier, password) => {
    const { data } = await api.post('/auth/smart-login', { identifier, password });
    const sessionRole = data.role || data.user?.role || null;
    const sessionUser = sessionRole ? { ...data.user, role: sessionRole } : data.user;
    setSessionAccessToken(data.accessToken);
    localStorage.setItem('user', JSON.stringify(sessionUser));
    localStorage.setItem('role', sessionRole);
    setUser(sessionUser);
    setRole(sessionRole);
    return data;
  }, []);

  const logout = useCallback(async () => {
    await api.post('/auth/logout', {}).catch(() => {});
    clearSessionAccessToken();
    localStorage.removeItem('user');
    localStorage.removeItem('role');
    setUser(null);
    setRole(null);
  }, []);

  const value = {
    user,
    role,
    loading,
    login,
    logout,
    isLandlord: role === 'LANDLORD',
    isCaretaker: role === 'CARETAKER',
    isTenant: role === 'TENANT',
    isAdmin: role === 'ADMIN',
  };

  return createElement(AuthContext.Provider, { value }, children);
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
}
