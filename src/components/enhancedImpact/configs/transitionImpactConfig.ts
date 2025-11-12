import { PermissionData } from '../../../utils/csvExportUtils';
import { mapImpactPermissions } from '../../../utils/impactPermissionMapping';
import { TransitionRemovalImpactDto } from '../../../types/transition-impact.types';
import { EnhancedImpactReportConfig } from '../../EnhancedImpactReportModal';

export const transitionImpactConfig: EnhancedImpactReportConfig<TransitionRemovalImpactDto> = {
  title: '📊 Report Impatto Rimozione Transition',
  getSubtitle: (impact) => impact.workflowName,
  buildPermissionRows: (impact) => {
    // Per la rimozione di transizioni, mostriamo solo le ExecutorPermission
    // Le StatusOwnerPermission e FieldStatusPermission non sono impattate dalla rimozione di transizioni
    const executorPermissions = mapImpactPermissions({
      permissions: impact.executorPermissions || [],
      getLabel: (perm: any) => {
        const fromStatus = perm.fromStatusName || 'N/A';
        const toStatus = perm.toStatusName || 'N/A';
        const transitionName = perm.transitionName;
        const transitionPart = transitionName ? ` (${transitionName})` : '';
        return `Executor - ${fromStatus} -> ${toStatus}${transitionPart}`;
      },
      getMatchLabel: (perm: any) => {
        if (!(perm.canBePreserved ?? false)) {
          return undefined;
        }
        return perm.transitionNameMatch ? `✓ ${perm.transitionNameMatch}` : undefined;
      },
      fallbackItemTypeSetName: null
    });

    // Non includiamo statusOwnerPermissions e fieldStatusPermissions per le transizioni
    // perché la rimozione di una transizione impatta solo le ExecutorPermission
    return executorPermissions;
  },
  prepareExportPermissions: (impact) => {
    // Per la rimozione di transizioni, esportiamo solo le ExecutorPermission
    // Le StatusOwnerPermission e FieldStatusPermission non sono impattate dalla rimozione di transizioni
    const executorPermissions = (impact.executorPermissions || [])
      .filter((perm) => perm.hasAssignments)
      .map((perm) => ({
        permissionId: perm.permissionId ?? null,
        permissionType: perm.permissionType || 'EXECUTORS',
        itemTypeSetName: perm.itemTypeSetName || 'N/A',
        fieldName: null,
        statusName: null,
        fromStatusName: perm.fromStatusName || null,
        toStatusName: perm.toStatusName || null,
        transitionName: perm.transitionName || null,
        assignedRoles: perm.assignedRoles || [],
        projectAssignedRoles: perm.projectAssignedRoles || [],
        grantId: perm.grantId ?? null,
        roleId: perm.roleId ?? perm.permissionId ?? null,
        projectGrants: perm.projectGrants || [],
        canBePreserved: Boolean((perm as any).canBePreserved)
      }));

    // Non includiamo statusOwnerPermissions e fieldStatusPermissions per le transizioni
    // perché la rimozione di una transizione impatta solo le ExecutorPermission
    return executorPermissions;
  },
  getFieldName: (perm: PermissionData) => perm.fieldName || '',
  getStatusName: (perm: PermissionData) => perm.statusName || '',
  getTransitionName: (perm: PermissionData) => perm.transitionName || '',
  exportFileName: (impact) =>
    `transition_impact_report_${impact.workflowId}_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.csv`
};

