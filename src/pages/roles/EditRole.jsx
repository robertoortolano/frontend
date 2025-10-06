import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/api';
import { useAuth } from '../../context/AuthContext';

import layout from '../../styles/common/Layout.module.css';
import form from '../../styles/common/Forms.module.css';
import buttons from '../../styles/common/Buttons.module.css';
import alert from '../../styles/common/Alerts.module.css';

export default function EditRole() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token, isAuthenticated, roles } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Check permissions - TEMPORANEAMENTE DISABILITATO PER DEBUG
  const canManageRoles = true; // roles?.some(role => role === 'ADMIN');

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/');
      return;
    }
    
    if (!canManageRoles) {
      navigate('/tenant');
      return;
    }
    
    fetchRole();
  }, [isAuthenticated, canManageRoles, navigate, roles, id]);

  const fetchRole = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/roles/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const role = response.data;
      setFormData({
        name: role.name,
        description: role.description || ''
      });
    } catch (err) {
      setError('Errore nel caricamento del ruolo');
      console.error('Error fetching role:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      await api.put(`/roles/${id}`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      navigate('/tenant/roles');
    } catch (err) {
      setError(err.response?.data?.message || 'Errore durante la modifica del ruolo');
      console.error('Error updating role:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    navigate('/tenant/roles');
  };

  if (!canManageRoles) {
    return (
      <div className={layout.container}>
        <div className={alert.error}>
          <p>Non hai i permessi per gestire i ruoli.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return <div className={layout.loading}>Caricamento ruolo...</div>;
  }

  return (
    <div className={layout.container}>
      <h1 className={layout.title}>Modifica Ruolo</h1>
      <p className={layout.paragraphMuted}>
        Modifica un ruolo personalizzato del tenant. Puoi modificare solo nome e descrizione.
      </p>

      {error && (
        <div className={`${alert.error} mb-4`}>
          <p>{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="mb-8">
        <div className={form.formGroup}>
          <label htmlFor="name" className={form.label}>
            Nome Ruolo *
          </label>
          <input
            type="text"
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            className={form.input}
            disabled={saving}
            placeholder="Inserisci il nome del ruolo"
            maxLength={100}
          />
          <p className={form.helpText}>
            Il nome del ruolo deve essere unico all'interno del tenant
          </p>
        </div>

        <div className={form.formGroup}>
          <label htmlFor="description" className={form.label}>
            Descrizione
          </label>
          <textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className={form.input}
            disabled={saving}
            placeholder="Inserisci una descrizione del ruolo (opzionale)"
            rows={3}
            maxLength={500}
          />
          <p className={form.helpText}>
            Descrizione opzionale del ruolo e delle sue funzionalità
          </p>
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            className={`${buttons.button} ${buttons.buttonPrimary}`}
            disabled={saving}
          >
            {saving ? 'Salvataggio...' : 'Salva Modifiche'}
          </button>
          <button
            type="button"
            onClick={handleCancel}
            className={`${buttons.button} ${buttons.buttonSecondary}`}
            disabled={saving}
          >
            Annulla
          </button>
        </div>
      </form>
    </div>
  );
}

