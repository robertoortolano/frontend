import api from '../api/api';

/**
 * Utility per esportare report di impatto in CSV
 * Unifica la logica comune a tutti i report enhanced
 */

export interface PermissionData {
  permissionId: number | null;
  permissionType: string;
  itemTypeSetName: string;
  fieldName?: string | null;
  statusName?: string | null;
  transitionName?: string | null;
  fromStatusName?: string | null;
  toStatusName?: string | null;
  assignedRoles?: string[];
  grantId?: number | null;
  roleId?: number | null;
  projectGrants?: ProjectGrantInfo[];
  canBePreserved?: boolean;
}

export interface ProjectGrantInfo {
  projectId: number;
  projectName: string;
  roleId: number;
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
const createBaseRow = (
  permissionName: string,
  itemTypeSetName: string,
  action: string,
  fieldName: string,
  statusName: string,
  transitionName: string,
  roleName: string,
  grant: string, // "Global" per grant globale, nome progetto per grant di progetto, "" per nessuna grant
  userName: string,
  negatedUserName: string,
  groupName: string,
  negatedGroupName: string
): string => {
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

  // Righe base per ruoli assegnati (senza grant di progetto)
  // Questi ruoli vengono esportati se non ci sono grant di progetto
  // Se ci sono grant di progetto, i ruoli vengono esportati insieme alle grant di progetto
  if (perm.assignedRoles && perm.assignedRoles.length > 0) {
    // Se non ci sono grant di progetto, esporta i ruoli qui
    if (!perm.projectGrants || perm.projectGrants.length === 0) {
      perm.assignedRoles.forEach((roleName: string) => {
        rows.push(createBaseRow(
          permissionName,
          itemTypeSetName,
          action,
          fieldName,
          statusName,
          transitionName,
          roleName,
          'Global', // Ruolo globale = Grant = Global
          '',
          '',
          '',
          '',
          ''
        ));
      });
    }
    // Se ci sono grant di progetto, i ruoli verranno esportati insieme alle grant di progetto
  }

  // Grant globale
  if (perm.grantId && perm.permissionId && perm.permissionType) {
    try {
      // Usa il nuovo endpoint PermissionAssignment
      const grantResponse = await api.get(`/permission-assignments/${perm.permissionType}/${perm.permissionId}`);
      const assignment = grantResponse.data;
      const grantDetails = assignment.grant || {};

      // Riga base senza utenti/gruppi se non ci sono
      if ((!grantDetails.users || grantDetails.users.length === 0) &&
          (!grantDetails.groups || grantDetails.groups.length === 0) &&
          (!grantDetails.negatedUsers || grantDetails.negatedUsers.length === 0) &&
          (!grantDetails.negatedGroups || grantDetails.negatedGroups.length === 0)) {
        rows.push(createBaseRow(
          permissionName,
          itemTypeSetName,
          action,
          fieldName,
          statusName,
          transitionName,
          '',
          'Global',
          '',
          '',
          '',
          '',
          ''
        ));
      } else {
        // Utenti
        if (grantDetails.users && grantDetails.users.length > 0) {
          grantDetails.users.forEach((user: any) => {
            rows.push(createBaseRow(
              permissionName,
              itemTypeSetName,
              action,
              fieldName,
              statusName,
              transitionName,
              '',
              'Global',
              user.username || user.email || `User #${user.id}`,
              '',
              '',
              ''
            ));
          });
        }

        // Gruppi
        if (grantDetails.groups && grantDetails.groups.length > 0) {
          grantDetails.groups.forEach((group: any) => {
            rows.push(createBaseRow(
              permissionName,
              itemTypeSetName,
              action,
              fieldName,
              statusName,
              transitionName,
              '',
              'Global',
              '',
              '',
              group.name || `Group #${group.id}`,
              ''
            ));
          });
        }

        // Utenti negati
        if (grantDetails.negatedUsers && grantDetails.negatedUsers.length > 0) {
          grantDetails.negatedUsers.forEach((user: any) => {
            rows.push(createBaseRow(
              permissionName,
              itemTypeSetName,
              action,
              fieldName,
              statusName,
              transitionName,
              '',
              'Global',
              '',
              user.username || user.email || `User #${user.id}`,
              '',
              ''
            ));
          });
        }

        // Gruppi negati
        if (grantDetails.negatedGroups && grantDetails.negatedGroups.length > 0) {
          grantDetails.negatedGroups.forEach((group: any) => {
            rows.push(createBaseRow(
              permissionName,
              itemTypeSetName,
              action,
              fieldName,
              statusName,
              transitionName,
              '',
              'Global',
              '',
              '',
              '',
              group.name || `Group #${group.id}`
            ));
          });
        }
      }
    } catch (error) {
      // Aggiungi comunque una riga con grant globale ma senza dettagli
      rows.push(createBaseRow(
        permissionName,
        itemTypeSetName,
        action,
        fieldName,
        statusName,
        transitionName,
        '',
        'Global',
        '',
        '',
        '',
        '',
        ''
      ));
    }
  }

  // Grant di progetto - gestito come le grant globali: prima i ruoli (se ci sono), poi la grant
  if (perm.projectGrants && perm.projectGrants.length > 0) {
    // Prima esporta i ruoli (con nome progetto nella colonna Grant) se ci sono
    // Nota: se ci sono più grant di progetto, esportiamo i ruoli per ogni progetto
    if (perm.assignedRoles && perm.assignedRoles.length > 0) {
      for (const projectGrant of perm.projectGrants) {
        const projectName = escapeCSV(projectGrant.projectName);
        perm.assignedRoles.forEach((roleName: string) => {
          rows.push(createBaseRow(
            permissionName,
            itemTypeSetName,
            action,
            fieldName,
            statusName,
            transitionName,
            roleName,
            projectName, // Nome progetto nella colonna Grant
            '',
            '',
            '',
            ''
          ));
        });
      }
    }

    // Poi esporta le grant di progetto (senza ruoli nella colonna ruolo)
    for (const projectGrant of perm.projectGrants) {
      try {
        // Usa il nuovo endpoint ProjectPermissionAssignment
        // Nota: projectGrant potrebbe non avere permissionId/permissionType, quindi usiamo quelli di perm
        if (!perm.permissionId || !perm.permissionType) {
          console.warn('Permission senza permissionId o permissionType per grant di progetto:', perm);
          continue;
        }
        const projectGrantResponse = await api.get(
          `/project-permission-assignments/${perm.permissionType}/${perm.permissionId}/project/${projectGrant.projectId}`
        );
        const assignment = projectGrantResponse.data;
        const projectGrantDetails = assignment.assignment?.grant || {};
        const projectName = escapeCSV(projectGrant.projectName);

        // Riga base senza utenti/gruppi se non ci sono
        if ((!projectGrantDetails.users || projectGrantDetails.users.length === 0) &&
            (!projectGrantDetails.groups || projectGrantDetails.groups.length === 0) &&
            (!projectGrantDetails.negatedUsers || projectGrantDetails.negatedUsers.length === 0) &&
            (!projectGrantDetails.negatedGroups || projectGrantDetails.negatedGroups.length === 0)) {
          rows.push(createBaseRow(
            permissionName,
            itemTypeSetName,
            action,
            fieldName,
            statusName,
            transitionName,
            '',
            projectName,
            '',
            '',
            '',
            ''
          ));
        } else {
          // Utenti
          if (projectGrantDetails.users && projectGrantDetails.users.length > 0) {
            projectGrantDetails.users.forEach((user: any) => {
              rows.push(createBaseRow(
                permissionName,
                itemTypeSetName,
                action,
                fieldName,
                statusName,
                transitionName,
                '',
                projectName,
                user.username || user.email || `User #${user.id}`,
                '',
                '',
                ''
              ));
            });
          }

          // Gruppi
          if (projectGrantDetails.groups && projectGrantDetails.groups.length > 0) {
            projectGrantDetails.groups.forEach((group: any) => {
              rows.push(createBaseRow(
                permissionName,
                itemTypeSetName,
                action,
                fieldName,
                statusName,
                transitionName,
                '',
                projectName,
                '',
                '',
                group.name || `Group #${group.id}`,
                ''
              ));
            });
          }

          // Utenti negati
          if (projectGrantDetails.negatedUsers && projectGrantDetails.negatedUsers.length > 0) {
            projectGrantDetails.negatedUsers.forEach((user: any) => {
              rows.push(createBaseRow(
                permissionName,
                itemTypeSetName,
                action,
                fieldName,
                statusName,
                transitionName,
                '',
                projectName,
                '',
                user.username || user.email || `User #${user.id}`,
                '',
                ''
              ));
            });
          }

          // Gruppi negati
          if (projectGrantDetails.negatedGroups && projectGrantDetails.negatedGroups.length > 0) {
            projectGrantDetails.negatedGroups.forEach((group: any) => {
              rows.push(createBaseRow(
                permissionName,
                itemTypeSetName,
                action,
                fieldName,
                statusName,
                transitionName,
                '',
                projectName,
                '',
                '',
                '',
                group.name || `Group #${group.id}`
              ));
            });
          }
        }
      } catch (error) {
        // Aggiungi comunque una riga con grant di progetto ma senza dettagli
        rows.push(createBaseRow(
          permissionName,
          itemTypeSetName,
          action,
          fieldName,
          statusName,
          transitionName,
          '',
          escapeCSV(projectGrant.projectName),
          '',
          '',
          '',
          ''
        ));
      }
    }
  }

  // Se non ci sono né ruoli né grant, aggiungi almeno una riga base
  if ((!perm.assignedRoles || perm.assignedRoles.length === 0) &&
      !perm.grantId &&
      (!perm.projectGrants || perm.projectGrants.length === 0)) {
    rows.push(createBaseRow(
      permissionName,
      itemTypeSetName,
      action,
      fieldName,
      statusName,
      transitionName,
      '',
      '',
      '',
      '',
      '',
      ''
    ));
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

