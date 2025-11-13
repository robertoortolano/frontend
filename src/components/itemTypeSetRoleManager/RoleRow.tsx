import { Shield } from "lucide-react";
import buttons from "../../styles/common/Buttons.module.css";
import { RoleDetailsCell } from "./RoleDetailsCell";
import {
  GrantDetailsRequest,
  RoleAssignmentsCell,
} from "./RoleAssignmentsCell";

interface RoleRowProps {
  role: any;
  grantDetailsMap: Map<string, any>;
  projectId?: string;
  showOnlyProjectGrants: boolean;
  includeProjectAssignments: boolean;
  getPermissionName: (role: any) => string;
  onShowRoles: (permissionName: string, roles: string[]) => void;
  onShowGrant: (request: GrantDetailsRequest) => Promise<void>;
  onPermissionGrantClick?: (permission: any) => void;
}

export const RoleRow = ({
  role,
  grantDetailsMap,
  projectId,
  showOnlyProjectGrants,
  includeProjectAssignments,
  getPermissionName,
  onShowRoles,
  onShowGrant,
  onPermissionGrantClick,
}: RoleRowProps) => {
  return (
    <tr>
      <td>
        <RoleDetailsCell role={role} />
      </td>
      <td>
        <RoleAssignmentsCell
          role={role}
          projectId={projectId}
          showOnlyProjectGrants={showOnlyProjectGrants}
          includeProjectAssignments={includeProjectAssignments}
          grantDetailsMap={grantDetailsMap}
          getPermissionName={getPermissionName}
          onShowRoles={onShowRoles}
          onShowGrant={onShowGrant}
        />
      </td>
      <td>
        {onPermissionGrantClick ? (
          <button
            type="button"
            onClick={() => onPermissionGrantClick(role)}
            className={buttons.button}
            style={{ padding: "0.25rem 0.5rem", fontSize: "0.75rem" }}
            title="Gestisci Ruoli"
          >
            <Shield size={14} />
          </button>
        ) : (
          <span className="text-xs text-gray-400 italic">Sola lettura</span>
        )}
      </td>
    </tr>
  );
};








