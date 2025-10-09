// src/context/AuthContext.js
import { createContext, useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/api';

const AuthContext = createContext(null);

// Funzione per decodificare il JWT
const decodeJWT = (token) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Error decoding JWT:', error);
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [tenantId, setTenantId] = useState(localStorage.getItem('tenantId') || '');
  const [roles, setRoles] = useState([]);
  const navigate = useNavigate();

  // Set the auth token in axios defaults and local storage
  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token);
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // Decodifica il token per estrarre i ruoli e tenantId
      const decoded = decodeJWT(token);
      if (decoded) {
        setRoles(decoded.roles || []);
        if (decoded.tenantId) {
          setTenantId(decoded.tenantId.toString());
        }
      }
    } else {
      delete api.defaults.headers.common['Authorization'];
      localStorage.removeItem('token');
      setRoles([]);
    }
  }, [token]);

  // Handle tenant ID changes
  useEffect(() => {
    if (tenantId) {
      localStorage.setItem('tenantId', tenantId);
    } else {
      localStorage.removeItem('tenantId');
    }
  }, [tenantId]);

  const login = (token) => {
    setToken(token);
  };

  const logout = () => {
    setToken('');
    setTenantId('');
    setRoles([]);
    navigate('/login');
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        tenantId,
        roles,
        isAuthenticated: !!token,
        setToken: login,
        setTenantId,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};