export interface FieldSetRemovalImpactDto {
  fieldSetId: number;
  fieldSetName: string;
  removedFieldConfigurationIds: number[];
  removedFieldConfigurationNames: string[];
  affectedItemTypeSets: ItemTypeSetImpact[];
  fieldOwnerPermissions: PermissionImpact[];
  fieldStatusPermissions: PermissionImpact[];
  totalAffectedItemTypeSets: number;
  totalFieldOwnerPermissions: number;
  totalFieldStatusPermissions: number;
  totalGrantAssignments: number;
  totalRoleAssignments: number;
}

export interface ItemTypeSetImpact {
  itemTypeSetId: number;
  itemTypeSetName: string;
  projectId: number | null;
  projectName: string | null;
  // Informazioni aggregate per questo ItemTypeSet
  totalPermissions?: number; // Totale permission che verranno rimosse
  totalRoleAssignments?: number; // Totale ruoli assegnati
  totalGlobalGrants?: number; // Totale grant globali
  totalProjectGrants?: number; // Totale grant di progetto
  projectImpacts?: ProjectImpact[]; // Dettaglio per ogni progetto che usa questo ItemTypeSet
}

export interface ProjectImpact {
  projectId: number;
  projectName: string;
  projectGrantsCount: number; // Numero di grant di progetto per questo ItemTypeSet in questo progetto
}

export interface PermissionImpact {
  permissionId: number;
  permissionType: string; // "FIELD_OWNERS", "EDITORS", "VIEWERS"
  itemTypeSetId: number;
  itemTypeSetName: string;
  fieldConfigurationId: number;
  fieldConfigurationName: string;
  workflowStatusId?: number;
  workflowStatusName?: string;
  roleId?: number;
  roleName?: string;
  grantId?: number; // Grant globale (se presente)
  grantName?: string; // Nome grant globale
  assignedRoles: string[];
  assignedGrants: string[];
  projectAssignedRoles?: ProjectRoleInfo[];
  hasAssignments: boolean; // true se ha ruoli o grant assegnati
  
  // Info per preservazione (simile a ItemTypeConfigurationMigrationImpactDto)
  fieldId?: number; // ID del Field
  fieldName?: string; // Nome del Field
  statusId?: number; // ID dello Status
  statusName?: string; // Nome dello Status
  matchingFieldId?: number; // ID del Field corrispondente nel nuovo stato
  matchingFieldName?: string; // Nome del Field corrispondente nel nuovo stato
  matchingStatusId?: number; // ID dello Status corrispondente nel nuovo stato
  matchingStatusName?: string; // Nome dello Status corrispondente nel nuovo stato
  canBePreserved?: boolean; // true se esiste entity equivalente nel nuovo stato
  defaultPreserve?: boolean; // true se dovrebbe essere preservata di default
  
  // Grant di progetto per questa permission
  projectGrants?: ProjectGrantInfo[]; // Lista di progetti che hanno grant per questa permission
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

















