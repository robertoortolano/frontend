import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/api";

import WorkflowsPopup from "../../components/shared/WorkflowsPopup";

import { useAuth } from "../../context/AuthContext";

import layout from "../../styles/common/Layout.module.css";
import buttons from "../../styles/common/Buttons.module.css";
import form from "../../styles/common/Forms.module.css";
import alert from "../../styles/common/Alerts.module.css";
import table from "../../styles/common/Tables.module.css";

export default function Statuses() {
  const navigate = useNavigate();
  const { token, roles } = useAuth();

  const [statuses, setStatuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  const hasRole = (name, scope = null) => {
    return roles.some(r => r.name === name && (scope === null || r.scope === scope));
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
      } catch (err) {
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

  const handleSubmit = async (e) => {
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
    } catch (err) {
      console.error("Errore nella creazione", err);
      setError(err.response?.data?.message || "Errore nella creazione. Riprova.");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (id) => {
    navigate(`/tenant/statuses/${id}`);
  };

  const handleDelete = async (id) => {
    const confirmed = window.confirm("Sei sicuro di voler eliminare questo status?");
    if (!confirmed) return;

    try {
      await api.delete(`/statuses/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setStatuses((prev) => prev.filter((status) => status.id !== id));
    } catch (err) {
      console.error("Errore durante l'eliminazione", err);
      alert(err.response?.data?.message || "Errore durante l'eliminazione");
    }
  };

  let content;
  if (loading) {
    content = <p className="list-loading">Caricamento status...</p>;
  } else if (statuses.length === 0) {
    content = <p className="list-loading">Nessuno status trovato.</p>;
  } else {
    content = (
      <table className={table.table}>
        <thead>
          <tr>
            <th style={{ width: "60%" }}>Nome</th>
            <th style={{ width: "10%" }}>Workflow</th>
            <th style={{ width: "30%" }}></th>
          </tr>
        </thead>
        <tbody>
          {statuses.map((status) => {
            const usedInDefaultWorkflow = status.workflows?.some(w => w.defaultWorkflow);

            return (
              <tr key={status.id}>
                <td>{status.name}</td>
                <td>
                  <WorkflowsPopup workflows={status.workflows} />
                </td>
                <td style={{ display: "flex", gap: "0.5rem" }}>
                  <button
                    className={buttons.button}
                    onClick={() => handleEdit(status.id)}
                    disabled={usedInDefaultWorkflow || status.defaultStatus}
                    title={
                      usedInDefaultWorkflow || status.defaultStatus
                        ? "Modifica disabilitata: usato in un workflow di default"
                        : ""
                    }
                  >
                    ✎ Edit
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
                  >
                    Delete
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    );
  }

  return (
    <div className={layout.container}>
      <h1 className={layout.title}>Status</h1>

      <form onSubmit={handleSubmit} className={form.form}>
        <div className={form.formGroup}>
          <label className={form.label} htmlFor="name">Nome</label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className={form.input}
            disabled={saving}
          />
        </div>

        {error && <p className={alert.error}>{error}</p>}

        <button type="submit" disabled={saving} className={buttons.button}>
          {saving ? "Salvataggio in corso..." : "Crea nuovo status"}
        </button>
      </form>

      {content}
    </div>
  );
}
