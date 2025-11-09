export interface TransitionRemovalImpactDto {
  workflowId: number;
  workflowName: string;
  removedTransitionIds: number[];
  removedTransitionNames: string[];

  affectedItemTypeSets: ItemTypeSetImpact[];

  executorPermissions: PermissionImpact[];
  fieldStatusPermissions: FieldStatusPermissionImpact[];

  totalAffectedItemTypeSets: number;
  totalExecutorPermissions: number;
  totalFieldStatusPermissions: number;
  totalGrantAssignments: number;
  totalRoleAssignments: number;
}

export interface ItemTypeSetImpact {
  itemTypeSetId: number;
  itemTypeSetName: string;
  projectId?: number | null;
  projectName?: string | null;
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
  permissionType: string;
  itemTypeSetId: number;
  itemTypeSetName: string;
  projectId?: number | null;
  projectName?: string | null;
  transitionId: number;
  transitionName?: string | null;
  fromStatusName?: string | null;
  toStatusName?: string | null;
  grantId?: number | null;
  grantName?: string | null;
  assignedRoles: string[];
  assignedGrants?: string[];
  projectAssignedRoles?: ProjectRoleInfo[];
  hasAssignments: boolean;
  transitionIdMatch?: number | null;
  transitionNameMatch?: string | null;
  canBePreserved?: boolean;
  defaultPreserve?: boolean;
  projectGrants?: ProjectGrantInfo[];
}

export interface FieldStatusPermissionImpact {
  permissionId: number;
  permissionType: string;
  itemTypeSetId: number;
  itemTypeSetName: string;
  projectId?: number | null;
  projectName?: string | null;
  fieldId?: number | null;
  fieldName?: string | null;
  workflowStatusId?: number | null;
  workflowStatusName?: string | null;
  statusId?: number | null;
  statusName?: string | null;
  grantId?: number | null;
  grantName?: string | null;
  assignedRoles?: string[];
  projectAssignedRoles?: ProjectRoleInfo[];
  hasAssignments: boolean;
  projectGrants?: ProjectGrantInfo[];
}

export interface ProjectGrantInfo {
  projectId: number;
  projectName: string;
  roleId: number;
}

export interface ProjectRoleInfo {
  projectId: number;
  projectName: string;
  roles: string[];
}
export interface TransitionRemovalImpactDto {
  workflowId: number;
  workflowName: string;
  removedTransitionIds: number[];
  removedTransitionNames: string[];
  
  // ItemTypeSet coinvolti
  affectedItemTypeSets: ItemTypeSetImpact[];
  
  // Permissions che verranno rimosse
  executorPermissions: PermissionImpact[];
  
  // Statistiche
  totalAffectedItemTypeSets: number;
  totalExecutorPermissions: number;
  totalGrantAssignments: number;
  totalRoleAssignments: number;
}

export interface ItemTypeSetImpact {
  itemTypeSetId: number;
  itemTypeSetName: string;
  projectId?: number;
  projectName?: string;
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
  permissionType: string; // "EXECUTORS"
  itemTypeSetId: number;
  itemTypeSetName: string;
  projectId?: number;
  projectName?: string;
  transitionId: number;
  transitionName: string;
  fromStatusName: string;
  toStatusName: string;
  roleId?: number;
  roleName?: string;
  grantId?: number;
  grantName?: string;
  assignedRoles: string[];
  assignedGrants?: string[];
  projectAssignedRoles?: ProjectRoleInfo[];
  hasAssignments: boolean;
  
  // Info per preservazione
  transitionIdMatch?: number;
  transitionNameMatch?: string;
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

export interface ProjectRoleInfo {
  projectId: number;
  projectName: string;
  roles: string[];
}



