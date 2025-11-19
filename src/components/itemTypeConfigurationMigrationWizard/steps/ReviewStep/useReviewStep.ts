import { useMemo } from 'react';
import { ItemTypeConfigurationWizardStats } from '../../../../hooks/useItemTypeConfigurationMigrationWizard';

interface ReviewCard {
  label: string;
  value: number;
  accent: string;
}

export const useReviewStep = (stats: ItemTypeConfigurationWizardStats) => {
  const cards = useMemo<ReviewCard[]>(() => {
    return [
      {
        label: 'Permessi con ruoli',
        value: stats.withRoles,
        accent: '#1f2937',
      },
      {
        label: 'Permessi preservabili',
        value: stats.preservable,
        accent: '#059669',
      },
      {
        label: 'Permessi non preservabili',
        value: stats.removable,
        accent: '#dc2626',
      },
      {
        label: 'Nuovi permessi generati',
        value: stats.new,
        accent: '#1d4ed8',
      },
      {
        label: 'Permessi selezionati',
        value: stats.selectedWithRoles,
        accent: '#2563eb',
      },
    ];
  }, [stats.new, stats.preservable, stats.removable, stats.selectedWithRoles, stats.withRoles]);

  const showNoRolesMessage = stats.withRoles === 0;
  const showRemovalWarning =
    stats.withRoles > 0 && stats.selectedWithRoles < stats.withRoles;

  return {
    cards,
    showNoRolesMessage,
    showRemovalWarning,
  };
};


















