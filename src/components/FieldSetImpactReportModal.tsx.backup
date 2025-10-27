import React from 'react';
import { FieldSetRemovalImpactDto } from '../types/fieldset-impact.types';
import { GenericImpactReportModal, ImpactReportData } from './GenericImpactReportModal';
import form from '../styles/common/Forms.module.css';

interface FieldSetImpactReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  onExport: () => void;
  impact: FieldSetRemovalImpactDto | null;
  loading?: boolean;
}

export const FieldSetImpactReportModal: React.FC<FieldSetImpactReportModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  onExport,
  impact,
  loading = false
}) => {
  if (!impact) return null;

  const hasPopulatedPermissions = impact.fieldOwnerPermissions.some(p => p.hasAssignments) ||
                                 impact.fieldStatusPermissions.some(p => p.hasAssignments) ||
                                 impact.itemTypeSetRoles.some(p => p.hasAssignments);

  // Prepara i dati per le tabelle
  const itemTypeSetData = impact.affectedItemTypeSets.map(its => ({
    name: its.itemTypeSetName,
    project: its.projectName || 'N/A',
    id: its.itemTypeSetId
  }));

  const fieldOwnerPermissionsData = impact.fieldOwnerPermissions.map(perm => ({
    itemTypeSet: perm.itemTypeSetName,
    fieldConfiguration: perm.fieldConfigurationName,
    roles: perm.assignedRoles.join(', ') || 'Nessuno',
    populated: perm.hasAssignments ? 'Sì' : 'No'
  }));

  const fieldStatusPermissionsData = impact.fieldStatusPermissions.map(perm => ({
    type: perm.permissionType,
    itemTypeSet: perm.itemTypeSetName,
    fieldConfiguration: perm.fieldConfigurationName,
    workflowStatus: perm.workflowStatusName,
    roles: perm.assignedRoles.join(', ') || 'Nessuno',
    populated: perm.hasAssignments ? 'Sì' : 'No'
  }));

  const itemTypeSetRolesData = impact.itemTypeSetRoles.map(role => ({
    itemTypeSet: role.itemTypeSetName,
    project: role.projectName || 'N/A',
    role: role.roleName,
    grants: role.assignedGrants.join(', ') || 'Nessuno',
    populated: role.hasAssignments ? 'Sì' : 'No'
  }));

  const data: ImpactReportData = {
    title: '📊 Report Impatto Rimozione FieldConfiguration',
    summaryItems: [
      { label: 'Field Set', value: impact.fieldSetName },
      { label: 'FieldConfiguration Rimosse', value: impact.removedFieldConfigurationNames.join(', ') },
      { label: 'ItemTypeSet Coinvolti', value: impact.totalAffectedItemTypeSets },
      { label: 'Permissions Totali', value: impact.totalFieldOwnerPermissions + impact.totalFieldStatusPermissions + impact.totalItemTypeSetRoles },
      { label: 'Assignments Totali', value: impact.totalRoleAssignments + impact.totalGrantAssignments }
    ],
    tableSections: [
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
      {
        title: 'Field Owner Permissions',
        icon: '👑',
        columns: [
          { header: 'ItemTypeSet', key: 'itemTypeSet' },
          { header: 'FieldConfiguration', key: 'fieldConfiguration' },
          { header: 'Ruoli Assegnati', key: 'roles' },
          { 
            header: 'Popolata', 
            key: 'populated',
            render: (value) => (
              <span className={value === 'Sì' ? form.badgeWarning : form.badgeInfo}>
                {value}
                          </span>
            )
          }
        ],
        data: fieldOwnerPermissionsData,
        showIfEmpty: false
      },
      {
        title: 'Field Status Permissions',
        icon: '🔐',
        columns: [
          { 
            header: 'Tipo', 
            key: 'type',
            render: (value) => (
                          <span className={form.badgePrimary}>
                {value}
              </span>
            )
          },
          { header: 'ItemTypeSet', key: 'itemTypeSet' },
          { header: 'FieldConfiguration', key: 'fieldConfiguration' },
          { header: 'WorkflowStatus', key: 'workflowStatus' },
          { header: 'Ruoli Assegnati', key: 'roles' },
          { 
            header: 'Popolata', 
            key: 'populated',
            render: (value) => (
              <span className={value === 'Sì' ? form.badgeWarning : form.badgeInfo}>
                {value}
                          </span>
            )
          }
        ],
        data: fieldStatusPermissionsData,
        showIfEmpty: false
      },
      {
        title: 'ItemTypeSet Roles',
        icon: '👥',
        columns: [
          { header: 'ItemTypeSet', key: 'itemTypeSet' },
          { header: 'Progetto', key: 'project' },
          { header: 'Ruolo', key: 'role' },
          { header: 'Grants Assegnati', key: 'grants' },
          { 
            header: 'Popolata', 
            key: 'populated',
            render: (value) => (
              <span className={value === 'Sì' ? form.badgeWarning : form.badgeInfo}>
                {value}
                          </span>
            )
          }
        ],
        data: itemTypeSetRolesData,
        showIfEmpty: false
      }
    ],
    hasPopulatedPermissions,
    warningMessage: hasPopulatedPermissions 
      ? 'La rimozione di queste FieldConfiguration comporterà la cancellazione di permission con ruoli assegnati. Assicurati di aver esportato il report prima di procedere.'
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