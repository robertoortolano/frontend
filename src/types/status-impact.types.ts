export interface StatusRemovalImpactDto {
  workflowId: number;
  workflowName: string;
  removedStatusIds: number[];
  removedStatusNames: string[];
  removedTransitionIds?: number[];
  removedTransitionNames?: string[];
  affectedItemTypeSets: ItemTypeSetImpact[];
  statusOwnerPermissions: PermissionImpact[];
  executorPermissions?: ExecutorPermissionImpact[];
  fieldStatusPermissions?: FieldStatusPermissionImpact[];
  totalAffectedItemTypeSets: number;
  totalStatusOwnerPermissions: number;
  totalExecutorPermissions?: number;
  totalFieldStatusPermissions?: number;
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
  assignedRoles: string[]; // Ruoli globali
  assignedGrants?: string[];
  projectAssignedRoles?: ProjectRoleInfo[]; // Ruoli di progetto per ogni progetto
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
  assignedRoles?: string[]; // Ruoli assegnati a questa permission per questo progetto
  grantId?: number | null; // Grant assegnato a questa permission per questo progetto (se presente)
  grantName?: string | null; // Nome del grant (se presente)
}

export interface ProjectRoleInfo {
  projectId: number;
  projectName: string;
  roles: string[];
}

export interface ExecutorPermissionImpact {
  permissionId: number;
  permissionType: string; // "EXECUTORS"
  itemTypeSetId: number;
  itemTypeSetName: string;
  projectId: number | null;
  projectName: string | null;
  transitionId: number;
  transitionName: string;
  fromStatusName: string;
  toStatusName: string;
  roleId?: number;
  roleName?: string;
  grantId?: number;
  grantName?: string;
  assignedRoles: string[]; // Ruoli globali
  assignedGrants?: string[];
  projectAssignedRoles?: ProjectRoleInfo[]; // Ruoli di progetto per ogni progetto
  hasAssignments: boolean;
  
  // Info per preservazione
  transitionIdMatch?: number;
  transitionNameMatch?: string;
  matchingTransitionName?: string; // Nome della transition corrispondente nel nuovo stato
  canBePreserved?: boolean;
  defaultPreserve?: boolean;
  
  // Grant di progetto
  projectGrants?: ProjectGrantInfo[];
}

export interface FieldStatusPermissionImpact {
  permissionId: number;
  permissionType: string; // "EDITORS" o "VIEWERS"
  itemTypeSetId: number;
  itemTypeSetName: string;
  projectId: number | null;
  projectName: string | null;
  fieldId: number;
  fieldName: string;
  workflowStatusId: number;
  workflowStatusName: string;
  statusName: string;
  roleId?: number;
  roleName?: string;
  grantId?: number;
  grantName?: string;
  assignedRoles: string[]; // Ruoli globali
  assignedGrants?: string[];
  projectAssignedRoles?: ProjectRoleInfo[]; // Ruoli di progetto per ogni progetto
  hasAssignments: boolean;
  
  // Info per preservazione
  matchingStatusId?: number;
  matchingStatusName?: string;
  canBePreserved?: boolean;
  defaultPreserve?: boolean;
  
  // Grant di progetto
  projectGrants?: ProjectGrantInfo[];
}



