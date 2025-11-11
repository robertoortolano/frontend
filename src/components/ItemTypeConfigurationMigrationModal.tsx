import React, { useCallback, useState } from 'react';
import {
  ItemTypeConfigurationMigrationImpactDto,
  ProjectGrantInfo,
  SelectablePermissionImpact,
} from '../types/item-type-configuration-migration.types';
import form from '../styles/common/Forms.module.css';
import buttons from '../styles/common/Buttons.module.css';
import api from '../api/api';
import {
  exportImpactReportToCSV,
  escapeCSV,
  PermissionData,
} from '../utils/csvExportUtils';
import { useItemTypeConfigurationMigrationWizard } from '../hooks/useItemTypeConfigurationMigrationWizard';
import { OverviewStep } from './itemTypeConfigurationMigrationWizard/OverviewStep';
import { PermissionsStep } from './itemTypeConfigurationMigrationWizard/PermissionsStep';
import { ReviewStep } from './itemTypeConfigurationMigrationWizard/ReviewStep';
import { WizardStepsIndicator } from './itemTypeConfigurationMigrationWizard/WizardStepsIndicator';

interface ItemTypeConfigurationMigrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (preservePermissionIdsMap: Map<number, number[]>) => void;
  impacts: ItemTypeConfigurationMigrationImpactDto[];
  loading?: boolean;
}

export const ItemTypeConfigurationMigrationModal: React.FC<
  ItemTypeConfigurationMigrationModalProps
> = ({ isOpen, onClose, onConfirm, impacts, loading = false }) => {
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

  const {
    steps,
    currentStep,
    currentStepIndex,
    goToStep,
    goNext,
    goPrevious,
    isFirstStep,
    isLastStep,
    preservedPermissionIdsMap,
    handlePreserveAllPreservable,
    handleRemoveAll,
    togglePermission,
    preserveAllPreservableActive,
    removeAllActive,
    stats,
    getPermissionsForImpact,
    getPermissionName,
  } = useItemTypeConfigurationMigrationWizard(impacts, { isOpen });

  const handleShowRolesDetails = useCallback(
    (payload: { permissionName: string; roles: string[] }) => {
      setSelectedRolesDetails(payload);
    },
    []
  );

  const handleRequestGlobalGrantDetails = useCallback(
    async (permission: SelectablePermissionImpact) => {
      if (!permission.permissionId || !permission.permissionType) {
        window.alert('Permission senza permissionId o permissionType');
        return;
      }
      setLoadingGrantDetails(true);
      try {
        const response = await api.get(
          `/permission-assignments/${permission.permissionType}/${permission.permissionId}`
        );
        const assignment = response.data;
        setSelectedGrantDetails({
          projectId: 0,
          projectName: 'Globale',
          roleId: permission.permissionId,
          details: assignment.grant || {},
        });
      } catch (error) {
        window.alert('Errore nel recupero dei dettagli della grant globale');
      } finally {
        setLoadingGrantDetails(false);
      }
    },
    []
  );

  const handleRequestProjectGrantDetails = useCallback(
    async (
      permission: SelectablePermissionImpact,
      projectGrant: ProjectGrantInfo
    ) => {
      if (!permission.permissionId || !permission.permissionType) {
        window.alert('Permission senza permissionId o permissionType');
        return;
      }
      if (!projectGrant.projectId) {
        window.alert('Grant di progetto senza projectId');
        return;
      }
      setLoadingGrantDetails(true);
      try {
        const response = await api.get(
          `/project-permission-assignments/${permission.permissionType}/${permission.permissionId}/project/${projectGrant.projectId}`
        );
        const assignment = response.data;
        setSelectedGrantDetails({
          projectId: projectGrant.projectId,
          projectName: projectGrant.projectName ?? 'Progetto',
          roleId: permission.permissionId,
          details: assignment.grant || {},
        });
      } catch (error) {
        window.alert('Errore nel recupero dei dettagli della grant');
      } finally {
        setLoadingGrantDetails(false);
      }
    },
    []
  );

  const handleExportFullReport = useCallback(async () => {
    if (impacts.length === 0) {
      return;
    }

    const permissionsForExport: PermissionData[] = [];

    impacts.forEach((impact) => {
      const permissionsWithAssignments = getPermissionsForImpact(impact).filter(
        (permission) => permission.hasAssignments
      );

      permissionsWithAssignments.forEach((permission) => {
        let fieldName: string | null = null;
        if (permission.permissionType === 'FIELD_OWNERS') {
          fieldName = permission.fieldName || permission.entityName || null;
        } else if (
          permission.permissionType === 'FIELD_EDITORS' ||
          permission.permissionType === 'FIELD_VIEWERS' ||
          permission.permissionType === 'EDITORS' ||
          permission.permissionType === 'VIEWERS'
        ) {
          fieldName = permission.fieldName || null;
        }

        permissionsForExport.push({
          permissionId: permission.permissionId,
          permissionType: permission.permissionType || 'N/A',
          itemTypeSetName: permission.itemTypeSetName || 'N/A',
          fieldName,
          statusName:
            permission.permissionType === 'STATUS_OWNERS'
              ? permission.entityName || null
              : null,
          workflowStatusName: permission.workflowStatusName || null,
          fromStatusName: permission.fromStatusName || null,
          toStatusName: permission.toStatusName || null,
          transitionName: permission.transitionName || null,
          assignedRoles: permission.assignedRoles || [],
          grantId: permission.grantId || null,
          roleId: permission.roleId || null,
          projectGrants: permission.projectGrants || [],
          projectAssignedRoles: (permission as any).projectAssignedRoles || [],
          canBePreserved: permission.canBePreserved,
        });
      });
    });

    const getFieldName = (permission: PermissionData) => {
      const fieldName = permission.fieldName?.trim();
      return escapeCSV(fieldName && fieldName.length > 0 ? fieldName : '');
    };
    const getStatusName = (permission: PermissionData) =>
      escapeCSV(permission.statusName || permission.workflowStatusName || '');
    const getTransitionName = () => '';

    const allPreservedPermissionIds = new Set<number>();
    preservedPermissionIdsMap.forEach((preservedSet) => {
      preservedSet.forEach((permissionId) => {
        allPreservedPermissionIds.add(permissionId);
      });
    });

    await exportImpactReportToCSV({
      permissions: permissionsForExport,
      preservedPermissionIds: allPreservedPermissionIds,
      getFieldName,
      getStatusName,
      getTransitionName,
      fileName: `itemtypeconfiguration_migration_report_${new Date()
        .toISOString()
        .slice(0, 19)
        .replace(/:/g, '-')}.csv`,
    });
  }, [getPermissionsForImpact, impacts, preservedPermissionIdsMap]);

  const handleConfirm = useCallback(async () => {
    if (stats.withRoles > 0) {
      const shouldExport = window.confirm(
        'Vuoi esportare il report prima di confermare la modifica?'
      );
      if (shouldExport) {
        await handleExportFullReport();
      }
    }

    const mapForConfirm = new Map<number, number[]>();
    impacts.forEach((impact) => {
      const preservedSet = preservedPermissionIdsMap.get(
        impact.itemTypeConfigurationId
      );
      mapForConfirm.set(
        impact.itemTypeConfigurationId,
        preservedSet ? Array.from(preservedSet) : []
      );
    });

    onConfirm(mapForConfirm);
  }, [handleExportFullReport, impacts, onConfirm, preservedPermissionIdsMap, stats.withRoles]);

  const renderStepContent = () => {
    switch (currentStep.id) {
      case 'overview':
        return (
          <OverviewStep
            impacts={impacts}
            stats={stats}
            preserveAllPreservableActive={preserveAllPreservableActive}
            removeAllActive={removeAllActive}
            onPreserveAllPreservable={handlePreserveAllPreservable}
            onRemoveAll={handleRemoveAll}
            actionsDisabled={loading}
          />
        );
      case 'permissions':
        return (
          <PermissionsStep
            impacts={impacts}
            preservedPermissionIdsMap={preservedPermissionIdsMap}
            getPermissionName={getPermissionName}
            togglePermission={togglePermission}
            loading={loading}
            stats={stats}
            onShowRolesDetails={handleShowRolesDetails}
            onRequestGlobalGrantDetails={handleRequestGlobalGrantDetails}
            onRequestProjectGrantDetails={handleRequestProjectGrantDetails}
          />
        );
      case 'review':
      default:
        return <ReviewStep stats={stats} />;
    }
  };

  if (!isOpen || impacts.length === 0) {
    return null;
  }

  return (
    <>
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
          zIndex: 1000,
        }}
      >
        <div
          className={form.modalContent}
          onClick={(event) => event.stopPropagation()}
          style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '24px',
            maxWidth: '90vw',
            maxHeight: '90vh',
            overflow: 'auto',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            position: 'relative',
          }}
        >
          <div
            style={{
              marginBottom: '24px',
              borderBottom: '2px solid #e5e7eb',
              paddingBottom: '16px',
            }}
          >
            <h2
              style={{
                margin: 0,
                fontSize: '1.5rem',
                fontWeight: 'bold',
                color: '#1f2937',
              }}
            >
              📊 Report Impatto Modifica ItemTypeSet
            </h2>
            <p
              style={{
                margin: '8px 0 0 0',
                color: '#6b7280',
                fontSize: '0.9rem',
              }}
            >
              {impacts.length === 1 ? (
                <>
                  {impacts[0].itemTypeSetName || 'N/A'} -{' '}
                  {impacts[0].itemTypeName}
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
                padding: '4px 8px',
              }}
            >
              ✕
            </button>
          </div>

          <div className={form.modalBody}>
            <WizardStepsIndicator
              steps={steps}
              currentIndex={currentStepIndex}
              onStepSelect={(index) => {
                if (index <= currentStepIndex) {
                  goToStep(index);
                }
              }}
            />
            {renderStepContent()}
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '12px',
              paddingTop: '16px',
              borderTop: '1px solid #e5e7eb',
              marginTop: '1.5rem',
            }}
          >
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={handleExportFullReport}
                className={buttons.button}
                style={{
                  backgroundColor: '#f3f4f6',
                  color: '#374151',
                  border: '1px solid #d1d5db',
                }}
              >
                📥 Esporta Report
              </button>
              <button
                onClick={onClose}
                className={buttons.button}
                style={{
                  backgroundColor: '#f3f4f6',
                  color: '#374151',
                  border: '1px solid #d1d5db',
                }}
              >
                Annulla
              </button>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              {!isFirstStep && (
                <button
                  onClick={goPrevious}
                  className={buttons.button}
                  style={{
                    backgroundColor: '#e5e7eb',
                    color: '#1f2937',
                    border: '1px solid #cbd5f5',
                  }}
                >
                  ← Indietro
                </button>
              )}
              {!isLastStep && (
                <button
                  onClick={goNext}
                  className={buttons.button}
                  style={{
                    backgroundColor: '#1d4ed8',
                    color: '#ffffff',
                    border: '1px solid #1e40af',
                  }}
                  disabled={loading}
                >
                  Avanti →
                </button>
              )}
              {isLastStep && (
                <button
                  onClick={handleConfirm}
                  disabled={loading}
                  className={buttons.button}
                  style={{
                    backgroundColor:
                      stats.withRoles > 0 && stats.selectedWithRoles < stats.withRoles
                        ? '#dc2626'
                        : '#059669',
                    color: '#ffffff',
                    border: 'none',
                    opacity: loading ? 0.6 : 1,
                    cursor: loading ? 'not-allowed' : 'pointer',
                    fontWeight: 600,
                  }}
                >
                  {loading ? 'Elaborazione...' : 'Conferma e Salva'}
                </button>
              )}
            </div>
          </div>
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
            zIndex: 10001,
          }}
        >
          <div
            onClick={(event) => event.stopPropagation()}
            style={{
              backgroundColor: 'white',
              borderRadius: '8px',
              padding: '24px',
              maxWidth: '600px',
              width: '90%',
              maxHeight: '80vh',
              overflowY: 'auto',
            }}
          >
            <h2
              style={{
                fontSize: '1.25rem',
                fontWeight: '600',
                marginBottom: '16px',
              }}
            >
              Dettagli Ruoli - {selectedRolesDetails.permissionName}
            </h2>

            <div>
              {selectedRolesDetails.roles &&
              selectedRolesDetails.roles.length > 0 ? (
                <div>
                  <h3
                    style={{
                      fontSize: '1rem',
                      fontWeight: '600',
                      marginBottom: '8px',
                      color: '#374151',
                    }}
                  >
                    Ruoli Assegnati ({selectedRolesDetails.roles.length})
                  </h3>
                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '8px',
                    }}
                  >
                    {selectedRolesDetails.roles.map((role: string, idx: number) => (
                      <span
                        key={idx}
                        style={{
                          padding: '4px 8px',
                          backgroundColor: '#dbeafe',
                          borderRadius: '4px',
                          fontSize: '0.875rem',
                          fontWeight: '500',
                        }}
                      >
                        {role}
                      </span>
                    ))}
                  </div>
                </div>
              ) : (
                <div
                  style={{
                    textAlign: 'center',
                    padding: '20px',
                    color: '#6b7280',
                  }}
                >
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
                  fontWeight: '600',
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
            zIndex: 10001,
          }}
        >
          <div
            onClick={(event) => event.stopPropagation()}
            style={{
              backgroundColor: 'white',
              borderRadius: '8px',
              padding: '24px',
              maxWidth: '600px',
              width: '90%',
              maxHeight: '80vh',
              overflowY: 'auto',
            }}
          >
            <h2
              style={{
                fontSize: '1.25rem',
                fontWeight: '600',
                marginBottom: '16px',
              }}
            >
              Dettagli Grant - {selectedGrantDetails.projectName}
            </h2>

            {loadingGrantDetails ? (
              <div style={{ textAlign: 'center', padding: '20px' }}>
                Caricamento...
              </div>
            ) : selectedGrantDetails.details ? (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '20px',
                }}
              >
                <div>
                  <h3
                    style={{
                      fontSize: '1rem',
                      fontWeight: '600',
                      marginBottom: '8px',
                      color: '#374151',
                    }}
                  >
                    Utenti ({selectedGrantDetails.details.users?.length || 0})
                  </h3>
                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '8px',
                      minHeight: '40px',
                    }}
                  >
                    {selectedGrantDetails.details.users &&
                    selectedGrantDetails.details.users.length > 0 ? (
                      selectedGrantDetails.details.users.map(
                        (user: any, idx: number) => (
                          <span
                            key={idx}
                            style={{
                              padding: '4px 8px',
                              backgroundColor: '#dbeafe',
                              borderRadius: '4px',
                              fontSize: '0.875rem',
                            }}
                          >
                            {user.username ||
                              user.email ||
                              `User #${user.id}`}
                          </span>
                        )
                      )
                    ) : (
                      <span style={{ color: '#9ca3af', fontSize: '0.875rem' }}>
                        Nessuno
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <h3
                    style={{
                      fontSize: '1rem',
                      fontWeight: '600',
                      marginBottom: '8px',
                      color: '#374151',
                    }}
                  >
                    Gruppi ({selectedGrantDetails.details.groups?.length || 0})
                  </h3>
                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '8px',
                      minHeight: '40px',
                    }}
                  >
                    {selectedGrantDetails.details.groups &&
                    selectedGrantDetails.details.groups.length > 0 ? (
                      selectedGrantDetails.details.groups.map(
                        (group: any, idx: number) => (
                          <span
                            key={idx}
                            style={{
                              padding: '4px 8px',
                              backgroundColor: '#d1fae5',
                              borderRadius: '4px',
                              fontSize: '0.875rem',
                            }}
                          >
                            {group.name || `Group #${group.id}`}
                          </span>
                        )
                      )
                    ) : (
                      <span style={{ color: '#9ca3af', fontSize: '0.875rem' }}>
                        Nessuno
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <h3
                    style={{
                      fontSize: '1rem',
                      fontWeight: '600',
                      marginBottom: '8px',
                      color: '#dc2626',
                    }}
                  >
                    Utenti negati (
                    {selectedGrantDetails.details.negatedUsers?.length || 0})
                  </h3>
                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '8px',
                      minHeight: '40px',
                    }}
                  >
                    {selectedGrantDetails.details.negatedUsers &&
                    selectedGrantDetails.details.negatedUsers.length > 0 ? (
                      selectedGrantDetails.details.negatedUsers.map(
                        (user: any, idx: number) => (
                          <span
                            key={idx}
                            style={{
                              padding: '4px 8px',
                              backgroundColor: '#fee2e2',
                              borderRadius: '4px',
                              fontSize: '0.875rem',
                            }}
                          >
                            {user.username ||
                              user.email ||
                              `User #${user.id}`}
                          </span>
                        )
                      )
                    ) : (
                      <span style={{ color: '#9ca3af', fontSize: '0.875rem' }}>
                        Nessuno
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <h3
                    style={{
                      fontSize: '1rem',
                      fontWeight: '600',
                      marginBottom: '8px',
                      color: '#dc2626',
                    }}
                  >
                    Gruppi negati (
                    {selectedGrantDetails.details.negatedGroups?.length || 0})
                  </h3>
                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '8px',
                      minHeight: '40px',
                    }}
                  >
                    {selectedGrantDetails.details.negatedGroups &&
                    selectedGrantDetails.details.negatedGroups.length > 0 ? (
                      selectedGrantDetails.details.negatedGroups.map(
                        (group: any, idx: number) => (
                          <span
                            key={idx}
                            style={{
                              padding: '4px 8px',
                              backgroundColor: '#fee2e2',
                              borderRadius: '4px',
                              fontSize: '0.875rem',
                            }}
                          >
                            {group.name || `Group #${group.id}`}
                          </span>
                        )
                      )
                    ) : (
                      <span style={{ color: '#9ca3af', fontSize: '0.875rem' }}>
                        Nessuno
                      </span>
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
                  fontWeight: '600',
                }}
              >
                Chiudi
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

