import React, { createContext, useState, useEffect, useContext } from 'react';
import { authApi } from '../api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('access_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      if (token) {
        try {
          const response = await authApi.getMe();
          setUser(response.data);
          setIsAuthenticated(true);
        } catch (err) {
          console.error("Failed to fetch user data with token", err);
          localStorage.removeItem('access_token');
          setToken(null);
          setIsAuthenticated(false);
          setUser(null);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };
    loadUser();
  }, [token]);

  const login = async (email, password) => {
    try {
      const response = await authApi.login(email, password);
      const newToken = response.data.access_token;
      localStorage.setItem('access_token', newToken);
      setToken(newToken);
      // User data will be loaded by the useEffect hook when token changes
      return true;
    } catch (err) {
      console.error("Login failed", err);
      throw err;
    }
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    setToken(null);
    setIsAuthenticated(false);
    setUser(null);
  };

  // When registering, we don't log in automatically, just return success
  const register = async (email, password, fullName) => {
    try {
      const response = await authApi.register(email, password, fullName);
      return response.data;
    } catch (error) {
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{
      isAuthenticated,
      user,
      token,
      loading,
      login,
      logout,
      register
    }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
