import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Shield } from "lucide-react";
import api from "../../api/api";

import { useAuth } from "../../context/AuthContext";
import ItemTypeSetRoleManager from "../../components/ItemTypeSetRoleManager";
import PermissionGrantModal from "../../components/shared/PermissionGrantModal";
import Accordion from "../../components/shared/Accordion";
import UniversalPageTemplate from "../../components/shared/UniversalPageTemplate";
import ActionsMenu from "../../components/shared/ActionsMenu";
import { ItemTypeSetDto } from "../../types/itemtypeset.types";

import layout from "../../styles/common/Layout.module.css";
import buttons from "../../styles/common/Buttons.module.css";
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
              title={<h2 className={layout.blockTitleBlue} style={{ margin: 0 }}>{set.name}</h2>}
              isExpanded={expandedItemTypeSets[set.id] || false}
              onToggle={() => setExpandedItemTypeSets((prev) => ({
                ...prev,
                [set.id]: !prev[set.id],
              }))}
              headerActions={
                <div onClick={(e) => e.stopPropagation()}>
                  <ActionsMenu
                    actions={[
                      {
                        label: showRoles && selectedSetForRoles?.id === set.id ? "Nascondi Permissions" : "Mostra Permissions",
                        onClick: () => {
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
                        },
                        icon: <Shield size={16} />,
                      },
                      ...(!set.defaultItemTypeSet
                        ? [
                            {
                              label: "Edit",
                              onClick: () => handleEdit(set.id, set.defaultItemTypeSet),
                            },
                          ]
                        : []),
                      {
                        label: "Delete",
                        onClick: () => handleDelete(set.id),
                        disabled:
                          set.defaultItemTypeSet ||
                          (set.projectsAssociation && set.projectsAssociation.length > 0),
                      },
                    ]}
                  />
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
                        <td><span className="text-sm text-gray-600">{conf.category}</span></td>
                        <td><span className="text-sm text-gray-600">{conf.workflow?.name || "-"}</span></td>
                        <td><span className="text-sm text-gray-600">{conf.fieldSet?.name || "-"}</span></td>
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
    <>
      <UniversalPageTemplate
        title={getTitle()}
        description={getDescription()}
        error={error}
        headerActions={
          <button
            className={buttons.button}
            onClick={handleCreate}
            disabled={!hasRequiredElements || loadingElements}
            title={!hasRequiredElements ? "Devi creare almeno un Field Set, un Workflow e avere almeno un Item Type prima di poter creare un Item Type Set" : ""}
          >
            Aggiungi Item Type Set
          </button>
        }
      >
        {content}
      </UniversalPageTemplate>

      {/* Modal per gestione grants e ruoli */}
      <PermissionGrantModal
        permission={selectedPermissionForGrants}
        isOpen={Boolean(selectedPermissionForGrants)}
        onClose={() => setSelectedPermissionForGrants(null)}
        onSave={() => {
          setSelectedPermissionForGrants(null);
          setRefreshTrigger((prev) => prev + 1);
        }}
        itemTypeSetId={selectedSetForRoles?.id}
        scope={scope}
        projectId={projectId}
      />
    </>
  );
}

