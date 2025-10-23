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
  const { favoriteIds } = useFavorites();
  
  const [projectName, setProjectName] = useState<string>("");
  
  const pathname = location.pathname;
  const isOnProjectsPage = pathname === "/projects";
  const isInProject = projectId && pathname.startsWith(`/projects/${projectId}`);
  const isProjectFavorite = projectId ? favoriteIds.has(parseInt(projectId)) : false;
  
  // Mostra il nome del progetto se:
  // 1. Sei in un progetto specifico E il progetto è nei preferiti
  // 2. OPPURE sei nella lista progetti E hai dei preferiti
  const shouldShowProjectName = (isInProject && isProjectFavorite) || 
                               (isOnProjectsPage && favoriteIds.size > 0);

  const handleLogout = () => {
    logout();
    localStorage.clear();
    navigate("/");
  };

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  // Recupera il nome del progetto quando sei in un progetto o nella lista progetti
  useEffect(() => {
    const fetchProjectName = async () => {
      if (projectId && token) {
        // Sei in un progetto specifico
        try {
          const response = await api.get(`/projects/${projectId}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          setProjectName(response.data.name);
        } catch (err) {
          console.error("Errore nel recupero del progetto:", err);
          setProjectName("");
        }
      } else if (isOnProjectsPage && favoriteIds.size > 0 && token) {
        // Sei nella lista progetti e hai dei preferiti
        try {
          const firstFavoriteId = Array.from(favoriteIds)[0];
          const response = await api.get(`/projects/${firstFavoriteId}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          setProjectName(response.data.name);
        } catch (err) {
          console.error("Errore nel recupero del progetto preferito:", err);
          setProjectName("");
        }
      } else {
        setProjectName("");
      }
    };

    fetchProjectName();
  }, [projectId, token, favoriteIds, isOnProjectsPage]);

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

        {/* Nome del progetto corrente (solo se è nei preferiti) */}
        {shouldShowProjectName && projectName && (
          <li>
            <button
              onClick={() => {
                if (isInProject) {
                  // Sei già nel progetto, non fare nulla
                  return;
                } else {
                  // Sei nella lista progetti, vai al primo progetto preferito
                  const firstFavoriteId = Array.from(favoriteIds)[0];
                  if (firstFavoriteId) {
                    handleNavigation(`/projects/${firstFavoriteId}`);
                  }
                }
              }}
              className="nav-item-indented nav-link-favorite"
              style={{ 
                background: 'none', 
                border: 'none', 
                cursor: 'pointer',
                textAlign: 'left',
                width: '100%',
                padding: '0.5rem 1rem',
                borderRadius: '6px',
                transition: 'background-color 0.2s ease'
              }}
              onMouseEnter={(e) => {
                if (!isInProject) {
                  e.currentTarget.style.backgroundColor = '#f0f0f0';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
              title={isInProject ? "Sei già in questo progetto" : "Vai al progetto"}
            >
              {projectName}
            </button>
          </li>
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

