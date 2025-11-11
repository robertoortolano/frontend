import React from 'react';
import { StatusRemovalImpactDto } from '../types/status-impact.types';
import { escapeCSV, PermissionData } from '../utils/csvExportUtils';
import { mapImpactPermissions } from '../utils/impactPermissionMapping';
import {
  EnhancedImpactReportConfig,
  EnhancedImpactReportModal,
  EnhancedImpactReportModalBaseProps
} from './EnhancedImpactReportModal';

const statusImpactConfig: EnhancedImpactReportConfig<StatusRemovalImpactDto> = {
  title: '📊 Report Impatto Rimozione Status',
  getSubtitle: (impact) => impact.workflowName,
  buildPermissionRows: (impact) => {
    const permissions = [
      ...(impact.statusOwnerPermissions || []),
      ...(impact.executorPermissions || []),
      ...(impact.fieldStatusPermissions || [])
    ];

    const getPermissionName = (perm: any): string => {
      switch (perm.permissionType) {
        case 'STATUS_OWNERS':
          return `Status Owner - ${perm.statusName || 'N/A'}`;
        case 'EXECUTORS': {
          const fromStatus = perm.fromStatusName || 'N/A';
          const toStatus = perm.toStatusName || 'N/A';
          const transitionName = perm.transitionName;
          const transitionPart = transitionName ? ` (${transitionName})` : '';
          return `Executor - ${fromStatus} -> ${toStatus}${transitionPart}`;
        }
        case 'FIELD_EDITORS':
        case 'FIELD_VIEWERS':
        case 'EDITORS':
        case 'VIEWERS': {
          const fieldName = perm.fieldName || 'N/A';
          const statusName = perm.statusName || perm.workflowStatusName || 'N/A';
          const label =
            perm.permissionType === 'FIELD_EDITORS' || perm.permissionType === 'EDITORS'
              ? 'Editor'
              : 'Viewer';
          return `${label} - ${fieldName} in ${statusName}`;
        }
        default:
          return `${perm.permissionType || 'Permission'} - ${perm.itemTypeSetName || 'N/A'}`;
      }
    };

    const getMatchLabel = (perm: any): string | undefined => {
      if (!(perm.canBePreserved ?? false)) {
        return undefined;
      }
      const matchParts: string[] = [];
      if (perm.matchingStatusName) {
        matchParts.push(perm.matchingStatusName);
      }
      if (perm.matchingFieldName) {
        matchParts.push(perm.matchingFieldName);
      }
      if (perm.transitionNameMatch) {
        matchParts.push(perm.transitionNameMatch);
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
  prepareExportPermissions: (impact) => {
    const statusOwnerPerms = (impact.statusOwnerPermissions || [])
      .filter((perm) => perm.hasAssignments)
      .map((perm) => ({
        permissionId: perm.permissionId,
        permissionType: perm.permissionType || 'N/A',
        itemTypeSetName: perm.itemTypeSetName || 'N/A',
        statusName: perm.statusName || null,
        fieldName: null,
        fromStatusName: null,
        toStatusName: null,
        transitionName: null,
        assignedRoles: perm.assignedRoles || [],
        projectAssignedRoles: perm.projectAssignedRoles || [],
        grantId: perm.grantId,
        roleId: perm.roleId,
        projectGrants: perm.projectGrants,
        canBePreserved: perm.canBePreserved
      }));

    const executorPerms = (impact.executorPermissions || [])
      .filter((perm) => perm.hasAssignments)
      .map((perm) => ({
        permissionId: perm.permissionId,
        permissionType: perm.permissionType || 'N/A',
        itemTypeSetName: perm.itemTypeSetName || 'N/A',
        statusName: null,
        fieldName: null,
        fromStatusName: perm.fromStatusName || null,
        toStatusName: perm.toStatusName || null,
        transitionName: perm.transitionName || null,
        assignedRoles: perm.assignedRoles || [],
        projectAssignedRoles: perm.projectAssignedRoles || [],
        grantId: perm.grantId,
        roleId: perm.roleId,
        projectGrants: perm.projectGrants,
        canBePreserved: perm.canBePreserved
      }));

    const fieldStatusPerms = (impact.fieldStatusPermissions || [])
      .filter((perm) => perm.hasAssignments)
      .map((perm) => ({
        permissionId: perm.permissionId,
        permissionType: perm.permissionType || 'N/A',
        itemTypeSetName: perm.itemTypeSetName || 'N/A',
        statusName: perm.statusName || null,
        fieldName: perm.fieldName || null,
        fromStatusName: null,
        toStatusName: null,
        transitionName: null,
        assignedRoles: perm.assignedRoles || [],
        projectAssignedRoles: perm.projectAssignedRoles || [],
        grantId: perm.grantId,
        roleId: perm.roleId,
        projectGrants: perm.projectGrants,
        canBePreserved: perm.canBePreserved
      }));

    return [...statusOwnerPerms, ...executorPerms, ...fieldStatusPerms];
  },
  getFieldName: (perm: PermissionData) => escapeCSV(perm.fieldName || ''),
  getStatusName: (perm: PermissionData) => escapeCSV(perm.statusName || ''),
  getTransitionName: () => '',
  exportFileName: (impact) =>
    `status_impact_report_${impact.workflowId}_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.csv`
};

export type StatusEnhancedImpactReportModalProps =
  EnhancedImpactReportModalBaseProps<StatusRemovalImpactDto>;

export const StatusEnhancedImpactReportModal: React.FC<StatusEnhancedImpactReportModalProps> = (props) => (
  <EnhancedImpactReportModal {...props} config={statusImpactConfig} />
);
