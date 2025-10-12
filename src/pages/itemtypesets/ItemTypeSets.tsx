import { useEffect, useState, MouseEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { createPortal } from "react-dom";
import { ChevronDown, ChevronRight, Shield } from "lucide-react";

import { useAuth } from "../../context/AuthContext";
import ItemTypeSetRoleManager from "../../components/ItemTypeSetRoleManager";
import PermissionGrantManager from "../../components/PermissionGrantManager";
import { ItemTypeSetDto } from "../../types/itemtypeset.types";

import layout from "../../styles/common/Layout.module.css";
import buttons from "../../styles/common/Buttons.module.css";
import alert from "../../styles/common/Alerts.module.css";
import utilities from "../../styles/common/Utilities.module.css";
import table from "../../styles/common/Tables.module.css";

export default function ItemTypeSets() {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const auth = useAuth() as any;
  const token = auth?.token;
  const roles = auth?.roles;
  const isAuthenticated = auth?.isAuthenticated;

  const [expandedSets, setExpandedSets] = useState<Record<number, boolean>>({});
  const [showRoles, setShowRoles] = useState(false);
  const [selectedSetForRoles, setSelectedSetForRoles] = useState<ItemTypeSetDto | null>(null);
  const [selectedPermissionForGrants, setSelectedPermissionForGrants] = useState<any>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [modalPosition, setModalPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const toggleExpand = (setId: number) => {
    setExpandedSets((prev) => ({
      ...prev,
      [setId]: !prev[setId],
    }));
  };

  const handleMouseDown = (e: MouseEvent) => {
    if ((e.target as HTMLElement).closest(".modal-header")) {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - modalPosition.x,
        y: e.clientY - modalPosition.y,
      });
    }
  };

  const handleMouseMove = (e: any) => {
    if (isDragging) {
      setModalPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }
    return undefined;
  }, [isDragging, dragStart, modalPosition]);

  // Reset modal position when opening
  useEffect(() => {
    if (selectedPermissionForGrants) {
      setModalPosition({ x: 0, y: 0 });
    }
  }, [selectedPermissionForGrants]);

  const isProjectContext = !!id;
  const [itemTypeSets, setItemTypeSets] = useState<ItemTypeSetDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const hasRole = (name: string, scope: string | null = null) => {
    return roles && Array.isArray(roles) && roles.some((r: any) => r.name === name && (scope === null || r.scope === scope));
  };

  const isTenantAdmin = hasRole("ADMIN", "TENANT");
  const isProjectAdmin = hasRole("ADMIN", "PROJECT");

  useEffect(() => {
    if (!token) return;

    const fetchItemTypeSets = async () => {
      try {
        const res = await fetch("http://localhost:8080/api/item-type-sets/global", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) throw new Error("Errore nel caricamento");

        const data = await res.json();
        setItemTypeSets(data);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };

    fetchItemTypeSets();
  }, [isProjectContext, id, token]);

  if (!isAuthenticated || (!isTenantAdmin && (!isProjectContext || !isProjectAdmin))) {
    return <p className={alert.error}>Accesso negato</p>;
  }

  const handleCreate = () => {
    navigate(isProjectContext ? `create` : `/tenant/item-type-sets/create`);
  };

  let content;

  if (loading) {
    content = <p className={layout.loading}>Caricamento...</p>;
  } else if (error) {
    content = <p className={alert.error}>{error}</p>;
  } else if (itemTypeSets.length === 0) {
    content = <p className={layout.loading}>Nessun item type set trovato.</p>;
  } else {
    content = (
      <ul className={layout.verticalList}>
        {itemTypeSets.map((set) => (
          <li key={set.id} className={layout.block}>
            <div className="flex justify-between items-center">
              <button
                type="button"
                className={`${layout.blockHeader} cursor-pointer flex items-center justify-between flex-grow`}
                onClick={() => toggleExpand(set.id)}
              >
                <h2 className={layout.blockTitleBlue}>{set.name}</h2>
                {expandedSets[set.id] ? <ChevronDown /> : <ChevronRight />}
              </button>

              <div className="flex gap-2">
                <button
                  className={`${buttons.button} ${buttons.buttonSmall} ${
                    showRoles && selectedSetForRoles?.id === set.id
                      ? buttons.buttonPrimary
                      : buttons.buttonSecondary
                  }`}
                  onClick={() => {
                    if (showRoles && selectedSetForRoles?.id === set.id) {
                      setShowRoles(false);
                      setSelectedSetForRoles(null);
                    } else {
                      setShowRoles(true);
                      setSelectedSetForRoles(set);
                    }
                  }}
                  title={
                    showRoles && selectedSetForRoles?.id === set.id
                      ? "Nascondi Permissions"
                      : "Gestisci Permissions"
                  }
                  type="button"
                >
                  <Shield size={16} className="mr-1" />
                  {showRoles && selectedSetForRoles?.id === set.id ? "Nascondi" : "Mostra"} Permissions
                </button>
                {!set.defaultItemTypeSet && (
                  <button
                    className={`${buttons.button} ${buttons.buttonSmall}`}
                    onClick={() => navigate(`/tenant/item-type-sets/edit/${set.id}`)}
                    title="Modifica Item Type Set"
                    type="button"
                  >
                    Edit
                  </button>
                )}
              </div>
            </div>

            {expandedSets[set.id] && (
              <div className={utilities.mt4}>
                {set.itemTypeConfigurations?.length > 0 ? (
                  <table className={table.table}>
                    <thead>
                      <tr>
                        <th>Item Type</th>
                        <th>Categoria</th>
                        <th>Workflow</th>
                        <th>Field Set</th>
                      </tr>
                    </thead>
                    <tbody>
                      {set.itemTypeConfigurations.map((conf) => (
                        <tr key={conf.id}>
                          <td>{conf.itemType?.name}</td>
                          <td>{conf.category}</td>
                          <td>{conf.workflow?.name || "-"}</td>
                          <td>{conf.fieldSet?.name || "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className={layout.paragraphMuted}>Nessuna configurazione in questo set.</p>
                )}
              </div>
            )}
          </li>
        ))}
      </ul>
    );
  }

  return (
    <div className={layout.container}>
      <h1 className={layout.title}>Item Type Sets {isProjectContext ? "di Progetto" : "Globali"}</h1>

      {content}

      <div className={layout.buttonRow}>
        <button onClick={handleCreate} className={`${buttons.button} ${buttons.buttonSmall}`}>
          + Crea Nuovo Item Type Set
        </button>
      </div>

      {/* Panel per gestione permissions - si espande nella pagina */}
      {showRoles && selectedSetForRoles && (
        <div className="mt-6 p-6 bg-white rounded-lg shadow-lg border">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              Gestione Permissions: {selectedSetForRoles.name}
            </h2>
          </div>

          <ItemTypeSetRoleManager
            itemTypeSetId={selectedSetForRoles.id}
            onPermissionGrantClick={setSelectedPermissionForGrants}
            refreshTrigger={refreshTrigger}
          />
        </div>
      )}

      {/* Modal per gestione grants e ruoli */}
      {selectedPermissionForGrants &&
        createPortal(
          <div
            id="permission-grant-modal"
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              width: "100vw",
              height: "100vh",
              backgroundColor: "rgba(0, 0, 0, 0.5)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 9999,
              padding: "1rem",
            }}
            onClick={(e) => {
              if (e.target === e.currentTarget && (e.target as HTMLElement).id !== "modal-scrollable-content") {
                setSelectedPermissionForGrants(null);
              }
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              onMouseDown={handleMouseDown}
              style={{
                backgroundColor: "white",
                borderRadius: "0.5rem",
                maxWidth: "56rem",
                width: "100%",
                maxHeight: "90vh",
                minHeight: "400px",
                display: "flex",
                flexDirection: "column",
                position: "relative",
                overflow: "hidden",
                border: "1px solid rgba(30, 58, 138, 0.3)",
                boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
                transform: `translate(${modalPosition.x}px, ${modalPosition.y}px)`,
                cursor: isDragging ? "move" : "default",
              }}
            >
              {/* Header del modal */}
              <div
                className="modal-header"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "1rem",
                  borderBottom: "1px solid #e5e7eb",
                  cursor: "move",
                  backgroundColor: "#f3f4f6",
                  userSelect: "none",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <svg
                    style={{ width: "1.25rem", height: "1.25rem", color: "#4b5563" }}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                  </svg>
                  <span style={{ fontSize: "0.875rem", fontWeight: "500", color: "#374151" }}>
                    Gestione Permessi - Trascina per spostare
                  </span>
                </div>
                <button
                  onClick={() => setSelectedPermissionForGrants(null)}
                  style={{
                    color: "#9ca3af",
                    cursor: "pointer",
                    border: "none",
                    backgroundColor: "transparent",
                    padding: "0.25rem",
                  }}
                  onMouseEnter={(e) => ((e.target as HTMLElement).style.color = "#4b5563")}
                  onMouseLeave={(e) => ((e.target as HTMLElement).style.color = "#9ca3af")}
                >
                  <svg style={{ width: "1.5rem", height: "1.5rem" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Contenuto del modal con scroll */}
              <div
                id="modal-scrollable-content"
                style={{
                  flex: 1,
                  padding: "1.5rem",
                  minHeight: "400px",
                  maxHeight: "calc(90vh - 120px)",
                  height: "calc(90vh - 120px)",
                  overflowY: "auto",
                  overflowX: "hidden",
                  backgroundColor: "white",
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <div style={{ minHeight: "100%" }}>
                  <PermissionGrantManager
                    permission={selectedPermissionForGrants}
                    onClose={() => setSelectedPermissionForGrants(null)}
                    onSave={() => {
                      setSelectedPermissionForGrants(null);
                      setRefreshTrigger((prev) => prev + 1);
                    }}
                  />
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}

