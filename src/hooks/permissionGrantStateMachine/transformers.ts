import type { UserOption } from '../../components/UserAutocomplete';
import type { Group } from '../../components/permissions/grants/permissionGrantTypes';
import { createEmptyGrantCollections, GrantCollections } from './types';

const mapUsers = (users: any[]): UserOption[] =>
  Array.from(users || []).map((user: any) => ({
    id: user.id,
    username: user.username || '',
    fullName: user.fullName || user.username || 'Utente',
  }));

const mapGroups = (groups: any[]): Group[] =>
  Array.from(groups || []).map((group: any) => ({
    id: group.id,
    name: group.name,
  }));

export const mapGrantDetails = (details: any | null | undefined): GrantCollections => {
  if (!details) {
    return createEmptyGrantCollections();
  }

  return {
    users: mapUsers(details.users),
    groups: mapGroups(details.groups),
    negatedUsers: mapUsers(details.negatedUsers),
    negatedGroups: mapGroups(details.negatedGroups),
  };
};

















