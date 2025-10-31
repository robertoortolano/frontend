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
          <NavLink to="/tenant" className="nav-link" end>
            Home
          </NavLink>
        </li>

        {/* Separatore */}
        <li className="nav-separator"></li>

        {/* Fields, Status, Item types: Tenant Admin OR any Project Admin */}
        {canAccessBasicFeatures && (
          <>
            <li>
              <NavLink to="/tenant/fields" className="nav-link" end>
                Fields
              </NavLink>
            </li>
            <li>
              <NavLink to="/tenant/statuses" className="nav-link" end>
                Statuses
              </NavLink>
            </li>
            <li>
              <NavLink to="/tenant/item-types" className="nav-link" end>
                Item types
              </NavLink>
            </li>
          </>
        )}

        {/* Field Configurations, Field Sets, Workflows, Item type Sets, Gestione Ruoli, Gruppi, Gestione Utenti: Tenant Admin only */}
        {isAdmin && (
          <>
            <li>
              <NavLink to="/tenant/field-configurations" className="nav-link" end>
                Field Configurations
              </NavLink>
            </li>
            <li>
              <NavLink to="/tenant/field-sets" className="nav-link" end>
                Field Sets
              </NavLink>
            </li>
            <li>
              <NavLink to="/tenant/workflows" className="nav-link" end>
                Workflows
              </NavLink>
            </li>
            <li>
              <NavLink to="/tenant/item-type-sets" className="nav-link" end>
                Item type Sets
              </NavLink>
            </li>
            <li>
              <NavLink to="/tenant/roles" className="nav-link" end>
                Gestione Ruoli
              </NavLink>
            </li>
            <li>
              <NavLink to="/tenant/groups" className="nav-link" end>
                Gruppi
              </NavLink>
            </li>
            <li>
              <NavLink to="/tenant/users" className="nav-link" end>
                Gestione Utenti
              </NavLink>
            </li>
          </>
        )}

        {/* Separatore */}
        <li className="nav-separator"></li>

        {/* Test UI Hierarchy (solo per sviluppo) */}
        {isAdmin && (
          <>
            <li>
              <NavLink to="/tenant/test-fieldset-hierarchy" className="nav-link" end>
                🎨 Test UI 1
              </NavLink>
            </li>
            <li>
              <NavLink to="/tenant/test-fieldset-treeview" className="nav-link" end>
                🌳 Test UI 2
              </NavLink>
            </li>
            <li>
              <NavLink to="/tenant/test-fieldset-splitview" className="nav-link" end>
                📊 Test UI 3
              </NavLink>
            </li>
            <li>
              <NavLink to="/tenant/test-fieldset-vertical" className="nav-link" end>
                📋 Test UI 4
              </NavLink>
            </li>
            <li>
              <NavLink to="/tenant/test-fieldset-sidebar" className="nav-link" end>
                📌 Test UI 5
              </NavLink>
            </li>
          </>
        )}

        {/* Separatore */}
        <li className="nav-separator"></li>

        {/* Progetti */}
        <li>
          <NavLink to="/projects" className="nav-link" end>
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

