import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./Nav.css";

export default function NavTenant() {
  const navigate = useNavigate();
  const auth = useAuth() as any;
  const logout = auth?.logout;
  const username = localStorage.getItem("username") || "";
  const roles = auth?.roles || [];

  // Check if user is ADMIN (TENANT scope)
  const isAdmin = roles.some((role: any) => 
    role.name === "ADMIN" && role.scope === "TENANT"
  );

  // Check if user has any PROJECT ADMIN role
  const hasProjectAdmin = roles.some((role: any) => 
    role.name === "ADMIN" && role.scope === "PROJECT"
  );

  // Fields, Status, Item types: Tenant Admin OR any Project Admin
  const canAccessBasicFeatures = isAdmin || hasProjectAdmin;

  const handleLogout = () => {
    logout();
    localStorage.clear();
    navigate("/");
  };

  return (
    <nav className="nav-bar">
      <div className="user-email">{username}</div>
      <ul className="nav-list">
        {/* Home */}
        <li>
          <NavLink to="/tenant" className="nav-link">
            Home
          </NavLink>
        </li>

        {/* Separatore */}
        <li className="nav-separator"></li>

        {/* Fields, Status, Item types: Tenant Admin OR any Project Admin */}
        {canAccessBasicFeatures && (
          <>
            <li>
              <NavLink to="/tenant/fields" className="nav-link">
                Fields
              </NavLink>
            </li>
            <li>
              <NavLink to="/tenant/statuses" className="nav-link">
                Statuses
              </NavLink>
            </li>
            <li>
              <NavLink to="/tenant/item-types" className="nav-link">
                Item types
              </NavLink>
            </li>
          </>
        )}

        {/* Field Configurations, Field Sets, Workflows, Item type Sets, Gestione Ruoli, Gruppi, Gestione Utenti: Tenant Admin only */}
        {isAdmin && (
          <>
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
              <NavLink to="/tenant/workflows" className="nav-link">
                Workflows
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
              <NavLink to="/tenant/users" className="nav-link">
                Gestione Utenti
              </NavLink>
            </li>
          </>
        )}

        {/* Separatore */}
        <li className="nav-separator"></li>

        {/* Progetti */}
        <li>
          <NavLink to="/projects" className="nav-link">
            Progetti
          </NavLink>
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

