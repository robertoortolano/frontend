/**
 * WorkflowImpactManager Component
 * 
 * Extracted from WorkflowEdit.tsx to handle all impact report operations
 * Unified handling for status, transition, and fieldset impact reports
 */

import React from 'react';
import { UseWorkflowEditorReturn } from '../../types/workflow-unified.types';
import { GenericImpactReportModal } from '../../../components/GenericImpactReportModal';
import { ImpactReportData } from '../../types/workflow-unified.types';

interface WorkflowImpactManagerProps {
  workflowEditor: UseWorkflowEditorReturn;
  onConfirmRemoval: () => Promise<void>;
  onCancelRemoval: () => void;
  onExportReport: () => void;
}

export const WorkflowImpactManager: React.FC<WorkflowImpactManagerProps> = ({
  workflowEditor,
  onConfirmRemoval,
  onCancelRemoval,
  onExportReport,
}) => {
  const { state, impactReport, showImpactReport } = workflowEditor;

  if (!showImpactReport || !impactReport) {
    return null;
  }

  // Convert unified impact report to the format expected by GenericImpactReportModal
  const convertToGenericFormat = (data: ImpactReportData) => {
    // Ensure permissions array exists
    const permissions = data.permissions || [];
    const hasPopulatedPermissions = permissions.some(p => 
      p.items && p.items.some(item => item.hasAssignments)
    );

    return {
      title: `📊 Report Impatto Rimozione ${data.type === 'status' ? 'Status' : 'Transizioni'}`,
      summaryItems: [
        { label: 'Workflow', value: data.workflowName },
        { label: data.type === 'status' ? 'Status Rimossi' : 'Transizioni Rimosse', value: data.removedItems.ids.length },
        { label: 'ItemTypeSet Coinvolti', value: data.totals.affectedItemTypeSets },
        { label: 'Permission Totali', value: data.totals.totalPermissions },
        { label: 'Assegnazioni Ruoli', value: data.totals.totalRoleAssignments }
      ],
      tableSections: [
        {
          title: data.type === 'status' ? 'Status Rimossi' : 'Transizioni Rimosse',
          icon: '🗑️',
          columns: [
            { header: 'Nome', key: 'name' }
          ],
          data: data.removedItems.names.map(name => ({ name }))
        },
        {
          title: 'ItemTypeSet Coinvolti',
          icon: '📦',
          columns: [
            { header: 'Nome', key: 'name' },
            { header: 'Progetto', key: 'projectName', render: (value) => value || 'N/A' }
          ],
          data: data.affectedItemTypeSets
        },
        ...permissions.map(permission => ({
          title: `Permission ${permission.type}`,
          icon: '🔐',
          columns: [
            { header: 'ItemTypeSet', key: 'itemTypeSetName' },
            { header: data.type === 'status' ? 'Status' : 'Transizione', key: 'itemName' },
            { header: 'Categoria', key: 'itemCategory' },
            { header: 'Ruoli Assegnati', key: 'assignedRoles', render: (value) => value.join(', ') || 'Nessuno' },
            { header: 'Popolata', key: 'populated', render: (value) => (
                <span className={value === 'Sì' ? 'badge-warning' : 'badge-info'}>
                  {value}
                </span>
              )
            }
          ],
          data: permission.items.map(item => ({
            ...item,
            populated: item.hasAssignments ? 'Sì' : 'No'
          }))
        }))
      ],
      hasPopulatedPermissions,
      warningMessage: hasPopulatedPermissions 
        ? `La rimozione di questi ${data.type === 'status' ? 'Status' : 'Transizioni'} comporterà la cancellazione di permission con ruoli assegnati. Assicurati di aver esportato il report prima di procedere.`
        : undefined,
      noImpactMessage: !hasPopulatedPermissions && data.totals.totalPermissions === 0
        ? `La rimozione di questi ${data.type === 'status' ? 'Status' : 'Transizioni'} non avrà alcun impatto sulle permission esistenti.`
        : undefined
    };
  };

  const genericData = convertToGenericFormat(impactReport);
  
  // Check if this is a summary report before saving
  const isSummaryReport = state.ui.pendingSave;
  
  // Update title and button text for summary report
  if (isSummaryReport) {
    genericData.title = `📊 Report Riepilogativo Impatto Rimozioni (Prima del Salvataggio)`;
    // If there are both status and transitions, mention both
    const hasRemovedStatuses = workflowEditor.state.pendingChanges.removedNodes.length > 0;
    const hasRemovedTransitions = workflowEditor.state.pendingChanges.removedEdges.length > 0;
    if (hasRemovedStatuses && hasRemovedTransitions) {
      genericData.title = `📊 Report Riepilogativo Impatto Rimozioni Status e Transizioni (Prima del Salvataggio)`;
    } else if (hasRemovedStatuses) {
      genericData.title = `📊 Report Riepilogativo Impatto Rimozioni Status (Prima del Salvataggio)`;
    } else if (hasRemovedTransitions) {
      genericData.title = `📊 Report Riepilogativo Impatto Rimozioni Transizioni (Prima del Salvataggio)`;
    }
  }

  return (
    <GenericImpactReportModal
      isOpen={showImpactReport}
      onClose={onCancelRemoval}
      onConfirm={onConfirmRemoval}
      onExport={onExportReport}
      data={genericData}
      loading={state.ui.analyzingImpact || state.ui.saving}
      confirmButtonColor={genericData.hasPopulatedPermissions ? '#dc2626' : '#059669'}
      confirmButtonText={
        isSummaryReport
          ? (state.ui.saving ? 'Elaborazione...' : 'Conferma e Salva')
          : (state.ui.saving ? 'Elaborazione...' : 'Conferma e Rimuovi')
      }
    />
  );
};

