import { useState, useEffect } from 'react';
import { Save } from 'lucide-react';
import api from '../api/api';

import buttons from '../styles/common/Buttons.module.css';
import alert from '../styles/common/Alerts.module.css';

import PermissionHeader from './permissions/PermissionHeader';
import RoleAssignmentSection from './permissions/RoleAssignmentSection';


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

  useEffect(() => {
    if (permission) {
      fetchAvailableRoles();
      
      // Inizializza con i dati esistenti
      setSelectedRoles(permission.assignedRoles || []);
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


  const handleSave = async () => {
    setLoading(true);
    setError(null);

    try {
      const permissionId = typeof permission.id === 'string' && permission.id.startsWith('worker-') 
        ? null 
        : permission.id;

      if (!permissionId) {
        setError('I WORKER non possono avere ruoli assegnati direttamente. I WORKER sono gestiti automaticamente dal sistema.');
        setLoading(false);
        return;
      }

      // Determina il tipo di permission dal nome
      const permissionType = permission.name?.toUpperCase();

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


  if (!permission) return null;

  return (
    <div className="w-full">
      <PermissionHeader permission={permission} />
      
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-gray-800">Gestione Ruoli per Permission</h2>
        <p className="text-sm text-gray-600">Assegna ruoli custom a questa permission. Le grant non sono più supportate.</p>
      </div>

      {error && (
        <div className={`${alert.error} mb-4`}>
          <p>{error}</p>
        </div>
      )}

      {typeof permission.id === 'string' && permission.id.startsWith('worker-') && (
        <div className={`${alert.info} mb-4`}>
          <p><strong>Nota:</strong> I WORKER sono gestiti automaticamente dal sistema e non possono avere ruoli assegnati direttamente.</p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6">
        {/* Sezione Ruoli */}
        <RoleAssignmentSection
          selectedRoles={selectedRoles}
          availableRoles={availableRoles}
          onAddRole={addRole}
          onRemoveRole={removeRole}
        />
      </div>

      {/* Pulsanti di azione */}
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
          {loading ? 'Salvataggio...' : 'Salva Ruoli'}
          <Save size={16} className="ml-2" />
        </button>
      </div>
    </div>
  );
}
