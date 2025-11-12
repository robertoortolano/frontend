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
  workerPermissions: PermissionImpact[];
  creatorPermissions: PermissionImpact[];
  totalAffectedItemTypeSets: number;
  totalFieldOwnerPermissions: number;
  totalStatusOwnerPermissions: number;
  totalFieldStatusPermissions: number;
  totalExecutorPermissions: number;
  totalWorkerPermissions: number;
  totalCreatorPermissions: number;
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
  projectAssignedRoles?: ProjectRoleInfo[];
  hasAssignments: boolean;
  
  // Info per preservazione
  fieldId?: number;
  fieldName?: string;
  statusId?: number;
  statusName?: string;
  matchingFieldId?: number;
  matchingFieldName?: string;
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
  assignedRoles?: string[]; // Ruoli assegnati a questa permission per questo progetto
  grantId?: number | null; // Grant assegnato a questa permission per questo progetto (se presente)
  grantName?: string | null; // Nome del grant (se presente)
}

export interface ProjectRoleInfo {
  projectId: number;
  projectName: string;
  roles: string[];
}


