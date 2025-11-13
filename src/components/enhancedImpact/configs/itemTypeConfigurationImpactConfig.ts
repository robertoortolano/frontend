import { escapeCSV, PermissionData } from '../../../utils/csvExportUtils';
import { mapImpactPermissions } from '../../../utils/impactPermissionMapping';
import { EnhancedImpactReportConfig } from '../../EnhancedImpactReportModal';
import { ItemTypeConfigurationRemovalImpactDto } from '../../../types/itemtypeconfiguration-impact.types';

export const itemTypeConfigurationImpactConfig: EnhancedImpactReportConfig<ItemTypeConfigurationRemovalImpactDto> =
  {
    title: '📊 Report Impatto Modifica ItemTypeSet',
    getSubtitle: (impact) => impact.itemTypeSetName,
    buildPermissionRows: (impact) => {
      const permissions = [
        ...(impact.fieldOwnerPermissions || []),
        ...(impact.statusOwnerPermissions || []),
        ...(impact.fieldStatusPermissions || []),
        ...(impact.executorPermissions || []),
        ...(impact.workerPermissions || []),
        ...(impact.creatorPermissions || [])
      ];

      const getPermissionName = (perm: any): string => {
        switch (perm.permissionType) {
          case 'FIELD_OWNERS':
            return `Field Owner - ${perm.fieldName || perm.fieldConfigurationName || 'N/A'}`;
          case 'STATUS_OWNERS':
            return `Status Owner - ${perm.statusName || perm.workflowStatusName || 'N/A'}`;
          case 'FIELD_EDITORS':
          case 'EDITORS':
            return `Editor - ${perm.fieldName || perm.fieldConfigurationName || 'N/A'} @ ${
              perm.statusName || perm.workflowStatusName || 'N/A'
            }`;
          case 'FIELD_VIEWERS':
          case 'VIEWERS':
            return `Viewer - ${perm.fieldName || perm.fieldConfigurationName || 'N/A'} @ ${
              perm.statusName || perm.workflowStatusName || 'N/A'
            }`;
          case 'EXECUTORS':
            return `Executor - ${perm.fromStatusName || 'N/A'} -> ${perm.toStatusName || 'N/A'}${
              perm.transitionName ? ` (${perm.transitionName})` : ''
            }`;
          case 'WORKERS':
            return `Worker - ${perm.itemTypeName || 'N/A'}`;
          case 'CREATORS':
            return `Creator - ${perm.itemTypeName || 'N/A'}`;
          default:
            return `${perm.permissionType || 'Permission'} - ${perm.itemTypeSetName || 'N/A'}`;
        }
      };

      const getMatchLabel = (perm: any): string | undefined => {
        if (!(perm.canBePreserved ?? false)) {
          return undefined;
        }
        const matchParts: string[] = [];
        if (perm.matchingFieldName) {
          matchParts.push(perm.matchingFieldName);
        }
        if (perm.matchingStatusName) {
          matchParts.push(perm.matchingStatusName);
        }
        if (perm.matchingTransitionName) {
          matchParts.push(perm.matchingTransitionName);
        }
        return matchParts.length ? `✓ ${matchParts.join(' @ ')}` : undefined;
      };

      return mapImpactPermissions({
        permissions,
        getLabel: getPermissionName,
        getMatchLabel,
        fallbackItemTypeSetName: impact.itemTypeSetName || null
      });
    },
    prepareExportPermissions: (impact) =>
      [
        ...(impact.fieldOwnerPermissions || []).filter((perm) => perm.hasAssignments),
        ...(impact.statusOwnerPermissions || []).filter((perm) => perm.hasAssignments),
        ...(impact.fieldStatusPermissions || []).filter((perm) => perm.hasAssignments),
        ...(impact.executorPermissions || []).filter((perm) => perm.hasAssignments),
        ...(impact.workerPermissions || []).filter((perm) => perm.hasAssignments),
        ...(impact.creatorPermissions || []).filter((perm) => perm.hasAssignments)
      ].map((perm) => ({
        permissionId: perm.permissionId,
        permissionType: perm.permissionType || 'N/A',
        itemTypeSetName: perm.itemTypeSetName || 'N/A',
        fieldName: perm.fieldName || perm.fieldConfigurationName || null,
        statusName: perm.statusName || perm.workflowStatusName || null,
        fromStatusName: perm.fromStatusName || null,
        toStatusName: perm.toStatusName || null,
        transitionName: perm.transitionName || null,
        assignedRoles: perm.assignedRoles || [],
        grantId: perm.grantId,
        grantName: perm.grantName || null,
        // Allinea alla logica di visualizzazione: se assignedGrants non c'è ma c'è grantName, crea array
        assignedGrants: perm.assignedGrants ?? (perm.grantName ? [perm.grantName] : null),
        roleId: perm.roleId,
        projectGrants: perm.projectGrants,
        projectAssignedRoles: perm.projectAssignedRoles,
        canBePreserved: Boolean((perm as any).canBePreserved)
      })),
    getFieldName: (perm: PermissionData) => escapeCSV(perm.fieldName || ''),
    getStatusName: (perm: PermissionData) => escapeCSV(perm.statusName || ''),
    getTransitionName: () => '',
    exportFileName: (impact) =>
      `itemtypeconfiguration_impact_report_${impact.itemTypeSetId}_${new Date()
        .toISOString()
        .slice(0, 19)
        .replace(/:/g, '-')}.csv`
  };

