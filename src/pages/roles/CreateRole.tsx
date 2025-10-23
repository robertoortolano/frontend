import { useState, useEffect, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/api";
import { useAuth } from "../../context/AuthContext";
import { RoleCreateDto } from "../../types/role.types";

import layout from "../../styles/common/Layout.module.css";
import form from "../../styles/common/Forms.module.css";
import buttons from "../../styles/common/Buttons.module.css";
import alert from "../../styles/common/Alerts.module.css";

export default function CreateRole() {
  const navigate = useNavigate();
  const auth = useAuth() as any;
  const token = auth?.token;
  const isAuthenticated = auth?.isAuthenticated;
  const roles = auth?.roles;

  const [formData, setFormData] = useState<RoleCreateDto>({
    name: "",
    description: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canManageRoles = roles?.some((role: any) => role.name === "ADMIN");

  useEffect(() => {

    if (!isAuthenticated) {
      navigate("/");
      return;
    }

    if (!canManageRoles) {
      navigate("/tenant");
      return;
    }
  }, [isAuthenticated, canManageRoles, navigate, roles]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await api.post("/roles", formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      navigate("/tenant/roles");
    } catch (err: any) {
      setError(err.response?.data?.message || "Errore durante la creazione del ruolo");
      console.error("Error creating role:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate("/tenant/roles");
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

  return (
    <div className={layout.container}>
      <h1 className={layout.title}>Crea Nuovo Ruolo</h1>
      <p className={layout.paragraphMuted}>
        Crea un nuovo ruolo personalizzato per il tenant. Il ruolo avrà automaticamente scope TENANT e non sarà un ruolo
        di default.
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
            disabled={loading}
            placeholder="Inserisci il nome del ruolo"
            maxLength={100}
          />
          <p className={form.helpText}>Il nome del ruolo deve essere unico all'interno del tenant</p>
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
            disabled={loading}
            placeholder="Inserisci una descrizione del ruolo (opzionale)"
            rows={3}
            maxLength={500}
          />
          <p className={form.helpText}>Descrizione opzionale del ruolo e delle sue funzionalità</p>
        </div>

        <div className="flex gap-4">
          <button type="submit" className={`${buttons.button} ${buttons.buttonPrimary}`} disabled={loading}>
            {loading ? "Creazione..." : "Crea Ruolo"}
          </button>
          <button
            type="button"
            onClick={handleCancel}
            className={`${buttons.button} ${buttons.buttonSecondary}`}
            disabled={loading}
          >
            Annulla
          </button>
        </div>
      </form>
    </div>
  );
}

