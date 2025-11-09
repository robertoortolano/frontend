export interface GlobalAssignmentInfo {
  roles: string[];
  grant?: {
    permissionType: string;
    permissionId: number;
    displayName: string;
  } | null;
}

export interface ProjectAssignmentInfo {
  projectId?: number | null;
  projectName?: string | null;
  roles: string[];
  grant?: {
    permissionType: string;
    permissionId: number;
    projectId?: number | null;
    displayName: string;
  } | null;
}

export interface ImpactPermissionRow {
  id: number | null;
  key: string;
  permissionType?: string | null;
  label: string;
  itemTypeSetName?: string | null;
  matchLabel?: string | null;
  canPreserve: boolean;
  defaultPreserve: boolean;
  hasAssignments: boolean;
  global: GlobalAssignmentInfo;
  projects: ProjectAssignmentInfo[];
  raw?: any;
}

