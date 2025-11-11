import React from 'react';
import alertStyles from '../../styles/common/Alerts.module.css';
import {
  ItemTypeConfigurationWizardStats,
  ItemTypeConfigurationWizardStep,
} from '../../hooks/useItemTypeConfigurationMigrationWizard';

interface ReviewStepProps {
  stats: ItemTypeConfigurationWizardStats;
}

const StatCard: React.FC<{ label: string; value: number; accent?: string }> = ({
  label,
  value,
  accent = '#1f2937',
}) => (
  <div
    style={{
      backgroundColor: '#f9fafb',
      padding: '1rem',
      borderRadius: '8px',
      border: '1px solid #e5e7eb',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.25rem',
    }}
  >
    <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>{label}</span>
    <strong style={{ fontSize: '1.25rem', color: accent }}>{value}</strong>
  </div>
);

export const ReviewStep: React.FC<ReviewStepProps> = ({ stats }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
          gap: '1rem',
        }}
      >
        <StatCard label="Permessi con ruoli" value={stats.withRoles} />
        <StatCard
          label="Permessi preservabili"
          value={stats.preservable}
          accent="#059669"
        />
        <StatCard
          label="Permessi non preservabili"
          value={stats.removable}
          accent="#dc2626"
        />
        <StatCard
          label="Nuovi permessi generati"
          value={stats.new}
          accent="#1d4ed8"
        />
        <StatCard
          label="Permessi selezionati"
          value={stats.selectedWithRoles}
          accent="#2563eb"
        />
      </div>

      {stats.withRoles === 0 && (
        <div className={alertStyles.infoContainer}>
          <h4>ℹ️ Nessuna permission con ruoli</h4>
          <p>
            Non ci sono permission con ruoli assegnati interessate da questa
            migrazione. La conferma procederà senza richiedere ulteriori
            interventi.
          </p>
        </div>
      )}

      {stats.withRoles > 0 && stats.selectedWithRoles < stats.withRoles && (
        <div
          style={{
            backgroundColor: '#fee2e2',
            border: '1px solid #fca5a5',
            borderRadius: '6px',
            padding: '12px',
          }}
        >
          <p style={{ margin: 0, fontSize: '0.875rem', color: '#991b1b' }}>
            ⚠️ <strong>Attenzione:</strong> Confermando questa modifica, le
            permission non selezionate verranno cancellate definitivamente. Usa
            l'esportazione del report per archiviare i dettagli prima di
            procedere.
          </p>
        </div>
      )}
    </div>
  );
};


