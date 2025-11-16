import React from 'react';
import alertStyles from '../../../../styles/common/Alerts.module.css';
import { ItemTypeConfigurationWizardStats } from '../../../../hooks/useItemTypeConfigurationMigrationWizard';
import { useReviewStep } from './useReviewStep';

interface ReviewStepProps {
  stats: ItemTypeConfigurationWizardStats;
}

const StatCard: React.FC<{ label: string; value: number; accent: string }> = ({
  label,
  value,
  accent,
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
  const { cards, showNoRolesMessage, showRemovalWarning } = useReviewStep(stats);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
          gap: '1rem',
        }}
      >
        {cards.map((card) => (
          <StatCard
            key={card.label}
            label={card.label}
            value={card.value}
            accent={card.accent}
          />
        ))}
      </div>

      {showNoRolesMessage && (
        <div className={alertStyles.infoContainer}>
          <h4>ℹ️ Nessuna permission con ruoli</h4>
          <p>
            Non ci sono permission con ruoli assegnati interessate da questa migrazione.
            La conferma procederà senza richiedere ulteriori interventi.
          </p>
        </div>
      )}

      {showRemovalWarning && (
        <div
          style={{
            backgroundColor: '#fee2e2',
            border: '1px solid #fca5a5',
            borderRadius: '6px',
            padding: '12px',
          }}
        >
          <p style={{ margin: 0, fontSize: '0.875rem', color: '#991b1b' }}>
            ⚠️ <strong>Attenzione:</strong> Confermando questa modifica, le permission non
            selezionate verranno cancellate definitivamente. Usa l'esportazione del report
            per archiviare i dettagli prima di procedere.
          </p>
        </div>
      )}
    </div>
  );
};














