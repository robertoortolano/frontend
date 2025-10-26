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
  totalRoleAssignments: number;
}

export interface ItemTypeSetImpact {
  itemTypeSetId: number;
  itemTypeSetName: string;
  projectId?: number;
  projectName?: string;
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
  assignedRoles: string[];
  hasAssignments: boolean; // true se ha ruoli assegnati
}

