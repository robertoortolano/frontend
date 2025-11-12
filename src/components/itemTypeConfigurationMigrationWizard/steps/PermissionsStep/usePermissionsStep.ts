import { useCallback, useMemo } from 'react';
import {
  ItemTypeConfigurationMigrationImpactDto,
  ProjectGrantInfo,
  SelectablePermissionImpact,
} from '../../../../types/item-type-configuration-migration.types';

export interface PermissionGroup {
  key: string;
  title: string;
  permissions: SelectablePermissionImpact[];
}

export interface ConfigurationSection {
  impact: ItemTypeConfigurationMigrationImpactDto;
  heading: string;
  preservedSet: Set<number>;
  groups: PermissionGroup[];
}

interface UsePermissionsStepParams {
  impacts: ItemTypeConfigurationMigrationImpactDto[];
  preservedPermissionIdsMap: Map<number, Set<number>>;
}

interface ProjectEntry {
  projectId?: number | null;
  projectName?: string | null;
  roles: string[];
  grant?: ProjectGrantInfo;
}

export const usePermissionsStep = ({
  impacts,
  preservedPermissionIdsMap,
}: UsePermissionsStepParams) => {
  const configurationSections = useMemo<ConfigurationSection[]>(() => {
    return impacts.map((impact, index) => {
      const preservedSet =
        preservedPermissionIdsMap.get(impact.itemTypeConfigurationId) ??
        new Set<number>();

      const groups: PermissionGroup[] = [
        {
          key: 'fieldOwnerPermissions',
          title: 'Permission Field Owner',
          permissions: (impact.fieldOwnerPermissions ?? []).filter(
            (permission) => permission.hasAssignments
          ),
        },
        {
          key: 'statusOwnerPermissions',
          title: 'Permission Status Owner',
          permissions: (impact.statusOwnerPermissions ?? []).filter(
            (permission) => permission.hasAssignments
          ),
        },
        {
          key: 'fieldStatusPermissions',
          title: 'Permission Field Status',
          permissions: (impact.fieldStatusPermissions ?? []).filter(
            (permission) => permission.hasAssignments
          ),
        },
        {
          key: 'executorPermissions',
          title: 'Permission Executor',
          permissions: (impact.executorPermissions ?? []).filter(
            (permission) => permission.hasAssignments
          ),
        },
      ].filter((group) => group.permissions.length > 0);

      return {
        impact,
        heading: `Configurazione ${index + 1}: ${impact.itemTypeName}`,
        preservedSet,
        groups,
      };
    });
  }, [impacts, preservedPermissionIdsMap]);

  const getProjectEntries = useCallback((permission: SelectablePermissionImpact) => {
    const projectEntriesMap = new Map<string, ProjectEntry>();

    if (Array.isArray((permission as any).projectAssignedRoles)) {
      ((permission as any).projectAssignedRoles as Array<{
        projectId?: number | null;
        projectName?: string | null;
        roles?: string[];
      }>).forEach((projectRole) => {
        const key = `${projectRole.projectId ?? 'null'}::${
          projectRole.projectName ?? 'N/A'
        }`;

        const existing =
          projectEntriesMap.get(key) ??
          ({
            projectId: projectRole.projectId,
            projectName: projectRole.projectName,
            roles: [],
          } as ProjectEntry);

        if (Array.isArray(projectRole.roles)) {
          existing.roles = [
            ...existing.roles,
            ...projectRole.roles.filter(Boolean),
          ];
        }

        projectEntriesMap.set(key, existing);
      });
    }

    if (permission.projectGrants) {
      permission.projectGrants.forEach((grant) => {
        const key = `${grant.projectId ?? 'null'}::${grant.projectName ?? 'N/A'}`;
        const existing =
          projectEntriesMap.get(key) ??
          ({
            projectId: grant.projectId,
            projectName: grant.projectName,
            roles: [],
          } as ProjectEntry);
        existing.grant = grant;
        projectEntriesMap.set(key, existing);
      });
    }

    return Array.from(projectEntriesMap.values());
  }, []);

  return { configurationSections, getProjectEntries };
};



