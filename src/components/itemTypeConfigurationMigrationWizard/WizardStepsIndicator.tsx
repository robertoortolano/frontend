import React from 'react';
import {
  ItemTypeConfigurationWizardStep,
  ItemTypeConfigurationWizardStepId,
} from '../../hooks/useItemTypeConfigurationMigrationWizard';

interface WizardStepsIndicatorProps {
  steps: ItemTypeConfigurationWizardStep[];
  currentIndex: number;
  onStepSelect?: (index: number, step: ItemTypeConfigurationWizardStep) => void;
}

const getStepState = (index: number, currentIndex: number) => {
  if (index < currentIndex) {
    return 'completed';
  }
  if (index === currentIndex) {
    return 'active';
  }
  return 'upcoming';
};

const getStepIcon = (
  stepId: ItemTypeConfigurationWizardStepId,
  state: 'completed' | 'active' | 'upcoming'
) => {
  const iconMap: Record<ItemTypeConfigurationWizardStepId, string> = {
    overview: '🧭',
    permissions: '🛡️',
    review: '✅',
  };

  const baseIcon = iconMap[stepId] ?? '•';
  if (state === 'completed') {
    return `✔️ ${baseIcon}`;
  }
  return baseIcon;
};

export const WizardStepsIndicator: React.FC<WizardStepsIndicatorProps> = ({
  steps,
  currentIndex,
  onStepSelect,
}) => {
  return (
    <ol
      style={{
        display: 'flex',
        gap: '1.5rem',
        listStyle: 'none',
        padding: 0,
        margin: '0 0 1.5rem 0',
        borderBottom: '1px solid #e5e7eb',
        paddingBottom: '1rem',
      }}
    >
      {steps.map((step, index) => {
        const state = getStepState(index, currentIndex);
        const isClickable = index <= currentIndex;
        return (
          <li
            key={step.id}
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.25rem',
              minWidth: '140px',
            }}
          >
            <button
              type="button"
              onClick={() => {
                if (isClickable && onStepSelect) {
                  onStepSelect(index, step);
                }
              }}
              disabled={!isClickable}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem 0.75rem',
                borderRadius: '9999px',
                border: '1px solid transparent',
                fontSize: '0.875rem',
                fontWeight: state === 'active' ? 600 : 500,
                cursor: isClickable ? 'pointer' : 'default',
                backgroundColor:
                  state === 'active'
                    ? '#1e3a8a'
                    : state === 'completed'
                    ? '#e0f2fe'
                    : '#f9fafb',
                color: state === 'active' ? '#ffffff' : '#1f2937',
                transition: 'transform 0.2s, box-shadow 0.2s',
              }}
              onMouseEnter={(event) => {
                if (isClickable) {
                  event.currentTarget.style.transform = 'translateY(-1px)';
                  event.currentTarget.style.boxShadow =
                    '0 4px 6px rgba(0, 0, 0, 0.1)';
                }
              }}
              onMouseLeave={(event) => {
                if (isClickable) {
                  event.currentTarget.style.transform = 'none';
                  event.currentTarget.style.boxShadow = 'none';
                }
              }}
            >
              <span>{getStepIcon(step.id, state)}</span>
              <span>
                {index + 1}. {step.label}
              </span>
            </button>
            {step.description && (
              <span
                style={{
                  fontSize: '0.75rem',
                  color: '#6b7280',
                  paddingLeft: '0.5rem',
                }}
              >
                {step.description}
              </span>
            )}
          </li>
        );
      })}
    </ol>
  );
};






