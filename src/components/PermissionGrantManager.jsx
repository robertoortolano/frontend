import React, { useState, useEffect } from 'react';
import { X, Users, UserPlus, UserMinus, Shield, Save } from 'lucide-react';
import api from '../api/api';
import { useAuth } from '../context/AuthContext';

import buttons from '../styles/common/Buttons.module.css';
import alert from '../styles/common/Alerts.module.css';

export default function PermissionGrantManager({ 
  permission, 
  onClose, 
  onSave 
}) {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Dati del form
  const [selectedRoles, setSelectedRoles] = useState([]);
  const [availableRoles, setAvailableRoles] = useState([]);
  
  // Dati per la grant
  const [grantData, setGrantData] = useState({
    users: [],
    groups: [],
    deniedUsers: [],
    deniedGroups: []
  });
  
  // Lista di utenti e gruppi disponibili
  const [availableUsers, setAvailableUsers] = useState([]);
  const [availableGroups, setAvailableGroups] = useState([]);
  
  // Utenti e gruppi selezionati per la grant
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [selectedGroups, setSelectedGroups] = useState([]);
  const [selectedDeniedUsers, setSelectedDeniedUsers] = useState([]);
  const [selectedDeniedGroups, setSelectedDeniedGroups] = useState([]);

  useEffect(() => {
    if (permission) {
      console.log('PermissionGrantManager - permission data:', permission);
      console.log('PermissionGrantManager - assignedUsers:', permission.assignedUsers);
      console.log('PermissionGrantManager - assignedGroups:', permission.assignedGroups);
      console.log('PermissionGrantManager - assignedRoles:', permission.assignedRoles);
      
      // Carica i ruoli disponibili
      fetchAvailableRoles();
      // Carica utenti e gruppi disponibili
      fetchAvailableUsers();
      fetchAvailableGroups();
      
      // Inizializza con i dati esistenti
      if (permission.assignedRoles && Array.isArray(permission.assignedRoles)) {
        console.log('Loading assigned roles:', permission.assignedRoles);
        setSelectedRoles(permission.assignedRoles);
      } else {
        console.log('No assigned roles found, setting empty array');
        setSelectedRoles([]);
      }
      
      if (permission.assignedUsers && Array.isArray(permission.assignedUsers)) {
        console.log('Loading assigned users:', permission.assignedUsers);
        setSelectedUsers(permission.assignedUsers);
      } else {
        console.log('No assigned users found, setting empty array');
        setSelectedUsers([]);
      }
      
      if (permission.assignedGroups && Array.isArray(permission.assignedGroups)) {
        console.log('Loading assigned groups:', permission.assignedGroups);
        setSelectedGroups(permission.assignedGroups);
      } else {
        console.log('No assigned groups found, setting empty array');
        setSelectedGroups([]);
      }
      
      if (permission.deniedUsers && Array.isArray(permission.deniedUsers)) {
        console.log('Loading denied users:', permission.deniedUsers);
        setSelectedDeniedUsers(permission.deniedUsers);
      } else {
        console.log('No denied users found, setting empty array');
        setSelectedDeniedUsers([]);
      }
      
      if (permission.deniedGroups && Array.isArray(permission.deniedGroups)) {
        console.log('Loading denied groups:', permission.deniedGroups);
        setSelectedDeniedGroups(permission.deniedGroups);
      } else {
        console.log('No denied groups found, setting empty array');
        setSelectedDeniedGroups([]);
      }
      
      // TODO: Carica i dati della grant esistente
      if (permission.assignedGrants) {
        // Per ora non carichiamo i grants esistenti
        // TODO: Implementare il caricamento dei grants esistenti
      }
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
      const response = await api.get('/itemtypeset-permissions/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAvailableUsers(response.data);
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  };

  const fetchAvailableGroups = async () => {
    try {
      const response = await api.get('/itemtypeset-permissions/groups', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAvailableGroups(response.data);
    } catch (err) {
      console.error('Error fetching groups:', err);
    }
  };

  const handleSave = async () => {
    console.log('handleSave called', { selectedRoles, selectedUsers, selectedGroups, selectedDeniedUsers, selectedDeniedGroups });
    setLoading(true);
    setError(null);

    try {
      // Controlla se l'ID della permission è numerico (non per WORKER)
      const permissionId = typeof permission.id === 'string' && permission.id.startsWith('worker-') 
        ? null 
        : permission.id;

      if (!permissionId) {
        setError('I WORKER non possono avere ruoli o grants assegnati direttamente. I WORKER sono gestiti automaticamente dal sistema.');
        setLoading(false);
        return;
      }

      // Rimuovi ruoli che non sono più selezionati
      const originalRoles = permission.assignedRoles || [];
      console.log('Original roles:', originalRoles);
      console.log('Selected roles:', selectedRoles);
      
      for (const originalRole of originalRoles) {
        if (!selectedRoles.find(role => role.id === originalRole.id)) {
          console.log('Removing role:', originalRole.id);
          await api.delete('/itemtypeset-permissions/remove-role', {
            params: {
              permissionId: permissionId,
              roleId: originalRole.id
            },
            headers: { Authorization: `Bearer ${token}` }
          });
        }
      }

      // Salva assegnazioni ruoli se presenti
      for (const role of selectedRoles) {
        // Controlla se il ruolo è già assegnato
        const isAlreadyAssigned = originalRoles.find(originalRole => originalRole.id === role.id);
        if (!isAlreadyAssigned) {
          console.log('Adding role:', role.id);
          await api.post('/itemtypeset-permissions/assign-role', null, {
            params: {
              permissionId: permissionId,
              roleId: role.id
            },
            headers: { Authorization: `Bearer ${token}` }
          });
        } else {
          console.log('Role already assigned:', role.id);
        }
      }

      // Salva grant sempre (anche se vuota per pulire le assegnazioni)
      const grantData = {
        users: selectedUsers,
        groups: selectedGroups,
        deniedUsers: selectedDeniedUsers,
        deniedGroups: selectedDeniedGroups
      };

      console.log('Saving grant data:', grantData);
      await api.post('/itemtypeset-permissions/assign-grant', grantData, {
        params: { permissionId: permissionId },
        headers: { Authorization: `Bearer ${token}` }
      });

      onSave();
    } catch (err) {
      setError('Errore durante il salvataggio');
      console.error('Error saving permission assignments:', err);
    } finally {
      setLoading(false);
    }
  };

  const addUser = (user) => {
    if (!selectedUsers.find(u => u.id === user.id)) {
      setSelectedUsers([...selectedUsers, user]);
    }
  };

  const removeUser = (userId) => {
    setSelectedUsers(selectedUsers.filter(u => u.id !== userId));
  };

  const addRole = (role) => {
    if (!selectedRoles.find(r => r.id === role.id)) {
      setSelectedRoles([...selectedRoles, role]);
    }
  };

  const removeRole = (roleId) => {
    setSelectedRoles(selectedRoles.filter(r => r.id !== roleId));
  };

  const addDeniedUser = (user) => {
    if (!selectedDeniedUsers.find(u => u.id === user.id)) {
      setSelectedDeniedUsers([...selectedDeniedUsers, user]);
    }
  };

  const removeDeniedUser = (userId) => {
    setSelectedDeniedUsers(selectedDeniedUsers.filter(u => u.id !== userId));
  };

  const addDeniedGroup = (group) => {
    if (!selectedDeniedGroups.find(g => g.id === group.id)) {
      setSelectedDeniedGroups([...selectedDeniedGroups, group]);
    }
  };

  const removeDeniedGroup = (groupId) => {
    setSelectedDeniedGroups(selectedDeniedGroups.filter(g => g.id !== groupId));
  };

  if (!permission) return null;

  return (
    <div className="w-full">
      <div className="mb-6" style={{ 
        backgroundColor: 'white', 
        padding: '1rem',
        borderRadius: '0.5rem',
        border: '1px solid #e5e7eb'
      }}>
        <div>
          <h2 style={{ 
            fontSize: '1.25rem', 
            fontWeight: '600', 
            marginBottom: '0.5rem',
            color: '#1e3a8a',
            backgroundColor: 'white'
          }}>Gestione Permission: {permission.name}</h2>
          {permission.workflowStatus && (
            <p style={{ 
              fontSize: '0.875rem', 
              marginTop: '0.25rem',
              color: '#1e3a8a',
              backgroundColor: 'white'
            }}>
              Stato: {permission.workflowStatus.name} - Workflow: {permission.workflow?.name} - ItemType: {permission.itemType?.name}
            </p>
          )}
          {permission.fieldConfiguration && (
            <p style={{ 
              fontSize: '0.875rem', 
              marginTop: '0.25rem',
              color: '#1e3a8a',
              backgroundColor: 'white'
            }}>
              Field: {permission.fieldConfiguration.name} - Tipologia: {permission.fieldConfiguration.fieldType} - ItemType: {permission.itemType?.name}
            </p>
          )}
          {permission.workflow && !permission.workflowStatus && !permission.fieldConfiguration && (
            <p style={{ 
              fontSize: '0.875rem', 
              marginTop: '0.25rem',
              color: '#1e3a8a',
              backgroundColor: 'white'
            }}>
              Workflow: {permission.workflow.name} - ItemType: {permission.itemType?.name}
            </p>
          )}
          {permission.transition && (
            <p style={{ 
              fontSize: '0.875rem', 
              marginTop: '0.25rem',
              color: '#1e3a8a',
              backgroundColor: 'white'
            }}>
              Transizione: {permission.fromStatus?.name} → {permission.toStatus?.name} - Workflow: {permission.workflow?.name} - ItemType: {permission.itemType?.name}
            </p>
          )}
        </div>
      </div>

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
            <label style={{ 
              display: 'block', 
              fontWeight: '600', 
              color: '#1e3a8a', 
              marginBottom: '0.5rem' 
            }}>Ruoli Assegnati</label>
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
                        onClick={() => removeRole(role.id)}
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
            <label style={{ 
              display: 'block', 
              fontWeight: '600', 
              color: '#1e3a8a', 
              marginBottom: '0.5rem' 
            }}>Aggiungi Ruolo</label>
            <select
              onChange={(e) => {
                const roleId = e.target.value;
                if (roleId) {
                  const role = availableRoles.find(r => r.id == roleId);
                  if (role) addRole(role);
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

        {/* Sezione Grant */}
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

          {/* Utenti Autorizzati */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ 
              display: 'block', 
              fontWeight: '600', 
              color: '#1e3a8a', 
              marginBottom: '0.5rem' 
            }}>Utenti Autorizzati</label>
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
                    <div key={user.id} className="flex items-center justify-between bg-green-50 p-2 rounded">
                      <span className="text-sm">{user.fullName || user.username || `User ${user.id}`}</span>
                      <button
                        onClick={() => removeUser(user.id)}
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

          {/* Aggiungi utente autorizzato */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ 
              display: 'block', 
              fontWeight: '600', 
              color: '#1e3a8a', 
              marginBottom: '0.5rem' 
            }}>Aggiungi Utente Autorizzato</label>
            <select
              onChange={(e) => {
                const userId = e.target.value;
                if (userId) {
                  const user = (availableUsers || []).find(u => u.id == userId);
                  if (user) addUser(user);
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

          {/* Gruppi Autorizzati */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ 
              display: 'block', 
              fontWeight: '600', 
              color: '#1e3a8a', 
              marginBottom: '0.5rem' 
            }}>Gruppi Autorizzati</label>
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
                    <div key={group.id} className="flex items-center justify-between bg-green-50 p-2 rounded">
                      <span className="text-sm">{group.name}</span>
                      <button
                        onClick={() => setSelectedGroups(selectedGroups.filter(g => g.id !== group.id))}
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

          {/* Aggiungi gruppo autorizzato */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ 
              display: 'block', 
              fontWeight: '600', 
              color: '#1e3a8a', 
              marginBottom: '0.5rem' 
            }}>Aggiungi Gruppo Autorizzato</label>
            <select
              onChange={(e) => {
                const groupId = e.target.value;
                if (groupId) {
                  const group = (availableGroups || []).find(g => g.id == groupId);
                  if (group) {
                    setSelectedGroups([...selectedGroups, group]);
                  }
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

          {/* Utenti Negati */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ 
              display: 'block', 
              fontWeight: '600', 
              color: '#1e3a8a', 
              marginBottom: '0.5rem' 
            }}>Utenti Negati</label>
            <div style={{ 
              border: '1px solid #e5e7eb', 
              borderRadius: '0.5rem', 
              padding: '0.75rem', 
              minHeight: '100px',
              backgroundColor: 'white'
            }}>
              {selectedDeniedUsers.length === 0 ? (
                <p className="text-gray-500 text-sm">Nessun utente negato</p>
              ) : (
                <div className="space-y-2">
                  {selectedDeniedUsers.map(user => (
                    <div key={user.id} className="flex items-center justify-between bg-red-50 p-2 rounded">
                      <span className="text-sm">{user.fullName || user.username || `User ${user.id}`}</span>
                      <button
                        onClick={() => removeDeniedUser(user.id)}
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

          {/* Aggiungi utente negato */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ 
              display: 'block', 
              fontWeight: '600', 
              color: '#1e3a8a', 
              marginBottom: '0.5rem' 
            }}>Aggiungi Utente Negato</label>
            <select
              onChange={(e) => {
                const userId = e.target.value;
                if (userId) {
                  const user = (availableUsers || []).find(u => u.id == userId);
                  if (user) addDeniedUser(user);
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
                .filter(user => !selectedDeniedUsers.find(u => u.id === user.id))
                .map(user => (
                  <option key={user.id} value={user.id}>
                    {user.fullName || user.username || `User ${user.id}`}
                  </option>
                ))}
            </select>
          </div>

          {/* Gruppi Negati */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ 
              display: 'block', 
              fontWeight: '600', 
              color: '#1e3a8a', 
              marginBottom: '0.5rem' 
            }}>Gruppi Negati</label>
            <div style={{ 
              border: '1px solid #e5e7eb', 
              borderRadius: '0.5rem', 
              padding: '0.75rem', 
              minHeight: '100px',
              backgroundColor: 'white'
            }}>
              {selectedDeniedGroups.length === 0 ? (
                <p className="text-gray-500 text-sm">Nessun gruppo negato</p>
              ) : (
                <div className="space-y-2">
                  {selectedDeniedGroups.map(group => (
                    <div key={group.id} className="flex items-center justify-between bg-red-50 p-2 rounded">
                      <span className="text-sm">{group.name}</span>
                      <button
                        onClick={() => removeDeniedGroup(group.id)}
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

          {/* Aggiungi gruppo negato */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ 
              display: 'block', 
              fontWeight: '600', 
              color: '#1e3a8a', 
              marginBottom: '0.5rem' 
            }}>Aggiungi Gruppo Negato</label>
            <select
              onChange={(e) => {
                const groupId = e.target.value;
                if (groupId) {
                  const group = (availableGroups || []).find(g => g.id == groupId);
                  if (group) addDeniedGroup(group);
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
                .filter(group => !selectedDeniedGroups.find(g => g.id === group.id))
                .map(group => (
                  <option key={group.id} value={group.id}>
                    {group.name}
                  </option>
                ))}
            </select>
          </div>
        </div>
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