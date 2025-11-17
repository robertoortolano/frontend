import { useMemo } from "react";

export interface GrantDetailsRequest {
  permissionId: number;
  permissionType: string;
  variant: "global" | "project";
  projectId?: number | string;
  projectName?: string;
}

interface RoleAssignmentsCellProps {
  role: any;
  projectId?: string;
  showOnlyProjectGrants: boolean;
  includeProjectAssignments: boolean;
  grantDetailsMap: Map<string, any>;
  getPermissionName: (role: any) => string;
  onShowRoles: (permissionName: string, roles: string[]) => void;
  onShowGrant: (request: GrantDetailsRequest) => Promise<void>;
}

const InlineActionLink = ({
  label,
  onClick,
  disabled = false,
}: {
  label: string;
  onClick?: () => void;
  disabled?: boolean;
}) => {
  if (disabled) {
    return (
      <span className="text-xs font-medium text-gray-400 italic">{label}</span>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className="text-xs font-medium text-blue-600 underline hover:opacity-70 cursor-pointer bg-transparent border-0 p-0"
    >
      {label}
    </button>
  );
};

const mapGrantDetails = (grantDetails: any | undefined) => {
  if (!grantDetails) {
    return {
      hasUsers: false,
      hasGroups: false,
      hasNegatedUsers: false,
      hasNegatedGroups: false,
      hasAny: false,
    };
  }

  const users = Array.isArray(grantDetails.users) ? grantDetails.users : [];
  const groups = Array.isArray(grantDetails.groups) ? grantDetails.groups : [];
  const negatedUsers = Array.isArray(grantDetails.negatedUsers)
    ? grantDetails.negatedUsers
    : [];
  const negatedGroups = Array.isArray(grantDetails.negatedGroups)
    ? grantDetails.negatedGroups
    : [];

  const hasUsers = users.length > 0;
  const hasGroups = groups.length > 0;
  const hasNegatedUsers = negatedUsers.length > 0;
  const hasNegatedGroups = negatedGroups.length > 0;

  return {
    hasUsers,
    hasGroups,
    hasNegatedUsers,
    hasNegatedGroups,
    hasAny: hasUsers || hasGroups || hasNegatedUsers || hasNegatedGroups,
  };
};

export const RoleAssignmentsCell = ({
  role,
  projectId,
  showOnlyProjectGrants,
  includeProjectAssignments,
  grantDetailsMap,
  getPermissionName,
  onShowRoles,
  onShowGrant,
}: RoleAssignmentsCellProps) => {
  const permissionId = role?.id;
  const permissionTypeRaw = role?.permissionType;

  if (!permissionId || typeof permissionId !== "number" || !permissionTypeRaw) {
    return (
      <span className="px-2 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-500">
        N/A
      </span>
    );
  }

  const mapKey = `${permissionTypeRaw}-${permissionId}`;
  const grantDetails = grantDetailsMap.get(mapKey);
  const grantInfo = useMemo(() => mapGrantDetails(grantDetails), [grantDetails]);

  if (showOnlyProjectGrants) {
    const projectRoles = Array.isArray(role?.projectAssignedRoles)
      ? role.projectAssignedRoles
      : [];
    const hasProjectRoles = projectRoles.length > 0;

    if (!hasProjectRoles && !grantInfo.hasAny) {
      return null;
    }

    const permissionName = getPermissionName(role);

    return (
      <div className="text-sm space-y-1">
        {hasProjectRoles && (
          <div>
            <InlineActionLink
              label="Ruoli"
              onClick={() =>
                onShowRoles(
                  permissionName,
                  projectRoles.map((assignedRole: any) => assignedRole.name || assignedRole)
                )
              }
            />
          </div>
        )}

        {grantInfo.hasAny && (
          <div>
          <InlineActionLink
            label="Grant"
            onClick={
              projectId
                ? () =>
                      onShowGrant({
                        permissionId,
                        permissionType: (() => {
                          const label = getPermissionName(role) || '';
                          if (permissionTypeRaw === 'FIELD_EDITORS' || permissionTypeRaw === 'FIELD_VIEWERS') {
                            return permissionTypeRaw;
                          }
                          if (label.startsWith('Editor')) return 'FIELD_EDITORS';
                          if (label.startsWith('Viewer')) return 'FIELD_VIEWERS';
                          return String(permissionTypeRaw || '').toUpperCase();
                        })(),
                        variant: "project",
                        projectId: Number(projectId),
                        projectName: "Progetto",
                      })
                  : undefined
            }
            disabled={!projectId}
          />
          </div>
        )}
      </div>
    );
  }

  const globalRoles = Array.isArray(role?.assignedRoles) ? role.assignedRoles : [];
  const hasGlobalRoles = globalRoles.length > 0;

  const projectRoles = Array.isArray(role?.projectAssignedRoles)
    ? role.projectAssignedRoles
    : [];
  const hasProjectRoles = includeProjectAssignments && projectRoles.length > 0;

  const hasGlobalGrant =
    role?.grantId != null || role?.assignmentType === "GRANT";

  const hasProjectGrant =
    includeProjectAssignments &&
    (role?.hasProjectGrant === true || role?.projectGrantId != null);

  let projectGrantEntries: any[] = [];
  if (includeProjectAssignments) {
    if (Array.isArray(role?.projectGrants) && role.projectGrants.length > 0) {
      projectGrantEntries = role.projectGrants;
    } else if (hasProjectGrant && projectId) {
      projectGrantEntries = [
        {
          projectId: Number(projectId),
          projectName: role?.projectGrantName || "Grant di progetto",
        },
      ];
    }
  }

  const hasAssignments =
    hasGlobalRoles || hasGlobalGrant || hasProjectRoles || hasProjectGrant;

  if (!hasAssignments) {
    return null;
  }

  const permissionName = getPermissionName(role);

  return (
    <div className="text-sm space-y-1">
      {hasGlobalRoles && (
        <div>
          <InlineActionLink
            label="Ruoli"
            onClick={() =>
              onShowRoles(
                permissionName,
                globalRoles.map((assignedRole: any) => assignedRole.name || assignedRole)
              )
            }
          />
        </div>
      )}

      {hasGlobalGrant && grantDetails && !grantDetails.isProjectGrant && (
        <div>
          <InlineActionLink
            label="Grant"
            onClick={() =>
              onShowGrant({
                permissionId,
                permissionType: (() => {
                  const label = getPermissionName(role) || '';
                  if (permissionTypeRaw === 'FIELD_EDITORS' || permissionTypeRaw === 'FIELD_VIEWERS') {
                    return permissionTypeRaw;
                  }
                  if (label.startsWith('Editor')) return 'FIELD_EDITORS';
                  if (label.startsWith('Viewer')) return 'FIELD_VIEWERS';
                  return String(permissionTypeRaw || '').toUpperCase();
                })(),
                variant: "global",
                projectName: "Globale",
              })
            }
          />
        </div>
      )}

      {hasGlobalGrant && !grantDetails && (
        <div className="text-xs text-gray-500 italic">
          Caricamento dettagli grant...
        </div>
      )}

      {hasProjectRoles && (
        <div>
          <InlineActionLink
            label="Ruoli"
            onClick={() =>
              onShowRoles(
                permissionName,
                projectRoles.map((assignedRole: any) => assignedRole.name || assignedRole)
              )
            }
          />
        </div>
      )}

      {projectGrantEntries.map((projectGrant: any, index: number) => {
        if (!projectGrant?.projectId) {
          return null;
        }

        return (
          <div key={`project-grant-${index}`}>
          <InlineActionLink
            label="Grant"
            onClick={() =>
              onShowGrant({
                permissionId,
                permissionType: (() => {
                  const label = getPermissionName(role) || '';
                  if (permissionTypeRaw === 'FIELD_EDITORS' || permissionTypeRaw === 'FIELD_VIEWERS') {
                    return permissionTypeRaw;
                  }
                  if (label.startsWith('Editor')) return 'FIELD_EDITORS';
                  if (label.startsWith('Viewer')) return 'FIELD_VIEWERS';
                  return String(permissionTypeRaw || '').toUpperCase();
                })(),
                variant: "project",
                projectId: Number(projectGrant.projectId),
                projectName: projectGrant.projectName || "Progetto",
              })
            }
          />
        </div>
      );
    })}
    </div>
  );
};

