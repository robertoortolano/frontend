import api from '../api/api';

/**
 * Utility per esportare report di impatto in CSV
 * Unifica la logica comune a tutti i report enhanced
 */

/**
 * Funzione helper per mappare il tipo di permission dal formato frontend al formato backend
 */
const mapPermissionTypeToBackend = (permissionType: string): string => {
  const mapping: { [key: string]: string } = {
    'FIELD_OWNERS': 'FieldOwnerPermission',
    'FIELD_EDITORS': 'FieldStatusPermission',
    'FIELD_VIEWERS': 'FieldStatusPermission',
    'EDITORS': 'FieldStatusPermission', // retrocompatibilità
    'VIEWERS': 'FieldStatusPermission', // retrocompatibilità
    'STATUS_OWNERS': 'StatusOwnerPermission',
    'STATUS_OWNER': 'StatusOwnerPermission',
    'EXECUTORS': 'ExecutorPermission',
    'EXECUTOR': 'ExecutorPermission',
    'WORKERS': 'WorkerPermission',
    'CREATORS': 'CreatorPermission'
  };
  return mapping[permissionType] || permissionType;
};

export interface PermissionData {
  permissionId: number | null;
  permissionType: string;
  itemTypeSetName: string;
  fieldName?: string | null;
  workflowStatusName?: string | null;
  statusName?: string | null;
  transitionName?: string | null;
  fromStatusName?: string | null;
  toStatusName?: string | null;
  assignedRoles?: string[]; // Ruoli globali
  projectAssignedRoles?: ProjectRoleInfo[]; // Ruoli di progetto per ogni progetto
  grantId?: number | null;
  grantName?: string | null; // Nome del grant (se presente ma grantId non disponibile)
  assignedGrants?: string[] | null; // Nomi dei grant assegnati (se presenti ma grantId non disponibile)
  roleId?: number | null;
  projectGrants?: ProjectGrantInfo[];
  canBePreserved?: boolean;
}

export interface ProjectRoleInfo {
  projectId: number;
  projectName: string;
  roles: string[];
}

export interface ProjectGrantInfo {
  projectId: number;
  projectName: string;
  assignedRoles?: string[]; // Ruoli assegnati a questa permission per questo progetto
  grantId?: number | null; // Grant assegnato a questa permission per questo progetto (se presente)
  grantName?: string | null; // Nome del grant (se presente)
}

export interface ExportCsvParams {
  permissions: PermissionData[];
  preservedPermissionIds: Set<number>;
  getFieldName: (perm: PermissionData) => string;
  getStatusName: (perm: PermissionData) => string;
  getTransitionName: (perm: PermissionData) => string;
  fileName: string;
}

/**
 * Funzione helper per formattare i valori CSV
 */
export const escapeCSV = (value: any): string => {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

/**
 * Header standardizzato per tutti i report CSV
 */
export const CSV_HEADER = [
  'Permission',
  'Item Type Set',
  'Azione',
  'Field',
  'Status',
  'Transition',
  'Ruolo',
  'Grant',
  'Utente',
  'Utente negato',
  'Gruppo',
  'Gruppo negato'
];

/**
 * Formatta una transition secondo il formato richiesto:
 * - Con nome: <fromStatus> -> <toStatus> (<transitionName>)
 * - Senza nome: <fromStatus> -> <toStatus>
 */
export const formatTransition = (
  fromStatusName: string | null | undefined,
  toStatusName: string | null | undefined,
  transitionName: string | null | undefined
): string => {
  if (!fromStatusName || !toStatusName) return '';
  
  const from = escapeCSV(fromStatusName);
  const to = escapeCSV(toStatusName);
  const transition = transitionName ? escapeCSV(transitionName) : '';
  
  return transition 
    ? `${from} -> ${to} (${transition})`
    : `${from} -> ${to}`;
};

/**
 * Genera una riga CSV base per una permission
 */
interface CreateBaseRowParams {
  permissionName: string;
  itemTypeSetName: string;
  action: string;
  fieldName: string;
  statusName: string;
  transitionName: string;
  roleName: string;
  grant: string;
  userName: string;
  negatedUserName: string;
  groupName: string;
  negatedGroupName: string;
}

const createBaseRow = ({
  permissionName,
  itemTypeSetName,
  action,
  fieldName,
  statusName,
  transitionName,
  roleName,
  grant,
  userName,
  negatedUserName,
  groupName,
  negatedGroupName
}: CreateBaseRowParams): string => {
  return [
    escapeCSV(permissionName),
    itemTypeSetName,
    action,
    fieldName,
    statusName,
    transitionName,
    escapeCSV(roleName),
    escapeCSV(grant),
    escapeCSV(userName),
    escapeCSV(negatedUserName),
    escapeCSV(groupName),
    escapeCSV(negatedGroupName)
  ].join(',');
};

/**
 * Processa una permission e aggiunge le righe CSV corrispondenti
 */
const processPermissionRows = async (
  perm: PermissionData,
  preservedPermissionIds: Set<number>,
  getFieldName: (perm: PermissionData) => string,
  getStatusName: (perm: PermissionData) => string,
  getTransitionName: (perm: PermissionData) => string,
  rows: string[]
): Promise<void> => {
  const isSelected = perm.permissionId != null && preservedPermissionIds.has(perm.permissionId);
  const action = isSelected && (perm.canBePreserved ?? false) ? 'Mantenuta' : 'Rimossa';
  
  const permissionName = perm.permissionType || 'N/A';
  const itemTypeSetName = escapeCSV(perm.itemTypeSetName || 'N/A');
  const fieldName = getFieldName(perm);
  const statusName = getStatusName(perm);
  
  // Gestisce il formato transition: se getTransitionName ritorna già una stringa formattata, usa quella
  // altrimenti formatta usando fromStatusName e toStatusName se disponibili
  let transitionName = getTransitionName(perm);
  if (!transitionName && perm.fromStatusName && perm.toStatusName) {
    transitionName = formatTransition(perm.fromStatusName, perm.toStatusName, perm.transitionName);
  }

  const pushRow = (overrides: Partial<CreateBaseRowParams> = {}) => {
    rows.push(
      createBaseRow({
        permissionName,
        itemTypeSetName,
        action,
        fieldName,
        statusName,
        transitionName,
        roleName: '',
        grant: '',
        userName: '',
        negatedUserName: '',
        groupName: '',
        negatedGroupName: '',
        ...overrides
      })
    );
  };

  // Ruoli globali - sempre esportati con Grant = "Global"
  if (perm.assignedRoles && perm.assignedRoles.length > 0) {
    perm.assignedRoles.forEach((roleName: string) => {
      pushRow({
        roleName,
        grant: 'Global'
      });
    });
  }

  // Grant globali senza utenti/gruppi ma comunque presenti nel permesso
  // Grant globale - controlla grantId, grantName o assignedGrants
  const hasGlobalGrant = perm.grantId || perm.grantName || (perm.assignedGrants && perm.assignedGrants.length > 0);
  
  if (hasGlobalGrant && perm.permissionId && perm.permissionType) {
    // Prova sempre a fare la chiamata API per ottenere i dettagli completi del grant
    // anche se non abbiamo grantId, perché l'endpoint funziona con permissionId
    try {
      // Mappa il tipo di permission al formato backend
      const backendPermissionType = mapPermissionTypeToBackend(perm.permissionType);
      // Usa il nuovo endpoint PermissionAssignment
      const grantResponse = await api.get(`/permission-assignments/${backendPermissionType}/${perm.permissionId}`);
      const assignment = grantResponse.data;
      const grantDetails = assignment.grant || {};

      // Se la chiamata API non restituisce grant o è vuoto, usa grantName o assignedGrants
      if (!grantDetails || Object.keys(grantDetails).length === 0 || 
          (!grantDetails.id && !grantDetails.name && 
           (!grantDetails.users || grantDetails.users.length === 0) &&
           (!grantDetails.groups || grantDetails.groups.length === 0))) {
        // Se la chiamata API non restituisce grant ma abbiamo grantName o assignedGrants, esportali comunque
        if (perm.assignedGrants && perm.assignedGrants.length > 0) {
          perm.assignedGrants.forEach((grantName: string) => {
            pushRow({ grant: `Global: ${escapeCSV(grantName)}` });
          });
        } else if (perm.grantName) {
          pushRow({ grant: `Global: ${escapeCSV(perm.grantName)}` });
        } else {
          pushRow({ grant: 'Global' });
        }
      } else {
        // Se abbiamo un grant con dettagli, esportali
        // Riga base senza utenti/gruppi se non ci sono
        if ((!grantDetails.users || grantDetails.users.length === 0) &&
            (!grantDetails.groups || grantDetails.groups.length === 0) &&
            (!grantDetails.negatedUsers || grantDetails.negatedUsers.length === 0) &&
            (!grantDetails.negatedGroups || grantDetails.negatedGroups.length === 0)) {
          // Se abbiamo grantName o assignedGrants, includili nel nome del grant
          if (perm.assignedGrants && perm.assignedGrants.length > 0) {
            perm.assignedGrants.forEach((grantName: string) => {
              pushRow({ grant: `Global: ${escapeCSV(grantName)}` });
            });
          } else if (perm.grantName) {
            pushRow({ grant: `Global: ${escapeCSV(perm.grantName)}` });
          } else {
            pushRow({ grant: 'Global' });
          }
        } else {
          // Utenti
          if (grantDetails.users && grantDetails.users.length > 0) {
            grantDetails.users.forEach((user: any) => {
              const userName = user.username || user.fullName || (user.id ? `User #${user.id}` : '');
              const grantLabel = perm.grantName ? `Global: ${escapeCSV(perm.grantName)}` : 'Global';
              pushRow({
                grant: grantLabel,
                userName
              });
            });
          }

          // Gruppi
          if (grantDetails.groups && grantDetails.groups.length > 0) {
            grantDetails.groups.forEach((group: any) => {
              const grantLabel = perm.grantName ? `Global: ${escapeCSV(perm.grantName)}` : 'Global';
              pushRow({
                grant: grantLabel,
                groupName: group.name || `Group #${group.id}`
              });
            });
          }

          // Utenti negati
          if (grantDetails.negatedUsers && grantDetails.negatedUsers.length > 0) {
            grantDetails.negatedUsers.forEach((user: any) => {
              const userName = user.username || user.fullName || (user.id ? `User #${user.id}` : '');
              const grantLabel = perm.grantName ? `Global: ${escapeCSV(perm.grantName)}` : 'Global';
              pushRow({
                grant: grantLabel,
                negatedUserName: userName
              });
            });
          }

          // Gruppi negati
          if (grantDetails.negatedGroups && grantDetails.negatedGroups.length > 0) {
            grantDetails.negatedGroups.forEach((group: any) => {
              const grantLabel = perm.grantName ? `Global: ${escapeCSV(perm.grantName)}` : 'Global';
              pushRow({
                grant: grantLabel,
                negatedGroupName: group.name || `Group #${group.id}`
              });
            });
          }
        }
      }
    } catch (error) {
      // Se la chiamata API fallisce, esporta comunque grantName o assignedGrants se disponibili
      console.warn(`Error fetching grant details for permission ${perm.permissionId}:`, error);
      if (perm.assignedGrants && perm.assignedGrants.length > 0) {
        perm.assignedGrants.forEach((grantName: string) => {
          pushRow({ grant: `Global: ${escapeCSV(grantName)}` });
        });
      } else if (perm.grantName) {
        pushRow({ grant: `Global: ${escapeCSV(perm.grantName)}` });
      } else {
        // Fallback: esporta comunque "Global" se abbiamo indicato che c'è un grant
        pushRow({ grant: 'Global' });
      }
    }
  } else if (hasGlobalGrant) {
    // Se abbiamo un grant ma non abbiamo permissionId o permissionType, esporta comunque
    // Questo può succedere se i dati non sono completi
    if (perm.assignedGrants && perm.assignedGrants.length > 0) {
      perm.assignedGrants.forEach((grantName: string) => {
        pushRow({ grant: `Global: ${escapeCSV(grantName)}` });
      });
    } else if (perm.grantName) {
      pushRow({ grant: `Global: ${escapeCSV(perm.grantName)}` });
    } else {
      pushRow({ grant: 'Global' });
    }
  }

  // Ruoli di progetto - esportati con Grant = nome progetto
  if (perm.projectAssignedRoles && perm.projectAssignedRoles.length > 0) {
    perm.projectAssignedRoles.forEach((projectRole: ProjectRoleInfo) => {
      const projectName = escapeCSV(projectRole.projectName);
      if (projectRole.roles && projectRole.roles.length > 0) {
        projectRole.roles.forEach((roleName: string) => {
          pushRow({
            roleName,
            grant: projectName
          });
        });
      }
    });
  }

  // Ruoli di progetto da projectGrants.assignedRoles
  if (perm.projectGrants && perm.projectGrants.length > 0) {
    for (const projectGrant of perm.projectGrants) {
      const projectName = escapeCSV(projectGrant.projectName);
      
      // Esporta i ruoli di progetto se presenti
      if (projectGrant.assignedRoles && projectGrant.assignedRoles.length > 0) {
        projectGrant.assignedRoles.forEach((roleName: string) => {
          pushRow({
            roleName,
            grant: projectName
          });
        });
      }
      
      // Esporta il grant di progetto se presente
      // Prova sempre a fare la chiamata API se abbiamo permissionId e permissionType
      // anche se grantId è null, perché l'endpoint funziona con permissionId
      if (perm.permissionId && perm.permissionType) {
        try {
          // Mappa il tipo di permission al formato backend
          const backendPermissionType = mapPermissionTypeToBackend(perm.permissionType);
          const projectGrantResponse = await api.get(
            `/project-permission-assignments/${backendPermissionType}/${perm.permissionId}/project/${projectGrant.projectId}`
          );
          const assignment = projectGrantResponse.data;
          const projectGrantDetails = assignment.grant || {};

          // Se la chiamata API non restituisce grant o è vuoto, esporta comunque il grant di progetto
          if (!projectGrantDetails || Object.keys(projectGrantDetails).length === 0 || 
              (!projectGrantDetails.id && !projectGrantDetails.name && 
               (!projectGrantDetails.users || projectGrantDetails.users.length === 0) &&
               (!projectGrantDetails.groups || projectGrantDetails.groups.length === 0))) {
            // Se abbiamo il grantName, esportalo, altrimenti esporta solo il nome del progetto
            if (projectGrant.grantName) {
              pushRow({ grant: `${projectName}: ${escapeCSV(projectGrant.grantName)}` });
            } else {
              pushRow({ grant: projectName });
            }
          } else {
            // Riga base senza utenti/gruppi se non ci sono
            if ((!projectGrantDetails.users || projectGrantDetails.users.length === 0) &&
                (!projectGrantDetails.groups || projectGrantDetails.groups.length === 0) &&
                (!projectGrantDetails.negatedUsers || projectGrantDetails.negatedUsers.length === 0) &&
                (!projectGrantDetails.negatedGroups || projectGrantDetails.negatedGroups.length === 0)) {
              // Se abbiamo il grantName, esportalo
              if (projectGrant.grantName) {
                pushRow({ grant: `${projectName}: ${escapeCSV(projectGrant.grantName)}` });
              } else {
                pushRow({ grant: projectName });
              }
            } else {
              // Utenti
              if (projectGrantDetails.users && projectGrantDetails.users.length > 0) {
                projectGrantDetails.users.forEach((user: any) => {
                  const userName = user.username || user.fullName || (user.id ? `User #${user.id}` : '');
                  pushRow({
                    grant: projectGrant.grantName ? `${projectName}: ${escapeCSV(projectGrant.grantName)}` : projectName,
                    userName
                  });
                });
              }

              // Gruppi
              if (projectGrantDetails.groups && projectGrantDetails.groups.length > 0) {
                projectGrantDetails.groups.forEach((group: any) => {
                  pushRow({
                    grant: projectGrant.grantName ? `${projectName}: ${escapeCSV(projectGrant.grantName)}` : projectName,
                    groupName: group.name || `Group #${group.id}`
                  });
                });
              }

              // Utenti negati
              if (projectGrantDetails.negatedUsers && projectGrantDetails.negatedUsers.length > 0) {
                projectGrantDetails.negatedUsers.forEach((user: any) => {
                  const userName = user.username || user.fullName || (user.id ? `User #${user.id}` : '');
                  pushRow({
                    grant: projectGrant.grantName ? `${projectName}: ${escapeCSV(projectGrant.grantName)}` : projectName,
                    negatedUserName: userName
                  });
                });
              }

              // Gruppi negati
              if (projectGrantDetails.negatedGroups && projectGrantDetails.negatedGroups.length > 0) {
                projectGrantDetails.negatedGroups.forEach((group: any) => {
                  pushRow({
                    grant: projectGrant.grantName ? `${projectName}: ${escapeCSV(projectGrant.grantName)}` : projectName,
                    negatedGroupName: group.name || `Group #${group.id}`
                  });
                });
              }
            }
          }
        } catch (error) {
          // Se la chiamata API fallisce, esporta comunque il grant di progetto
          console.warn(`Error fetching project grant details for permission ${perm.permissionId}, project ${projectGrant.projectId}:`, error);
          if (projectGrant.grantName) {
            pushRow({ grant: `${projectName}: ${escapeCSV(projectGrant.grantName)}` });
          } else {
            pushRow({ grant: projectName });
          }
        }
      } else {
        // Se non abbiamo permissionId o permissionType ma abbiamo projectGrants, esporta comunque
        // Questo può succedere se i dati non sono completi
        if (projectGrant.grantName) {
          pushRow({ grant: `${projectName}: ${escapeCSV(projectGrant.grantName)}` });
        } else {
          pushRow({ grant: projectName });
        }
      }
    }
  }

  // Se non ci sono né ruoli né grant, aggiungi almeno una riga base
  const hasAnyGrant = perm.grantId || perm.grantName || (perm.assignedGrants && perm.assignedGrants.length > 0);
  if ((!perm.assignedRoles || perm.assignedRoles.length === 0) &&
      !hasAnyGrant &&
      (!perm.projectGrants || perm.projectGrants.length === 0) &&
      (!perm.projectAssignedRoles || perm.projectAssignedRoles.length === 0)) {
    pushRow();
  }
};

/**
 * Funzione principale per esportare report CSV unificato
 */
export const exportImpactReportToCSV = async (params: ExportCsvParams): Promise<void> => {
  const { permissions, preservedPermissionIds, getFieldName, getStatusName, getTransitionName, fileName } = params;

  const rows: string[] = [CSV_HEADER.map(escapeCSV).join(',')];

  // Processa tutte le permissions
  for (const perm of permissions) {
    await processPermissionRows(
      perm,
      preservedPermissionIds,
      getFieldName,
      getStatusName,
      getTransitionName,
      rows
    );
  }

  // Converti in CSV e scarica
  const csvContent = rows.join('\n');
  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' }); // BOM per Excel
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

