import React, { useMemo, useState } from 'react';
import { ItemTypeConfigurationRemovalImpactDto } from '../types/itemtypeconfiguration-impact.types';
import form from '../styles/common/Forms.module.css';
import buttons from '../styles/common/Buttons.module.css';
import api from '../api/api';
import { exportImpactReportToCSV, escapeCSV, PermissionData } from '../utils/csvExportUtils';
import { ImpactPermissionTable } from './ImpactPermissionTable';
import { useImpactPermissionSelection } from '../hooks/useImpactPermissionSelection';
import { ImpactPermissionRow, ProjectAssignmentInfo } from '../types/impact-permission.types';
import { mapImpactPermissions } from '../utils/impactPermissionMapping';

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

  const permissionRows: ImpactPermissionRow[] = useMemo(() => {
    if (!impact) {
      return [];
    }

    const permissions = [
      ...(impact.fieldOwnerPermissions || []),
      ...(impact.statusOwnerPermissions || []),
      ...(impact.fieldStatusPermissions || []),
      ...(impact.executorPermissions || []),
      ...(impact.workerPermissions || []),
      ...(impact.creatorPermissions || [])
    ];

    const getPermissionName = (perm: any): string => {
      switch (perm.permissionType) {
        case 'FIELD_OWNERS':
          return `Field Owner - ${perm.fieldName || perm.fieldConfigurationName || 'N/A'}`;
        case 'STATUS_OWNERS':
          return `Status Owner - ${perm.statusName || perm.workflowStatusName || 'N/A'}`;
        case 'FIELD_EDITORS':
        case 'EDITORS':
          return `Editor - ${perm.fieldName || perm.fieldConfigurationName || 'N/A'} @ ${perm.statusName || perm.workflowStatusName || 'N/A'}`;
        case 'FIELD_VIEWERS':
        case 'VIEWERS':
          return `Viewer - ${perm.fieldName || perm.fieldConfigurationName || 'N/A'} @ ${perm.statusName || perm.workflowStatusName || 'N/A'}`;
        case 'EXECUTORS':
          return `Executor - ${(perm.fromStatusName || 'N/A')} -> ${(perm.toStatusName || 'N/A')}${perm.transitionName ? ` (${perm.transitionName})` : ''}`;
        case 'WORKERS':
          return `Worker - ${perm.itemTypeName || 'N/A'}`;
        case 'CREATORS':
          return `Creator - ${perm.itemTypeName || 'N/A'}`;
        default:
          return `${perm.permissionType || 'Permission'} - ${perm.itemTypeSetName || 'N/A'}`;
      }
    };

    const getMatchLabel = (perm: any): string | undefined => {
      if (!(perm.canBePreserved ?? false)) {
        return undefined;
      }
      const matchParts: string[] = [];
      if (perm.matchingFieldName) {
        matchParts.push(perm.matchingFieldName);
      }
      if (perm.matchingStatusName) {
        matchParts.push(perm.matchingStatusName);
      }
      if (perm.matchingTransitionName) {
        matchParts.push(perm.matchingTransitionName);
      }
      return matchParts.length ? `✓ ${matchParts.join(' @ ')}` : undefined;
    };

    return mapImpactPermissions({
      permissions,
      getLabel: getPermissionName,
      getMatchLabel,
      fallbackItemTypeSetName: impact.itemTypeSetName || null
    });
  }, [impact]);

  const selection = useImpactPermissionSelection(permissionRows);

  // Funzione helper per mappare il tipo di permission dal formato frontend al formato backend
  const mapPermissionTypeToBackend = (permissionType: string): string => {
    const mapping: { [key: string]: string } = {
      'FIELD_OWNERS': 'FieldOwnerPermission',
      'FIELD_EDITORS': 'FieldStatusPermission',
      'FIELD_VIEWERS': 'FieldStatusPermission',
      'EDITORS': 'FieldStatusPermission', // retrocompatibilità
      'VIEWERS': 'FieldStatusPermission', // retrocompatibilità
      'STATUS_OWNERS': 'StatusOwnerPermission',
      'STATUS_OWNER': 'StatusOwnerPermission',
      'EXECUTORS': 'ExecutorPermission',
      'EXECUTOR': 'ExecutorPermission',
      'WORKERS': 'WorkerPermission',
      'CREATORS': 'CreatorPermission'
    };
    return mapping[permissionType] || permissionType;
  };

  if (!isOpen || !impact) return null;

  // Toggle per preservare/rimuovere una permission
  const togglePermission = (permissionId: number | null | undefined) => {
    if (permissionId == null) return;
    
    // setPreservedPermissionIds(prev => { // This line was removed as per the edit hint
    //   const newSet = new Set(prev);
    //   if (newSet.has(permissionId)) {
    //     newSet.delete(permissionId);
    //   } else {
    //     newSet.add(permissionId);
    //   }
    //   return newSet;
    // });
  };

  const hasPopulatedPermissions = permissionRows.length > 0;

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
      case 'FIELD_EDITORS':
      case 'EDITORS':
        return `Editor - ${perm.fieldName || perm.fieldConfigurationName || 'N/A'} @ ${perm.statusName || perm.workflowStatusName || 'N/A'}`;
      case 'FIELD_VIEWERS':
      case 'VIEWERS':
        return `Viewer - ${perm.fieldName || perm.fieldConfigurationName || 'N/A'} @ ${perm.statusName || perm.workflowStatusName || 'N/A'}`;
      case 'EXECUTORS':
        // Formato: Executor - <stato_partenza> -> <stato_arrivo> (<nome_transition>)
        const fromStatus = perm.fromStatusName || 'N/A';
        const toStatus = perm.toStatusName || 'N/A';
        const transitionName = perm.transitionName;
        const transitionPart = transitionName ? ` (${transitionName})` : '';
        return `Executor - ${fromStatus} -> ${toStatus}${transitionPart}`;
      case 'WORKERS':
        return `Worker - ${perm.itemTypeName || 'N/A'}`;
      case 'CREATORS':
        return `Creator - ${perm.itemTypeName || 'N/A'}`;
      default:
        return `${perm.permissionType} - ${perm.itemTypeSetName || 'N/A'}`;
    }
  };

  // Funzione per esportare il report completo in CSV
  const handleShowGlobalRoles = (permission: ImpactPermissionRow) => {
    if (!permission.global.roles.length) {
      return;
    }
    setSelectedRolesDetails({
      permissionName: permission.label,
      roles: permission.global.roles
    });
  };

  const handleShowProjectRoles = (permission: ImpactPermissionRow, project: ProjectAssignmentInfo) => {
    if (!project.roles.length) {
      return;
    }
    setSelectedRolesDetails({
      permissionName: `${permission.label} — ${project.projectName ?? 'Progetto'}`,
      roles: project.roles
    });
  };

  const handleShowGlobalGrant = async (permission: ImpactPermissionRow) => {
    if (!permission.global.grant || !permission.global.grant.permissionType || permission.global.grant.permissionId == null) {
      return;
    }
    setLoadingGrantDetails(true);
    try {
      const response = await api.get(
        `/permission-assignments/${permission.global.grant.permissionType}/${permission.global.grant.permissionId}`
      );
      const assignment = response.data;
      setSelectedGrantDetails({
        projectId: 0,
        projectName: 'Globale',
        roleId: permission.global.grant.permissionId,
        details: assignment.grant || {}
      });
    } catch (error) {
      console.error('Errore nel recupero dei dettagli della grant globale:', error);
      alert('Errore nel recupero dei dettagli della grant globale');
    } finally {
      setLoadingGrantDetails(false);
    }
  };

  const handleShowProjectGrant = async (permission: ImpactPermissionRow, project: ProjectAssignmentInfo) => {
    if (!project.grant || !project.grant.permissionType || project.grant.permissionId == null || project.grant.projectId == null) {
      alert('Errore nel recupero dei dettagli della grant');
      return;
    }
    setLoadingGrantDetails(true);
    try {
      const response = await api.get(
        `/project-permission-assignments/${project.grant.permissionType}/${project.grant.permissionId}/project/${project.grant.projectId}`
      );
      const assignment = response.data;
      setSelectedGrantDetails({
        projectId: project.grant.projectId ?? 0,
        projectName: project.projectName ?? 'Progetto',
        roleId: project.grant.permissionId,
        details: assignment.grant || {}
      });
    } catch (error) {
      console.error('Errore nel recupero dei dettagli della grant di progetto:', error);
      alert('Errore nel recupero dei dettagli della grant');
    } finally {
      setLoadingGrantDetails(false);
    }
  };

  const handleExportFullReport = async () => {
    if (!impact) return;

    // Raccogli tutte le permission con assegnazioni
    const allPermissions = [
      ...(impact.fieldOwnerPermissions || []).filter(p => p.hasAssignments),
      ...(impact.statusOwnerPermissions || []).filter(p => p.hasAssignments),
      ...(impact.fieldStatusPermissions || []).filter(p => p.hasAssignments),
      ...(impact.executorPermissions || []).filter(p => p.hasAssignments),
      ...(impact.workerPermissions || []).filter(p => p.hasAssignments),
      ...(impact.creatorPermissions || []).filter(p => p.hasAssignments)
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
      projectAssignedRoles: perm.projectAssignedRoles,
      canBePreserved: perm.canBePreserved
    }));

    // Funzioni per estrarre i nomi (specifiche per ItemTypeConfiguration report)
    const getFieldName = (perm: PermissionData) => escapeCSV(perm.fieldName || '');
    const getStatusName = (perm: PermissionData) => escapeCSV(perm.statusName || '');
    const getTransitionName = () => ''; // La formattazione viene gestita automaticamente dalla utility usando fromStatusName/toStatusName

    // Usa la utility unificata
    await exportImpactReportToCSV({
      permissions: allPermissions,
      preservedPermissionIds: selection.preservedIds,
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
        <ImpactPermissionTable
          permissions={permissionRows}
          selection={selection}
          loading={loading || loadingGrantDetails}
          onShowGlobalRoles={handleShowGlobalRoles}
          onShowGlobalGrant={handleShowGlobalGrant}
          onShowProjectRoles={handleShowProjectRoles}
          onShowProjectGrant={handleShowProjectGrant}
        />

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
              
              const preservedIds = Array.from(selection.preservedIds);
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


