import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import api from '../api/axios';
import { User, AuthResponse } from '../types';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    setUser(null);
  }, []);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          // Attempt to fetch profile to validate token
          const response = await api.get<User>('/auth/profile'); 
          setUser(response.data);
        } catch (error) {
          console.error("Session verification failed", error);
          logout();
        }
      }
      setIsLoading(false);
    };

    checkAuth();

    // Listen for global logout events (triggered by axios 401 interceptor)
    const handleAuthLogout = () => {
      logout();
    };

    window.addEventListener('auth:logout', handleAuthLogout);
    return () => {
      window.removeEventListener('auth:logout', handleAuthLogout);
    };
  }, [logout]);

  const login = async (email: string, password: string) => {
    const response = await api.post<AuthResponse>('/auth/login', { email, password });
    const { accessToken, user } = response.data;
    localStorage.setItem('token', accessToken);
    setUser(user);
  };

  const register = async (email: string, password: string) => {
    await api.post('/auth/register', { email, password });
    // Auto-login after registration
    await login(email, password);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
