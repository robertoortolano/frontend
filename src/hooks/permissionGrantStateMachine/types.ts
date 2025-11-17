import type { UserOption } from '../../components/UserAutocomplete';
import type { Group, Role } from '../../components/permissions/grants/permissionGrantTypes';

export interface GrantCollections {
  users: UserOption[];
  groups: Group[];
  negatedUsers: UserOption[];
  negatedGroups: Group[];
}

export const createEmptyGrantCollections = (): GrantCollections => ({
  users: [],
  groups: [],
  negatedUsers: [],
  negatedGroups: [],
});

export interface PermissionGrantState {
  loading: boolean;
  error: string | null;
  selectedRoles: Role[];
  availableRoles: Role[];
  availableGroups: Group[];
  grant: GrantCollections;
  projectGrant: GrantCollections;
}

export type TargetGrantCollection = 'grant' | 'projectGrant';
export type GrantCollectionKey = keyof GrantCollections;

export interface PermissionGrantMetadata {
  hasGrantDirect: boolean;
  hasProjectGrantDirect: boolean;
  hasRoleTemplate: boolean;
}

export const createInitialPermissionGrantState = (): PermissionGrantState => ({
  loading: false,
  error: null,
  selectedRoles: [],
  availableRoles: [],
  availableGroups: [],
  grant: createEmptyGrantCollections(),
  projectGrant: createEmptyGrantCollections(),
});














