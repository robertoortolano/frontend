import React from "react";
import PropTypes from "prop-types";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext"; // 👈 Assicurati che il path sia corretto

const PrivateRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();

  // Se autenticato, mostra il contenuto, altrimenti reindirizza al login
  return isAuthenticated ? children : <Navigate to="/" />;
};

export default PrivateRoute;

PrivateRoute.propTypes = {
  children: PropTypes.node.isRequired,
};