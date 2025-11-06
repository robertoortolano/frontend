import { useState, useEffect } from 'react';
import { Save, X, Plus } from 'lucide-react';
import api from '../api/api';

import buttons from '../styles/common/Buttons.module.css';
import alert from '../styles/common/Alerts.module.css';
import table from '../styles/common/Tables.module.css';

interface Grant {
  id: number;
  name?: string;
}

interface Role {
  id: number;
  name: string;
  description?: string;
}

interface GrantRoleAssignment {
  id: number;
  grant: Grant;
  role: Role;
}

interface ProjectGrantRoleAssignmentManagerProps {
  projectId: string;
  onClose?: () => void;
}

export default function ProjectGrantRoleAssignmentManager({
  projectId,
  onClose
}: ProjectGrantRoleAssignmentManagerProps) {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [assignments, setAssignments] = useState<GrantRoleAssignment[]>([]);
  const [availableGrants, setAvailableGrants] = useState<Grant[]>([]);
  const [availableRoles, setAvailableRoles] = useState<Role[]>([]);
  
  // Stato per form di creazione
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedGrantId, setSelectedGrantId] = useState<number | null>(null);
  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null);

  useEffect(() => {
    if (projectId) {
      fetchAssignments();
      fetchAvailableGrants();
      fetchAvailableRoles();
    }
  }, [projectId]);

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/grant-role-assignments/project/${projectId}`);
      setAssignments(response.data || []);
    } catch (err: any) {
      console.error('Error fetching grant role assignments:', err);
      setError('Errore nel caricamento delle assegnazioni');
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableGrants = async () => {
    try {
      // TODO: Sostituire con endpoint reale quando disponibile
      // Per ora proviamo con endpoint generico
      const response = await api.get('/grants');
      setAvailableGrants(response.data || []);
    } catch (err) {
      console.warn('Grants endpoint not available:', err);
      setAvailableGrants([]);
    }
  };

  const fetchAvailableRoles = async () => {
    try {
      const response = await api.get('/itemtypeset-permissions/roles');
      setAvailableRoles(response.data || []);
    } catch (err) {
      console.error('Error fetching roles:', err);
      setAvailableRoles([]);
    }
  };

  const handleCreate = async () => {
    if (!selectedGrantId || !selectedRoleId) {
      setError('Seleziona sia un Grant che un Role');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      await api.post('/grant-role-assignments/project', {
        grantId: selectedGrantId,
        roleId: selectedRoleId,
        projectId: Number(projectId)
      });

      // Reset form
      setSelectedGrantId(null);
      setSelectedRoleId(null);
      setShowCreateForm(false);
      
      // Ricarica le assegnazioni
      await fetchAssignments();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Errore nella creazione dell\'assegnazione');
      console.error('Error creating grant role assignment:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (grantId: number, roleId: number) => {
    if (!window.confirm('Sei sicuro di voler rimuovere questa assegnazione?')) {
      return;
    }

    try {
      setLoading(true);
      await api.delete(
        `/grant-role-assignments/project/${projectId}/grant/${grantId}/role/${roleId}`
      );
      
      // Ricarica le assegnazioni
      await fetchAssignments();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Errore nella rimozione dell\'assegnazione');
      console.error('Error deleting grant role assignment:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading && assignments.length === 0) {
    return <div className="p-4">Caricamento assegnazioni...</div>;
  }

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-800">
          Grant-Role Assignment a Livello Progetto
        </h2>
        {onClose && (
          <button
            onClick={onClose}
            className={buttons.button}
            style={{ padding: "0.25rem 0.5rem", fontSize: "0.75rem" }}
          >
            <X size={16} />
          </button>
        )}
      </div>

      <p className="text-sm text-gray-600 mb-4">
        Collega Grant (con users/groups) a Role template per questo progetto specifico.
        Questo permette di popolare i Role template con utenti/gruppi specifici del progetto.
      </p>

      {error && (
        <div className={`${alert.error} mb-4`}>
          <p>{error}</p>
        </div>
      )}

      {/* Pulsante per aggiungere nuova assegnazione */}
      {!showCreateForm && (
        <button
          onClick={() => setShowCreateForm(true)}
          className={buttons.button}
          style={{ marginBottom: '1rem' }}
        >
          <Plus size={16} className="mr-2" />
          Aggiungi Grant-Role Assignment
        </button>
      )}

      {/* Form di creazione */}
      {showCreateForm && (
        <div style={{ 
          border: '1px solid #e5e7eb', 
          borderRadius: '0.5rem', 
          padding: '1rem', 
          backgroundColor: '#f9fafb',
          marginBottom: '1rem'
        }}>
          <h3 className="text-md font-semibold text-gray-800 mb-4">Nuova Assegnazione</h3>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label htmlFor="grant-select" className="block text-sm font-medium text-gray-700 mb-1">
                Grant
              </label>
              <select
                id="grant-select"
                value={selectedGrantId || ''}
                onChange={(e) => setSelectedGrantId(e.target.value ? Number(e.target.value) : null)}
                className="w-full p-2 border border-gray-300 rounded"
              >
                <option value="">Seleziona un grant...</option>
                {availableGrants.map(grant => (
                  <option key={grant.id} value={grant.id}>
                    {grant.name || `Grant #${grant.id}`}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="role-select" className="block text-sm font-medium text-gray-700 mb-1">
                Role Template
              </label>
              <select
                id="role-select"
                value={selectedRoleId || ''}
                onChange={(e) => setSelectedRoleId(e.target.value ? Number(e.target.value) : null)}
                className="w-full p-2 border border-gray-300 rounded"
              >
                <option value="">Seleziona un role...</option>
                {availableRoles.map(role => (
                  <option key={role.id} value={role.id}>
                    {role.name}{role.description ? ` - ${role.description}` : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleCreate}
              className={buttons.button}
              disabled={loading || !selectedGrantId || !selectedRoleId}
            >
              <Save size={16} className="mr-2" />
              Crea
            </button>
            <button
              onClick={() => {
                setShowCreateForm(false);
                setSelectedGrantId(null);
                setSelectedRoleId(null);
                setError(null);
              }}
              className={buttons.button}
            >
              Annulla
            </button>
          </div>
        </div>
      )}

      {/* Tabella delle assegnazioni */}
      {assignments.length === 0 ? (
        <div className={`${alert.info} mb-4`}>
          <p>Nessuna assegnazione Grant-Role per questo progetto.</p>
        </div>
      ) : (
        <table className={table.table}>
          <thead>
            <tr>
              <th>Grant</th>
              <th>Role Template</th>
              <th>Azioni</th>
            </tr>
          </thead>
          <tbody>
            {assignments.map((assignment) => (
              <tr key={assignment.id}>
                <td>
                  {assignment.grant.name || `Grant #${assignment.grant.id}`}
                </td>
                <td>
                  {assignment.role.name}
                  {assignment.role.description && (
                    <span className="text-xs text-gray-500 ml-2">
                      - {assignment.role.description}
                    </span>
                  )}
                </td>
                <td>
                  <button
                    onClick={() => handleDelete(assignment.grant.id, assignment.role.id)}
                    className={buttons.button}
                    style={{ padding: "0.25rem 0.5rem", fontSize: "0.75rem" }}
                    disabled={loading}
                  >
                    <X size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}








