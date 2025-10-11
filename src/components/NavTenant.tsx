import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./Nav.css";

export default function NavTenant() {
  const navigate = useNavigate();
  const auth = useAuth() as any;
  const logout = auth?.logout;
  const username = localStorage.getItem("username") || "";

  const handleLogout = () => {
    logout();
    localStorage.clear();
    navigate("/");
  };

  return (
    <nav className="nav-bar">
      <div className="user-email">{username}</div>
      <ul className="nav-list">
        <li>
          <NavLink to="/projects" className="nav-link">
            Progetti
          </NavLink>
        </li>
        <li>
          <NavLink to="/tenant/fields" className="nav-link">
            Fields
          </NavLink>
        </li>
        <li>
          <NavLink to="/tenant/field-configurations" className="nav-link">
            Field Configurations
          </NavLink>
        </li>
        <li>
          <NavLink to="/tenant/field-sets" className="nav-link">
            Field Sets
          </NavLink>
        </li>
        <li>
          <NavLink to="/tenant/statuses" className="nav-link">
            Statuses
          </NavLink>
        </li>
        <li>
          <NavLink to="/tenant/workflows" className="nav-link">
            Workflows
          </NavLink>
        </li>
        <li>
          <NavLink to="/tenant/test" className="nav-link">
            Test
          </NavLink>
        </li>
        <li>
          <NavLink to="/tenant/item-types" className="nav-link">
            Item types
          </NavLink>
        </li>
        <li>
          <NavLink to="/tenant/item-type-sets" className="nav-link">
            Item type Sets
          </NavLink>
        </li>
        <li>
          <NavLink to="/tenant/roles" className="nav-link">
            Gestione Ruoli
          </NavLink>
        </li>
        <li>
          <NavLink to="/tenant/groups" className="nav-link">
            Gruppi
          </NavLink>
        </li>
        <li>
          <button onClick={handleLogout} className="nav-logout-button">
            Logout
          </button>
        </li>
      </ul>
    </nav>
  );
}

