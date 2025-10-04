import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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
    scope: 'TENANT',
    defaultRole: false
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Check permissions - TEMPORANEAMENTE DISABILITATO PER DEBUG
  const canManageRoles = true; // roles?.some(role => role === 'ADMIN');

  useEffect(() => {
    if (!isAuthenticated || !canManageRoles) {
      navigate('/');
      return;
    }
    fetchRole();
  }, [isAuthenticated, canManageRoles, navigate, id]);

  const fetchRole = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/roles/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const role = response.data;
      setFormData({
        name: role.name,
        scope: role.scope,
        defaultRole: role.defaultRole
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
      setError(err.response?.data?.message || 'Errore durante l\'aggiornamento del ruolo');
      console.error('Error updating role:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    navigate('/tenant/roles');
  };

  if (loading) {
    return <div className={layout.loading}>Caricamento ruolo...</div>;
  }

  if (!canManageRoles) {
    return (
      <div className={layout.container}>
        <div className={alert.error}>
          <p>Non hai i permessi per gestire i ruoli.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={layout.container}>
      <h1 className={layout.title}>Modifica Ruolo</h1>

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
          <select
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            className={form.input}
            disabled={saving}
          >
            <option value="">Seleziona un ruolo</option>
            <option value="ADMIN">ADMIN</option>
            <option value="MANAGER">MANAGER</option>
            <option value="USER">USER</option>
            <option value="VIEWER">VIEWER</option>
            <option value="EDITOR">EDITOR</option>
            <option value="CONTRIBUTOR">CONTRIBUTOR</option>
            <option value="REVIEWER">REVIEWER</option>
            <option value="APPROVER">APPROVER</option>
          </select>
        </div>

        <div className={form.formGroup}>
          <label htmlFor="scope" className={form.label}>
            Scope *
          </label>
          <select
            id="scope"
            value={formData.scope}
            onChange={(e) => setFormData({ ...formData, scope: e.target.value })}
            required
            className={form.input}
            disabled={saving}
          >
            <option value="GLOBAL">GLOBAL</option>
            <option value="TENANT">TENANT</option>
            <option value="PROJECT">PROJECT</option>
          </select>
          <p className={form.helpText}>
            GLOBAL: Ruolo valido in tutto il sistema<br/>
            TENANT: Ruolo valido solo nel tenant corrente<br/>
            PROJECT: Ruolo valido solo nel progetto corrente
          </p>
        </div>

        <div className={form.formGroup}>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.defaultRole}
              onChange={(e) => setFormData({ ...formData, defaultRole: e.target.checked })}
              disabled={saving}
              className="rounded"
            />
            <span className={form.label}>Ruolo Predefinito</span>
          </label>
          <p className={form.helpText}>
            I ruoli predefiniti vengono assegnati automaticamente ai nuovi utenti
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
