import { escapeCSV, PermissionData } from '../../../utils/csvExportUtils';
import { mapImpactPermissions } from '../../../utils/impactPermissionMapping';
import { FieldSetRemovalImpactDto } from '../../../types/fieldset-impact.types';
import { EnhancedImpactReportConfig } from '../../EnhancedImpactReportModal';

export const fieldSetImpactConfig: EnhancedImpactReportConfig<FieldSetRemovalImpactDto> = {
  title: '📊 Report Impatto Modifica FieldSet',
  getSubtitle: (impact) => impact.fieldSetName,
  buildPermissionRows: (impact) => {
    const permissions = [
      ...(impact.fieldOwnerPermissions || []),
      ...(impact.fieldStatusPermissions || [])
    ];

    const getPermissionName = (perm: any): string => {
      switch (perm.permissionType) {
        case 'FIELD_OWNERS':
          return `Field Owner - ${perm.fieldName || perm.fieldConfigurationName || 'N/A'}`;
        case 'FIELD_EDITORS':
        case 'EDITORS':
          return `Editor - ${perm.fieldName || perm.fieldConfigurationName || 'N/A'} @ ${
            perm.statusName || 'N/A'
          }`;
        case 'FIELD_VIEWERS':
        case 'VIEWERS':
          return `Viewer - ${perm.fieldName || perm.fieldConfigurationName || 'N/A'} @ ${
            perm.statusName || 'N/A'
          }`;
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
      return matchParts.length ? `✓ ${matchParts.join(' @ ')}` : undefined;
    };

    return mapImpactPermissions({
      permissions,
      getLabel: getPermissionName,
      getMatchLabel,
      fallbackItemTypeSetName: null
    });
  },
  prepareExportPermissions: (impact) =>
    [
      ...(impact.fieldOwnerPermissions || []),
      ...(impact.fieldStatusPermissions || [])
    ]
      .filter((perm) => perm.hasAssignments)
      .map((perm) => {
        const fieldName =
          perm.fieldName && perm.fieldName.trim().length > 0
            ? perm.fieldName
            : perm.fieldConfigurationName && perm.fieldConfigurationName.trim().length > 0
            ? perm.fieldConfigurationName
            : null;

        return {
          permissionId: perm.permissionId,
          permissionType: perm.permissionType || 'N/A',
          itemTypeSetName: perm.itemTypeSetName || 'N/A',
          fieldName,
          statusName: perm.statusName || perm.workflowStatusName || null,
          fromStatusName: null,
          toStatusName: null,
          transitionName: null,
          assignedRoles: perm.assignedRoles || [],
          grantId: perm.grantId,
          roleId: perm.roleId,
          projectGrants: perm.projectGrants,
          projectAssignedRoles: perm.projectAssignedRoles,
          canBePreserved: Boolean((perm as any).canBePreserved)
        };
      }),
  getFieldName: (perm: PermissionData) => {
    const fieldName = perm.fieldName?.trim();
    return escapeCSV(fieldName && fieldName.length > 0 ? fieldName : '');
  },
  getStatusName: (perm: PermissionData) => escapeCSV(perm.statusName || ''),
  getTransitionName: () => '',
  exportFileName: (impact) =>
    `fieldset_impact_report_${impact.fieldSetId}_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.csv`
};

