/**
 * WorkflowImpactManager Component
 * 
 * Gestisce i report di impatto per le modifiche ai workflow
 * Usa sempre i modals enhanced (nuovo formato)
 */

import React from 'react';
import { UseWorkflowEditorReturn } from '../../../types/workflow-unified.types';
import { StatusEnhancedImpactReportModal } from '../../../components/StatusEnhancedImpactReportModal';
import { TransitionEnhancedImpactReportModal } from '../../../components/TransitionEnhancedImpactReportModal';
import type { StatusRemovalImpactDto } from '../../../types/status-impact.types';
import type { TransitionRemovalImpactDto } from '../../../types/transition-impact.types';

interface WorkflowImpactManagerProps {
  workflowEditor: UseWorkflowEditorReturn;
  onConfirmRemoval: () => Promise<void>;
  onCancelRemoval: () => void;
}

export const WorkflowImpactManager: React.FC<WorkflowImpactManagerProps> = ({
  workflowEditor,
  onConfirmRemoval,
  onCancelRemoval,
}) => {
  const { state, impactReport, enhancedImpactDto, showImpactReport } = workflowEditor;

  const isStatusImpactDto = (
    dto: StatusRemovalImpactDto | TransitionRemovalImpactDto | null
  ): dto is StatusRemovalImpactDto => !!dto && 'statusOwnerPermissions' in dto;

  const isTransitionImpactDto = (
    dto: StatusRemovalImpactDto | TransitionRemovalImpactDto | null
  ): dto is TransitionRemovalImpactDto => !!dto && 'executorPermissions' in dto;

  if (!showImpactReport || !impactReport) {
    return null;
  }

  // Il DTO enhanced deve essere sempre disponibile
  if (!enhancedImpactDto) {
    return null;
  }

  // Determina il tipo di report e mostra il modal appropriato
  if (impactReport.type === 'status' && isStatusImpactDto(enhancedImpactDto)) {
    // Status removal - usa StatusEnhancedImpactReportModal
    return (
      <StatusEnhancedImpactReportModal
        isOpen={showImpactReport}
        onClose={onCancelRemoval}
        onConfirm={() => onConfirmRemoval()}
        impact={enhancedImpactDto}
        loading={state.ui.analyzingImpact || state.ui.saving}
      />
    );
  } else if (impactReport.type === 'transition' && isTransitionImpactDto(enhancedImpactDto)) {
    // Transition removal - usa TransitionEnhancedImpactReportModal
    return (
      <TransitionEnhancedImpactReportModal
        isOpen={showImpactReport}
        onClose={onCancelRemoval}
        onConfirm={() => onConfirmRemoval()}
        impact={enhancedImpactDto}
        loading={state.ui.analyzingImpact || state.ui.saving}
      />
    );
  }

  // Se il tipo non corrisponde, non mostra nulla
  return null;
};

