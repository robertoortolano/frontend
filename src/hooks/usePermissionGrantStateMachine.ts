import { useEffect, useCallback, useMemo, useReducer } from 'react';

import api from '../api/api';
import { extractErrorMessage } from '../utils/errorUtils';
import type { UserOption } from '../components/UserAutocomplete';
import type {
  Permission,
  PermissionScope,
  Role,
  Group,
} from '../components/permissions/grants/permissionGrantTypes';
import {
  fetchAvailableRoles,
  fetchAvailableGroups,
  fetchGrantDetails,
  fetchProjectGrantDetails,
  fetchProjectRoles,
} from './permissionGrantStateMachine/loaders';
import { permissionGrantReducer } from './permissionGrantStateMachine/reducer';
import { PermissionGrantActionType } from './permissionGrantStateMachine/actions';
import {
  createPermissionGrantReducerState,
  GrantCollectionKey,
  GrantCollections,
  PermissionGrantMetadata,
  PermissionGrantState,
  TargetGrantCollection,
} from './permissionGrantStateMachine/types';

const permissionTypeMap: Record<string, string> = {
  Workers: 'WorkerPermission',
  Creators: 'CreatorPermission',
  'Status Owners': 'StatusOwnerPermission',
  Executors: 'ExecutorPermission',
  'Field Owners': 'FieldOwnerPermission',
  Editors: 'FieldStatusPermission',
  Viewers: 'FieldStatusPermission',
};

export const getPermissionType = (permissionName: string): string =>
  permissionTypeMap[permissionName] || permissionName?.toUpperCase();

interface UsePermissionGrantStateMachineParams {
  permission: Permission | null;
  scope: PermissionScope;
  projectId?: string;
  itemTypeSetId?: number;
}

interface PermissionGrantActions {
  addRole: (role: Role) => void;
  removeRole: (roleId: number) => void;
  addGrantUser: (user: UserOption) => void;
  removeGrantUser: (userId: number) => void;
  addGrantGroup: (group: Group) => void;
  removeGrantGroup: (groupId: number) => void;
  addGrantNegatedUser: (user: UserOption) => void;
  removeGrantNegatedUser: (userId: number) => void;
  addGrantNegatedGroup: (group: Group) => void;
  removeGrantNegatedGroup: (groupId: number) => void;
  addProjectGrantUser: (user: UserOption) => void;
  removeProjectGrantUser: (userId: number) => void;
  addProjectGrantGroup: (group: Group) => void;
  removeProjectGrantGroup: (groupId: number) => void;
  addProjectGrantNegatedUser: (user: UserOption) => void;
  removeProjectGrantNegatedUser: (userId: number) => void;
  addProjectGrantNegatedGroup: (group: Group) => void;
  removeProjectGrantNegatedGroup: (groupId: number) => void;
  persistAssignments: () => Promise<boolean>;
  resetError: () => void;
}

export interface UsePermissionGrantStateMachineReturn {
  state: PermissionGrantState;
  actions: PermissionGrantActions;
  metadata: PermissionGrantMetadata;
}

export function usePermissionGrantStateMachine({
  permission,
  scope,
  projectId,
  itemTypeSetId,
}: UsePermissionGrantStateMachineParams): UsePermissionGrantStateMachineReturn {
  const [state, dispatch] = useReducer(
    permissionGrantReducer,
    undefined,
    createPermissionGrantReducerState,
  );
  const { grant, projectGrant, selectedRoles } = state;

  const setLoading = useCallback((value: boolean) => {
    dispatch({ type: PermissionGrantActionType.SetLoading, payload: value });
  }, []);

  const setError = useCallback((value: string | null) => {
    dispatch({ type: PermissionGrantActionType.SetError, payload: value });
  }, []);

  const setAvailableRoles = useCallback((roles: Role[]) => {
    dispatch({ type: PermissionGrantActionType.SetAvailableRoles, payload: roles });
  }, []);

  const setAvailableGroups = useCallback((groups: Group[]) => {
    dispatch({ type: PermissionGrantActionType.SetAvailableGroups, payload: groups });
  }, []);

  const setSelectedRoles = useCallback((roles: Role[]) => {
    dispatch({ type: PermissionGrantActionType.SetSelectedRoles, payload: roles });
  }, []);

  const setGrant = useCallback((grantCollections: GrantCollections) => {
    dispatch({ type: PermissionGrantActionType.SetGrant, payload: grantCollections });
  }, []);

  const resetGrant = useCallback(() => {
    dispatch({ type: PermissionGrantActionType.ResetGrant });
  }, []);

  const setProjectGrant = useCallback((grantCollections: GrantCollections) => {
    dispatch({ type: PermissionGrantActionType.SetProjectGrant, payload: grantCollections });
  }, []);

  const resetProjectGrant = useCallback(() => {
    dispatch({ type: PermissionGrantActionType.ResetProjectGrant });
  }, []);

  const resetState = useCallback(() => {
    dispatch({ type: PermissionGrantActionType.ResetState });
  }, []);

  useEffect(() => {
    let cancelled = false;

    const initialise = async () => {
      setLoading(true);
      setError(null);

      try {
        if (!permission) {
          resetState();
          const [roles, groups] = await Promise.all([fetchAvailableRoles(), fetchAvailableGroups()]);
          if (cancelled) {
            return;
          }

          setAvailableRoles(roles);
          setAvailableGroups(groups);
          return;
        }

        const [roles, groups] = await Promise.all([fetchAvailableRoles(), fetchAvailableGroups()]);
        if (cancelled) {
          return;
        }

        setAvailableRoles(roles);
        setAvailableGroups(groups);

        const permissionId = typeof permission.id === 'number' ? permission.id : null;
        const permissionType = getPermissionType(permission.name);

        if (!permissionId || !permissionType) {
          resetState();
          return;
        }

        if (scope === 'project' && projectId) {
          const numericProjectId = Number(projectId);
          const [projectRoles, projectGrantDetails] = await Promise.all([
            fetchProjectRoles(permissionType, permissionId, numericProjectId),
            fetchProjectGrantDetails(permissionType, permissionId, numericProjectId),
          ]);

          if (cancelled) {
            return;
          }

          setSelectedRoles(projectRoles);
          setProjectGrant(projectGrantDetails);

          if (permission.grantId) {
            const grantDetails = await fetchGrantDetails(permissionType, permissionId);
            if (cancelled) {
              return;
            }
            setGrant(grantDetails);
          } else {
            resetGrant();
          }
        } else {
          setSelectedRoles(permission.assignedRoles || []);

          if (permission.grantId) {
            const grantDetails = await fetchGrantDetails(permissionType, permissionId);
            if (cancelled) {
              return;
            }
            setGrant(grantDetails);
          } else {
            resetGrant();
          }

          resetProjectGrant();
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    initialise();

    return () => {
      cancelled = true;
    };
  }, [
    permission,
    projectId,
    scope,
    resetGrant,
    resetProjectGrant,
    resetState,
    setAvailableGroups,
    setAvailableRoles,
    setError,
    setGrant,
    setLoading,
    setProjectGrant,
    setSelectedRoles,
  ]);

  const addRole = useCallback((role: Role) => {
    dispatch({ type: PermissionGrantActionType.AddRole, payload: role });
  }, []);

  const removeRole = useCallback((roleId: number) => {
    dispatch({ type: PermissionGrantActionType.RemoveRole, payload: roleId });
  }, []);

  const addEntity = useCallback(
    (target: TargetGrantCollection, key: GrantCollectionKey, value: UserOption | Group) => {
      dispatch({
        type: PermissionGrantActionType.AddGrantEntity,
        payload: { target, key, value },
      });
    },
    [],
  );

  const removeEntity = useCallback(
    (target: TargetGrantCollection, key: GrantCollectionKey, id: number) => {
      dispatch({
        type: PermissionGrantActionType.RemoveGrantEntity,
        payload: { target, key, id },
      });
    },
    [],
  );

  const persistAssignments = useCallback(async (): Promise<boolean> => {
    if (!permission) {
      setError('Permission non disponibile. Riapri il manager e riprova.');
      return false;
    }

    setLoading(true);
    setError(null);

    try {
      const permissionId = typeof permission.id === 'number' ? permission.id : null;

      if (!permissionId) {
        setError(
          `ID Permission non valido. Il valore ricevuto è: ${permission.id}. ` +
            'Per risolvere il problema, chiudi questa finestra e ricarica la pagina delle permissions.',
        );
        return false;
      }

      const permissionType = getPermissionType(permission.name);

      if (!permissionType) {
        setError(`Tipo di permission non riconosciuto: ${permission.name}`);
        return false;
      }

      const hasGrantDirect =
        grant.users.length > 0 ||
        grant.groups.length > 0 ||
        grant.negatedUsers.length > 0 ||
        grant.negatedGroups.length > 0;

      if (scope !== 'project') {
        if (hasGrantDirect) {
          const payload: Record<string, any> = {
            permissionType,
            permissionId,
          };

          if (grant.users.length > 0) {
            payload.userIds = grant.users.map((u) => u.id);
          }

          if (grant.groups.length > 0) {
            payload.groupIds = grant.groups.map((g) => g.id);
          }

          if (grant.negatedUsers.length > 0) {
            payload.negatedUserIds = grant.negatedUsers.map((u) => u.id);
          }

          if (grant.negatedGroups.length > 0) {
            payload.negatedGroupIds = grant.negatedGroups.map((g) => g.id);
          }

          try {
            await api.post('/permission-assignments/create-and-assign-grant', payload);
          } catch (err: any) {
            const errorMessage = extractErrorMessage(err, 'Errore sconosciuto');
            throw new Error(
              `Errore nella ${permission.grantId ? 'modifica' : 'creazione'} e assegnazione Grant: ${errorMessage}`,
            );
          }
        } else if (permission.grantId) {
          const currentRoleIds = selectedRoles.map((role) => role.id);

          if (currentRoleIds.length > 0) {
            try {
              await api.post('/permission-assignments', {
                permissionType,
                permissionId,
                roleIds: currentRoleIds,
                grantId: null,
              });
            } catch (err: any) {
              const errorMessage = extractErrorMessage(err, 'Errore sconosciuto');
              throw new Error(`Errore durante la rimozione del Grant: ${errorMessage}`);
            }
          } else {
            try {
              await api.delete(`/permission-assignments/${permissionType}/${permissionId}`);
            } catch (err: any) {
              console.warn('Warning removing empty permission assignment:', err);
            }
          }
        }
      }

      const hadInitialProjectGrant =
        scope === 'project' &&
        Boolean(
          (permission as any).projectGrantId ??
            (permission as any).projectGrantName ??
            (permission as any).hasProjectGrant,
        );

      if (scope === 'project' && projectId) {
        const hasProjectGrantDirect =
          projectGrant.users.length > 0 ||
          projectGrant.groups.length > 0 ||
          projectGrant.negatedUsers.length > 0 ||
          projectGrant.negatedGroups.length > 0;

        if (hasProjectGrantDirect) {
          const projectPayload: Record<string, any> = {
            permissionType,
            permissionId,
            projectId: Number(projectId),
            itemTypeSetId,
          };

          if (projectGrant.users.length > 0) {
            projectPayload.userIds = projectGrant.users.map((u) => u.id);
          }

          if (projectGrant.groups.length > 0) {
            projectPayload.groupIds = projectGrant.groups.map((g) => g.id);
          }

          if (projectGrant.negatedUsers.length > 0) {
            projectPayload.negatedUserIds = projectGrant.negatedUsers.map((u) => u.id);
          }

          if (projectGrant.negatedGroups.length > 0) {
            projectPayload.negatedGroupIds = projectGrant.negatedGroups.map((g) => g.id);
          }

          try {
            await api.post('/project-permission-assignments/create-and-assign-grant', projectPayload);
          } catch (err: any) {
            const errorMessage = extractErrorMessage(err, 'Errore sconosciuto');
            throw new Error(`Errore nella creazione/modifica Grant di progetto: ${errorMessage}`);
          }
        } else if (hadInitialProjectGrant) {
          try {
            await api.delete(`/project-permission-assignments/${permissionType}/${permissionId}/project/${projectId}`);
          } catch (err: any) {
            console.warn('Warning removing project grant assignment:', err);
          }
        }
      }

      if (scope === 'project' && projectId && itemTypeSetId) {
        const projectRolePayload: Record<string, any> = {
          permissionType,
          permissionId,
          projectId: Number(projectId),
          itemTypeSetId,
          roleIds: selectedRoles.map((role) => role.id),
        };

        try {
          const existingAssignmentResponse = await api.get(
            `/project-permission-assignments/${permissionType}/${permissionId}/project/${projectId}`,
          );
          const existingAssignment = existingAssignmentResponse.data;
          if (existingAssignment?.grant?.id) {
            projectRolePayload.grantId = existingAssignment.grant.id;
          }
        } catch (err: any) {
          if (err?.response?.status !== 404 && err?.response?.status !== 200) {
            console.warn('Warning fetching existing assignment for grant preservation:', err);
          }
        }

        try {
          await api.post('/project-permission-assignments', projectRolePayload);
        } catch (err: any) {
          const errorMessage = extractErrorMessage(err, 'Errore sconosciuto');
          throw new Error(`Errore nella gestione dei ruoli di progetto: ${errorMessage}`);
        }
      } else if (scope !== 'project') {
        const originalRoles: Role[] = permission.assignedRoles || [];

        for (const originalRole of originalRoles) {
          if (!selectedRoles.find((role) => role.id === originalRole.id)) {
            await api.delete('/itemtypeset-permissions/remove-role', {
              params: {
                permissionId,
                roleId: originalRole.id,
                permissionType,
              },
            });
          }
        }

        for (const role of selectedRoles) {
          const isAlreadyAssigned = originalRoles.find((originalRole) => originalRole.id === role.id);
          if (!isAlreadyAssigned) {
            await api.post('/itemtypeset-permissions/assign-role', null, {
              params: {
                permissionId,
                roleId: role.id,
                permissionType,
              },
            });
          }
        }
      }

      return true;
    } catch (err: any) {
      setError(err?.message || 'Errore durante il salvataggio');
      console.error('Error saving permission assignments:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [grant, itemTypeSetId, permission, projectGrant, projectId, scope, selectedRoles, setError, setLoading]);

  const hasGrantDirect = useMemo(
    () =>
      grant.users.length > 0 ||
      grant.groups.length > 0 ||
      grant.negatedUsers.length > 0 ||
      grant.negatedGroups.length > 0 ||
      Boolean(permission?.grantId),
    [
      permission?.grantId,
      grant.groups.length,
      grant.negatedGroups.length,
      grant.negatedUsers.length,
      grant.users.length,
    ],
  );

  const hasProjectGrantDirect = useMemo(
    () =>
      projectGrant.users.length > 0 ||
      projectGrant.groups.length > 0 ||
      projectGrant.negatedUsers.length > 0 ||
      projectGrant.negatedGroups.length > 0 ||
      Boolean((permission as any)?.projectGrantId),
    [
      permission,
      projectGrant.groups.length,
      projectGrant.negatedGroups.length,
      projectGrant.negatedUsers.length,
      projectGrant.users.length,
    ],
  );

  const hasRoleTemplate = useMemo(
    () => selectedRoles.length > 0 || (permission?.assignedRoles?.length ?? 0) > 0,
    [permission?.assignedRoles, selectedRoles.length],
  );

  return {
    state,
    actions: {
      addRole,
      removeRole,
      addGrantUser: (user) => addEntity('grant', 'users', user),
      removeGrantUser: (userId) => removeEntity('grant', 'users', userId),
      addGrantGroup: (group) => addEntity('grant', 'groups', group),
      removeGrantGroup: (groupId) => removeEntity('grant', 'groups', groupId),
      addGrantNegatedUser: (user) => addEntity('grant', 'negatedUsers', user),
      removeGrantNegatedUser: (userId) => removeEntity('grant', 'negatedUsers', userId),
      addGrantNegatedGroup: (group) => addEntity('grant', 'negatedGroups', group),
      removeGrantNegatedGroup: (groupId) => removeEntity('grant', 'negatedGroups', groupId),
      addProjectGrantUser: (user) => addEntity('projectGrant', 'users', user),
      removeProjectGrantUser: (userId) => removeEntity('projectGrant', 'users', userId),
      addProjectGrantGroup: (group) => addEntity('projectGrant', 'groups', group),
      removeProjectGrantGroup: (groupId) => removeEntity('projectGrant', 'groups', groupId),
      addProjectGrantNegatedUser: (user) => addEntity('projectGrant', 'negatedUsers', user),
      removeProjectGrantNegatedUser: (userId) => removeEntity('projectGrant', 'negatedUsers', userId),
      addProjectGrantNegatedGroup: (group) => addEntity('projectGrant', 'negatedGroups', group),
      removeProjectGrantNegatedGroup: (groupId) => removeEntity('projectGrant', 'negatedGroups', groupId),
      persistAssignments,
      resetError: () => setError(null),
    },
    metadata: {
      hasGrantDirect,
      hasProjectGrantDirect,
      hasRoleTemplate,
    },
  };
}
