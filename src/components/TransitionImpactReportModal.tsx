import React from 'react';
import { TransitionRemovalImpactDto } from '../types/transition-impact.types';
import { GenericImpactReportModal, ImpactReportData } from './GenericImpactReportModal';
import form from '../styles/common/Forms.module.css';
import { buildGlobalAssignmentsLabel, buildProjectAssignmentsLabel } from '../utils/assignmentDisplayUtils';

interface TransitionImpactReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  onExport: () => void;
  impact: TransitionRemovalImpactDto | null;
  loading?: boolean;
}

export const TransitionImpactReportModal: React.FC<TransitionImpactReportModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  onExport,
  impact,
  loading = false
}) => {
  if (!impact) return null;

  const hasPopulatedPermissions = impact.executorPermissions.some(p => p.hasAssignments);

  // Prepara i dati per le tabelle
  const transitionRemovedData = impact.removedTransitionNames.map((name, index) => ({
    name: name,
    id: impact.removedTransitionIds[index]
  }));

  const itemTypeSetData = impact.affectedItemTypeSets.map(its => ({
    name: its.itemTypeSetName,
    project: its.projectName || 'N/A',
    id: its.itemTypeSetId
  }));

  const executorPermissionsData = impact.executorPermissions
    .filter(perm => perm.hasAssignments)
    .map(perm => ({
      type: perm.permissionType,
      itemTypeSet: perm.itemTypeSetName,
      transition: perm.transitionName,
      fromStatus: perm.fromStatusName,
      toStatus: perm.toStatusName,
      globalAssignments: buildGlobalAssignmentsLabel({
        assignedRoles: perm.assignedRoles,
        assignedGrants: perm.assignedGrants ?? (perm.grantName ? [perm.grantName] : undefined)
      }),
      projectAssignments: buildProjectAssignmentsLabel({
        projectAssignedRoles: perm.projectAssignedRoles,
        projectGrants: perm.projectGrants
      }),
      populated: perm.hasAssignments ? 'Sì' : 'No'
    }));

  const data: ImpactReportData = {
    title: '📊 Report Impatto Rimozione Transition',
    summaryItems: [
      { label: 'Workflow', value: `${impact.workflowName} (ID: ${impact.workflowId})` },
      { label: 'Transition Rimosse', value: impact.removedTransitionIds.length },
      { label: 'ItemTypeSet Coinvolti', value: impact.totalAffectedItemTypeSets },
      { label: 'ExecutorPermissions Totali', value: impact.totalExecutorPermissions },
      { label: 'Assignments Totali', value: impact.totalRoleAssignments }
    ],
    tableSections: [
      {
        title: 'Transition Rimosse',
        icon: '🗑️',
        columns: [
          { header: 'Nome', key: 'name' },
          { header: 'ID', key: 'id' }
        ],
        data: transitionRemovedData,
        showIfEmpty: true
      },
      {
        title: 'ItemTypeSet Coinvolti',
        icon: '🎯',
        columns: [
          { header: 'Nome', key: 'name' },
          { header: 'Progetto', key: 'project' }
        ],
        data: itemTypeSetData,
        showIfEmpty: false
      },
      ...(executorPermissionsData.length > 0 ? [{
        title: 'Executor Permissions',
        icon: '⚡',
        columns: [
          {
            header: 'Tipo',
            key: 'type',
            render: (value: string) => (
              <span className={form.badgePrimary}>
                {value}
              </span>
            )
          },
          { header: 'ItemTypeSet', key: 'itemTypeSet' },
          { header: 'Transition', key: 'transition' },
          { header: 'Da Status', key: 'fromStatus' },
          { header: 'A Status', key: 'toStatus' },
          { header: 'Grant Globali', key: 'globalAssignments' },
          { header: 'Grant di Progetto', key: 'projectAssignments' },
          {
            header: 'Popolata',
            key: 'populated',
            render: (value: string) => (
              <span className={value === 'Sì' ? form.badgeWarning : form.badgeInfo}>
                {value}
              </span>
            )
          }
        ],
        data: executorPermissionsData,
        showIfEmpty: false
      }] : [])
    ],
    hasPopulatedPermissions,
    warningMessage: hasPopulatedPermissions 
      ? 'Alcune delle ExecutorPermissions che verranno rimosse hanno ruoli assegnati. Questi assignments verranno eliminati definitivamente.'
      : undefined
  };

  return (
    <GenericImpactReportModal
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      onExport={onExport}
      data={data}
      loading={loading}
    />
  );
};