import React, { useState, useEffect } from 'react';
import { X, Plus, User, Users, Shield, ShieldOff, Edit, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
import api from '../api/api';

import layout from '../styles/common/Layout.module.css';
import buttons from '../styles/common/Buttons.module.css';
import alert from '../styles/common/Alerts.module.css';
import utilities from '../styles/common/Utilities.module.css';
import table from '../styles/common/Tables.module.css';

export default function RoleGrantManager({ roleId, onClose }) {
  const [grants, setGrants] = useState([]);
  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddGrant, setShowAddGrant] = useState(false);
  const [editingGrant, setEditingGrant] = useState(null);
  const [availableGrants, setAvailableGrants] = useState([]);
  const [availableRoles, setAvailableRoles] = useState([]);
  const [assignmentMode, setAssignmentMode] = useState('GRANT'); // 'GRANT' or 'ROLE'
  const [currentAssignment, setCurrentAssignment] = useState(null);

  useEffect(() => {
    fetchData();
  }, [roleId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      // Fetch role details and current assignment
      const roleResponse = await api.get(`/itemtypeset-roles/${roleId}`);
      const role = roleResponse.data;
      setCurrentAssignment(role);

      // Fetch grants for this role
      const grantsResponse = await api.get(`/itemtypeset-roles/${roleId}/grants`);
      setGrants(grantsResponse.data);

      // Fetch available users, groups, grants, and roles
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

  const assignGrantDirect = async (grantId) => {
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

  const assignRoleTemplate = async (roleTemplateId) => {
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

  const assignGrantToRole = async (grantId) => {
    try {
      await api.post('/itemtypeset-roles/assign-grant', {
        roleId,
        grantId
      });
      await fetchData();
    } catch (err) {
      setError('Errore nell\'assegnazione del grant');
      console.error('Error assigning grant:', err);
    }
  };

  const removeGrantFromRole = async (grantId) => {
    try {
      await api.delete(`/itemtypeset-roles/remove-grant?roleId=${roleId}&grantId=${grantId}`);
      await fetchData();
    } catch (err) {
      setError('Errore nella rimozione del grant');
      console.error('Error removing grant:', err);
    }
  };

  const editGrant = (grant) => {
    setEditingGrant(grant);
    setShowAddGrant(false);
  };

  const updateGrant = async (updatedGrant) => {
    try {
      // Implementa la logica di aggiornamento del grant
      await fetchData();
      setEditingGrant(null);
    } catch (err) {
      setError('Errore nell\'aggiornamento del grant');
      console.error('Error updating grant:', err);
    }
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

        {/* Current Assignment Display */}
        {currentAssignment && (
          <div className={layout.block}>
            <h3 className={layout.blockTitleBlue}>Assegnazione Corrente</h3>
            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
              {currentAssignment.assignmentType === 'GRANT' && currentAssignment.grantName && (
                <div className="flex items-center gap-2">
                  <Shield size={20} className="text-blue-600" />
                  <span className="font-medium">Grant: {currentAssignment.grantName}</span>
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">GRANT</span>
                </div>
              )}
              {currentAssignment.assignmentType === 'ROLE' && currentAssignment.roleTemplateName && (
                <div className="flex items-center gap-2">
                  <Users size={20} className="text-green-600" />
                  <span className="font-medium">Role: {currentAssignment.roleTemplateName}</span>
                  <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">ROLE</span>
                </div>
              )}
              {currentAssignment.assignmentType === 'GRANTS' && grants.length > 0 && (
                <div className="flex items-center gap-2">
                  <Shield size={20} className="text-purple-600" />
                  <span className="font-medium">{grants.length} Grants associati</span>
                  <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs">GRANTS</span>
                </div>
              )}
              {currentAssignment.assignmentType === 'NONE' && (
                <div className="flex items-center gap-2">
                  <ShieldOff size={20} className="text-gray-400" />
                  <span className="font-medium text-gray-500">Nessuna assegnazione</span>
                  <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs">NONE</span>
                </div>
              )}
              {currentAssignment.assignmentType !== 'NONE' && (
                <button
                  onClick={removeAssignment}
                  className={`${buttons.button} ${buttons.buttonSmall} ${buttons.buttonDanger} ml-auto`}
                >
                  <Trash2 size={16} className="mr-1" />
                  Rimuovi
                </button>
              )}
            </div>
          </div>
        )}

        {/* Assignment Mode Toggle */}
        <div className={layout.block}>
          <h3 className={layout.blockTitleBlue}>Modalità Assegnazione</h3>
          <div className="flex gap-4 mb-4">
            <button
              onClick={() => setAssignmentMode('GRANT')}
              className={`${buttons.button} ${buttons.buttonSmall} ${
                assignmentMode === 'GRANT' ? buttons.buttonPrimary : buttons.buttonSecondary
              }`}
            >
              <Shield size={16} className="mr-2" />
              Grant Diretto
            </button>
            <button
              onClick={() => setAssignmentMode('ROLE')}
              className={`${buttons.button} ${buttons.buttonSmall} ${
                assignmentMode === 'ROLE' ? buttons.buttonPrimary : buttons.buttonSecondary
              }`}
            >
              <Users size={16} className="mr-2" />
              Role Template
            </button>
          </div>
        </div>

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

        {showAddGrant && (
          <div className={layout.block}>
            <h3 className={layout.blockTitleBlue}>
              {assignmentMode === 'GRANT' ? 'Assegna Grant Diretto' : 'Assegna Role Template'}
            </h3>
            <div className={utilities.mt4}>
              <p className={layout.paragraphMuted}>
                {assignmentMode === 'GRANT' 
                  ? 'Seleziona un grant da assegnare direttamente a questo ruolo.'
                  : 'Seleziona un ruolo template da assegnare a questo ruolo.'
                }
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                {assignmentMode === 'GRANT' ? (
                  availableGrants.map((grant) => (
                    <div key={grant.id} className="p-3 border rounded-lg hover:bg-gray-50">
                      <div className="flex justify-between items-center">
                        <div>
                          <h4 className="font-medium">{grant.name || `Grant ${grant.id}`}</h4>
                          <p className="text-sm text-gray-600">{grant.description || 'Nessuna descrizione'}</p>
                        </div>
                        <button
                          onClick={() => assignGrantDirect(grant.id)}
                          className={`${buttons.button} ${buttons.buttonSmall} ${buttons.buttonPrimary}`}
                        >
                          <Plus size={16} className="mr-1" />
                          Assegna
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  availableRoles.map((role) => (
                    <div key={role.id} className="p-3 border rounded-lg hover:bg-gray-50">
                      <div className="flex justify-between items-center">
                        <div>
                          <h4 className="font-medium">{role.name}</h4>
                          <p className="text-sm text-gray-600">Scope: {role.scope}</p>
                        </div>
                        <button
                          onClick={() => assignRoleTemplate(role.id)}
                          className={`${buttons.button} ${buttons.buttonSmall} ${buttons.buttonPrimary}`}
                        >
                          <Plus size={16} className="mr-1" />
                          Assegna
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        <div className={layout.block}>
          <h3 className={layout.blockTitleBlue}>Grants Assegnati</h3>
          <div className={utilities.mt4}>
            {grants.length === 0 ? (
              <p className={layout.paragraphMuted}>Nessun grant assegnato a questo ruolo.</p>
            ) : (
              <table className={table.table}>
                <thead>
                  <tr>
                    <th>Grant ID</th>
                    <th>Utenti Assegnati</th>
                    <th>Gruppi Assegnati</th>
                    <th>Utenti Negati</th>
                    <th>Gruppi Negati</th>
                    <th>Azioni</th>
                  </tr>
                </thead>
                <tbody>
                  {grants.map((grant) => (
                    <tr key={grant.id}>
                      <td>
                        <span className="font-mono text-sm">{grant.grantId}</span>
                      </td>
                      <td>
                        <div className="flex flex-wrap gap-1">
                          {grant.grantedUserIds?.map(userId => {
                            const user = users.find(u => u.id === userId);
                            return (
                              <span key={userId} className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                                <User size={12} className="inline mr-1" />
                                {user?.username || userId}
                              </span>
                            );
                          })}
                        </div>
                      </td>
                      <td>
                        <div className="flex flex-wrap gap-1">
                          {grant.grantedGroupIds?.map(groupId => {
                            const group = groups.find(g => g.id === groupId);
                            return (
                              <span key={groupId} className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                                <Users size={12} className="inline mr-1" />
                                {group?.name || groupId}
                              </span>
                            );
                          })}
                        </div>
                      </td>
                      <td>
                        <div className="flex flex-wrap gap-1">
                          {grant.negatedUserIds?.map(userId => {
                            const user = users.find(u => u.id === userId);
                            return (
                              <span key={userId} className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">
                                <ShieldOff size={12} className="inline mr-1" />
                                {user?.username || userId}
                              </span>
                            );
                          })}
                        </div>
                      </td>
                      <td>
                        <div className="flex flex-wrap gap-1">
                          {grant.negatedGroupIds?.map(groupId => {
                            const group = groups.find(g => g.id === groupId);
                            return (
                              <span key={groupId} className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">
                                <ShieldOff size={12} className="inline mr-1" />
                                {group?.name || groupId}
                              </span>
                            );
                          })}
                        </div>
                      </td>
                      <td>
                        <div className="flex gap-1">
                          <button
                            onClick={() => editGrant(grant)}
                            className={`${buttons.button} ${buttons.buttonSmall} ${buttons.buttonSecondary}`}
                            title="Modifica Grant"
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            onClick={() => removeGrantFromRole(grant.grantId)}
                            className={`${buttons.button} ${buttons.buttonSmall} ${buttons.buttonDanger}`}
                            title="Rimuovi Grant"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
