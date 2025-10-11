import { useNavigate, useLocation, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./Nav.css";

export default function NavProjects() {
  const navigate = useNavigate();
  const location = useLocation();
  const auth = useAuth() as any;
  const logout = auth?.logout;
  const username = localStorage.getItem("username");
  const { projectId } = useParams<{ projectId?: string }>();

  const pathname = location.pathname;

  const isOnHomePage = /^\/projects(\/\d+)?$/.test(pathname);
  const isOnProjectsPage = pathname === "/projects";
  const isOnCreatePage = pathname === "/projects/create";
  const isOnSettingsPage = /^\/projects\/\d+\/settings(\/.+)?$/.test(pathname);

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

      {!isOnProjectsPage && !isOnCreatePage && projectId && (
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

