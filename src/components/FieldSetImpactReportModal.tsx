import React from 'react';
import { FieldSetRemovalImpactDto } from '../types/fieldset-impact.types';
import { GenericImpactReportModal, ImpactReportData } from './GenericImpactReportModal';

interface FieldSetImpactReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  onExport: () => void;
  impact: FieldSetRemovalImpactDto | null;
  loading?: boolean;
  isProvisional?: boolean; // True for provisional report, false for summary report before save
}

export const FieldSetImpactReportModal: React.FC<FieldSetImpactReportModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  onExport,
  impact,
  loading = false,
  isProvisional = false
}) => {
  if (!impact) return null;

  // Check if there are any permissions with role or grant assignments
  const hasPopulatedPermissions = impact.fieldOwnerPermissions.some(p => p.hasAssignments) ||
                                 impact.fieldStatusPermissions.some(p => p.hasAssignments) ||
                                 impact.itemTypeSetRoles.some(p => p.hasAssignments);

  // Only show permissions sections, following the same pattern as workflow reports
  const data: ImpactReportData = {
    title: isProvisional 
      ? '📊 Permission interessate dalla rimozione (Report Provvisorio)'
      : '📊 Permission interessate dalla rimozione',
    // Remove summary items, removed items, and affected ItemTypeSets sections - keep only permissions
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
            render: (value) => (
              <span style={{ whiteSpace: 'nowrap' }}>{value}</span>
            )
          },
          { 
            header: 'Field', 
            key: 'fieldConfigurationName',
            render: (value) => (
              <span style={{ whiteSpace: 'nowrap' }}>{value}</span>
            )
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
        ],
        data: [...impact.fieldOwnerPermissions]
          .filter(perm => perm.hasAssignments)
          .sort((a, b) => {
            const itsA = (a.itemTypeSetName || '').localeCompare(b.itemTypeSetName || '');
            if (itsA !== 0) return itsA;
            return (a.fieldConfigurationName || '').localeCompare(b.fieldConfigurationName || '');
          })
          .map(perm => ({
            itemTypeSetName: perm.itemTypeSetName,
            fieldConfigurationName: perm.fieldConfigurationName,
            assignedRoles: perm.assignedRoles || [],
          })),
        showIfEmpty: false
      }] : []),
      // Field Status Permissions section
      ...(impact.fieldStatusPermissions.filter(p => p.hasAssignments).length > 0 ? [{
        title: 'Permission Field Status',
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
            header: 'Field', 
            key: 'fieldConfigurationName',
            render: (value) => (
              <span style={{ whiteSpace: 'nowrap' }}>{value}</span>
            )
          },
          { 
            header: 'WorkflowStatus', 
            key: 'workflowStatusName',
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
        ],
        data: [...impact.fieldStatusPermissions]
          .filter(perm => perm.hasAssignments)
          .sort((a, b) => {
            const itsA = (a.itemTypeSetName || '').localeCompare(b.itemTypeSetName || '');
            if (itsA !== 0) return itsA;
            const fieldA = (a.fieldConfigurationName || '').localeCompare(b.fieldConfigurationName || '');
            if (fieldA !== 0) return fieldA;
            return (a.workflowStatusName || '').localeCompare(b.workflowStatusName || '');
          })
          .map(perm => ({
            itemTypeSetName: perm.itemTypeSetName,
            fieldConfigurationName: perm.fieldConfigurationName,
            workflowStatusName: perm.workflowStatusName,
            permissionType: perm.permissionType,
            assignedRoles: perm.assignedRoles || [],
          })),
        showIfEmpty: false
      }] : []),
      // ItemTypeSet Roles section
      ...(impact.itemTypeSetRoles.filter(p => p.hasAssignments).length > 0 ? [{
        title: 'Permission ItemTypeSet Roles',
        icon: '👥',
        columns: [
          { 
            header: 'ItemTypeSet', 
            key: 'itemTypeSetName',
            render: (value) => (
              <span style={{ whiteSpace: 'nowrap' }}>{value}</span>
            )
          },
          { 
            header: 'Ruolo', 
            key: 'roleName',
            render: (value) => value || '—'
          },
          { 
            header: 'Grants', 
            key: 'assignedGrants',
            tdStyle: { whiteSpace: 'normal' },
            render: (value) => {
              const grants = Array.isArray(value) ? value : [];
              return grants.length > 0 
                ? <span>{grants.join(', ')}</span>
                : <span style={{ color: '#9ca3af' }}>Nessuno</span>;
            }
          },
        ],
        data: [...impact.itemTypeSetRoles]
          .filter(role => role.hasAssignments)
          .sort((a, b) => {
            const itsA = (a.itemTypeSetName || '').localeCompare(b.itemTypeSetName || '');
            if (itsA !== 0) return itsA;
            return (a.roleName || '').localeCompare(b.roleName || '');
          })
          .map(role => ({
            itemTypeSetName: role.itemTypeSetName,
            roleName: role.roleName,
            assignedGrants: role.assignedGrants || [],
          })),
        showIfEmpty: false
      }] : []),
    ],
    hasPopulatedPermissions,
    warningMessage: isProvisional
      ? (hasPopulatedPermissions 
          ? 'Confermando la rimozione, le permission elencate verranno cancellate al salvataggio del FieldSet. Se successivamente inserisci una FieldConfiguration sullo stesso Field, la permission verrà mantenuta con i ruoli associati.'
          : 'Nota: Se successivamente inserisci una FieldConfiguration sullo stesso Field, la permission verrà mantenuta con i ruoli associati.')
      : (hasPopulatedPermissions 
          ? 'Confermando e salvando, le permission elencate verranno cancellate.'
          : undefined)
  };

  return (
    <GenericImpactReportModal
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      onExport={onExport}
      data={data}
      loading={loading}
      confirmButtonColor={isProvisional 
        ? (hasPopulatedPermissions ? '#dc2626' : '#059669')
        : (hasPopulatedPermissions ? '#dc2626' : '#059669')}
      confirmButtonText={loading 
        ? 'Elaborazione...' 
        : isProvisional 
          ? '✅ Conferma Rimozione'
          : 'Conferma e Salva'}
    />
  );
};