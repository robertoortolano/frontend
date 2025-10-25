import { useEffect, useState, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/api";
import WorkflowsPopup from "../../components/shared/WorkflowsPopup";
import { useAuth } from "../../context/AuthContext";
import { StatusDetailDto } from "../../types/status.types";

import layout from "../../styles/common/Layout.module.css";
import buttons from "../../styles/common/Buttons.module.css";
import form from "../../styles/common/Forms.module.css";
import alert from "../../styles/common/Alerts.module.css";
import table from "../../styles/common/Tables.module.css";

export default function Statuses() {
  const navigate = useNavigate();
  const auth = useAuth() as any;
  const token = auth?.token;
  const roles = auth?.roles || [];

  const [statuses, setStatuses] = useState<StatusDetailDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const hasRole = (name: string, scope: string | null = null) => {
    return roles && Array.isArray(roles) && roles.some((r: any) => r.name === name && (scope === null || r.scope === scope));
  };
  const isTenantAdmin = hasRole("ADMIN", "TENANT");
  const isProjectAdmin = hasRole("ADMIN", "PROJECT");

  useEffect(() => {
    if (!token) return;

    const fetchStatuses = async () => {
      try {
        const response = await api.get("/statuses/details", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setStatuses(response.data);
      } catch (err: any) {
        console.error("Errore nel caricamento degli status", err);
        setError(err.response?.data?.message || "Errore nel caricamento degli status");
      } finally {
        setLoading(false);
      }
    };

    fetchStatuses();
  }, [token]);

  if (!isTenantAdmin && !isProjectAdmin) {
    return <p className={alert.error}>Accesso negato</p>;
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSaving(true);

    try {
      const response = await api.post(
        "/statuses",
        { name },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setStatuses((prev) => [...prev, response.data]);
      setName("");
    } catch (err: any) {
      console.error("Errore nella creazione", err);
      setError(err.response?.data?.message || "Errore nella creazione. Riprova.");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (id: number) => {
    navigate(`/tenant/statuses/${id}`);
  };

  const handleDelete = async (id: number) => {
    const confirmed = window.confirm("Sei sicuro di voler eliminare questo status?");
    if (!confirmed) return;

    try {
      await api.delete(`/statuses/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setStatuses((prev) => prev.filter((status) => status.id !== id));
    } catch (err: any) {
      console.error("Errore durante l'eliminazione", err);
      window.alert(err.response?.data?.message || "Errore durante l'eliminazione");
    }
  };

  let content;
  if (loading) {
    content = (
      <div className={alert.infoContainer}>
        <p className={alert.info}>Caricamento status...</p>
      </div>
    );
  } else if (statuses.length === 0) {
    content = (
      <div className={alert.infoContainer}>
        <p className={alert.info}>Nessuno status trovato.</p>
        <p className="mt-2 text-sm text-gray-600">Clicca su "Crea nuovo status" per iniziare.</p>
      </div>
    );
  } else {
    content = (
      <div className={layout.block}>
        <div className="overflow-x-auto">
          <table className={table.table}>
            <thead>
              <tr>
                <th>Nome</th>
                <th>Workflow</th>
                <th>Azioni</th>
              </tr>
            </thead>
            <tbody>
              {statuses.map((status) => {
                const usedInDefaultWorkflow = status.workflows?.some((w) => w.defaultWorkflow);

                return (
                  <tr key={status.id}>
                    <td>{status.name}</td>
                    <td>
                      <WorkflowsPopup workflows={status.workflows} />
                    </td>
                    <td>
                      <div className="flex gap-2">
                        <button
                          className={buttons.button}
                          onClick={() => handleEdit(status.id)}
                          disabled={usedInDefaultWorkflow || status.defaultStatus}
                          title={
                            usedInDefaultWorkflow || status.defaultStatus
                              ? "Modifica disabilitata: usato in un workflow di default"
                              : ""
                          }
                          style={{ padding: "0.25rem 0.5rem", fontSize: "0.75rem" }}
                        >
                          ✎ Modifica
                        </button>
                        <button
                          className={buttons.button}
                          onClick={() => handleDelete(status.id)}
                          disabled={usedInDefaultWorkflow || status.defaultStatus}
                          title={
                            usedInDefaultWorkflow || status.defaultStatus
                              ? "Cancellazione disabilitata: usato in un workflow di default"
                              : ""
                          }
                          style={{ padding: "0.25rem 0.5rem", fontSize: "0.75rem" }}
                        >
                          Elimina
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className={layout.container} style={{ maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header Section */}
      <div className={layout.headerSection}>
        <h1 className={layout.title}>Status</h1>
        <p className={layout.paragraphMuted}>
          Gestisci gli status disponibili nel sistema.
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className={alert.errorContainer}>
          <p className={alert.error}>{error}</p>
        </div>
      )}

      {/* Create Form Section */}
      <div className={layout.section}>
        <h2 className={layout.sectionTitle}>Crea Nuovo Status</h2>
        <form onSubmit={handleSubmit} className={form.form}>
          <div className={form.formGroup}>
            <label className={form.label} htmlFor="name">Nome *</label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className={form.input}
              disabled={saving}
              placeholder="Inserisci il nome dello status"
            />
            <p className={form.helpText}>
              Il nome dello status deve essere unico.
            </p>
          </div>

          <div className={layout.buttonRow}>
            <button type="submit" disabled={saving} className={buttons.button}>
              {saving ? "Salvataggio..." : "Crea Nuovo Status"}
            </button>
          </div>
        </form>
      </div>

      {/* List Section */}
      <div className={layout.section}>
        <h2 className={layout.sectionTitle}>Status Esistenti</h2>
        {content}
      </div>
    </div>
  );
}

