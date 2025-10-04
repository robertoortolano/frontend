import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight, Users, Shield, Edit, Eye, Plus, Trash2 } from 'lucide-react';
import api from '../api/api';
import CreateRoleForm from './CreateRoleForm';
import RoleGrantManager from './RoleGrantManager';

import layout from '../styles/common/Layout.module.css';
import buttons from '../styles/common/Buttons.module.css';
import alert from '../styles/common/Alerts.module.css';
import utilities from '../styles/common/Utilities.module.css';
import table from '../styles/common/Tables.module.css';

const ROLE_TYPES = {
  WORKER: { label: 'Worker', icon: Users, color: 'blue', description: 'Per ogni ItemType' },
  OWNER: { label: 'Owner', icon: Shield, color: 'green', description: 'Per ogni WorkflowStatus' },
  FIELD_EDITOR: { label: 'Field Editor', icon: Edit, color: 'purple', description: 'Per ogni FieldConfiguration (sempre)' },
  CREATOR: { label: 'Creator', icon: Plus, color: 'orange', description: 'Per ogni Workflow' },
  EXECUTOR: { label: 'Executor', icon: Shield, color: 'red', description: 'Per ogni Transition' },
  EDITOR: { label: 'Editor', icon: Edit, color: 'indigo', description: 'Per coppia (Field + Status)' },
  VIEWER: { label: 'Viewer', icon: Eye, color: 'gray', description: 'Per coppia (Field + Status)' }
};

export default function ItemTypeSetRoleManager({ itemTypeSetId }) {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedRoles, setExpandedRoles] = useState({});
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedRoleForGrants, setSelectedRoleForGrants] = useState(null);

  useEffect(() => {
    if (itemTypeSetId) {
      fetchRoles();
    }
  }, [itemTypeSetId]);

  const fetchRoles = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/itemtypeset-roles/itemtypeset/${itemTypeSetId}`);
      setRoles(response.data);
    } catch (err) {
      setError('Errore nel caricamento dei ruoli');
      console.error('Error fetching roles:', err);
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

  const getRoleDescription = (role) => {
    if (role.roleType === 'EDITOR' || role.roleType === 'VIEWER') {
      return `Per coppia (${role.secondaryEntityType || 'Field'} + Status)`;
    }
    return ROLE_TYPES[role.roleType]?.description || '';
  };

  const groupRolesByType = () => {
    const grouped = {};
    roles.forEach(role => {
      if (!grouped[role.roleType]) {
        grouped[role.roleType] = [];
      }
      grouped[role.roleType].push(role);
    });
    return grouped;
  };

  if (loading) {
    return <div className={layout.loading}>Caricamento ruoli...</div>;
  }

  if (error) {
    return <div className={alert.error}>{error}</div>;
  }

  const groupedRoles = groupRolesByType();

  return (
    <div className={layout.container}>
      <div className="flex justify-between items-center mb-6">
        <h2 className={layout.title}>Gestione Ruoli ItemTypeSet</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setShowCreateForm(true)}
            className={`${buttons.button} ${buttons.buttonSmall} ${buttons.buttonSecondary}`}
          >
            <Plus size={16} className="mr-2" />
            Crea Ruolo Manuale
          </button>
        </div>
      </div>

      {Object.keys(groupedRoles).length === 0 ? (
        <div className={alert.info}>
          <p>Nessun ruolo configurato per questo ItemTypeSet.</p>
          <p className="mt-2">I ruoli vengono creati automaticamente quando si crea o modifica un ItemTypeSet.</p>
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
                      {roleType === 'EDITOR' || roleType === 'VIEWER' ? (
                        <th>Coppia (Field + Status)</th>
                      ) : null}
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
                        {(roleType === 'EDITOR' || roleType === 'VIEWER') && (
                          <td>
                            <span className="text-sm text-gray-600">
                              {role.secondaryEntityType}: {role.secondaryEntityId}
                            </span>
                          </td>
                        )}
                        <td>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600">
                              {role.grants?.length || 0} grants
                            </span>
                            {role.assignmentType && (
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                role.assignmentType === 'GRANT' ? 'bg-blue-100 text-blue-800' :
                                role.assignmentType === 'ROLE' ? 'bg-green-100 text-green-800' :
                                role.assignmentType === 'GRANTS' ? 'bg-purple-100 text-purple-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {role.assignmentType}
                              </span>
                            )}
                          </div>
                        </td>
                        <td>
                          <div className="flex gap-1">
                            <button
                              onClick={() => setSelectedRoleForGrants(role)}
                              className={`${buttons.button} ${buttons.buttonSmall} ${buttons.buttonSecondary}`}
                              title="Gestisci Grants"
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

      {/* Form per creazione manuale ruoli */}
      {showCreateForm && (
        <CreateRoleForm
          itemTypeSetId={itemTypeSetId}
          onClose={() => setShowCreateForm(false)}
          onSuccess={() => {
            fetchRoles();
            setShowCreateForm(false);
          }}
        />
      )}

      {/* Modal per gestione grants */}
      {selectedRoleForGrants && (
        <RoleGrantManager
          roleId={selectedRoleForGrants.id}
          onClose={() => setSelectedRoleForGrants(null)}
        />
      )}
    </div>
  );
}
