import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import axios from 'axios';

interface User {
  id: number;
  email: string;
  displayName: string;
  avatar: string | null;
  status: 'online' | 'away' | 'offline';
  lastSeen?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName: string) => Promise<void>;
  logout: () => void;
  updateProfile: (data: Partial<User>) => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('zentrix_token');
    const storedUser = localStorage.getItem('zentrix_user');
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
      axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const res = await axios.post('/api/auth/login', { email, password });
    const { token: newToken, user: newUser } = res.data;
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('zentrix_token', newToken);
    localStorage.setItem('zentrix_user', JSON.stringify(newUser));
    axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
  };

  const register = async (email: string, password: string, displayName: string) => {
    const res = await axios.post('/api/auth/register', { email, password, displayName });
    const { token: newToken, user: newUser } = res.data;
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('zentrix_token', newToken);
    localStorage.setItem('zentrix_user', JSON.stringify(newUser));
    axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('zentrix_token');
    localStorage.removeItem('zentrix_user');
    delete axios.defaults.headers.common['Authorization'];
  };

  const updateProfile = async (data: Partial<User>) => {
    const res = await axios.put('/api/auth/profile', data);
    const updatedUser = { ...user, ...res.data };
    setUser(updatedUser);
    localStorage.setItem('zentrix_user', JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, updateProfile, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
