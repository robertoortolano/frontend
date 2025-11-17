import { useCallback, useState } from 'react';
import api from '../api/api';
import { ProjectGrantInfo } from '../types/item-type-configuration-migration.types';
import { SelectablePermissionImpact } from '../types/item-type-configuration-migration.types';

interface RolesDetailsPayload {
	permissionName: string;
	roles: string[];
}

interface GrantDetailsState {
	projectId: number;
	projectName: string;
	roleId: number;
	details: any;
}

export function useGrantDetailsManager() {
	const [selectedGrantDetails, setSelectedGrantDetails] = useState<GrantDetailsState | null>(null);
	const [loadingGrantDetails, setLoadingGrantDetails] = useState(false);
	const [selectedRolesDetails, setSelectedRolesDetails] = useState<RolesDetailsPayload | null>(null);

	const handleShowRolesDetails = useCallback((payload: RolesDetailsPayload) => {
		setSelectedRolesDetails(payload);
	}, []);

	const handleRequestGlobalGrantDetails = useCallback(async (permission: SelectablePermissionImpact) => {
		if (!permission.permissionId || !permission.permissionType) {
			window.alert('Permission senza permissionId o permissionType');
			return;
		}
		setLoadingGrantDetails(true);
		try {
			const response = await api.get(`/permission-assignments/${permission.permissionType}/${permission.permissionId}`);
			const assignment = response.data;
			setSelectedGrantDetails({
				projectId: 0,
				projectName: 'Globale',
				roleId: permission.permissionId,
				details: assignment.grant || {},
			});
		} catch (_error) {
			window.alert('Errore nel recupero dei dettagli della grant globale');
		} finally {
			setLoadingGrantDetails(false);
		}
	}, []);

	const handleRequestProjectGrantDetails = useCallback(
		async (permission: SelectablePermissionImpact, projectGrant: ProjectGrantInfo) => {
			if (!permission.permissionId || !permission.permissionType) {
				window.alert('Permission senza permissionId o permissionType');
			 return;
			}
			if (!projectGrant.projectId) {
				window.alert('Grant di progetto senza projectId');
				return;
			}
			setLoadingGrantDetails(true);
			try {
				const response = await api.get(
					`/project-permission-assignments/${permission.permissionType}/${permission.permissionId}/project/${projectGrant.projectId}`
				);
				const assignment = response.data;
				setSelectedGrantDetails({
					projectId: projectGrant.projectId,
					projectName: projectGrant.projectName ?? 'Progetto',
					roleId: permission.permissionId,
					details: assignment.grant || {},
				});
			} catch (_error) {
				window.alert('Errore nel recupero dei dettagli della grant');
			} finally {
				setLoadingGrantDetails(false);
			}
		},
		[]
	);

	return {
		// state
		selectedGrantDetails,
		loadingGrantDetails,
		selectedRolesDetails,
		// state mutators
		clearGrantDetails: () => setSelectedGrantDetails(null),
		clearRolesDetails: () => setSelectedRolesDetails(null),
		// handlers
		handleShowRolesDetails,
		handleRequestGlobalGrantDetails,
		handleRequestProjectGrantDetails,
	};
}



