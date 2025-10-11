import { Users } from 'lucide-react';
import UserGroupSelector from './UserGroupSelector';

interface User {
  id: number;
  username?: string;
  fullName?: string;
}

interface Group {
  id: number;
  name: string;
}

interface GrantAssignmentSectionProps {
  selectedUsers: User[];
  selectedGroups: Group[];
  selectedDeniedUsers: User[];
  selectedDeniedGroups: Group[];
  availableUsers: User[];
  availableGroups: Group[];
  onAddUser: (user: User) => void;
  onRemoveUser: (userId: number) => void;
  onAddGroup: (group: Group) => void;
  onRemoveGroup: (groupId: number) => void;
  onAddDeniedUser: (user: User) => void;
  onRemoveDeniedUser: (userId: number) => void;
  onAddDeniedGroup: (group: Group) => void;
  onRemoveDeniedGroup: (groupId: number) => void;
}

export default function GrantAssignmentSection({
  selectedUsers,
  selectedGroups,
  selectedDeniedUsers,
  selectedDeniedGroups,
  availableUsers,
  availableGroups,
  onAddUser,
  onRemoveUser,
  onAddGroup,
  onRemoveGroup,
  onAddDeniedUser,
  onRemoveDeniedUser,
  onAddDeniedGroup,
  onRemoveDeniedGroup
}: GrantAssignmentSectionProps) {
  return (
    <div style={{ 
      border: '1px solid #e5e7eb', 
      borderRadius: '0.5rem', 
      padding: '1rem', 
      backgroundColor: 'white' 
    }}>
      <div style={{ marginBottom: '1rem' }}>
        <h3 style={{ 
          fontSize: '1rem', 
          fontWeight: '600', 
          color: '#1e3a8a',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <Users size={20} />
          Assegnazione Grant
        </h3>
      </div>

      {/* Utenti e Gruppi Autorizzati */}
      <UserGroupSelector
        title="Utenti Autorizzati"
        selectLabel="Aggiungi Utente Autorizzato"
        selectedUsers={selectedUsers}
        selectedGroups={selectedGroups}
        availableUsers={availableUsers}
        availableGroups={availableGroups}
        onAddUser={onAddUser}
        onRemoveUser={onRemoveUser}
        onAddGroup={onAddGroup}
        onRemoveGroup={onRemoveGroup}
        bgColor="green"
      />

      {/* Utenti e Gruppi Negati */}
      <UserGroupSelector
        title="Utenti Negati"
        selectLabel="Aggiungi Utente Negato"
        selectedUsers={selectedDeniedUsers}
        selectedGroups={selectedDeniedGroups}
        availableUsers={availableUsers}
        availableGroups={availableGroups}
        onAddUser={onAddDeniedUser}
        onRemoveUser={onRemoveDeniedUser}
        onAddGroup={onAddDeniedGroup}
        onRemoveGroup={onRemoveDeniedGroup}
        bgColor="red"
      />
    </div>
  );
}


