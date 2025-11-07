import React, { useState, useEffect } from 'react';
import { ItemTypeConfigurationRemovalImpactDto, ProjectGrantInfo } from '../types/itemtypeconfiguration-impact.types';
import form from '../styles/common/Forms.module.css';
import api from '../api/api';
import { exportImpactReportToCSV, escapeCSV, PermissionData } from '../utils/csvExportUtils';

interface ItemTypeConfigurationEnhancedImpactReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (preservedPermissionIds?: number[]) => void;
  impact: ItemTypeConfigurationRemovalImpactDto | null;
  loading?: boolean;
  isProvisional?: boolean;
}

export const ItemTypeConfigurationEnhancedImpactReportModal: React.FC<ItemTypeConfigurationEnhancedImpactReportModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  impact,
  loading = false,
  isProvisional = false
}) => {
  const [preservedPermissionIds, setPreservedPermissionIds] = useState<Set<number>>(new Set());
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

  // Funzione helper per mappare il tipo di permission dal formato frontend al formato backend
  const mapPermissionTypeToBackend = (permissionType: string): string => {
    const mapping: { [key: string]: string } = {
      'FIELD_OWNERS': 'FieldOwnerPermission',
      'EDITORS': 'FieldStatusPermission',
      'VIEWERS': 'FieldStatusPermission',
      'STATUS_OWNERS': 'StatusOwnerPermission',
      'STATUS_OWNER': 'StatusOwnerPermission',
      'EXECUTORS': 'ExecutorPermission',
      'EXECUTOR': 'ExecutorPermission',
      'WORKERS': 'WorkerPermission',
      'CREATORS': 'CreatorPermission'
    };
    return mapping[permissionType] || permissionType;
  };

  // Inizializza preservedPermissionIds con le permission che hanno defaultPreserve = true
  useEffect(() => {
    if (impact) {
      const allPermissions = [
        ...(impact.fieldOwnerPermissions || []),
        ...(impact.statusOwnerPermissions || []),
        ...(impact.fieldStatusPermissions || []),
        ...(impact.executorPermissions || [])
      ];
      
      const defaultPreserved = allPermissions
        .filter(p => p.hasAssignments && p.canBePreserved && p.defaultPreserve)
        .map(p => p.permissionId)
        .filter((id): id is number => id !== null && id !== undefined);
      
      setPreservedPermissionIds(new Set(defaultPreserved));
    } else {
      setPreservedPermissionIds(new Set());
    }
  }, [impact]);

  if (!isOpen || !impact) return null;

  // Toggle per preservare/rimuovere una permission
  const togglePermission = (permissionId: number | null | undefined) => {
    if (permissionId == null) return;
    
    setPreservedPermissionIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(permissionId)) {
        newSet.delete(permissionId);
      } else {
        newSet.add(permissionId);
      }
      return newSet;
    });
  };

  // Check if there are any permissions with assignments
  const hasPopulatedPermissions = 
    impact.fieldOwnerPermissions?.some(p => p.hasAssignments) ||
    impact.statusOwnerPermissions?.some(p => p.hasAssignments) ||
    impact.fieldStatusPermissions?.some(p => p.hasAssignments) ||
    impact.executorPermissions?.some(p => p.hasAssignments);

  if (!hasPopulatedPermissions) {
    return null;
  }

  // Funzione helper per generare il nome della permission
  const getPermissionName = (perm: any): string => {
    switch (perm.permissionType) {
      case 'FIELD_OWNERS':
        return `Field Owner - ${perm.fieldName || perm.fieldConfigurationName || 'N/A'}`;
      case 'STATUS_OWNERS':
        return `Status Owner - ${perm.statusName || perm.workflowStatusName || 'N/A'}`;
      case 'EDITORS':
        return `Editor - ${perm.fieldName || perm.fieldConfigurationName || 'N/A'} @ ${perm.statusName || perm.workflowStatusName || 'N/A'}`;
      case 'VIEWERS':
        return `Viewer - ${perm.fieldName || perm.fieldConfigurationName || 'N/A'} @ ${perm.statusName || perm.workflowStatusName || 'N/A'}`;
      case 'EXECUTORS':
        // Formato: Executor - <stato_partenza> -> <stato_arrivo> (<nome_transition>)
        const fromStatus = perm.fromStatusName || 'N/A';
        const toStatus = perm.toStatusName || 'N/A';
        const transitionName = perm.transitionName;
        const transitionPart = transitionName ? ` (${transitionName})` : '';
        return `Executor - ${fromStatus} -> ${toStatus}${transitionPart}`;
      default:
        return `${perm.permissionType} - ${perm.itemTypeSetName || 'N/A'}`;
    }
  };

  // Raccogli tutte le permission con assegnazioni
  const allPermissionsWithAssignments = [
    ...(impact.fieldOwnerPermissions || []).filter(p => p.hasAssignments),
    ...(impact.statusOwnerPermissions || []).filter(p => p.hasAssignments),
    ...(impact.fieldStatusPermissions || []).filter(p => p.hasAssignments),
    ...(impact.executorPermissions || []).filter(p => p.hasAssignments)
  ].sort((a, b) => {
    const itsCompare = (a.itemTypeSetName || '').localeCompare(b.itemTypeSetName || '');
    if (itsCompare !== 0) return itsCompare;
    const typeCompare = (a.permissionType || '').localeCompare(b.permissionType || '');
    if (typeCompare !== 0) return typeCompare;
    return (getPermissionName(a)).localeCompare(getPermissionName(b));
  });

  // Funzione per esportare il report completo in CSV
  const handleExportFullReport = async () => {
    if (!impact) return;

    // Raccogli tutte le permission con assegnazioni
    const allPermissions = [
      ...(impact.fieldOwnerPermissions || []).filter(p => p.hasAssignments),
      ...(impact.statusOwnerPermissions || []).filter(p => p.hasAssignments),
      ...(impact.fieldStatusPermissions || []).filter(p => p.hasAssignments),
      ...(impact.executorPermissions || []).filter(p => p.hasAssignments)
    ].map(perm => ({
      permissionId: perm.permissionId,
      permissionType: perm.permissionType || 'N/A',
      itemTypeSetName: perm.itemTypeSetName || 'N/A',
      fieldName: perm.fieldName || perm.fieldConfigurationName || null,
      statusName: perm.statusName || perm.workflowStatusName || null,
      fromStatusName: perm.fromStatusName || null,
      toStatusName: perm.toStatusName || null,
      transitionName: perm.transitionName || null,
      assignedRoles: perm.assignedRoles || [],
      grantId: perm.grantId,
      roleId: perm.roleId,
      projectGrants: perm.projectGrants,
      canBePreserved: perm.canBePreserved
    }));

    // Funzioni per estrarre i nomi (specifiche per ItemTypeConfiguration report)
    const getFieldName = (perm: PermissionData) => escapeCSV(perm.fieldName || '');
    const getStatusName = (perm: PermissionData) => escapeCSV(perm.statusName || '');
    const getTransitionName = () => ''; // La formattazione viene gestita automaticamente dalla utility usando fromStatusName/toStatusName

    // Usa la utility unificata
    await exportImpactReportToCSV({
      permissions: allPermissions,
      preservedPermissionIds,
      getFieldName,
      getStatusName,
      getTransitionName,
      fileName: `itemtypeconfiguration_impact_report_${impact.itemTypeSetId}_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.csv`
    });
  };

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
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
        }}
      >
        {/* Header */}
        <div style={{ marginBottom: '24px', borderBottom: '2px solid #e5e7eb', paddingBottom: '16px' }}>
          <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937' }}>
            📊 Report Impatto Modifica ItemTypeSet
          </h2>
          <p style={{ margin: '8px 0 0 0', color: '#6b7280', fontSize: '0.9rem' }}>
            {impact.itemTypeSetName}
          </p>
        </div>

        {/* Riepilogo Impatto - Tabella con una riga per permission */}
        <div style={{
          backgroundColor: '#f0fdf4',
          border: '1px solid #10b981',
          borderRadius: '6px',
          padding: '16px',
          marginBottom: '24px'
        }}>
          {allPermissionsWithAssignments.length > 0 ? (
            <div style={{ overflowX: 'auto' }}>
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
                      Ruoli
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
                  {allPermissionsWithAssignments.map((perm: any, idx: number) => {
                    const rolesCount = perm.assignedRoles?.length || 0;
                    const hasGlobalGrant = perm.grantId != null;
                    const projectGrantsCount = perm.projectGrants?.length || 0;
                    const isSelected = perm.permissionId != null && preservedPermissionIds.has(perm.permissionId);
                    const canPreserve = perm.canBePreserved ?? false;
                    
                    return (
                      <tr 
                        key={`${perm.permissionType}-${perm.permissionId}-${idx}`}
                        style={{ 
                          borderBottom: '1px solid #d1fae5',
                          backgroundColor: isSelected && canPreserve ? '#dcfce7' : (idx % 2 === 0 ? '#ffffff' : '#f0fdf4'),
                          opacity: !canPreserve ? 0.7 : 1
                        }}
                      >
                        <td style={{ padding: '10px 12px' }}>
                          <span
                            onClick={() => {
                              if (canPreserve && !loading) {
                                togglePermission(perm.permissionId);
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
                          {canPreserve && (perm.matchingFieldName || perm.matchingStatusName) ? (
                            <span style={{ color: '#059669', fontSize: '0.875rem' }}>
                              ✓ {perm.matchingFieldName || ''}
                              {perm.matchingFieldName && perm.matchingStatusName && ` @ `}
                              {perm.matchingStatusName || ''}
                            </span>
                          ) : (
                            <span style={{ color: '#dc2626', fontSize: '0.875rem' }}>✗ Rimosso</span>
                          )}
                        </td>
                        <td style={{ padding: '10px 12px', color: '#4b5563' }}>
                          {rolesCount > 0 ? (
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
                              {rolesCount} {rolesCount === 1 ? 'ruolo' : 'ruoli'}
                            </span>
                          ) : (
                            <span style={{ color: '#9ca3af' }}>—</span>
                          )}
                        </td>
                        <td style={{ padding: '10px 12px', color: '#4b5563' }}>
                          {hasGlobalGrant ? (
                            <span
                              onClick={perm.permissionId && perm.permissionType ? async () => {
                                setLoadingGrantDetails(true);
                                try {
                                  // Mappa il tipo di permission al formato backend
                                  const backendPermissionType = mapPermissionTypeToBackend(perm.permissionType);
                                  // Usa il nuovo endpoint PermissionAssignment
                                  const response = await api.get(
                                    `/permission-assignments/${backendPermissionType}/${perm.permissionId}`
                                  );
                                  const assignment = response.data;
                                  setSelectedGrantDetails({
                                    projectId: 0,
                                    projectName: 'Globale',
                                    roleId: perm.permissionId, // Manteniamo per compatibilità con il popup
                                    details: assignment.grant || {}
                                  });
                                } catch (error) {
                                  console.error('Errore nel recupero dei dettagli della grant globale:', error);
                                  alert('Errore nel recupero dei dettagli della grant globale');
                                } finally {
                                  setLoadingGrantDetails(false);
                                }
                              } : undefined}
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
                              {(perm.grantName === 'Grant diretto' ? 'Grant globale' : perm.grantName) || `Grant #${perm.grantId}`}
                            </span>
                          ) : (
                            <span style={{ color: '#9ca3af' }}>—</span>
                          )}
                        </td>
                        <td style={{ padding: '10px 12px', color: '#4b5563' }}>
                          {projectGrantsCount > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                              {perm.projectGrants?.map((pg: ProjectGrantInfo, pgIdx: number) => (
                                <span
                                  key={pgIdx}
                                  onClick={async () => {
                                    if (!perm.permissionId || !perm.permissionType) {
                                      alert('Permission senza permissionId o permissionType');
                                      return;
                                    }
                                    setLoadingGrantDetails(true);
                                    try {
                                      // Usa il nuovo endpoint ProjectPermissionAssignment
                                      const response = await api.get(
                                        `/project-permission-assignments/${mapPermissionTypeToBackend(perm.permissionType)}/${perm.permissionId}/project/${pg.projectId}`
                                      );
                                      const assignment = response.data;
                                      setSelectedGrantDetails({
                                        projectId: pg.projectId,
                                        projectName: pg.projectName,
                                        roleId: perm.permissionId, // Manteniamo per compatibilità con il popup
                                        details: assignment.assignment?.grant || {}
                                      });
                                    } catch (error) {
                                      alert('Errore nel recupero dei dettagli della grant');
                                    } finally {
                                      setLoadingGrantDetails(false);
                                    }
                                  }}
                                  style={{
                                    fontSize: '0.75rem',
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
                                  {pg.projectName}: 1 grant
                                </span>
                              ))}
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
          ) : (
            <div style={{ textAlign: 'center', padding: '20px', color: '#6b7280' }}>
              Nessuna permission con assegnazioni
            </div>
          )}
        </div>

        {hasPopulatedPermissions && (
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
              const shouldExport = window.confirm(
                'Vuoi esportare il report prima di confermare la modifica?'
              );
              
              if (shouldExport) {
                await handleExportFullReport();
              }
              
              const preservedIds = Array.from(preservedPermissionIds);
              onConfirm(preservedIds.length > 0 ? preservedIds : undefined);
            }}
            disabled={loading}
            style={{
              padding: '8px 16px',
              backgroundColor: hasPopulatedPermissions ? '#dc2626' : '#059669',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '0.875rem',
              fontWeight: '600',
              opacity: loading ? 0.6 : 1
            }}
          >
            {loading ? 'Elaborazione...' : (isProvisional ? '✅ Conferma Rimozione' : 'Conferma e Salva')}
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


