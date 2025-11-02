export interface StatusRemovalImpactDto {
  workflowId: number;
  workflowName: string;
  removedStatusIds: number[];
  removedStatusNames: string[];
  affectedItemTypeSets: ItemTypeSetImpact[];
  statusOwnerPermissions: PermissionImpact[];
  totalAffectedItemTypeSets: number;
  totalStatusOwnerPermissions: number;
  totalGrantAssignments: number;
  totalRoleAssignments: number;
}

export interface ItemTypeSetImpact {
  itemTypeSetId: number;
  itemTypeSetName: string;
  projectId: number | null;
  projectName: string | null;
  totalPermissions?: number;
  totalRoleAssignments?: number;
  totalGlobalGrants?: number;
  totalProjectGrants?: number;
  projectImpacts?: ProjectImpact[];
}

export interface ProjectImpact {
  projectId: number;
  projectName: string;
  projectGrantsCount: number;
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
  roleId?: number;
  roleName?: string;
  grantId?: number;
  grantName?: string;
  assignedRoles: string[];
  hasAssignments: boolean;
  
  // Info per preservazione
  statusId?: number;
  matchingStatusId?: number;
  matchingStatusName?: string;
  canBePreserved?: boolean;
  defaultPreserve?: boolean;
  
  // Grant di progetto
  projectGrants?: ProjectGrantInfo[];
}

export interface ProjectGrantInfo {
  projectId: number;
  projectName: string;
  roleId: number;
}



