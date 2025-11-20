import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useFavorites } from "../context/FavoritesContext";
import { Building2, ChevronDown, ChevronRight } from "lucide-react";
import { tenantApi } from "../api/api";
import "./Nav.css";

interface TenantDTO {
  id: number;
  name: string;
  subdomain: string;
  createdAt?: string;
}

export default function NavTenant() {
  const navigate = useNavigate();
  const location = useLocation();
  const auth = useAuth() as any;
  const logout = auth?.logout;
  const username = localStorage.getItem("username") || "";
  const roles = auth?.roles || [];
  const tenantId = auth?.tenantId;
  const { favoriteProjects } = useFavorites();

  const [tenant, setTenant] = useState<TenantDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [projectsExpanded, setProjectsExpanded] = useState(false);

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

  // Recupera il tenant reale
  useEffect(() => {
    if (tenantId) {
      const fetchTenant = async () => {
        try {
          const response = await tenantApi.getTenants();
          const tenants: TenantDTO[] = response.data;
          // Trova il tenant corrente filtrando per tenantId
          const currentTenant = tenants.find(t => t.id === Number(tenantId));
          if (currentTenant) {
            setTenant(currentTenant);
          }
        } catch (err) {
          console.error("Errore nel recupero del tenant:", err);
        } finally {
          setLoading(false);
        }
      };
      fetchTenant();
    } else {
      setLoading(false);
    }
  }, [tenantId]);

  // Auto-espandi progetti se si è sulla pagina progetti
  useEffect(() => {
    if (location.pathname.startsWith("/tenant/projects")) {
      setProjectsExpanded(true);
    }
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    localStorage.clear();
    navigate("/");
  };

  const handleProjectsToggle = () => {
    setProjectsExpanded(!projectsExpanded);
  };

  const handleNavigateToProjects = () => {
    navigate("/tenant/projects");
    setProjectsExpanded(true);
  };

  return (
    <nav className="nav-bar">
      {/* Badge del tenant con icona e nome */}
      <div className="project-badge">
        <Building2 className="project-badge-icon" size={18} />
        <span className="project-badge-name">
          {loading ? "Caricamento..." : (tenant?.name || "Tenant")}
        </span>
      </div>
      
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

        {/* Separatore - solo se ci sono voci di configurazione sopra */}
        {(canAccessBasicFeatures || isAdmin) && (
          <li className="nav-separator"></li>
        )}

        {/* Progetti - con accordion per preferiti */}
        <li>
          <div className="nav-accordion-container">
            <button
              onClick={handleNavigateToProjects}
              className={`nav-link nav-accordion-header ${location.pathname === "/tenant/projects" ? "active" : ""}`}
              style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}
            >
              <span>Progetti</span>
              {favoriteProjects.length > 0 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleProjectsToggle();
                  }}
                  className="nav-accordion-toggle"
                  aria-label={projectsExpanded ? "Collassa progetti preferiti" : "Espandi progetti preferiti"}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: "0.25rem",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  {projectsExpanded ? (
                    <ChevronDown size={16} style={{ color: "inherit" }} />
                  ) : (
                    <ChevronRight size={16} style={{ color: "inherit" }} />
                  )}
                </button>
              )}
            </button>
            {favoriteProjects.length > 0 && (
              <div
                className="nav-accordion-content"
                style={{
                  maxHeight: projectsExpanded ? `${favoriteProjects.length * 40}px` : "0px",
                  overflow: "hidden",
                  transition: "max-height 0.3s ease-out",
                }}
              >
                <ul style={{ listStyle: "none", padding: "0", margin: "0.25rem 0 0 0", display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                  {favoriteProjects.map((favProject) => (
                    <li key={favProject.id}>
                      <NavLink
                        to={`/projects/${favProject.id}`}
                        className="nav-link nav-accordion-item"
                        end
                      >
                        {favProject.name}
                      </NavLink>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
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

