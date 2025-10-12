/**
 * ItemTypeSetRoleManager - Complex permission management component
 * Using pragmatic typing with 'any' for complex nested structures
 */
import { useState, useEffect } from "react";
import { Users, Shield, Edit, Eye, Plus } from "lucide-react";
import api from "../api/api";
import PermissionFilters, { FilterValues } from "./PermissionFilters";

import layout from "../styles/common/Layout.module.css";
import buttons from "../styles/common/Buttons.module.css";
import alert from "../styles/common/Alerts.module.css";
import utilities from "../styles/common/Utilities.module.css";
import table from "../styles/common/Tables.module.css";

const ROLE_TYPES: any = {
  WORKERS: { label: "Workers", icon: Users, color: "blue", description: "Per ogni ItemType" },
  STATUSOWNERS: { label: "Status Owners", icon: Shield, color: "green", description: "Per ogni WorkflowStatus" },
  FIELDOWNERS: { label: "Field Owners", icon: Edit, color: "purple", description: "Per ogni FieldConfiguration (sempre)" },
  CREATORS: { label: "Creators", icon: Plus, color: "orange", description: "Per ogni Workflow" },
  EXECUTORS: { label: "Executors", icon: Shield, color: "red", description: "Per ogni Transition" },
  EDITORS: { label: "Editors", icon: Edit, color: "indigo", description: "Per coppia (Field + Status)" },
  VIEWERS: { label: "Viewers", icon: Eye, color: "gray", description: "Per coppia (Field + Status)" },
};

interface ItemTypeSetRoleManagerProps {
  itemTypeSetId: number;
  onPermissionGrantClick?: (permission: any) => void;
  refreshTrigger?: number;
}

export default function ItemTypeSetRoleManager({
  itemTypeSetId,
  onPermissionGrantClick,
  refreshTrigger,
}: ItemTypeSetRoleManagerProps) {
  const [roles, setRoles] = useState<any>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterValues>({
    permission: "All",
    itemTypes: ["All"],
    status: "All",
    field: "All",
    workflow: "All",
    grant: "All",
  });

  useEffect(() => {
    if (itemTypeSetId) {
      fetchRoles();
    }
  }, [itemTypeSetId, refreshTrigger]);

  const fetchRoles = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/itemtypeset-permissions/itemtypeset/${itemTypeSetId}`);
      setRoles(response.data);
    } catch (err: any) {
      if (err.response?.status === 500) {
        try {
          await api.post(`/itemtypeset-permissions/create-for-itemtypeset/${itemTypeSetId}`);
          const retryResponse = await api.get(`/itemtypeset-permissions/itemtypeset/${itemTypeSetId}`);
          setRoles(retryResponse.data);
        } catch (createErr) {
          setError("Errore nella creazione delle permissions");
          console.error("Error creating permissions:", createErr);
        }
      } else {
        setError("Errore nel caricamento delle permissions");
        console.error("Error fetching permissions:", err);
      }
    } finally {
      setLoading(false);
    }
  };

  const getRoleIcon = (roleType: string) => {
    const IconComponent = ROLE_TYPES[roleType]?.icon || Users;
    return <IconComponent size={16} />;
  };

  const getRoleColor = (roleType: string) => {
    return ROLE_TYPES[roleType]?.color || "gray";
  };

  const groupRolesByType = () => {
    return roles || {};
  };

  // Funzione di filtraggio delle permissions
  const filterPermissions = (permission: any): boolean => {
    // Filtra per permission type
    if (filters.permission !== "All" && permission.name !== filters.permission) {
      return false;
    }

    // Filtra per itemType (multi-select)
    if (!filters.itemTypes.includes("All")) {
      if (!permission.itemType || !filters.itemTypes.includes(permission.itemType.id.toString())) {
        return false;
      }
    }

    // Filtra per status
    if (filters.status === "None") {
      // None = mostra solo permissions SENZA status
      if (permission.workflowStatus) {
        return false;
      }
    } else if (filters.status !== "All") {
      // Valore specifico = mostra solo con questo status
      if (!permission.workflowStatus || permission.workflowStatus.id.toString() !== filters.status) {
        return false;
      }
    }
    // All = non filtra (mostra tutte indipendentemente dallo status)

    // Filtra per field
    if (filters.field === "None") {
      // None = mostra solo permissions SENZA field
      if (permission.fieldConfiguration) {
        return false;
      }
    } else if (filters.field !== "All") {
      // Valore specifico = mostra solo con questo field
      if (!permission.fieldConfiguration || permission.fieldConfiguration.id.toString() !== filters.field) {
        return false;
      }
    }
    // All = non filtra (mostra tutte indipendentemente dal field)

    // Filtra per workflow
    if (filters.workflow === "None") {
      // None = mostra solo permissions SENZA workflow
      if (permission.workflow) {
        return false;
      }
    } else if (filters.workflow !== "All") {
      // Valore specifico = mostra solo con questo workflow
      if (!permission.workflow || permission.workflow.id.toString() !== filters.workflow) {
        return false;
      }
    }
    // All = non filtra (mostra tutte indipendentemente dal workflow)

    // Filtra per grant
    if (filters.grant !== "All") {
      const hasGrant = permission.hasAssignments === true;
      if (filters.grant === "Y" && !hasGrant) {
        return false;
      }
      if (filters.grant === "N" && hasGrant) {
        return false;
      }
    }

    return true;
  };

  // Applica filtri ai ruoli
  const applyFilters = (groupedRoles: any) => {
    const filtered: any = {};
    
    Object.entries(groupedRoles).forEach(([roleType, roleList]: [string, any]) => {
      const filteredList = roleList.filter(filterPermissions);
      if (filteredList.length > 0) {
        filtered[roleType] = filteredList;
      }
    });
    
    return filtered;
  };

  // Conta totale permissions (flatten tutte le liste)
  const getTotalCount = (groupedRoles: any): number => {
    return Object.values(groupedRoles).reduce((sum: number, list: any) => sum + list.length, 0);
  };

  // Flatten permissions per i filtri
  const getAllPermissions = (groupedRoles: any): any[] => {
    const allPerms: any[] = [];
    Object.values(groupedRoles).forEach((list: any) => {
      allPerms.push(...list);
    });
    return allPerms;
  };

  if (loading) {
    return <div className={layout.loading}>Caricamento permissions...</div>;
  }

  if (error) {
    return <div className={alert.error}>{error}</div>;
  }

  const groupedRoles = groupRolesByType();
  const allPermissions = getAllPermissions(groupedRoles);
  const filteredRoles = applyFilters(groupedRoles);
  const totalCount = getTotalCount(groupedRoles);
  const filteredCount = getTotalCount(filteredRoles);
  
  // Ordine di visualizzazione delle permissions
  const roleOrder = ['WORKERS', 'CREATORS', 'STATUSOWNERS', 'EXECUTORS', 'FIELDOWNERS', 'EDITORS', 'VIEWERS'];

  return (
    <div className="w-full">
      {Object.keys(groupedRoles).length === 0 ? (
        <div className={alert.info}>
          <p>Nessuna permission configurata per questo ItemTypeSet.</p>
          <p className="mt-2">Le permissions vengono create automaticamente quando si crea o modifica un ItemTypeSet.</p>
        </div>
      ) : (
        <>
          <PermissionFilters
            permissions={allPermissions}
            onFilterChange={setFilters}
            totalCount={totalCount}
            filteredCount={filteredCount}
          />
          
          {Object.keys(filteredRoles).length === 0 ? (
            <div className={alert.info}>
              <p>Nessuna permission corrisponde ai filtri selezionati.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {roleOrder.filter(roleType => filteredRoles[roleType]).map((roleType) => {
                const roleList = filteredRoles[roleType];
                return (
            <div key={roleType} className={layout.block}>
              <div className={layout.blockHeader}>
                <div className="flex items-center gap-3">
                  {getRoleIcon(roleType)}
                  <h3 className={layout.blockTitleBlue}>{ROLE_TYPES[roleType]?.label || roleType}</h3>
                  <span
                    className={`px-2 py-1 rounded-full text-xs bg-${getRoleColor(roleType)}-100 text-${getRoleColor(
                      roleType
                    )}-800`}
                  >
                    {roleList.length}
                  </span>
                </div>
                <p className={layout.paragraphMuted}>{ROLE_TYPES[roleType]?.description || ""}</p>
              </div>

              <div className={utilities.mt4}>
                <table className={table.table}>
                  <thead>
                    <tr>
                      <th>Dettagli</th>
                      <th>Grants</th>
                      <th>Azioni</th>
                    </tr>
                  </thead>
                  <tbody>
                    {roleList.map((role: any) => (
                      <tr key={role.id}>
                        <td>
                          <div className="text-sm text-gray-600">
                            {role.itemType && <div><strong>ItemType:</strong> {role.itemType.name}</div>}
                            {role.workflowStatus && <div><strong>Stato:</strong> {role.workflowStatus.name}</div>}
                            {role.transition && (
                              <div>
                                <strong>Transizione:</strong> {role.fromStatus?.name || 'N/A'} → {role.toStatus?.name || 'N/A'}
                                {role.transition.name && role.transition.name !== 'N/A' && (
                                  <span className="ml-1 text-xs text-gray-500">({role.transition.name})</span>
                                )}
                              </div>
                            )}
                            {role.fieldConfiguration && <div><strong>Field:</strong> {role.fieldConfiguration.name}</div>}
                          </div>
                        </td>
                        <td>
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            role.hasAssignments 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-500'
                          }`}>
                            {role.hasAssignments ? 'Y' : 'N'}
                          </span>
                        </td>
                        <td>
                          <button
                            onClick={() => {
                              onPermissionGrantClick?.(role);
                            }}
                            className={`${buttons.button} ${buttons.buttonSmall} ${buttons.buttonSecondary}`}
                            title="Gestisci Grants"
                          >
                            <Shield size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}

