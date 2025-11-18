import type { CSSProperties } from 'react';

import buttons from '../../../styles/common/Buttons.module.css';
import table from '../../../styles/common/Tables.module.css';
import utilities from '../../../styles/common/Utilities.module.css';

import type { PermissionScope, Role, Group } from './permissionGrantTypes';
import type { UserOption } from '../../UserAutocomplete';

interface GrantCollections {
  users: UserOption[];
  groups: Group[];
  negatedUsers: UserOption[];
  negatedGroups: Group[];
}

type DetailType = 'roles' | 'globalRoles' | 'projectRoles' | 'globalGrant' | 'projectGrant';

interface GrantAssignmentsTableProps {
  scope: PermissionScope;
  roles: Role[];
  globalGrant: GrantCollections;
  projectGrant: GrantCollections;
  hasGrantDirect: boolean;
  hasProjectGrantDirect: boolean;
  onShowDetails: (detail: DetailType) => void;
}

const tableHeaderStyle: CSSProperties = {
  textTransform: 'uppercase',
  fontSize: '0.75rem',
  letterSpacing: '0.05em',
};

const statusStyle = (active: boolean): CSSProperties => ({
  display: 'inline-block',
  padding: '0.25rem 0.625rem',
  borderRadius: '9999px',
  fontSize: '0.75rem',
  fontWeight: 600,
  backgroundColor: active ? '#dcfce7' : '#f3f4f6',
  color: active ? '#15803d' : '#4b5563',
});

const countEntities = (grant: GrantCollections) =>
  grant.users.length + grant.groups.length + grant.negatedUsers.length + grant.negatedGroups.length;

export default function GrantAssignmentsTable({
  scope,
  roles,
  globalGrant,
  projectGrant,
  hasGrantDirect,
  hasProjectGrantDirect,
  onShowDetails,
}: GrantAssignmentsTableProps) {
  const rows: Array<{
    key: DetailType;
    label: string;
    description: string;
    count: number;
    configured: boolean;
    isProject?: boolean;
    readOnly?: boolean;
  }> = [];

  const shouldShowRoleRows = true;

  if (shouldShowRoleRows) {
    if (scope === 'project') {
      rows.push({
        key: 'projectRoles',
        label: 'Ruoli di Progetto',
        description: 'Role template assegnati specifici per questo progetto.',
        count: roles.length,
        configured: roles.length > 0,
        isProject: true,
      });
    } else {
      rows.push({
        key: 'roles',
        label: 'Ruoli Globali',
        description: 'Role template associati alla permission a livello tenant.',
        count: roles.length,
        configured: roles.length > 0,
      });
    }
  }

  if (scope !== 'project') {
    rows.push({
      key: 'globalGrant',
      label: 'Grant Diretto',
      description: 'Utenti e gruppi assegnati direttamente alla permission a livello tenant.',
      count: countEntities(globalGrant),
      configured: hasGrantDirect,
    });
  }

  if (scope === 'project') {
    rows.push({
      key: 'projectGrant',
      label: 'Grant Diretto di Progetto',
      description: 'Assegnazioni dirette e negazioni valide solo per questo progetto.',
      count: countEntities(projectGrant),
      configured: hasProjectGrantDirect,
      isProject: true,
    });
  }

  if (rows.length === 0) {
    return null;
  }

  return (
    <div className={utilities.mb6}>
      <table className={table.table}>
        <thead>
          <tr>
            <th style={tableHeaderStyle}>Sezione</th>
            <th style={tableHeaderStyle}>Descrizione</th>
            <th style={tableHeaderStyle}>Elementi</th>
            <th style={tableHeaderStyle}>Stato</th>
            <th style={tableHeaderStyle}>Azioni</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.key}>
              <td>
                <div style={{ fontWeight: 600, color: row.isProject ? '#047857' : '#1f2937' }}>{row.label}</div>
              </td>
              <td>
                <div style={{ fontSize: '0.875rem', color: '#4b5563' }}>{row.description}</div>
              </td>
              <td>
                <span style={{ fontWeight: 600 }}>{row.count}</span>
              </td>
              <td>
                <span style={statusStyle(row.configured)}>{row.configured ? 'Configurato' : 'Vuoto'}</span>
              </td>
              <td>
                <button
                  type="button"
                  onClick={() => onShowDetails(row.key)}
                  className={buttons.button}
                  style={{ padding: '0.25rem 0.75rem', fontSize: '0.75rem' }}
                  disabled={
                    (row.count === 0 && row.key !== 'roles' && row.key !== 'globalRoles') ||
                    (row.readOnly && row.count === 0)
                  }
                >
                  Dettagli
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}


