interface AssignmentDisplayProjectRoleInfo {
  projectId?: number | null;
  projectName?: string | null;
  roles?: string[];
}

interface AssignmentDisplayProjectGrantInfo {
  projectId?: number | null;
  projectName?: string | null;
}

export interface AssignmentDisplayData {
  assignedRoles?: string[] | null;
  assignedGrants?: string[] | null;
  projectAssignedRoles?: AssignmentDisplayProjectRoleInfo[] | null;
  projectGrants?: AssignmentDisplayProjectGrantInfo[] | null;
}

const formatList = (items: string[] | null | undefined): string => {
  if (!items || items.length === 0) {
    return '';
  }

  return items.filter(Boolean).join(', ');
};

const fallbackLabel = '—';

export const buildGlobalAssignmentsLabel = (data: AssignmentDisplayData): string => {
  const roleList = formatList(data.assignedRoles);
  const grantList = formatList(data.assignedGrants);

  const parts: string[] = [];

  if (roleList) {
    parts.push('Ruoli');
  }

  if (grantList) {
    parts.push('Grant');
  }

  return parts.length > 0 ? parts.join(' • ') : fallbackLabel;
};

export const buildProjectAssignmentsLabel = (data: AssignmentDisplayData): string => {
  const projectEntries = new Map<string, { roles: string[]; hasGrant: boolean }>();

  const addProjectEntry = (projectId: number | null | undefined, projectName: string | null | undefined) => {
    const key = `${projectId ?? 'null'}::${projectName ?? 'N/A'}`;
    if (!projectEntries.has(key)) {
      projectEntries.set(key, { roles: [], hasGrant: false });
    }
    return key;
  };

  if (data.projectAssignedRoles) {
    data.projectAssignedRoles.forEach((projectRoleInfo) => {
      const key = addProjectEntry(projectRoleInfo.projectId, projectRoleInfo.projectName);
      const entry = projectEntries.get(key);
      if (entry) {
        entry.roles = [
          ...entry.roles,
          ...(projectRoleInfo.roles ?? []).filter(Boolean),
        ];
      }
    });
  }

  if (data.projectGrants) {
    data.projectGrants.forEach((projectGrantInfo) => {
      const key = addProjectEntry(projectGrantInfo.projectId, projectGrantInfo.projectName);
      const entry = projectEntries.get(key);
      if (entry) {
        entry.hasGrant = true;
      }
    });
  }

  if (projectEntries.size === 0) {
    return fallbackLabel;
  }

  const formattedEntries: string[] = [];

  projectEntries.forEach((value, key) => {
    const [, projectNamePart] = key.split('::');
    const displayName = projectNamePart === 'N/A' ? 'Progetto N/A' : projectNamePart;

    if (value.roles.length > 0) {
      formattedEntries.push(`${displayName}: Ruoli`);
    }

    if (value.hasGrant) {
      formattedEntries.push(`${displayName}: Grant`);
    }
  });

  return formattedEntries.join(' • ');
};


