import React from 'react';
import { ItemTypeConfigurationRemovalImpactDto } from '../types/itemtypeconfiguration-impact.types';
import { GenericImpactReportModal, ImpactReportData } from './GenericImpactReportModal';
import form from '../styles/common/Forms.module.css';

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
            render: (value) => <span style={{ whiteSpace: 'nowrap' }}>{value}</span>
          },
          { 
            header: 'ItemType', 
            key: 'itemTypeName',
            render: (value) => value || '—'
          },
          { 
            header: 'Field', 
            key: 'fieldConfigurationName',
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
          { 
            header: 'Grant', 
            key: 'assignedGrants',
            tdStyle: { whiteSpace: 'normal' },
            render: (value) => {
              const grants = Array.isArray(value) ? value : [];
              return grants.length > 0 
                ? <span>{grants.join(', ')}</span>
                : <span style={{ color: '#9ca3af' }}>Nessuno</span>;
            }
          }
        ],
        data: impact.fieldOwnerPermissions
          .filter(perm => perm.hasAssignments)
          .map(perm => ({
            itemTypeSetName: perm.itemTypeSetName,
            itemTypeName: perm.itemTypeName,
            fieldConfigurationName: perm.fieldConfigurationName,
            assignedRoles: perm.assignedRoles || [],
            assignedGrants: perm.assignedGrants || []
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
            render: (value) => <span style={{ whiteSpace: 'nowrap' }}>{value}</span>
          },
          { 
            header: 'ItemType', 
            key: 'itemTypeName',
            render: (value) => value || '—'
          },
          { 
            header: 'Status', 
            key: 'workflowStatusName',
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
          { 
            header: 'Grant', 
            key: 'assignedGrants',
            tdStyle: { whiteSpace: 'normal' },
            render: (value) => {
              const grants = Array.isArray(value) ? value : [];
              return grants.length > 0 
                ? <span>{grants.join(', ')}</span>
                : <span style={{ color: '#9ca3af' }}>Nessuno</span>;
            }
          }
        ],
        data: impact.statusOwnerPermissions
          .filter(perm => perm.hasAssignments)
          .map(perm => ({
            itemTypeSetName: perm.itemTypeSetName,
            itemTypeName: perm.itemTypeName,
            workflowStatusName: perm.workflowStatusName,
            assignedRoles: perm.assignedRoles || [],
            assignedGrants: perm.assignedGrants || []
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
            render: (value) => <span style={{ whiteSpace: 'nowrap' }}>{value}</span>
          },
          { 
            header: 'ItemType', 
            key: 'itemTypeName',
            render: (value) => value || '—'
          },
          { 
            header: 'Tipo', 
            key: 'permissionType',
            render: (value) => (
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
            render: (value) => value || '—'
          },
          { 
            header: 'Status', 
            key: 'workflowStatusName',
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
          { 
            header: 'Grant', 
            key: 'assignedGrants',
            tdStyle: { whiteSpace: 'normal' },
            render: (value) => {
              const grants = Array.isArray(value) ? value : [];
              return grants.length > 0 
                ? <span>{grants.join(', ')}</span>
                : <span style={{ color: '#9ca3af' }}>Nessuno</span>;
            }
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
            assignedRoles: perm.assignedRoles || [],
            assignedGrants: perm.assignedGrants || []
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
            render: (value) => <span style={{ whiteSpace: 'nowrap' }}>{value}</span>
          },
          { 
            header: 'ItemType', 
            key: 'itemTypeName',
            render: (value) => value || '—'
          },
          { 
            header: 'Transition', 
            key: 'transitionName',
            render: (value) => value || '—'
          },
          { 
            header: 'Da Status', 
            key: 'fromStatusName',
            render: (value) => value || '—'
          },
          { 
            header: 'A Status', 
            key: 'toStatusName',
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
          { 
            header: 'Grant', 
            key: 'assignedGrants',
            tdStyle: { whiteSpace: 'normal' },
            render: (value) => {
              const grants = Array.isArray(value) ? value : [];
              return grants.length > 0 
                ? <span>{grants.join(', ')}</span>
                : <span style={{ color: '#9ca3af' }}>Nessuno</span>;
            }
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
            assignedRoles: perm.assignedRoles || [],
            assignedGrants: perm.assignedGrants || []
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
      onExport={onExport}
      data={data}
      loading={loading}
    />
  );
};

