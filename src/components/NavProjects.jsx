import React from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import './Nav.css';

export default function NavTenant() {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();
  const username = localStorage.getItem("username"); // idealmente prendi username dal context
  const { projectId } = useParams();

  const pathname = location.pathname;

  // Definisci qui le condizioni di active
  const isOnHomePage = /^\/projects(\/\d+)?$/.test(pathname);
  const isOnProjectsPage = pathname === "/projects";
  const isOnCreatePage = pathname === "/projects/create";
  const isOnSettingsPage = /^\/projects\/\d+\/settings(\/.+)?$/.test(pathname);

  const handleLogout = () => {
    logout();           // rimuove token da context e localStorage
    localStorage.clear(); // opzionale, per pulire eventuali dati extra
    navigate("/"); // redirect esplicito alla pagina login
  };

  const handleNavigation = (path) => {
    navigate(path);
  };

  return (
    <nav className="nav-bar">
      <div className="user-email">{username}</div>

      <button
        onClick={() => handleNavigation("/tenant")}
        className={`nav-item ${pathname.startsWith("/tenant") ? "active" : ""}`}
      >
        Tenant
      </button>

      <button
        onClick={() => handleNavigation("/projects")}
        className={`nav-item ${isOnProjectsPage ? "active" : ""}`}
      >
        Progetti
      </button>

      {!isOnProjectsPage && projectId && (
        <button
          onClick={() => handleNavigation(`/projects/${projectId}`)}
          className={`nav-item ${isOnHomePage ? "active" : ""}`}
        >
          Home
        </button>
      )}

      {(!isOnProjectsPage && !isOnCreatePage && projectId) && (
        <button
          onClick={() => handleNavigation(`/projects/${projectId}/settings`)}
          className={`nav-item ${isOnSettingsPage ? "active" : ""}`}
        >
          Project settings
        </button>
      )}

      {isOnProjectsPage && (
        <button
          onClick={() => handleNavigation("/projects/create")}
          className={`nav-item ${isOnCreatePage ? "active" : ""}`}
        >
          New project
        </button>
      )}

      <button onClick={handleLogout} className="nav-item">
        Logout
      </button>
    </nav>
  );
}
