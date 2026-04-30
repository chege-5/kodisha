import { createContext, createElement, useContext, useState, useEffect, useCallback } from 'react';
import api from '../utils/apiClient';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('user');
    const storedRole = localStorage.getItem('role');
    if (stored && storedRole) {
      setUser(JSON.parse(stored));
      setRole(storedRole);
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (email, password, loginRole = 'LANDLORD') => {
    const endpoints = {
      LANDLORD: '/auth/login',
      ADMIN: '/auth/login',   // Admin logs in via landlord endpoint (isAdmin flag)
      TENANT: '/auth/tenant/login',
      CARETAKER: '/auth/caretaker/login',
    };
    const useEmail = loginRole === 'LANDLORD' || loginRole === 'ADMIN';
    const body = useEmail ? { email, password } : { phone: email, password };
    const { data } = await api.post(endpoints[loginRole], body);
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    localStorage.setItem('user', JSON.stringify(data.user));
    localStorage.setItem('role', data.role);
    setUser(data.user);
    setRole(data.role);
    return data;
  }, []);

  const logout = useCallback(async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    await api.post('/auth/logout', { refreshToken }).catch(() => {});
    localStorage.clear();
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
