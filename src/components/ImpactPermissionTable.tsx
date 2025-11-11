import React from 'react';
import buttons from '../styles/common/Buttons.module.css';
import { ImpactPermissionRow, ProjectAssignmentInfo } from '../types/impact-permission.types';
import { ImpactPermissionSelection } from '../hooks/useImpactPermissionSelection';
import {
  ACTION_BADGE_LABELS,
  IMPACT_PERMISSION_TABLE_COLUMNS,
  buildActionBadgeStyle,
  buildRowBackgroundColor
} from './enhancedImpact/impactPermissionTableConfig';

interface ImpactPermissionTableProps {
  permissions: ImpactPermissionRow[];
  selection: ImpactPermissionSelection;
  loading?: boolean;
  onShowGlobalRoles?: (permission: ImpactPermissionRow) => void;
  onShowGlobalGrant?: (permission: ImpactPermissionRow) => void;
  onShowProjectRoles?: (permission: ImpactPermissionRow, project: ProjectAssignmentInfo) => void;
  onShowProjectGrant?: (permission: ImpactPermissionRow, project: ProjectAssignmentInfo) => void;
}

export const ImpactPermissionTable: React.FC<ImpactPermissionTableProps> = ({
  permissions,
  selection,
  loading = false,
  onShowGlobalRoles,
  onShowGlobalGrant,
  onShowProjectRoles,
  onShowProjectGrant
}) => {
  if (permissions.length === 0) {
    return null;
  }

  const handleToggle = (permission: ImpactPermissionRow) => {
    if (loading) return;
    selection.toggle(permission.id);
  };

  const renderActionCell = (permission: ImpactPermissionRow) => {
    const { isSelected, canToggle, style } = buildActionBadgeStyle({
      selection,
      permission,
      loading
    });
    return (
      <span
        onClick={() => {
          if (canToggle && !loading) {
            handleToggle(permission);
          }
        }}
        style={style}
        onMouseEnter={(e) => {
          if (canToggle && !loading) {
            e.currentTarget.style.opacity = '0.8';
          }
        }}
        onMouseLeave={(e) => {
          if (canToggle && !loading) {
            e.currentTarget.style.opacity = '1';
          }
        }}
      >
        {isSelected && canToggle ? ACTION_BADGE_LABELS.preserve : ACTION_BADGE_LABELS.remove}
      </span>
    );
  };

  const renderGlobalAssignments = (permission: ImpactPermissionRow) => {
    const { global } = permission;
    const hasRoles = global.roles.length > 0;
    const hasGrant = Boolean(global.grant);

    if (!hasRoles && !hasGrant) {
      return <span style={{ color: '#9ca3af' }}>—</span>;
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.75rem' }}>
        {hasRoles && (
          <span
            onClick={() => onShowGlobalRoles?.(permission)}
            style={{
              cursor: 'pointer',
              color: '#2563eb',
              textDecoration: 'underline',
              fontWeight: 500
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = '0.7';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = '1';
            }}
          >
            Ruoli
          </span>
        )}
        {hasGrant && global.grant && (
          <span
            onClick={() => onShowGlobalGrant?.(permission)}
            style={{
              cursor: 'pointer',
              color: '#2563eb',
              textDecoration: 'underline',
              fontWeight: 500
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = '0.7';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = '1';
            }}
          >
            Grant
          </span>
        )}
      </div>
    );
  };

  const renderProjectAssignments = (permission: ImpactPermissionRow) => {
    if (!permission.projects.length) {
      return <span style={{ color: '#9ca3af' }}>—</span>;
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.75rem' }}>
        {permission.projects.map((project, idx) => {
          const displayName = project.projectName || 'Progetto';
          const nodes: React.ReactNode[] = [];

          if (project.roles.length > 0) {
            nodes.push(
              <span
                key={`proj-role-${idx}`}
                onClick={() => onShowProjectRoles?.(permission, project)}
                style={{
                  cursor: 'pointer',
                  color: '#2563eb',
                  textDecoration: 'underline',
                  fontWeight: 500
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.opacity = '0.7';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.opacity = '1';
                }}
              >
                {`${displayName}: Ruoli`}
              </span>
            );
          }

          if (project.grant) {
            nodes.push(
              <span
                key={`proj-grant-${idx}`}
                onClick={() => onShowProjectGrant?.(permission, project)}
                style={{
                  cursor: 'pointer',
                  color: '#2563eb',
                  textDecoration: 'underline',
                  fontWeight: 500
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.opacity = '0.7';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.opacity = '1';
                }}
              >
                {`${displayName}: Grant`}
              </span>
            );
          }

          return (
            <React.Fragment key={`${permission.key}-${idx}`}>
              {nodes.length > 0 ? nodes : (
                <span style={{ color: '#9ca3af' }}>{displayName}: —</span>
              )}
            </React.Fragment>
          );
        })}
      </div>
    );
  };

  return (
    <div
      style={{
        backgroundColor: '#f0fdf4',
        border: '1px solid #10b981',
        borderRadius: '6px',
        padding: '16px',
        marginBottom: '24px'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginBottom: '12px' }}>
        <button
          type="button"
          className={buttons.button}
          onClick={selection.preserveAll}
          disabled={loading || permissions.every((permission) => !permission.canPreserve)}
        >
          ✓ Mantieni Tutto
        </button>
        <button
          type="button"
          className={`${buttons.button} ${buttons.buttonDanger}`}
          onClick={selection.removeAll}
          disabled={loading || permissions.every((permission) => !permission.canPreserve)}
        >
          🗑️ Rimuovi Tutto
        </button>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '0.875rem'
          }}
        >
          <thead>
            <tr style={{ backgroundColor: '#f0fdf4', color: '#1f2937' }}>
              {IMPACT_PERMISSION_TABLE_COLUMNS.map((column) => (
                <th
                  key={column.key}
                  style={{
                    padding: '10px 12px',
                    textAlign: 'left',
                    fontWeight: 600,
                    borderBottom: '2px solid #10b981',
                    width: column.width
                  }}
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {permissions.map((permission, index) => {
              const backgroundColor = buildRowBackgroundColor(selection, permission, index);
              return (
                <tr
                  key={permission.key}
                  style={{
                    borderBottom: '1px solid #d1fae5',
                    backgroundColor,
                    opacity: permission.canPreserve ? 1 : 0.7
                  }}
                >
                  {IMPACT_PERMISSION_TABLE_COLUMNS.map((column) => {
                    const baseCellStyle = { padding: '10px 12px', color: '#4b5563' };

                    switch (column.key) {
                      case 'action':
                        return (
                          <td key={`${permission.key}-${column.key}`} style={{ padding: '10px 12px' }}>
                            {renderActionCell(permission)}
                          </td>
                        );
                      case 'permission':
                        return (
                          <td
                            key={`${permission.key}-${column.key}`}
                            style={{ ...baseCellStyle, fontWeight: 500, color: '#1f2937' }}
                          >
                            {permission.label}
                          </td>
                        );
                      case 'itemTypeSet':
                        return (
                          <td key={`${permission.key}-${column.key}`} style={baseCellStyle}>
                            {permission.itemTypeSetName || 'N/A'}
                          </td>
                        );
                      case 'match':
                        return (
                          <td key={`${permission.key}-${column.key}`} style={baseCellStyle}>
                            {permission.canPreserve && permission.matchLabel ? (
                              <span style={{ color: '#059669', fontSize: '0.875rem' }}>
                                {permission.matchLabel}
                              </span>
                            ) : (
                              <span style={{ color: '#dc2626', fontSize: '0.875rem' }}>✗ Rimosso</span>
                            )}
                          </td>
                        );
                      case 'globalGrants':
                        return (
                          <td key={`${permission.key}-${column.key}`} style={baseCellStyle}>
                            {renderGlobalAssignments(permission)}
                          </td>
                        );
                      case 'projectGrants':
                        return (
                          <td key={`${permission.key}-${column.key}`} style={baseCellStyle}>
                            {renderProjectAssignments(permission)}
                          </td>
                        );
                      default:
                        return null;
                    }
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};


