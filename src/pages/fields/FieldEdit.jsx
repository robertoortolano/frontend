import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../api/api";

import { useAuth } from "../../context/AuthContext";

import layout from "../../styles/common/Layout.module.css";
import buttons from "../../styles/common/Buttons.module.css";
import form from "../../styles/common/Forms.module.css";
import alert from "../../styles/common/Alerts.module.css";

export default function FieldEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token, isAuthenticated, roles } = useAuth();

  const [name, setName] = useState("");
  const [defaultField, setDefaultField] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const hasRole = (name, scope = null) => {
    return roles.some(r => r.name === name && (scope === null || r.scope === scope));
  };
  const isTenantAdmin = hasRole("ADMIN", "TENANT");
  const isProjectAdmin = hasRole("ADMIN", "PROJECT");

  // Carica field
  useEffect(() => {
    const fetchField = async () => {
      try {
        const response = await api.get(`/fields/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const field = response.data;
        setName(field.name);
        setDefaultField(field.defaultField);
      } catch (err) {
        console.error("Errore nel caricamento del campo", err);
        setError("Errore nel caricamento del campo");
      } finally {
        setLoading(false);
      }
    };

    if (token && id) {
      fetchField();
    }
  }, [token, id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSaving(true);

    try {
      await api.put(
        `/fields/${id}`,
        { name }, // defaultField non modificabile
        { headers: { Authorization: `Bearer ${token}` } }
      );
      navigate("/tenant/fields");
    } catch (err) {
      console.error("Errore nel salvataggio", err);
      setError(err.response?.data?.message || "Errore durante il salvataggio");
    } finally {
      setSaving(false);
    }
  };

  if (!isAuthenticated || (!isTenantAdmin && (!isProjectContext || !isProjectAdmin))) {
    return <p className={alert.error}>Accesso negato</p>;
  }

  if (loading) {
    return <p className="list-loading">Caricamento in corso...</p>;
  }

  return (
    <div className={layout.container}>
      <h1 className={layout.title}>Modifica Campo</h1>

      <form onSubmit={handleSubmit}>
        <div className={form.formGroup}>
          <label className={form.label} htmlFor="name">Nome</label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className={form.input}
            disabled={saving || defaultField}
          />
        </div>

        {error && <p className={alert.error}>{error}</p>}

        <div className={buttons.buttonRow}>
          <button
            type="submit"
            disabled={saving || defaultField}
            className={buttons.button}
          >
            {saving ? "Saving..." : "Save"}
          </button>
          <button
            type="button"
            onClick={() => navigate("/tenant/fields")}
            className={buttons.button}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
