import React from 'react';
import { ItemTypeConfigurationRemovalImpactDto } from '../types/itemtypeconfiguration-impact.types';
import { GenericImpactReportModal, ImpactReportData } from './GenericImpactReportModal';
import { buildGlobalAssignmentsLabel, buildProjectAssignmentsLabel } from '../utils/assignmentDisplayUtils';

interface ItemTypeConfigurationImpactReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  onExport?: () => void;
  impact: ItemTypeConfigurationRemovalImpactDto | null;
  loading?: boolean;
}

export const ItemTypeConfigurationImpactReportModal: React.FC<ItemTypeConfigurationImpactReportModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  onExport,
  impact,
  loading = false
}) => {
  if (!impact) return null;

  // Check if there are any permissions with role or grant assignments
  const hasPopulatedPermissions = 
    impact.fieldOwnerPermissions.some(p => p.hasAssignments) ||
    impact.statusOwnerPermissions.some(p => p.hasAssignments) ||
    impact.fieldStatusPermissions.some(p => p.hasAssignments) ||
    impact.executorPermissions.some(p => p.hasAssignments);

  const data: ImpactReportData = {
    title: '📊 Report Impatto Rimozione ItemTypeConfiguration',
    summaryItems: [],
    tableSections: [
      // Field Owner Permissions section
      ...(impact.fieldOwnerPermissions.filter(p => p.hasAssignments).length > 0 ? [{
        title: 'Permission Field Owner',
        icon: '👑',
        columns: [
          { 
            header: 'ItemTypeSet', 
            key: 'itemTypeSetName',
            render: (value: string) => <span style={{ whiteSpace: 'nowrap' }}>{value}</span>
          },
          { 
            header: 'ItemType', 
            key: 'itemTypeName',
            render: (value: string | null | undefined) => value || '—'
          },
          { 
            header: 'Field', 
            key: 'fieldConfigurationName',
            render: (value: string | null | undefined) => value || '—'
          },
          {
            header: 'Grant Globali',
            key: 'globalAssignments',
            tdStyle: { whiteSpace: 'normal' }
          },
          {
            header: 'Grant di Progetto',
            key: 'projectAssignments',
            tdStyle: { whiteSpace: 'normal' }
          }
        ],
        data: impact.fieldOwnerPermissions
          .filter(perm => perm.hasAssignments)
          .map(perm => ({
            itemTypeSetName: perm.itemTypeSetName,
            itemTypeName: perm.itemTypeName,
            fieldConfigurationName: perm.fieldConfigurationName,
            globalAssignments: buildGlobalAssignmentsLabel({
              assignedRoles: perm.assignedRoles,
              assignedGrants: perm.assignedGrants
            }),
            projectAssignments: buildProjectAssignmentsLabel({
              projectAssignedRoles: perm.projectAssignedRoles,
              projectGrants: perm.projectGrants
            })
          })),
        showIfEmpty: false
      }] : []),
      // Status Owner Permissions section
      ...(impact.statusOwnerPermissions.filter(p => p.hasAssignments).length > 0 ? [{
        title: 'Permission Status Owner',
        icon: '🔐',
        columns: [
          { 
            header: 'ItemTypeSet', 
            key: 'itemTypeSetName',
            render: (value: string) => <span style={{ whiteSpace: 'nowrap' }}>{value}</span>
          },
          { 
            header: 'ItemType', 
            key: 'itemTypeName',
            render: (value: string | null | undefined) => value || '—'
          },
          { 
            header: 'Status', 
            key: 'workflowStatusName',
            render: (value: string | null | undefined) => value || '—'
          },
          {
            header: 'Grant Globali',
            key: 'globalAssignments',
            tdStyle: { whiteSpace: 'normal' }
          },
          {
            header: 'Grant di Progetto',
            key: 'projectAssignments',
            tdStyle: { whiteSpace: 'normal' }
          }
        ],
        data: impact.statusOwnerPermissions
          .filter(perm => perm.hasAssignments)
          .map(perm => ({
            itemTypeSetName: perm.itemTypeSetName,
            itemTypeName: perm.itemTypeName,
            workflowStatusName: perm.workflowStatusName,
            globalAssignments: buildGlobalAssignmentsLabel({
              assignedRoles: perm.assignedRoles,
              assignedGrants: perm.assignedGrants
            }),
            projectAssignments: buildProjectAssignmentsLabel({
              projectAssignedRoles: perm.projectAssignedRoles,
              projectGrants: perm.projectGrants
            })
          })),
        showIfEmpty: false
      }] : []),
      // Field Status Permissions section
      ...(impact.fieldStatusPermissions.filter(p => p.hasAssignments).length > 0 ? [{
        title: 'Permission Field Status',
        icon: '🔒',
        columns: [
          { 
            header: 'ItemTypeSet', 
            key: 'itemTypeSetName',
            render: (value: string) => <span style={{ whiteSpace: 'nowrap' }}>{value}</span>
          },
          { 
            header: 'ItemType', 
            key: 'itemTypeName',
            render: (value: string | null | undefined) => value || '—'
          },
          { 
            header: 'Tipo', 
            key: 'permissionType',
            render: (value: string) => (
              <span style={{ 
                display: 'inline-block',
                padding: '2px 6px',
                borderRadius: '4px',
                fontSize: '0.85em',
                backgroundColor: '#e0e7ff',
                color: '#3730a3'
              }}>
                {value}
              </span>
            )
          },
          { 
            header: 'Field', 
            key: 'fieldConfigurationName',
            render: (value: string | null | undefined) => value || '—'
          },
          { 
            header: 'Status', 
            key: 'workflowStatusName',
            render: (value: string | null | undefined) => value || '—'
          },
          {
            header: 'Grant Globali',
            key: 'globalAssignments',
            tdStyle: { whiteSpace: 'normal' }
          },
          {
            header: 'Grant di Progetto',
            key: 'projectAssignments',
            tdStyle: { whiteSpace: 'normal' }
          }
        ],
        data: impact.fieldStatusPermissions
          .filter(perm => perm.hasAssignments)
          .map(perm => ({
            itemTypeSetName: perm.itemTypeSetName,
            itemTypeName: perm.itemTypeName,
            permissionType: perm.permissionType,
            fieldConfigurationName: perm.fieldConfigurationName,
            workflowStatusName: perm.workflowStatusName,
            globalAssignments: buildGlobalAssignmentsLabel({
              assignedRoles: perm.assignedRoles,
              assignedGrants: perm.assignedGrants
            }),
            projectAssignments: buildProjectAssignmentsLabel({
              projectAssignedRoles: perm.projectAssignedRoles,
              projectGrants: perm.projectGrants
            })
          })),
        showIfEmpty: false
      }] : []),
      // Executor Permissions section
      ...(impact.executorPermissions.filter(p => p.hasAssignments).length > 0 ? [{
        title: 'Permission Executor',
        icon: '⚡',
        columns: [
          { 
            header: 'ItemTypeSet', 
            key: 'itemTypeSetName',
            render: (value: string) => <span style={{ whiteSpace: 'nowrap' }}>{value}</span>
          },
          { 
            header: 'ItemType', 
            key: 'itemTypeName',
            render: (value: string | null | undefined) => value || '—'
          },
          { 
            header: 'Transition', 
            key: 'transitionName',
            render: (value: string | null | undefined) => value || '—'
          },
          {
            header: 'Da Status',
            key: 'fromStatusName',
            render: (value: string | null | undefined) => value || '—'
          },
          {
            header: 'A Status',
            key: 'toStatusName',
            render: (value: string | null | undefined) => value || '—'
          },
          {
            header: 'Grant Globali',
            key: 'globalAssignments',
            tdStyle: { whiteSpace: 'normal' }
          },
          {
            header: 'Grant di Progetto',
            key: 'projectAssignments',
            tdStyle: { whiteSpace: 'normal' }
          }
        ],
        data: impact.executorPermissions
          .filter(perm => perm.hasAssignments)
          .map(perm => ({
            itemTypeSetName: perm.itemTypeSetName,
            itemTypeName: perm.itemTypeName,
            transitionName: perm.transitionName,
            fromStatusName: perm.fromStatusName,
            toStatusName: perm.toStatusName,
            globalAssignments: buildGlobalAssignmentsLabel({
              assignedRoles: perm.assignedRoles,
              assignedGrants: perm.assignedGrants
            }),
            projectAssignments: buildProjectAssignmentsLabel({
              projectAssignedRoles: perm.projectAssignedRoles,
              projectGrants: perm.projectGrants
            })
          })),
        showIfEmpty: false
      }] : [])
    ],
    hasPopulatedPermissions,
    warningMessage: hasPopulatedPermissions 
      ? 'La rimozione di queste ItemTypeConfiguration comporterà la cancellazione di permission e ruoli con assegnazioni. Assicurati di aver esportato il report prima di procedere.'
      : undefined
  };

  return (
    <GenericImpactReportModal
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      onExport={onExport ?? (() => {})}
      data={data}
      loading={loading}
    />
  );
};

