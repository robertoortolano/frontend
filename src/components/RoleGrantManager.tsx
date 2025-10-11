import { useState, useEffect } from 'react';
import { X, Plus } from 'lucide-react';
import api from '../api/api';

import layout from '../styles/common/Layout.module.css';
import buttons from '../styles/common/Buttons.module.css';
import alert from '../styles/common/Alerts.module.css';

import CurrentAssignmentDisplay from './roleGrants/CurrentAssignmentDisplay';
import AssignmentModeToggle from './roleGrants/AssignmentModeToggle';
import AssignmentSelector from './roleGrants/AssignmentSelector';
import GrantsList from './roleGrants/GrantsList';

interface RoleGrantManagerProps {
  roleId: number;
  onClose: () => void;
}

interface UserData {
  id: number;
  username?: string;
  fullName?: string;
}

interface GroupData {
  id: number;
  name: string;
}

interface RoleData {
  id: number;
  name: string;
  scope?: string;
}

interface GrantData {
  id: number;
  grantId: number;
  name?: string;
  description?: string;
  grantedUserIds?: number[];
  grantedGroupIds?: number[];
  negatedUserIds?: number[];
  negatedGroupIds?: number[];
}

interface CurrentAssignment {
  assignmentType: 'GRANT' | 'ROLE' | 'GRANTS' | 'NONE';
  grantName?: string;
  roleTemplateName?: string;
}

export default function RoleGrantManager({ roleId, onClose }: RoleGrantManagerProps) {
  const [grants, setGrants] = useState<GrantData[]>([]);
  const [users, setUsers] = useState<UserData[]>([]);
  const [groups, setGroups] = useState<GroupData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddGrant, setShowAddGrant] = useState<boolean>(false);
  const [availableGrants, setAvailableGrants] = useState<GrantData[]>([]);
  const [availableRoles, setAvailableRoles] = useState<RoleData[]>([]);
  const [assignmentMode, setAssignmentMode] = useState<'GRANT' | 'ROLE'>('GRANT');
  const [currentAssignment, setCurrentAssignment] = useState<CurrentAssignment | null>(null);

  useEffect(() => {
    fetchData();
  }, [roleId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const roleResponse = await api.get(`/itemtypeset-roles/${roleId}`);
      const role = roleResponse.data;
      setCurrentAssignment(role);

      const grantsResponse = await api.get(`/itemtypeset-roles/${roleId}/grants`);
      setGrants(grantsResponse.data);

      const [usersResponse, groupsResponse, grantsResponse2, rolesResponse] = await Promise.all([
        api.get('/users'),
        api.get('/groups'),
        api.get('/grants'),
        api.get('/roles')
      ]);
      setUsers(usersResponse.data);
      setGroups(groupsResponse.data);
      setAvailableGrants(grantsResponse2.data);
      setAvailableRoles(rolesResponse.data);
    } catch (err) {
      setError('Errore nel caricamento dei dati');
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const assignGrantDirect = async (grantId: number) => {
    try {
      await api.post('/itemtypeset-roles/assign-grant-direct', null, {
        params: { roleId, grantId }
      });
      await fetchData();
    } catch (err) {
      setError('Errore nell\'assegnazione del grant diretto');
      console.error('Error assigning grant direct:', err);
    }
  };

  const assignRoleTemplate = async (roleTemplateId: number) => {
    try {
      await api.post('/itemtypeset-roles/assign-role-template', null, {
        params: { roleId, roleTemplateId }
      });
      await fetchData();
    } catch (err) {
      setError('Errore nell\'assegnazione del ruolo template');
      console.error('Error assigning role template:', err);
    }
  };

  const removeAssignment = async () => {
    try {
      await api.delete('/itemtypeset-roles/remove-assignment', {
        params: { roleId }
      });
      await fetchData();
    } catch (err) {
      setError('Errore nella rimozione dell\'assegnazione');
      console.error('Error removing assignment:', err);
    }
  };

  const removeGrantFromRole = async (grantId: number) => {
    try {
      await api.delete(`/itemtypeset-roles/remove-grant?roleId=${roleId}&grantId=${grantId}`);
      await fetchData();
    } catch (err) {
      setError('Errore nella rimozione del grant');
      console.error('Error removing grant:', err);
    }
  };

  const editGrant = (grant: GrantData) => {
    setShowAddGrant(false);
  };

  if (loading) {
    return <div className={layout.loading}>Caricamento...</div>;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className={layout.title}>Gestione Assegnazioni per Ruolo</h2>
          <button
            onClick={onClose}
            className={`${buttons.button} ${buttons.buttonSecondary}`}
          >
            <X size={20} />
          </button>
        </div>

        {/* Assegnazione corrente */}
        <CurrentAssignmentDisplay
          currentAssignment={currentAssignment}
          grantsCount={grants.length}
          onRemove={removeAssignment}
        />

        {/* Toggle modalità assegnazione */}
        <AssignmentModeToggle
          mode={assignmentMode}
          onModeChange={setAssignmentMode}
        />

        {error && (
          <div className={`${alert.error} mb-4`}>
            {error}
          </div>
        )}

        <div className="mb-6">
          <button
            onClick={() => setShowAddGrant(!showAddGrant)}
            className={`${buttons.button} ${buttons.buttonSmall}`}
          >
            <Plus size={16} className="mr-2" />
            {assignmentMode === 'GRANT' ? 'Aggiungi Grant' : 'Aggiungi Role'}
          </button>
        </div>

        {/* Selettore di assegnazione */}
        {showAddGrant && (
          <AssignmentSelector
            mode={assignmentMode}
            availableGrants={availableGrants}
            availableRoles={availableRoles}
            onAssignGrant={assignGrantDirect}
            onAssignRole={assignRoleTemplate}
          />
        )}

        {/* Lista grants assegnati */}
        <GrantsList
          grants={grants}
          users={users}
          groups={groups}
          onEdit={editGrant}
          onRemove={removeGrantFromRole}
        />
      </div>
    </div>
  );
}
