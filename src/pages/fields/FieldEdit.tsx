import { useEffect, useState, FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../api/api";
import { useAuth } from "../../context/AuthContext";

import layout from "../../styles/common/Layout.module.css";
import buttons from "../../styles/common/Buttons.module.css";
import form from "../../styles/common/Forms.module.css";
import alert from "../../styles/common/Alerts.module.css";

export default function FieldEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const auth = useAuth() as any;
  const token = auth?.token;
  const isAuthenticated = auth?.isAuthenticated;
  const roles = auth?.roles || [];

  const [name, setName] = useState("");
  const [defaultField, setDefaultField] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasRole = (name: string, scope: string | null = null) => {
    return roles && Array.isArray(roles) && roles.some((r: any) => r.name === name && (scope === null || r.scope === scope));
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
      } catch (err: any) {
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

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSaving(true);

    try {
      await api.put(
        `/fields/${id}`,
        { name },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      navigate("/tenant/fields");
    } catch (err: any) {
      console.error("Errore nel salvataggio", err);
      setError(err.response?.data?.message || "Errore durante il salvataggio");
    } finally {
      setSaving(false);
    }
  };

  if (!isAuthenticated || (!isTenantAdmin && !isProjectAdmin)) {
    return <p className={alert.error}>Accesso negato</p>;
  }

  if (loading) {
    return <p className="list-loading">Caricamento in corso...</p>;
  }

  return (
    <div className={layout.container} style={{ maxWidth: '800px', margin: '0 auto' }}>
      {/* Header Section */}
      <div className={layout.headerSection}>
        <h1 className={layout.title}>Modifica Campo</h1>
        <p className={layout.paragraphMuted}>
          Modifica le informazioni del campo.
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
            <label className={form.label} htmlFor="name">Nome *</label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className={form.input}
              disabled={saving || defaultField}
              placeholder="Inserisci il nome del campo"
            />
            <p className={form.helpText}>
              Il nome del campo deve essere unico.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className={layout.buttonRow}>
          <button
            type="submit"
            disabled={saving || defaultField}
            className={buttons.button}
          >
            {saving ? "Salvataggio..." : "Salva Modifiche"}
          </button>
          <button
            type="button"
            onClick={() => navigate("/tenant/fields")}
            className={buttons.button}
          >
            Annulla
          </button>
        </div>
      </form>
    </div>
  );
}

