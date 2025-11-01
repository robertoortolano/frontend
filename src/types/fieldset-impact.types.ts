export interface FieldSetRemovalImpactDto {
  fieldSetId: number;
  fieldSetName: string;
  removedFieldConfigurationIds: number[];
  removedFieldConfigurationNames: string[];
  affectedItemTypeSets: ItemTypeSetImpact[];
  fieldOwnerPermissions: PermissionImpact[];
  fieldStatusPermissions: PermissionImpact[];
  itemTypeSetRoles: PermissionImpact[];
  totalAffectedItemTypeSets: number;
  totalFieldOwnerPermissions: number;
  totalFieldStatusPermissions: number;
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
  permissionId: number;
  permissionType: string; // "FIELD_OWNERS", "EDITORS", "VIEWERS", "ITEMTYPESET_ROLE"
  itemTypeSetId: number;
  itemTypeSetName: string;
  fieldConfigurationId: number;
  fieldConfigurationName: string;
  workflowStatusId?: number;
  workflowStatusName?: string;
  roleId?: number;
  roleName?: string;
  grantId?: number;
  grantName?: string;
  assignedRoles: string[];
  assignedGrants: string[];
  hasAssignments: boolean; // true se ha ruoli o grant assegnati
}















