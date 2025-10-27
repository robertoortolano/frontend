export interface StatusRemovalImpactDto {
  workflowId: number;
  workflowName: string;
  removedStatusIds: number[];
  removedStatusNames: string[];
  affectedItemTypeSets: ItemTypeSetImpact[];
  statusOwnerPermissions: PermissionImpact[];
  totalAffectedItemTypeSets: number;
  totalStatusOwnerPermissions: number;
  totalRoleAssignments: number;
}

export interface ItemTypeSetImpact {
  itemTypeSetId: number;
  itemTypeSetName: string;
  projectId: number | null;
  projectName: string | null;
}

export interface PermissionImpact {
  permissionId: number;
  permissionType: string; // "STATUS_OWNERS"
  itemTypeSetId: number;
  itemTypeSetName: string;
  projectId: number | null;
  projectName: string | null;
  workflowStatusId: number;
  workflowStatusName: string;
  statusName: string;
  statusCategory: string;
  assignedRoles: string[];
  hasAssignments: boolean;
}

