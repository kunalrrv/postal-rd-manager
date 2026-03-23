import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const verifyToken = useCallback(async () => {
    const token = localStorage.getItem('rd_token');
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const res = await api.get('/auth/me');
      setUser(res.data);
    } catch {
      localStorage.removeItem('rd_token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    verifyToken();
  }, [verifyToken]);

  const login = async (username, password) => {
    const res = await api.post('/auth/login', { username, password });
    localStorage.setItem('rd_token', res.data.token);
    setUser({
      user_id: res.data.user_id,
      username: res.data.username,
      role: res.data.role || 'admin',
      customer_id: res.data.customer_id || '',
    });
    return res.data;
  };

  const logout = () => {
    localStorage.removeItem('rd_token');
    setUser(null);
  };

  const isAdmin = user?.role === 'admin';
  const isCustomer = user?.role === 'customer';

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, isAdmin, isCustomer }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
