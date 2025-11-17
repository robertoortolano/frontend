import React, { useMemo } from 'react';
import alertStyles from '../../../../styles/common/Alerts.module.css';
import {
  ItemTypeConfigurationMigrationImpactDto,
  ProjectGrantInfo,
  SelectablePermissionImpact,
} from '../../../../types/item-type-configuration-migration.types';
import { ItemTypeConfigurationWizardStats } from '../../../../hooks/useItemTypeConfigurationMigrationWizard';
import { ConfigurationSection, usePermissionsStep } from './usePermissionsStep';

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

interface PermissionSectionProps {
  configuration: ConfigurationSection;
  sectionTitle: string;
  permissions: SelectablePermissionImpact[];
  loading: boolean;
  getPermissionName: PermissionsStepProps['getPermissionName'];
  togglePermission: PermissionsStepProps['togglePermission'];
  onShowRolesDetails: PermissionsStepProps['onShowRolesDetails'];
  onRequestGlobalGrantDetails: PermissionsStepProps['onRequestGlobalGrantDetails'];
  onRequestProjectGrantDetails: PermissionsStepProps['onRequestProjectGrantDetails'];
  getProjectEntries: ReturnType<typeof usePermissionsStep>['getProjectEntries'];
}

const PermissionSection: React.FC<PermissionSectionProps> = ({
  configuration,
  sectionTitle,
  permissions,
  loading,
  getPermissionName,
  togglePermission,
  onShowRolesDetails,
  onRequestGlobalGrantDetails,
  onRequestProjectGrantDetails,
  getProjectEntries,
}) => {
  const preservedSet = configuration.preservedSet;

  const { selectedInSection, canPreserveCount } = useMemo(() => {
    let selected = 0;
    let preservable = 0;

    permissions.forEach((permission) => {
      if (permission.canBePreserved) {
        preservable += 1;
      }
      if (preservedSet.has(permission.permissionId)) {
        selected += 1;
      }
    });

    return { selectedInSection: selected, canPreserveCount: preservable };
  }, [permissions, preservedSet]);

  if (permissions.length === 0) {
    return null;
  }

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
          {sectionTitle} ({permissions.length} con ruoli)
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
            {permissions.map((permission, index) => {
              const isSelected = preservedSet.has(permission.permissionId);
              const canPreserve = permission.canBePreserved;
              const rolesCount = permission.assignedRoles?.length ?? 0;
              const hasGlobalGrant = permission.grantId != null;
              const projectEntries = getProjectEntries(permission);
              const hasProjectAssignments = projectEntries.some(
                (entry) => entry.roles.length > 0 || entry.grant
              );

              return (
                <tr
                  key={`${configuration.impact.itemTypeConfigurationId}-${permission.permissionId}`}
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
                            configuration.impact.itemTypeConfigurationId,
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
                        cursor: canPreserve && !loading ? 'pointer' : 'not-allowed',
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
                          permission.grantId &&
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
                          const displayName = entry.projectName || 'Progetto N/A';
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

                          // Mostra il link Grant solo se c'è effettivamente un grant (grantId presente)
                          if (entry.grant && entry.grant.grantId) {
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
  const { configurationSections, getProjectEntries } = usePermissionsStep({
    impacts,
    preservedPermissionIdsMap,
  });

  return (
    <div>
      {configurationSections.map((configuration) => (
        <div key={configuration.impact.itemTypeConfigurationId} style={{ marginTop: '2rem' }}>
          <h2
            style={{
              fontSize: '1.125rem',
              fontWeight: '600',
              marginBottom: '1rem',
              color: '#1e3a8a',
            }}
          >
            {configuration.heading}
          </h2>

          {configuration.groups.map((group) => (
            <PermissionSection
              key={`${configuration.impact.itemTypeConfigurationId}-${group.key}`}
              configuration={configuration}
              sectionTitle={group.title}
              permissions={group.permissions}
              loading={loading}
              getPermissionName={getPermissionName}
              togglePermission={togglePermission}
              onShowRolesDetails={onShowRolesDetails}
              onRequestGlobalGrantDetails={onRequestGlobalGrantDetails}
              onRequestProjectGrantDetails={onRequestProjectGrantDetails}
              getProjectEntries={getProjectEntries}
            />
          ))}
        </div>
      ))}

      {stats.withRoles === 0 && (
        <div className={alertStyles.infoContainer} style={{ marginTop: '1.5rem' }}>
          <h4>ℹ️ Nessuna permission con ruoli</h4>
          <p>
            Non ci sono permission con ruoli assegnati interessate da questa modifica.
            Le permission vuote verranno gestite automaticamente.
          </p>
        </div>
      )}
    </div>
  );
};





