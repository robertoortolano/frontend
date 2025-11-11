import { useCallback, useEffect, useRef, useState } from "react";
import api from "../api/api";

export interface UseItemTypeSetPermissionsArgs {
  itemTypeSetId: number;
  refreshTrigger?: number;
  projectId?: string;
  showOnlyProjectGrants: boolean;
  includeProjectAssignments: boolean;
}

export interface UseItemTypeSetPermissionsResult {
  roles: Record<string, any[]>;
  loading: boolean;
  error: string | null;
  grantDetailsMap: Map<string, any>;
}

const buildPermissionList = (rolesData: Record<string, any[]>): any[] => {
  return Object.values(rolesData).reduce<any[]>((accumulator, permissions) => {
    if (Array.isArray(permissions)) {
      accumulator.push(...permissions);
    }
    return accumulator;
  }, []);
};

export const useItemTypeSetPermissions = ({
  itemTypeSetId,
  refreshTrigger,
  projectId,
  showOnlyProjectGrants,
  includeProjectAssignments,
}: UseItemTypeSetPermissionsArgs): UseItemTypeSetPermissionsResult => {
  const [roles, setRoles] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [grantDetailsMap, setGrantDetailsMap] = useState<Map<string, any>>(
    new Map()
  );
  const loadedProjectGrantDetailsRef = useRef<Set<string>>(new Set());

  const buildGrantDetailsMap = useCallback(
    async (permissions: any[]) => {
      const detailsMap = new Map<string, any>();

      const fetchPromises = permissions
        .filter((permission: any) => {
          const permissionId = permission?.id;
          const permissionType = permission?.permissionType;

          if (!permissionId || typeof permissionId !== "number" || !permissionType) {
            return false;
          }
          if (showOnlyProjectGrants) {
            return true;
          }
          return (
            permission.grantId != null ||
            (includeProjectAssignments && permission.hasProjectGrant === true)
          );
        })
        .map(async (permission: any) => {
          const permissionId = permission?.id;
          const permissionType = permission?.permissionType;

          if (!permissionId || typeof permissionId !== "number" || !permissionType) {
            console.warn("Permission senza id o permissionType:", permission);
            return;
          }

          const mapKey = `${permissionType}-${permissionId}`;
          const grantDetails: any = {};

          if (permission.grantId && !showOnlyProjectGrants) {
            try {
              const grantResponse = await api.get(
                `/permission-assignments/${permissionType}/${permissionId}`
              );
              const assignment = grantResponse.data;
              if (assignment?.grant) {
                grantDetails.users = Array.from(assignment.grant.users || []);
                grantDetails.groups = Array.from(assignment.grant.groups || []);
                grantDetails.negatedUsers = Array.from(
                  assignment.grant.negatedUsers || []
                );
                grantDetails.negatedGroups = Array.from(
                  assignment.grant.negatedGroups || []
                );
              }
            } catch (err) {
              console.error(
                `Error fetching grant details for permission ${permissionType}/${permissionId}:`,
                err
              );
            }
          }

          if (includeProjectAssignments && showOnlyProjectGrants && projectId) {
            try {
              const projectGrantResponse = await api.get(
                `/project-permission-assignments/${permissionType}/${permissionId}/project/${projectId}`
              );
              const assignment = projectGrantResponse.data;
              if (!assignment || !assignment.grant) {
                grantDetails.isProjectGrant = false;
              } else {
                Object.keys(grantDetails).forEach((key) => delete grantDetails[key]);
                grantDetails.users = Array.from(assignment.grant.users || []);
                grantDetails.groups = Array.from(assignment.grant.groups || []);
                grantDetails.negatedUsers = Array.from(
                  assignment.grant.negatedUsers || []
                );
                grantDetails.negatedGroups = Array.from(
                  assignment.grant.negatedGroups || []
                );
                grantDetails.isProjectGrant = true;
              }
            } catch (err: any) {
              if (err.response?.status === 404) {
                grantDetails.isProjectGrant = false;
              } else {
                console.error(
                  `[buildGrantDetailsMap] Error fetching project grant details for permission ${permissionType}/${permissionId}:`,
                  err
                );
              }
            }
          }

          if (
            grantDetails.isProjectGrant !== undefined ||
            Object.keys(grantDetails).length > 0
          ) {
            detailsMap.set(mapKey, grantDetails);
          }
        });

      await Promise.all(fetchPromises);
      return detailsMap;
    },
    [includeProjectAssignments, projectId, showOnlyProjectGrants]
  );

  const fetchRoles = useCallback(async () => {
    if (!itemTypeSetId) {
      setRoles({});
      setGrantDetailsMap(new Map());
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const loadPermissions = async () => {
      const url = projectId
        ? `/itemtypeset-permissions/itemtypeset/${itemTypeSetId}?projectId=${projectId}`
        : `/itemtypeset-permissions/itemtypeset/${itemTypeSetId}`;

      await new Promise((resolve) => setTimeout(resolve, 200));

      const response = await api.get(url);
      const rolesData: Record<string, any[]> = response.data || {};

      Object.values(rolesData).forEach((permissionList: any) => {
        if (Array.isArray(permissionList)) {
          permissionList.forEach((permission: any) => {
            if (includeProjectAssignments) {
              const hasProjectGrant =
                Boolean(permission.projectGrantId) ||
                (Array.isArray(permission.projectGrants) &&
                  permission.projectGrants.length > 0);
              permission.hasProjectGrant = hasProjectGrant;
            } else {
              permission.hasProjectGrant = false;
            }
          });
        }
      });

      setRoles(rolesData);

      const allPermissions = buildPermissionList(rolesData);
      const detailsMap = await buildGrantDetailsMap(allPermissions);
      setGrantDetailsMap(detailsMap);

      if (showOnlyProjectGrants) {
        loadedProjectGrantDetailsRef.current.clear();
      }
    };

    try {
      await loadPermissions();
    } catch (err: any) {
      if (err.response?.status === 500) {
        try {
          await api.post(
            `/itemtypeset-permissions/create-for-itemtypeset/${itemTypeSetId}`
          );
          await loadPermissions();
        } catch (createErr) {
          setError("Errore nella creazione delle permissions");
          console.error("Error creating permissions:", createErr);
        }
      } else {
        setError("Errore nel caricamento delle permissions");
        console.error("Error fetching permissions:", err);
      }
    } finally {
      setLoading(false);
    }
  }, [
    buildGrantDetailsMap,
    includeProjectAssignments,
    itemTypeSetId,
    projectId,
    showOnlyProjectGrants,
  ]);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles, refreshTrigger]);

  useEffect(() => {
    if (!includeProjectAssignments || !showOnlyProjectGrants || !projectId) {
      return;
    }

    const allPermissions = buildPermissionList(roles);

    const missingKeys = allPermissions.reduce<string[]>((accumulator, permission: any) => {
      const permissionId = permission?.id;
      const permissionType = permission?.permissionType;
      if (!permissionId || typeof permissionId !== "number" || !permissionType) {
        return accumulator;
      }
      const mapKey = `${permissionType}-${permissionId}`;
      if (
        grantDetailsMap.has(mapKey) ||
        loadedProjectGrantDetailsRef.current.has(mapKey)
      ) {
        return accumulator;
      }
      accumulator.push(mapKey);
      return accumulator;
    }, []);

    if (missingKeys.length === 0) {
      return;
    }

    let cancelled = false;

    const loadMissingDetails = async () => {
      for (const mapKey of missingKeys) {
        if (cancelled) {
          break;
        }

        const [permissionType, permissionIdStr] = mapKey.split("-");
        const permissionId = Number(permissionIdStr);
        if (!permissionType || Number.isNaN(permissionId)) {
          continue;
        }

        loadedProjectGrantDetailsRef.current.add(mapKey);

        try {
          const response = await api.get(
            `/project-permission-assignments/${permissionType}/${permissionId}/project/${projectId}`
          );
          if (cancelled) {
            return;
          }

          const assignment = response.data;
          const projectGrant = assignment?.grant;

          setGrantDetailsMap((previous) => {
            const next = new Map(previous);
            if (!projectGrant) {
              next.set(mapKey, { isProjectGrant: false });
            } else {
              next.set(mapKey, {
                isProjectGrant: true,
                users: Array.from(projectGrant.users || []),
                groups: Array.from(projectGrant.groups || []),
                negatedUsers: Array.from(projectGrant.negatedUsers || []),
                negatedGroups: Array.from(projectGrant.negatedGroups || []),
              });
            }
            return next;
          });
        } catch (err: any) {
          if (err.response?.status === 404) {
            if (!cancelled) {
              setGrantDetailsMap((previous) => {
                const next = new Map(previous);
                next.set(mapKey, { isProjectGrant: false });
                return next;
              });
            }
          } else {
            console.error(
              `Error fetching project grant details for permission ${mapKey}:`,
              err
            );
            loadedProjectGrantDetailsRef.current.delete(mapKey);
          }
        }
      }
    };

    loadMissingDetails();

    return () => {
      cancelled = true;
    };
  }, [
    grantDetailsMap,
    includeProjectAssignments,
    projectId,
    roles,
    showOnlyProjectGrants,
  ]);

  return {
    roles,
    loading,
    error,
    grantDetailsMap,
  };
};


