import { UserOption } from '../../UserAutocomplete';

export interface Role {
  id: number;
  name: string;
  description?: string;
}

export interface Group {
  id: number;
  name: string;
}

export interface Permission {
  id: number | string;
  name: string;
  workflowStatus?: { id?: number; name: string };
  workflow?: { id?: number; name: string };
  itemType?: { id?: number; name: string };
  fieldConfiguration?: { id?: number; name: string; fieldType: string };
  fromStatus?: { id?: number; name: string };
  toStatus?: { id?: number; name: string };
  transition?: { id?: number; [key: string]: any };
  assignedRoles?: Role[];
  grantId?: number;
  grantName?: string;
  roleTemplateId?: number;
  roleTemplateName?: string;
  assignmentType?: string;
  hasProjectGrant?: boolean;
  projectGrantId?: number;
}

export type PermissionScope = 'tenant' | 'project';

export interface GrantDetailData {
  users?: UserOption[];
  groups?: Group[];
  negatedUsers?: UserOption[];
  negatedGroups?: Group[];
}








