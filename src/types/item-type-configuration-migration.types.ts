export interface ItemTypeConfigurationMigrationImpactDto {
  itemTypeConfigurationId: number;
  itemTypeConfigurationName: string;
  itemTypeSetId: number | null;
  itemTypeSetName: string | null;
  itemTypeId: number;
  itemTypeName: string;
  
  // Informazioni su cosa sta cambiando
  oldFieldSet: FieldSetInfo | null;
  newFieldSet: FieldSetInfo | null;
  fieldSetChanged: boolean;
  
  oldWorkflow: WorkflowInfo | null;
  newWorkflow: WorkflowInfo | null;
  workflowChanged: boolean;
  
  // Permission con flag di preservabilità
  fieldOwnerPermissions: SelectablePermissionImpact[];
  statusOwnerPermissions: SelectablePermissionImpact[];
  fieldStatusPermissions: SelectablePermissionImpact[];
  executorPermissions: SelectablePermissionImpact[];
  
  // Statistiche
  totalPreservablePermissions: number;
  totalRemovablePermissions: number;
  totalNewPermissions: number;
  totalPermissionsWithRoles: number;
}

export interface FieldSetInfo {
  fieldSetId: number;
  fieldSetName: string;
  fields: FieldInfo[];
}

export interface FieldInfo {
  fieldId: number;
  fieldName: string;
}

export interface WorkflowInfo {
  workflowId: number;
  workflowName: string;
  workflowStatuses: WorkflowStatusInfo[];
  transitions: TransitionInfo[];
}

export interface WorkflowStatusInfo {
  workflowStatusId: number;
  workflowStatusName: string;
  statusId: number;
  statusName: string;
}

export interface TransitionInfo {
  transitionId: number;
  transitionName: string;
  fromWorkflowStatusId: number;
  fromWorkflowStatusName: string;
  toWorkflowStatusId: number;
  toWorkflowStatusName: string;
}

export interface SelectablePermissionImpact {
  permissionId: number;
  permissionType: string; // "FIELD_OWNERS", "STATUS_OWNERS", "EDITORS", "VIEWERS", "EXECUTORS"
  
  // Info entity attuale (Field, WorkflowStatus, Transition)
  entityId: number | null; // FieldId, WorkflowStatusId, TransitionId
  entityName: string | null; // Nome del Field/Status/Transition
  
  // Per FieldStatusPermission: entrambe le entità
  fieldId?: number;
  fieldName?: string;
  workflowStatusId?: number;
  workflowStatusName?: string;
  
  // Info entity corrispondente nel nuovo stato (se canBePreserved)
  matchingEntityId: number | null;
  matchingEntityName: string | null;
  
  // Ruoli assegnati
  assignedRoles: string[];
  hasAssignments: boolean;
  
  // Flag preservabilità
  canBePreserved: boolean;
  defaultPreserve: boolean; // true se dovrebbe essere preservata di default
  
  // Info contesto
  itemTypeSetId: number | null;
  itemTypeSetName: string | null;
  projectId: number | null;
  projectName: string | null;
  
  // Grant information
  roleId?: number | null;
  roleName?: string | null;
  grantId?: number | null;
  grantName?: string | null;
  projectGrants?: ProjectGrantInfo[];
  
  // Per EXECUTORS: informazioni sulla Transition
  fromStatusName?: string | null;
  toStatusName?: string | null;
  transitionName?: string | null;
  
  // Suggerimento azione
  suggestedAction: "PRESERVE" | "REMOVE" | "NEW";
}

export interface ProjectGrantInfo {
  projectId: number;
  projectName: string;
}

export interface ItemTypeConfigurationMigrationRequest {
  itemTypeConfigurationId: number;
  newFieldSetId?: number | null;
  newWorkflowId?: number | null;
  preservePermissionIds: number[];
  preserveAllPreservable?: boolean | null;
  removeAll?: boolean | null;
}

