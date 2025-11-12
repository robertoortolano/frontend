import api from '../../api/api';
import groupService from '../../services/groupService';
import type { Role, Group } from '../../components/permissions/grants/permissionGrantTypes';
import { mapGrantDetails } from './transformers';
import { createEmptyGrantCollections, GrantCollections } from './types';

export const fetchAvailableRoles = async (): Promise<Role[]> => {
  try {
    const response = await api.get('/itemtypeset-permissions/roles');
    return response.data || [];
  } catch (error) {
    console.error('Error fetching roles:', error);
    return [];
  }
};

export const fetchAvailableGroups = async (): Promise<Group[]> => {
  try {
    const groups = await groupService.getAll();
    return groups.map((group: any) => ({ id: group.id, name: group.name }));
  } catch (error) {
    console.error('Error fetching groups:', error);
    return [];
  }
};

export const fetchGrantDetails = async (
  permissionType: string,
  permissionId: number,
): Promise<GrantCollections> => {
  try {
    const response = await api.get(`/permission-assignments/${permissionType}/${permissionId}`);
    const assignment = response.data;
    return mapGrantDetails(assignment?.grant);
  } catch (error) {
    console.error('Error fetching grant details:', error);
    return createEmptyGrantCollections();
  }
};

export const fetchProjectGrantDetails = async (
  permissionType: string,
  permissionId: number,
  projectId: number,
): Promise<GrantCollections> => {
  try {
    const response = await api.get(
      `/project-permission-assignments/${permissionType}/${permissionId}/project/${projectId}`,
    );
    const assignment = response.data;
    return mapGrantDetails(assignment?.grant);
  } catch (error: any) {
    if (error?.response?.status !== 404) {
      console.error('Error fetching project grant details:', error);
    }
    return createEmptyGrantCollections();
  }
};

export const fetchProjectRoles = async (
  permissionType: string,
  permissionId: number,
  projectId: number,
): Promise<Role[]> => {
  try {
    const response = await api.get(
      `/project-permission-assignments/${permissionType}/${permissionId}/project/${projectId}`,
    );
    const roles = response.data?.roles || [];
    return Array.from(roles).map((role: any) => ({
      id: role.id,
      name: role.name,
      description: role.description,
    }));
  } catch (error: any) {
    if (error?.response?.status !== 404) {
      console.error('Error fetching project roles:', error);
    }
    return [];
  }
};




