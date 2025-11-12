export interface TransitionRemovalImpactDto {
  workflowId: number;
  workflowName: string;
  removedTransitionIds: number[];
  removedTransitionNames: string[];
  affectedItemTypeSets: ItemTypeSetImpact[];
  executorPermissions: PermissionImpact[];
  statusOwnerPermissions: StatusOwnerPermissionImpact[];
  fieldStatusPermissions: FieldStatusPermissionImpact[];
  totalAffectedItemTypeSets: number;
  totalExecutorPermissions: number;
  totalStatusOwnerPermissions: number;
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

export interface PermissionImpact {
  permissionId: number | null;
  permissionType: string;
  itemTypeSetId: number | null;
  itemTypeSetName: string;
  projectId?: number | null;
  projectName?: string | null;
  transitionId: number | null;
  transitionName?: string | null;
  fromStatusName?: string | null;
  toStatusName?: string | null;
  grantId?: number | null;
  grantName?: string | null;
  assignedRoles?: string[];
  assignedGrants?: string[];
  projectAssignedRoles?: ProjectRoleInfo[];
  hasAssignments: boolean;
  transitionIdMatch?: number | null;
  transitionNameMatch?: string | null;
  canBePreserved?: boolean;
  defaultPreserve?: boolean;
  projectGrants?: ProjectGrantInfo[];
  roleId?: number | null;
  roleName?: string | null;
}

export interface StatusOwnerPermissionImpact {
  permissionId: number | null;
  permissionType: string;
  itemTypeSetId: number | null;
  itemTypeSetName: string;
  projectId?: number | null;
  projectName?: string | null;
  workflowStatusId?: number | null;
  workflowStatusName?: string | null;
  statusId?: number | null;
  statusName?: string | null;
  grantId?: number | null;
  grantName?: string | null;
  assignedRoles?: string[];
  assignedGrants?: string[];
  projectAssignedRoles?: ProjectRoleInfo[];
  hasAssignments: boolean;
  projectGrants?: ProjectGrantInfo[];
}

export interface FieldStatusPermissionImpact {
  permissionId: number | null;
  permissionType: string;
  itemTypeSetId: number | null;
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
  assignedGrants?: string[];
  projectAssignedRoles?: ProjectRoleInfo[];
  hasAssignments: boolean;
  projectGrants?: ProjectGrantInfo[];
}

