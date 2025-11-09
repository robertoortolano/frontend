import React, { useState, useEffect, useMemo } from 'react';
import {
  ItemTypeConfigurationMigrationImpactDto,
  SelectablePermissionImpact,
  ProjectGrantInfo,
} from '../types/item-type-configuration-migration.types';
import form from '../styles/common/Forms.module.css';
import layout from '../styles/common/Layout.module.css';
import buttons from '../styles/common/Buttons.module.css';
import alert from '../styles/common/Alerts.module.css';
import api from '../api/api';
import { exportImpactReportToCSV, escapeCSV, PermissionData } from '../utils/csvExportUtils';

interface ItemTypeConfigurationMigrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (preservePermissionIdsMap: Map<number, number[]>) => void;
  impacts: ItemTypeConfigurationMigrationImpactDto[];
  loading?: boolean;
}

export const ItemTypeConfigurationMigrationModal: React.FC<ItemTypeConfigurationMigrationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  impacts,
  loading = false,
}) => {
  // Stato per le permission selezionate (preservate) per ogni configurazione
  const [preservedPermissionIdsMap, setPreservedPermissionIdsMap] = useState<Map<number, Set<number>>>(new Map());
  const [selectedGrantDetails, setSelectedGrantDetails] = useState<{
    projectId: number;
    projectName: string;
    roleId: number;
    details: any;
  } | null>(null);
  const [loadingGrantDetails, setLoadingGrantDetails] = useState(false);
  const [selectedRolesDetails, setSelectedRolesDetails] = useState<{
    permissionName: string;
    roles: string[];
  } | null>(null);

  // Raggruppa tutte le permission da tutti gli impatti
  const getAllPermissionsFromAllImpacts = (): Array<{ impact: ItemTypeConfigurationMigrationImpactDto; permission: SelectablePermissionImpact }> => {
    return impacts.flatMap(impact => 
      getAllPermissions(impact).map(permission => ({ impact, permission }))
    );
  };

  // Filtra solo le permission con ruoli assegnati
  const getPermissionsWithRolesFromAllImpacts = (): Array<{ impact: ItemTypeConfigurationMigrationImpactDto; permission: SelectablePermissionImpact }> => {
    return getAllPermissionsFromAllImpacts().filter(({ permission }) => permission.hasAssignments);
  };

  // Inizializza con le permission che hanno defaultPreserve = true (solo quelle con ruoli)
  useEffect(() => {
    if (impacts.length > 0) {
      const newMap = new Map<number, Set<number>>();
      
      for (const impact of impacts) {
        const permissionsWithRoles = getAllPermissions(impact)
          .filter(p => p.hasAssignments && p.defaultPreserve)
          .map(p => p.permissionId);
        
        if (permissionsWithRoles.length > 0) {
          newMap.set(impact.itemTypeConfigurationId, new Set(permissionsWithRoles));
        }
      }
      
      setPreservedPermissionIdsMap(newMap);
    } else {
      setPreservedPermissionIdsMap(new Map());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [impacts]);

  // Flag globali
  const [preserveAllPreservable, setPreserveAllPreservable] = useState(false);
  const [removeAll, setRemoveAll] = useState(false);

  // Reset flag globali quando cambiano le selezioni manuali
  useEffect(() => {
    if (preserveAllPreservable || removeAll) {
      // Quando si applica un flag globale, potrebbe essere necessario resettare
      // Ma per ora lasciamo che gli utenti possano modificare dopo
    }
  }, [preserveAllPreservable, removeAll]);

  // Applica "Preserva Tutto Mantenibile" (solo permission con ruoli) per tutte le configurazioni
  const handlePreserveAllPreservable = () => {
    const newMap = new Map<number, Set<number>>();
    
    for (const impact of impacts) {
      const allPreservable = getAllPermissions(impact)
        .filter(p => p.hasAssignments && p.canBePreserved)
        .map(p => p.permissionId);
      
      if (allPreservable.length > 0) {
        newMap.set(impact.itemTypeConfigurationId, new Set(allPreservable));
      }
    }
    
    setPreservedPermissionIdsMap(newMap);
    setPreserveAllPreservable(true);
    setRemoveAll(false);
  };

  // Applica "Rimuovi Tutto" per tutte le configurazioni
  const handleRemoveAll = () => {
    setPreservedPermissionIdsMap(new Map());
    setRemoveAll(true);
    setPreserveAllPreservable(false);
  };

  // Toggle singola permission per una specifica configurazione
  const togglePermission = (configId: number, permissionId: number) => {
    setPreservedPermissionIdsMap(prev => {
      const newMap = new Map(prev);
      const currentSet = newMap.get(configId) || new Set<number>();
      const newSet = new Set(currentSet);
      
      if (newSet.has(permissionId)) {
        newSet.delete(permissionId);
      } else {
        newSet.add(permissionId);
      }
      
      if (newSet.size > 0) {
        newMap.set(configId, newSet);
      } else {
        newMap.delete(configId);
      }
      
      return newMap;
    });
    // Reset flag globali quando si modifica manualmente
    setPreserveAllPreservable(false);
    setRemoveAll(false);
  };

  // Raggruppa tutte le permission
  const getAllPermissions = (impact: ItemTypeConfigurationMigrationImpactDto): SelectablePermissionImpact[] => {
    return [
      ...impact.fieldOwnerPermissions,
      ...impact.statusOwnerPermissions,
      ...impact.fieldStatusPermissions,
      ...impact.executorPermissions,
    ];
  };

  // Statistiche calcolate (solo permission con ruoli, aggregate da tutti gli impatti)
  const stats = useMemo(() => {
    if (impacts.length === 0) {
      return {
        preservable: 0,
        removable: 0,
        new: 0,
        withRoles: 0,
        selected: 0,
        selectedWithRoles: 0,
        configurationsCount: 0,
      };
    }

    const permissionsWithRoles = getPermissionsWithRolesFromAllImpacts();
    const preservable = permissionsWithRoles.filter(({ permission }) => permission.canBePreserved).length;
    const removable = permissionsWithRoles.filter(({ permission }) => !permission.canBePreserved).length;
    const withRoles = permissionsWithRoles.length;
    
    let selected = 0;
    let selectedWithRoles = 0;
    
    for (const { impact, permission } of permissionsWithRoles) {
      const preservedSet = preservedPermissionIdsMap.get(impact.itemTypeConfigurationId);
      if (preservedSet && preservedSet.has(permission.permissionId)) {
        selected++;
        selectedWithRoles++;
      }
    }

    const totalNew = impacts.reduce((sum, impact) => sum + impact.totalNewPermissions, 0);

    return {
      preservable,
      removable,
      new: totalNew,
      withRoles,
      selected,
      selectedWithRoles,
      configurationsCount: impacts.length,
    };
  }, [impacts, preservedPermissionIdsMap]);

  // Funzione helper per generare il nome della permission
  const getPermissionName = (perm: SelectablePermissionImpact): string => {
    switch (perm.permissionType) {
      case 'FIELD_OWNERS':
        return `Field Owner - ${perm.fieldName || perm.entityName || 'N/A'}`;
      case 'STATUS_OWNERS':
        return `Status Owner - ${perm.entityName || 'N/A'}`;
      case 'FIELD_EDITORS':
      case 'EDITORS':
        return `Editor - ${perm.fieldName || 'N/A'} @ ${perm.workflowStatusName || 'N/A'}`;
      case 'FIELD_VIEWERS':
      case 'VIEWERS':
        return `Viewer - ${perm.fieldName || 'N/A'} @ ${perm.workflowStatusName || 'N/A'}`;
      case 'EXECUTORS':
        // Formato: Executor - <stato_partenza>-><stato_arrivo> (<nome_transition>)
        const fromStatus = perm.fromStatusName || 'N/A';
        const toStatus = perm.toStatusName || 'N/A';
        const transitionName = perm.transitionName;
        const transitionPart = transitionName ? ` (${transitionName})` : '';
        return `Executor - ${fromStatus} -> ${toStatus}${transitionPart}`;
      default:
        return `${perm.permissionType} - ${perm.itemTypeSetName || 'N/A'}`;
    }
  };

  // Funzione per esportare il report completo in CSV
  const handleExportFullReport = async () => {
    if (impacts.length === 0) return;

    // Raccogli tutte le permission con assegnazioni da tutti gli impatti
    const allPermissions: PermissionData[] = [];
    
    impacts.forEach(impact => {
      const allImpactPermissions = [
        ...(impact.fieldOwnerPermissions || []).filter(p => p.hasAssignments),
        ...(impact.statusOwnerPermissions || []).filter(p => p.hasAssignments),
        ...(impact.fieldStatusPermissions || []).filter(p => p.hasAssignments),
        ...(impact.executorPermissions || []).filter(p => p.hasAssignments)
      ].map(perm => {
        // Per FIELD_OWNERS: il backend popola entityName con il nome del Field, non fieldName
        // Per EDITORS/VIEWERS: il backend popola fieldName
        let fieldName: string | null = null;
        if (perm.permissionType === 'FIELD_OWNERS') {
          fieldName = perm.fieldName || perm.entityName || null;
        } else if (
          perm.permissionType === 'FIELD_EDITORS' ||
          perm.permissionType === 'FIELD_VIEWERS' ||
          perm.permissionType === 'EDITORS' ||
          perm.permissionType === 'VIEWERS'
        ) {
          fieldName = perm.fieldName || null;
        }
        
        return {
          permissionId: perm.permissionId,
          permissionType: perm.permissionType || 'N/A',
          itemTypeSetName: perm.itemTypeSetName || 'N/A',
          fieldName,
          statusName: perm.entityName && perm.permissionType === 'STATUS_OWNERS' ? perm.entityName : null,
          workflowStatusName: perm.workflowStatusName || null,
          fromStatusName: perm.fromStatusName || null,
          toStatusName: perm.toStatusName || null,
          transitionName: perm.transitionName || null,
          assignedRoles: perm.assignedRoles || [],
          grantId: perm.grantId || null,
          roleId: perm.roleId || null,
          projectGrants: perm.projectGrants || [],
          projectAssignedRoles: perm.projectAssignedRoles || [],
          canBePreserved: perm.canBePreserved
        };
      });
      
      allPermissions.push(...allImpactPermissions);
    });

    // Funzioni per estrarre i nomi (specifiche per Migration report)
    // Usa fieldName se disponibile e non vuoto
    const getFieldName = (perm: PermissionData) => {
      const fieldName = perm.fieldName?.trim();
      return escapeCSV(fieldName && fieldName.length > 0 ? fieldName : '');
    };
    const getStatusName = (perm: PermissionData) => escapeCSV(perm.statusName || perm.workflowStatusName || '');
    const getTransitionName = (perm: PermissionData) => {
      // La formattazione viene gestita automaticamente dalla utility usando fromStatusName/toStatusName
      return '';
    };

    // Raccogli tutti gli ID delle permission preservate da tutti gli impatti
    const allPreservedPermissionIds = new Set<number>();
    preservedPermissionIdsMap.forEach((preservedSet) => {
      preservedSet.forEach((permissionId) => {
        allPreservedPermissionIds.add(permissionId);
      });
    });

    // Usa la utility unificata
    await exportImpactReportToCSV({
      permissions: allPermissions,
      preservedPermissionIds: allPreservedPermissionIds,
      getFieldName,
      getStatusName,
      getTransitionName,
      fileName: `itemtypeconfiguration_migration_report_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.csv`
    });
  };

  // Renderizza una sezione di permission (solo quelle con ruoli) per una configurazione specifica
  const renderPermissionSection = (
    title: string,
    icon: string,
    impact: ItemTypeConfigurationMigrationImpactDto,
    permissions: SelectablePermissionImpact[],
    renderEntityInfo: (perm: SelectablePermissionImpact) => React.ReactNode
  ) => {
    // Filtra solo le permission con ruoli assegnati
    const permissionsWithRoles = permissions.filter(p => p.hasAssignments);
    
    if (permissionsWithRoles.length === 0) {
      return null;
    }

    const preservedSet = preservedPermissionIdsMap.get(impact.itemTypeConfigurationId) || new Set<number>();
    const canPreserveCount = permissionsWithRoles.filter(p => p.canBePreserved).length;
    const selectedInSection = permissionsWithRoles.filter(p => preservedSet.has(p.permissionId)).length;

    return (
      <div style={{
        backgroundColor: '#f0fdf4',
        border: '1px solid #10b981',
        borderRadius: '6px',
        padding: '16px',
        marginTop: '1.5rem',
        marginBottom: '24px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.5rem', color: '#1f2937' }}>
            {title} ({permissionsWithRoles.length} con ruoli)
          </h3>
          <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
            {selectedInSection} / {canPreserveCount} preservabili selezionate
          </div>
        </div>
        <div style={{ overflowX: 'auto', maxHeight: '400px', overflowY: 'auto' }}>
          <table style={{ 
            width: '100%', 
            borderCollapse: 'collapse',
            fontSize: '0.875rem'
          }}>
            <thead>
              <tr style={{ backgroundColor: '#f0fdf4', color: '#1f2937' }}>
                <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: '600', borderBottom: '2px solid #10b981', width: '120px' }}>
                  Azione
                </th>
                <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: '600', borderBottom: '2px solid #10b981' }}>
                  Permission
                </th>
                <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: '600', borderBottom: '2px solid #10b981' }}>
                  ItemTypeSet
                </th>
                <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: '600', borderBottom: '2px solid #10b981' }}>
                  Match nel nuovo stato
                </th>
                <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: '600', borderBottom: '2px solid #10b981' }}>
                  Grant Globali
                </th>
                <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: '600', borderBottom: '2px solid #10b981' }}>
                  Grant di Progetto
                </th>
              </tr>
            </thead>
            <tbody>
              {permissionsWithRoles.map((perm, idx) => {
                const preservedSet = preservedPermissionIdsMap.get(impact.itemTypeConfigurationId) || new Set<number>();
                const isSelected = preservedSet.has(perm.permissionId);
                const canPreserve = perm.canBePreserved;
                const rolesCount = perm.assignedRoles?.length || 0;
                const hasGlobalGrant = perm.grantId != null;
                const projectEntriesMap = new Map<string, {
                  projectId?: number | null;
                  projectName?: string | null;
                  roles: string[];
                  grant?: ProjectGrantInfo;
                }>();

                if (Array.isArray((perm as any).projectAssignedRoles)) {
                  ((perm as any).projectAssignedRoles as Array<{ projectId?: number | null; projectName?: string | null; roles?: string[] }>).forEach(projectRole => {
                    const key = `${projectRole.projectId ?? 'null'}::${projectRole.projectName ?? 'N/A'}`;
                    const existing = projectEntriesMap.get(key) ?? {
                      projectId: projectRole.projectId,
                      projectName: projectRole.projectName,
                      roles: [],
                      grant: undefined
                    };
                    if (Array.isArray(projectRole.roles)) {
                      existing.roles = [
                        ...existing.roles,
                        ...projectRole.roles.filter(Boolean)
                      ];
                    }
                    projectEntriesMap.set(key, existing);
                  });
                }

                if (perm.projectGrants) {
                  perm.projectGrants.forEach((pg) => {
                    const key = `${pg.projectId ?? 'null'}::${pg.projectName ?? 'N/A'}`;
                    const existing = projectEntriesMap.get(key) ?? {
                      projectId: pg.projectId,
                      projectName: pg.projectName,
                      roles: [],
                      grant: undefined
                    };
                    existing.grant = pg;
                    projectEntriesMap.set(key, existing);
                  });
                }

                const projectEntries = Array.from(projectEntriesMap.values());
                const hasProjectAssignments = projectEntries.some(entry => entry.roles.length > 0 || entry.grant);

                return (
                  <tr
                    key={`${impact.itemTypeConfigurationId}-${perm.permissionId}`}
                    style={{
                      borderBottom: '1px solid #d1fae5',
                      backgroundColor: isSelected && canPreserve ? '#dcfce7' : (idx % 2 === 0 ? '#ffffff' : '#f0fdf4'),
                      opacity: !canPreserve ? 0.7 : 1,
                    }}
                  >
                    <td style={{ padding: '10px 12px' }}>
                      <span
                        onClick={() => {
                          if (canPreserve && !loading) {
                            togglePermission(impact.itemTypeConfigurationId, perm.permissionId);
                          }
                        }}
                        style={{
                          padding: '0.25rem 0.5rem',
                          borderRadius: '0.25rem',
                          fontSize: '0.75rem',
                          fontWeight: '600',
                          backgroundColor: isSelected && canPreserve ? '#d1fae5' : '#fee2e2',
                          color: isSelected && canPreserve ? '#059669' : '#dc2626',
                          cursor: canPreserve && !loading ? 'pointer' : 'not-allowed',
                          display: 'inline-block',
                          userSelect: 'none',
                          transition: 'background-color 0.2s, color 0.2s',
                        }}
                        onMouseEnter={(e) => {
                          if (canPreserve && !loading) {
                            e.currentTarget.style.opacity = '0.8';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (canPreserve && !loading) {
                            e.currentTarget.style.opacity = '1';
                          }
                        }}
                      >
                        {isSelected && canPreserve ? '✓ Preserva' : '✗ Rimuovi'}
                      </span>
                    </td>
                    <td style={{ padding: '10px 12px', fontWeight: '500', color: '#1f2937' }}>
                      {getPermissionName(perm)}
                    </td>
                    <td style={{ padding: '10px 12px', color: '#4b5563' }}>
                      {perm.itemTypeSetName || 'N/A'}
                    </td>
                    <td style={{ padding: '10px 12px', color: '#4b5563' }}>
                      {canPreserve && perm.matchingEntityName ? (
                        <span style={{ color: '#059669', fontSize: '0.875rem' }}>
                          ✓ {perm.matchingEntityName}
                        </span>
                      ) : (
                        <span style={{ color: '#dc2626', fontSize: '0.875rem' }}>✗ Rimosso</span>
                      )}
                    </td>
                    <td style={{ padding: '10px 12px', color: '#4b5563' }}>
                      {(rolesCount === 0 && (!hasGlobalGrant || !perm.permissionId || !perm.permissionType)) ? (
                        <span style={{ color: '#9ca3af', fontSize: '0.75rem' }}>—</span>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.75rem' }}>
                          {rolesCount > 0 && (
                            <span
                              onClick={() => setSelectedRolesDetails({
                                permissionName: getPermissionName(perm),
                                roles: perm.assignedRoles || []
                              })}
                              style={{
                                cursor: 'pointer',
                                color: '#2563eb',
                                textDecoration: 'underline',
                                fontWeight: '500'
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
                          {hasGlobalGrant && perm.permissionId && perm.permissionType && (
                            <span
                              onClick={async () => {
                                setLoadingGrantDetails(true);
                                try {
                                  const response = await api.get(
                                    `/permission-assignments/${perm.permissionType}/${perm.permissionId}`
                                  );
                                  const assignment = response.data;
                                  setSelectedGrantDetails({
                                    projectId: 0,
                                    projectName: 'Globale',
                                    roleId: perm.permissionId,
                                    details: assignment.grant || {}
                                  });
                                } catch (error) {
                                  alert('Errore nel recupero dei dettagli della grant globale');
                                } finally {
                                  setLoadingGrantDetails(false);
                                }
                              }}
                              style={{
                                cursor: 'pointer',
                                color: '#2563eb',
                                textDecoration: 'underline',
                                fontWeight: '500'
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
                      )}
                    </td>
                    <td style={{ padding: '10px 12px', color: '#4b5563' }}>
                      {hasProjectAssignments ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.75rem' }}>
                          {projectEntries.flatMap((entry, entryIdx) => {
                            const displayName = entry.projectName || 'Progetto N/A';
                            const nodes: React.ReactNode[] = [];

                            if (entry.roles.length > 0) {
                              nodes.push(
                                <span
                                  key={`proj-role-${entryIdx}`}
                                  onClick={() => setSelectedRolesDetails({
                                    permissionName: `${getPermissionName(perm)} — ${displayName}`,
                                    roles: entry.roles
                                  })}
                                  style={{
                                    cursor: 'pointer',
                                    color: '#2563eb',
                                    textDecoration: 'underline',
                                    fontWeight: '500'
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

                            if (entry.grant) {
                              nodes.push(
                                <span
                                  key={`proj-grant-${entryIdx}`}
                                  onClick={async () => {
                                    if (!perm.permissionId || !perm.permissionType) {
                                      alert('Permission senza permissionId o permissionType');
                                      return;
                                    }
                                    setLoadingGrantDetails(true);
                                    try {
                                      const response = await api.get(
                                        `/project-permission-assignments/${perm.permissionType}/${perm.permissionId}/project/${entry.grant?.projectId}`
                                      );
                                      const assignment = response.data;
                                      setSelectedGrantDetails({
                                        projectId: entry.grant?.projectId ?? 0,
                                        projectName: entry.grant?.projectName ?? 'Progetto',
                                        roleId: perm.permissionId, // Manteniamo per compatibilità con il popup
                                        details: assignment.grant || {}
                                      });
                                    } catch (error) {
                                      alert('Errore nel recupero dei dettagli della grant');
                                    } finally {
                                      setLoadingGrantDetails(false);
                                    }
                                  }}
                                  style={{
                                    cursor: 'pointer',
                                    color: '#2563eb',
                                    textDecoration: 'underline',
                                    fontWeight: '500'
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

  // Renderizza info entità per FieldOwner
  const renderFieldOwnerInfo = (perm: SelectablePermissionImpact) => (
    <div>
      <strong>Field:</strong> {perm.entityName}
      {perm.itemTypeSetName && (
        <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
          ItemTypeSet: {perm.itemTypeSetName}
        </div>
      )}
    </div>
  );

  // Renderizza info entità per StatusOwner
  const renderStatusOwnerInfo = (perm: SelectablePermissionImpact) => (
    <div>
      <strong>WorkflowStatus:</strong> {perm.entityName}
      {perm.itemTypeSetName && (
        <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
          ItemTypeSet: {perm.itemTypeSetName}
        </div>
      )}
    </div>
  );

  // Renderizza info entità per FieldStatus
  const renderFieldStatusInfo = (perm: SelectablePermissionImpact) => (
    <div>
      <strong>Field:</strong> {perm.fieldName} | <strong>Status:</strong> {perm.workflowStatusName}
      <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
        Tipo: {perm.permissionType}
        {perm.itemTypeSetName && ` • ItemTypeSet: ${perm.itemTypeSetName}`}
      </div>
    </div>
  );

  // Renderizza info entità per Executor
  const renderExecutorInfo = (perm: SelectablePermissionImpact) => (
    <div>
      <strong>Transition:</strong> {perm.entityName}
      {perm.itemTypeSetName && (
        <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
          ItemTypeSet: {perm.itemTypeSetName}
        </div>
      )}
    </div>
  );

  if (!isOpen || impacts.length === 0) return null;

  return (
    <div 
      className={form.modalOverlay}
      onClick={onClose}
      style={{ 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        right: 0, 
        bottom: 0, 
        backgroundColor: 'rgba(0, 0, 0, 0.5)', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        zIndex: 1000
      }}
    >
      <div 
        className={form.modalContent}
        onClick={(e) => e.stopPropagation()}
        style={{ 
          backgroundColor: 'white',
          borderRadius: '8px',
          padding: '24px',
          maxWidth: '90vw',
          maxHeight: '90vh',
          overflow: 'auto',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          position: 'relative'
        }}
      >
        {/* Header */}
        <div style={{ marginBottom: '24px', borderBottom: '2px solid #e5e7eb', paddingBottom: '16px' }}>
          <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937' }}>
            📊 Report Impatto Modifica ItemTypeSet
          </h2>
          <p style={{ margin: '8px 0 0 0', color: '#6b7280', fontSize: '0.9rem' }}>
            {impacts.length === 1 ? (
              <>
                {impacts[0].itemTypeSetName || 'N/A'} - {impacts[0].itemTypeName}
              </>
            ) : (
              <>
                <strong>{impacts.length} configurazioni</strong> modificate
              </>
            )}
          </p>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            style={{
              position: 'absolute',
              top: '24px',
              right: '24px',
              background: 'none',
              border: 'none',
              fontSize: '1.5rem',
              cursor: 'pointer',
              color: '#6b7280',
              padding: '4px 8px'
            }}
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className={form.modalBody}>
          {/* Informazioni sui cambiamenti */}
          <div className={layout.section}>
            <h3 className={layout.sectionTitle}>📋 Modifiche in corso ({stats.configurationsCount} configurazioni)</h3>
            <div className={form.infoGrid}>
              {impacts.map((impact, idx) => (
                <div key={impact.itemTypeConfigurationId} style={{ gridColumn: '1 / -1', marginBottom: '0.5rem', padding: '0.75rem', backgroundColor: '#f9fafb', borderRadius: '4px' }}>
                  <strong>Configurazione {idx + 1}:</strong> {impact.itemTypeName}
                  {impact.fieldSetChanged && (
                    <div style={{ fontSize: '0.875rem', marginTop: '0.25rem' }}>
                      <strong>FieldSet:</strong> {impact.oldFieldSet?.fieldSetName} → {impact.newFieldSet?.fieldSetName}
                    </div>
                  )}
                  {impact.workflowChanged && (
                    <div style={{ fontSize: '0.875rem', marginTop: '0.25rem' }}>
                      <strong>Workflow:</strong> {impact.oldWorkflow?.workflowName} → {impact.newWorkflow?.workflowName}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Azioni rapide (solo se ci sono permission con ruoli) */}
          {stats.withRoles > 0 && (
            <div className={layout.section} style={{ backgroundColor: '#f9fafb', padding: '1rem', borderRadius: '8px' }}>
              <h3 className={layout.sectionTitle} style={{ marginBottom: '0.5rem' }}>⚡ Azioni Rapide</h3>
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className={`${buttons.button} ${buttons.buttonSuccess}`}
                  onClick={handlePreserveAllPreservable}
                  disabled={loading || stats.preservable === 0}
                  style={{ backgroundColor: preserveAllPreservable ? '#059669' : undefined }}
                >
                  ✓ Mantieni Tutto Mantenibile ({stats.preservable})
                </button>
                <button
                  type="button"
                  className={`${buttons.button} ${buttons.buttonDanger}`}
                  onClick={handleRemoveAll}
                  disabled={loading}
                  style={{ backgroundColor: removeAll ? '#dc2626' : undefined }}
                >
                  🗑️ Rimuovi Tutto
                </button>
              </div>
            </div>
          )}


          {/* Sezioni permission (solo quelle con ruoli assegnati) - una per ogni configurazione */}
          {impacts.map((impact, impactIdx) => (
            <div key={impact.itemTypeConfigurationId} style={{ marginTop: '2rem' }}>
              <h2 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1rem', color: '#1e3a8a' }}>
                Configurazione {impactIdx + 1}: {impact.itemTypeName}
              </h2>
              
              {renderPermissionSection(
                'Permission Field Owner',
                '',
                impact,
                impact.fieldOwnerPermissions,
                renderFieldOwnerInfo
              )}

              {renderPermissionSection(
                'Permission Status Owner',
                '',
                impact,
                impact.statusOwnerPermissions,
                renderStatusOwnerInfo
              )}

              {renderPermissionSection(
                'Permission Field Status',
                '',
                impact,
                impact.fieldStatusPermissions,
                renderFieldStatusInfo
              )}

              {renderPermissionSection(
                'Permission Executor',
                '',
                impact,
                impact.executorPermissions,
                renderExecutorInfo
              )}
            </div>
          ))}

          {/* Messaggio informativo se non ci sono permission con ruoli */}
          {stats.withRoles === 0 && (
            <div className={alert.infoContainer} style={{ marginTop: '1.5rem' }}>
              <h4>ℹ️ Nessuna permission con ruoli</h4>
              <p>
                Non ci sono permission con ruoli assegnati interessate da questa modifica. 
                Le permission vuote verranno gestite automaticamente.
              </p>
            </div>
          )}

          {/* Warning */}
          {stats.withRoles > 0 && stats.selectedWithRoles < stats.withRoles && (
            <div style={{
              backgroundColor: '#fee2e2',
              border: '1px solid #fca5a5',
              borderRadius: '6px',
              padding: '12px',
              marginBottom: '20px'
            }}>
              <p style={{ margin: 0, fontSize: '0.875rem', color: '#991b1b' }}>
                ⚠️ <strong>Attenzione:</strong> Confermando questa modifica, le permission elencate verranno cancellate definitivamente.
              </p>
            </div>
          )}
        </div>

        {/* Footer con pulsanti */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', paddingTop: '16px', borderTop: '1px solid #e5e7eb' }}>
          <button
            onClick={handleExportFullReport}
            style={{
              padding: '8px 16px',
              backgroundColor: '#f3f4f6',
              color: '#374151',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: '500'
            }}
          >
            📥 Esporta Report
          </button>
          <button
            onClick={onClose}
            style={{
              padding: '8px 16px',
              backgroundColor: '#f3f4f6',
              color: '#374151',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: '500'
            }}
          >
            Annulla
          </button>
          <button
            onClick={async () => {
              // Chiedi se esportare il report prima di confermare solo se ci sono permission con assegnazioni
              const hasPermissionsWithAssignments = stats.withRoles > 0;
              
              if (hasPermissionsWithAssignments) {
                const shouldExport = window.confirm(
                  'Vuoi esportare il report prima di confermare la modifica?'
                );
                
                if (shouldExport) {
                  await handleExportFullReport();
                }
              }
              
              // Converti Map<number, Set<number>> in Map<number, number[]>
              // IMPORTANTE: Includi tutte le configurazioni con modifiche, anche se non hanno permission selezionate
              const mapForConfirm = new Map<number, number[]>();
              
              // Per ogni impatto, aggiungi la configurazione anche se non ha permission selezionate
              impacts.forEach(impact => {
                const preservedSet = preservedPermissionIdsMap.get(impact.itemTypeConfigurationId);
                mapForConfirm.set(
                  impact.itemTypeConfigurationId,
                  preservedSet ? Array.from(preservedSet) : []
                );
              });
              
              onConfirm(mapForConfirm);
            }}
            disabled={loading}
            style={{
              padding: '8px 16px',
              backgroundColor: (stats.withRoles > 0 && stats.selectedWithRoles < stats.withRoles) ? '#dc2626' : '#059669',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '0.875rem',
              fontWeight: '600',
              opacity: loading ? 0.6 : 1
            }}
          >
            {loading ? 'Elaborazione...' : 'Conferma e Salva'}
          </button>
        </div>
      </div>

      {/* Modal for roles details */}
      {selectedRolesDetails && (
        <div 
          className={form.modalOverlay}
          onClick={() => setSelectedRolesDetails(null)}
          style={{ 
            position: 'fixed', 
            top: 0, 
            left: 0, 
            right: 0, 
            bottom: 0, 
            backgroundColor: 'rgba(0, 0, 0, 0.5)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            zIndex: 10001
          }}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: 'white',
              borderRadius: '8px',
              padding: '24px',
              maxWidth: '600px',
              width: '90%',
              maxHeight: '80vh',
              overflowY: 'auto'
            }}
          >
            <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '16px' }}>
              Dettagli Ruoli - {selectedRolesDetails.permissionName}
            </h2>
            
            <div>
              {selectedRolesDetails.roles && selectedRolesDetails.roles.length > 0 ? (
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '8px', color: '#374151' }}>
                    Ruoli Assegnati ({selectedRolesDetails.roles.length})
                  </h3>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {selectedRolesDetails.roles.map((role: string, idx: number) => (
                      <span key={idx} style={{
                        padding: '4px 8px',
                        backgroundColor: '#dbeafe',
                        borderRadius: '4px',
                        fontSize: '0.875rem',
                        fontWeight: '500'
                      }}>
                        {role}
                      </span>
                    ))}
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '20px', color: '#6b7280' }}>
                  Nessun ruolo assegnato
                </div>
              )}
            </div>
            
            <div style={{ marginTop: '24px', textAlign: 'right' }}>
              <button
                onClick={() => setSelectedRolesDetails(null)}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#6b7280',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: '600'
                }}
              >
                Chiudi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal for grant details */}
      {selectedGrantDetails && (
        <div 
          className={form.modalOverlay}
          onClick={() => setSelectedGrantDetails(null)}
          style={{ 
            position: 'fixed', 
            top: 0, 
            left: 0, 
            right: 0, 
            bottom: 0, 
            backgroundColor: 'rgba(0, 0, 0, 0.5)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            zIndex: 10001
          }}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: 'white',
              borderRadius: '8px',
              padding: '24px',
              maxWidth: '600px',
              width: '90%',
              maxHeight: '80vh',
              overflowY: 'auto'
            }}
          >
            <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '16px' }}>
              Dettagli Grant - {selectedGrantDetails.projectName}
            </h2>
            
            {loadingGrantDetails ? (
              <div style={{ textAlign: 'center', padding: '20px' }}>Caricamento...</div>
            ) : selectedGrantDetails.details ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>
                {/* Utenti */}
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '8px', color: '#374151' }}>
                    Utenti ({selectedGrantDetails.details.users?.length || 0})
                  </h3>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', minHeight: '40px' }}>
                    {selectedGrantDetails.details.users && selectedGrantDetails.details.users.length > 0 ? (
                      selectedGrantDetails.details.users.map((user: any, idx: number) => (
                        <span key={idx} style={{
                          padding: '4px 8px',
                          backgroundColor: '#dbeafe',
                          borderRadius: '4px',
                          fontSize: '0.875rem'
                        }}>
                          {user.username || user.email || `User #${user.id}`}
                        </span>
                      ))
                    ) : (
                      <span style={{ color: '#9ca3af', fontSize: '0.875rem' }}>Nessuno</span>
                    )}
                  </div>
                </div>
                
                {/* Gruppi */}
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '8px', color: '#374151' }}>
                    Gruppi ({selectedGrantDetails.details.groups?.length || 0})
                  </h3>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', minHeight: '40px' }}>
                    {selectedGrantDetails.details.groups && selectedGrantDetails.details.groups.length > 0 ? (
                      selectedGrantDetails.details.groups.map((group: any, idx: number) => (
                        <span key={idx} style={{
                          padding: '4px 8px',
                          backgroundColor: '#d1fae5',
                          borderRadius: '4px',
                          fontSize: '0.875rem'
                        }}>
                          {group.name || `Group #${group.id}`}
                        </span>
                      ))
                    ) : (
                      <span style={{ color: '#9ca3af', fontSize: '0.875rem' }}>Nessuno</span>
                    )}
                  </div>
                </div>
                
                {/* Utenti negati */}
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '8px', color: '#dc2626' }}>
                    Utenti negati ({selectedGrantDetails.details.negatedUsers?.length || 0})
                  </h3>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', minHeight: '40px' }}>
                    {selectedGrantDetails.details.negatedUsers && selectedGrantDetails.details.negatedUsers.length > 0 ? (
                      selectedGrantDetails.details.negatedUsers.map((user: any, idx: number) => (
                        <span key={idx} style={{
                          padding: '4px 8px',
                          backgroundColor: '#fee2e2',
                          borderRadius: '4px',
                          fontSize: '0.875rem'
                        }}>
                          {user.username || user.email || `User #${user.id}`}
                        </span>
                      ))
                    ) : (
                      <span style={{ color: '#9ca3af', fontSize: '0.875rem' }}>Nessuno</span>
                    )}
                  </div>
                </div>
                
                {/* Gruppi negati */}
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '8px', color: '#dc2626' }}>
                    Gruppi negati ({selectedGrantDetails.details.negatedGroups?.length || 0})
                  </h3>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', minHeight: '40px' }}>
                    {selectedGrantDetails.details.negatedGroups && selectedGrantDetails.details.negatedGroups.length > 0 ? (
                      selectedGrantDetails.details.negatedGroups.map((group: any, idx: number) => (
                        <span key={idx} style={{
                          padding: '4px 8px',
                          backgroundColor: '#fee2e2',
                          borderRadius: '4px',
                          fontSize: '0.875rem'
                        }}>
                          {group.name || `Group #${group.id}`}
                        </span>
                      ))
                    ) : (
                      <span style={{ color: '#9ca3af', fontSize: '0.875rem' }}>Nessuno</span>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '20px', color: '#dc2626' }}>
                Errore nel caricamento dei dettagli
              </div>
            )}
            
            <div style={{ marginTop: '24px', textAlign: 'right' }}>
              <button
                onClick={() => setSelectedGrantDetails(null)}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#6b7280',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: '600'
                }}
              >
                Chiudi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

