import type { Role, Group } from '../../components/permissions/grants/permissionGrantTypes';
import type { UserOption } from '../../components/UserAutocomplete';
import type { GrantCollectionKey, GrantCollections, TargetGrantCollection } from './types';

export enum PermissionGrantActionType {
  SetLoading = 'permissionGrant/SET_LOADING',
  SetError = 'permissionGrant/SET_ERROR',
  ResetState = 'permissionGrant/RESET_STATE',
  SetAvailableRoles = 'permissionGrant/SET_AVAILABLE_ROLES',
  SetAvailableGroups = 'permissionGrant/SET_AVAILABLE_GROUPS',
  SetGrant = 'permissionGrant/SET_GRANT',
  ResetGrant = 'permissionGrant/RESET_GRANT',
  SetProjectGrant = 'permissionGrant/SET_PROJECT_GRANT',
  ResetProjectGrant = 'permissionGrant/RESET_PROJECT_GRANT',
  SetSelectedRoles = 'permissionGrant/SET_SELECTED_ROLES',
  AddRole = 'permissionGrant/ADD_ROLE',
  RemoveRole = 'permissionGrant/REMOVE_ROLE',
  AddGrantEntity = 'permissionGrant/ADD_GRANT_ENTITY',
  RemoveGrantEntity = 'permissionGrant/REMOVE_GRANT_ENTITY',
}

export type PermissionGrantAction =
  | { type: PermissionGrantActionType.SetLoading; payload: boolean }
  | { type: PermissionGrantActionType.SetError; payload: string | null }
  | { type: PermissionGrantActionType.ResetState }
  | { type: PermissionGrantActionType.SetAvailableRoles; payload: Role[] }
  | { type: PermissionGrantActionType.SetAvailableGroups; payload: Group[] }
  | { type: PermissionGrantActionType.SetGrant; payload: GrantCollections }
  | { type: PermissionGrantActionType.ResetGrant }
  | { type: PermissionGrantActionType.SetProjectGrant; payload: GrantCollections }
  | { type: PermissionGrantActionType.ResetProjectGrant }
  | { type: PermissionGrantActionType.SetSelectedRoles; payload: Role[] }
  | { type: PermissionGrantActionType.AddRole; payload: Role }
  | { type: PermissionGrantActionType.RemoveRole; payload: number }
  | {
      type: PermissionGrantActionType.AddGrantEntity;
      payload: {
        target: TargetGrantCollection;
        key: GrantCollectionKey;
        value: UserOption | Group;
      };
    }
  | {
      type: PermissionGrantActionType.RemoveGrantEntity;
      payload: {
        target: TargetGrantCollection;
        key: GrantCollectionKey;
        id: number;
      };
    };

