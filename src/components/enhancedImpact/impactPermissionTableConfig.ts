import { ImpactPermissionRow } from '../../types/impact-permission.types';
import { ImpactPermissionSelection } from '../../hooks/useImpactPermissionSelection';

export interface ImpactPermissionTableColumn {
  key: 'action' | 'permission' | 'itemTypeSet' | 'match' | 'globalGrants' | 'projectGrants';
  label: string;
  width?: string;
}

export const IMPACT_PERMISSION_TABLE_COLUMNS: ImpactPermissionTableColumn[] = [
  {
    key: 'action',
    label: 'Azione',
    width: '120px'
  },
  {
    key: 'permission',
    label: 'Permission'
  },
  {
    key: 'itemTypeSet',
    label: 'ItemTypeSet'
  },
  {
    key: 'match',
    label: 'Match nel nuovo stato'
  },
  {
    key: 'globalGrants',
    label: 'Grant Globali'
  },
  {
    key: 'projectGrants',
    label: 'Grant di Progetto'
  }
];

export const ACTION_BADGE_LABELS = {
  preserve: '✓ Preserva',
  remove: '✗ Rimuovi'
};

interface BuildActionBadgeStyleOptions {
  selection: ImpactPermissionSelection;
  permission: ImpactPermissionRow;
  loading: boolean;
}

export const buildActionBadgeStyle = ({
  selection,
  permission,
  loading
}: BuildActionBadgeStyleOptions) => {
  const isSelected = selection.isSelected(permission.id);
  const canToggle = selection.canToggle(permission.id);

  return {
    isSelected,
    canToggle,
    style: {
      padding: '0.25rem 0.5rem',
      borderRadius: '0.25rem',
      fontSize: '0.75rem',
      fontWeight: 600,
      backgroundColor: isSelected && canToggle ? '#d1fae5' : '#fee2e2',
      color: isSelected && canToggle ? '#059669' : '#dc2626',
      cursor: !canToggle || loading ? 'not-allowed' : 'pointer' as const,
      display: 'inline-block',
      userSelect: 'none' as const,
      transition: 'opacity 0.2s',
      opacity: !canToggle || loading ? 0.7 : 1
    }
  };
};

export const buildRowBackgroundColor = (
  selection: ImpactPermissionSelection,
  permission: ImpactPermissionRow,
  rowIndex: number
) => {
  const isSelected = selection.isSelected(permission.id);

  if (isSelected && permission.canPreserve) {
    return '#dcfce7';
  }

  return rowIndex % 2 === 0 ? '#ffffff' : '#f0fdf4';
};









