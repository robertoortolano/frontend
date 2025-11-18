import { useState } from 'react';
import type { CSSProperties, MouseEvent } from 'react';
import { Save, X } from 'lucide-react';

import UserAutocomplete, { UserOption } from './UserAutocomplete';
import PermissionHeader from './permissions/PermissionHeader';
import RoleAssignmentSection from './permissions/RoleAssignmentSection';
import GrantAssignmentsTable from './permissions/grants/GrantAssignmentsTable';
import GrantDetailsModal from './permissions/grants/GrantDetailsModal';

import buttons from '../styles/common/Buttons.module.css';
import alert from '../styles/common/Alerts.module.css';

import {
  usePermissionGrantStateMachine,
} from '../hooks/usePermissionGrantStateMachine';
import type {
  Permission,
  PermissionScope,
  Role,
  Group,
} from './permissions/grants/permissionGrantTypes';

type DetailType = 'roles' | 'globalRoles' | 'projectRoles' | 'globalGrant' | 'projectGrant';

interface PermissionGrantManagerProps {
  permission: Permission | null;
  onClose: () => void;
  onSave: () => void;
  itemTypeSetId?: number;
  scope?: PermissionScope;
  projectId?: string;
}

interface DetailModalState {
  title: string;
  roles?: Role[];
  users?: UserOption[];
  groups?: Group[];
  negatedUsers?: UserOption[];
  negatedGroups?: Group[];
  emptyMessage?: string;
}

type SectionVariant = 'positive' | 'negative';

const sectionCardStyle: CSSProperties = {
  border: '1px solid #e5e7eb',
  borderRadius: '0.5rem',
  padding: '1rem',
  backgroundColor: 'white',
};

const sectionTitleStyle: CSSProperties = {
  fontSize: '1rem',
  fontWeight: 600,
  color: '#1e3a8a',
  marginBottom: '1rem',
};

const groupChipStyle = (variant: SectionVariant): CSSProperties => ({
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  gap: '8px',
  paddingLeft: '12px',
  paddingRight: '4px',
  paddingTop: '8px',
  paddingBottom: '8px',
  borderRadius: '9999px',
  maxWidth: 'fit-content',
  border: `1px solid ${variant === 'negative' ? '#fecaca' : '#bbf7d0'}`,
  backgroundColor: variant === 'negative' ? '#fee2e2' : '#ecfdf5',
  color: variant === 'negative' ? '#991b1b' : '#166534',
  transition: 'background-color 150ms, color 150ms',
});

const removeButtonBaseStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '20px',
  height: '20px',
  borderRadius: '50%',
  border: 'none',
  cursor: 'pointer',
  backgroundColor: '#fecaca',
  color: '#991b1b',
  transition: 'background-color 150ms, color 150ms',
};

const handleRemoveButtonHover = (event: MouseEvent<HTMLButtonElement>, entering: boolean) => {
  const button = event.currentTarget;
  button.style.backgroundColor = entering ? '#ef4444' : '#fecaca';
  button.style.color = entering ? '#ffffff' : '#991b1b';
  const icon = button.querySelector('svg');
  if (icon) {
    icon.style.color = entering ? '#ffffff' : '#991b1b';
    (icon as SVGElement).style.stroke = entering ? '#ffffff' : '#991b1b';
  }
};

interface GrantUserSectionProps {
  title: string;
  users: UserOption[];
  variant?: SectionVariant;
  onAddUser: (user: UserOption) => void;
  onRemoveUser: (userId: number) => void;
}

function GrantUserSection({ title, users, variant = 'positive', onAddUser, onRemoveUser }: GrantUserSectionProps) {
  return (
    <div style={sectionCardStyle}>
      <h4 style={sectionTitleStyle}>{title}</h4>
      <UserAutocomplete
        selectedUsers={users}
        onAddUser={onAddUser}
        onRemoveUser={onRemoveUser}
        label={variant === 'negative' ? 'Aggiungi Utente Negato' : 'Aggiungi Utente Autorizzato'}
        placeholder="Cerca utente per nome o email..."
        variant={variant === 'negative' ? 'negated' : undefined}
      />
    </div>
  );
}

interface GrantGroupSectionProps {
  idSuffix: string;
  title: string;
  groups: Group[];
  variant?: SectionVariant;
  availableGroups: Group[];
  onAddGroup: (group: Group) => void;
  onRemoveGroup: (groupId: number) => void;
}

function GrantGroupSection({
  idSuffix,
  title,
  groups,
  variant = 'positive',
  availableGroups,
  onAddGroup,
  onRemoveGroup,
}: GrantGroupSectionProps) {
  const selectId = `${idSuffix}-select`;

  const filteredOptions = availableGroups.filter((group) => !groups.some((g) => g.id === group.id));

  return (
    <div style={sectionCardStyle}>
      <h4 style={sectionTitleStyle}>{title}</h4>
      <div style={{ marginBottom: '0.5rem' }}>
        <label htmlFor={selectId} className="block text-sm font-medium text-gray-700 mb-1">
          {variant === 'negative' ? 'Aggiungi Gruppo Negato' : 'Aggiungi Gruppo'}
        </label>
        <select
          id={selectId}
          onChange={(event) => {
            const groupId = event.target.value;
            if (!groupId) {
              return;
            }
            const group = availableGroups.find((g) => g.id === Number(groupId));
            if (group) {
              onAddGroup(group);
            }
            event.target.value = '';
          }}
          className="w-full p-2 border border-gray-300 rounded"
          value=""
        >
          <option value="">Seleziona un gruppo...</option>
          {filteredOptions.map((group) => (
            <option key={group.id} value={group.id}>
              {group.name}
            </option>
          ))}
        </select>
      </div>
      {groups.length > 0 && (
        <div style={{ marginTop: '1.75rem', marginBottom: '1.75rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
            {groups.map((group) => (
              <div key={group.id} style={groupChipStyle(variant)}>
                <span className="text-sm font-medium">{group.name}</span>
                <button
                  type="button"
                  onClick={() => onRemoveGroup(group.id)}
                  style={removeButtonBaseStyle}
                  title={`Rimuovi ${group.name}`}
                  aria-label={`Rimuovi ${group.name}`}
                  onMouseEnter={(event) => handleRemoveButtonHover(event, true)}
                  onMouseLeave={(event) => handleRemoveButtonHover(event, false)}
                >
                  <X size={12} strokeWidth={2.5} style={{ color: 'inherit', stroke: 'currentColor' }} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function PermissionGrantManager({
  permission,
  onClose,
  onSave,
  itemTypeSetId,
  scope = 'tenant',
  projectId,
}: PermissionGrantManagerProps) {
  const {
    state: {
      loading,
      error,
      selectedRoles,
      availableRoles,
      availableGroups,
      grant,
      projectGrant,
    },
    actions,
    metadata,
  } = usePermissionGrantStateMachine({
    permission,
    scope,
    projectId,
    itemTypeSetId,
  });

  const [detailModalData, setDetailModalData] = useState<DetailModalState | null>(null);

  if (!permission) {
    return null;
  }

  const handleSave = async () => {
    const success = await actions.persistAssignments();
    if (!success) {
      return;
    }

    onSave();
    setTimeout(() => {
      onClose();
    }, 100);
  };

  const handleShowDetails = (type: DetailType) => {
    if (type === 'projectRoles') {
      setDetailModalData({
        title: 'Ruoli di Progetto',
        roles: selectedRoles,
        emptyMessage: 'Nessun ruolo di progetto assegnato a questa permission.',
      });
      return;
    }

    if (type === 'roles') {
      setDetailModalData({
        title: 'Ruoli Globali',
        roles: selectedRoles,
        emptyMessage: 'Nessun ruolo assegnato a questa permission.',
      });
      return;
    }

    if (type === 'globalRoles') {
      setDetailModalData({
        title: 'Ruoli Globali',
        roles: permission.assignedRoles || [],
        emptyMessage: 'Nessun ruolo globale associato alla permission.',
      });
      return;
    }

    if (type === 'globalGrant') {
      setDetailModalData({
        title: scope === 'project' ? 'Grant Diretto Globale' : 'Grant Diretto',
        users: grant.users,
        groups: grant.groups,
        negatedUsers: grant.negatedUsers,
        negatedGroups: grant.negatedGroups,
        emptyMessage: 'Nessuna assegnazione diretta configurata.',
      });
      return;
    }

    setDetailModalData({
      title: 'Grant Diretto di Progetto',
      users: projectGrant.users,
      groups: projectGrant.groups,
      negatedUsers: projectGrant.negatedUsers,
      negatedGroups: projectGrant.negatedGroups,
      emptyMessage: 'Nessuna assegnazione diretta di progetto configurata.',
    });
  };

  const handleCloseModal = () => setDetailModalData(null);

  const showRoleSection = true;
  const showGlobalGrantSection = scope !== 'project';
  const showProjectGrantSection = scope === 'project';

  return (
    <div className="w-full">
      <PermissionHeader permission={permission} />
      
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-gray-800">Gestione Assegnazioni per Permission</h2>
        <p className="text-sm text-gray-600">
          Puoi assegnare un Grant diretto e/o uno o più Role template. Entrambi possono essere assegnati contemporaneamente.
        </p>
      </div>

      {error && (
        <div className={`${alert.error} mb-4`}>
          <p>{error}</p>
        </div>
      )}

      {typeof permission.id === 'string' && permission.id.startsWith('worker-') && (
        <div className={`${alert.info} mb-4`}>
          <p>
            <strong>Nota:</strong> I WORKER sono gestiti automaticamente dal sistema e non possono avere ruoli assegnati direttamente.
          </p>
        </div>
      )}

      <GrantAssignmentsTable
        scope={scope}
        roles={selectedRoles}
        globalGrant={grant}
        projectGrant={projectGrant}
        hasGrantDirect={metadata.hasGrantDirect}
        hasProjectGrantDirect={metadata.hasProjectGrantDirect}
        onShowDetails={handleShowDetails}
      />

      {scope === 'project' ? (
        <>
          {showRoleSection && (
            <div
              style={{
            border: '2px solid #10b981', 
            borderRadius: '0.75rem', 
            padding: '1.5rem', 
            backgroundColor: '#ecfdf5',
                marginBottom: '2rem',
              }}
            >
              <h3
                style={{
              fontSize: '1.25rem', 
                  fontWeight: 700,
              color: '#047857',
                  marginBottom: '1rem',
                }}
              >
              Permission Specifiche del Progetto
            </h3>
              <p
                style={{
              fontSize: '0.875rem', 
              color: '#475569',
                  marginBottom: '1.5rem',
                }}
              >
              Queste assegnazioni si applicano solo a questo progetto e vengono aggiunte alle permission globali.
            </p>
            
            <div className="grid grid-cols-1 gap-6">
              <RoleAssignmentSection
                selectedRoles={selectedRoles}
                availableRoles={availableRoles}
                  onAddRole={actions.addRole}
                  onRemoveRole={actions.removeRole}
                />

                {showProjectGrantSection && (
                  <>
                    <GrantUserSection
                      title="Utenti Autorizzati"
                      users={projectGrant.users}
                      onAddUser={actions.addProjectGrantUser}
                      onRemoveUser={actions.removeProjectGrantUser}
                    />

                    <GrantGroupSection
                      idSuffix="project-grant-group"
                      title="Gruppi Autorizzati"
                      groups={projectGrant.groups}
                      availableGroups={availableGroups}
                      onAddGroup={actions.addProjectGrantGroup}
                      onRemoveGroup={actions.removeProjectGrantGroup}
                    />

                    <GrantUserSection
                      title="Utenti Negati"
                      users={projectGrant.negatedUsers}
                      variant="negative"
                      onAddUser={actions.addProjectGrantNegatedUser}
                      onRemoveUser={actions.removeProjectGrantNegatedUser}
                    />

                    <GrantGroupSection
                      idSuffix="project-grant-negated-group"
                      title="Gruppi Negati"
                      groups={projectGrant.negatedGroups}
                      availableGroups={availableGroups}
                      variant="negative"
                      onAddGroup={actions.addProjectGrantNegatedGroup}
                      onRemoveGroup={actions.removeProjectGrantNegatedGroup}
                    />
                  </>
                )}
              </div>
            </div>
          )}
        </>
      ) : (
          <div className="grid grid-cols-1 gap-6">
          {showRoleSection && (
            <RoleAssignmentSection
              selectedRoles={selectedRoles}
              availableRoles={availableRoles}
              onAddRole={actions.addRole}
              onRemoveRole={actions.removeRole}
            />
          )}

          {showGlobalGrantSection && (
            <>
              <GrantUserSection
                title="Utenti Autorizzati"
                users={grant.users}
                onAddUser={actions.addGrantUser}
                onRemoveUser={actions.removeGrantUser}
              />

              <GrantGroupSection
                idSuffix="grant-group"
                title="Gruppi Autorizzati"
                groups={grant.groups}
                availableGroups={availableGroups}
                onAddGroup={actions.addGrantGroup}
                onRemoveGroup={actions.removeGrantGroup}
              />

              <GrantUserSection
                title="Utenti Negati"
                users={grant.negatedUsers}
                variant="negative"
                onAddUser={actions.addGrantNegatedUser}
                onRemoveUser={actions.removeGrantNegatedUser}
              />

              <GrantGroupSection
                idSuffix="grant-negated-group"
                title="Gruppi Negati"
                groups={grant.negatedGroups}
                availableGroups={availableGroups}
                variant="negative"
                onAddGroup={actions.addGrantNegatedGroup}
                onRemoveGroup={actions.removeGrantNegatedGroup}
              />
            </>
              )}
            </div>
      )}

      <div className="flex justify-end gap-4 mt-6 pt-4 border-t">
        <button
          onClick={onClose}
          className={buttons.button}
          disabled={loading}
        >
          Annulla
        </button>
        <button
          onClick={handleSave}
          className={buttons.button}
          disabled={loading}
        >
          {loading ? 'Salvataggio...' : 'Salva Assegnazioni'}
          <Save size={16} className="ml-2" />
        </button>
      </div>

      <GrantDetailsModal
        open={Boolean(detailModalData)}
        title={detailModalData?.title || ''}
        roles={detailModalData?.roles}
        users={detailModalData?.users}
        groups={detailModalData?.groups}
        negatedUsers={detailModalData?.negatedUsers}
        negatedGroups={detailModalData?.negatedGroups}
        emptyMessage={detailModalData?.emptyMessage}
        onClose={handleCloseModal}
      />
    </div>
  );
}


