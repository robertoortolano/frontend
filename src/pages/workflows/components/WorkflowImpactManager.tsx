/**
 * WorkflowImpactManager Component
 * 
 * Gestisce i report di impatto per le modifiche ai workflow
 * Usa sempre i modals enhanced (nuovo formato)
 */

import React from 'react';
import { UseWorkflowEditorReturn } from '../../types/workflow-unified.types';
import { StatusEnhancedImpactReportModal } from '../../../components/StatusEnhancedImpactReportModal';
import { TransitionEnhancedImpactReportModal } from '../../../components/TransitionEnhancedImpactReportModal';

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

  if (!showImpactReport || !impactReport) {
    return null;
  }

  // Il DTO enhanced deve essere sempre disponibile
  if (!enhancedImpactDto) {
    return null;
  }

  // Determina il tipo di report e mostra il modal appropriato
  if (impactReport.type === 'status' && 'statusOwnerPermissions' in enhancedImpactDto) {
    // Status removal - usa StatusEnhancedImpactReportModal
    return (
      <StatusEnhancedImpactReportModal
        isOpen={showImpactReport}
        onClose={onCancelRemoval}
        onConfirm={(preservedPermissionIds) => onConfirmRemoval()}
        impact={enhancedImpactDto}
        loading={state.ui.analyzingImpact || state.ui.saving}
      />
    );
  } else if (impactReport.type === 'transition' && 'executorPermissions' in enhancedImpactDto) {
    // Transition removal - usa TransitionEnhancedImpactReportModal
    return (
      <TransitionEnhancedImpactReportModal
        isOpen={showImpactReport}
        onClose={onCancelRemoval}
        onConfirm={(preservedPermissionIds) => onConfirmRemoval()}
        impact={enhancedImpactDto}
        loading={state.ui.analyzingImpact || state.ui.saving}
      />
    );
  }

  // Se il tipo non corrisponde, non mostra nulla
  return null;
};

