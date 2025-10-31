import { useNavigate, useLocation, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useFavorites } from "../context/FavoritesContext";
import { useEffect, useState } from "react";
import api from "../api/api";
import "./Nav.css";

export default function NavProjects() {
  const navigate = useNavigate();
  const location = useLocation();
  const auth = useAuth() as any;
  const logout = auth?.logout;
  const token = auth?.token;
  const username = localStorage.getItem("username");
  const { projectId } = useParams<{ projectId?: string }>();
  const { favoriteProjects } = useFavorites();
  
  const pathname = location.pathname;
  const isOnProjectsPage = pathname === "/projects";

  const handleLogout = () => {
    logout();
    localStorage.clear();
    navigate("/");
  };

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  return (
    <nav className="nav-bar">
      <div className="user-email">{username}</div>
      <ul className="nav-list">
        {/* Progetti */}
        <li>
          <button
            onClick={() => handleNavigation("/projects")}
            className={`nav-link ${isOnProjectsPage ? "active" : ""}`}
          >
            Progetti
          </button>
        </li>

        {/* Progetti preferiti - mostra tutti i preferiti */}
        {favoriteProjects.length > 0 && (
          <>
            {favoriteProjects.map((favProject) => {
              const isCurrentProject = projectId && Number(projectId) === favProject.id;
              return (
                <li key={favProject.id}>
                  <button
                    onClick={() => {
                      if (!isCurrentProject) {
                        handleNavigation(`/projects/${favProject.id}`);
                      }
                    }}
                    className={`nav-item-indented nav-link-favorite ${isCurrentProject ? "active" : ""}`}
                    style={{ 
                      background: isCurrentProject ? '#00ddd4' : 'none', 
                      border: 'none', 
                      cursor: isCurrentProject ? 'default' : 'pointer',
                      textAlign: 'left',
                      width: '100%',
                      padding: '0.5rem 1rem',
                      borderRadius: '6px',
                      transition: 'background-color 0.2s ease',
                      color: isCurrentProject ? 'white' : '#1e3a8a',
                    }}
                    onMouseEnter={(e) => {
                      if (!isCurrentProject) {
                        e.currentTarget.style.backgroundColor = '#f0f0f0';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isCurrentProject) {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }
                    }}
                    title={isCurrentProject ? "Sei già in questo progetto" : `Vai a ${favProject.name}`}
                  >
                    {favProject.name}
                  </button>
                </li>
              );
            })}
          </>
        )}

        {/* Spazio separatore */}
        <li className="nav-separator"></li>

        {/* Global */}
        <li>
          <button
            onClick={() => handleNavigation("/tenant")}
            className={`nav-link ${pathname.startsWith("/tenant") ? "active" : ""}`}
          >
            Global
          </button>
        </li>

        {/* Logout */}
        <li>
          <button onClick={handleLogout} className="nav-logout-button">
            Logout
          </button>
        </li>
      </ul>
    </nav>
  );
}

