import { useEffect, useState, FormEvent } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../api/api";
import { useAuth } from "../../context/AuthContext";

import layout from "../../styles/common/Layout.module.css";
import form from "../../styles/common/Forms.module.css";
import buttons from "../../styles/common/Buttons.module.css";
import alert from "../../styles/common/Alerts.module.css";

export default function StatusEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const auth = useAuth() as any;
  const token = auth?.token;
  const isAuthenticated = auth?.isAuthenticated;
  const roles = auth?.roles || [];

  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasRole = (name: string, scope: string | null = null) => {
    return roles && Array.isArray(roles) && roles.some((r: any) => r.name === name && (scope === null || r.scope === scope));
  };
  const isTenantAdmin = hasRole("ADMIN", "TENANT");
  const isProjectAdmin = hasRole("ADMIN", "PROJECT");

  useEffect(() => {
    if (!token) return;

    const fetchStatus = async () => {
      try {
        const response = await api.get(`/statuses/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setName(response.data.name || "");
      } catch (err: any) {
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

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
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
    } catch (err: any) {
      setError(err.response?.data?.message || "Errore nel salvataggio");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className={layout.container} style={{ maxWidth: '800px', margin: '0 auto' }}>
        <div className={alert.infoContainer}>
          <p className={alert.info}>Caricamento status...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={layout.container} style={{ maxWidth: '800px', margin: '0 auto' }}>
      {/* Header Section */}
      <div className={layout.headerSection}>
        <h1 className={layout.title}>Modifica Status</h1>
        <p className={layout.paragraphMuted}>
          Modifica le informazioni dello status.
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className={alert.errorContainer}>
          <p className={alert.error}>{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className={form.form}>
        {/* Basic Information Section */}
        <div className={layout.section}>
          <h2 className={layout.sectionTitle}>Informazioni Base</h2>
          <div className={form.formGroup}>
            <label htmlFor="name" className={form.label}>Nome *</label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={saving}
              className={form.input}
              placeholder="Inserisci il nome dello status"
            />
            <p className={form.helpText}>
              Il nome dello status deve essere unico.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className={layout.buttonRow}>
          <button type="submit" className={buttons.button} disabled={saving}>
            {saving ? "Salvataggio..." : "Salva Modifiche"}
          </button>
          <button
            type="button"
            className={buttons.button}
            onClick={() => navigate(-1)}
            disabled={saving}
          >
            Annulla
          </button>
        </div>
      </form>
    </div>
  );
}

