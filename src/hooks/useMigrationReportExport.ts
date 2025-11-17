import { useCallback } from 'react';
import { ItemTypeConfigurationMigrationImpactDto } from '../types/item-type-configuration-migration.types';
import { exportImpactReportToCSV, escapeCSV, PermissionData } from '../utils/csvExportUtils';
import { SelectablePermissionImpact } from '../types/item-type-configuration-migration.types';

interface UseMigrationReportExportParams {
	impacts: ItemTypeConfigurationMigrationImpactDto[];
	getPermissionsForImpact: (impact: ItemTypeConfigurationMigrationImpactDto) => SelectablePermissionImpact[];
	preservedPermissionIdsMap: Map<number, Set<number>>;
}

export function useMigrationReportExport({
	impacts,
	getPermissionsForImpact,
	preservedPermissionIdsMap,
}: UseMigrationReportExportParams) {
	const handleExportFullReport = useCallback(async () => {
		if (impacts.length === 0) {
			return;
		}

		const permissionsForExport: PermissionData[] = [];

		impacts.forEach((impact) => {
			const permissionsWithAssignments = getPermissionsForImpact(impact).filter(
				(permission) => permission.hasAssignments
			);

			permissionsWithAssignments.forEach((permission) => {
				let fieldName: string | null = null;
				if (permission.permissionType === 'FIELD_OWNERS') {
					fieldName = permission.fieldName || permission.entityName || null;
				} else if (
					permission.permissionType === 'FIELD_EDITORS' ||
					permission.permissionType === 'FIELD_VIEWERS'
				) {
					fieldName = permission.fieldName || null;
				}

				permissionsForExport.push({
					permissionId: permission.permissionId,
					permissionType: permission.permissionType || 'N/A',
					itemTypeSetName: permission.itemTypeSetName || 'N/A',
					fieldName,
					statusName: permission.permissionType === 'STATUS_OWNERS' ? permission.entityName || null : null,
					workflowStatusName: permission.workflowStatusName || null,
					fromStatusName: permission.fromStatusName || null,
					toStatusName: permission.toStatusName || null,
					transitionName: permission.transitionName || null,
					assignedRoles: permission.assignedRoles || [],
					grantId: permission.grantId || null,
					roleId: permission.roleId || null,
					projectGrants: permission.projectGrants || [],
					projectAssignedRoles: (permission as any).projectAssignedRoles || [],
					canBePreserved: permission.canBePreserved,
				});
			});
		});

		const getFieldName = (permission: PermissionData) => {
			const f = permission.fieldName?.trim();
			return escapeCSV(f && f.length > 0 ? f : '');
		};
		const getStatusName = (permission: PermissionData) => escapeCSV(permission.statusName || permission.workflowStatusName || '');
		const getTransitionName = () => '';

		const allPreservedPermissionIds = new Set<number>();
		preservedPermissionIdsMap.forEach((preservedSet) => {
			preservedSet.forEach((permissionId) => {
				allPreservedPermissionIds.add(permissionId);
			});
		});

		await exportImpactReportToCSV({
			permissions: permissionsForExport,
			preservedPermissionIds: allPreservedPermissionIds,
			getFieldName,
			getStatusName,
			getTransitionName,
			fileName: `itemtypeconfiguration_migration_report_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.csv`,
		});
	}, [getPermissionsForImpact, impacts, preservedPermissionIdsMap]);

	return { handleExportFullReport };
}



