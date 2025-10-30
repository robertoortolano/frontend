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
      title: `📊 Permission interessate dalla rimozione`,
      // Rimuoviamo riepilogo, elementi rimossi e itemTypeSet coinvolti per essenzialità
      summaryItems: [],
      tableSections: [
        ...permissions.map(permission => {
          // Determine if this permission section is for transitions (executor) or statuses (statusOwner)
          const isTransitionPermission = permission.type === 'executor' || permission.type === 'EXECUTORS' || permission.type === 'executors';
          const columnHeader = isTransitionPermission ? 'Transizione' : 'Status';
          
          return {
          title: `Permission ${permission.type}`,
          icon: '🔐',
          columns: [
            { 
              header: 'ItemTypeSet', 
              key: 'itemTypeSetName',
              render: (value) => (
                <span style={{ whiteSpace: 'nowrap' }}>{value}</span>
              )
            },
            { 
              header: columnHeader,
              key: 'itemName',
              tdStyle: { whiteSpace: 'normal', overflow: 'visible', textOverflow: 'clip', wordBreak: 'normal' },
              render: (_value, row) => {
                const name: string | undefined = row.itemName;
                
                // Use permission type to determine rendering logic, not data.type
                if (isTransitionPermission) {
                  // For transitions, prioritize fromStatusName/toStatusName (backend fields)
                  let source: string | undefined = row.fromStatusName || row.sourceStatusName || row.sourceName || row.source;
                  let target: string | undefined = row.toStatusName || row.targetStatusName || row.targetName || row.target;
                  
                  // Extract clean name (remove parenthesized info if present)
                  let cleanName: string | undefined = name;
                  let extractedSource: string | undefined;
                  let extractedTarget: string | undefined;
                  
                  // ALWAYS extract from parentheses if present, even if we have backend fields
                  // This ensures we handle cases where backend doesn't provide separate fields
                  if (name && name.includes('(') && name.includes(')')) {
                    const open = name.indexOf('(');
                    const close = name.lastIndexOf(')');
                    cleanName = name.substring(0, open).trim();
                    const inside = name.substring(open + 1, close).trim();
                    
                    // Try to parse "A -> B" or "A → B" from parentheses
                    // Support multiple arrow formats: "->", "→", "->", etc.
                    const arrowMatch = inside.match(/(.+?)\s*(->|→|-&gt;)\s*(.+)/);
                    if (arrowMatch) {
                      extractedSource = arrowMatch[1].trim();
                      extractedTarget = arrowMatch[3].trim();
                    }
                  }
                  
                  // Use extracted source/target if backend fields are not available
                  // But prefer backend fields if both are available
                  if (!source && extractedSource) source = extractedSource;
                  if (!target && extractedTarget) target = extractedTarget;
                  
                  const hasFlow = Boolean(source && target);
                  
                  // Case 1: clean name present and source/target available
                  if (cleanName && hasFlow) {
                    return (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <div style={{ whiteSpace: 'nowrap' }}>{cleanName}</div>
                        <div style={{ color: '#6b7280', fontSize: '0.85em', whiteSpace: 'nowrap' }}>{source} → {target}</div>
                      </div>
                    );
                  }
                  
                  // Case 2: clean name present but no source/target (fallback: show extracted if available)
                  if (cleanName && !hasFlow && extractedSource && extractedTarget) {
                    return (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <div style={{ whiteSpace: 'nowrap' }}>{cleanName}</div>
                        <div style={{ color: '#6b7280', fontSize: '0.85em', whiteSpace: 'nowrap' }}>{extractedSource} → {extractedTarget}</div>
                      </div>
                    );
                  }
                  
                  // Case 3: clean name but no source/target info at all
                  if (cleanName && !hasFlow) {
                    return <span>{cleanName}</span>;
                  }
                  
                  // Case 4: no name, but source/target available
                  if (!cleanName && hasFlow) {
                    return <span>{source} → {target}</span>;
                  }
                  
                  // Fallback: show original name or dash
                  return <span>{name || '-'}</span>;
                }
                // For status type keep single line
                return <span>{name}</span>;
              }
            },
            { 
              header: 'Categoria', 
              key: 'itemCategory',
              render: (value) => value || '—'
            },
            { 
              header: 'Ruoli', 
              key: 'assignedRoles',
              tdStyle: { whiteSpace: 'normal' },
              render: (value) => {
                const roles = Array.isArray(value) ? value : [];
                return roles.length > 0 
                  ? <span>{roles.join(', ')}</span>
                  : <span style={{ color: '#9ca3af' }}>Nessuno</span>;
              }
            },
            // Column 'Popolata' removed: if the report shows up, items are populated by definition
          ],
          data: [...permission.items]
            .sort((a, b) => {
              const itsA = (a.itemTypeSetName || '').localeCompare(b.itemTypeSetName || '');
              if (itsA !== 0) return itsA;
              return (a.itemName || '').localeCompare(b.itemName || '');
            })
            .map(item => ({
              ...item,
              populated: item.hasAssignments ? 'Sì' : 'No'
            }))
        };
        })
      ],
      hasPopulatedPermissions,
      warningMessage: hasPopulatedPermissions 
        ? `La rimozione comporterà la cancellazione di permission con ruoli assegnati. Assicurati di aver esportato il report prima di procedere.`
        : undefined,
      noImpactMessage: !hasPopulatedPermissions && data.totals.totalPermissions === 0
        ? `Questa rimozione non avrà impatto sulle permission esistenti.`
        : undefined
    };
  };

  const genericData = convertToGenericFormat(impactReport);
  
  // Check if this is a summary report before saving
  const isSummaryReport = state.ui.pendingSave;
  
  // Update title and button text for summary report
  if (isSummaryReport) {
    genericData.title = `📊 Permission interessate prima del salvataggio`;
  }

  // Adjust warning message to reflect deferred deletion behavior
  if (genericData.hasPopulatedPermissions) {
    genericData.warningMessage = isSummaryReport
      ? 'Confermando e salvando, le permission elencate verranno cancellate.'
      : 'Confermando ora non verrà cancellata alcuna permission: la cancellazione avverrà solo al salvataggio del workflow.';
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

