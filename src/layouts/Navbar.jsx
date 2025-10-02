// src/components/layout/Navbar.jsx
import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function Navbar() {
  const { isAuthenticated, logout, tenantId } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/"); // oppure "/login" se preferisci
  };

  return (
    <nav className="bg-blue-600 text-white px-4 py-3 shadow-md flex justify-between items-center">
      <div className="font-bold text-xl">MyApp</div>

      <div className="flex items-center gap-4">
        {isAuthenticated && (
          <>
            <Link to="/tenant" className="hover:underline">Home</Link>
            <Link to="/projects" className="hover:underline">Progetti</Link>
            {tenantId && (
              <span className="text-sm bg-white text-blue-600 px-2 py-1 rounded">
                Tenant: {tenantId}
              </span>
            )}
            <button onClick={handleLogout} className="hover:underline">
              Logout
            </button>
          </>
        )}

        {!isAuthenticated && (
          <Link to="/" className="hover:underline">Login</Link>
        )}
      </div>
    </nav>
  );
}
