import { useState, useEffect } from 'react';
import { Save } from 'lucide-react';
import api from '../api/api';

import buttons from '../styles/common/Buttons.module.css';
import alert from '../styles/common/Alerts.module.css';

import PermissionHeader from './permissions/PermissionHeader';
import RoleAssignmentSection from './permissions/RoleAssignmentSection';
import GrantAssignmentSection from './permissions/GrantAssignmentSection';

interface User {
  id: number;
  username?: string;
  fullName?: string;
}

interface Group {
  id: number;
  name: string;
}

interface Role {
  id: number;
  name: string;
  description?: string;
}

interface Permission {
  id: number | string;
  name: string;
  workflowStatus?: { name: string };
  workflow?: { name: string };
  itemType?: { name: string };
  fieldConfiguration?: { name: string; fieldType: string };
  fromStatus?: { name: string };
  toStatus?: { name: string };
  transition?: any;
  assignedRoles?: Role[];
  assignedUsers?: User[];
  assignedGroups?: Group[];
  deniedUsers?: User[];
  deniedGroups?: Group[];
  assignedGrants?: any;
}

interface PermissionGrantManagerProps {
  permission: Permission;
  onClose: () => void;
  onSave: () => void;
}

export default function PermissionGrantManager({ 
  permission, 
  onClose, 
  onSave 
}: PermissionGrantManagerProps) {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Stati per ruoli
  const [selectedRoles, setSelectedRoles] = useState<Role[]>([]);
  const [availableRoles, setAvailableRoles] = useState<Role[]>([]);
  
  // Stati per utenti e gruppi
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [availableGroups, setAvailableGroups] = useState<Group[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [selectedGroups, setSelectedGroups] = useState<Group[]>([]);
  const [selectedDeniedUsers, setSelectedDeniedUsers] = useState<User[]>([]);
  const [selectedDeniedGroups, setSelectedDeniedGroups] = useState<Group[]>([]);

  useEffect(() => {
    if (permission) {
      fetchAvailableRoles();
      fetchAvailableUsers();
      fetchAvailableGroups();
      
      // Inizializza con i dati esistenti
      setSelectedRoles(permission.assignedRoles || []);
      setSelectedUsers(permission.assignedUsers || []);
      setSelectedGroups(permission.assignedGroups || []);
      setSelectedDeniedUsers(permission.deniedUsers || []);
      setSelectedDeniedGroups(permission.deniedGroups || []);
    }
  }, [permission]);

  const fetchAvailableRoles = async () => {
    try {
      const response = await api.get('/itemtypeset-permissions/roles');
      setAvailableRoles(response.data);
    } catch (err) {
      console.error('Error fetching roles:', err);
    }
  };

  const fetchAvailableUsers = async () => {
    try {
      const response = await api.get('/itemtypeset-permissions/users');
      setAvailableUsers(response.data);
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  };

  const fetchAvailableGroups = async () => {
    try {
      const response = await api.get('/itemtypeset-permissions/groups');
      setAvailableGroups(response.data);
    } catch (err) {
      console.error('Error fetching groups:', err);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    setError(null);

    try {
      const permissionId = typeof permission.id === 'string' && permission.id.startsWith('worker-') 
        ? null 
        : permission.id;

      if (!permissionId) {
        setError('I WORKER non possono avere ruoli o grants assegnati direttamente. I WORKER sono gestiti automaticamente dal sistema.');
        setLoading(false);
        return;
      }

      // Determina il tipo di permission dal nome
      let permissionType = permission.name?.toUpperCase();
      // Conversione dei nomi speciali
      if (permissionType === 'STATUSOWNER') permissionType = 'STATUS_OWNER';
      if (permissionType === 'FIELD EDITOR') permissionType = 'FIELD_EDITOR';

      // Gestione ruoli
      const originalRoles: Role[] = permission.assignedRoles || [];
      
      for (const originalRole of originalRoles) {
        if (!selectedRoles.find((role: Role) => role.id === originalRole.id)) {
          await api.delete('/itemtypeset-permissions/remove-role', {
            params: { permissionId, roleId: originalRole.id, permissionType }
          });
        }
      }

      for (const role of selectedRoles) {
        const isAlreadyAssigned = originalRoles.find((originalRole: Role) => originalRole.id === role.id);
        if (!isAlreadyAssigned) {
          await api.post('/itemtypeset-permissions/assign-role', null, {
            params: { permissionId, roleId: role.id, permissionType }
          });
        }
      }

      // Salva grant
      const grantData = {
        users: selectedUsers,
        groups: selectedGroups,
        deniedUsers: selectedDeniedUsers,
        deniedGroups: selectedDeniedGroups
      };

      await api.post('/itemtypeset-permissions/assign-grant', grantData, {
        params: { permissionId, permissionType }
      });

      onSave();
    } catch (err) {
      setError('Errore durante il salvataggio');
      console.error('Error saving permission assignments:', err);
    } finally {
      setLoading(false);
    }
  };

  // Funzioni per gestire ruoli
  const addRole = (role: Role) => {
    if (!selectedRoles.find(r => r.id === role.id)) {
      setSelectedRoles([...selectedRoles, role]);
    }
  };

  const removeRole = (roleId: number) => {
    setSelectedRoles(selectedRoles.filter(r => r.id !== roleId));
  };

  // Funzioni per gestire utenti
  const addUser = (user: User) => {
    if (!selectedUsers.find(u => u.id === user.id)) {
      setSelectedUsers([...selectedUsers, user]);
    }
  };

  const removeUser = (userId: number) => {
    setSelectedUsers(selectedUsers.filter(u => u.id !== userId));
  };

  // Funzioni per gestire gruppi autorizzati
  const addGroup = (group: Group) => {
    if (!selectedGroups.find(g => g.id === group.id)) {
      setSelectedGroups([...selectedGroups, group]);
    }
  };

  const removeGroup = (groupId: number) => {
    setSelectedGroups(selectedGroups.filter(g => g.id !== groupId));
  };

  // Funzioni per gestire utenti negati
  const addDeniedUser = (user: User) => {
    if (!selectedDeniedUsers.find(u => u.id === user.id)) {
      setSelectedDeniedUsers([...selectedDeniedUsers, user]);
    }
  };

  const removeDeniedUser = (userId: number) => {
    setSelectedDeniedUsers(selectedDeniedUsers.filter(u => u.id !== userId));
  };

  // Funzioni per gestire gruppi negati
  const addDeniedGroup = (group: Group) => {
    if (!selectedDeniedGroups.find(g => g.id === group.id)) {
      setSelectedDeniedGroups([...selectedDeniedGroups, group]);
    }
  };

  const removeDeniedGroup = (groupId: number) => {
    setSelectedDeniedGroups(selectedDeniedGroups.filter(g => g.id !== groupId));
  };

  if (!permission) return null;

  return (
    <div className="w-full">
      <PermissionHeader permission={permission} />

      {error && (
        <div className={`${alert.error} mb-4`}>
          <p>{error}</p>
        </div>
      )}

      {typeof permission.id === 'string' && permission.id.startsWith('worker-') && (
        <div className={`${alert.info} mb-4`}>
          <p><strong>Nota:</strong> I WORKER sono gestiti automaticamente dal sistema e non possono avere ruoli o grants assegnati direttamente.</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Sezione Ruoli */}
        <RoleAssignmentSection
          selectedRoles={selectedRoles}
          availableRoles={availableRoles}
          onAddRole={addRole}
          onRemoveRole={removeRole}
        />

        {/* Sezione Grant */}
        <GrantAssignmentSection
          selectedUsers={selectedUsers}
          selectedGroups={selectedGroups}
          selectedDeniedUsers={selectedDeniedUsers}
          selectedDeniedGroups={selectedDeniedGroups}
          availableUsers={availableUsers}
          availableGroups={availableGroups}
          onAddUser={addUser}
          onRemoveUser={removeUser}
          onAddGroup={addGroup}
          onRemoveGroup={removeGroup}
          onAddDeniedUser={addDeniedUser}
          onRemoveDeniedUser={removeDeniedUser}
          onAddDeniedGroup={addDeniedGroup}
          onRemoveDeniedGroup={removeDeniedGroup}
        />
      </div>

      {/* Pulsanti di azione */}
      <div className="flex justify-end gap-4 mt-6 pt-4 border-t">
        <button
          onClick={onClose}
          className={`${buttons.button} ${buttons.buttonSecondary}`}
          disabled={loading}
        >
          Annulla
        </button>
        <button
          onClick={handleSave}
          className={`${buttons.button} ${buttons.buttonPrimary}`}
          disabled={loading}
        >
          {loading ? 'Salvataggio...' : 'Salva Assegnazioni'}
          <Save size={16} className="ml-2" />
        </button>
      </div>
    </div>
  );
}
