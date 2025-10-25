import React from 'react';
import { FieldSetRemovalImpactDto } from '../types/fieldset-impact.types';
import buttons from '../styles/common/Buttons.module.css';
import layout from '../styles/common/Layout.module.css';
import form from '../styles/common/Forms.module.css';

interface FieldSetImpactReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  onExport: () => void;
  impact: FieldSetRemovalImpactDto | null;
  loading?: boolean;
}

export const FieldSetImpactReportModal: React.FC<FieldSetImpactReportModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  onExport,
  impact,
  loading = false
}) => {
  if (!isOpen || !impact) return null;

  const hasPopulatedPermissions = impact.fieldOwnerPermissions.some(p => p.hasAssignments) ||
                                 impact.fieldStatusPermissions.some(p => p.hasAssignments) ||
                                 impact.itemTypeSetRoles.some(p => p.hasAssignments);

  return (
    <div className={form.modalOverlay}>
      <div className={form.modal} style={{ maxWidth: '900px', maxHeight: '80vh', overflow: 'auto' }}>
        <div className={form.modalHeader}>
          <h2 className={form.modalTitle}>
            📊 Report Impatto Rimozione FieldConfiguration
          </h2>
          <button
            type="button"
            className={form.closeButton}
            onClick={onClose}
            disabled={loading}
          >
            ✕
          </button>
        </div>

        <div className={form.modalBody}>
          {/* Summary Section */}
          <div className={layout.section}>
            <h3 className={layout.sectionTitle}>📋 Riepilogo</h3>
            <div className={form.infoGrid}>
              <div className={form.infoItem}>
                <strong>Field Set:</strong> {impact.fieldSetName}
              </div>
              <div className={form.infoItem}>
                <strong>FieldConfiguration Rimosse:</strong> {impact.removedFieldConfigurationNames.join(', ')}
              </div>
              <div className={form.infoItem}>
                <strong>ItemTypeSet Coinvolti:</strong> {impact.totalAffectedItemTypeSets}
              </div>
              <div className={form.infoItem}>
                <strong>Permissions Totali:</strong> {impact.totalFieldOwnerPermissions + impact.totalFieldStatusPermissions + impact.totalItemTypeSetRoles}
              </div>
              <div className={form.infoItem}>
                <strong>Assignments Totali:</strong> {impact.totalRoleAssignments + impact.totalGrantAssignments}
              </div>
            </div>
          </div>

          {/* Affected ItemTypeSets */}
          {impact.affectedItemTypeSets.length > 0 && (
            <div className={layout.section}>
              <h3 className={layout.sectionTitle}>🎯 ItemTypeSet Coinvolti</h3>
              <div className={form.tableContainer}>
                <table className={form.table}>
                  <thead>
                    <tr>
                      <th>Nome</th>
                      <th>Progetto</th>
                    </tr>
                  </thead>
                  <tbody>
                    {impact.affectedItemTypeSets.map((its) => (
                      <tr key={its.itemTypeSetId}>
                        <td>{its.itemTypeSetName}</td>
                        <td>{its.projectName || 'N/A'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Field Owner Permissions */}
          {impact.fieldOwnerPermissions.length > 0 && (
            <div className={layout.section}>
              <h3 className={layout.sectionTitle}>👑 Field Owner Permissions</h3>
              <div className={form.tableContainer}>
                <table className={form.table}>
                  <thead>
                    <tr>
                      <th>ItemTypeSet</th>
                      <th>FieldConfiguration</th>
                      <th>Ruoli Assegnati</th>
                      <th>Popolata</th>
                    </tr>
                  </thead>
                  <tbody>
                    {impact.fieldOwnerPermissions.map((perm) => (
                      <tr key={perm.permissionId}>
                        <td>{perm.itemTypeSetName}</td>
                        <td>{perm.fieldConfigurationName}</td>
                        <td>{perm.assignedRoles.join(', ') || 'Nessuno'}</td>
                        <td>
                          <span className={perm.hasAssignments ? form.badgeWarning : form.badgeInfo}>
                            {perm.hasAssignments ? 'Sì' : 'No'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Field Status Permissions */}
          {impact.fieldStatusPermissions.length > 0 && (
            <div className={layout.section}>
              <h3 className={layout.sectionTitle}>🔐 Field Status Permissions</h3>
              <div className={form.tableContainer}>
                <table className={form.table}>
                  <thead>
                    <tr>
                      <th>Tipo</th>
                      <th>ItemTypeSet</th>
                      <th>FieldConfiguration</th>
                      <th>WorkflowStatus</th>
                      <th>Ruoli Assegnati</th>
                      <th>Popolata</th>
                    </tr>
                  </thead>
                  <tbody>
                    {impact.fieldStatusPermissions.map((perm) => (
                      <tr key={perm.permissionId}>
                        <td>
                          <span className={form.badgePrimary}>
                            {perm.permissionType}
                          </span>
                        </td>
                        <td>{perm.itemTypeSetName}</td>
                        <td>{perm.fieldConfigurationName}</td>
                        <td>{perm.workflowStatusName || 'N/A'}</td>
                        <td>{perm.assignedRoles.join(', ') || 'Nessuno'}</td>
                        <td>
                          <span className={perm.hasAssignments ? form.badgeWarning : form.badgeInfo}>
                            {perm.hasAssignments ? 'Sì' : 'No'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Warning for Populated Permissions */}
          {hasPopulatedPermissions && (
            <div className={form.alertWarning}>
              <h4>⚠️ Attenzione!</h4>
              <p>
                Alcune delle permissions che verranno rimosse hanno ruoli o grant assegnati. 
                Questi assignments verranno eliminati definitivamente.
              </p>
            </div>
          )}

          {/* No Impact Message */}
          {!hasPopulatedPermissions && impact.totalFieldOwnerPermissions + impact.totalFieldStatusPermissions + impact.totalItemTypeSetRoles === 0 && (
            <div className={form.alertInfo}>
              <h4>ℹ️ Nessun Impatto</h4>
              <p>
                La rimozione di queste FieldConfiguration non avrà alcun impatto sulle permissions esistenti.
              </p>
            </div>
          )}
        </div>

        <div className={form.modalFooter}>
          <button
            type="button"
            className={buttons.button}
            onClick={onExport}
            disabled={loading}
          >
            📊 Esporta CSV
          </button>
          <div className={form.buttonGroup}>
            <button
              type="button"
              className={buttons.button}
              onClick={onClose}
              disabled={loading}
            >
              Annulla
            </button>
            <button
              type="button"
              className={buttons.button}
              onClick={onConfirm}
              disabled={loading}
              style={{ backgroundColor: hasPopulatedPermissions ? '#dc2626' : '#059669' }}
            >
              {loading ? 'Elaborazione...' : 'Conferma e Salva'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
