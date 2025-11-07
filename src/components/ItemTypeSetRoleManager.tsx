/**
 * ItemTypeSetRoleManager - Complex permission management component
 * Using pragmatic typing with 'any' for complex nested structures
 */
import { useState, useEffect, useRef } from "react";
import { Users, Shield, Edit, Eye, Plus } from "lucide-react";
import api from "../api/api";
import PermissionFilters, { FilterValues } from "./PermissionFilters";

import layout from "../styles/common/Layout.module.css";
import buttons from "../styles/common/Buttons.module.css";
import alert from "../styles/common/Alerts.module.css";
import utilities from "../styles/common/Utilities.module.css";
import table from "../styles/common/Tables.module.css";

// Dopo la migrazione, le chiavi sono i nomi completi delle permission
const ROLE_TYPES: any = {
  "Workers": { label: "Workers", icon: Users, color: "blue", description: "Per ogni ItemType" },
  "Status Owners": { label: "Status Owners", icon: Shield, color: "green", description: "Per ogni WorkflowStatus" },
  "Field Owners": { label: "Field Owners", icon: Edit, color: "purple", description: "Per ogni FieldConfiguration (sempre)" },
  "Creators": { label: "Creators", icon: Plus, color: "orange", description: "Per ogni Workflow" },
  "Executors": { label: "Executors", icon: Shield, color: "red", description: "Per ogni Transition" },
  "Editors": { label: "Editors", icon: Edit, color: "indigo", description: "Per coppia (Field + Status)" },
  "Viewers": { label: "Viewers", icon: Eye, color: "gray", description: "Per coppia (Field + Status)" },
};

interface ItemTypeSetRoleManagerProps {
  itemTypeSetId: number;
  onPermissionGrantClick?: (permission: any) => void;
  refreshTrigger?: number;
  projectId?: string; // Per includere grant di progetto quando si caricano le permissions
  showOnlyWithAssignments?: boolean; // Se true, mostra solo le permission con assegnazioni
  showOnlyProjectGrants?: boolean; // Se true, nella colonna Assegnazioni mostra solo i dettagli dei grant di progetto (non quelli globali). Non filtra le permission.
  includeProjectAssignments?: boolean; // Se false, ignora completam. assegnazioni specifiche di progetto anche se projectId presente
}

export default function ItemTypeSetRoleManager({
  itemTypeSetId,
  onPermissionGrantClick,
  refreshTrigger,
  projectId,
  showOnlyWithAssignments = false,
  showOnlyProjectGrants = false,
  includeProjectAssignments = true,
}: ItemTypeSetRoleManagerProps) {
  const [roles, setRoles] = useState<any>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [grantDetailsMap, setGrantDetailsMap] = useState<Map<string, any>>(new Map());
  const [loadingGrantDetails, setLoadingGrantDetails] = useState<Set<number>>(new Set());
  const loadedGrantDetailsRef = useRef<Set<number>>(new Set());
  
  // Stati per i modals dei popup
  const [selectedRolesDetails, setSelectedRolesDetails] = useState<{
    permissionName: string;
    roles: string[];
  } | null>(null);
  const [selectedGrantDetails, setSelectedGrantDetails] = useState<{
    projectId: number;
    projectName: string;
    roleId: number;
    details: any;
    isProjectGrant: boolean;
  } | null>(null);
  const [loadingGrantPopup, setLoadingGrantPopup] = useState(false);
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

  // useEffect per caricare i dettagli delle grant di progetto on-demand quando showOnlyProjectGrants è true
  useEffect(() => {
    if (!includeProjectAssignments || !showOnlyProjectGrants || !projectId || !roles) return;

    // Trova tutte le permission che hanno roleId ma non hanno ancora i dettagli caricati
    const allPermissions: any[] = [];
    Object.values(roles).forEach((permissionList: any) => {
      if (Array.isArray(permissionList)) {
        allPermissions.push(...permissionList);
      }
    });

    const missingDetails: string[] = []; // Chiave: `${permissionType}-${permissionId}`
    allPermissions.forEach((perm: any) => {
      const permissionId = perm.id;
      const permissionType = perm.permissionType;
      if (permissionId && typeof permissionId === 'number' && permissionType) {
        const mapKey = `${permissionType}-${permissionId}`;
        // Usa il ref per verificare se abbiamo già tentato di caricare questa permission
        if (!loadedGrantDetailsRef.current.has(mapKey)) {
          missingDetails.push(mapKey);
        }
      }
    });

    // Carica i dettagli mancanti
    if (missingDetails.length > 0) {
      missingDetails.forEach((mapKey) => {
        // Estrai permissionType e permissionId dalla chiave
        const [permissionType, permissionIdStr] = mapKey.split('-');
        const permissionId = parseInt(permissionIdStr, 10);
        
        // Segna che stiamo tentando di caricare questa permission
        loadedGrantDetailsRef.current.add(mapKey);
        setLoadingGrantDetails((prev) => new Set(prev).add(permissionId));
        
        // Usa il nuovo endpoint ProjectPermissionAssignment
        api.get(`/project-permission-assignments/${permissionType}/${permissionId}/project/${projectId}`)
          .then((response) => {
            const assignment = response.data;
            const projectGrant = assignment?.grant;

            if (!projectGrant) {
              setGrantDetailsMap((prev) => {
                const newMap = new Map(prev);
                newMap.set(mapKey, { isProjectGrant: false });
                return newMap;
              });
              return;
            }

            const newGrantDetails: any = {
              isProjectGrant: true,
              users: Array.from(projectGrant.users || []),
              groups: Array.from(projectGrant.groups || []),
              negatedUsers: Array.from(projectGrant.negatedUsers || []),
              negatedGroups: Array.from(projectGrant.negatedGroups || []),
            };

            setGrantDetailsMap((prev) => {
              const newMap = new Map(prev);
              newMap.set(mapKey, newGrantDetails);
              return newMap;
            });
          })
          .catch((err: any) => {
            // Gestisce ancora il caso 404 per retrocompatibilità, ma ora il backend restituisce 200 con assignment null
            if (err.response?.status === 404) {
              // Grant non esiste, settiamo isProjectGrant a false
              setGrantDetailsMap((prev) => {
                const newMap = new Map(prev);
                newMap.set(mapKey, { isProjectGrant: false });
                return newMap;
              });
            } else {
              console.error(`Error fetching project grant details for permission ${mapKey}:`, err);
              // In caso di errore diverso da 404, rimuovi dal ref per permettere un retry
              loadedGrantDetailsRef.current.delete(mapKey);
            }
          })
          .finally(() => {
            setLoadingGrantDetails((prev) => {
              const newSet = new Set(prev);
              newSet.delete(permissionId);
              return newSet;
            });
          });
      });
    }
  }, [showOnlyProjectGrants, projectId, roles]);

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
      const rolesData = response.data;
      // Normalizza il flag hasProjectGrant in base ai campi restituiti dal backend
      Object.values(rolesData).forEach((permissionList: any) => {
        if (Array.isArray(permissionList)) {
          permissionList.forEach((perm: any) => {
            if (includeProjectAssignments) {
              const hasProjectGrant =
                Boolean(perm.projectGrantId) ||
                (Array.isArray(perm.projectGrants) && perm.projectGrants.length > 0);
              perm.hasProjectGrant = hasProjectGrant;
            } else {
              perm.hasProjectGrant = false;
            }
          });
        }
      });
      setRoles(rolesData);
      
      // Carica i dettagli dei grant per tutte le permission che ne hanno uno
      const allPermissions: any[] = [];
      Object.values(response.data).forEach((permissionList: any) => {
        if (Array.isArray(permissionList)) {
          allPermissions.push(...permissionList);
        }
      });
      
      const detailsMap = new Map<string, any>(); // Chiave: `${permissionType}-${permissionId}`
      const fetchPromises = allPermissions
        .filter((perm: any) => {
          // Dopo la migrazione, usiamo permissionId e permissionType invece di itemTypeSetRoleId
          const permissionId = perm.id;
          const permissionType = perm.permissionType;
          if (!permissionId || typeof permissionId !== 'number' || !permissionType) {
            return false;
          }
          // Se showOnlyProjectGrants è true, includiamo tutte le permission valide
          if (showOnlyProjectGrants) {
            return true;
          }
          // Comportamento normale: include se ha grantId o (se consentito) hasProjectGrant
          return perm.grantId != null || (includeProjectAssignments && perm.hasProjectGrant === true);
        })
        .map(async (perm: any) => {
          // Dopo la migrazione, usiamo permissionId e permissionType
          const permissionId = perm.id;
          const permissionType = perm.permissionType;
          if (!permissionId || typeof permissionId !== 'number' || !permissionType) {
            console.warn('Permission senza id o permissionType:', perm);
            return;
          }
          const grantDetails: any = {};
          const mapKey = `${permissionType}-${permissionId}`;
          
          // Carica grant globale se presente (solo se non siamo in modalità showOnlyProjectGrants)
          if (perm.grantId && !showOnlyProjectGrants) {
            try {
              // Usa il nuovo endpoint PermissionAssignment
              const grantResponse = await api.get(`/permission-assignments/${permissionType}/${permissionId}`);
              const assignment = grantResponse.data;
              if (assignment.grant) {
                // Estrai i dati del grant dalla struttura PermissionAssignmentDto
                grantDetails.users = Array.from(assignment.grant.users || []);
                grantDetails.groups = Array.from(assignment.grant.groups || []);
                grantDetails.negatedUsers = Array.from(assignment.grant.negatedUsers || []);
                grantDetails.negatedGroups = Array.from(assignment.grant.negatedGroups || []);
              }
            } catch (err) {
              console.error(`Error fetching grant details for permission ${permissionType}/${permissionId}:`, err);
            }
          }
          
          // Carica grant di progetto SOLO se showOnlyProjectGrants è true
          // Quando showOnlyProjectGrants è false, mostriamo solo le grant globali
          // NOTA: Tentiamo sempre di caricare la grant di progetto quando showOnlyProjectGrants è true,
          // anche se hasProjectGrant non è ancora settato, così possiamo verificare se esiste
          if (includeProjectAssignments && showOnlyProjectGrants && projectId) {
            try {
              // Usa il nuovo endpoint ProjectPermissionAssignment
              const projectGrantResponse = await api.get(`/project-permission-assignments/${permissionType}/${permissionId}/project/${projectId}`);
              const assignment = projectGrantResponse.data;
              if (!assignment || !assignment.grant) {
                grantDetails.isProjectGrant = false;
              } else {
                // Pulisce i dettagli prima di assegnare quelli del progetto
                Object.keys(grantDetails).forEach(key => delete grantDetails[key]);
                grantDetails.users = Array.from(assignment.grant.users || []);
                grantDetails.groups = Array.from(assignment.grant.groups || []);
                grantDetails.negatedUsers = Array.from(assignment.grant.negatedUsers || []);
                grantDetails.negatedGroups = Array.from(assignment.grant.negatedGroups || []);
                grantDetails.isProjectGrant = true;
              }
            } catch (err: any) {
              // Gestisce ancora il caso 404 per retrocompatibilità, ma ora il backend restituisce 200 con assignment null
              // Se l'errore è 404, significa che la grant non esiste ancora
              // Se è un altro errore, loggiamolo ma non blocchiamo il rendering
              if (err.response?.status === 404) {
                // Grant non esiste, settiamo isProjectGrant a false per indicare che non c'è grant
                grantDetails.isProjectGrant = false;
              } else {
                console.error(`[fetchRoles] Error fetching project grant details for permission ${permissionType}/${permissionId}:`, err);
                // Per altri errori, non settiamo isProjectGrant per permettere un retry
              }
            }
          }
          
          // Salva i dettagli se abbiamo almeno isProjectGrant settato o se ci sono dati
          // Questo permette di distinguere tra "non ancora caricato" e "non ha grant"
          if (grantDetails.isProjectGrant !== undefined || Object.keys(grantDetails).length > 0) {
            detailsMap.set(mapKey, grantDetails);
          }
        });
      
      await Promise.all(fetchPromises);
      setGrantDetailsMap(detailsMap);
      
      // Reset il ref quando vengono ricaricate le roles
      if (showOnlyProjectGrants) {
        loadedGrantDetailsRef.current.clear();
      }
    } catch (err: any) {
      if (err.response?.status === 500) {
        try {
          await api.post(`/itemtypeset-permissions/create-for-itemtypeset/${itemTypeSetId}`);
          const url = projectId 
            ? `/itemtypeset-permissions/itemtypeset/${itemTypeSetId}?projectId=${projectId}`
            : `/itemtypeset-permissions/itemtypeset/${itemTypeSetId}`;
          const retryResponse = await api.get(url);
          const retryData = retryResponse.data;
          Object.values(retryData).forEach((permissionList: any) => {
            if (Array.isArray(permissionList)) {
              permissionList.forEach((perm: any) => {
                const hasProjectGrant =
                  Boolean(perm.projectGrantId) ||
                  (Array.isArray(perm.projectGrants) && perm.projectGrants.length > 0);
                perm.hasProjectGrant = hasProjectGrant;
              });
            }
          });
          setRoles(retryData);
          
          // Carica i dettagli dei grant anche dopo il retry
          const allPermissions: any[] = [];
          Object.values(retryResponse.data).forEach((permissionList: any) => {
            if (Array.isArray(permissionList)) {
              allPermissions.push(...permissionList);
            }
          });
          
          const detailsMap = new Map<string, any>(); // Chiave: `${permissionType}-${permissionId}`
          const fetchPromises = allPermissions
            .filter((perm: any) => {
              // Dopo la migrazione, usiamo permissionId e permissionType
              const permissionId = perm.id;
              const permissionType = perm.permissionType;
              if (!permissionId || typeof permissionId !== 'number' || !permissionType) {
                return false;
              }
              // Se showOnlyProjectGrants è true, includiamo tutte le permission valide
              if (showOnlyProjectGrants) {
                return true;
              }
              // Comportamento normale: include se ha grantId o hasProjectGrant
              return perm.grantId != null || perm.hasProjectGrant === true;
            })
            .map(async (perm: any) => {
              // Dopo la migrazione, usiamo permissionId e permissionType
              const permissionId = perm.id;
              const permissionType = perm.permissionType;
              if (!permissionId || typeof permissionId !== 'number' || !permissionType) {
                console.warn('Permission senza id o permissionType (retry):', perm);
                return;
              }
              const grantDetails: any = {};
              const mapKey = `${permissionType}-${permissionId}`;
              
              // Carica grant globale se presente (solo se non siamo in modalità showOnlyProjectGrants)
              if (perm.grantId && !showOnlyProjectGrants) {
                try {
                  // Usa il nuovo endpoint PermissionAssignment
                  const grantResponse = await api.get(`/permission-assignments/${permissionType}/${permissionId}`);
                  const assignment = grantResponse.data;
                  if (assignment.grant) {
                    grantDetails.users = Array.from(assignment.grant.users || []);
                    grantDetails.groups = Array.from(assignment.grant.groups || []);
                    grantDetails.negatedUsers = Array.from(assignment.grant.negatedUsers || []);
                    grantDetails.negatedGroups = Array.from(assignment.grant.negatedGroups || []);
                  }
                } catch (err) {
                  console.error(`Error fetching grant details for permission ${permissionType}/${permissionId}:`, err);
                }
              }
              
              // Carica grant di progetto SOLO se showOnlyProjectGrants è true
              // Quando showOnlyProjectGrants è false, mostriamo solo le grant globali
              if (includeProjectAssignments && showOnlyProjectGrants && projectId) {
                try {
                  // Usa il nuovo endpoint ProjectPermissionAssignment
                  const projectGrantResponse = await api.get(`/project-permission-assignments/${permissionType}/${permissionId}/project/${projectId}`);
                  const assignment = projectGrantResponse.data;
                  // Pulisce i dettagli prima di assegnare quelli del progetto
                  Object.keys(grantDetails).forEach(key => delete grantDetails[key]);
                  if (assignment && assignment.grant) {
                    grantDetails.users = Array.from(assignment.grant.users || []);
                    grantDetails.groups = Array.from(assignment.grant.groups || []);
                    grantDetails.negatedUsers = Array.from(assignment.grant.negatedUsers || []);
                    grantDetails.negatedGroups = Array.from(assignment.grant.negatedGroups || []);
                  }
                  grantDetails.isProjectGrant = true;
                } catch (err) {
                  console.error(`Error fetching project grant details for permission ${permissionType}/${permissionId}:`, err);
                  // Anche in caso di errore, settiamo isProjectGrant per indicare che abbiamo tentato di caricare
                  grantDetails.isProjectGrant = false;
                }
              }
              
              // Salva i dettagli se abbiamo almeno isProjectGrant settato o se ci sono dati
              // Questo permette di distinguere tra "non ancora caricato" e "non ha grant"
              if (grantDetails.isProjectGrant !== undefined || Object.keys(grantDetails).length > 0) {
                detailsMap.set(mapKey, grantDetails);
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
      // Usa il nome invece dell'ID per includere stati con stesso nome da workflow diversi
      // Il filtro può contenere o un ID o un nome
      if (!permission.workflowStatus) {
        return false;
      }
      // Controlla sia per ID che per nome (per compatibilità)
      const statusId = permission.workflowStatus.id.toString();
      const statusName = permission.workflowStatus.name;
      if (statusId !== filters.status && statusName !== filters.status) {
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
      // Se showOnlyProjectGrants è true, il filtro controlla solo le assegnazioni di progetto (grant O ruoli)
      if (showOnlyProjectGrants && filters.grant !== "All") {
        const hasProjectAssignments = permission.hasProjectGrant || permission.hasProjectRoles || 
                                      (permission.projectAssignedRoles && permission.projectAssignedRoles.length > 0);
        if (filters.grant === "Y" && !hasProjectAssignments) {
          return false;
        }
        if (filters.grant === "N" && hasProjectAssignments) {
          return false;
        }
      } else {
        // Comportamento normale: controlla tutte le assegnazioni (ruoli globali O ruoli di progetto O grant globali O di progetto)
        const hasGlobalRoles = permission.hasAssignments === true || (permission.assignedRoles && permission.assignedRoles.length > 0);
        const hasProjectRoles = permission.hasProjectRoles === true || (permission.projectAssignedRoles && permission.projectAssignedRoles.length > 0);
        const hasRoles = hasGlobalRoles || hasProjectRoles;
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

  // Funzione helper per generare il nome della permission
  const getPermissionName = (role: any): string => {
    if (role.name) return role.name;
    
    // Costruisci il nome basandoti sul tipo di ruolo
    const parts: string[] = [];
    
    if (role.itemType) parts.push(`ItemType: ${role.itemType.name}`);
    if (role.workflowStatus) parts.push(`Status: ${role.workflowStatus.name}`);
    if (role.transition) {
      const from = role.fromStatus?.name || 'N/A';
      const to = role.toStatus?.name || 'N/A';
      const transName = role.transition.name && role.transition.name !== 'N/A' ? ` (${role.transition.name})` : '';
      parts.push(`Transition: ${from} → ${to}${transName}`);
    }
    if (role.fieldConfiguration) parts.push(`Field: ${role.fieldConfiguration.name}`);
    
    return parts.length > 0 ? parts.join(', ') : 'Permission';
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
  // IMPORTANTE: Le chiavi devono corrispondere esattamente a quelle restituite dal backend
  const roleOrder = ['Workers', 'Creators', 'Status Owners', 'Executors', 'Field Owners', 'Editors', 'Viewers'];

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
                                  <span className="ml-1 text-xs text-gray-500"> ({role.transition.name})</span>
                                )}
                              </div>
                            )}
                            {role.fieldConfiguration && <div><strong>Field:</strong> {role.fieldConfiguration.name}</div>}
                          </div>
                        </td>
                        <td>
                          {(() => {
                            // Dopo la migrazione, usiamo permissionId e permissionType
                            const permissionId = role.id;
                            const permissionType = role.permissionType;
                            
                            if (!permissionId || typeof permissionId !== 'number' || !permissionType) {
                              // Se non abbiamo permissionId o permissionType, non possiamo mostrare i dettagli del grant
                              return (
                                <span className={`px-2 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-500`}>
                                  N/A
                                </span>
                              );
                            }
                            
                            const mapKey = `${permissionType}-${permissionId}`;
                            
                            // Se showOnlyProjectGrants è true, mostra solo grant di progetto
                            if (showOnlyProjectGrants) {
                              // Prima controlla se ci sono ruoli di progetto (questi sono sempre disponibili)
                              const projectRoles = role.projectAssignedRoles || [];
                              const projectRolesCount = projectRoles.length;
                              const hasProjectRoles = projectRolesCount > 0;
                              
                              // Poi controlla i dettagli delle grant (che vengono caricati via useEffect)
                              const grantDetails = grantDetailsMap.get(mapKey);
                              const hasUsers = grantDetails?.users && grantDetails.users.length > 0;
                              const hasGroups = grantDetails?.groups && grantDetails.groups.length > 0;
                              const hasNegatedUsers = grantDetails?.negatedUsers && grantDetails.negatedUsers.length > 0;
                              const hasNegatedGroups = grantDetails?.negatedGroups && grantDetails.negatedGroups.length > 0;
                              const hasGrant = hasUsers || hasGroups || hasNegatedUsers || hasNegatedGroups;
                              
                              // Se non ci sono né ruoli né grant, controlla se stiamo caricando o se non c'è nulla
                              if (!hasProjectRoles && !hasGrant) {
                                // Se stiamo caricando i dettagli delle grant, mostra messaggio di caricamento
                                if (loadingGrantDetails.has(permissionId)) {
                                  return (
                                    <div className="text-xs text-gray-500 italic">
                                      Caricamento dettagli grant di progetto...
                                    </div>
                                  );
                                }
                                
                                // Se abbiamo tentato di caricare ma non c'è grant (404), mostriamo "N"
                                if (grantDetails && grantDetails.isProjectGrant === false) {
                                  return (
                                    <span className={`px-2 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-500`}>
                                      N
                                    </span>
                                  );
                                }
                                
                                // Se non abbiamo ancora tentato di caricare e non ci sono ruoli di progetto,
                                // significa che non ci sono assegnazioni (i ruoli di progetto sono sempre disponibili nei dati)
                                // Mostriamo "N" invece di "Caricamento..." perché i ruoli sono già stati controllati
                                return (
                                  <span className={`px-2 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-500`}>
                                    N
                                  </span>
                                );
                              }
                              
                              // Se abbiamo i dettagli delle grant ma sono vuoti (nessun utente/gruppo), mostriamo comunque i ruoli se presenti
                              if (grantDetails && grantDetails.isProjectGrant === true && !hasGrant && !hasProjectRoles) {
                                return (
                                  <span className={`px-2 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700`}>
                                    Grant vuota
                                  </span>
                                );
                              }
                              
                              // Mostra ruoli e dettagli del grant di progetto
                              // Ordine: Ruoli → Utenti Autorizzati → Gruppi Autorizzati → Utenti Negati → Gruppi Negati
                              // Per showOnlyProjectGrants, mostra solo i ruoli di progetto
                              
                              return (
                                <div className="text-sm space-y-1">
                                  {/* Ruoli di progetto assegnati - cliccabile per popup */}
                                  {hasProjectRoles && projectRolesCount > 0 && (
                                    <div>
                                      <span
                                        onClick={() => setSelectedRolesDetails({
                                          permissionName: getPermissionName(role),
                                          roles: projectRoles.map((r: any) => r.name || r)
                                        })}
                                        style={{
                                          cursor: 'pointer',
                                          color: '#2563eb',
                                          textDecoration: 'underline',
                                          fontWeight: '500',
                                          fontSize: '0.75rem'
                                        }}
                                        onMouseEnter={(e) => {
                                          e.currentTarget.style.opacity = '0.7';
                                        }}
                                        onMouseLeave={(e) => {
                                          e.currentTarget.style.opacity = '1';
                                        }}
                                      >
                                        {projectRolesCount} {projectRolesCount === 1 ? 'ruolo' : 'ruoli'} di progetto
                                      </span>
                                    </div>
                                  )}
                                  
                                  {/* Grant di progetto - cliccabile per popup */}
                                  {hasGrant && (
                                    <div>
                                      <span
                                        onClick={async () => {
                                          if (!permissionId || !permissionType || !projectId) return;
                                          setLoadingGrantPopup(true);
                                          try {
                                            // Usa il nuovo endpoint ProjectPermissionAssignment
                                            const response = await api.get(
                                              `/project-permission-assignments/${permissionType}/${permissionId}/project/${projectId}`
                                            );
                                            const assignment = response.data;
                                            setSelectedGrantDetails({
                                              projectId: Number(projectId),
                                              projectName: 'Progetto',
                                              roleId: permissionId, // Manteniamo per compatibilità con il popup
                                              details: assignment.grant || {},
                                              isProjectGrant: true
                                            });
                                          } catch (error) {
                                            window.alert('Errore nel recupero dei dettagli della grant di progetto');
                                          } finally {
                                            setLoadingGrantPopup(false);
                                          }
                                        }}
                                        style={{
                                          cursor: 'pointer',
                                          color: '#2563eb',
                                          textDecoration: 'underline',
                                          fontWeight: '500',
                                          fontSize: '0.75rem'
                                        }}
                                        onMouseEnter={(e) => {
                                          e.currentTarget.style.opacity = '0.7';
                                        }}
                                        onMouseLeave={(e) => {
                                          e.currentTarget.style.opacity = '1';
                                        }}
                                      >
                                        Grant di progetto
                                      </span>
                                    </div>
                                  )}
                                </div>
                              );
                            }
                            
                            // Comportamento normale: mostra grant globali e ruoli globali,
                            // ma evidenzia anche la presenza di grant di progetto associate all'ITS
                            const globalRoles = role.assignedRoles || [];
                            const globalRolesCount = globalRoles.length;
                            const hasGlobalRoles = globalRolesCount > 0;
                            const projectRoles = role.projectAssignedRoles || [];
                            const projectRolesCount = projectRoles.length;
                            const hasProjectRoles = includeProjectAssignments && projectRolesCount > 0;
                            const hasProjectGrant = includeProjectAssignments && (role.hasProjectGrant === true || role.projectGrantId != null);
                            let projectGrantEntries: any[] = [];
                            if (includeProjectAssignments) {
                              if (Array.isArray(role.projectGrants) && role.projectGrants.length > 0) {
                                projectGrantEntries = role.projectGrants;
                              } else if (hasProjectGrant && projectId) {
                                projectGrantEntries = [{
                                  projectId: Number(projectId),
                                  projectName: role.projectGrantName || 'Grant di progetto',
                                }];
                              }
                            }
                            const hasGlobalGrant = role.grantId != null || role.assignmentType === 'GRANT';
                            const hasGrant = hasGlobalGrant || hasProjectGrant;
                            const hasAssignments = hasGlobalRoles || hasGrant || hasProjectRoles;
                            
                            // Recupera grantDetails dalla mappa per i grant globali
                            const grantDetails = grantDetailsMap.get(mapKey);
                            
                            if (!hasAssignments) {
                              return (
                                <span className={`px-2 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-500`}>
                                  N
                                </span>
                              );
                            }
                            
                            return (
                              <div className="text-sm space-y-1">
                                {/* Ruoli globali assegnati - cliccabile per popup */}
                                {hasGlobalRoles && globalRolesCount > 0 && (
                                  <div>
                                    <span
                                      onClick={() => setSelectedRolesDetails({
                                        permissionName: getPermissionName(role),
                                        roles: globalRoles.map((r: any) => r.name || r)
                                      })}
                                      style={{
                                        cursor: 'pointer',
                                        color: '#2563eb',
                                        textDecoration: 'underline',
                                        fontWeight: '500',
                                        fontSize: '0.75rem'
                                      }}
                                      onMouseEnter={(e) => {
                                        e.currentTarget.style.opacity = '0.7';
                                      }}
                                      onMouseLeave={(e) => {
                                        e.currentTarget.style.opacity = '1';
                                      }}
                                    >
                                      {globalRolesCount} {globalRolesCount === 1 ? 'ruolo' : 'ruoli'} globale{globalRolesCount !== 1 ? 'i' : ''}
                                    </span>
                                  </div>
                                )}
                                
                                {/* Grant globali - cliccabile per popup */}
                                {hasGlobalGrant && grantDetails && !grantDetails.isProjectGrant && (
                                  <div>
                                    <span
                                      onClick={permissionId && permissionType ? async () => {
                                        setLoadingGrantPopup(true);
                                        try {
                                          // Usa il nuovo endpoint PermissionAssignment
                                          const response = await api.get(
                                            `/permission-assignments/${permissionType}/${permissionId}`
                                          );
                                          const assignment = response.data;
                                          setSelectedGrantDetails({
                                            projectId: 0,
                                            projectName: 'Globale',
                                            roleId: permissionId, // Manteniamo per compatibilità con il popup
                                            details: assignment.grant || {},
                                            isProjectGrant: false
                                          });
                                        } catch (error) {
                                          window.alert('Errore nel recupero dei dettagli della grant globale');
                                        } finally {
                                          setLoadingGrantPopup(false);
                                        }
                                      } : undefined}
                                      style={{
                                        fontWeight: '500',
                                        color: permissionId && permissionType ? '#2563eb' : '#1f2937',
                                        textDecoration: permissionId && permissionType ? 'underline' : 'none',
                                        cursor: permissionId && permissionType ? 'pointer' : 'default',
                                        fontSize: '0.75rem'
                                      }}
                                      onMouseEnter={(e) => {
                                        if (permissionId && permissionType) {
                                          e.currentTarget.style.opacity = '0.7';
                                        }
                                      }}
                                      onMouseLeave={(e) => {
                                        if (permissionId && permissionType) {
                                          e.currentTarget.style.opacity = '1';
                                        }
                                      }}
                                    >
                                      Grant globale
                                    </span>
                                  </div>
                                )}
                                
                                {/* Fallback se grant esiste ma dettagli non ancora caricati */}
                                {hasGlobalGrant && !grantDetails && (
                                  <div className="text-xs text-gray-500 italic">Caricamento dettagli grant...</div>
                                )}

                                {/* Ruoli di progetto presenti ma non in modalità filtro dedicato */}
                                {hasProjectRoles && (
                                  <div>
                                    <span
                                      onClick={() => setSelectedRolesDetails({
                                        permissionName: getPermissionName(role),
                                        roles: projectRoles.map((r: any) => r.name || r)
                                      })}
                                      style={{
                                        cursor: 'pointer',
                                        color: '#2563eb',
                                        textDecoration: 'underline',
                                        fontWeight: '500',
                                        fontSize: '0.75rem'
                                      }}
                                      onMouseEnter={(e) => {
                                        e.currentTarget.style.opacity = '0.7';
                                      }}
                                      onMouseLeave={(e) => {
                                        e.currentTarget.style.opacity = '1';
                                      }}
                                    >
                                      {projectRolesCount} {projectRolesCount === 1 ? 'ruolo di progetto' : 'ruoli di progetto'}
                                    </span>
                                  </div>
                                )}

                                {/* Grant di progetto associate */}
                                {projectGrantEntries.length > 0 && projectGrantEntries.map((projectGrant: any, pgIdx: number) => (
                                  <div key={`project-grant-${pgIdx}`}>
                                    <span
                                      onClick={async () => {
                                        if (!permissionId || !permissionType || !projectGrant.projectId) return;
                                        setLoadingGrantPopup(true);
                                        try {
                                          const response = await api.get(
                                            `/project-permission-assignments/${permissionType}/${permissionId}/project/${projectGrant.projectId}`
                                          );
                                          const assignment = response.data;
                                          setSelectedGrantDetails({
                                            projectId: Number(projectGrant.projectId),
                                            projectName: projectGrant.projectName || 'Progetto',
                                            roleId: permissionId,
                                            details: assignment.grant || {},
                                            isProjectGrant: true,
                                          });
                                        } catch (error) {
                                          window.alert('Errore nel recupero dei dettagli della grant di progetto');
                                        } finally {
                                          setLoadingGrantPopup(false);
                                        }
                                      }}
                                      style={{
                                        cursor: 'pointer',
                                        color: '#2563eb',
                                        textDecoration: 'underline',
                                        fontWeight: '500',
                                        fontSize: '0.75rem'
                                      }}
                                      onMouseEnter={(e) => {
                                        e.currentTarget.style.opacity = '0.7';
                                      }}
                                      onMouseLeave={(e) => {
                                        e.currentTarget.style.opacity = '1';
                                      }}
                                    >
                                      Grant progetto {projectGrant.projectName || projectGrant.projectId}
                                    </span>
                                  </div>
                                ))}
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

      {/* Modal for roles details */}
      {selectedRolesDetails && (
        <div 
          onClick={() => setSelectedRolesDetails(null)}
          style={{ 
            position: 'fixed', 
            top: 0, 
            left: 0, 
            right: 0, 
            bottom: 0, 
            backgroundColor: 'rgba(0, 0, 0, 0.5)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            zIndex: 10001
          }}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: 'white',
              borderRadius: '8px',
              padding: '24px',
              maxWidth: '600px',
              width: '90%',
              maxHeight: '80vh',
              overflowY: 'auto'
            }}
          >
            <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '16px' }}>
              Dettagli Ruoli - {selectedRolesDetails.permissionName}
            </h2>
            
            <div>
              {selectedRolesDetails.roles && selectedRolesDetails.roles.length > 0 ? (
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '8px', color: '#374151' }}>
                    Ruoli Assegnati ({selectedRolesDetails.roles.length})
                  </h3>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {selectedRolesDetails.roles.map((role: string, idx: number) => (
                      <span key={idx} style={{
                        padding: '4px 8px',
                        backgroundColor: '#dbeafe',
                        borderRadius: '4px',
                        fontSize: '0.875rem',
                        fontWeight: '500'
                      }}>
                        {role}
                      </span>
                    ))}
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '20px', color: '#6b7280' }}>
                  Nessun ruolo assegnato
                </div>
              )}
            </div>
            
            <div style={{ marginTop: '24px', textAlign: 'right' }}>
              <button
                onClick={() => setSelectedRolesDetails(null)}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#6b7280',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: '600'
                }}
              >
                Chiudi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal for grant details */}
      {selectedGrantDetails && (
        <div 
          onClick={() => setSelectedGrantDetails(null)}
          style={{ 
            position: 'fixed', 
            top: 0, 
            left: 0, 
            right: 0, 
            bottom: 0, 
            backgroundColor: 'rgba(0, 0, 0, 0.5)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            zIndex: 10001
          }}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: 'white',
              borderRadius: '8px',
              padding: '24px',
              maxWidth: '600px',
              width: '90%',
              maxHeight: '80vh',
              overflowY: 'auto'
            }}
          >
            <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '16px' }}>
              Dettagli Grant - {selectedGrantDetails.projectName}
            </h2>
            
            {loadingGrantPopup ? (
              <div style={{ textAlign: 'center', padding: '20px' }}>Caricamento...</div>
            ) : selectedGrantDetails.details ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>
                {/* Utenti */}
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '8px', color: '#374151' }}>
                    Utenti ({selectedGrantDetails.details.users?.length || 0})
                  </h3>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', minHeight: '40px' }}>
                    {selectedGrantDetails.details.users && selectedGrantDetails.details.users.length > 0 ? (
                      selectedGrantDetails.details.users.map((user: any, idx: number) => (
                        <span key={idx} style={{
                          padding: '4px 8px',
                          backgroundColor: '#dbeafe',
                          borderRadius: '4px',
                          fontSize: '0.875rem'
                        }}>
                          {user.fullName || user.username || user.email || `User #${user.id}`}
                        </span>
                      ))
                    ) : (
                      <span style={{ color: '#9ca3af', fontSize: '0.875rem' }}>Nessuno</span>
                    )}
                  </div>
                </div>
                
                {/* Gruppi */}
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '8px', color: '#374151' }}>
                    Gruppi ({selectedGrantDetails.details.groups?.length || 0})
                  </h3>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', minHeight: '40px' }}>
                    {selectedGrantDetails.details.groups && selectedGrantDetails.details.groups.length > 0 ? (
                      selectedGrantDetails.details.groups.map((group: any, idx: number) => (
                        <span key={idx} style={{
                          padding: '4px 8px',
                          backgroundColor: '#d1fae5',
                          borderRadius: '4px',
                          fontSize: '0.875rem'
                        }}>
                          {group.name || `Group #${group.id}`}
                        </span>
                      ))
                    ) : (
                      <span style={{ color: '#9ca3af', fontSize: '0.875rem' }}>Nessuno</span>
                    )}
                  </div>
                </div>
                
                {/* Utenti negati */}
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '8px', color: '#dc2626' }}>
                    Utenti negati ({selectedGrantDetails.details.negatedUsers?.length || 0})
                  </h3>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', minHeight: '40px' }}>
                    {selectedGrantDetails.details.negatedUsers && selectedGrantDetails.details.negatedUsers.length > 0 ? (
                      selectedGrantDetails.details.negatedUsers.map((user: any, idx: number) => (
                        <span key={idx} style={{
                          padding: '4px 8px',
                          backgroundColor: '#fee2e2',
                          borderRadius: '4px',
                          fontSize: '0.875rem'
                        }}>
                          {user.fullName || user.username || user.email || `User #${user.id}`}
                        </span>
                      ))
                    ) : (
                      <span style={{ color: '#9ca3af', fontSize: '0.875rem' }}>Nessuno</span>
                    )}
                  </div>
                </div>
                
                {/* Gruppi negati */}
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '8px', color: '#dc2626' }}>
                    Gruppi negati ({selectedGrantDetails.details.negatedGroups?.length || 0})
                  </h3>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', minHeight: '40px' }}>
                    {selectedGrantDetails.details.negatedGroups && selectedGrantDetails.details.negatedGroups.length > 0 ? (
                      selectedGrantDetails.details.negatedGroups.map((group: any, idx: number) => (
                        <span key={idx} style={{
                          padding: '4px 8px',
                          backgroundColor: '#fee2e2',
                          borderRadius: '4px',
                          fontSize: '0.875rem'
                        }}>
                          {group.name || `Group #${group.id}`}
                        </span>
                      ))
                    ) : (
                      <span style={{ color: '#9ca3af', fontSize: '0.875rem' }}>Nessuno</span>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '20px', color: '#dc2626' }}>
                Errore nel caricamento dei dettagli
              </div>
            )}
            
            <div style={{ marginTop: '24px', textAlign: 'right' }}>
              <button
                onClick={() => setSelectedGrantDetails(null)}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#6b7280',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: '600'
                }}
              >
                Chiudi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

