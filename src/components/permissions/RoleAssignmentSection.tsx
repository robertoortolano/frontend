import { Shield, UserMinus } from 'lucide-react';

interface Role {
  id: number;
  name: string;
  description?: string;
}

interface RoleAssignmentSectionProps {
  selectedRoles: Role[];
  availableRoles: Role[];
  onAddRole: (role: Role) => void;
  onRemoveRole: (roleId: number) => void;
}

export default function RoleAssignmentSection({
  selectedRoles,
  availableRoles,
  onAddRole,
  onRemoveRole
}: RoleAssignmentSectionProps) {
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
          <Shield size={20} />
          Assegnazione Ruoli
        </h3>
      </div>
      
      {/* Ruoli assegnati */}
      <div style={{ marginBottom: '1rem' }}>
        <div style={{ 
          display: 'block', 
          fontWeight: '600', 
          color: '#1e3a8a', 
          marginBottom: '0.5rem' 
        }}>Ruoli Assegnati</div>
        <div style={{ 
          border: '1px solid #e5e7eb', 
          borderRadius: '0.5rem', 
          padding: '0.75rem', 
          minHeight: '100px',
          backgroundColor: 'white'
        }}>
          {selectedRoles.length === 0 ? (
            <p className="text-gray-500 text-sm">Nessun ruolo assegnato</p>
          ) : (
            <div className="space-y-2">
              {selectedRoles.map(role => (
                <div key={role.id} className="flex items-center justify-between bg-blue-50 p-2 rounded">
                  <div>
                    <span className="text-sm font-medium">{role.name}</span>
                    {role.description && (
                      <p className="text-xs text-gray-600">{role.description}</p>
                    )}
                  </div>
                  <button
                    onClick={() => onRemoveRole(role.id)}
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

      {/* Aggiungi ruolo */}
      <div style={{ marginBottom: '1rem' }}>
        <label htmlFor="add-role-select" style={{ 
          display: 'block', 
          fontWeight: '600', 
          color: '#1e3a8a', 
          marginBottom: '0.5rem' 
        }}>Aggiungi Ruolo</label>
        <select
          id="add-role-select"
          onChange={(e) => {
            const roleId = e.target.value;
            if (roleId) {
              const role = availableRoles.find(r => r.id === Number(roleId));
              if (role) onAddRole(role);
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
          <option value="">Seleziona un ruolo...</option>
          {(availableRoles || [])
            .filter(role => !selectedRoles.find(r => r.id === role.id))
            .map(role => (
              <option key={role.id} value={role.id}>
                {role.name}{role.description ? ` - ${role.description}` : ''}
              </option>
            ))}
        </select>
      </div>
    </div>
  );
}


