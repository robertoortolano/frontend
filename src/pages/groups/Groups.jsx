import React, { useState, useEffect } from 'react';
import { Users, Plus, Edit, Trash2, X, Save } from 'lucide-react';
import groupService from '../../services/groupService';
import api from '../../api/api';

import layout from '../../styles/common/Layout.module.css';
import buttons from '../../styles/common/Buttons.module.css';
import alert from '../../styles/common/Alerts.module.css';
import form from '../../styles/common/Forms.module.css';
import table from '../../styles/common/Tables.module.css';

export default function Groups() {
  const [groups, setGroups] = useState([]);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    userIds: []
  });

  useEffect(() => {
    fetchGroups();
    fetchAvailableUsers();
  }, []);

  const fetchGroups = async () => {
    try {
      setLoading(true);
      const data = await groupService.getAll();
      setGroups(data);
    } catch (err) {
      setError('Errore nel caricamento dei gruppi');
      console.error('Error fetching groups:', err);
    } finally {
      setLoading(false);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      if (editingGroup) {
        await groupService.update(editingGroup.id, formData);
        setSuccess('Gruppo aggiornato con successo');
        resetForm();
        fetchGroups();
      } else {
        await groupService.create(formData);
        setSuccess('Gruppo creato con successo');
        resetForm();
        fetchGroups();
      }
    } catch (err) {
      // Estrai il messaggio di errore dal backend
      let errorMessage = 'Errore durante il salvataggio del gruppo';
      
      if (err.response?.data) {
        if (typeof err.response.data === 'string') {
          errorMessage = err.response.data;
        } else if (err.response.data.message) {
          errorMessage = err.response.data.message;
        }
      }
      
      setError(errorMessage);
      console.error('Error saving group:', err);
      // NON chiudere il form - rimane aperto per permettere la correzione
    }
  };

  const handleEdit = (group) => {
    setEditingGroup(group);
    setFormData({
      name: group.name,
      description: group.description || '',
      userIds: group.users ? group.users.map(u => u.id) : []
    });
    setShowForm(true);
    setError(null);
    setSuccess(null);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Sei sicuro di voler eliminare questo gruppo?')) {
      return;
    }

    setError(null);
    setSuccess(null);

    try {
      await groupService.delete(id);
      setSuccess('Gruppo eliminato con successo');
      fetchGroups();
    } catch (err) {
      // Estrai il messaggio di errore dal backend
      let errorMessage = 'Errore durante l\'eliminazione del gruppo';
      
      if (err.response?.data) {
        if (typeof err.response.data === 'string') {
          errorMessage = err.response.data;
        } else if (err.response.data.message) {
          errorMessage = err.response.data.message;
        }
      }
      
      setError(errorMessage);
      console.error('Error deleting group:', err);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      userIds: []
    });
    setEditingGroup(null);
    setShowForm(false);
  };

  const handleUserToggle = (userId) => {
    setFormData(prev => ({
      ...prev,
      userIds: prev.userIds.includes(userId)
        ? prev.userIds.filter(id => id !== userId)
        : [...prev.userIds, userId]
    }));
  };

  if (loading) {
    return <div className={layout.loading}>Caricamento gruppi...</div>;
  }

  return (
    <div className={layout.container}>
      <div className="flex items-center justify-between mb-6">
        <h1 className={layout.title}>Gestione Gruppi</h1>
        {!showForm && (
          <button
            onClick={() => {
              resetForm();
              setShowForm(true);
              setError(null);
              setSuccess(null);
            }}
            className={`${buttons.button} ${buttons.buttonPrimary}`}
          >
            <Plus size={20} />
            Nuovo Gruppo
          </button>
        )}
      </div>

      {error && (
        <div className={`${alert.error} mb-4`}>
          {error}
        </div>
      )}

      {success && (
        <div className={`${alert.success} mb-4`}>
          {success}
        </div>
      )}

      {showForm ? (
        <div className={layout.block}>
          <div className="flex items-center justify-between mb-4">
            <h2 className={layout.blockTitleBlue}>
              {editingGroup ? 'Modifica Gruppo' : 'Nuovo Gruppo'}
            </h2>
            <button
              onClick={resetForm}
              className={`${buttons.button} ${buttons.buttonSecondary}`}
            >
              <X size={18} />
              Annulla
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className={form.formGroup}>
              <label className={form.label}>Nome *</label>
              <input
                type="text"
                className={form.input}
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className={form.formGroup}>
              <label className={form.label}>Descrizione</label>
              <textarea
                className={form.textarea}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>

            <div className={form.formGroup}>
              <label className={form.label}>Utenti</label>
              <div style={{ 
                border: '1px solid #e5e7eb', 
                borderRadius: '0.5rem', 
                padding: '1rem',
                maxHeight: '300px',
                overflowY: 'auto',
                backgroundColor: 'white'
              }}>
                {availableUsers.length === 0 ? (
                  <p className="text-gray-500 text-sm">Nessun utente disponibile</p>
                ) : (
                  <div className="space-y-2">
                    {availableUsers.map(user => (
                      <label key={user.id} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
                        <input
                          type="checkbox"
                          checked={formData.userIds.includes(user.id)}
                          onChange={() => handleUserToggle(user.id)}
                          className="w-4 h-4"
                        />
                        <span className="text-sm">
                          {user.fullName || user.username}
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className={form.buttonGroup}>
              <button
                type="submit"
                className={`${buttons.button} ${buttons.buttonPrimary}`}
              >
                <Save size={18} />
                {editingGroup ? 'Aggiorna' : 'Crea'} Gruppo
              </button>
              <button
                type="button"
                onClick={resetForm}
                className={`${buttons.button} ${buttons.buttonSecondary}`}
              >
                <X size={18} />
                Annulla
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className={layout.block}>
          <h2 className={layout.blockTitleBlue}>Gruppi ({groups.length})</h2>
          
          {groups.length === 0 ? (
            <div className={alert.info}>
              <p>Nessun gruppo creato. Clicca su "Nuovo Gruppo" per iniziare.</p>
            </div>
          ) : (
            <table className={table.table}>
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Descrizione</th>
                  <th>Utenti</th>
                  <th>Azioni</th>
                </tr>
              </thead>
              <tbody>
                {groups.map(group => (
                  <tr key={group.id}>
                    <td>
                      <div className="flex items-center gap-2">
                        <Users size={16} className="text-blue-600" />
                        <span className="font-medium">{group.name}</span>
                      </div>
                    </td>
                    <td>
                      <span className="text-sm text-gray-600">
                        {group.description || '-'}
                      </span>
                    </td>
                    <td>
                      <span className="text-sm text-gray-600">
                        {group.users && group.users.length > 0 
                          ? `${group.users.length} utente${group.users.length !== 1 ? 'i' : ''}`
                          : 'Nessun utente'
                        }
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEdit(group)}
                          className={`${buttons.button} ${buttons.buttonSmall} ${buttons.buttonSecondary}`}
                          title="Modifica gruppo"
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(group.id)}
                          className={`${buttons.button} ${buttons.buttonSmall} ${buttons.buttonDanger}`}
                          title="Elimina gruppo"
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
      )}
    </div>
  );
}
