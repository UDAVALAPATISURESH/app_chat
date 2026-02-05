import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../utils/axiosConfig';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));

  useEffect(() => {
    if (token) {
      // Verify token and get user info
      api.get('/api/user/profile')
        .then(res => {
          setUser(res.data.user);
          setLoading(false);
        })
        .catch((err) => {
          console.error('Profile fetch error:', err);
          // Only clear token if it's actually invalid (401)
          if (err.response?.status === 401) {
            localStorage.removeItem('token');
            setToken(null);
          }
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, [token]);

  const login = (userData, authToken) => {
    setUser(userData);
    setToken(authToken);
    localStorage.setItem('token', authToken);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
