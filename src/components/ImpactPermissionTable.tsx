import React from 'react';
import buttons from '../styles/common/Buttons.module.css';
import layout from '../styles/common/Layout.module.css';
import form from '../styles/common/Forms.module.css';
import { ImpactPermissionRow, ProjectAssignmentInfo } from '../types/impact-permission.types';
import { ImpactPermissionSelection } from '../hooks/useImpactPermissionSelection';

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
    const isSelected = selection.isSelected(permission.id);
    const canToggle = selection.canToggle(permission.id);

    return (
      <span
        onClick={() => {
          if (canToggle && !loading) {
            handleToggle(permission);
          }
        }}
        style={{
          padding: '0.25rem 0.5rem',
          borderRadius: '0.25rem',
          fontSize: '0.75rem',
          fontWeight: 600,
          backgroundColor: isSelected && canToggle ? '#d1fae5' : '#fee2e2',
          color: isSelected && canToggle ? '#059669' : '#dc2626',
          cursor: !canToggle || loading ? 'not-allowed' : 'pointer',
          display: 'inline-block',
          userSelect: 'none',
          transition: 'opacity 0.2s',
          opacity: !canToggle || loading ? 0.7 : 1
        }}
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
        {isSelected && canToggle ? '✓ Preserva' : '✗ Rimuovi'}
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
          disabled={loading}
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
              <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, borderBottom: '2px solid #10b981', width: '120px' }}>
                Azione
              </th>
              <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, borderBottom: '2px solid #10b981' }}>
                Permission
              </th>
              <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, borderBottom: '2px solid #10b981' }}>
                ItemTypeSet
              </th>
              <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, borderBottom: '2px solid #10b981' }}>
                Match nel nuovo stato
              </th>
              <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, borderBottom: '2px solid #10b981' }}>
                Grant Globali
              </th>
              <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, borderBottom: '2px solid #10b981' }}>
                Grant di Progetto
              </th>
            </tr>
          </thead>
          <tbody>
            {permissions.map((permission, index) => {
              const isSelected = selection.isSelected(permission.id);
              return (
                <tr
                  key={permission.key}
                  style={{
                    borderBottom: '1px solid #d1fae5',
                    backgroundColor: isSelected && permission.canPreserve
                      ? '#dcfce7'
                      : index % 2 === 0
                        ? '#ffffff'
                        : '#f0fdf4',
                    opacity: permission.canPreserve ? 1 : 0.7
                  }}
                >
                  <td style={{ padding: '10px 12px' }}>
                    {renderActionCell(permission)}
                  </td>
                  <td style={{ padding: '10px 12px', fontWeight: 500, color: '#1f2937' }}>
                    {permission.label}
                  </td>
                  <td style={{ padding: '10px 12px', color: '#4b5563' }}>
                    {permission.itemTypeSetName || 'N/A'}
                  </td>
                  <td style={{ padding: '10px 12px', color: '#4b5563' }}>
                    {permission.canPreserve && permission.matchLabel ? (
                      <span style={{ color: '#059669', fontSize: '0.875rem' }}>
                        {permission.matchLabel}
                      </span>
                    ) : (
                      <span style={{ color: '#dc2626', fontSize: '0.875rem' }}>✗ Rimosso</span>
                    )}
                  </td>
                  <td style={{ padding: '10px 12px', color: '#4b5563' }}>
                    {renderGlobalAssignments(permission)}
                  </td>
                  <td style={{ padding: '10px 12px', color: '#4b5563' }}>
                    {renderProjectAssignments(permission)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};


