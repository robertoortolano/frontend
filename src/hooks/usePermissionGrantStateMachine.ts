import { useState, useEffect, useCallback, useMemo, Dispatch, SetStateAction } from 'react';

import api from '../api/api';
import groupService from '../services/groupService';
import { extractErrorMessage } from '../utils/errorUtils';
import type { UserOption } from '../components/UserAutocomplete';
import type {
  Permission,
  PermissionScope,
  Role,
  Group,
} from '../components/permissions/grants/permissionGrantTypes';

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

interface GrantCollections {
  users: UserOption[];
  groups: Group[];
  negatedUsers: UserOption[];
  negatedGroups: Group[];
}

const emptyGrantCollections: GrantCollections = {
  users: [],
  groups: [],
  negatedUsers: [],
  negatedGroups: [],
};

interface PermissionGrantState {
  loading: boolean;
  error: string | null;
  selectedRoles: Role[];
  availableRoles: Role[];
  availableGroups: Group[];
  grant: GrantCollections;
  projectGrant: GrantCollections;
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

interface PermissionGrantMetadata {
  hasGrantDirect: boolean;
  hasProjectGrantDirect: boolean;
  hasRoleTemplate: boolean;
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedRoles, setSelectedRoles] = useState<Role[]>([]);
  const [availableRoles, setAvailableRoles] = useState<Role[]>([]);
  const [availableGroups, setAvailableGroups] = useState<Group[]>([]);
  const [grant, setGrant] = useState<GrantCollections>(emptyGrantCollections);
  const [projectGrant, setProjectGrant] = useState<GrantCollections>(emptyGrantCollections);

  const resetState = useCallback(() => {
    setSelectedRoles([]);
    setAvailableRoles([]);
    setGrant(emptyGrantCollections);
    setProjectGrant(emptyGrantCollections);
  }, []);

  const resetGrantCollections = useCallback(() => {
    setGrant(emptyGrantCollections);
  }, []);

  const resetProjectGrantCollections = useCallback(() => {
    setProjectGrant(emptyGrantCollections);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadAvailableRoles = async () => {
      try {
        const response = await api.get('/itemtypeset-permissions/roles');
        if (!cancelled) {
          setAvailableRoles(response.data || []);
        }
      } catch (err) {
        console.error('Error fetching roles:', err);
        if (!cancelled) {
          setAvailableRoles([]);
        }
      }
    };

    const loadAvailableGroups = async () => {
      try {
        const groups = await groupService.getAll();
        if (!cancelled) {
          setAvailableGroups(groups.map((g: any) => ({ id: g.id, name: g.name })));
        }
      } catch (err) {
        console.error('Error fetching groups:', err);
        if (!cancelled) {
          setAvailableGroups([]);
        }
      }
    };

    const loadGrantDetails = async (permissionType: string, permissionId: number) => {
      try {
        const response = await api.get(`/permission-assignments/${permissionType}/${permissionId}`);
        const assignment = response.data;
        const details = assignment?.grant;
        if (!cancelled) {
          if (!details) {
            resetGrantCollections();
            return;
          }

          const mappedUsers: UserOption[] = Array.from(details.users || []).map((u: any) => ({
            id: u.id,
            username: u.username || '',
            fullName: u.fullName || u.username || 'Utente',
          }));

          const mappedGroups: Group[] = Array.from(details.groups || []).map((g: any) => ({
            id: g.id,
            name: g.name,
          }));

          const mappedNegatedUsers: UserOption[] = Array.from(details.negatedUsers || []).map((u: any) => ({
            id: u.id,
            username: u.username || '',
            fullName: u.fullName || u.username || 'Utente',
          }));

          const mappedNegatedGroups: Group[] = Array.from(details.negatedGroups || []).map((g: any) => ({
            id: g.id,
            name: g.name,
          }));

          setGrant({
            users: mappedUsers,
            groups: mappedGroups,
            negatedUsers: mappedNegatedUsers,
            negatedGroups: mappedNegatedGroups,
          });
        }
      } catch (err) {
        console.error('Error fetching grant details:', err);
        if (!cancelled) {
          resetGrantCollections();
        }
      }
    };

    const loadProjectGrantDetails = async (permissionType: string, permissionId: number, projectNumericId: number) => {
      try {
        const response = await api.get(
          `/project-permission-assignments/${permissionType}/${permissionId}/project/${projectNumericId}`,
        );
        const assignment = response.data;
        const details = assignment?.grant;

        if (!cancelled) {
          if (!details) {
            resetProjectGrantCollections();
            return;
          }

          const mappedUsers: UserOption[] = Array.from(details.users || []).map((u: any) => ({
            id: u.id,
            username: u.username || '',
            fullName: u.fullName || u.username || 'Utente',
          }));

          const mappedGroups: Group[] = Array.from(details.groups || []).map((g: any) => ({
            id: g.id,
            name: g.name,
          }));

          const mappedNegatedUsers: UserOption[] = Array.from(details.negatedUsers || []).map((u: any) => ({
            id: u.id,
            username: u.username || '',
            fullName: u.fullName || u.username || 'Utente',
          }));

          const mappedNegatedGroups: Group[] = Array.from(details.negatedGroups || []).map((g: any) => ({
            id: g.id,
            name: g.name,
          }));

          setProjectGrant({
            users: mappedUsers,
            groups: mappedGroups,
            negatedUsers: mappedNegatedUsers,
            negatedGroups: mappedNegatedGroups,
          });
        }
      } catch (err: any) {
        if (err?.response?.status !== 404) {
          console.error('Error fetching project grant details:', err);
        }
        if (!cancelled) {
          resetProjectGrantCollections();
        }
      }
    };

    const loadProjectRoles = async (permissionType: string, permissionId: number, projectNumericId: number) => {
      try {
        const response = await api.get(
          `/project-permission-assignments/${permissionType}/${permissionId}/project/${projectNumericId}`,
        );
        const roles = response.data?.roles || [];

        if (!cancelled) {
          setSelectedRoles(
            Array.from(roles).map((r: any) => ({
              id: r.id,
              name: r.name,
              description: r.description,
            })),
          );
        }
      } catch (err: any) {
        if (err?.response?.status !== 404) {
          console.error('Error fetching project roles:', err);
        }
        if (!cancelled) {
          setSelectedRoles([]);
        }
      }
    };

    const initialise = async () => {
      if (!permission) {
        resetState();
        await Promise.all([loadAvailableRoles(), loadAvailableGroups()]);
        return;
      }

      await Promise.all([loadAvailableRoles(), loadAvailableGroups()]);

      const permissionId = typeof permission.id === 'number' ? permission.id : null;
      const permissionType = getPermissionType(permission.name);

      if (!permissionId || !permissionType) {
        resetState();
        return;
      }

      if (scope === 'project' && projectId) {
        const numericProjectId = Number(projectId);
        await Promise.all([
          loadProjectRoles(permissionType, permissionId, numericProjectId),
          loadProjectGrantDetails(permissionType, permissionId, numericProjectId),
        ]);

        if (permission.grantId) {
          await loadGrantDetails(permissionType, permissionId);
        } else {
          resetGrantCollections();
        }
      } else {
        setSelectedRoles(permission.assignedRoles || []);
        if (permission.grantId) {
          await loadGrantDetails(permissionType, permissionId);
        } else {
          resetGrantCollections();
        }
      }

      if (scope !== 'project') {
        resetProjectGrantCollections();
      }
    };

    initialise();

    return () => {
      cancelled = true;
    };
  }, [
    permission,
    scope,
    projectId,
    resetGrantCollections,
    resetProjectGrantCollections,
    resetState,
  ]);

  const addRole = useCallback((role: Role) => {
    setSelectedRoles((current) => {
      if (current.find((r) => r.id === role.id)) {
        return current;
      }
      return [...current, role];
    });
  }, []);

  const removeRole = useCallback((roleId: number) => {
    setSelectedRoles((current) => current.filter((role) => role.id !== roleId));
  }, []);

  const addEntity = useCallback(
    (
      updater: Dispatch<SetStateAction<GrantCollections>>,
      key: keyof GrantCollections,
      value: UserOption | Group,
    ) => {
      updater((current) => {
        const collection = current[key] as (UserOption[] | Group[]);
        const exists = collection.some((item) => item.id === value.id);
        if (exists) {
          return current;
        }

        const updatedCollection = [...collection, value] as typeof collection;
        return { ...current, [key]: updatedCollection };
      });
    },
    [],
  );

  const removeEntity = useCallback(
    (
      updater: Dispatch<SetStateAction<GrantCollections>>,
      key: keyof GrantCollections,
      id: number,
    ) => {
      updater((current) => {
        const collection = current[key] as (UserOption[] | Group[]);
        const updatedCollection = collection.filter((item) => item.id !== id) as typeof collection;
        return { ...current, [key]: updatedCollection };
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
  }, [
    grant.groups,
    grant.negatedGroups,
    grant.negatedUsers,
    grant.users,
    itemTypeSetId,
    permission,
    projectGrant.groups,
    projectGrant.negatedGroups,
    projectGrant.negatedUsers,
    projectGrant.users,
    projectId,
    scope,
    selectedRoles,
  ]);

  const hasGrantDirect = useMemo(
    () =>
      grant.users.length > 0 ||
      grant.groups.length > 0 ||
      grant.negatedUsers.length > 0 ||
      grant.negatedGroups.length > 0 ||
      Boolean(permission?.grantId),
    [grant.groups.length, grant.negatedGroups.length, grant.negatedUsers.length, grant.users.length, permission?.grantId],
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
    state: {
      loading,
      error,
      selectedRoles,
      availableRoles,
      availableGroups,
      grant,
      projectGrant,
    },
    actions: {
      addRole,
      removeRole,
      addGrantUser: (user) => addEntity(setGrant, 'users', user),
      removeGrantUser: (userId) => removeEntity(setGrant, 'users', userId),
      addGrantGroup: (group) => addEntity(setGrant, 'groups', group),
      removeGrantGroup: (groupId) => removeEntity(setGrant, 'groups', groupId),
      addGrantNegatedUser: (user) => addEntity(setGrant, 'negatedUsers', user),
      removeGrantNegatedUser: (userId) => removeEntity(setGrant, 'negatedUsers', userId),
      addGrantNegatedGroup: (group) => addEntity(setGrant, 'negatedGroups', group),
      removeGrantNegatedGroup: (groupId) => removeEntity(setGrant, 'negatedGroups', groupId),
      addProjectGrantUser: (user) => addEntity(setProjectGrant, 'users', user),
      removeProjectGrantUser: (userId) => removeEntity(setProjectGrant, 'users', userId),
      addProjectGrantGroup: (group) => addEntity(setProjectGrant, 'groups', group),
      removeProjectGrantGroup: (groupId) => removeEntity(setProjectGrant, 'groups', groupId),
      addProjectGrantNegatedUser: (user) => addEntity(setProjectGrant, 'negatedUsers', user),
      removeProjectGrantNegatedUser: (userId) => removeEntity(setProjectGrant, 'negatedUsers', userId),
      addProjectGrantNegatedGroup: (group) => addEntity(setProjectGrant, 'negatedGroups', group),
      removeProjectGrantNegatedGroup: (groupId) => removeEntity(setProjectGrant, 'negatedGroups', groupId),
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


