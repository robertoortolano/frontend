import { useEffect, useState, MouseEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { createPortal } from "react-dom";
import { Shield } from "lucide-react";
import api from "../../api/api";

import { useAuth } from "../../context/AuthContext";
import ItemTypeSetRoleManager from "../../components/ItemTypeSetRoleManager";
import PermissionGrantManager from "../../components/PermissionGrantManager";
import Accordion from "../../components/shared/Accordion";
import { ItemTypeSetDto } from "../../types/itemtypeset.types";

import layout from "../../styles/common/Layout.module.css";
import buttons from "../../styles/common/Buttons.module.css";
import alert from "../../styles/common/Alerts.module.css";
import utilities from "../../styles/common/Utilities.module.css";
import table from "../../styles/common/Tables.module.css";

interface ItemTypeSetsUniversalProps {
  scope: 'tenant' | 'project';
  projectId?: string;
}

export default function ItemTypeSetsUniversal({ scope, projectId: projectIdProp }: ItemTypeSetsUniversalProps) {
  const { projectId: projectIdFromParams } = useParams<{ projectId?: string }>();
  const projectId = projectIdProp || projectIdFromParams;
  const navigate = useNavigate();
  const auth = useAuth() as any;
  const token = auth?.token;
  const isAuthenticated = auth?.isAuthenticated;

  const [itemTypeSets, setItemTypeSets] = useState<ItemTypeSetDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasRequiredElements, setHasRequiredElements] = useState(false);
  const [loadingElements, setLoadingElements] = useState(true);

  // Stato per gestire quali item type sets sono espansi
  const [expandedItemTypeSets, setExpandedItemTypeSets] = useState<Record<number, boolean>>({});
  const [showRoles, setShowRoles] = useState(false);
  const [selectedSetForRoles, setSelectedSetForRoles] = useState<ItemTypeSetDto | null>(null);
  const [selectedPermissionForGrants, setSelectedPermissionForGrants] = useState<any>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [modalPosition, setModalPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const handleMouseDown = (e: MouseEvent) => {
    if ((e.target as HTMLElement).closest(".modal-header")) {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - modalPosition.x,
        y: e.clientY - modalPosition.y,
      });
    }
  };

  useEffect(() => {
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

    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }
    return undefined;
  }, [isDragging, dragStart]);

  // Reset modal position when opening
  useEffect(() => {
    if (selectedPermissionForGrants) {
      setModalPosition({ x: 0, y: 0 });
    }
  }, [selectedPermissionForGrants]);

  useEffect(() => {
    if (!token) return;

    const fetchItemTypeSets = async () => {
      try {
        let endpoint = "/item-type-sets/global";
        if (scope === 'project' && projectId) {
          endpoint = `/item-type-sets/project/${projectId}`;
        }

        const response = await api.get(endpoint, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setItemTypeSets(response.data);
      } catch (err: any) {
        console.error("Errore nel caricamento degli item type sets", err);
        setError(err.response?.data?.message || "Errore nel caricamento degli item type sets");
      } finally {
        setLoading(false);
      }
    };

    const fetchRequiredElements = async () => {
      try {
        // Verifica se esistono almeno un FieldSet, un Workflow e un ItemType
        const [fieldSetsRes, workflowsRes, itemTypesRes] = await Promise.all([
          api.get(scope === 'project' && projectId 
            ? `/field-sets/project/${projectId}` 
            : "/field-sets", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          api.get(scope === 'project' && projectId 
            ? `/workflows/project/${projectId}` 
            : "/workflows", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          api.get("/item-types", {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        const hasFieldSets = fieldSetsRes.data && fieldSetsRes.data.length > 0;
        const hasWorkflows = workflowsRes.data && workflowsRes.data.length > 0;
        const hasItemTypes = itemTypesRes.data && itemTypesRes.data.length > 0;

        setHasRequiredElements(hasFieldSets && hasWorkflows && hasItemTypes);
      } catch (err: any) {
        console.error("Errore nel caricamento degli elementi richiesti", err);
        setHasRequiredElements(false);
      } finally {
        setLoadingElements(false);
      }
    };

    fetchItemTypeSets();
    fetchRequiredElements();
  }, [token, scope, projectId]);

  const handleEdit = (id: number, defaultItemTypeSet: boolean) => {
    if (!defaultItemTypeSet) {
      if (scope === 'tenant') {
        navigate(`/tenant/item-type-sets/edit/${id}`);
      } else if (scope === 'project' && projectId) {
        navigate(`/projects/${projectId}/item-type-sets/edit/${id}`);
      }
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Sei sicuro di voler eliminare questo item type set?")) return;

    try {
      if (scope === 'project' && projectId) {
        await api.delete(`/item-type-sets/project/${projectId}/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } else {
        await api.delete(`/item-type-sets/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }
      setItemTypeSets((prev) => prev.filter((set) => set.id !== id));
      setError(null); // Reset error on success
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.response?.data?.error || "Errore durante l'eliminazione";
      setError(errorMessage);
      // Show alert for better visibility
      window.alert(errorMessage);
    }
  };

  const handleCreate = () => {
    if (scope === 'tenant') {
      navigate("/tenant/item-type-sets/create");
    } else if (scope === 'project' && projectId) {
      navigate(`/projects/${projectId}/item-type-sets/create`);
    }
  };

  const getTitle = () => {
    return scope === 'tenant' 
      ? "Item Type Sets" 
      : "Item Type Sets del Progetto";
  };

  const getDescription = () => {
    return scope === 'tenant'
      ? "Gestisci gli item type sets a livello tenant."
      : "Gestisci gli item type sets specifici per questo progetto. Gli ItemType sono sempre globali.";
  };

  let content;
  if (loading) {
    content = <p className="list-loading">Caricamento item type sets...</p>;
  } else if (itemTypeSets.length === 0) {
    content = (
      <div>
        <p className="list-loading">Nessun item type set trovato.</p>
      </div>
    );
  } else {
    content = (
      <ul className={layout.verticalList}>
        {itemTypeSets.map((set) => (
          <li key={set.id}>
            <Accordion
              id={set.id}
              title={<h2 className={layout.blockTitleBlue}>{set.name}</h2>}
              isExpanded={expandedItemTypeSets[set.id] || false}
              onToggle={() => setExpandedItemTypeSets((prev) => ({
                ...prev,
                [set.id]: !prev[set.id],
              }))}
              headerActions={
                <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '0.5rem', flexShrink: 0, flexWrap: 'nowrap' }}>
                  <button
                    className={buttons.button}
                    style={{ 
                      padding: "0.5rem 0.75rem", 
                      fontSize: "0.875rem",
                      backgroundColor: showRoles && selectedSetForRoles?.id === set.id ? "#00ddd4" : "#f0f0f0",
                      height: "36px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      whiteSpace: "nowrap"
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (showRoles && selectedSetForRoles?.id === set.id) {
                        setShowRoles(false);
                        setSelectedSetForRoles(null);
                      } else {
                        setShowRoles(true);
                        setSelectedSetForRoles(set);
                        // Espandi automaticamente l'ItemTypeSet quando si mostrano le permission
                        setExpandedItemTypeSets(prev => ({
                          ...prev,
                          [set.id]: true
                        }));
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
                      className={buttons.button}
                      style={{ 
                        padding: "0.5rem 0.75rem", 
                        fontSize: "0.875rem",
                        height: "36px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        whiteSpace: "nowrap"
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEdit(set.id, set.defaultItemTypeSet);
                      }}
                      title="Modifica Item Type Set"
                      type="button"
                    >
                      Edit
                    </button>
                  )}
                  <button
                    className={buttons.button}
                    style={{ 
                      padding: "0.5rem 0.75rem", 
                      fontSize: "0.875rem",
                      height: "36px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      whiteSpace: "nowrap"
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(set.id);
                    }}
                    disabled={set.defaultItemTypeSet || (set.projectsAssociation && set.projectsAssociation.length > 0)}
                    title={
                      set.defaultItemTypeSet
                        ? "Item Type Set di default non eliminabile"
                        : set.projectsAssociation && set.projectsAssociation.length > 0
                        ? `Non puoi eliminare: usato in ${set.projectsAssociation.length} progetto/i`
                        : "Elimina Item Type Set"
                    }
                    type="button"
                  >
                    Delete
                  </button>
                </div>
              }
            >
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

              {/* Panel per gestione permissions - integrato sotto ogni ItemTypeSet */}
              {showRoles && selectedSetForRoles?.id === set.id && (
                <div className="mt-6 p-6 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Gestione Permissions: {selectedSetForRoles.name}
                    </h3>
                  </div>

                  <ItemTypeSetRoleManager
                    itemTypeSetId={selectedSetForRoles.id}
                    onPermissionGrantClick={setSelectedPermissionForGrants}
                    refreshTrigger={refreshTrigger}
                    projectId={projectId}
                    showOnlyProjectGrants={scope === 'project'}
                  />
                </div>
              )}
            </Accordion>
          </li>
        ))}
      </ul>
    );
  }

  if (!isAuthenticated) {
    return <p className="list-loading">Non sei autenticato.</p>;
  }

  return (
    <div className={layout.container} style={{ maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header Section */}
      <div className={layout.headerSection}>
        {getTitle() && <h1 className={layout.title}>{getTitle()}</h1>}
        {getDescription() && <p className={layout.paragraphMuted}>{getDescription()}</p>}
        <div className={layout.buttonRow}>
          <button
            className={buttons.button}
            onClick={handleCreate}
            disabled={!hasRequiredElements || loadingElements}
            title={!hasRequiredElements ? "Devi creare almeno un Field Set, un Workflow e avere almeno un Item Type prima di poter creare un Item Type Set" : ""}
          >
            Aggiungi Item Type Set
          </button>
        </div>
      </div>

      {error && (
        <div className={alert.errorContainer}>
          <p className={alert.error}>{error}</p>
        </div>
      )}

      {/* Content Section */}
      <div className={layout.section}>
        {content}
      </div>

      {/* Modal per gestione grants e ruoli */}
      {selectedPermissionForGrants &&
        createPortal(
          <div
            id="permission-grant-modal"
            role="presentation"
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
              role="dialog"
              aria-modal="true"
              aria-labelledby="modal-title"
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
                role="region"
                aria-label="Permission grants and roles management content"
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
                    itemTypeSetId={selectedSetForRoles?.id}
                    scope={scope}
                    projectId={projectId}
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

