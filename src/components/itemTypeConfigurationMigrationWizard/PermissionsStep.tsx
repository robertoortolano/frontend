import React from 'react';
import {
  ItemTypeConfigurationMigrationImpactDto,
  ProjectGrantInfo,
  SelectablePermissionImpact,
} from '../../types/item-type-configuration-migration.types';
import alertStyles from '../../styles/common/Alerts.module.css';
import { ItemTypeConfigurationWizardStats } from '../../hooks/useItemTypeConfigurationMigrationWizard';

interface PermissionsStepProps {
  impacts: ItemTypeConfigurationMigrationImpactDto[];
  preservedPermissionIdsMap: Map<number, Set<number>>;
  getPermissionName: (perm: SelectablePermissionImpact) => string;
  togglePermission: (configId: number, permissionId: number) => void;
  loading?: boolean;
  stats: ItemTypeConfigurationWizardStats;
  onShowRolesDetails: (payload: {
    permissionName: string;
    roles: string[];
  }) => void;
  onRequestGlobalGrantDetails: (
    permission: SelectablePermissionImpact
  ) => Promise<void>;
  onRequestProjectGrantDetails: (
    permission: SelectablePermissionImpact,
    projectGrant: ProjectGrantInfo
  ) => Promise<void>;
}

interface ProjectEntry {
  projectId?: number | null;
  projectName?: string | null;
  roles: string[];
  grant?: ProjectGrantInfo;
}

const buildProjectEntries = (
  permission: SelectablePermissionImpact
): ProjectEntry[] => {
  const projectEntriesMap = new Map<string, ProjectEntry>();

  if (Array.isArray((permission as any).projectAssignedRoles)) {
    ((permission as any).projectAssignedRoles as Array<{
      projectId?: number | null;
      projectName?: string | null;
      roles?: string[];
    }>).forEach((projectRole) => {
      const key = `${projectRole.projectId ?? 'null'}::${
        projectRole.projectName ?? 'N/A'
      }`;

      const existing =
        projectEntriesMap.get(key) ??
        ({
          projectId: projectRole.projectId,
          projectName: projectRole.projectName,
          roles: [],
        } as ProjectEntry);

      if (Array.isArray(projectRole.roles)) {
        existing.roles = [
          ...existing.roles,
          ...projectRole.roles.filter(Boolean),
        ];
      }

      projectEntriesMap.set(key, existing);
    });
  }

  if (permission.projectGrants) {
    permission.projectGrants.forEach((grant) => {
      const key = `${grant.projectId ?? 'null'}::${grant.projectName ?? 'N/A'}`;
      const existing =
        projectEntriesMap.get(key) ??
        ({
          projectId: grant.projectId,
          projectName: grant.projectName,
          roles: [],
        } as ProjectEntry);
      existing.grant = grant;
      projectEntriesMap.set(key, existing);
    });
  }

  return Array.from(projectEntriesMap.values());
};

const renderPermissionSection = (
  title: string,
  impact: ItemTypeConfigurationMigrationImpactDto,
  permissions: SelectablePermissionImpact[],
  preservedPermissionIdsMap: Map<number, Set<number>>,
  getPermissionName: (perm: SelectablePermissionImpact) => string,
  togglePermission: (configId: number, permissionId: number) => void,
  onShowRolesDetails: (payload: { permissionName: string; roles: string[] }) => void,
  onRequestGlobalGrantDetails: (
    permission: SelectablePermissionImpact
  ) => Promise<void>,
  onRequestProjectGrantDetails: (
    permission: SelectablePermissionImpact,
    projectGrant: ProjectGrantInfo
  ) => Promise<void>,
  loading?: boolean
) => {
  const permissionsWithRoles = permissions.filter(
    (permission) => permission.hasAssignments
  );

  if (permissionsWithRoles.length === 0) {
    return null;
  }

  const preservedSet =
    preservedPermissionIdsMap.get(impact.itemTypeConfigurationId) ??
    new Set<number>();

  const canPreserveCount = permissionsWithRoles.filter(
    (permission) => permission.canBePreserved
  ).length;
  const selectedInSection = permissionsWithRoles.filter((permission) =>
    preservedSet.has(permission.permissionId)
  ).length;

  return (
    <div
      style={{
        backgroundColor: '#f0fdf4',
        border: '1px solid #10b981',
        borderRadius: '6px',
        padding: '16px',
        marginTop: '1.5rem',
        marginBottom: '24px',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '0.5rem',
        }}
      >
        <h3
          style={{
            fontSize: '1rem',
            fontWeight: '600',
            marginBottom: '0.5rem',
            color: '#1f2937',
          }}
        >
          {title} ({permissionsWithRoles.length} con ruoli)
        </h3>
        <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
          {selectedInSection} / {canPreserveCount} preservabili selezionate
        </div>
      </div>
      <div style={{ overflowX: 'auto', maxHeight: '400px', overflowY: 'auto' }}>
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '0.875rem',
          }}
        >
          <thead>
            <tr style={{ backgroundColor: '#f0fdf4', color: '#1f2937' }}>
              <th
                style={{
                  padding: '10px 12px',
                  textAlign: 'left',
                  fontWeight: '600',
                  borderBottom: '2px solid #10b981',
                  width: '120px',
                }}
              >
                Azione
              </th>
              <th
                style={{
                  padding: '10px 12px',
                  textAlign: 'left',
                  fontWeight: '600',
                  borderBottom: '2px solid #10b981',
                }}
              >
                Permission
              </th>
              <th
                style={{
                  padding: '10px 12px',
                  textAlign: 'left',
                  fontWeight: '600',
                  borderBottom: '2px solid #10b981',
                }}
              >
                ItemTypeSet
              </th>
              <th
                style={{
                  padding: '10px 12px',
                  textAlign: 'left',
                  fontWeight: '600',
                  borderBottom: '2px solid #10b981',
                }}
              >
                Match nel nuovo stato
              </th>
              <th
                style={{
                  padding: '10px 12px',
                  textAlign: 'left',
                  fontWeight: '600',
                  borderBottom: '2px solid #10b981',
                }}
              >
                Grant Globali
              </th>
              <th
                style={{
                  padding: '10px 12px',
                  textAlign: 'left',
                  fontWeight: '600',
                  borderBottom: '2px solid #10b981',
                }}
              >
                Grant di Progetto
              </th>
            </tr>
          </thead>
          <tbody>
            {permissionsWithRoles.map((permission, index) => {
              const isSelected = preservedSet.has(permission.permissionId);
              const canPreserve = permission.canBePreserved;
              const rolesCount = permission.assignedRoles?.length ?? 0;
              const hasGlobalGrant = permission.grantId != null;
              const projectEntries = buildProjectEntries(permission);
              const hasProjectAssignments = projectEntries.some(
                (entry) => entry.roles.length > 0 || entry.grant
              );

              return (
                <tr
                  key={`${impact.itemTypeConfigurationId}-${permission.permissionId}`}
                  style={{
                    borderBottom: '1px solid #d1fae5',
                    backgroundColor:
                      isSelected && canPreserve
                        ? '#dcfce7'
                        : index % 2 === 0
                        ? '#ffffff'
                        : '#f0fdf4',
                    opacity: !canPreserve ? 0.7 : 1,
                  }}
                >
                  <td style={{ padding: '10px 12px' }}>
                    <span
                      onClick={() => {
                        if (canPreserve && !loading) {
                          togglePermission(
                            impact.itemTypeConfigurationId,
                            permission.permissionId
                          );
                        }
                      }}
                      style={{
                        padding: '0.25rem 0.5rem',
                        borderRadius: '0.25rem',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        backgroundColor:
                          isSelected && canPreserve ? '#d1fae5' : '#fee2e2',
                        color:
                          isSelected && canPreserve ? '#059669' : '#dc2626',
                        cursor:
                          canPreserve && !loading ? 'pointer' : 'not-allowed',
                        display: 'inline-block',
                        userSelect: 'none',
                        transition: 'background-color 0.2s, color 0.2s',
                      }}
                      onMouseEnter={(event) => {
                        if (canPreserve && !loading) {
                          event.currentTarget.style.opacity = '0.8';
                        }
                      }}
                      onMouseLeave={(event) => {
                        if (canPreserve && !loading) {
                          event.currentTarget.style.opacity = '1';
                        }
                      }}
                    >
                      {isSelected && canPreserve ? '✓ Preserva' : '✗ Rimuovi'}
                    </span>
                  </td>
                  <td
                    style={{
                      padding: '10px 12px',
                      fontWeight: '500',
                      color: '#1f2937',
                    }}
                  >
                    {getPermissionName(permission)}
                  </td>
                  <td style={{ padding: '10px 12px', color: '#4b5563' }}>
                    {permission.itemTypeSetName || 'N/A'}
                  </td>
                  <td style={{ padding: '10px 12px', color: '#4b5563' }}>
                    {canPreserve && permission.matchingEntityName ? (
                      <span style={{ color: '#059669', fontSize: '0.875rem' }}>
                        ✓ {permission.matchingEntityName}
                      </span>
                    ) : (
                      <span style={{ color: '#dc2626', fontSize: '0.875rem' }}>
                        ✗ Rimosso
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '10px 12px', color: '#4b5563' }}>
                    {rolesCount === 0 &&
                    (!hasGlobalGrant ||
                      !permission.permissionId ||
                      !permission.permissionType) ? (
                      <span style={{ color: '#9ca3af', fontSize: '0.75rem' }}>
                        —
                      </span>
                    ) : (
                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '4px',
                          fontSize: '0.75rem',
                        }}
                      >
                        {rolesCount > 0 && (
                          <span
                            onClick={() =>
                              onShowRolesDetails({
                                permissionName: getPermissionName(permission),
                                roles: permission.assignedRoles || [],
                              })
                            }
                            style={{
                              cursor: 'pointer',
                              color: '#2563eb',
                              textDecoration: 'underline',
                              fontWeight: '500',
                            }}
                            onMouseEnter={(event) => {
                              event.currentTarget.style.opacity = '0.7';
                            }}
                            onMouseLeave={(event) => {
                              event.currentTarget.style.opacity = '1';
                            }}
                          >
                            Ruoli
                          </span>
                        )}
                        {hasGlobalGrant &&
                          permission.permissionId &&
                          permission.permissionType && (
                            <span
                              onClick={() =>
                                onRequestGlobalGrantDetails(permission)
                              }
                              style={{
                                cursor: 'pointer',
                                color: '#2563eb',
                                textDecoration: 'underline',
                                fontWeight: '500',
                              }}
                              onMouseEnter={(event) => {
                                event.currentTarget.style.opacity = '0.7';
                              }}
                              onMouseLeave={(event) => {
                                event.currentTarget.style.opacity = '1';
                              }}
                            >
                              Grant
                            </span>
                          )}
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '10px 12px', color: '#4b5563' }}>
                    {hasProjectAssignments ? (
                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '6px',
                          fontSize: '0.75rem',
                        }}
                      >
                        {projectEntries.map((entry, entryIndex) => {
                          const displayName =
                            entry.projectName || 'Progetto N/A';
                          const nodes: React.ReactNode[] = [];

                          if (entry.roles.length > 0) {
                            nodes.push(
                              <span
                                key={`proj-role-${entryIndex}`}
                                onClick={() =>
                                  onShowRolesDetails({
                                    permissionName: `${getPermissionName(
                                      permission
                                    )} — ${displayName}`,
                                    roles: entry.roles,
                                  })
                                }
                                style={{
                                  cursor: 'pointer',
                                  color: '#2563eb',
                                  textDecoration: 'underline',
                                  fontWeight: '500',
                                }}
                                onMouseEnter={(event) => {
                                  event.currentTarget.style.opacity = '0.7';
                                }}
                                onMouseLeave={(event) => {
                                  event.currentTarget.style.opacity = '1';
                                }}
                              >
                                {`${displayName}: Ruoli`}
                              </span>
                            );
                          }

                          if (entry.grant) {
                            nodes.push(
                              <span
                                key={`proj-grant-${entryIndex}`}
                                onClick={() =>
                                  onRequestProjectGrantDetails(
                                    permission,
                                    entry.grant as ProjectGrantInfo
                                  )
                                }
                                style={{
                                  cursor: 'pointer',
                                  color: '#2563eb',
                                  textDecoration: 'underline',
                                  fontWeight: '500',
                                }}
                                onMouseEnter={(event) => {
                                  event.currentTarget.style.opacity = '0.7';
                                }}
                                onMouseLeave={(event) => {
                                  event.currentTarget.style.opacity = '1';
                                }}
                              >
                                {`${displayName}: Grant`}
                              </span>
                            );
                          }

                          return nodes;
                        })}
                      </div>
                    ) : (
                      <span style={{ color: '#9ca3af' }}>—</span>
                    )}
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

export const PermissionsStep: React.FC<PermissionsStepProps> = ({
  impacts,
  preservedPermissionIdsMap,
  getPermissionName,
  togglePermission,
  loading = false,
  stats,
  onShowRolesDetails,
  onRequestGlobalGrantDetails,
  onRequestProjectGrantDetails,
}) => {
  return (
    <div>
      {impacts.map((impact, index) => (
        <div key={impact.itemTypeConfigurationId} style={{ marginTop: '2rem' }}>
          <h2
            style={{
              fontSize: '1.125rem',
              fontWeight: '600',
              marginBottom: '1rem',
              color: '#1e3a8a',
            }}
          >
            Configurazione {index + 1}: {impact.itemTypeName}
          </h2>

          {renderPermissionSection(
            'Permission Field Owner',
            impact,
            impact.fieldOwnerPermissions,
            preservedPermissionIdsMap,
            getPermissionName,
            togglePermission,
            onShowRolesDetails,
            onRequestGlobalGrantDetails,
            onRequestProjectGrantDetails,
            loading
          )}

          {renderPermissionSection(
            'Permission Status Owner',
            impact,
            impact.statusOwnerPermissions,
            preservedPermissionIdsMap,
            getPermissionName,
            togglePermission,
            onShowRolesDetails,
            onRequestGlobalGrantDetails,
            onRequestProjectGrantDetails,
            loading
          )}

          {renderPermissionSection(
            'Permission Field Status',
            impact,
            impact.fieldStatusPermissions,
            preservedPermissionIdsMap,
            getPermissionName,
            togglePermission,
            onShowRolesDetails,
            onRequestGlobalGrantDetails,
            onRequestProjectGrantDetails,
            loading
          )}

          {renderPermissionSection(
            'Permission Executor',
            impact,
            impact.executorPermissions,
            preservedPermissionIdsMap,
            getPermissionName,
            togglePermission,
            onShowRolesDetails,
            onRequestGlobalGrantDetails,
            onRequestProjectGrantDetails,
            loading
          )}
        </div>
      ))}

      {stats.withRoles === 0 && (
        <div
          className={alertStyles.infoContainer}
          style={{ marginTop: '1.5rem' }}
        >
          <h4>ℹ️ Nessuna permission con ruoli</h4>
          <p>
            Non ci sono permission con ruoli assegnati interessate da questa
            modifica. Le permission vuote verranno gestite automaticamente.
          </p>
        </div>
      )}
    </div>
  );
};


