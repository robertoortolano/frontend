import type { CSSProperties } from 'react';

import { PermissionScope } from './permissionGrantTypes';

import layout from '../../../styles/common/Layout.module.css';
import utilities from '../../../styles/common/Utilities.module.css';
import form from '../../../styles/common/Forms.module.css';

export interface GrantViewFilters {
  showRoleAssignments: boolean;
  showDirectGrant: boolean;
  showProjectGrant: boolean;
}

interface GrantFiltersSectionProps {
  scope: PermissionScope;
  filters: GrantViewFilters;
  onChange: (filters: GrantViewFilters) => void;
}

const checkboxContainerStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
};

const labelStyle: CSSProperties = {
  fontSize: '0.875rem',
  color: '#1f2937',
  cursor: 'pointer',
  userSelect: 'none',
};

export default function GrantFiltersSection({ scope, filters, onChange }: GrantFiltersSectionProps) {
  const handleToggle = (key: keyof GrantViewFilters) => {
    const next = { ...filters, [key]: !filters[key] };
    onChange(next);
  };

  return (
    <div className={`${layout.block} ${utilities.mb4}`}>
      <div className={layout.blockHeader} style={{ padding: '0.75rem 1rem' }}>
        <h3 className={layout.blockTitleBlue} style={{ margin: 0, fontSize: '1rem' }}>
          Filtri di Visualizzazione
        </h3>
        <p className={layout.paragraphMuted} style={{ margin: 0 }}>
          Personalizza le sezioni mostrate per facilitare il focus sull’area di lavoro corrente.
        </p>
      </div>

      <div className={utilities.p4} style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem' }}>
        <div style={checkboxContainerStyle}>
          <input
            id="grant-filter-roles"
            type="checkbox"
            className={form.checkbox}
            checked={filters.showRoleAssignments}
            onChange={() => handleToggle('showRoleAssignments')}
          />
          <label htmlFor="grant-filter-roles" style={labelStyle}>
            Mostra Ruoli
          </label>
        </div>

        <div style={checkboxContainerStyle}>
          <input
            id="grant-filter-direct"
            type="checkbox"
            className={form.checkbox}
            checked={filters.showDirectGrant}
            onChange={() => handleToggle('showDirectGrant')}
          />
          <label htmlFor="grant-filter-direct" style={labelStyle}>
            {scope === 'project' ? 'Grant Diretto Globale' : 'Grant Diretto'}
          </label>
        </div>

        {scope === 'project' && (
          <div style={checkboxContainerStyle}>
            <input
              id="grant-filter-project"
              type="checkbox"
              className={form.checkbox}
              checked={filters.showProjectGrant}
              onChange={() => handleToggle('showProjectGrant')}
            />
            <label htmlFor="grant-filter-project" style={labelStyle}>
              Grant Specifici di Progetto
            </label>
          </div>
        )}
      </div>
    </div>
  );
}


