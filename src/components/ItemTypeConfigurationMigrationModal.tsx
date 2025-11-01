import React, { useState, useEffect, useMemo } from 'react';
import {
  ItemTypeConfigurationMigrationImpactDto,
  SelectablePermissionImpact,
} from '../types/item-type-configuration-migration.types';
import form from '../styles/common/Forms.module.css';
import layout from '../styles/common/Layout.module.css';
import buttons from '../styles/common/Buttons.module.css';
import alert from '../styles/common/Alerts.module.css';

interface ItemTypeConfigurationMigrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (preservePermissionIdsMap: Map<number, number[]>) => void;
  onExport?: () => void;
  impacts: ItemTypeConfigurationMigrationImpactDto[];
  loading?: boolean;
}

export const ItemTypeConfigurationMigrationModal: React.FC<ItemTypeConfigurationMigrationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  onExport,
  impacts,
  loading = false,
}) => {
  // Stato per le permission selezionate (preservate) per ogni configurazione
  const [preservedPermissionIdsMap, setPreservedPermissionIdsMap] = useState<Map<number, Set<number>>>(new Map());

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
      <div className={layout.section} style={{ marginTop: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
          <h3 className={layout.sectionTitle}>
            {icon} {title} ({permissionsWithRoles.length} con ruoli)
          </h3>
          <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
            {selectedInSection} / {canPreserveCount} preservabili selezionate
          </div>
        </div>
        <div className={form.tableContainer} style={{ maxHeight: '400px', overflowY: 'auto' }}>
          <table className={form.table}>
            <thead>
              <tr>
                <th style={{ width: '120px' }}>Azione</th>
                <th>Entity</th>
                <th>Match nel nuovo stato</th>
                <th>Ruoli assegnati</th>
              </tr>
            </thead>
            <tbody>
              {permissionsWithRoles.map((perm) => {
                const preservedSet = preservedPermissionIdsMap.get(impact.itemTypeConfigurationId) || new Set<number>();
                const isSelected = preservedSet.has(perm.permissionId);
                const canPreserve = perm.canBePreserved;
                const hasRoles = perm.hasAssignments;

                return (
                  <tr
                    key={`${impact.itemTypeConfigurationId}-${perm.permissionId}`}
                    style={{
                      backgroundColor: isSelected && canPreserve ? '#f0fdf4' : 'transparent',
                      opacity: !canPreserve ? 0.7 : 1,
                    }}
                  >
                    <td>
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
                    <td style={{ whiteSpace: 'nowrap' }}>
                      {renderEntityInfo(perm)}
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      {canPreserve && perm.matchingEntityName ? (
                        <span style={{ color: '#059669' }}>
                          ✓ {perm.matchingEntityName}
                        </span>
                      ) : (
                        <span style={{ color: '#dc2626' }}>✗ Rimosso</span>
                      )}
                    </td>
                    <td style={{ whiteSpace: 'normal' }}>
                      {hasRoles ? (
                        <div>
                          {perm.assignedRoles.length > 0 ? (
                            <span style={{ color: '#dc2626', fontWeight: 'bold' }}>
                              {perm.assignedRoles.join(', ')}
                            </span>
                          ) : (
                            <span style={{ color: '#9ca3af' }}>Nessuno</span>
                          )}
                        </div>
                      ) : (
                        <span style={{ color: '#9ca3af' }}>Nessuno</span>
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
    <div className={form.modalOverlay}>
      <div className={form.modal} style={{ maxWidth: '1200px', maxHeight: '90vh', overflow: 'auto' }}>
        {/* Header */}
        <div className={form.modalHeader}>
          <div>
            <h2 className={form.modalTitle}>
              📊 Gestione Permission - Migrazione Intelligente
            </h2>
            <div style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.25rem' }}>
              {impacts.length === 1 ? (
                <>
                  ItemTypeSet: <strong>{impacts[0].itemTypeSetName || 'N/A'}</strong> | 
                  ItemType: <strong>{impacts[0].itemTypeName}</strong>
                </>
              ) : (
                <>
                  <strong>{impacts.length} configurazioni</strong> modificate
                </>
              )}
            </div>
          </div>
          <button
            type="button"
            className={form.closeButton}
            onClick={onClose}
            disabled={loading}
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
                '👑',
                impact,
                impact.fieldOwnerPermissions,
                renderFieldOwnerInfo
              )}

              {renderPermissionSection(
                'Permission Status Owner',
                '🔐',
                impact,
                impact.statusOwnerPermissions,
                renderStatusOwnerInfo
              )}

              {renderPermissionSection(
                'Permission Field Status',
                '🔒',
                impact,
                impact.fieldStatusPermissions,
                renderFieldStatusInfo
              )}

              {renderPermissionSection(
                'Permission Executor',
                '⚡',
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

          {/* Warning se ci sono permission con ruoli che verranno rimosse */}
          {stats.withRoles > 0 && stats.selectedWithRoles < stats.withRoles && (
            <div className={alert.warningContainer} style={{ marginTop: '1.5rem' }}>
              <h4>⚠️ Attenzione!</h4>
              <p>
                Alcune permission con ruoli assegnati verranno rimosse. Assicurati di aver verificato le selezioni prima di confermare.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={form.modalFooter}>
          {onExport && (
            <button
              className={`${buttons.button} ${buttons.buttonSecondary}`}
              onClick={onExport}
              disabled={loading}
            >
              📥 Esporta CSV
            </button>
          )}
          <button
            className={`${buttons.button} ${buttons.buttonSecondary}`}
            onClick={onClose}
            disabled={loading}
          >
            ❌ Annulla
          </button>
          <button
            className={`${buttons.button} ${buttons.buttonPrimary}`}
            onClick={() => {
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
            style={{ backgroundColor: '#00ddd4' }}
          >
            {loading ? '⏳ Elaborazione...' : '✓ Conferma Migrazione e Salva'}
          </button>
        </div>
      </div>
    </div>
  );
};

