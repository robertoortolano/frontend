import React, { useState, useEffect } from 'react';
import { Eye, Edit, ChevronDown, ChevronRight, Shield } from 'lucide-react';
import api from '../api/api';
import RoleGrantManager from './RoleGrantManager';

import layout from '../styles/common/Layout.module.css';
import buttons from '../styles/common/Buttons.module.css';
import alert from '../styles/common/Alerts.module.css';
import utilities from '../styles/common/Utilities.module.css';
import table from '../styles/common/Tables.module.css';

export default function FieldStatusPairViewer({ itemTypeSetId }) {
  const [fieldStatusPairs, setFieldStatusPairs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedPairs, setExpandedPairs] = useState({});
  const [selectedRoleForGrants, setSelectedRoleForGrants] = useState(null);

  useEffect(() => {
    if (itemTypeSetId) {
      fetchFieldStatusPairs();
    }
  }, [itemTypeSetId]);

  const fetchFieldStatusPairs = async () => {
    try {
      setLoading(true);
      // Fetch EDITOR and VIEWER roles for this ItemTypeSet
      const [editorRoles, viewerRoles] = await Promise.all([
        api.get(`/itemtypeset-roles/itemtypeset/${itemTypeSetId}/type/EDITOR`),
        api.get(`/itemtypeset-roles/itemtypeset/${itemTypeSetId}/type/VIEWER`)
      ]);

      // Group roles by ItemTypeConfiguration
      const pairsMap = new Map();
      
      [...editorRoles.data, ...viewerRoles.data].forEach(role => {
        const key = `${role.relatedEntityId}_${role.secondaryEntityId}`;
        if (!pairsMap.has(key)) {
          pairsMap.set(key, {
            itemTypeConfigId: role.relatedEntityId,
            fieldConfigId: role.secondaryEntityId,
            fieldConfigName: role.name.split(' for ')[1]?.split(' in ')[0] || 'Unknown Field',
            statusName: role.name.split(' in ')[1] || 'Unknown Status',
            editors: [],
            viewers: []
          });
        }
        
        if (role.roleType === 'EDITOR') {
          pairsMap.get(key).editors.push(role);
        } else if (role.roleType === 'VIEWER') {
          pairsMap.get(key).viewers.push(role);
        }
      });

      setFieldStatusPairs(Array.from(pairsMap.values()));
    } catch (err) {
      setError('Errore nel caricamento delle coppie Field-Status');
      console.error('Error fetching field-status pairs:', err);
    } finally {
      setLoading(false);
    }
  };

  const togglePairExpansion = (pairKey) => {
    setExpandedPairs(prev => ({
      ...prev,
      [pairKey]: !prev[pairKey]
    }));
  };

  if (loading) {
    return <div className={layout.loading}>Caricamento coppie Field-Status...</div>;
  }

  if (error) {
    return <div className={alert.error}>{error}</div>;
  }

  if (fieldStatusPairs.length === 0) {
    return (
      <div className={alert.info}>
        <p>Nessuna coppia Field-Status configurata per questo ItemTypeSet.</p>
        <p className="mt-2">I ruoli EDITOR e VIEWER vengono creati automaticamente per ogni combinazione di Field e Status.</p>
      </div>
    );
  }

  return (
    <div className={layout.container}>
      <h2 className={layout.title}>Coppie Field-Status per Ruoli EDITOR/VIEWER</h2>
      <p className={layout.paragraphMuted}>
        Queste sono le combinazioni di Field Configuration e Workflow Status per cui sono stati creati ruoli specifici.
      </p>

      <div className="space-y-4 mt-6">
        {fieldStatusPairs.map((pair, index) => {
          const pairKey = `${pair.itemTypeConfigId}_${pair.fieldConfigId}`;
          const isExpanded = expandedPairs[pairKey];

          return (
            <div key={pairKey} className={layout.block}>
              <div className={layout.blockHeader}>
                <button
                  onClick={() => togglePairExpansion(pairKey)}
                  className="flex items-center justify-between w-full text-left"
                >
                  <div className="flex items-center gap-3">
                    <h3 className={layout.blockTitleBlue}>
                      {pair.fieldConfigName} in {pair.statusName}
                    </h3>
                    <div className="flex gap-2">
                      <span className="px-2 py-1 bg-indigo-100 text-indigo-800 rounded-full text-xs flex items-center gap-1">
                        <Edit size={12} />
                        {pair.editors.length} Editor{pair.editors.length !== 1 ? 'i' : ''}
                      </span>
                      <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs flex items-center gap-1">
                        <Eye size={12} />
                        {pair.viewers.length} Viewer{pair.viewers.length !== 1 ? 'i' : ''}
                      </span>
                    </div>
                  </div>
                  {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                </button>
              </div>

              {isExpanded && (
                <div className={utilities.mt4}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Editor Roles */}
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                        <Edit size={16} className="text-indigo-600" />
                        Ruoli Editor
                      </h4>
                      {pair.editors.length > 0 ? (
                        <div className="space-y-2">
                          {pair.editors.map((editor) => (
                            <div key={editor.id} className="p-3 bg-indigo-50 rounded-lg">
                                <div className="flex justify-between items-start">
                                  <div className="flex-1">
                                    <p className="font-medium text-sm">{editor.name}</p>
                                    <p className="text-xs text-gray-600">{editor.description}</p>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs text-gray-500">
                                      {editor.grants?.length || 0} grants
                                    </span>
                                    {editor.assignmentType && (
                                      <span className={`px-1 py-0.5 rounded-full text-xs font-medium ${
                                        editor.assignmentType === 'GRANT' ? 'bg-blue-100 text-blue-800' :
                                        editor.assignmentType === 'ROLE' ? 'bg-green-100 text-green-800' :
                                        editor.assignmentType === 'GRANTS' ? 'bg-purple-100 text-purple-800' :
                                        'bg-gray-100 text-gray-800'
                                      }`}>
                                        {editor.assignmentType}
                                      </span>
                                    )}
                                    <button
                                      onClick={() => setSelectedRoleForGrants(editor)}
                                      className={`${buttons.button} ${buttons.buttonSmall} ${buttons.buttonSecondary}`}
                                      title="Gestisci Assegnazioni"
                                    >
                                      <Shield size={12} />
                                    </button>
                                  </div>
                                </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">Nessun ruolo editor configurato</p>
                      )}
                    </div>

                    {/* Viewer Roles */}
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                        <Eye size={16} className="text-gray-600" />
                        Ruoli Viewer
                      </h4>
                      {pair.viewers.length > 0 ? (
                        <div className="space-y-2">
                          {pair.viewers.map((viewer) => (
                            <div key={viewer.id} className="p-3 bg-gray-50 rounded-lg">
                                <div className="flex justify-between items-start">
                                  <div className="flex-1">
                                    <p className="font-medium text-sm">{viewer.name}</p>
                                    <p className="text-xs text-gray-600">{viewer.description}</p>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs text-gray-500">
                                      {viewer.grants?.length || 0} grants
                                    </span>
                                    {viewer.assignmentType && (
                                      <span className={`px-1 py-0.5 rounded-full text-xs font-medium ${
                                        viewer.assignmentType === 'GRANT' ? 'bg-blue-100 text-blue-800' :
                                        viewer.assignmentType === 'ROLE' ? 'bg-green-100 text-green-800' :
                                        viewer.assignmentType === 'GRANTS' ? 'bg-purple-100 text-purple-800' :
                                        'bg-gray-100 text-gray-800'
                                      }`}>
                                        {viewer.assignmentType}
                                      </span>
                                    )}
                                    <button
                                      onClick={() => setSelectedRoleForGrants(viewer)}
                                      className={`${buttons.button} ${buttons.buttonSmall} ${buttons.buttonSecondary}`}
                                      title="Gestisci Assegnazioni"
                                    >
                                      <Shield size={12} />
                                    </button>
                                  </div>
                                </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">Nessun ruolo viewer configurato</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

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
