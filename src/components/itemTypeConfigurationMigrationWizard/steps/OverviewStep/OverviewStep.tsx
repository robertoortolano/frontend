import React from 'react';
import layout from '../../../../styles/common/Layout.module.css';
import form from '../../../../styles/common/Forms.module.css';
import buttons from '../../../../styles/common/Buttons.module.css';
import { ItemTypeConfigurationMigrationImpactDto } from '../../../../types/item-type-configuration-migration.types';
import { ItemTypeConfigurationWizardStats } from '../../../../hooks/useItemTypeConfigurationMigrationWizard';

interface OverviewStepProps {
  impacts: ItemTypeConfigurationMigrationImpactDto[];
  stats: ItemTypeConfigurationWizardStats;
  preserveAllPreservableActive: boolean;
  removeAllActive: boolean;
  onPreserveAllPreservable: () => void;
  onRemoveAll: () => void;
  actionsDisabled?: boolean;
}

export const OverviewStep: React.FC<OverviewStepProps> = ({
  impacts,
  stats,
  preserveAllPreservableActive,
  removeAllActive,
  onPreserveAllPreservable,
  onRemoveAll,
  actionsDisabled = false,
}) => {
  return (
    <>
      <div className={layout.section}>
        <h3 className={layout.sectionTitle}>
          📋 Modifiche in corso ({stats.configurationsCount} configurazioni)
        </h3>
        <div className={form.infoGrid}>
          {impacts.map((impact, idx) => (
            <div
              key={impact.itemTypeConfigurationId}
              style={{
                gridColumn: '1 / -1',
                marginBottom: '0.5rem',
                padding: '0.75rem',
                backgroundColor: '#f9fafb',
                borderRadius: '4px',
              }}
            >
              <strong>Configurazione {idx + 1}:</strong> {impact.itemTypeName}
              {impact.fieldSetChanged && (
                <div style={{ fontSize: '0.875rem', marginTop: '0.25rem' }}>
                  <strong>FieldSet:</strong>{' '}
                  {impact.oldFieldSet?.fieldSetName} →{' '}
                  {impact.newFieldSet?.fieldSetName}
                </div>
              )}
              {impact.workflowChanged && (
                <div style={{ fontSize: '0.875rem', marginTop: '0.25rem' }}>
                  <strong>Workflow:</strong>{' '}
                  {impact.oldWorkflow?.workflowName} →{' '}
                  {impact.newWorkflow?.workflowName}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {stats.withRoles > 0 && (
        <div
          className={layout.section}
          style={{
            backgroundColor: '#f9fafb',
            padding: '1rem',
            borderRadius: '8px',
          }}
        >
          <h3 className={layout.sectionTitle} style={{ marginBottom: '0.5rem' }}>
            ⚡ Azioni Rapide
          </h3>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              className={`${buttons.button} ${buttons.buttonSuccess}`}
              onClick={onPreserveAllPreservable}
              disabled={actionsDisabled || stats.preservable === 0}
              style={{
                backgroundColor: preserveAllPreservableActive ? '#059669' : undefined,
              }}
            >
              ✓ Mantieni Tutto Mantenibile ({stats.preservable})
            </button>
            <button
              type="button"
              className={`${buttons.button} ${buttons.buttonDanger}`}
              onClick={onRemoveAll}
              disabled={actionsDisabled}
              style={{ backgroundColor: removeAllActive ? '#dc2626' : undefined }}
            >
              🗑️ Rimuovi Tutto
            </button>
          </div>
        </div>
      )}
    </>
  );
};









