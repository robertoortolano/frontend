import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Shield } from "lucide-react";

import { useAuth } from "../../context/AuthContext";
import ItemTypeSetRoleManager from "../../components/ItemTypeSetRoleManager";
import PermissionGrantModal from "../../components/shared/PermissionGrantModal";
import Accordion from "../../components/shared/Accordion";
import { ItemTypeSetDto } from "../../types/itemtypeset.types";

import layout from "../../styles/common/Layout.module.css";
import buttons from "../../styles/common/Buttons.module.css";
import alert from "../../styles/common/Alerts.module.css";
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

  const toggleExpand = (setId: number) => {
    setExpandedSets((prev) => ({
      ...prev,
      [setId]: !prev[setId],
    }));
  };

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
          <li key={set.id}>
            <Accordion
              id={set.id}
              title={<h2 className={layout.blockTitleBlue}>{set.name}</h2>}
              isExpanded={expandedSets[set.id] || false}
              onToggle={() => toggleExpand(set.id)}
              headerActions={
                <div className="flex gap-2">
                  <button
                    className={buttons.button}
                    style={{ 
                      padding: "0.25rem 0.5rem", 
                      fontSize: "0.75rem",
                      backgroundColor: showRoles && selectedSetForRoles?.id === set.id ? "#00ddd4" : "#f0f0f0"
                    }}
                    onClick={() => {
                      if (showRoles && selectedSetForRoles?.id === set.id) {
                        setShowRoles(false);
                        setSelectedSetForRoles(null);
                      } else {
                        setShowRoles(true);
                        setSelectedSetForRoles(set);
                        // Espandi automaticamente l'ItemTypeSet quando si mostrano le permission
                        setExpandedSets(prev => ({
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
                      className={`${buttons.button} ${buttons.buttonSmall}`}
                      onClick={() => navigate(`/tenant/item-type-sets/edit/${set.id}`)}
                      title="Modifica Item Type Set"
                      type="button"
                    >
                      Edit
                    </button>
                  )}
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
                  />
                </div>
              )}
            </Accordion>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <div className={layout.container} style={{ maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header Section */}
      <div className={layout.headerSection}>
        <h1 className={layout.title}>Item Type Sets {isProjectContext ? "di Progetto" : "Globali"}</h1>
        <p className={layout.paragraphMuted}>
          Gestisci i set di tipi di item e le loro configurazioni.
        </p>
        <div className={layout.buttonRow}>
          <button onClick={handleCreate} className={buttons.button}>
            + Crea Nuovo Item Type Set
          </button>
        </div>
      </div>

      {/* Content Section */}
      <div className={layout.section}>
        {content}
      </div>

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
      />
    </div>
  );
}

