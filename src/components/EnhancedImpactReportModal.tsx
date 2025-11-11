import React, { useMemo, useState } from 'react';
import form from '../styles/common/Forms.module.css';
import api from '../api/api';
import { exportImpactReportToCSV, PermissionData } from '../utils/csvExportUtils';
import { ImpactPermissionTable } from './ImpactPermissionTable';
import { useImpactPermissionSelection } from '../hooks/useImpactPermissionSelection';
import { ImpactPermissionRow, ProjectAssignmentInfo } from '../types/impact-permission.types';

interface GrantDetailsState {
  projectId: number;
  projectName: string;
  roleId: number;
  details: any;
}

interface RolesDetailsState {
  permissionName: string;
  roles: string[];
}

export interface EnhancedImpactReportConfig<I> {
  title: string;
  getSubtitle: (impact: I) => string;
  buildPermissionRows: (impact: I) => ImpactPermissionRow[];
  prepareExportPermissions: (impact: I) => PermissionData[];
  getFieldName: (perm: PermissionData) => string;
  getStatusName: (perm: PermissionData) => string;
  getTransitionName: (perm: PermissionData) => string;
  exportFileName: (impact: I) => string;
}

export interface EnhancedImpactReportModalBaseProps<I> {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (preservedPermissionIds?: number[]) => void;
  impact: I | null;
  loading?: boolean;
  isProvisional?: boolean;
}

export interface EnhancedImpactReportModalProps<I>
  extends EnhancedImpactReportModalBaseProps<I> {
  config: EnhancedImpactReportConfig<I>;
}

export function EnhancedImpactReportModal<I>({
  isOpen,
  onClose,
  onConfirm,
  impact,
  loading = false,
  isProvisional = false,
  config
}: EnhancedImpactReportModalProps<I>) {
  const [selectedGrantDetails, setSelectedGrantDetails] = useState<GrantDetailsState | null>(null);
  const [loadingGrantDetails, setLoadingGrantDetails] = useState(false);
  const [selectedRolesDetails, setSelectedRolesDetails] = useState<RolesDetailsState | null>(null);

  const permissionRows: ImpactPermissionRow[] = useMemo(() => {
    if (!impact) {
      return [];
    }
    return config.buildPermissionRows(impact);
  }, [impact, config]);

  const selection = useImpactPermissionSelection(permissionRows);

  const hasPopulatedPermissions = permissionRows.length > 0;

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
    if (
      !permission.global.grant ||
      !permission.global.grant.permissionType ||
      permission.global.grant.permissionId == null
    ) {
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
    if (
      !project.grant ||
      !project.grant.permissionType ||
      project.grant.permissionId == null ||
      project.grant.projectId == null
    ) {
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
    if (!impact) {
      return;
    }

    const permissions = config.prepareExportPermissions(impact);

    await exportImpactReportToCSV({
      permissions,
      preservedPermissionIds: selection.preservedIds,
      getFieldName: config.getFieldName,
      getStatusName: config.getStatusName,
      getTransitionName: config.getTransitionName,
      fileName: config.exportFileName(impact)
    });
  };

  if (!isOpen || !impact || !hasPopulatedPermissions) {
    return null;
  }

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
        <div style={{ marginBottom: '24px', borderBottom: '2px solid #e5e7eb', paddingBottom: '16px' }}>
          <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937' }}>
            {config.title}
          </h2>
          <p style={{ margin: '8px 0 0 0', color: '#6b7280', fontSize: '0.9rem' }}>
            {config.getSubtitle(impact)}
          </p>
        </div>

        <ImpactPermissionTable
          permissions={permissionRows}
          selection={selection}
          loading={loading || loadingGrantDetails}
          onShowGlobalRoles={handleShowGlobalRoles}
          onShowGlobalGrant={handleShowGlobalGrant}
          onShowProjectRoles={handleShowProjectRoles}
          onShowProjectGrant={handleShowProjectGrant}
        />

        <div
          style={{
            backgroundColor: '#fee2e2',
            border: '1px solid #fca5a5',
            borderRadius: '6px',
            padding: '12px',
            marginBottom: '20px'
          }}
        >
          <p style={{ margin: 0, fontSize: '0.875rem', color: '#991b1b' }}>
            ⚠️ <strong>Attenzione:</strong> Confermando questa modifica, le permission elencate verranno cancellate definitivamente.
          </p>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '12px',
            paddingTop: '16px',
            borderTop: '1px solid #e5e7eb'
          }}
        >
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
              const shouldExport = window.confirm('Vuoi esportare il report prima di confermare la modifica?');

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
            {loading ? 'Elaborazione...' : isProvisional ? '✅ Conferma Rimozione' : 'Conferma e Salva'}
          </button>
        </div>
      </div>

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
                  <h3
                    style={{
                      fontSize: '1rem',
                      fontWeight: '600',
                      marginBottom: '8px',
                      color: '#374151'
                    }}
                  >
                    Ruoli Assegnati ({selectedRolesDetails.roles.length})
                  </h3>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {selectedRolesDetails.roles.map((role: string, idx: number) => (
                      <span
                        key={idx}
                        style={{
                          padding: '4px 8px',
                          backgroundColor: '#dbeafe',
                          borderRadius: '4px',
                          fontSize: '0.875rem',
                          fontWeight: '500'
                        }}
                      >
                        {role}
                      </span>
                    ))}
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '20px', color: '#6b7280' }}>Nessun ruolo assegnato</div>
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
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '8px', color: '#374151' }}>
                    Utenti ({selectedGrantDetails.details.users?.length || 0})
                  </h3>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', minHeight: '40px' }}>
                    {selectedGrantDetails.details.users && selectedGrantDetails.details.users.length > 0 ? (
                      selectedGrantDetails.details.users.map((user: any, idx: number) => (
                        <span
                          key={idx}
                          style={{
                            padding: '4px 8px',
                            backgroundColor: '#dbeafe',
                            borderRadius: '4px',
                            fontSize: '0.875rem'
                          }}
                        >
                          {user.username || user.email || `User #${user.id}`}
                        </span>
                      ))
                    ) : (
                      <span style={{ color: '#9ca3af', fontSize: '0.875rem' }}>Nessuno</span>
                    )}
                  </div>
                </div>

                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '8px', color: '#374151' }}>
                    Gruppi ({selectedGrantDetails.details.groups?.length || 0})
                  </h3>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', minHeight: '40px' }}>
                    {selectedGrantDetails.details.groups && selectedGrantDetails.details.groups.length > 0 ? (
                      selectedGrantDetails.details.groups.map((group: any, idx: number) => (
                        <span
                          key={idx}
                          style={{
                            padding: '4px 8px',
                            backgroundColor: '#d1fae5',
                            borderRadius: '4px',
                            fontSize: '0.875rem'
                          }}
                        >
                          {group.name || `Group #${group.id}`}
                        </span>
                      ))
                    ) : (
                      <span style={{ color: '#9ca3af', fontSize: '0.875rem' }}>Nessuno</span>
                    )}
                  </div>
                </div>

                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '8px', color: '#dc2626' }}>
                    Utenti negati ({selectedGrantDetails.details.negatedUsers?.length || 0})
                  </h3>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', minHeight: '40px' }}>
                    {selectedGrantDetails.details.negatedUsers &&
                    selectedGrantDetails.details.negatedUsers.length > 0 ? (
                      selectedGrantDetails.details.negatedUsers.map((user: any, idx: number) => (
                        <span
                          key={idx}
                          style={{
                            padding: '4px 8px',
                            backgroundColor: '#fee2e2',
                            borderRadius: '4px',
                            fontSize: '0.875rem'
                          }}
                        >
                          {user.username || user.email || `User #${user.id}`}
                        </span>
                      ))
                    ) : (
                      <span style={{ color: '#9ca3af', fontSize: '0.875rem' }}>Nessuno</span>
                    )}
                  </div>
                </div>

                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '8px', color: '#dc2626' }}>
                    Gruppi negati ({selectedGrantDetails.details.negatedGroups?.length || 0})
                  </h3>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', minHeight: '40px' }}>
                    {selectedGrantDetails.details.negatedGroups &&
                    selectedGrantDetails.details.negatedGroups.length > 0 ? (
                      selectedGrantDetails.details.negatedGroups.map((group: any, idx: number) => (
                        <span
                          key={idx}
                          style={{
                            padding: '4px 8px',
                            backgroundColor: '#fee2e2',
                            borderRadius: '4px',
                            fontSize: '0.875rem'
                          }}
                        >
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
}


