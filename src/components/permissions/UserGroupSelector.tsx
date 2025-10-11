import { UserMinus } from 'lucide-react';

interface User {
  id: number;
  username?: string;
  fullName?: string;
}

interface Group {
  id: number;
  name: string;
}

interface UserGroupSelectorProps {
  title: string;
  selectLabel: string;
  selectedUsers: User[];
  selectedGroups: Group[];
  availableUsers: User[];
  availableGroups: Group[];
  onAddUser: (user: User) => void;
  onRemoveUser: (userId: number) => void;
  onAddGroup: (group: Group) => void;
  onRemoveGroup: (groupId: number) => void;
  bgColor?: string;
  showGroups?: boolean;
}

export default function UserGroupSelector({
  title,
  selectLabel,
  selectedUsers,
  selectedGroups,
  availableUsers,
  availableGroups,
  onAddUser,
  onRemoveUser,
  onAddGroup,
  onRemoveGroup,
  bgColor = 'green',
  showGroups = true
}: UserGroupSelectorProps) {
  return (
    <>
      {/* Utenti */}
      <div style={{ marginBottom: '1rem' }}>
        <label style={{ 
          display: 'block', 
          fontWeight: '600', 
          color: '#1e3a8a', 
          marginBottom: '0.5rem' 
        }}>{title}</label>
        <div style={{ 
          border: '1px solid #e5e7eb', 
          borderRadius: '0.5rem', 
          padding: '0.75rem', 
          minHeight: '100px',
          backgroundColor: 'white'
        }}>
          {selectedUsers.length === 0 ? (
            <p className="text-gray-500 text-sm">Nessun utente selezionato</p>
          ) : (
            <div className="space-y-2">
              {selectedUsers.map(user => (
                <div key={user.id} className={`flex items-center justify-between bg-${bgColor}-50 p-2 rounded`}>
                  <span className="text-sm">{user.fullName || user.username || `User ${user.id}`}</span>
                  <button
                    onClick={() => onRemoveUser(user.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <UserMinus size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Aggiungi utente */}
      <div style={{ marginBottom: '1rem' }}>
        <label style={{ 
          display: 'block', 
          fontWeight: '600', 
          color: '#1e3a8a', 
          marginBottom: '0.5rem' 
        }}>{selectLabel}</label>
        <select
          onChange={(e) => {
            const userId = e.target.value;
            if (userId) {
              const user = (availableUsers || []).find(u => u.id === Number(userId));
              if (user) onAddUser(user);
              e.target.value = '';
            }
          }}
          style={{
            width: '100%',
            padding: '0.5rem 0.75rem',
            border: '1px solid #cbd5e1',
            borderRadius: '0.375rem',
            fontSize: '1rem',
            color: '#1e3a8a',
            backgroundColor: 'white'
          }}
        >
          <option value="">Seleziona un utente...</option>
          {(availableUsers || [])
            .filter(user => !selectedUsers.find(u => u.id === user.id))
            .map(user => (
              <option key={user.id} value={user.id}>
                {user.fullName || user.username || `User ${user.id}`}
              </option>
            ))}
        </select>
      </div>

      {/* Gruppi */}
      {showGroups && (
        <>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ 
              display: 'block', 
              fontWeight: '600', 
              color: '#1e3a8a', 
              marginBottom: '0.5rem' 
            }}>Gruppi {title.includes('Negati') ? 'Negati' : 'Autorizzati'}</label>
            <div style={{ 
              border: '1px solid #e5e7eb', 
              borderRadius: '0.5rem', 
              padding: '0.75rem', 
              minHeight: '100px',
              backgroundColor: 'white'
            }}>
              {selectedGroups.length === 0 ? (
                <p className="text-gray-500 text-sm">Nessun gruppo selezionato</p>
              ) : (
                <div className="space-y-2">
                  {selectedGroups.map(group => (
                    <div key={group.id} className={`flex items-center justify-between bg-${bgColor}-50 p-2 rounded`}>
                      <span className="text-sm">{group.name}</span>
                      <button
                        onClick={() => onRemoveGroup(group.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <UserMinus size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Aggiungi gruppo */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ 
              display: 'block', 
              fontWeight: '600', 
              color: '#1e3a8a', 
              marginBottom: '0.5rem' 
            }}>Aggiungi Gruppo {title.includes('Negati') ? 'Negato' : 'Autorizzato'}</label>
            <select
              onChange={(e) => {
                const groupId = e.target.value;
                if (groupId) {
                  const group = (availableGroups || []).find(g => g.id === Number(groupId));
                  if (group) onAddGroup(group);
                  e.target.value = '';
                }
              }}
              style={{
                width: '100%',
                padding: '0.5rem 0.75rem',
                border: '1px solid #cbd5e1',
                borderRadius: '0.375rem',
                fontSize: '1rem',
                color: '#1e3a8a',
                backgroundColor: 'white'
              }}
            >
              <option value="">Seleziona un gruppo...</option>
              {(availableGroups || [])
                .filter(group => !selectedGroups.find(g => g.id === group.id))
                .map(group => (
                  <option key={group.id} value={group.id}>
                    {group.name}
                  </option>
                ))}
            </select>
          </div>
        </>
      )}
    </>
  );
}


