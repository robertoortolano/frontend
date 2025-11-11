import { LucideIcon } from "lucide-react";
import layout from "../../styles/common/Layout.module.css";
import utilities from "../../styles/common/Utilities.module.css";
import table from "../../styles/common/Tables.module.css";
import { RoleRow } from "./RoleRow";
import { RoleCountBadge } from "./RoleCountBadge";
import { GrantDetailsRequest } from "./RoleAssignmentsCell";

export interface RoleTypeSectionMeta {
  label: string;
  icon: LucideIcon;
  color: string;
  description?: string;
}

interface RoleTypeSectionProps {
  roleType: string;
  roles: any[];
  meta: RoleTypeSectionMeta;
  grantDetailsMap: Map<string, any>;
  projectId?: string;
  showOnlyProjectGrants: boolean;
  includeProjectAssignments: boolean;
  onPermissionGrantClick?: (permission: any) => void;
  onShowRoles: (permissionName: string, roles: string[]) => void;
  onShowGrant: (request: GrantDetailsRequest) => Promise<void>;
  getPermissionName: (role: any) => string;
}

export const RoleTypeSection = ({
  roleType,
  roles,
  meta,
  grantDetailsMap,
  projectId,
  showOnlyProjectGrants,
  includeProjectAssignments,
  onPermissionGrantClick,
  onShowRoles,
  onShowGrant,
  getPermissionName,
}: RoleTypeSectionProps) => {
  const IconComponent = meta.icon;

  return (
    <div className={layout.block}>
      <div className={layout.blockHeader}>
        <div className="flex items-center gap-3">
          <IconComponent size={16} />
          <h3 className={layout.blockTitleBlue}>{meta.label || roleType}</h3>
          <RoleCountBadge count={roles.length} color={meta.color || "gray"} />
        </div>
        {meta.description && (
          <p className={layout.paragraphMuted}>{meta.description}</p>
        )}
      </div>

      <div className={utilities.mt4}>
        <table className={table.table}>
          <thead>
            <tr>
              <th>Dettagli</th>
              <th>Assegnazioni</th>
              <th>Azioni</th>
            </tr>
          </thead>
          <tbody>
            {roles.map((role: any, index: number) => (
              <RoleRow
                key={role?.id ?? `${roleType}-${index}`}
                role={role}
                grantDetailsMap={grantDetailsMap}
                projectId={projectId}
                showOnlyProjectGrants={showOnlyProjectGrants}
                includeProjectAssignments={includeProjectAssignments}
                getPermissionName={getPermissionName}
                onShowRoles={onShowRoles}
                onShowGrant={onShowGrant}
                onPermissionGrantClick={onPermissionGrantClick}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};


