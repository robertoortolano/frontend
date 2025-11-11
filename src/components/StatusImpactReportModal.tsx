import React from 'react';
import { StatusRemovalImpactDto } from '../types/status-impact.types';
import { GenericImpactReportModal, ImpactReportData } from './GenericImpactReportModal';
import form from '../styles/common/Forms.module.css';
import { buildGlobalAssignmentsLabel, buildProjectAssignmentsLabel } from '../utils/assignmentDisplayUtils';

interface StatusImpactReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  onExport: () => void;
  impact: StatusRemovalImpactDto | null;
  loading?: boolean;
}

export const StatusImpactReportModal: React.FC<StatusImpactReportModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  onExport,
  impact,
  loading = false
}) => {
  if (!impact) return null;

  const hasPopulatedPermissions = impact.statusOwnerPermissions.some(p => p.hasAssignments);

  // Prepara i dati per le tabelle
  const statusRemovedData = impact.removedStatusNames.map((name, index) => ({
    name: name,
    id: impact.removedStatusIds[index]
  }));

  const itemTypeSetData = impact.affectedItemTypeSets.map(its => ({
    name: its.itemTypeSetName,
    project: its.projectName || 'N/A',
    id: its.itemTypeSetId
  }));

  const statusOwnerPermissionsData = impact.statusOwnerPermissions
    .filter(perm => perm.hasAssignments)
    .map(perm => ({
      itemTypeSet: perm.itemTypeSetName,
      project: perm.projectName || 'N/A',
      status: perm.statusName,
      category: perm.statusCategory,
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
    title: '📊 Report Impatto Rimozione Status',
    summaryItems: [
      { label: 'Workflow', value: impact.workflowName },
      { label: 'Status Rimossi', value: impact.removedStatusIds.length },
      { label: 'ItemTypeSet Coinvolti', value: impact.totalAffectedItemTypeSets },
      { label: 'Permission Status Owner', value: impact.totalStatusOwnerPermissions },
      { label: 'Assegnazioni Ruoli', value: impact.totalRoleAssignments }
    ],
    tableSections: [
      {
        title: 'Status Rimossi',
        icon: '🗑️',
        columns: [
          { header: 'Nome', key: 'name' },
          { header: 'ID', key: 'id' }
        ],
        data: statusRemovedData,
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
      ...(statusOwnerPermissionsData.length > 0 ? [{
        title: 'Permission Status Owner',
        icon: '🔐',
        columns: [
          { header: 'ItemTypeSet', key: 'itemTypeSet' },
          { header: 'Progetto', key: 'project' },
          { header: 'Status', key: 'status' },
          { header: 'Categoria', key: 'category' },
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
        data: statusOwnerPermissionsData,
        showIfEmpty: false
      }] : [])
    ],
    hasPopulatedPermissions,
    warningMessage: hasPopulatedPermissions 
      ? 'La rimozione di questi Status comporterà la cancellazione di permission "Status Owner" con ruoli assegnati. Assicurati di aver esportato il report prima di procedere.'
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