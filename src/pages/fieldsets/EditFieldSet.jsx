import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import api from "../../api/api";

import layout from "../../styles/common/Layout.module.css";
import form from "../../styles/common/Forms.module.css";
import buttons from "../../styles/common/Buttons.module.css";
import alert from "../../styles/common/Alerts.module.css";

export default function EditFieldSet() {
  const { id } = useParams(); // id del field set
  const navigate = useNavigate();
  const { token, isAuthenticated, roles } = useAuth();

  const [fieldSet, setFieldSet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const hasRole = (name, scope = null) =>
    roles.some((r) => r.name === name && (scope === null || r.scope === scope));
  const isTenantAdmin = hasRole("ADMIN", "GLOBAL");
  const isProjectAdmin = hasRole("ADMIN", "PROJECT");

  const [allConfigurations, setAllConfigurations] = useState([]);
  const [selectedConfigId, setSelectedConfigId] = useState("");

  // Ottieni configurazioni non già usate nel fieldSet
  const getAvailableConfigurations = () => {
    if (!fieldSet?.fieldSetEntries || !allConfigurations) return [];

    const usedIds = fieldSet.fieldSetEntries.map((e) => e.fieldConfiguration.id);
    return allConfigurations.filter((c) => !usedIds.includes(c.id));
  };

  const moveEntryUp = (index) => {
    if (index === 0) return;
    const entries = [...fieldSet.fieldSetEntries];
    [entries[index - 1], entries[index]] = [entries[index], entries[index - 1]];
    setFieldSet((prev) => ({
      ...prev,
      fieldSetEntries: entries.map((entry, i) => ({ ...entry, orderIndex: i })),
    }));
  };

  const moveEntryDown = (index) => {
    if (index === fieldSet.fieldSetEntries.length - 1) return;
    const entries = [...fieldSet.fieldSetEntries];
    [entries[index], entries[index + 1]] = [entries[index + 1], entries[index]];
    setFieldSet((prev) => ({
      ...prev,
      fieldSetEntries: entries.map((entry, i) => ({ ...entry, orderIndex: i })),
    }));
  };


  useEffect(() => {
    if (!token || !id) return;

    const fetchFieldSet = async () => {
      try {
        const res = await api.get(`/field-sets/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setFieldSet(res.data);
      } catch (e) {
        setError(e.message || "Errore nel caricamento del Field Set");
      } finally {
        setLoading(false);
      }
    };

    const fetchAvailableConfigurations = async () => {
      try {
        const res = await api.get("/fieldconfigurations", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setAllConfigurations(res.data);
      } catch (e) {
        console.error("Errore nel caricamento delle configurazioni:", e);
      }
    };

    fetchFieldSet();
    fetchAvailableConfigurations();
  }, [id, token]);

  // Gestione input nome e descrizione
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFieldSet((prev) => ({ ...prev, [name]: value }));
  };

  // Aggiungi una configurazione selezionata creando un nuovo fieldSetEntry con valori di default
  const handleAddSelectedConfig = () => {
    if (!selectedConfigId) return;

    const selectedConfig = allConfigurations.find(
      (c) => c.id === parseInt(selectedConfigId)
    );
    if (!selectedConfig) return;

    const newEntry = {
      id: null, // nuovo, quindi id null o da backend dopo salvataggio
      orderIndex: fieldSet.fieldSetEntries.length,
      fieldConfiguration: selectedConfig,
    };

    setFieldSet((prev) => ({
      ...prev,
      fieldSetEntries: [...prev.fieldSetEntries, newEntry],
    }));

    setSelectedConfigId("");
  };

  // Rimuovi un entry dal fieldSet
  const handleRemoveConfig = (entryId) => {
    const updatedEntries = fieldSet.fieldSetEntries.filter(
      (entry) => entry.id !== entryId
    );
    setFieldSet((prev) => ({
      ...prev,
      fieldSetEntries: updatedEntries,
    }));
  };

  // Salva le modifiche
  const handleSave = async () => {
    if (!fieldSet.name || fieldSet.name.trim() === "") {
      setError("Il nome è obbligatorio.");
      return;
    }
    if (!fieldSet.fieldSetEntries || fieldSet.fieldSetEntries.length === 0) {
      setError("Devi aggiungere almeno una configurazione.");
      return;
    }

    // Mappa il payload in modo corretto per backend
    const payload = {
      name: fieldSet.name,
      description: fieldSet.description,
      // Mappa fieldSetEntries in DTO accettato (es. array di FieldSetEntryCreateDto)
      entries: fieldSet.fieldSetEntries.map((entry, index) => ({
        fieldConfigurationId: entry.fieldConfiguration.id,
        orderIndex: index
      })),
    };

    try {
      await api.put(`/field-sets/${id}`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      navigate("/tenant/field-sets");
    } catch (e) {
      setError(e.message || "Errore nel salvataggio");
    }
  };

  if (!isAuthenticated || !isTenantAdmin) {
    return <p className={alert.error}>Accesso negato</p>;
  }

  if (loading) return <p className={layout.loading}>Caricamento...</p>;
  if (error) return <p className={alert.error}>{error}</p>;
  if (!fieldSet) return null;

  return (
    <div className={layout.container}>
      <h1 className={layout.title}>Modifica Field Set</h1>

      <div className={form.formGroup}>
        <label htmlFor="name" className={form.label}>
          Nome
        </label>
        <input
          id="name"
          type="text"
          name="name"
          value={fieldSet.name || ""}
          onChange={handleChange}
          className={form.input}
        />
      </div>

      <div className={form.formGroup}>
        <label htmlFor="description" className={form.label}>
          Descrizione
        </label>
        <textarea
          id="description"
          name="description"
          value={fieldSet.description || ""}
          onChange={handleChange}
          className={form.textarea}
        />
      </div>

      <div className={form.formGroup}>
        <h2 className={layout.subtitle}>Configurazioni</h2>
        {fieldSet.fieldSetEntries.length === 0 && (
          <p className={form.infoText}>Nessuna configurazione aggiunta.</p>
        )}
        {[...fieldSet.fieldSetEntries]
          .sort((a, b) => a.orderIndex - b.orderIndex)
          .map((entry, idx) => {
          const config = entry.fieldConfiguration;
          return (
            <div key={entry.id || config.id} className={form.subGroup}>
              <p><strong>Name:</strong> {config.name || "-"}</p>
              <p><strong>Campo:</strong> {config.fieldName || "(nuovo campo)"}</p>
              <p><strong>Tipo:</strong> {config.fieldType?.displayName || config.fieldType}</p>

              <div className={layout.inlineButtons}>
                <button
                  type="button"
                  className={`${buttons.buttonSmall} ${buttons.button}`}
                  onClick={() => moveEntryUp(idx)}
                  disabled={idx === 0}
                >
                  ↑
                </button>
                <button
                  type="button"
                  className={`${buttons.buttonSmall} ${buttons.button}`}
                  onClick={() => moveEntryDown(idx)}
                  disabled={idx === fieldSet.fieldSetEntries.length - 1}
                >
                  ↓
                </button>
                <button
                  type="button"
                  className={`${buttons.buttonSmall} ${buttons.button}`}
                  onClick={() => handleRemoveConfig(entry.id)}
                  disabled={fieldSet.fieldSetEntries.length === 1}
                >
                  Delete
                </button>
              </div>
            </div>

          );
        })}
      </div>

      <div className={form.formGroup}>
        <h2 className={layout.subtitle}>Aggiungi Configurazione</h2>

        {getAvailableConfigurations().length > 0 ? (
          <div className={form.inlineGroup}>
            <select
              className={form.select}
              value={selectedConfigId}
              onChange={(e) => {
                setError(null);
                setSelectedConfigId(e.target.value);
              }}
            >
              <option value="">-- Seleziona una configurazione --</option>
              {getAvailableConfigurations().map((config) => (
                <option key={config.id} value={config.id}>
                  {config.name || "-"} - {config.fieldName} ({config.fieldType?.displayName || config.fieldType})
                </option>
              ))}
            </select>

            <button
              type="button"
              className={buttons.buttonSmall}
              onClick={handleAddSelectedConfig}
              disabled={!selectedConfigId}
            >
              Aggiungi
            </button>
          </div>
        ) : (
          <p className={form.infoText}>Nessuna configurazione disponibile da aggiungere.</p>
        )}
      </div>

      <div className={layout.buttonRow}>
        <button
          className={buttons.button}
          onClick={handleSave}
          disabled={!fieldSet.fieldSetEntries || fieldSet.fieldSetEntries.length === 0}
        >
          Save
        </button>
        <button
          className={`${buttons.button} ${buttons.buttonSecondary}`}
          onClick={() => navigate("/tenant/field-sets")}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
