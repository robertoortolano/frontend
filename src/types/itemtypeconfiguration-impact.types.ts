export interface ItemTypeConfigurationRemovalImpactDto {
  itemTypeSetId: number;
  itemTypeSetName: string;
  removedItemTypeConfigurationIds: number[];
  removedItemTypeConfigurationNames: string[];
  affectedItemTypeSets: ItemTypeSetImpact[];
  fieldOwnerPermissions: PermissionImpact[];
  statusOwnerPermissions: PermissionImpact[];
  fieldStatusPermissions: PermissionImpact[];
  executorPermissions: PermissionImpact[];
  itemTypeSetRoles: PermissionImpact[];
  totalAffectedItemTypeSets: number;
  totalFieldOwnerPermissions: number;
  totalStatusOwnerPermissions: number;
  totalFieldStatusPermissions: number;
  totalExecutorPermissions: number;
  totalItemTypeSetRoles: number;
  totalGrantAssignments: number;
  totalRoleAssignments: number;
}

export interface ItemTypeSetImpact {
  itemTypeSetId: number;
  itemTypeSetName: string;
  projectId: number | null;
  projectName: string | null;
}

export interface PermissionImpact {
  permissionId: number | null;
  permissionType: string; // "FIELD_OWNERS", "STATUS_OWNERS", "EDITORS", "VIEWERS", "EXECUTORS", "WORKERS", "CREATORS"
  itemTypeSetId: number;
  itemTypeSetName: string;
  projectId: number | null;
  projectName: string | null;
  itemTypeConfigurationId: number | null;
  itemTypeName: string | null;
  itemTypeCategory: string | null;
  fieldConfigurationId: number | null;
  fieldConfigurationName: string | null;
  workflowStatusId: number | null;
  workflowStatusName: string | null;
  transitionId: number | null;
  transitionName: string | null;
  fromStatusName: string | null;
  toStatusName: string | null;
  roleId: number | null;
  roleName: string | null;
  grantId: number | null;
  grantName: string | null;
  assignedRoles: string[];
  assignedGrants: string[];
  hasAssignments: boolean;
}

