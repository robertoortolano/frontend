import { useMemo } from "react";
import { FilterValues } from "../components/PermissionFilters";

export interface UsePermissionFilteringParams {
  roles: Record<string, any[]>;
  filters: FilterValues;
  showOnlyWithAssignments: boolean;
  showOnlyProjectGrants: boolean;
  includeProjectAssignments: boolean;
}

export interface UsePermissionFilteringResult {
  groupedRoles: Record<string, any[]>;
  filteredRoles: Record<string, any[]>;
  allPermissions: any[];
  totalCount: number;
  filteredCount: number;
}

export const usePermissionFiltering = ({
  roles,
  filters,
  showOnlyWithAssignments,
  showOnlyProjectGrants,
  includeProjectAssignments,
}: UsePermissionFilteringParams): UsePermissionFilteringResult =>
  useMemo(() => {
    const groupedRoles = roles || {};
    const itemTypesFilter = filters.itemTypes || ["All"];

    const filterPermissions = (permission: any): boolean => {
      if (filters.permission !== "All" && permission.name !== filters.permission) {
        return false;
      }

      if (!itemTypesFilter.includes("All")) {
        if (
          !permission.itemType ||
          !itemTypesFilter.includes(permission.itemType.id.toString())
        ) {
          return false;
        }
      }

      if (filters.status === "None") {
        if (permission.workflowStatus) {
          return false;
        }
      } else if (filters.status !== "All") {
        if (!permission.workflowStatus) {
          return false;
        }
        const statusId = permission.workflowStatus.id.toString();
        const statusName = permission.workflowStatus.name;
        if (statusId !== filters.status && statusName !== filters.status) {
          return false;
        }
      }

      if (filters.field === "None") {
        if (permission.fieldConfiguration) {
          return false;
        }
      } else if (filters.field !== "All") {
        if (
          !permission.fieldConfiguration ||
          permission.fieldConfiguration.id.toString() !== filters.field
        ) {
          return false;
        }
      }

      if (filters.workflow === "None") {
        if (permission.workflow) {
          return false;
        }
      } else if (filters.workflow !== "All") {
        if (!permission.workflow || permission.workflow.id.toString() !== filters.workflow) {
          return false;
        }
      }

      if (showOnlyWithAssignments || filters.grant !== "All") {
        if (showOnlyProjectGrants && filters.grant !== "All") {
          const hasProjectAssignments =
            permission.hasProjectGrant ||
            permission.hasProjectRoles ||
            (permission.projectAssignedRoles && permission.projectAssignedRoles.length > 0);

          if (filters.grant === "Y" && !hasProjectAssignments) {
            return false;
          }
          if (filters.grant === "N" && hasProjectAssignments) {
            return false;
          }
        } else {
          const hasGlobalRoles =
            permission.hasAssignments === true ||
            (permission.assignedRoles && permission.assignedRoles.length > 0);
          const hasProjectRoles =
            permission.hasProjectRoles === true ||
            (permission.projectAssignedRoles && permission.projectAssignedRoles.length > 0);
          const hasRoles = hasGlobalRoles || (includeProjectAssignments && hasProjectRoles);
          const hasGrant =
            permission.grantId != null ||
            permission.assignmentType === "GRANT" ||
            permission.hasProjectGrant;
          const hasAssignments =
            hasRoles ||
            (includeProjectAssignments && hasGrant) ||
            (!includeProjectAssignments &&
              (permission.grantId != null || permission.assignmentType === "GRANT"));

          if (showOnlyWithAssignments && !hasAssignments) {
            return false;
          }

          if (filters.grant !== "All") {
            if (filters.grant === "Y" && !hasAssignments) {
              return false;
            }
            if (filters.grant === "N" && hasAssignments) {
              return false;
            }
          }
        }
      }

      return true;
    };

    const filteredRoles = Object.entries(groupedRoles).reduce<Record<string, any[]>>(
      (accumulator, [roleType, roleList]) => {
        const filteredList = Array.isArray(roleList)
          ? roleList.filter(filterPermissions)
          : [];
        if (filteredList.length > 0) {
          accumulator[roleType] = filteredList;
        }
        return accumulator;
      },
      {}
    );

    const allPermissions = Object.values(groupedRoles).reduce<any[]>(
      (accumulator, permissionList: any) => {
        if (Array.isArray(permissionList)) {
          accumulator.push(...permissionList);
        }
        return accumulator;
      },
      []
    );

    const filteredCount = Object.values(filteredRoles).reduce(
      (sum, list: any) => sum + list.length,
      0
    );

    return {
      groupedRoles,
      filteredRoles,
      allPermissions,
      totalCount: allPermissions.length,
      filteredCount,
    };
  }, [
    filters,
    includeProjectAssignments,
    roles,
    showOnlyProjectGrants,
    showOnlyWithAssignments,
  ]);















