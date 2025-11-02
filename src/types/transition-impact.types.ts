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



