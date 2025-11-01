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
  STATUS_OWNERS: { label: "Status Owners", icon: Shield, color: "green", description: "Per ogni WorkflowStatus" },
  FIELD_OWNERS: { label: "Field Owners", icon: Edit, color: "purple", description: "Per ogni FieldConfiguration (sempre)" },
  CREATORS: { label: "Creators", icon: Plus, color: "orange", description: "Per ogni Workflow" },
  EXECUTORS: { label: "Executors", icon: Shield, color: "red", description: "Per ogni Transition" },
  EDITORS: { label: "Editors", icon: Edit, color: "indigo", description: "Per coppia (Field + Status)" },
  VIEWERS: { label: "Viewers", icon: Eye, color: "gray", description: "Per coppia (Field + Status)" },
};

interface ItemTypeSetRoleManagerProps {
  itemTypeSetId: number;
  onPermissionGrantClick?: (permission: any) => void;
  refreshTrigger?: number;
  projectId?: string; // Per includere grant di progetto quando si caricano le permissions
  showOnlyWithAssignments?: boolean; // Se true, mostra solo le permission con assegnazioni
  showOnlyProjectGrants?: boolean; // Se true, nella colonna Assegnazioni mostra solo i dettagli dei grant di progetto (non quelli globali). Non filtra le permission.
}

export default function ItemTypeSetRoleManager({
  itemTypeSetId,
  onPermissionGrantClick,
  refreshTrigger,
  projectId,
  showOnlyWithAssignments = false,
  showOnlyProjectGrants = false,
}: ItemTypeSetRoleManagerProps) {
  const [roles, setRoles] = useState<any>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [grantDetailsMap, setGrantDetailsMap] = useState<Map<number, any>>(new Map());
  const [filters, setFilters] = useState<FilterValues>({
    permission: "All",
    itemTypes: ["All"],
    status: "All",
    field: "All",
    workflow: "All",
    grant: showOnlyWithAssignments ? "Y" : "All",
  });

  useEffect(() => {
    if (itemTypeSetId) {
      fetchRoles();
    }
  }, [itemTypeSetId, refreshTrigger, projectId]);

  const fetchRoles = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Piccolo delay per assicurarsi che il backend abbia finito di salvare
      await new Promise(resolve => setTimeout(resolve, 200));
      
      const url = projectId 
        ? `/itemtypeset-permissions/itemtypeset/${itemTypeSetId}?projectId=${projectId}`
        : `/itemtypeset-permissions/itemtypeset/${itemTypeSetId}`;
      const response = await api.get(url);
      setRoles(response.data);
      
      // Carica i dettagli dei grant per tutte le permission che ne hanno uno
      const allPermissions: any[] = [];
      Object.values(response.data).forEach((permissionList: any) => {
        if (Array.isArray(permissionList)) {
          allPermissions.push(...permissionList);
        }
      });
      
      const detailsMap = new Map<number, any>();
      const fetchPromises = allPermissions
        .filter((perm: any) => {
          const roleId = perm.itemTypeSetRoleId || perm.id;
          return roleId && typeof roleId === 'number' && (perm.grantId || perm.hasProjectGrant);
        })
        .map(async (perm: any) => {
          const roleId = perm.itemTypeSetRoleId || perm.id;
          const grantDetails: any = {};
          
          // Carica grant globale se presente (solo se non siamo in modalità showOnlyProjectGrants)
          if (perm.grantId && !showOnlyProjectGrants) {
            try {
              const grantResponse = await api.get(`/itemtypeset-roles/${roleId}/grant-details`);
              Object.assign(grantDetails, grantResponse.data);
            } catch (err) {
              console.error(`Error fetching grant details for role ${roleId}:`, err);
            }
          }
          
          // Carica grant di progetto se presente e se abbiamo projectId
          if (perm.hasProjectGrant && projectId) {
            try {
              const projectGrantResponse = await api.get(`/project-itemtypeset-role-grants/project/${projectId}/role/${roleId}`);
              // Se showOnlyProjectGrants è true, carica solo i grant di progetto senza combinare con quelli globali
              if (showOnlyProjectGrants) {
                Object.assign(grantDetails, projectGrantResponse.data);
                grantDetails.isProjectGrant = true;
              } else {
                // Combina i dettagli del grant di progetto con quelli globali
                if (grantDetails.users || grantDetails.groups) {
                  // Se ci sono già grant globali, combina le liste
                  grantDetails.users = [...(grantDetails.users || []), ...(projectGrantResponse.data.users || [])];
                  grantDetails.groups = [...(grantDetails.groups || []), ...(projectGrantResponse.data.groups || [])];
                  grantDetails.negatedUsers = [...(grantDetails.negatedUsers || []), ...(projectGrantResponse.data.negatedUsers || [])];
                  grantDetails.negatedGroups = [...(grantDetails.negatedGroups || []), ...(projectGrantResponse.data.negatedGroups || [])];
                } else {
                  Object.assign(grantDetails, projectGrantResponse.data);
                }
                grantDetails.isProjectGrant = true;
              }
            } catch (err) {
              console.error(`Error fetching project grant details for role ${roleId}:`, err);
            }
          }
          
          // Se showOnlyProjectGrants è true, non caricare i grant globali
          if (showOnlyProjectGrants && perm.grantId) {
            // Resetta i grant globali se esistono
            delete grantDetails.users;
            delete grantDetails.groups;
            delete grantDetails.negatedUsers;
            delete grantDetails.negatedGroups;
          }
          
          if (Object.keys(grantDetails).length > 0) {
            detailsMap.set(roleId, grantDetails);
          }
        });
      
      await Promise.all(fetchPromises);
      setGrantDetailsMap(detailsMap);
    } catch (err: any) {
      if (err.response?.status === 500) {
        try {
          await api.post(`/itemtypeset-permissions/create-for-itemtypeset/${itemTypeSetId}`);
          const url = projectId 
            ? `/itemtypeset-permissions/itemtypeset/${itemTypeSetId}?projectId=${projectId}`
            : `/itemtypeset-permissions/itemtypeset/${itemTypeSetId}`;
          const retryResponse = await api.get(url);
          setRoles(retryResponse.data);
          
          // Carica i dettagli dei grant anche dopo il retry
          const allPermissions: any[] = [];
          Object.values(retryResponse.data).forEach((permissionList: any) => {
            if (Array.isArray(permissionList)) {
              allPermissions.push(...permissionList);
            }
          });
          
          const detailsMap = new Map<number, any>();
          const fetchPromises = allPermissions
            .filter((perm: any) => {
              const roleId = perm.itemTypeSetRoleId || perm.id;
              return roleId && typeof roleId === 'number' && (perm.grantId || perm.hasProjectGrant);
            })
            .map(async (perm: any) => {
              const roleId = perm.itemTypeSetRoleId || perm.id;
              const grantDetails: any = {};
              
              // Carica grant globale se presente (solo se non siamo in modalità showOnlyProjectGrants)
              if (perm.grantId && !showOnlyProjectGrants) {
                try {
                  const grantResponse = await api.get(`/itemtypeset-roles/${roleId}/grant-details`);
                  Object.assign(grantDetails, grantResponse.data);
                } catch (err) {
                  console.error(`Error fetching grant details for role ${roleId}:`, err);
                }
              }
              
              // Carica grant di progetto se presente e se abbiamo projectId
              if (perm.hasProjectGrant && projectId) {
                try {
                  const projectGrantResponse = await api.get(`/project-itemtypeset-role-grants/project/${projectId}/role/${roleId}`);
                  // Se showOnlyProjectGrants è true, carica solo i grant di progetto senza combinare con quelli globali
                  if (showOnlyProjectGrants) {
                    Object.assign(grantDetails, projectGrantResponse.data);
                    grantDetails.isProjectGrant = true;
                  } else {
                    // Combina i dettagli del grant di progetto con quelli globali
                    if (grantDetails.users || grantDetails.groups) {
                      // Se ci sono già grant globali, combina le liste
                      grantDetails.users = [...(grantDetails.users || []), ...(projectGrantResponse.data.users || [])];
                      grantDetails.groups = [...(grantDetails.groups || []), ...(projectGrantResponse.data.groups || [])];
                      grantDetails.negatedUsers = [...(grantDetails.negatedUsers || []), ...(projectGrantResponse.data.negatedUsers || [])];
                      grantDetails.negatedGroups = [...(grantDetails.negatedGroups || []), ...(projectGrantResponse.data.negatedGroups || [])];
                    } else {
                      Object.assign(grantDetails, projectGrantResponse.data);
                    }
                    grantDetails.isProjectGrant = true;
                  }
                } catch (err) {
                  console.error(`Error fetching project grant details for role ${roleId}:`, err);
                }
              }
              
              // Se showOnlyProjectGrants è true, non caricare i grant globali
              if (showOnlyProjectGrants && perm.grantId) {
                // Resetta i grant globali se esistono
                delete grantDetails.users;
                delete grantDetails.groups;
                delete grantDetails.negatedUsers;
                delete grantDetails.negatedGroups;
              }
              
              if (Object.keys(grantDetails).length > 0) {
                detailsMap.set(roleId, grantDetails);
              }
            });
          
          await Promise.all(fetchPromises);
          setGrantDetailsMap(detailsMap);
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

    // Filtra per assegnazioni (ruoli o grant)
    // Nota: showOnlyProjectGrants non filtra le permission (mostra tutte), ma modifica solo cosa viene mostrato nella colonna Assegnazioni
    // Se showOnlyWithAssignments è true, mostra solo quelle con assegnazioni (ruoli O grant globali O di progetto)
    if (showOnlyWithAssignments || filters.grant !== "All") {
      // Se showOnlyProjectGrants è true, il filtro controlla solo le assegnazioni di progetto
      if (showOnlyProjectGrants && filters.grant !== "All") {
        if (filters.grant === "Y" && !permission.hasProjectGrant) {
          return false;
        }
        if (filters.grant === "N" && permission.hasProjectGrant) {
          return false;
        }
      } else {
        // Comportamento normale: controlla tutte le assegnazioni (ruoli O grant globali O di progetto)
        const hasRoles = permission.hasAssignments === true || (permission.assignedRoles && permission.assignedRoles.length > 0);
        const hasGrant = permission.grantId != null || permission.assignmentType === 'GRANT' || permission.hasProjectGrant;
        const hasAssignments = hasRoles || hasGrant;
        
        // Se showOnlyWithAssignments è true, filtra sempre per mostrare solo quelle con assegnazioni
        if (showOnlyWithAssignments && !hasAssignments) {
          return false;
        }
        
        if (filters.grant !== "All") {
          if (filters.grant === "Y" && !hasAssignments) {
            return false;
          }
          if (filters.grant === "N" && hasAssignments) {
            return false;
          }
        }
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
  const roleOrder = ['WORKERS', 'CREATORS', 'STATUS_OWNERS', 'EXECUTORS', 'FIELD_OWNERS', 'EDITORS', 'VIEWERS'];

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
            hideGrantFilter={showOnlyWithAssignments}
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
                      <th>Assegnazioni</th>
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
                          {(() => {
                            const roleId = role.itemTypeSetRoleId || role.id;
                            const grantDetails = roleId ? grantDetailsMap.get(roleId) : null;
                            
                            // Se showOnlyProjectGrants è true, mostra solo grant di progetto
                            if (showOnlyProjectGrants) {
                              if (!role.hasProjectGrant) {
                                return (
                                  <span className={`px-2 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-500`}>
                                    N
                                  </span>
                                );
                              }
                              
                              // Carica solo i dettagli del grant di progetto (senza combinare con quelli globali)
                              // I dettagli dovrebbero essere già caricati separatamente se isProjectGrant è true
                              if (!grantDetails || !grantDetails.isProjectGrant) {
                                return (
                                  <div className="text-xs text-gray-500 italic">Caricamento dettagli grant di progetto...</div>
                                );
                              }
                              
                              // Mostra solo i dettagli del grant di progetto
                              return (
                                <div className="text-sm space-y-1">
                                  {grantDetails.users && grantDetails.users.length > 0 && (
                                    <div>
                                      <span className="text-xs font-semibold text-green-700">Utenti: </span>
                                      <span className="text-xs text-gray-600">
                                        {grantDetails.users.map((u: any) => u.fullName || u.username || 'Utente').join(', ')}
                                      </span>
                                    </div>
                                  )}
                                  {grantDetails.groups && grantDetails.groups.length > 0 && (
                                    <div>
                                      <span className="text-xs font-semibold text-green-700">Gruppi: </span>
                                      <span className="text-xs text-gray-600">
                                        {grantDetails.groups.map((g: any) => g.name).join(', ')}
                                      </span>
                                    </div>
                                  )}
                                  {grantDetails.negatedUsers && grantDetails.negatedUsers.length > 0 && (
                                    <div>
                                      <span className="text-xs font-semibold text-red-700">Utenti Negati: </span>
                                      <span className="text-xs text-gray-600">
                                        {grantDetails.negatedUsers.map((u: any) => u.fullName || u.username || 'Utente').join(', ')}
                                      </span>
                                    </div>
                                  )}
                                  {grantDetails.negatedGroups && grantDetails.negatedGroups.length > 0 && (
                                    <div>
                                      <span className="text-xs font-semibold text-red-700">Gruppi Negati: </span>
                                      <span className="text-xs text-gray-600">
                                        {grantDetails.negatedGroups.map((g: any) => g.name).join(', ')}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              );
                            }
                            
                            // Comportamento normale: mostra tutte le assegnazioni
                            // Controlla se ci sono assegnazioni: ruoli O grant (globali O di progetto)
                            const hasRoles = role.hasAssignments === true || (role.assignedRoles && role.assignedRoles.length > 0);
                            const hasGrant = role.grantId != null || role.assignmentType === 'GRANT' || role.hasProjectGrant;
                            const hasAssignments = hasRoles || hasGrant;
                            
                            if (!hasAssignments) {
                              return (
                                <span className={`px-2 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-500`}>
                                  N
                                </span>
                              );
                            }
                            
                            return (
                              <div className="text-sm space-y-1">
                                {/* Ruoli assegnati */}
                                {hasRoles && role.assignedRoles && role.assignedRoles.length > 0 && (
                                  <div>
                                    <span className="text-xs font-semibold text-gray-700">Ruoli: </span>
                                    <span className="text-xs text-gray-600">
                                      {role.assignedRoles.map((r: any) => r.name || r).join(', ')}
                                    </span>
                                  </div>
                                )}
                                
                                {/* Dettagli Grant - mostra sia grant globali che di progetto */}
                                {hasGrant && grantDetails && (
                                  <>
                                    {grantDetails.users && grantDetails.users.length > 0 && (
                                      <div>
                                        <span className="text-xs font-semibold text-green-700">Utenti: </span>
                                        <span className="text-xs text-gray-600">
                                          {grantDetails.users.map((u: any) => u.fullName || u.username || 'Utente').join(', ')}
                                        </span>
                                      </div>
                                    )}
                                    {grantDetails.groups && grantDetails.groups.length > 0 && (
                                      <div>
                                        <span className="text-xs font-semibold text-green-700">Gruppi: </span>
                                        <span className="text-xs text-gray-600">
                                          {grantDetails.groups.map((g: any) => g.name).join(', ')}
                                        </span>
                                      </div>
                                    )}
                                    {grantDetails.negatedUsers && grantDetails.negatedUsers.length > 0 && (
                                      <div>
                                        <span className="text-xs font-semibold text-red-700">Utenti Negati: </span>
                                        <span className="text-xs text-gray-600">
                                          {grantDetails.negatedUsers.map((u: any) => u.fullName || u.username || 'Utente').join(', ')}
                                        </span>
                                      </div>
                                    )}
                                    {grantDetails.negatedGroups && grantDetails.negatedGroups.length > 0 && (
                                      <div>
                                        <span className="text-xs font-semibold text-red-700">Gruppi Negati: </span>
                                        <span className="text-xs text-gray-600">
                                          {grantDetails.negatedGroups.map((g: any) => g.name).join(', ')}
                                        </span>
                                      </div>
                                    )}
                                  </>
                                )}
                                
                                {/* Fallback se grant esiste ma dettagli non ancora caricati */}
                                {hasGrant && !grantDetails && (
                                  <div className="text-xs text-gray-500 italic">Caricamento dettagli grant...</div>
                                )}
                              </div>
                            );
                          })()}
                        </td>
                        <td>
                          {onPermissionGrantClick ? (
                            <button
                              onClick={() => {
                                onPermissionGrantClick(role);
                              }}
                              className={buttons.button}
                              style={{ padding: "0.25rem 0.5rem", fontSize: "0.75rem" }}
                              title="Gestisci Ruoli"
                            >
                              <Shield size={14} />
                            </button>
                          ) : (
                            <span className="text-xs text-gray-400 italic">Sola lettura</span>
                          )}
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

