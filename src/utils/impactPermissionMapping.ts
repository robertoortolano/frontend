import { ImpactPermissionRow, ProjectAssignmentInfo } from '../types/impact-permission.types';

const buildProjectAssignments = (
  perm: any,
  permissionType: string | null,
  permissionId: number | null
): ProjectAssignmentInfo[] => {
  const map = new Map<string, ProjectAssignmentInfo>();

  if (Array.isArray(perm.projectAssignedRoles)) {
    perm.projectAssignedRoles.forEach((projectRole: { projectId?: number | null; projectName?: string | null; roles?: string[] }) => {
      const key = `${projectRole.projectId ?? 'null'}::${projectRole.projectName ?? 'N/A'}`;
      const existing = map.get(key) ?? {
        projectId: projectRole.projectId,
        projectName: projectRole.projectName,
        roles: [],
        grant: null
      };
      if (Array.isArray(projectRole.roles)) {
        existing.roles = [
          ...existing.roles,
          ...projectRole.roles.filter(Boolean)
        ];
      }
      map.set(key, existing);
    });
  }

  if (Array.isArray(perm.projectGrants) && permissionType && permissionId != null) {
    perm.projectGrants.forEach((projectGrant: { projectId?: number | null; projectName?: string | null }) => {
      const key = `${projectGrant.projectId ?? 'null'}::${projectGrant.projectName ?? 'N/A'}`;
      const existing = map.get(key) ?? {
        projectId: projectGrant.projectId,
        projectName: projectGrant.projectName,
        roles: [],
        grant: null
      };
      existing.grant = {
        permissionType,
        permissionId,
        projectId: projectGrant.projectId,
        displayName: projectGrant.projectName ?? 'Progetto'
      };
      map.set(key, existing);
    });
  }

  return Array.from(map.values());
};

interface MapImpactPermissionsParams {
  permissions: any[];
  getLabel: (perm: any) => string;
  getMatchLabel?: (perm: any) => string | undefined;
  fallbackItemTypeSetName?: string | null;
}

export const mapImpactPermissions = ({
  permissions,
  getLabel,
  getMatchLabel,
  fallbackItemTypeSetName
}: MapImpactPermissionsParams): ImpactPermissionRow[] => {
  return permissions
    .filter((perm) => perm && perm.hasAssignments)
    .map((perm, index) => {
      const canPreserve = perm.canBePreserved ?? false;
      const permissionId: number | null = perm.permissionId ?? null;
      const permissionType: string | null = perm.permissionType ?? null;

      const globalGrantDisplayName =
        perm.grantName === 'Grant diretto'
          ? 'Grant globale'
          : (perm.grantName || (perm.grantId ? `Grant #${perm.grantId}` : undefined));

      return {
        id: permissionId,
        key: `${permissionType || 'perm'}-${permissionId ?? index}`,
        permissionType,
        label: getLabel(perm),
        itemTypeSetName: perm.itemTypeSetName || fallbackItemTypeSetName || null,
        matchLabel: getMatchLabel ? getMatchLabel(perm) : undefined,
        canPreserve,
        defaultPreserve: canPreserve,
        hasAssignments: perm.hasAssignments,
        global: {
          roles: perm.assignedRoles || [],
          grant: perm.grantId && permissionId != null && permissionType
            ? {
                permissionType,
                permissionId,
                displayName: globalGrantDisplayName || 'Grant globale'
              }
            : null
        },
        projects: buildProjectAssignments(perm, permissionType, permissionId),
        raw: perm
      } satisfies ImpactPermissionRow;
    })
    .sort((a, b) => {
      const itsCompare = (a.itemTypeSetName || '').localeCompare(b.itemTypeSetName || '');
      if (itsCompare !== 0) return itsCompare;
      return a.label.localeCompare(b.label);
    });
};










