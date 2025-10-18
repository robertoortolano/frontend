import { useNavigate, useLocation, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useFavorites } from "../context/FavoritesContext";
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
  
  const [projectName, setProjectName] = useState<string>("");

  const pathname = location.pathname;

  const isOnHomePage = /^\/projects(\/\d+)?$/.test(pathname);
  const isOnProjectsPage = pathname === "/projects";
  const isOnSettingsPage = /^\/projects\/\d+\/settings(\/.+)?$/.test(pathname);

  useEffect(() => {
    if (projectId && token) {
      const fetchProject = async () => {
        try {
          const response = await api.get(`/projects/${projectId}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          setProjectName(response.data.name || "");
        } catch (err) {
          console.error("Errore nel recupero del progetto:", err);
          setProjectName("");
        }
      };
      fetchProject();
    } else {
      setProjectName("");
    }
  }, [projectId, token]);

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
        <li>
          <button
            onClick={() => handleNavigation("/tenant")}
            className={`nav-link ${pathname.startsWith("/tenant") ? "active" : ""}`}
          >
            Tenant
          </button>
        </li>

        <li>
          <button
            onClick={() => handleNavigation("/projects")}
            className={`nav-link ${isOnProjectsPage ? "active" : ""}`}
          >
            Progetti
          </button>
        </li>

        {/* Progetti Preferiti - in grassetto */}
        {favoriteProjects.map((favProj) => {
          const isCurrent = projectId === String(favProj.id);
          const isActive = isCurrent && isOnHomePage;
          
          return (
            <li key={favProj.id} className="nav-item-indented">
              <button
                onClick={() => handleNavigation(`/projects/${favProj.id}`)}
                className={`nav-link nav-link-favorite ${isActive ? "active" : ""}`}
              >
                {favProj.name}
              </button>
            </li>
          );
        })}

        {/* Progetto corrente se non è nei preferiti */}
        {!isOnProjectsPage && projectId && !favoriteProjects.some(p => p.id === Number(projectId)) && (
          <li className="nav-item-indented">
            <button
              onClick={() => handleNavigation(`/projects/${projectId}`)}
              className={`nav-link ${isOnHomePage ? "active" : ""}`}
            >
              {projectName || "Progetto"}
            </button>
          </li>
        )}

        {!isOnProjectsPage && projectId && (
          <li className="nav-item-indented-2">
            <button
              onClick={() => handleNavigation(`/projects/${projectId}/settings`)}
              className={`nav-link ${isOnSettingsPage ? "active" : ""}`}
            >
              Settings
            </button>
          </li>
        )}

        <li>
          <button onClick={handleLogout} className="nav-logout-button">
            Logout
          </button>
        </li>
      </ul>
    </nav>
  );
}

