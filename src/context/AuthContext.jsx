import React, { createContext, useContext, useState, useEffect, useMemo } from "react";
import PropTypes from 'prop-types';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem("token") || null);
  const [tenantId, setTenantId] = useState(localStorage.getItem("tenantId") || null);
  const [roles, setRoles] = useState([]);

  const parseJwt = (token) => {
    try {
      return JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    } catch {
      return {};
    }
  };

  useEffect(() => {
    if (token) {
      const decoded = parseJwt(token);
      setRoles(decoded.roles || []);
    } else {
      setRoles([]);
    }
  }, [token]);

  const login = (newToken, newTenantId = null) => {
    localStorage.setItem("token", newToken);
    setToken(newToken);

    if (newTenantId !== null) {
      localStorage.setItem("tenantId", newTenantId);
      setTenantId(newTenantId);
    } else {
      localStorage.removeItem("tenantId");
      setTenantId(null);
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("tenantId");
    setToken(null);
    setTenantId(null);
    setRoles([]);
  };

  const isAuthenticated = !!token;

  const value = useMemo(() => ({
      token,
      tenantId,
      roles,
      setToken: login,
      logout,
      isAuthenticated,
      setTenantId: setTenantId,
    }), [token, tenantId, roles]);

  return (
    <AuthContext.Provider
      value={value}>
      {children}
    </AuthContext.Provider>
  );
};

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export const useAuth = () => useContext(AuthContext);
