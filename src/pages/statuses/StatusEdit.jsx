import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../api/api";

import { useAuth } from "../../context/AuthContext";

import layout from "../../styles/common/Layout.module.css";
import form from "../../styles/common/Forms.module.css";
import buttons from "../../styles/common/Buttons.module.css";
import alert from "../../styles/common/Alerts.module.css";

export default function StatusEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token, isAuthenticated, roles } = useAuth();

  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const hasRole = (name, scope = null) => {
    return roles.some((r) => r.name === name && (scope === null || r.scope === scope));
  };
  const isTenantAdmin = hasRole("ADMIN", "GLOBAL");
  const isProjectAdmin = hasRole("ADMIN", "PROJECT");

  useEffect(() => {
    if (!token) return;

    const fetchStatus = async () => {
      try {
        const response = await api.get(`/statuses/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setName(response.data.name || "");
      } catch (err) {
        setError(err.response?.data?.message || "Errore nel caricamento dello status");
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
  }, [id, token]);

  if (!isAuthenticated || (!isTenantAdmin && !isProjectAdmin)) {
    return <p className={alert.error}>Accesso negato</p>;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSaving(true);

    if (!name.trim()) {
      setError("Il nome è obbligatorio");
      setSaving(false);
      return;
    }

    try {
      await api.put(
        `/statuses/${id}`,
        { name },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      navigate(-1);
    } catch (err) {
      setError(err.response?.data?.message || "Errore nel salvataggio");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p className="list-loading">Caricamento status...</p>;
  }

  return (
    <div className={layout.container}>
      <h1 className={layout.title}>Modifica Status</h1>

      {error && <p className={alert.error}>{error}</p>}

      <form onSubmit={handleSubmit} className={form.form}>
        <div className={form.formGroup}>
          <label htmlFor="name">Nome</label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            disabled={saving}
            className={form.input}
          />
        </div>

        <div className={form.formGroup}>
          <button type="submit" className={buttons.button} disabled={saving}>
            {saving ? "Salvataggio in corso..." : "Salva"}
          </button>
          <button
            type="button"
            className={`${buttons.button} ${buttons.secondaryButton}`}
            onClick={() => navigate(-1)}
            disabled={saving}
            style={{ marginLeft: "0.5rem" }}
          >
            Annulla
          </button>
        </div>
      </form>
    </div>
  );
}
