import { PermissionData } from '../../../utils/csvExportUtils';
import { mapImpactPermissions } from '../../../utils/impactPermissionMapping';
import { TransitionRemovalImpactDto } from '../../../types/transition-impact.types';
import { EnhancedImpactReportConfig } from '../../EnhancedImpactReportModal';

export const transitionImpactConfig: EnhancedImpactReportConfig<TransitionRemovalImpactDto> = {
  title: '📊 Report Impatto Rimozione Transition',
  getSubtitle: (impact) => impact.workflowName,
  buildPermissionRows: (impact) => {
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

    const statusOwnerPermissions = mapImpactPermissions({
      permissions: impact.statusOwnerPermissions || [],
      getLabel: (perm: any) => {
        const statusName = perm.statusName || perm.workflowStatusName || 'Status';
        return `Status Owner - ${statusName}`;
      },
      fallbackItemTypeSetName: null
    });

    const fieldStatusPermissions = mapImpactPermissions({
      permissions: impact.fieldStatusPermissions || [],
      getLabel: (perm: any) => {
        const field = perm.fieldName || 'Field';
        const status = perm.workflowStatusName || perm.statusName || 'Status';
        const prefix =
          perm.permissionType === 'FIELD_EDITORS'
            ? 'Field Editor'
            : perm.permissionType === 'FIELD_VIEWERS'
            ? 'Field Viewer'
            : perm.permissionType || 'Field Permission';
        return `${prefix} - ${field} @ ${status}`;
      },
      fallbackItemTypeSetName: null
    });

    return [...executorPermissions, ...statusOwnerPermissions, ...fieldStatusPermissions];
  },
  prepareExportPermissions: (impact) => {
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

    const statusOwnerPermissions = (impact.statusOwnerPermissions || [])
      .filter((perm) => perm.hasAssignments)
      .map((perm) => ({
        permissionId: perm.permissionId ?? null,
        permissionType: perm.permissionType || 'STATUS_OWNERS',
        itemTypeSetName: perm.itemTypeSetName || 'N/A',
        fieldName: null,
        statusName: perm.statusName || perm.workflowStatusName || null,
        fromStatusName: null,
        toStatusName: null,
        transitionName: null,
        assignedRoles: perm.assignedRoles || [],
        projectAssignedRoles: perm.projectAssignedRoles || [],
        grantId: perm.grantId ?? null,
        roleId: perm.permissionId ?? null,
        projectGrants: perm.projectGrants || [],
        canBePreserved: Boolean((perm as any).canBePreserved)
      }));

    const fieldStatusPermissions = (impact.fieldStatusPermissions || [])
      .filter((perm) => perm.hasAssignments)
      .map((perm) => ({
        permissionId: perm.permissionId ?? null,
        permissionType: perm.permissionType || 'FIELD_VIEWERS',
        itemTypeSetName: perm.itemTypeSetName || 'N/A',
        fieldName: perm.fieldName || null,
        statusName: perm.workflowStatusName || perm.statusName || null,
        fromStatusName: null,
        toStatusName: null,
        transitionName: null,
        assignedRoles: perm.assignedRoles || [],
        projectAssignedRoles: perm.projectAssignedRoles || [],
        grantId: perm.grantId ?? null,
        roleId: perm.permissionId ?? null,
        projectGrants: perm.projectGrants || [],
        canBePreserved: Boolean((perm as any).canBePreserved)
      }));

    return [...executorPermissions, ...statusOwnerPermissions, ...fieldStatusPermissions];
  },
  getFieldName: (perm: PermissionData) => perm.fieldName || '',
  getStatusName: (perm: PermissionData) => perm.statusName || '',
  getTransitionName: (perm: PermissionData) => perm.transitionName || '',
  exportFileName: (impact) =>
    `transition_impact_report_${impact.workflowId}_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.csv`
};

