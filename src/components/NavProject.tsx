import { useNavigate, useLocation, useParams } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useFavorites } from "../context/FavoritesContext";
import { Star } from "lucide-react";
import "./Nav.css";

export default function NavProject() {
  const navigate = useNavigate();
  const location = useLocation();
  const auth = useAuth() as any;
  const logout = auth?.logout;
  const token = auth?.token;
  const username = localStorage.getItem("username");
  const { projectId } = useParams<{ projectId?: string }>();
  const { favoriteProjects, favoriteIds, toggleFavorite } = useFavorites();
  
  const [isTogglingFavorite, setIsTogglingFavorite] = useState(false);

  const pathname = location.pathname;
  const roles = auth?.roles || [];

  const isOnHomePage = /^\/projects\/\d+$/.test(pathname);
  const isOnFieldConfigurationsPage = pathname.includes('/field-configurations');
  const isOnSettingsPage = /^\/projects\/\d+\/settings(\/.+)?$/.test(pathname);

  // Check if user is ADMIN (TENANT scope)
  const isTenantAdmin = roles.some((role: any) => 
    role.name === "ADMIN" && role.scope === "TENANT"
  );

  // Check if user is PROJECT ADMIN for the current project
  const isProjectAdmin = projectId && roles.some((role: any) => 
    role.name === "ADMIN" && role.scope === "PROJECT" && role.projectId === Number(projectId)
  );

  // Field Configurations: Tenant Admin OR Project Admin of the current project
  const canAccessFieldConfigurations = isTenantAdmin || isProjectAdmin;
  
  // Settings: Tenant Admin OR Project Admin of the current project
  const canAccessSettings = isTenantAdmin || isProjectAdmin;


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
        {/* Home */}
        <li>
          <button
            onClick={() => handleNavigation(`/projects/${projectId}`)}
            className={`nav-link ${isOnHomePage ? "active" : ""}`}
          >
            Home
          </button>
        </li>

        {/* Separatore dopo Home */}
        <li className="nav-separator"></li>

        {/* Field Configurations */}
        {canAccessFieldConfigurations && (
          <li>
            <button
              onClick={() => handleNavigation(`/projects/${projectId}/field-configurations`)}
              className={`nav-link ${isOnFieldConfigurationsPage ? "active" : ""}`}
            >
              Field Configurations
            </button>
          </li>
        )}

        {/* Field Sets */}
        {canAccessFieldConfigurations && (
          <li>
            <button
              onClick={() => handleNavigation(`/projects/${projectId}/field-sets`)}
              className={`nav-link ${pathname.includes('/field-sets') ? "active" : ""}`}
            >
              Field Sets
            </button>
          </li>
        )}

        {/* Settings */}
        {canAccessSettings && (
          <li>
            <button
              onClick={() => handleNavigation(`/projects/${projectId}/settings`)}
              className={`nav-link ${isOnSettingsPage ? "active" : ""}`}
            >
              Settings
            </button>
          </li>
        )}

        {/* Spazio separatore */}
        <li className="nav-separator"></li>

        {/* Progetti */}
        <li>
          <button
            onClick={() => handleNavigation("/projects")}
            className="nav-link"
          >
            Progetti
          </button>
        </li>

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
