import type { UserOption } from '../../components/UserAutocomplete';
import type { Group, Role } from '../../components/permissions/grants/permissionGrantTypes';
import {
  createEmptyGrantCollections,
  createInitialPermissionGrantState,
  GrantCollectionKey,
  GrantCollections,
  PermissionGrantState,
  TargetGrantCollection,
} from './types';
import { PermissionGrantAction, PermissionGrantActionType } from './actions';

const hasEntity = (collection: Array<UserOption | Group>, id: number): boolean =>
  collection.some((item) => item.id === id);

const addEntityToCollection = (
  collection: Array<UserOption | Group>,
  value: UserOption | Group,
): Array<UserOption | Group> => {
  if (hasEntity(collection, value.id)) {
    return collection;
  }
  return [...collection, value];
};

const removeEntityFromCollection = (
  collection: Array<UserOption | Group>,
  id: number,
): Array<UserOption | Group> => collection.filter((item) => item.id !== id);

const updateGrantCollection = (
  grant: GrantCollections,
  key: GrantCollectionKey,
  updater: (collection: Array<UserOption | Group>) => Array<UserOption | Group>,
): GrantCollections => {
  const collection = grant[key] as Array<UserOption | Group>;
  return {
    ...grant,
    [key]: updater(collection),
  };
};

const applyGrantUpdate = (
  state: PermissionGrantState,
  target: TargetGrantCollection,
  key: GrantCollectionKey,
  updater: (collection: Array<UserOption | Group>) => Array<UserOption | Group>,
): PermissionGrantState => {
  if (target === 'grant') {
    return {
      ...state,
      grant: updateGrantCollection(state.grant, key, updater),
    };
  }

  return {
    ...state,
    projectGrant: updateGrantCollection(state.projectGrant, key, updater),
  };
};

const removeRoleById = (roles: Role[], roleId: number): Role[] =>
  roles.filter((role) => role.id !== roleId);

const addRole = (roles: Role[], role: Role): Role[] => {
  if (roles.some((r) => r.id === role.id)) {
    return roles;
  }
  return [...roles, role];
};

export const permissionGrantReducer = (
  state: PermissionGrantState,
  action: PermissionGrantAction,
): PermissionGrantState => {
  switch (action.type) {
    case PermissionGrantActionType.SetLoading:
      return {
        ...state,
        loading: action.payload,
      };

    case PermissionGrantActionType.SetError:
      return {
        ...state,
        error: action.payload,
      };

    case PermissionGrantActionType.ResetState:
      return {
        ...state,
        selectedRoles: [],
        availableRoles: [],
        grant: createEmptyGrantCollections(),
        projectGrant: createEmptyGrantCollections(),
      };

    case PermissionGrantActionType.SetAvailableRoles:
      return {
        ...state,
        availableRoles: action.payload,
      };

    case PermissionGrantActionType.SetAvailableGroups:
      return {
        ...state,
        availableGroups: action.payload,
      };

    case PermissionGrantActionType.SetGrant:
      return {
        ...state,
        grant: action.payload,
      };

    case PermissionGrantActionType.ResetGrant:
      return {
        ...state,
        grant: createEmptyGrantCollections(),
      };

    case PermissionGrantActionType.SetProjectGrant:
      return {
        ...state,
        projectGrant: action.payload,
      };

    case PermissionGrantActionType.ResetProjectGrant:
      return {
        ...state,
        projectGrant: createEmptyGrantCollections(),
      };

    case PermissionGrantActionType.SetSelectedRoles:
      return {
        ...state,
        selectedRoles: action.payload,
      };

    case PermissionGrantActionType.AddRole:
      return {
        ...state,
        selectedRoles: addRole(state.selectedRoles, action.payload),
      };

    case PermissionGrantActionType.RemoveRole:
      return {
        ...state,
        selectedRoles: removeRoleById(state.selectedRoles, action.payload),
      };

    case PermissionGrantActionType.AddGrantEntity: {
      const { target, key, value } = action.payload;
      return applyGrantUpdate(state, target, key, (collection) => addEntityToCollection(collection, value));
    }

    case PermissionGrantActionType.RemoveGrantEntity: {
      const { target, key, id } = action.payload;
      return applyGrantUpdate(state, target, key, (collection) => removeEntityFromCollection(collection, id));
    }

    default:
      return state;
  }
};

export const createPermissionGrantReducerState = (): PermissionGrantState =>
  createInitialPermissionGrantState();







