import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight, Users, Shield, Edit, Eye, Plus, Trash2 } from 'lucide-react';
import api from '../api/api';
import PermissionGrantManager from './PermissionGrantManager';

import layout from '../styles/common/Layout.module.css';
import buttons from '../styles/common/Buttons.module.css';
import alert from '../styles/common/Alerts.module.css';
import utilities from '../styles/common/Utilities.module.css';
import table from '../styles/common/Tables.module.css';

const ROLE_TYPES = {
  WORKER: { label: 'Worker', icon: Users, color: 'blue', description: 'Per ogni ItemType' },
  STATUS_OWNER: { label: 'StatusOwner', icon: Shield, color: 'green', description: 'Per ogni WorkflowStatus' },
  FIELD_EDITOR: { label: 'Field Editor', icon: Edit, color: 'purple', description: 'Per ogni FieldConfiguration (sempre)' },
  CREATOR: { label: 'Creator', icon: Plus, color: 'orange', description: 'Per ogni Workflow' },
  EXECUTOR: { label: 'Executor', icon: Shield, color: 'red', description: 'Per ogni Transition' },
  EDITOR: { label: 'Editor', icon: Edit, color: 'indigo', description: 'Per coppia (Field + Status)' },
  VIEWER: { label: 'Viewer', icon: Eye, color: 'gray', description: 'Per coppia (Field + Status)' }
};

export default function ItemTypeSetRoleManager({ itemTypeSetId, onClose, onPermissionGrantClick, refreshTrigger }) {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedRoles, setExpandedRoles] = useState({});
  const [selectedPermissionForGrants, setSelectedPermissionForGrants] = useState(null);

  useEffect(() => {
    if (itemTypeSetId) {
      fetchRoles();
    }
  }, [itemTypeSetId, refreshTrigger]);

  const fetchRoles = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/itemtypeset-permissions/itemtypeset/${itemTypeSetId}`);
      console.log('ItemTypeSetRoleManager - Raw response data:', response.data);
      setRoles(response.data);
    } catch (err) {
      // Se le permissions non esistono, proviamo a crearle
      if (err.response?.status === 500) {
        try {
          await api.post(`/itemtypeset-permissions/create-for-itemtypeset/${itemTypeSetId}`);
          // Riprova a caricare le permissions
          const retryResponse = await api.get(`/itemtypeset-permissions/itemtypeset/${itemTypeSetId}`);
          console.log('ItemTypeSetRoleManager - Retry response data:', retryResponse.data);
          setRoles(retryResponse.data);
        } catch (createErr) {
          setError('Errore nella creazione delle permissions');
          console.error('Error creating permissions:', createErr);
        }
      } else {
        setError('Errore nel caricamento delle permissions');
        console.error('Error fetching permissions:', err);
      }
    } finally {
      setLoading(false);
    }
  };



  const toggleRoleExpansion = (roleId) => {
    setExpandedRoles(prev => ({
      ...prev,
      [roleId]: !prev[roleId]
    }));
  };

  const getRoleIcon = (roleType) => {
    const IconComponent = ROLE_TYPES[roleType]?.icon || Users;
    return <IconComponent size={16} />;
  };

  const getRoleColor = (roleType) => {
    return ROLE_TYPES[roleType]?.color || 'gray';
  };

  const getRoleDescription = (roleType) => {
    return ROLE_TYPES[roleType]?.description || '';
  };

  const groupRolesByType = () => {
    // La nuova API restituisce già i dati raggruppati per tipo
    return roles || {};
  };

  if (loading) {
    return <div className={layout.loading}>Caricamento permissions...</div>;
  }

  if (error) {
    return <div className={alert.error}>{error}</div>;
  }

  const groupedRoles = groupRolesByType();

  return (
    <div className="w-full">
      <div className="mb-4">
        <p className={layout.paragraphMuted}>
          Le permissions sono create automaticamente per ogni ItemTypeSet. Ogni permission ha un ambito specifico e può essere associata a ruoli personalizzati o grants.
        </p>
      </div>

      {Object.keys(groupedRoles).length === 0 ? (
        <div className={alert.info}>
          <p>Nessuna permission configurata per questo ItemTypeSet.</p>
          <p className="mt-2">Le permissions vengono create automaticamente quando si crea o modifica un ItemTypeSet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(groupedRoles).map(([roleType, roleList]) => (
            <div key={roleType} className={layout.block}>
              <div className={layout.blockHeader}>
                <div className="flex items-center gap-3">
                  {getRoleIcon(roleType)}
                  <h3 className={layout.blockTitleBlue}>
                    {ROLE_TYPES[roleType]?.label || roleType}
                  </h3>
                  <span className={`px-2 py-1 rounded-full text-xs bg-${getRoleColor(roleType)}-100 text-${getRoleColor(roleType)}-800`}>
                    {roleList.length}
                  </span>
                </div>
                <p className={layout.paragraphMuted}>
                  {ROLE_TYPES[roleType]?.description || ''}
                </p>
              </div>

              <div className={utilities.mt4}>
                <table className={table.table}>
                  <thead>
                    <tr>
                      <th>Nome</th>
                      {roleType === 'WORKER' && (
                        <th>ItemType</th>
                      )}
                      {roleType === 'STATUS_OWNER' && (
                        <th>Stato / Workflow / ItemType</th>
                      )}
                      {roleType === 'FIELD_EDITOR' && (
                        <th>Field / Tipologia / ItemType</th>
                      )}
                      {roleType === 'CREATOR' && (
                        <th>Workflow / ItemType</th>
                      )}
                      {roleType === 'EXECUTOR' && (
                        <th>Transizione / Stati / Workflow / ItemType</th>
                      )}
                      {(roleType === 'EDITOR' || roleType === 'VIEWER') && (
                        <th>Field / Stato / ItemType</th>
                      )}
                      <th>Grants</th>
                      <th>Azioni</th>
                    </tr>
                  </thead>
                  <tbody>
                    {roleList.map((role) => (
                      <tr key={role.id}>
                        <td>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => toggleRoleExpansion(role.id)}
                              className="p-1 hover:bg-gray-100 rounded"
                            >
                              {expandedRoles[role.id] ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                            </button>
                            <span className="font-medium">{role.name}</span>
                          </div>
                        </td>
                        {roleType === 'WORKER' && (
                          <td>
                            <div className="text-sm text-gray-600">
                              <div><strong>ItemType:</strong> {role.itemType?.name || 'N/A'}</div>
                            </div>
                          </td>
                        )}
                        {roleType === 'STATUS_OWNER' && (
                          <td>
                            <div className="text-sm text-gray-600">
                              <div><strong>Stato:</strong> {role.workflowStatus?.name || 'N/A'}</div>
                              <div><strong>Workflow:</strong> {role.workflow?.name || 'N/A'}</div>
                              <div><strong>ItemType:</strong> {role.itemType?.name || 'N/A'}</div>
                            </div>
                          </td>
                        )}
                        {roleType === 'FIELD_EDITOR' && (
                          <td>
                            <div className="text-sm text-gray-600">
                              <div><strong>Field:</strong> {role.fieldConfiguration?.name || 'N/A'}</div>
                              <div><strong>Tipologia:</strong> {role.fieldConfiguration?.fieldType || 'N/A'}</div>
                              <div><strong>ItemType:</strong> {role.itemType?.name || 'N/A'}</div>
                            </div>
                          </td>
                        )}
                        {roleType === 'CREATOR' && (
                          <td>
                            <div className="text-sm text-gray-600">
                              <div><strong>Workflow:</strong> {role.workflow?.name || 'N/A'}</div>
                              <div><strong>ItemType:</strong> {role.itemType?.name || 'N/A'}</div>
                            </div>
                          </td>
                        )}
                        {roleType === 'EXECUTOR' && (
                          <td>
                            <div className="text-sm text-gray-600">
                              <div><strong>Transizione:</strong> {role.transition?.name && role.transition?.name !== 'N/A' ? role.transition.name : `${role.fromStatus?.name} → ${role.toStatus?.name}`}</div>
                              <div><strong>Da:</strong> {role.fromStatus?.name || 'N/A'}</div>
                              <div><strong>A:</strong> {role.toStatus?.name || 'N/A'}</div>
                              <div><strong>Workflow:</strong> {role.workflow?.name || 'N/A'}</div>
                              <div><strong>ItemType:</strong> {role.itemType?.name || 'N/A'}</div>
                            </div>
                          </td>
                        )}
                        {(roleType === 'EDITOR' || roleType === 'VIEWER') && (
                          <td>
                            <div className="text-sm text-gray-600">
                              <div><strong>Field:</strong> {role.fieldConfiguration?.name || 'N/A'}</div>
                              <div><strong>Stato:</strong> {role.workflowStatus?.name || 'N/A'}</div>
                              <div><strong>ItemType:</strong> {role.itemType?.name || 'N/A'}</div>
                            </div>
                          </td>
                        )}
                        <td>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600">
                              {role.assignedRolesCount || 0} ruoli
                              {((role.assignedUsers && role.assignedUsers.length > 0) || 
                                (role.assignedGroups && role.assignedGroups.length > 0) ||
                                (role.deniedUsers && role.deniedUsers.length > 0) ||
                                (role.deniedGroups && role.deniedGroups.length > 0)) && (
                                <span className="ml-1">• Assegnazioni</span>
                              )}
                            </span>
                            {((role.assignedRolesCount || 0) > 0 || 
                              ((role.assignedUsers && role.assignedUsers.length > 0) || 
                               (role.assignedGroups && role.assignedGroups.length > 0) ||
                               (role.deniedUsers && role.deniedUsers.length > 0) ||
                               (role.deniedGroups && role.deniedGroups.length > 0))) && (
                              <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                Assegnato
                              </span>
                            )}
                          </div>
                        </td>
                        <td>
                          <div className="flex gap-1">
              <button
                onClick={() => {
                  console.log('Permission button clicked:', role);
                  console.log('Role assignedUsers:', role.assignedUsers);
                  console.log('Role assignedGroups:', role.assignedGroups);
                  console.log('Role assignedRoles:', role.assignedRoles);
                  if (onPermissionGrantClick) {
                    onPermissionGrantClick(role);
                  } else {
                    setSelectedPermissionForGrants(role);
                  }
                }}
                className={`${buttons.button} ${buttons.buttonSmall} ${buttons.buttonSecondary}`}
                title="Gestisci Grants e Ruoli"
              >
                <Shield size={14} />
              </button>
                            <button
                              className={`${buttons.button} ${buttons.buttonSmall} ${buttons.buttonDanger}`}
                              title="Elimina Ruolo"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

